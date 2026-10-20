#!/usr/bin/env python3
"""Strict, dependency-free integration with Vigilio Prompt Builder 0.6.3/0.7.0.

This module is intentionally UI-agnostic.  Both ChatGPT automation scripts use
it so version checks, command execution, JSON parsing and execution-plan
validation have one owner.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence

from senior_scheduler import ResourceClaims, SeniorPlanError


SUPPORTED_PROMPT_BUILDER_VERSION = "0.7.0"
SUPPORTED_PROMPT_BUILDER_VERSIONS = ("0.6.3", "0.7.0")
SUPPORTED_PLAN_SCHEMA_VERSIONS = (2, 3)
SUPPORTED_PHASES = ("explore", "propose", "apply", "review", "fix")
MUTATING_PHASES = frozenset({"apply", "review", "fix"})


class PromptBuilderCompatibilityError(RuntimeError):
    """The installed builder or one of its generated artifacts is incompatible."""


class PromptBuilderCommandError(RuntimeError):
    """A Prompt Builder command failed closed."""

    def __init__(self, command: Sequence[str], returncode: int, output: str):
        self.command = tuple(command)
        self.returncode = returncode
        self.output = output
        tail = output[-4000:].strip()
        super().__init__(
            f"Prompt Builder command failed ({returncode}): {' '.join(command)}"
            + (f"\n{tail}" if tail else "")
        )


@dataclass(frozen=True)
class PromptBuilderCommandResult:
    command: tuple[str, ...]
    returncode: int
    stdout: str
    stderr: str

    @property
    def output(self) -> str:
        return "\n".join(part for part in (self.stdout, self.stderr) if part).strip()


@dataclass(frozen=True)
class ExecutionPlanStep:
    sequence: int
    dependency_level: int
    pack: str
    phase: str
    depends_on: tuple[str, ...]
    previous_phase_sequence: int | None
    prompt: Path
    lockfile: Path
    selection_reason: str
    execution_status: str
    step_id: str
    prerequisite_step_ids: tuple[str, ...]
    concurrency: ResourceClaims

    @property
    def logical_id(self) -> str:
        return f"{self.pack}:{self.phase}"


@dataclass(frozen=True)
class ExecutionPlan:
    source: Path
    schema_version: int
    plan_id: str
    phases: tuple[str, ...]
    selection: Mapping[str, Any]
    steps: tuple[ExecutionPlanStep, ...]
    plan_fingerprint: str


def _extract_json(text: str) -> Any:
    """Read the last complete JSON value from noisy pnpm command output."""

    decoder = json.JSONDecoder()
    values: list[tuple[int, Any]] = []
    for match in re.finditer(r"[\[{]", text):
        try:
            value, consumed = decoder.raw_decode(text[match.start() :])
        except json.JSONDecodeError:
            continue
        # Nested objects also decode successfully. The outer report is the
        # longest complete JSON value and is therefore the only safe choice.
        values.append((consumed, value))
    if not values:
        raise PromptBuilderCompatibilityError(
            "Prompt Builder did not return machine-readable JSON"
        )
    return max(values, key=lambda candidate: candidate[0])[1]


def _inside(root: Path, candidate: Path, *, label: str) -> Path:
    root = root.resolve()
    candidate = candidate.resolve()
    try:
        candidate.relative_to(root)
    except ValueError as exc:
        raise PromptBuilderCompatibilityError(
            f"{label} escapes project root: {candidate}"
        ) from exc
    return candidate


def _relative_artifact(project_root: Path, value: Any, *, label: str) -> Path:
    if not isinstance(value, str) or not value.strip():
        raise PromptBuilderCompatibilityError(f"{label} must be a non-empty path")
    raw = Path(value)
    if raw.is_absolute():
        raise PromptBuilderCompatibilityError(
            f"{label} must be project-relative for portable Prompt Builder locks"
        )
    return _inside(project_root, project_root / raw, label=label)


def load_execution_plan(project_root: Path, prompts_dir: Path) -> ExecutionPlan:
    """Load and strictly validate a Prompt Builder schema v2/v3 execution plan."""

    project_root = project_root.resolve()
    prompts_dir = _inside(project_root, prompts_dir, label="prompts directory")
    source = prompts_dir / "execution-plan.json"
    if not source.is_file():
        raise PromptBuilderCompatibilityError(
            f"Prompt Builder execution plan is required: {source}"
        )

    try:
        raw = json.loads(source.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise PromptBuilderCompatibilityError(
            f"Invalid Prompt Builder execution plan: {source}: {exc}"
        ) from exc
    if not isinstance(raw, dict):
        raise PromptBuilderCompatibilityError("execution-plan.json must be a JSON object")
    schema_version = raw.get("schema_version")
    if schema_version not in SUPPORTED_PLAN_SCHEMA_VERSIONS:
        raise PromptBuilderCompatibilityError(
            "Unsupported execution plan schema: "
            f"{schema_version!r}; expected one of {SUPPORTED_PLAN_SCHEMA_VERSIONS}"
        )
    plan_id = raw.get("plan_id")
    if not isinstance(plan_id, str) or not plan_id.strip():
        raise PromptBuilderCompatibilityError("execution plan has no valid plan_id")

    phases_raw = raw.get("phases")
    if not isinstance(phases_raw, list) or not phases_raw:
        raise PromptBuilderCompatibilityError("execution plan has no phases")
    phases = tuple(str(phase) for phase in phases_raw)
    unsupported_phases = sorted(set(phases) - set(SUPPORTED_PHASES))
    if unsupported_phases:
        raise PromptBuilderCompatibilityError(
            f"Unsupported execution plan phases: {unsupported_phases}"
        )

    selection = raw.get("selection")
    if not isinstance(selection, dict):
        raise PromptBuilderCompatibilityError("execution plan has no selection evidence")
    selection_mode = selection.get("mode")
    if selection_mode not in {"enabled-packs", "context-packs", "plan-file"}:
        raise PromptBuilderCompatibilityError(
            f"execution plan has invalid selection mode: {selection_mode!r}"
        )
    if selection_mode == "plan-file":
        _relative_artifact(project_root, selection.get("source"), label="plan selection source")
        if not isinstance(selection.get("sha256"), str):
            raise PromptBuilderCompatibilityError("plan-file selection has no SHA-256 evidence")
    steps_raw = raw.get("steps")
    if not isinstance(steps_raw, list) or not steps_raw:
        raise PromptBuilderCompatibilityError("execution plan has no executable steps")

    steps: list[ExecutionPlanStep] = []
    seen_sequences: set[int] = set()
    seen_logical_ids: set[str] = set()
    for index, entry in enumerate(steps_raw):
        if not isinstance(entry, dict):
            raise PromptBuilderCompatibilityError(f"execution plan step {index} is invalid")
        sequence = entry.get("sequence")
        level = entry.get("dependency_level")
        previous = entry.get("depends_on_previous_phase_step")
        pack = entry.get("pack")
        phase = entry.get("phase")
        dependencies = entry.get("depends_on")
        if not isinstance(sequence, int) or sequence < 1 or sequence in seen_sequences:
            raise PromptBuilderCompatibilityError(
                f"execution plan has invalid/duplicate sequence: {sequence!r}"
            )
        if not isinstance(level, int) or level < 0:
            raise PromptBuilderCompatibilityError(f"step {sequence} has invalid dependency level")
        if previous is not None and (not isinstance(previous, int) or previous >= sequence):
            raise PromptBuilderCompatibilityError(f"step {sequence} has invalid previous phase")
        if not isinstance(pack, str) or not pack.strip():
            raise PromptBuilderCompatibilityError(f"step {sequence} has no pack")
        if phase not in SUPPORTED_PHASES or phase not in phases:
            raise PromptBuilderCompatibilityError(f"step {sequence} has unsupported phase {phase!r}")
        if not isinstance(dependencies, list) or not all(
            isinstance(value, str) and value for value in dependencies
        ):
            raise PromptBuilderCompatibilityError(f"step {sequence} has invalid dependencies")
        logical_id = f"{pack}:{phase}"
        if logical_id in seen_logical_ids:
            raise PromptBuilderCompatibilityError(
                f"execution plan has duplicate logical step: {logical_id}"
            )

        prompt = _relative_artifact(
            project_root, entry.get("prompt"), label=f"step {sequence} prompt"
        )
        lockfile = _relative_artifact(
            project_root, entry.get("lockfile"), label=f"step {sequence} lockfile"
        )
        if prompt.parent != prompts_dir or lockfile.parent != prompts_dir:
            raise PromptBuilderCompatibilityError(
                f"step {sequence} artifacts do not belong to {prompts_dir}"
            )
        expected_status = entry.get("execution_status")
        if expected_status not in {
            "READY",
            "BLOCKED_BY_PREVIOUS_PHASE",
            "BLOCKED_BY_DEPENDENCIES",
        }:
            raise PromptBuilderCompatibilityError(
                f"step {sequence} has invalid execution_status {expected_status!r}"
            )
        selection_reason = entry.get("selection_reason")
        if selection_reason not in {"enabled", "context", "requested", "dependency"}:
            raise PromptBuilderCompatibilityError(
                f"step {sequence} has invalid selection_reason {selection_reason!r}"
            )

        if schema_version == 3:
            step_id = entry.get("step_id")
            if step_id != logical_id:
                raise PromptBuilderCompatibilityError(
                    f"step {sequence} step_id must equal {logical_id!r}"
                )
            prerequisites = entry.get("prerequisite_step_ids")
            if not isinstance(prerequisites, list) or not all(
                isinstance(value, str) and value for value in prerequisites
            ):
                raise PromptBuilderCompatibilityError(
                    f"step {sequence} has invalid prerequisite_step_ids"
                )
            try:
                concurrency = ResourceClaims.from_mapping(entry.get("concurrency"))
            except SeniorPlanError as exc:
                raise PromptBuilderCompatibilityError(
                    f"step {sequence} has invalid concurrency claims: {exc}"
                ) from exc
        else:
            step_id = logical_id
            prerequisites = []
            concurrency = ResourceClaims()

        steps.append(
            ExecutionPlanStep(
                sequence=sequence,
                dependency_level=level,
                pack=pack,
                phase=phase,
                depends_on=tuple(dependencies),
                previous_phase_sequence=previous,
                prompt=prompt,
                lockfile=lockfile,
                selection_reason=selection_reason,
                execution_status=expected_status,
                step_id=step_id,
                prerequisite_step_ids=tuple(prerequisites),
                concurrency=concurrency,
            )
        )
        seen_sequences.add(sequence)
        seen_logical_ids.add(logical_id)

    steps.sort(key=lambda step: step.sequence)
    if [step.sequence for step in steps] != list(range(1, len(steps) + 1)):
        raise PromptBuilderCompatibilityError(
            "Prompt Builder execution steps must use contiguous numeric order"
        )

    if raw.get("prompt_count") not in (None, len(steps)):
        raise PromptBuilderCompatibilityError("execution plan prompt_count does not match steps")

    packs = {step.pack for step in steps}
    if raw.get("pack_count") not in (None, len(packs)):
        raise PromptBuilderCompatibilityError("execution plan pack_count does not match steps")
    levels_by_pack = {step.pack: step.dependency_level for step in steps}
    by_sequence = {step.sequence: step for step in steps}
    by_logical_id = {step.logical_id: step for step in steps}
    normalized_steps: list[ExecutionPlanStep] = []
    for step in steps:
        if step.previous_phase_sequence is not None:
            previous = by_sequence.get(step.previous_phase_sequence)
            if previous is None or previous.pack != step.pack:
                raise PromptBuilderCompatibilityError(
                    f"step {step.sequence} previous phase does not belong to pack {step.pack}"
                )
            if SUPPORTED_PHASES.index(previous.phase) >= SUPPORTED_PHASES.index(step.phase):
                raise PromptBuilderCompatibilityError(
                    f"step {step.sequence} previous phase order is invalid"
                )
        for dependency in step.depends_on:
            if dependency not in packs:
                raise PromptBuilderCompatibilityError(
                    f"step {step.sequence} references missing dependency pack {dependency}"
                )
            if levels_by_pack[dependency] >= step.dependency_level:
                raise PromptBuilderCompatibilityError(
                    f"dependency level is not ordered: {step.pack} -> {dependency}"
                )
        expected_status = (
            "BLOCKED_BY_PREVIOUS_PHASE"
            if step.previous_phase_sequence is not None
            else "READY" if not step.depends_on else "BLOCKED_BY_DEPENDENCIES"
        )
        if step.execution_status != expected_status:
            raise PromptBuilderCompatibilityError(
                f"step {step.sequence} execution_status={step.execution_status!r}; "
                f"expected {expected_status!r}"
            )

        if schema_version == 2:
            prerequisites: list[str] = []
            if step.previous_phase_sequence is not None:
                prerequisites.append(by_sequence[step.previous_phase_sequence].logical_id)
            for dependency in step.depends_on:
                same_phase = by_logical_id.get(f"{dependency}:{step.phase}")
                if same_phase is not None:
                    prerequisites.append(same_phase.logical_id)
            step = replace(step, prerequisite_step_ids=tuple(dict.fromkeys(prerequisites)))
        else:
            missing = sorted(set(step.prerequisite_step_ids) - by_logical_id.keys())
            if missing:
                raise PromptBuilderCompatibilityError(
                    f"step {step.sequence} references missing prerequisite steps: {missing}"
                )
            if step.previous_phase_sequence is not None:
                previous_id = by_sequence[step.previous_phase_sequence].logical_id
                if previous_id not in step.prerequisite_step_ids:
                    raise PromptBuilderCompatibilityError(
                        f"step {step.sequence} omits previous phase prerequisite {previous_id}"
                    )
        normalized_steps.append(step)

    if schema_version == 3:
        plan_fingerprint = raw.get("plan_fingerprint")
        if not isinstance(plan_fingerprint, str) or not re.fullmatch(
            r"[a-fA-F0-9]{64}", plan_fingerprint
        ):
            raise PromptBuilderCompatibilityError("schema v3 plan has no valid plan_fingerprint")
        semantic = dict(raw)
        semantic.pop("generated_at", None)
        semantic.pop("plan_fingerprint", None)
        semantic["steps"] = [
            {key: value for key, value in entry.items() if key != "prompt_status"}
            for entry in semantic.get("steps", [])
        ]
        expected_fingerprint = hashlib.sha256(
            json.dumps(semantic, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest()
        if plan_fingerprint.lower() != expected_fingerprint:
            raise PromptBuilderCompatibilityError("schema v3 plan_fingerprint is stale")
        plan_fingerprint = expected_fingerprint
    else:
        semantic = dict(raw)
        semantic.pop("generated_at", None)
        plan_fingerprint = hashlib.sha256(
            json.dumps(semantic, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest()

    return ExecutionPlan(
        source=source,
        schema_version=schema_version,
        plan_id=plan_id,
        phases=phases,
        selection=selection,
        steps=tuple(normalized_steps),
        plan_fingerprint=plan_fingerprint,
    )


class PromptBuilderClient:
    """Fail-closed subprocess client for the published Prompt Builder CLI."""

    def __init__(
        self,
        project_root: Path,
        *,
        expected_version: str | Sequence[str] = SUPPORTED_PROMPT_BUILDER_VERSIONS,
        package_manager: str = "pnpm",
        executable: str = "vigilio-prompt",
        timeout_seconds: int = 180,
        cli_path: Path | None = None,
        node_executable: Path | None = None,
    ) -> None:
        self.project_root = project_root.resolve()
        self.expected_versions = (
            (expected_version,)
            if isinstance(expected_version, str)
            else tuple(expected_version)
        )
        if not self.expected_versions:
            raise ValueError("at least one compatible Prompt Builder version is required")
        self.expected_version = self.expected_versions[-1]
        self.package_manager = package_manager
        self.executable = executable
        self.timeout_seconds = timeout_seconds
        self.cli_path = cli_path.resolve() if cli_path is not None else None
        self.node_executable = (
            node_executable.resolve() if node_executable is not None else None
        )
        self._command_prefix = self._resolve_command_prefix()

    @staticmethod
    def _node_major(executable: Path) -> int | None:
        try:
            completed = subprocess.run(
                [str(executable), "--version"],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=10,
                shell=False,
            )
        except (OSError, subprocess.TimeoutExpired):
            return None
        match = re.search(r"v?(\d+)\.", completed.stdout)
        return int(match.group(1)) if completed.returncode == 0 and match else None

    def _resolve_node24(self) -> Path | None:
        candidates: list[Path] = []
        if self.node_executable is not None:
            if not self.node_executable.is_file():
                raise PromptBuilderCompatibilityError(
                    f"Configured Node.js executable is missing: {self.node_executable}"
                )
            candidates.append(self.node_executable)
        explicit = os.environ.get("VIGILIO_NODE24_BIN")
        if explicit:
            candidates.append(Path(explicit))
        discovered = shutil.which("node")
        if discovered:
            candidates.append(Path(discovered))

        nvm_roots = {
            value
            for value in (
                os.environ.get("NVM_HOME"),
                str(Path(os.environ["LOCALAPPDATA"]) / "nvm")
                if os.environ.get("LOCALAPPDATA")
                else None,
            )
            if value
        }
        for nvm_root in nvm_roots:
            root = Path(nvm_root)
            candidates.extend(
                sorted(root.glob("v24.*/node.exe"), reverse=True)
                if os.name == "nt"
                else sorted(root.glob("v24.*/bin/node"), reverse=True)
            )

        seen: set[Path] = set()
        for candidate in candidates:
            resolved = candidate.resolve()
            if resolved in seen or not resolved.is_file():
                continue
            seen.add(resolved)
            if self._node_major(resolved) == 24:
                return resolved
        return None

    def _resolve_command_prefix(self) -> list[str]:
        explicit_cli = os.environ.get("VIGILIO_PROMPT_BUILDER_CLI")
        installed_cli = (
            self.project_root
            / "node_modules"
            / "@vigilio-services"
            / "prompt-builder"
            / "dist"
            / "cli.js"
        )
        cli = (
            self.cli_path
            if self.cli_path is not None
            else Path(explicit_cli).resolve() if explicit_cli else installed_cli.resolve()
        )
        if self.cli_path is not None and not cli.is_file():
            raise PromptBuilderCompatibilityError(
                f"Configured Prompt Builder CLI is missing: {cli}"
            )
        if cli.is_file():
            node24 = self._resolve_node24()
            if node24 is None:
                raise PromptBuilderCompatibilityError(
                    "Prompt Builder requires Node.js 24. Install/select Node 24 or set "
                    "VIGILIO_NODE24_BIN to its executable."
                )
            return [str(node24), str(cli)]

        manager = shutil.which(self.package_manager) or self.package_manager
        # subprocess can execute .cmd/.bat launchers directly on Windows. Routing
        # through `cmd /c` splits package-manager paths containing spaces (for
        # example "Author Software\\nvm") and makes every queue preflight fail.
        return [str(manager), "exec", self.executable]

    @property
    def command_prefix(self) -> list[str]:
        return list(self._command_prefix)

    def run(
        self,
        arguments: Iterable[str],
        *,
        check: bool = True,
        timeout_seconds: int | None = None,
    ) -> PromptBuilderCommandResult:
        command = [*self.command_prefix, *map(str, arguments)]
        try:
            completed = subprocess.run(
                command,
                cwd=self.project_root,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout_seconds or self.timeout_seconds,
                shell=False,
            )
        except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
            raise PromptBuilderCommandError(command, 127, str(exc)) from exc
        result = PromptBuilderCommandResult(
            command=tuple(command),
            returncode=completed.returncode,
            stdout=completed.stdout,
            stderr=completed.stderr,
        )
        if check and completed.returncode != 0:
            raise PromptBuilderCommandError(command, completed.returncode, result.output)
        return result

    def version(self) -> str:
        result = self.run(["--version"])
        matches = re.findall(r"(?m)^\s*(\d+\.\d+\.\d+)\s*$", result.output)
        if not matches:
            raise PromptBuilderCompatibilityError(
                f"Unable to read Prompt Builder version from: {result.output[-1000:]}"
            )
        if len(set(matches)) != 1:
            raise PromptBuilderCompatibilityError(
                f"Ambiguous Prompt Builder version output: {matches}"
            )
        return matches[0]

    def assert_compatible(self) -> str:
        installed = self.version()
        if installed not in self.expected_versions:
            raise PromptBuilderCompatibilityError(
                f"Prompt Builder version mismatch: installed={installed}, "
                f"required one of={','.join(self.expected_versions)}"
            )
        return installed

    def _json_command(
        self, arguments: Iterable[str], *, check: bool = True
    ) -> tuple[PromptBuilderCommandResult, Any]:
        result = self.run(arguments, check=check)
        return result, _extract_json(result.output)

    def validate_references(self) -> Mapping[str, Any]:
        _, report = self._json_command(
            ["validate-references", "--project-root", str(self.project_root)]
        )
        if not isinstance(report, dict) or report.get("valid") is not True:
            raise PromptBuilderCompatibilityError("Canonical reference validation did not pass")
        return report

    def validate_decisions(self, *, pack: str | None = None) -> Mapping[str, Any]:
        args = ["validate-decisions", "--project-root", str(self.project_root)]
        if pack:
            args.extend(["--pack", pack])
        result, report = self._json_command(args, check=False)
        if (
            result.returncode != 0
            or not isinstance(report, dict)
            or report.get("ready") is not True
        ):
            raise PromptBuilderCommandError(result.command, result.returncode or 1, result.output)
        return report

    def check_eligibility(
        self, *, pack: str, phases: Sequence[str]
    ) -> Mapping[str, Any]:
        result, report = self._json_command(
            [
                "check-eligibility",
                "--project-root",
                str(self.project_root),
                "--pack",
                pack,
                "--phases",
                ",".join(phases),
            ],
            check=False,
        )
        if (
            result.returncode != 0
            or not isinstance(report, dict)
            or report.get("eligible") is not True
        ):
            raise PromptBuilderCommandError(result.command, result.returncode or 1, result.output)
        return report

    def verify_lock(self, lock_file: Path) -> Mapping[str, Any]:
        lock_file = _inside(self.project_root, lock_file, label="lock file")
        result, report = self._json_command(
            [
                "verify-lock",
                "--project-root",
                str(self.project_root),
                "--lock-file",
                str(lock_file.relative_to(self.project_root)),
            ],
            check=False,
        )
        if isinstance(report, dict) and self._recover_windows_line_endings(lock_file, report):
            return {
                **report,
                "valid": True,
                "line_ending_normalized": True,
            }
        if result.returncode != 0 or not isinstance(report, dict) or report.get("valid") is not True:
            raise PromptBuilderCommandError(result.command, result.returncode or 1, result.output)
        return report

    def _recover_windows_line_endings(
        self, lock_file: Path, report: Mapping[str, Any]
    ) -> bool:
        """Accept only byte-identical text after CRLF -> LF normalization.

        Legacy Prompt Builder 0.6.0 locks were emitted from LF content. A Windows Git
        checkout may rewrite those same files to CRLF. This compatibility bridge
        keeps existing plans usable until every consumer installs the patched CLI;
        it cannot forgive any semantic/content change.
        """
        if report.get("valid") is True:
            return False
        checks = report.get("checks")
        if not isinstance(checks, list):
            return False
        failed = [check for check in checks if isinstance(check, dict) and check.get("passed") is False]
        if not failed:
            return False

        try:
            lock = json.loads(lock_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return False
        if not isinstance(lock, dict):
            return False

        def nested(*keys: str) -> Mapping[str, Any] | None:
            value: Any = lock
            for key in keys:
                if not isinstance(value, dict):
                    return None
                value = value.get(key)
            return value if isinstance(value, dict) else None

        def indexed(key: str, index: int) -> Mapping[str, Any] | None:
            values = lock.get(key)
            if not isinstance(values, list) or index >= len(values):
                return None
            value = values[index]
            return value if isinstance(value, dict) else None

        prompt_entry: Mapping[str, Any] = {
            "source": str(lock_file.with_name(lock_file.name.removesuffix(".lock.json") + ".md")),
            "sha256": lock.get("prompt_sha256"),
        }

        for check in failed:
            name = check.get("name")
            entry: Mapping[str, Any] | None = None
            if name == "prompt":
                entry = prompt_entry
            elif name == "factory_baseline":
                entry = nested("factory_baseline")
            elif name == "factory_architecture":
                entry = nested("factory_baseline", "architecture")
            elif name == "registry":
                entry = nested("canonical_authority", "registry")
            elif name == "plan":
                entry = nested("plan_selection")
            elif isinstance(name, str) and name.startswith("document:"):
                try:
                    entry = indexed("documents", int(name.partition(":")[2]))
                except ValueError:
                    return False
            elif isinstance(name, str) and name.startswith("canonical_reference:"):
                try:
                    entry = indexed("canonical_references", int(name.partition(":")[2]))
                except ValueError:
                    return False

            if entry is None:
                return False
            source = entry.get("source")
            expected = entry.get("sha256")
            if not isinstance(source, str) or not isinstance(expected, str):
                return False
            raw_path = Path(source)
            candidate = raw_path if raw_path.is_absolute() else self.project_root / raw_path
            try:
                content = _inside(self.project_root, candidate, label=str(name)).read_bytes()
            except OSError:
                return False
            normalized = content.replace(b"\r\n", b"\n")
            if hashlib.sha256(normalized).hexdigest() != expected:
                return False
        return True

    def initialize_project(
        self,
        *,
        architecture: Path,
        mode: str,
        brief_file: Path | None = None,
        implementation_root: Path | None = None,
        refresh_baseline: bool = False,
    ) -> Mapping[str, Any]:
        if mode not in {"greenfield", "migration"}:
            raise ValueError(f"Unsupported project mode: {mode}")
        args = [
            "init-project",
            "--project-root",
            str(self.project_root),
            "--mode",
            mode,
            "--architecture",
            str(architecture),
        ]
        if brief_file:
            args.extend(["--brief-file", str(brief_file)])
        if implementation_root:
            args.extend(["--implementation-root", str(implementation_root)])
        if refresh_baseline:
            args.append("--refresh-baseline")
        _, report = self._json_command(args)
        if not isinstance(report, dict):
            raise PromptBuilderCompatibilityError("init-project returned an invalid report")
        return report

    def build_all(
        self,
        *,
        plan: ExecutionPlan,
        prompts_dir: Path,
        token_budget: int,
    ) -> Mapping[str, Any]:
        prompts_dir = _inside(self.project_root, prompts_dir, label="prompts directory")
        args = [
            "build-all",
            "--project-root",
            str(self.project_root),
            "--phases",
            ",".join(plan.phases),
            "--token-budget",
            str(token_budget),
            "--output-dir",
            str(prompts_dir.relative_to(self.project_root)),
        ]
        source = plan.selection.get("source")
        mode = plan.selection.get("mode")
        if isinstance(source, str) and source:
            args.extend(["--plan-file", source])
        else:
            args.extend(["--plan-id", plan.plan_id])
            if mode == "context-packs":
                args.append("--include-context-packs")
        _, report = self._json_command(args, check=True)
        if not isinstance(report, dict):
            raise PromptBuilderCompatibilityError("build-all returned an invalid report")
        return report
