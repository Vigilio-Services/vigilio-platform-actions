#!/usr/bin/env bash
set -euo pipefail

not_run=0
blocked=0

# PostgreSQL check
if [ -n "${PGHOST:-}" ]; then
  echo "Checking PostgreSQL at $PGHOST..."
else
  not_run=$((not_run + 1))
  if [ "${VIGILIO_REQUIRE_PG:-0}" = "1" ]; then
    echo "BLOCKED: PostgreSQL is required but PGHOST is not set."
    blocked=$((blocked + 1))
  fi
fi

# Redis check
if [ -n "${REDIS_HOST:-}" ]; then
  echo "Checking Redis at $REDIS_HOST..."
else
  not_run=$((not_run + 1))
  if [ "${VIGILIO_REQUIRE_REDIS:-0}" = "1" ]; then
    echo "BLOCKED: Redis is required but REDIS_HOST is not set."
    blocked=$((blocked + 1))
  fi
fi

# HTTP Health check
if [ -n "${HTTP_HEALTH_URL:-}" ]; then
  echo "Checking HTTP health at $HTTP_HEALTH_URL..."
else
  not_run=$((not_run + 1))
  if [ "${VIGILIO_REQUIRE_HTTP:-0}" = "1" ]; then
    echo "BLOCKED: HTTP endpoint is required but HTTP_HEALTH_URL is not set."
    blocked=$((blocked + 1))
  fi
fi

# AWS check
if [ "${AWS_CHECK:-0}" = "1" ]; then
  echo "Checking AWS connectivity..."
else
  not_run=$((not_run + 1))
  if [ "${VIGILIO_REQUIRE_AWS:-0}" = "1" ]; then
    echo "BLOCKED: AWS is required but AWS_CHECK is not enabled."
    blocked=$((blocked + 1))
  fi
fi

echo "Preflight check summary: NOT_RUN=$not_run BLOCKED=$blocked"

if [ "$blocked" -gt 0 ]; then
  exit 2
fi

exit 0
