"""Fail-closed scheduling primitives for Senior Mode.

The scheduler is intentionally side-effect free.  It never starts an agent or
writes state; the coordinator remains the only state writer and may therefore
re-run scheduling safely after a crash.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import PurePosixPath
from typing import Any, Iterable, Mapping, Sequence


PHASE_ORDER = ("explore", "propose", "apply", "review", "fix")
ACTIVE_STATUSES = frozenset(
    {"leased", "running", "stalled", "produced", "validated", "merge_pending"}
)
WORKER_ACTIVE_STATUSES = frozenset({"leased", "running", "stalled"})
COMPLETE_STATUSES = frozenset({"done", "skipped"})


class SeniorPlanError(ValueError):
    """Raised when a plan cannot prove that concurrent execution is safe."""


def _safe_identifier(value: Any, *, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise SeniorPlanError(f"{label} must be a non-empty string")
    return value.strip()


def normalize_claim_path(value: Any) -> str:
    """Return a portable, conservative relative path/glob.

    Claims are authorization-adjacent metadata.  Absolute paths, parent
    traversal and a repository-wide ``**`` claim are rejected instead of
    being guessed into a safe shape.
    """

    raw = _safe_identifier(value, label="resource path").replace("\\", "/")
    if raw.startswith("/") or (len(raw) >= 2 and raw[1] == ":"):
        raise SeniorPlanError(f"resource path must be relative: {value!r}")
    parts = [part for part in raw.split("/") if part not in ("", ".")]
    if ".." in parts:
        raise SeniorPlanError(f"resource path cannot traverse parents: {value!r}")
    normalized = "/".join(parts)
    if not normalized or normalized == "**":
        raise SeniorPlanError(f"resource path is too broad: {value!r}")
    return normalized.casefold()


@dataclass(frozen=True, order=True)
class ResourcePath:
    repository: str
    path: str

    @classmethod
    def parse(cls, value: Any) -> "ResourcePath":
        if isinstance(value, str):
            return cls(repository=".", path=normalize_claim_path(value))
        if not isinstance(value, Mapping):
            raise SeniorPlanError("resource path must be a string or object")
        repository = _safe_identifier(value.get("repository", "."), label="repository")
        if "/" in repository or "\\" in repository or repository in {".", ".."}:
            if repository != ".":
                raise SeniorPlanError(f"invalid repository identity: {repository!r}")
        return cls(repository=repository.casefold(), path=normalize_claim_path(value.get("path")))


def _static_prefix(pattern: str) -> tuple[str, ...]:
    prefix: list[str] = []
    for part in PurePosixPath(pattern).parts:
        if any(token in part for token in ("*", "?", "[")):
            break
        prefix.append(part)
    return tuple(prefix)


def paths_may_overlap(left: ResourcePath, right: ResourcePath) -> bool:
    """Conservatively decide whether two path claims may touch the same file."""

    if left.repository != right.repository:
        return False
    left_prefix = _static_prefix(left.path)
    right_prefix = _static_prefix(right.path)
    if not left_prefix or not right_prefix:
        return True
    shared = min(len(left_prefix), len(right_prefix))
    if left_prefix[:shared] != right_prefix[:shared]:
        return False
    # Same static prefix is ambiguous once a glob appears, so fail closed.
    return True


@dataclass(frozen=True)
class ResourceClaims:
    strategy: str = "serial"
    isolation: str = "dedicated-worktree"
    read_paths: tuple[ResourcePath, ...] = ()
    write_paths: tuple[ResourcePath, ...] = ()
    exclusive_resources: tuple[str, ...] = ()

    @classmethod
    def from_mapping(cls, value: Any) -> "ResourceClaims":
        if value is None:
            return cls()
        if not isinstance(value, Mapping):
            raise SeniorPlanError("concurrency claims must be an object")
        strategy = value.get("strategy", "serial")
        isolation = value.get("isolation", "dedicated-worktree")
        if strategy not in {"serial", "resource-claims"}:
            raise SeniorPlanError(f"unsupported concurrency strategy: {strategy!r}")
        if isolation not in {"dedicated-worktree", "shared-worktree", "read-only"}:
            raise SeniorPlanError(f"unsupported isolation mode: {isolation!r}")

        def paths(key: str) -> tuple[ResourcePath, ...]:
            raw = value.get(key, [])
            if not isinstance(raw, list):
                raise SeniorPlanError(f"concurrency.{key} must be an array")
            return tuple(sorted({ResourcePath.parse(item) for item in raw}))

        raw_resources = value.get("exclusive_resources", [])
        if not isinstance(raw_resources, list):
            raise SeniorPlanError("concurrency.exclusive_resources must be an array")
        resources = tuple(
            sorted(
                {
                    _safe_identifier(item, label="exclusive resource").casefold()
                    for item in raw_resources
                }
            )
        )
        read_paths = paths("read_paths")
        write_paths = paths("write_paths")
        if strategy == "resource-claims" and not write_paths and isolation != "read-only":
            raise SeniorPlanError(
                "resource-claims jobs must declare write_paths or use read-only isolation"
            )
        return cls(
            strategy=strategy,
            isolation=isolation,
            read_paths=read_paths,
            write_paths=write_paths,
            exclusive_resources=resources,
        )

    def conflicts_with(self, other: "ResourceClaims") -> bool:
        if self.strategy == "serial" or other.strategy == "serial":
            return True
        if self.isolation == "shared-worktree" or other.isolation == "shared-worktree":
            # Shared checkouts are never concurrently writable.
            if self.write_paths or other.write_paths:
                return True
        if set(self.exclusive_resources).intersection(other.exclusive_resources):
            return True
        for write in self.write_paths:
            for candidate in (*other.write_paths, *other.read_paths):
                if paths_may_overlap(write, candidate):
                    return True
        for write in other.write_paths:
            for read in self.read_paths:
                if paths_may_overlap(write, read):
                    return True
        return False


@dataclass(frozen=True)
class SeniorJob:
    job_id: str
    pack: str
    phase: str
    sequence: int
    prerequisites: tuple[str, ...] = ()
    claims: ResourceClaims = field(default_factory=ResourceClaims)

    def __post_init__(self) -> None:
        if self.phase not in PHASE_ORDER:
            raise SeniorPlanError(f"unsupported Senior Mode phase: {self.phase!r}")


def _status(statuses: Mapping[str, Any], job_id: str) -> str:
    value = statuses.get(job_id, "pending")
    if isinstance(value, Mapping):
        value = value.get("status", "pending")
    return str(value)


class SeniorScheduler:
    """Select a deterministic, conflict-free cohort of at most ``max_workers``."""

    def __init__(self, jobs: Sequence[SeniorJob], *, phase_order: Sequence[str] = PHASE_ORDER):
        self.jobs = tuple(sorted(jobs, key=lambda job: (job.sequence, job.job_id)))
        self.phase_order = tuple(phase_order)
        by_id = {job.job_id: job for job in self.jobs}
        if len(by_id) != len(self.jobs):
            raise SeniorPlanError("Senior Mode plan contains duplicate job_id values")
        for job in self.jobs:
            missing = sorted(set(job.prerequisites) - by_id.keys())
            if missing:
                raise SeniorPlanError(f"{job.job_id} has missing prerequisites: {missing}")

    def active_phase(
        self,
        statuses: Mapping[str, Any],
        *,
        allowed_packs: frozenset[str] | None = None,
    ) -> str | None:
        for phase in self.phase_order:
            phase_jobs = [
                job
                for job in self.jobs
                if job.phase == phase
                and (allowed_packs is None or job.pack in allowed_packs)
            ]
            if phase_jobs and any(_status(statuses, job.job_id) not in COMPLETE_STATUSES for job in phase_jobs):
                return phase
        return None

    def ready_batch(
        self,
        statuses: Mapping[str, Any],
        *,
        max_workers: int,
        allowed_packs: frozenset[str] | None = None,
    ) -> tuple[SeniorJob, ...]:
        if max_workers < 1:
            raise ValueError("max_workers must be at least 1")
        phase = self.active_phase(statuses, allowed_packs=allowed_packs)
        if phase is None:
            return ()
        active = [job for job in self.jobs if _status(statuses, job.job_id) in ACTIVE_STATUSES]
        occupied_workers = sum(
            _status(statuses, job.job_id) in WORKER_ACTIVE_STATUSES for job in self.jobs
        )
        available_workers = max_workers - occupied_workers
        if available_workers <= 0:
            return ()
        selected: list[SeniorJob] = []
        for job in self.jobs:
            if len(selected) >= available_workers:
                break
            if allowed_packs is not None and job.pack not in allowed_packs:
                continue
            if job.phase != phase or _status(statuses, job.job_id) != "pending":
                continue
            if any(_status(statuses, dependency) not in COMPLETE_STATUSES for dependency in job.prerequisites):
                continue
            if any(job.claims.conflicts_with(item.claims) for item in (*active, *selected)):
                continue
            selected.append(job)
        return tuple(selected)

    def blocked_reason(
        self,
        job: SeniorJob,
        statuses: Mapping[str, Any],
        *,
        allowed_packs: frozenset[str] | None = None,
    ) -> str | None:
        if allowed_packs is not None and job.pack not in allowed_packs:
            return "cohort barrier: waiting for the active vertical cohort"
        phase = self.active_phase(statuses, allowed_packs=allowed_packs)
        if phase is not None and job.phase != phase:
            return f"phase barrier: waiting for {phase}"
        pending = [dep for dep in job.prerequisites if _status(statuses, dep) not in COMPLETE_STATUSES]
        if pending:
            return f"prerequisites incomplete: {', '.join(pending)}"
        active = [item for item in self.jobs if _status(statuses, item.job_id) in ACTIVE_STATUSES]
        conflicts = [item.job_id for item in active if job.claims.conflicts_with(item.claims)]
        if conflicts:
            return f"resource conflict: {', '.join(conflicts)}"
        return None


def jobs_from_execution_plan(plan: Any) -> tuple[SeniorJob, ...]:
    """Adapt ``prompt_builder_compat.ExecutionPlan`` without importing it here."""

    jobs: list[SeniorJob] = []
    for step in plan.steps:
        prerequisites = tuple(getattr(step, "prerequisite_step_ids", ()) or ())
        if not prerequisites and getattr(step, "previous_phase_sequence", None) is not None:
            previous = next(
                candidate
                for candidate in plan.steps
                if candidate.sequence == step.previous_phase_sequence
            )
            prerequisites = (getattr(previous, "step_id", previous.logical_id),)
        claims = getattr(step, "concurrency", ResourceClaims())
        if not isinstance(claims, ResourceClaims):
            claims = ResourceClaims.from_mapping(claims)
        jobs.append(
            SeniorJob(
                job_id=getattr(step, "step_id", step.logical_id),
                pack=step.pack,
                phase=step.phase,
                sequence=step.sequence,
                prerequisites=prerequisites,
                claims=claims,
            )
        )
    return tuple(jobs)
