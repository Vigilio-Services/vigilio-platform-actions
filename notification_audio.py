"""Short, non-blocking READY/BLOCKED audio notifications."""

from __future__ import annotations

import argparse
import logging
import os
import shutil
import subprocess
import time
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_READY_SOUND = SCRIPT_DIR / "assets" / "sounds" / "ready.wav"
DEFAULT_BLOCKED_SOUND = SCRIPT_DIR / "assets" / "sounds" / "blocked.wav"


def add_audio_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--no-sound", action="store_true", help="Disable READY/BLOCKED sounds.")
    parser.add_argument("--ready-sound", type=Path, default=DEFAULT_READY_SOUND)
    parser.add_argument("--blocked-sound", type=Path, default=DEFAULT_BLOCKED_SOUND)
    parser.add_argument(
        "--sound-min-interval-seconds",
        type=float,
        default=2.0,
        help="Minimum interval between equal notification sounds (default: 2 seconds).",
    )


class NotificationAudio:
    def __init__(
        self,
        *,
        enabled: bool,
        ready: Path,
        blocked: Path,
        min_interval_seconds: float = 2.0,
    ) -> None:
        self.enabled = enabled
        self.ready = ready.resolve()
        self.blocked = blocked.resolve()
        self.min_interval_seconds = max(0.0, float(min_interval_seconds))
        self._last_played: dict[Path, float] = {}

    @classmethod
    def from_args(cls, args: argparse.Namespace) -> "NotificationAudio":
        return cls(
            enabled=not getattr(args, "no_sound", False),
            ready=args.ready_sound,
            blocked=args.blocked_sound,
            min_interval_seconds=getattr(args, "sound_min_interval_seconds", 2.0),
        )

    def ready_signal(self) -> None:
        self._play(self.ready, fallback_frequency=880)

    def blocked_signal(self) -> None:
        self._play(self.blocked, fallback_frequency=330)

    def _play(self, sound: Path, *, fallback_frequency: int) -> None:
        if not self.enabled:
            return
        now = time.monotonic()
        previous = self._last_played.get(sound, 0.0)
        if now - previous < self.min_interval_seconds:
            logging.info("Notification sound rate-limited: %s", sound.name)
            return
        self._last_played[sound] = now
        if not sound.is_file():
            logging.warning("Notification sound missing: %s", sound)
            self._fallback(fallback_frequency)
            return
        try:
            if os.name == "nt":
                import winsound

                winsound.PlaySound(
                    str(sound),
                    winsound.SND_FILENAME | winsound.SND_ASYNC | winsound.SND_NODEFAULT,
                )
                return
            for command in ("paplay", "aplay"):
                executable = shutil.which(command)
                if executable:
                    subprocess.Popen(
                        [executable, str(sound)],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        start_new_session=True,
                    )
                    return
            ffplay = shutil.which("ffplay")
            if ffplay:
                subprocess.Popen(
                    [ffplay, "-nodisp", "-autoexit", "-loglevel", "quiet", str(sound)],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    start_new_session=True,
                )
                return
            self._fallback(fallback_frequency)
        except Exception as exc:
            logging.warning("Could not play notification sound %s: %s", sound, exc)
            self._fallback(fallback_frequency)

    @staticmethod
    def _fallback(frequency: int) -> None:
        try:
            if os.name == "nt":
                import winsound

                winsound.Beep(frequency, 180)
            else:
                print("\a", end="", flush=True)
        except Exception:
            pass
