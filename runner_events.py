"""Versioned, append-only JSONL events for local runner supervision."""

from __future__ import annotations

import json
import os
import re
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


EVENT_SCHEMA_VERSION = 1
_SECRET_RE = re.compile(
    r"(?i)(password|token|secret|cookie|authorization)\s*[:=]\s*([^\s,;]+)"
)


def create_run_id() -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    return f"{stamp}-{uuid.uuid4().hex[:8]}"


def _redact(value: Any) -> Any:
    if isinstance(value, str):
        value = _SECRET_RE.sub(r"\1=[REDACTED]", value)
        value = re.sub(
            r"(?i)(postgres(?:ql)?|redis|https?)://[^\s]+",
            r"\1://[REDACTED]",
            value,
        )
        return value[:8_000]
    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for key, item in value.items():
            label = str(key)
            sanitized[label] = (
                "[REDACTED]"
                if re.search(r"(?i)(password|token|secret|cookie|authorization)", label)
                else _redact(item)
            )
        return sanitized
    if isinstance(value, (list, tuple)):
        return [_redact(item) for item in value]
    if value is None or isinstance(value, (bool, int, float)):
        return value
    return _redact(str(value))


class RunnerEventEmitter:
    """Persist events before exposing them to stdout consumers.

    Human logs remain backwards compatible.  Structured events use a stable
    ``VIGILIO_EVENT `` prefix when stdout emission is enabled, so a GUI never
    has to scrape arbitrary log messages.
    """

    def __init__(
        self,
        path: Path | None,
        *,
        run_id: str | None = None,
        source: str = "python-runner",
        stdout: bool = False,
    ) -> None:
        self.path = path.resolve() if path is not None else None
        self.run_id = (run_id or create_run_id()).strip()
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,127}", self.run_id):
            raise ValueError("run_id must be 1-128 safe identifier characters")
        self.source = source
        self.stdout = stdout
        self._sequence = 0
        self._lock = threading.Lock()
        if self.path is not None:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self._sequence = self._load_existing_sequence()

    def _load_existing_sequence(self) -> int:
        """Resume one run file without duplicating sequence numbers.

        A JSONL file is deliberately single-run.  Mixing run identifiers or
        silently accepting a truncated/corrupt tail would make GUI resume
        ambiguous, so initialization fails closed instead.
        """
        assert self.path is not None
        if not self.path.exists() or self.path.stat().st_size == 0:
            return 0
        last_sequence = 0
        try:
            lines = self.path.read_text(encoding="utf-8").splitlines()
        except OSError as exc:
            raise ValueError(f"cannot read existing runner event file: {self.path}: {exc}") from exc
        for line_number, line in enumerate(lines, start=1):
            try:
                event = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(
                    f"existing runner event file is corrupt at line {line_number}: {self.path}"
                ) from exc
            if not isinstance(event, dict) or event.get("schema_version") != EVENT_SCHEMA_VERSION:
                raise ValueError(
                    f"unsupported runner event schema at line {line_number}: {self.path}"
                )
            if event.get("run_id") != self.run_id:
                raise ValueError(
                    f"runner event file belongs to a different run_id at line {line_number}: {self.path}"
                )
            sequence = event.get("sequence")
            if (
                not isinstance(sequence, int)
                or isinstance(sequence, bool)
                or sequence <= last_sequence
            ):
                raise ValueError(
                    f"runner event sequence is not strictly increasing at line {line_number}: {self.path}"
                )
            last_sequence = sequence
        return last_sequence

    def emit(
        self,
        event: str,
        *,
        severity: str = "INFO",
        pack: str | None = None,
        phase: str | None = None,
        data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if not re.fullmatch(r"[a-z][a-z0-9_.-]{0,95}", event):
            raise ValueError(f"invalid runner event name: {event!r}")
        with self._lock:
            self._sequence += 1
            payload: dict[str, Any] = {
                "schema_version": EVENT_SCHEMA_VERSION,
                "sequence": self._sequence,
                "timestamp": datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace(
                    "+00:00", "Z"
                ),
                "run_id": self.run_id,
                "source": self.source,
                "event": event,
                "severity": severity.upper(),
                "data": _redact(data or {}),
            }
            if pack:
                payload["pack"] = pack
            if phase:
                payload["phase"] = phase
            line = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
            if self.path is not None:
                with self.path.open("a", encoding="utf-8", newline="\n") as handle:
                    handle.write(line + "\n")
                    handle.flush()
                    os.fsync(handle.fileno())
            if self.stdout:
                print(f"VIGILIO_EVENT {line}", flush=True)
            return payload


class Heartbeat:
    """Rate-limited event heartbeat for long visual waits."""

    def __init__(self, emitter: RunnerEventEmitter, interval_seconds: float = 15.0) -> None:
        self.emitter = emitter
        self.interval_seconds = max(5.0, float(interval_seconds))
        self._last = 0.0

    def maybe_emit(self, *, data: dict[str, Any] | None = None) -> None:
        now = time.monotonic()
        if now - self._last < self.interval_seconds:
            return
        self._last = now
        self.emitter.emit("run.heartbeat", data=data or {})
