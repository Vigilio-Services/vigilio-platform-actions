$ErrorActionPreference = 'Stop'

$platformActionsRoot = Split-Path -Parent $PSScriptRoot
$python = Get-Command python -ErrorAction Stop
& $python.Source (Join-Path $platformActionsRoot 'senior_queue.py') @args
exit $LASTEXITCODE
