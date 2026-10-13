"""Fail-closed runtime preflight launcher shared by the ChatGPT runners."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import time
from pathlib import Path


DEFAULT_PREFLIGHT_SCRIPT = Path("scripts/preflight-env.sh")
DEFAULT_PREFLIGHT_CONFIG = Path("scripts/preflight-services.env")
DEFAULT_PREFLIGHT_TIMEOUT_SECONDS = 180
DEFAULT_PREFLIGHT_READY_TIMEOUT_SECONDS = 0
DEFAULT_PREFLIGHT_RETRY_INTERVAL_SECONDS = 10.0


def add_preflight_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--preflight-script",
        type=Path,
        default=DEFAULT_PREFLIGHT_SCRIPT,
        help="Fail-closed readiness script executed before Prompt Builder or ChatGPT UI work.",
    )
    parser.add_argument(
        "--preflight-config",
        type=Path,
        default=None,
        help="Optional non-secret service policy passed to the readiness script.",
    )
    parser.add_argument(
        "--preflight-timeout",
        type=int,
        default=DEFAULT_PREFLIGHT_TIMEOUT_SECONDS,
        metavar="SECONDS",
        help="Maximum duration of each individual readiness check.",
    )
    parser.add_argument(
        "--preflight-ready-timeout",
        type=int,
        default=DEFAULT_PREFLIGHT_READY_TIMEOUT_SECONDS,
        metavar="SECONDS",
        help=(
            "Wait/retry until the environment is ready before starting (default: 0, indefinitely; "
            "use a positive safety timeout when desired; Ctrl+C remains available)."
        ),
    )
    parser.add_argument(
        "--preflight-retry-interval",
        type=float,
        default=DEFAULT_PREFLIGHT_RETRY_INTERVAL_SECONDS,
        metavar="SECONDS",
        help="Delay between failed readiness checks (default: 10).",
    )
    parser.add_argument(
        "--skip-preflight",
        action="store_true",
        help="Explicit emergency escape hatch; recorded visibly and never implied by dry-run/status.",
    )


def _resolve(root: Path, value: Path) -> Path:
    return value.resolve() if value.is_absolute() else (root / value).resolve()


def _configure_prompt_builder_cli(
    project_root: Path,
    config: Path | None,
    explicit_cli: Path | None = None,
) -> None:
    """Share the configured local Prompt Builder CLI with preflight and the Python client."""
    if explicit_cli is not None:
        cli = _resolve(project_root, explicit_cli)
        if not cli.is_file():
            raise RuntimeError(f"Configured Prompt Builder CLI is missing: {cli}")
        os.environ["VIGILIO_PROMPT_BUILDER_CLI"] = str(cli)
        return
    if config is None or not config.is_file() or os.environ.get("VIGILIO_PROMPT_BUILDER_CLI"):
        return
    for raw_line in config.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key.strip() != "PREFLIGHT_PROMPT_BUILDER_CLI" or not value.strip():
            continue
        cli = _resolve(project_root, Path(value.strip()))
        if not cli.is_file():
            raise RuntimeError(f"Configured Prompt Builder CLI is missing: {cli}")
        os.environ["VIGILIO_PROMPT_BUILDER_CLI"] = str(cli)
        return


def _wsl_path(value: Path) -> str:
    drive = value.drive.rstrip(":").lower()
    if drive:
        suffix = value.as_posix().split(":", 1)[1].lstrip("/")
        return f"/mnt/{drive}/{suffix}"
    return value.as_posix()


def _bash_command(script: Path, project_root: Path, config: Path | None) -> list[str]:
    bash = shutil.which("bash")
    if not bash:
        raise RuntimeError(
            "Runtime preflight requires bash. Install Git Bash/WSL or use --skip-preflight "
            "only for an explicitly reviewed emergency run."
        )
    is_windows_system_bash = os.name == "nt" and Path(bash).resolve().name.lower() == "bash.exe" and (
        "windows\\system32" in str(Path(bash).resolve()).lower()
    )
    if is_windows_system_bash:
        command = [bash, _wsl_path(script), "--project-root", _wsl_path(project_root)]
        if config:
            command.extend(["--config", _wsl_path(config)])
        return command
    command = [bash, str(script), "--project-root", str(project_root)]
    if config:
        command.extend(["--config", str(config)])
    return command


def _powershell_command(script: Path, project_root: Path, config: Path | None) -> list[str]:
    executable = shutil.which("pwsh") or shutil.which("powershell")
    if not executable:
        raise RuntimeError("Runtime preflight requires PowerShell on Windows.")
    command = [
        executable,
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        str(script),
        "-ProjectRoot",
        str(project_root),
    ]
    if config:
        command.extend(["-Config", str(config)])
    return command


def run_runtime_preflight(
    args: argparse.Namespace,
    *,
    project_root: Path,
    runner_os: str,
) -> None:
    if getattr(args, "skip_preflight", False):
        print("WARNING: runtime preflight explicitly skipped (--skip-preflight).")
        return

    project_root = project_root.resolve()
    script = _resolve(project_root, args.preflight_script)
    if os.name == "nt" and script.suffix.lower() == ".sh":
        windows_script = script.with_suffix(".ps1")
        if windows_script.is_file():
            script = windows_script
    if not script.is_file():
        raise RuntimeError(f"Required runtime preflight script is missing: {script}")
    configured_path = getattr(args, "preflight_config", None)
    default_config = _resolve(project_root, DEFAULT_PREFLIGHT_CONFIG)
    config = (
        _resolve(project_root, configured_path)
        if configured_path
        else default_config if default_config.is_file() else None
    )
    if config is not None and not config.is_file():
        raise RuntimeError(f"Runtime preflight config is missing: {config}")
    _configure_prompt_builder_cli(
        project_root,
        config,
        getattr(args, "prompt_builder_cli", None),
    )
    if args.preflight_timeout < 1:
        raise RuntimeError("--preflight-timeout must be at least 1 second")
    ready_timeout = int(
        getattr(args, "preflight_ready_timeout", DEFAULT_PREFLIGHT_READY_TIMEOUT_SECONDS)
    )
    retry_interval = float(
        getattr(args, "preflight_retry_interval", DEFAULT_PREFLIGHT_RETRY_INTERVAL_SECONDS)
    )
    if ready_timeout < 0:
        raise RuntimeError("--preflight-ready-timeout cannot be negative")
    if retry_interval < 0.1:
        raise RuntimeError("--preflight-retry-interval must be at least 0.1 seconds")

    command = (
        _powershell_command(script, project_root, config)
        if script.suffix.lower() == ".ps1"
        else _bash_command(script, project_root, config)
    )
    environment = os.environ.copy()
    environment["VIGILIO_RUNNER_OS"] = runner_os
    assets_path = getattr(args, "assets", None)
    if assets_path is not None:
        environment["PREFLIGHT_ASSETS_DIR"] = str(_resolve(project_root, assets_path))
    started = time.monotonic()
    attempt = 0
    while True:
        attempt += 1
        try:
            completed = subprocess.run(
                command,
                cwd=project_root,
                env=environment,
                text=True,
                encoding="utf-8",
                errors="replace",
                capture_output=True,
                timeout=args.preflight_timeout,
                shell=False,
            )
            output = "\n".join(
                part.strip() for part in (completed.stdout, completed.stderr) if part.strip()
            )
            return_code = completed.returncode
        except subprocess.TimeoutExpired:
            output = f"FAIL: readiness check exceeded {args.preflight_timeout}s: {script}"
            return_code = 124

        if output:
            print(output)
        if return_code == 0:
            print(f"PREFLIGHT READY after {attempt} attempt(s).")
            return

        elapsed = time.monotonic() - started
        if ready_timeout and elapsed >= ready_timeout:
            raise RuntimeError(
                f"Runtime preflight did not become ready within {ready_timeout}s; "
                "Prompt Builder/UI execution was not started. "
                f"See {project_root / '.prompt-runner' / 'preflight-latest.log'}"
            )

        remaining = None if ready_timeout == 0 else max(0.0, ready_timeout - elapsed)
        delay = retry_interval if remaining is None else min(retry_interval, remaining)
        print(
            "PREFLIGHT WAIT: dependencies are not ready; "
            f"retrying in {delay:g}s (attempt {attempt}, Ctrl+C to stop)."
        )
        time.sleep(delay)
