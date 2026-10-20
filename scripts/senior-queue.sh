#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PLATFORM_ACTIONS_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD=(python3)
elif command -v python >/dev/null 2>&1; then
  PYTHON_CMD=(python)
elif command -v py >/dev/null 2>&1; then
  PYTHON_CMD=(py -3)
else
  printf 'Senior Mode requires Python 3.\n' >&2
  exit 127
fi

exec "${PYTHON_CMD[@]}" "$PLATFORM_ACTIONS_ROOT/senior_queue.py" "$@"
