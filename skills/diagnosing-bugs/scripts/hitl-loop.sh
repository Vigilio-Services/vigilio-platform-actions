#!/usr/bin/env bash
# Human-in-the-loop reproduction loop for Vigilio projects.
# Copy this file, edit the steps for your specific bug, and run it.
# The agent runs the script; the user follows prompts in their terminal.
#
# Usage:
#   bash hitl-loop.sh
#
# Two helpers:
#   step "<instruction>"          → show instruction, wait for Enter
#   capture VAR "<question>"      → show question, read response into VAR
#
# At the end, captured values are printed as KEY=VALUE for the agent to parse.

set -euo pipefail

step() {
  printf '\n>>> %s\n' "$1"
  read -r -p "    [Enter when done] " _
}

capture() {
  local var="$1" question="$2" answer
  printf '\n>>> %s\n' "$question"
  read -r -p "    > " answer
  printf -v "$var" '%s' "$answer"
}

# --- project helpers ---

dev_server() {
  # Start the project dev server
  if ! pgrep -f "pnpm start:dev" > /dev/null 2>&1; then
    echo "Starting dev server..."
    pnpm start:dev &
    DEV_PID=$!
    sleep 3
    echo "Dev server started (PID: $DEV_PID)"
  else
    echo "Dev server already running"
  fi
}

db_status() {
  step "Check database connection. Run: pnpm drizzle-kit studio"
}

# --- edit below ---------------------------------------------------------

# Templates for bug scenarios:

# Scenario 1: API endpoint error
# dev_server
# capture HTTP_STATUS "Call the endpoint. What HTTP status did you get? (e.g. 500, 400)"
# capture ERROR_BODY "Paste the response body (or 'empty'):"

# Scenario 2: Database query bug
# db_status
# capture QUERY_RESULT "Run the query in Drizzle Studio. What result do you see?"

# Scenario 3: UI bug (Playwright)
# dev_server
# step "Open the app at http://localhost:5173"
# capture UI_STATE "Describe what you see that looks wrong:"

# --- edit above ---------------------------------------------------------

printf '\n--- Captured bug report ---\n'
printf 'DEV_PID=%s\n' "${DEV_PID:-}"
printf 'HTTP_STATUS=%s\n' "${HTTP_STATUS:-}"
printf 'ERROR_BODY=%s\n' "${ERROR_BODY:-}"
printf 'QUERY_RESULT=%s\n' "${QUERY_RESULT:-}"
printf 'UI_STATE=%s\n' "${UI_STATE:-}"
