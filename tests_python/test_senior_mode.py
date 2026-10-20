from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import threading
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from prompt_builder_compat import PromptBuilderCompatibilityError, load_execution_plan
from senior_queue import SeniorCoordinator
from senior_scheduler import ResourceClaims, SeniorJob, SeniorPlanError, SeniorScheduler
from senior_state import SeniorStateError, SeniorStateStore
from senior_worker import (
    SeniorWorkerResultError,
    run_managed_command,
    validate_worker_heartbeat,
    validate_worker_result,
    write_worker_heartbeat,
)


def claims(path: str, *, resource: str | None = None) -> ResourceClaims:
    payload: dict[str, object] = {
        "strategy": "resource-claims",
        "isolation": "dedicated-worktree",
        "write_paths": [path],
    }
    if resource:
        payload["exclusive_resources"] = [resource]
    return ResourceClaims.from_mapping(payload)


def job(
    number: int,
    name: str,
    phase: str,
    path: str,
    *,
    prerequisites: tuple[str, ...] = (),
    resource: str | None = None,
) -> SeniorJob:
    return SeniorJob(
        job_id=f"{name}:{phase}",
        pack=name,
        phase=phase,
        sequence=number,
        prerequisites=prerequisites,
        claims=claims(path, resource=resource),
    )


class SeniorSchedulerTests(unittest.TestCase):
    def test_four_disjoint_proposes_run_in_one_cohort(self) -> None:
        jobs = [job(index, f"pack-{index}", "propose", f"openspec/changes/c{index}/**") for index in range(1, 5)]
        scheduler = SeniorScheduler(jobs, phase_order=("propose",))

        self.assertEqual(len(scheduler.ready_batch({}, max_workers=4)), 4)

    def test_overlapping_paths_and_resources_never_share_a_cohort(self) -> None:
        jobs = [
            job(1, "a", "apply", "apps/api/**"),
            job(2, "b", "apply", "apps/api/src/**"),
            job(3, "c", "apply", "apps/web/**", resource="postgres-migrations"),
            job(4, "d", "apply", "apps/worker/**", resource="postgres-migrations"),
        ]
        selected = SeniorScheduler(jobs, phase_order=("apply",)).ready_batch({}, max_workers=4)

        self.assertEqual([item.job_id for item in selected], ["a:apply", "c:apply"])

    def test_missing_claims_fail_closed_to_serial(self) -> None:
        jobs = [
            SeniorJob(job_id="a:apply", pack="a", phase="apply", sequence=1),
            job(2, "b", "apply", "apps/b/**"),
        ]

        self.assertEqual(
            [item.job_id for item in SeniorScheduler(jobs, phase_order=("apply",)).ready_batch({}, max_workers=4)],
            ["a:apply"],
        )

    def test_workers_one_preserves_strict_prompt_by_prompt_order(self) -> None:
        jobs = [
            job(1, "a", "propose", "openspec/changes/a/**"),
            job(2, "b", "propose", "openspec/changes/b/**"),
            job(3, "c", "propose", "openspec/changes/c/**"),
        ]
        scheduler = SeniorScheduler(jobs, phase_order=("propose",))

        self.assertEqual(
            [item.job_id for item in scheduler.ready_batch({}, max_workers=1)],
            ["a:propose"],
        )

    def test_worker_limit_counts_jobs_already_running(self) -> None:
        jobs = [
            job(1, "a", "propose", "openspec/changes/a/**"),
            job(2, "b", "propose", "openspec/changes/b/**"),
        ]
        scheduler = SeniorScheduler(jobs, phase_order=("propose",))

        self.assertEqual(scheduler.ready_batch({"a:propose": "running"}, max_workers=1), ())
        self.assertEqual(
            [
                item.job_id
                for item in scheduler.ready_batch({"a:propose": "running"}, max_workers=2)
            ],
            ["b:propose"],
        )

    def test_phase_barrier_requires_every_propose_to_finish(self) -> None:
        jobs = [
            job(1, "a", "propose", "openspec/changes/a/**"),
            job(2, "b", "propose", "openspec/changes/b/**"),
            job(3, "a", "apply", "apps/a/**", prerequisites=("a:propose",)),
            job(4, "b", "apply", "apps/b/**", prerequisites=("b:propose",)),
        ]
        scheduler = SeniorScheduler(jobs, phase_order=("propose", "apply"))

        statuses = {"a:propose": "done", "b:propose": "failed"}
        self.assertEqual(scheduler.ready_batch(statuses, max_workers=4), ())
        statuses["b:propose"] = "done"
        self.assertEqual(
            [item.job_id for item in scheduler.ready_batch(statuses, max_workers=4)],
            ["a:apply", "b:apply"],
        )

    def test_invalid_or_overbroad_claims_are_rejected(self) -> None:
        for invalid in ("../secret", "C:/absolute", "/absolute", "**"):
            with self.subTest(invalid=invalid):
                with self.assertRaises(SeniorPlanError):
                    claims(invalid)


class SeniorStateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.jobs = (
            job(1, "a", "propose", "openspec/changes/a/**"),
            job(2, "b", "propose", "openspec/changes/b/**"),
        )

    def tearDown(self) -> None:
        self.temp.cleanup()

    def store(self) -> SeniorStateStore:
        store = SeniorStateStore(self.root, workflow_id="full-project", plan_fingerprint="a" * 64)
        store.reconcile(self.jobs)
        return store

    def test_restart_preserves_completed_jobs_and_attempt_numbers(self) -> None:
        store = self.store()
        [lease] = store.lease(["a:propose"], ttl_seconds=30)
        store.record_result(
            "a:propose",
            token=lease["token"],
            result={"status": "PASS", "result_commit": "1" * 40, "lease_token": lease["token"]},
        )
        store.mark_validated("a:propose")
        store.mark_done("a:propose", integrated_commit="2" * 40)

        resumed = self.store()
        self.assertEqual(resumed.statuses(), {"a:propose": "done", "b:propose": "pending"})
        self.assertNotIn("lease_token", resumed.jobs["a:propose"]["result"])
        [second] = resumed.lease(["b:propose"], ttl_seconds=30)
        self.assertEqual(second["attempt_id"], "attempt-0001")

    def test_expired_lease_is_recovered_but_live_lease_is_not(self) -> None:
        store = self.store()
        leases = store.lease(["a:propose", "b:propose"], ttl_seconds=30)
        expiry = datetime.now(timezone.utc) + timedelta(seconds=31)

        self.assertEqual(set(store.recover_expired(now=expiry)), {"a:propose", "b:propose"})
        self.assertEqual(store.statuses(), {"a:propose": "pending", "b:propose": "pending"})
        with self.assertRaises(SeniorStateError):
            store.record_result("a:propose", token=leases[0]["token"], result={"status": "PASS"})

    def test_retry_only_requeues_the_failed_job(self) -> None:
        store = self.store()
        leases = store.lease(["a:propose", "b:propose"], ttl_seconds=30)
        store.record_result("a:propose", token=leases[0]["token"], result={"status": "FAILED", "error": "boom"})
        store.record_result("b:propose", token=leases[1]["token"], result={"status": "PASS", "result_commit": "1" * 40})

        store.retry("a:propose")
        self.assertEqual(store.statuses(), {"a:propose": "pending", "b:propose": "produced"})

    def test_stalled_job_observes_grace_and_retry_limit(self) -> None:
        store = self.store()
        [lease] = store.lease(["a:propose"], ttl_seconds=30)
        stalled_at = datetime.now(timezone.utc)
        store.mark_stalled(
            "a:propose",
            token=lease["token"],
            reason="heartbeat timeout",
            now=stalled_at,
        )

        early = store.recover_stalled(
            grace_seconds=30,
            max_attempts=2,
            now=stalled_at + timedelta(seconds=29),
        )
        self.assertEqual(early, {"retried": (), "exhausted": ()})
        recovered = store.recover_stalled(
            grace_seconds=30,
            max_attempts=2,
            now=stalled_at + timedelta(seconds=30),
        )
        self.assertEqual(recovered["retried"], ("a:propose",))

        [second] = store.lease(["a:propose"], ttl_seconds=30)
        store.mark_stalled(
            "a:propose",
            token=second["token"],
            reason="heartbeat timeout",
            now=stalled_at,
        )
        exhausted = store.recover_stalled(
            grace_seconds=0,
            max_attempts=2,
            now=stalled_at,
        )
        self.assertEqual(exhausted["exhausted"], ("a:propose",))
        self.assertEqual(store.statuses()["a:propose"], "failed")

    def test_changed_plan_never_silently_reuses_history(self) -> None:
        self.store()
        with self.assertRaisesRegex(SeniorStateError, "execution plan changed"):
            SeniorStateStore(self.root, workflow_id="full-project", plan_fingerprint="b" * 64)

    def test_preflight_is_pinned_to_plan_and_base_sha(self) -> None:
        store = self.store()
        store.record_preflight(
            base_sha="1" * 40,
            command_sha256="2" * 64,
            passed=True,
            returncode=0,
        )

        self.assertTrue(store.preflight_ready(base_sha="1" * 40))
        self.assertFalse(store.preflight_ready(base_sha="3" * 40))


class SeniorWorkerTests(unittest.TestCase):
    def test_heartbeat_contract_and_managed_command(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            request_path = root / "request.json"
            heartbeat_path = root / "heartbeat.json"
            request = {
                "schema_version": 1,
                "job_id": "a:apply",
                "attempt_id": "attempt-0001",
                "lease_token": "lease",
                "project_root": str(root),
                "heartbeat_file": str(heartbeat_path),
                "cancel_file": str(root / "cancel.json"),
            }
            request_path.write_text(json.dumps(request), encoding="utf-8")

            write_worker_heartbeat(
                request_path,
                status="running",
                current_command="unit tests",
                processes=({"pid": 123, "kind": "foreground"},),
            )
            heartbeat = validate_worker_heartbeat(
                heartbeat_path,
                job_id="a:apply",
                attempt_id="attempt-0001",
                lease_token="lease",
            )
            self.assertEqual(heartbeat["current_command"], "unit tests")

            returncode = run_managed_command(
                request_path,
                [sys.executable, "-c", "raise SystemExit(0)"],
                heartbeat_seconds=1,
                timeout_seconds=5,
                cancel_grace_seconds=1,
            )
            self.assertEqual(returncode, 0)
            completed = json.loads(heartbeat_path.read_text(encoding="utf-8"))
            self.assertEqual(completed["status"], "completed")

    def test_managed_command_honors_supervisor_cancellation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            request_path = root / "request.json"
            cancel_path = root / "cancel.json"
            request_path.write_text(
                json.dumps(
                    {
                        "schema_version": 1,
                        "job_id": "a:apply",
                        "attempt_id": "attempt-0001",
                        "lease_token": "lease",
                        "project_root": str(root),
                        "heartbeat_file": str(root / "heartbeat.json"),
                        "cancel_file": str(cancel_path),
                    }
                ),
                encoding="utf-8",
            )
            timer = threading.Timer(
                0.2,
                lambda: cancel_path.write_text("{}\n", encoding="utf-8"),
            )
            timer.start()
            try:
                returncode = run_managed_command(
                    request_path,
                    [sys.executable, "-c", "import time; time.sleep(30)"],
                    heartbeat_seconds=1,
                    timeout_seconds=10,
                    cancel_grace_seconds=1,
                )
            finally:
                timer.cancel()
            self.assertEqual(returncode, 125)

    def test_result_requires_current_lease_and_claimed_changes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            result = Path(directory) / "result.json"
            payload = {
                "schema_version": 1,
                "job_id": "a:apply",
                "attempt_id": "attempt-0001",
                "lease_token": "lease",
                "base_sha": "a" * 40,
                "prompt_sha256": "b" * 64,
                "lock_sha256": "c" * 64,
                "status": "PASS",
                "result_commit": "d" * 40,
                "changed_files": ["apps/a/src/main.ts"],
                "checks": [{"command": "pnpm test", "exit_code": 0}],
            }
            result.write_text(json.dumps(payload), encoding="utf-8")

            report = validate_worker_result(
                result,
                job_id="a:apply",
                attempt_id="attempt-0001",
                lease_token="lease",
                base_sha="a" * 40,
                prompt_sha256="b" * 64,
                lock_sha256="c" * 64,
                claims=claims("apps/a/**"),
            )
            self.assertEqual(report["status"], "PASS")

            payload["changed_files"] = ["apps/b/escape.ts"]
            result.write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaisesRegex(SeniorWorkerResultError, "outside write claims"):
                validate_worker_result(
                    result,
                    job_id="a:apply",
                    attempt_id="attempt-0001",
                    lease_token="lease",
                    base_sha="a" * 40,
                    prompt_sha256="b" * 64,
                    lock_sha256="c" * 64,
                    claims=claims("apps/a/**"),
                )

            payload["changed_files"] = ["apps/a/src/main.js"]
            result.write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaisesRegex(SeniorWorkerResultError, "outside write claims"):
                validate_worker_result(
                    result,
                    job_id="a:apply",
                    attempt_id="attempt-0001",
                    lease_token="lease",
                    base_sha="a" * 40,
                    prompt_sha256="b" * 64,
                    lock_sha256="c" * 64,
                    claims=claims("apps/a/src/*.ts"),
                )


class SeniorPlanCompatibilityTests(unittest.TestCase):
    def _write_v3_plan(self, root: Path) -> Path:
        prompts = root / "generated" / "prompts" / "full-project"
        prompts.mkdir(parents=True)
        prompt = prompts / "0001-a.propose.md"
        lock = prompts / "0001-a.propose.lock.json"
        prompt.write_text("prompt", encoding="utf-8")
        lock.write_text("{}", encoding="utf-8")
        plan = {
            "schema_version": 3,
            "plan_id": "full-project",
            "phases": ["propose"],
            "selection": {"mode": "enabled-packs", "source": None, "sha256": None},
            "steps": [
                {
                    "sequence": 1,
                    "dependency_level": 0,
                    "pack": "a",
                    "selection_reason": "enabled",
                    "phase": "propose",
                    "depends_on": [],
                    "depends_on_previous_phase_step": None,
                    "step_id": "a:propose",
                    "prerequisite_step_ids": [],
                    "concurrency": {
                        "strategy": "resource-claims",
                        "isolation": "dedicated-worktree",
                        "write_paths": ["openspec/changes/a/**"],
                        "read_paths": [],
                        "exclusive_resources": [],
                    },
                    "prompt": prompt.relative_to(root).as_posix(),
                    "lockfile": lock.relative_to(root).as_posix(),
                    "prompt_status": "GENERATED",
                    "execution_status": "READY",
                }
            ],
        }
        fingerprint_plan = {
            **plan,
            "steps": [
                {key: value for key, value in step.items() if key != "prompt_status"}
                for step in plan["steps"]
            ],
        }
        semantic = json.dumps(
            fingerprint_plan, sort_keys=True, separators=(",", ":")
        ).encode("utf-8")
        plan["plan_fingerprint"] = hashlib.sha256(semantic).hexdigest()
        (prompts / "execution-plan.json").write_text(json.dumps(plan), encoding="utf-8")
        return prompts

    def test_loads_v3_claims_and_verifies_fingerprint(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            prompts = self._write_v3_plan(root)
            plan = load_execution_plan(root, prompts)
            self.assertEqual(plan.schema_version, 3)
            self.assertEqual(plan.steps[0].step_id, "a:propose")
            self.assertEqual(plan.steps[0].concurrency.strategy, "resource-claims")

            source = prompts / "execution-plan.json"
            changed = json.loads(source.read_text(encoding="utf-8"))
            changed["steps"][0]["concurrency"]["write_paths"] = ["tampered/**"]
            source.write_text(json.dumps(changed), encoding="utf-8")
            with self.assertRaisesRegex(PromptBuilderCompatibilityError, "fingerprint is stale"):
                load_execution_plan(root, prompts)

    def test_coordinator_requires_preflight_and_workers_one_leases_one_job(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(["git", "init"], cwd=root, check=True, capture_output=True)
            subprocess.run(
                ["git", "config", "user.email", "senior-mode@example.invalid"],
                cwd=root,
                check=True,
            )
            subprocess.run(
                ["git", "config", "user.name", "Senior Mode Test"],
                cwd=root,
                check=True,
            )
            marker = root / "README.md"
            marker.write_text("fixture\n", encoding="utf-8")
            subprocess.run(["git", "add", "README.md"], cwd=root, check=True)
            subprocess.run(
                ["git", "commit", "-m", "fixture"],
                cwd=root,
                check=True,
                capture_output=True,
            )
            prompts = self._write_v3_plan(root)
            coordinator = SeniorCoordinator(project_root=root, prompts_dir=prompts)

            with self.assertRaisesRegex(SeniorStateError, "preflight is missing or stale"):
                coordinator.lease_ready(max_workers=1, ttl_seconds=30)
            report = coordinator.run_preflight(
                [sys.executable, "-c", "raise SystemExit(0)"],
                timeout_seconds=30,
            )
            self.assertTrue(report["passed"])
            requests = coordinator.lease_ready(max_workers=1, ttl_seconds=30)
            self.assertEqual(len(requests), 1)
            request = json.loads(requests[0].read_text(encoding="utf-8"))
            self.assertEqual(request["job_id"], "a:propose")
            self.assertEqual(request["attempt_id"], "attempt-0001")

            write_worker_heartbeat(
                requests[0],
                status="running",
                current_command="implementing",
                progress="step 1",
            )
            observed_at = datetime.now(timezone.utc)
            first_tick = coordinator.supervise_tick(
                max_workers=1,
                ttl_seconds=300,
                heartbeat_timeout_seconds=120,
                stall_grace_seconds=0,
                max_retries=2,
                now=observed_at,
            )
            self.assertEqual(first_tick["heartbeats_observed"], ["a:propose"])
            self.assertEqual(first_tick["leased_requests"], [])

            second_tick = coordinator.supervise_tick(
                max_workers=1,
                ttl_seconds=300,
                heartbeat_timeout_seconds=120,
                stall_grace_seconds=0,
                max_retries=2,
                now=observed_at + timedelta(seconds=121),
            )
            self.assertEqual(second_tick["stalled"], ["a:propose"])
            self.assertEqual(second_tick["retried"], ["a:propose"])
            self.assertEqual(len(second_tick["leased_requests"]), 1)
            self.assertTrue(
                (requests[0].parent / "cancel.json").is_file(),
                "the stale attempt must receive a cancellation marker",
            )


if __name__ == "__main__":
    unittest.main()
