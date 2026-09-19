"""Cross-process lock shared by the ChatGPT docs and prompt queue runners."""

from __future__ import annotations

import os
import time
from pathlib import Path


class RunLock:
    """Fail closed if another process owns the same ChatGPT UI session."""

    def __init__(self, path: Path):
        self.path = path
        self.handle = None
        self._depth = 0

    def __enter__(self):
        if self.handle is not None:
            self._depth += 1
            return self

        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.handle = self.path.open("a+", encoding="utf-8")
        try:
            if os.name == "posix":
                import fcntl  # type: ignore

                fcntl.flock(self.handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            elif os.name == "nt":
                import msvcrt  # type: ignore

                # msvcrt can only lock an existing byte. Always lock byte zero,
                # never the append-mode EOF offset.
                self.handle.seek(0, os.SEEK_END)
                if self.handle.tell() == 0:
                    self.handle.write("\n")
                    self.handle.flush()
                self.handle.seek(0)
                msvcrt.locking(self.handle.fileno(), msvcrt.LK_NBLCK, 1)
        except Exception as exc:
            self.handle.close()
            self.handle = None
            raise RuntimeError(
                f"Another ChatGPT automation runner appears to be active: {self.path}"
            ) from exc

        self.handle.seek(0)
        self.handle.truncate()
        self.handle.write(f"pid={os.getpid()} started={time.strftime('%Y-%m-%dT%H:%M:%S%z')}\n")
        self.handle.flush()
        self._depth = 1
        return self

    def __exit__(self, exc_type, exc, tb):
        if not self.handle:
            return
        self._depth -= 1
        if self._depth > 0:
            return
        try:
            if os.name == "posix":
                import fcntl  # type: ignore

                fcntl.flock(self.handle.fileno(), fcntl.LOCK_UN)
            elif os.name == "nt":
                import msvcrt  # type: ignore

                self.handle.seek(0)
                msvcrt.locking(self.handle.fileno(), msvcrt.LK_UNLCK, 1)
        finally:
            self.handle.close()
            self.handle = None
            self._depth = 0
