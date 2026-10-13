#!/usr/bin/env bash
# Runtime readiness gate scaffolded by Vigilio Prompt Builder.
# It only writes its report plus short-lived permission probes that it removes immediately.
set -uo pipefail

ROOT="."
CONFIG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-root) ROOT="${2:-.}"; shift 2 ;;
    --config) CONFIG="${2:-}"; shift 2 ;;
    *) printf 'FAIL: unsupported preflight argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

cd "$ROOT" || { printf 'FAIL: project root is unavailable\n' >&2; exit 1; }
mkdir -p .prompt-runner
REPORT=".prompt-runner/preflight-latest.log"
exec > >(tee "$REPORT") 2>&1

CONFIG="${CONFIG:-scripts/preflight-services.env}"
FAIL=0
WARN=0
ok() { printf 'OK: %s\n' "$1"; }
bad() { printf 'FAIL: %s\n' "$1"; FAIL=1; }
warn() { printf 'WARN: %s\n' "$1"; WARN=$((WARN + 1)); }
section() { printf '\n=== %s ===\n' "$1"; }

load_config() {
  [[ -f "$CONFIG" ]] || return 0
  while IFS='=' read -r key value; do
    key="${key%%[[:space:]]*}"
    [[ -z "$key" || "$key" == \#* ]] && continue
    case "$key" in
      PREFLIGHT_REQUIRE_POSTGRES|PREFLIGHT_POSTGRES_URL_ENV|PREFLIGHT_REQUIRE_REDIS|PREFLIGHT_REDIS_URL_ENV|PREFLIGHT_REQUIRE_DOCKER|PREFLIGHT_REQUIRE_UI|PREFLIGHT_REQUIRE_TARGET_PROFILES|PREFLIGHT_ASSETS_DIR|PREFLIGHT_REQUIRED_FILES|PREFLIGHT_REQUIRED_DIRECTORIES|PREFLIGHT_REQUIRED_WRITABLE_DIRECTORIES|PREFLIGHT_REQUIRED_TCP|PREFLIGHT_REQUIRED_HTTP|PREFLIGHT_REQUIRED_PROCESSES|PREFLIGHT_PROMPT_BUILDER_VERSION|PREFLIGHT_PROMPT_BUILDER_CLI)
        printf -v "$key" '%s' "$value"
        export "$key"
        ;;
      *) bad "unsupported key in $CONFIG: $key" ;;
    esac
  done < "$CONFIG"
}

policy_required() {
  local policy="${1:-auto}" signal="${2:-}"
  case "${policy,,}" in
    true|1|yes|required) return 0 ;;
    false|0|no|disabled) return 1 ;;
    auto) [[ -n "$signal" ]] ;;
    *) bad "invalid readiness policy: $policy"; return 1 ;;
  esac
}

indirect_value() {
  local name="${1:-}"
  [[ -n "$name" ]] || return 0
  printf '%s' "${!name:-}"
}

split_specs() {
  local raw="${1:-}"
  IFS=';' read -r -a SPECS <<< "$raw"
}

check_tcp() {
  local name="$1" target="$2" host="${2%:*}" port="${2##*:}"
  if [[ -z "$host" || -z "$port" || "$host" == "$port" ]]; then
    bad "$name has invalid TCP target"
    return
  fi
  if command -v nc >/dev/null 2>&1; then
    nc -z -w 3 "$host" "$port" >/dev/null 2>&1 && ok "$name TCP ready" || bad "$name TCP unavailable"
  elif command -v timeout >/dev/null 2>&1; then
    timeout 3 bash -c "</dev/tcp/$host/$port" >/dev/null 2>&1 && ok "$name TCP ready" || bad "$name TCP unavailable"
  else
    bad "$name cannot be checked: nc/timeout unavailable"
  fi
}

test_writable_directory() {
  local target="$1" probe
  [[ -d "$target" ]] || return 1
  probe="$target/.vigilio-write-probe-$$-${RANDOM:-0}.tmp"
  if (umask 077; : > "$probe") 2>/dev/null; then
    rm -f -- "$probe"
    return 0
  fi
  rm -f -- "$probe" 2>/dev/null || true
  return 1
}

process_running() {
  local pattern="$1"
  pgrep -f "$pattern" >/dev/null 2>&1 && return 0
  command -v tasklist.exe >/dev/null 2>&1 && tasklist.exe 2>/dev/null | tr -d '\r' | grep -Eiq "$pattern"
}

PREFLIGHT_REQUIRE_POSTGRES="${PREFLIGHT_REQUIRE_POSTGRES:-auto}"
PREFLIGHT_POSTGRES_URL_ENV="${PREFLIGHT_POSTGRES_URL_ENV:-DATABASE_URL}"
PREFLIGHT_REQUIRE_REDIS="${PREFLIGHT_REQUIRE_REDIS:-auto}"
PREFLIGHT_REDIS_URL_ENV="${PREFLIGHT_REDIS_URL_ENV:-REDIS_URL}"
PREFLIGHT_REQUIRE_DOCKER="${PREFLIGHT_REQUIRE_DOCKER:-auto}"
PREFLIGHT_REQUIRE_UI="${PREFLIGHT_REQUIRE_UI:-auto}"
PREFLIGHT_REQUIRE_TARGET_PROFILES="${PREFLIGHT_REQUIRE_TARGET_PROFILES:-auto}"
PREFLIGHT_ASSETS_DIR="${PREFLIGHT_ASSETS_DIR:-assets}"
PREFLIGHT_PROMPT_BUILDER_VERSION="${PREFLIGHT_PROMPT_BUILDER_VERSION:-{{PROMPT_BUILDER_VERSION}}}"
PREFLIGHT_PROMPT_BUILDER_CLI="${PREFLIGHT_PROMPT_BUILDER_CLI:-${VIGILIO_PROMPT_BUILDER_CLI:-}}"
PREFLIGHT_REQUIRED_FILES="${PREFLIGHT_REQUIRED_FILES:-}"
PREFLIGHT_REQUIRED_DIRECTORIES="${PREFLIGHT_REQUIRED_DIRECTORIES:-}"
PREFLIGHT_REQUIRED_WRITABLE_DIRECTORIES="${PREFLIGHT_REQUIRED_WRITABLE_DIRECTORIES:-}"
PREFLIGHT_REQUIRED_TCP="${PREFLIGHT_REQUIRED_TCP:-}"
PREFLIGHT_REQUIRED_HTTP="${PREFLIGHT_REQUIRED_HTTP:-}"
PREFLIGHT_REQUIRED_PROCESSES="${PREFLIGHT_REQUIRED_PROCESSES:-}"
load_config

printf 'VIGILIO PREFLIGHT %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf 'project_root=%s config=%s runner_os=%s\n' "$PWD" "$CONFIG" "${VIGILIO_RUNNER_OS:-unknown}"

section "Toolchain and canonical control plane"
command -v node >/dev/null 2>&1 && ok "node $(node --version)" || bad "node unavailable"
command -v pnpm >/dev/null 2>&1 && ok "pnpm $(pnpm --version)" || bad "pnpm unavailable"
for file in docs/rules/registry.yaml docs/rules/answers.md docs/rules/factory-baseline.yaml; do
  [[ -s "$file" ]] && ok "$file" || bad "$file missing or empty"
done
TARGET_PROFILES_SIGNAL=""
[[ -s docs/rules/target-profiles.yaml ]] && TARGET_PROFILES_SIGNAL="present"
if policy_required "$PREFLIGHT_REQUIRE_TARGET_PROFILES" "$TARGET_PROFILES_SIGNAL"; then
  [[ -s docs/rules/target-profiles.yaml ]] && ok "docs/rules/target-profiles.yaml" || bad "docs/rules/target-profiles.yaml missing or empty"
else
  warn "target profiles not required by current policy; pack eligibility remains authoritative"
fi
if [[ -n "$PREFLIGHT_PROMPT_BUILDER_CLI" ]]; then
  PB_CLI="$PREFLIGHT_PROMPT_BUILDER_CLI"
  [[ "$PB_CLI" = /* ]] || PB_CLI="$PWD/$PB_CLI"
  PB="$(node "$PB_CLI" --version 2>/dev/null || true)"
  [[ "$PB" == "$PREFLIGHT_PROMPT_BUILDER_VERSION" ]] && ok "vigilio-prompt $PB" || bad "vigilio-prompt unavailable/mismatch"
elif command -v pnpm >/dev/null 2>&1; then
  PB="$(pnpm exec vigilio-prompt --version 2>/dev/null || true)"
  [[ "$PB" == "$PREFLIGHT_PROMPT_BUILDER_VERSION" ]] && ok "vigilio-prompt $PB" || bad "vigilio-prompt unavailable/mismatch"
else bad "vigilio-prompt unavailable/mismatch"; fi

section "Container runtime"
DOCKER_SIGNAL="${DOCKER_HOST:-}"
if policy_required "$PREFLIGHT_REQUIRE_DOCKER" "$DOCKER_SIGNAL"; then
  command -v docker >/dev/null 2>&1 || bad "docker CLI unavailable"
  command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1 && ok "docker daemon ready" || bad "docker daemon unavailable"
else
  warn "docker not required by current policy"
fi

section "PostgreSQL"
POSTGRES_URL="$(indirect_value "$PREFLIGHT_POSTGRES_URL_ENV")"
if policy_required "$PREFLIGHT_REQUIRE_POSTGRES" "$POSTGRES_URL"; then
  if ! command -v pg_isready >/dev/null 2>&1; then
    check_tcp "postgres" "127.0.0.1:5432"
  elif [[ -n "$POSTGRES_URL" ]]; then
    pg_isready -d "$POSTGRES_URL" >/dev/null 2>&1 && ok "postgres ready" || bad "postgres unavailable"
  else
    pg_isready >/dev/null 2>&1 && ok "postgres ready" || bad "postgres unavailable"
  fi
else
  warn "postgres not required by current policy"
fi

section "Redis/Valkey"
REDIS_URL="$(indirect_value "$PREFLIGHT_REDIS_URL_ENV")"
if policy_required "$PREFLIGHT_REQUIRE_REDIS" "$REDIS_URL"; then
  if ! command -v redis-cli >/dev/null 2>&1; then
    check_tcp "redis" "127.0.0.1:6379"
  elif [[ -n "$REDIS_URL" ]]; then
    [[ "$(redis-cli -u "$REDIS_URL" --no-auth-warning ping 2>/dev/null)" == "PONG" ]] && ok "redis ready" || bad "redis unavailable"
  else
    [[ "$(redis-cli ping 2>/dev/null)" == "PONG" ]] && ok "redis ready" || bad "redis unavailable"
  fi
else
  warn "redis not required by current policy"
fi

section "Declared files/directories/services"
split_specs "$PREFLIGHT_REQUIRED_DIRECTORIES"
for spec in "${SPECS[@]}"; do
  [[ -z "$spec" ]] && continue
  name="${spec%%=*}"; target="${spec#*=}"
  [[ "$name" != "$target" && -d "$target" ]] && ok "$name directory ready" || bad "$name directory missing"
done
split_specs "$PREFLIGHT_REQUIRED_WRITABLE_DIRECTORIES"
for spec in "${SPECS[@]}"; do
  [[ -z "$spec" ]] && continue
  name="${spec%%=*}"; target="${spec#*=}"
  [[ "$name" != "$target" ]] && test_writable_directory "$target" && ok "$name directory writable" || bad "$name directory is not writable"
done
split_specs "$PREFLIGHT_REQUIRED_FILES"
for spec in "${SPECS[@]}"; do
  [[ -z "$spec" ]] && continue
  name="${spec%%=*}"; target="${spec#*=}"
  [[ "$name" != "$target" && -s "$target" ]] && ok "$name file ready" || bad "$name file missing or empty"
done
split_specs "$PREFLIGHT_REQUIRED_TCP"
for spec in "${SPECS[@]}"; do
  [[ -z "$spec" ]] && continue
  check_tcp "${spec%%=*}" "${spec#*=}"
done
split_specs "$PREFLIGHT_REQUIRED_HTTP"
for spec in "${SPECS[@]}"; do
  [[ -z "$spec" ]] && continue
  name="${spec%%=*}"; url="${spec#*=}"
  command -v curl >/dev/null 2>&1 || { bad "$name cannot be checked: curl unavailable"; continue; }
  curl --silent --show-error --fail --max-time 5 "$url" >/dev/null 2>&1 && ok "$name HTTP ready" || bad "$name HTTP unavailable"
done
split_specs "$PREFLIGHT_REQUIRED_PROCESSES"
for spec in "${SPECS[@]}"; do
  [[ -z "$spec" ]] && continue
  name="${spec%%=*}"; pattern="${spec#*=}"
  process_running "$pattern" && ok "$name process ready" || bad "$name process unavailable"
done

section "ChatGPT UI prerequisites"
UI_SIGNAL=""
[[ "${VIGILIO_RUNNER_OS:-}" == "windows" || -n "${DISPLAY:-}" ]] && UI_SIGNAL="configured"
if policy_required "$PREFLIGHT_REQUIRE_UI" "$UI_SIGNAL"; then
  if [[ "${VIGILIO_RUNNER_OS:-linux}" == "linux" ]]; then
    [[ -n "${DISPLAY:-}" ]] && ok "DISPLAY configured" || bad "DISPLAY unavailable"
  fi
  for asset in chat-gpt-search-1.png chat-gpt-button-send.png chat-gpt-4-likes.png; do
    asset="$PREFLIGHT_ASSETS_DIR/$asset"
    [[ -s "$asset" ]] && ok "$asset" || bad "$asset missing"
  done
  [[ -s "$PREFLIGHT_ASSETS_DIR/chat-gpt-6-likes.png" || -s "$PREFLIGHT_ASSETS_DIR/chat-gpt-6-likes.jpg" ]] && ok "READY asset" || bad "READY asset missing"
else
  warn "UI readiness not required by current policy"
fi

printf '\nPREFLIGHT-ENV: %s (warnings=%d report=%s)\n' "$([[ "$FAIL" -eq 0 ]] && echo PASS || echo FAIL)" "$WARN" "$REPORT"
exit "$FAIL"
