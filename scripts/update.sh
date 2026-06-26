#!/usr/bin/env bash
# Pull latest Sovereign updates | 3565
set -e
echo "[update] Pulling latest Sovereign updates..."
cd "$(dirname "$0")/.."
git pull origin main
echo "[update] Rebuilding agents..."
bash scripts/build.sh
bash scripts/restart_all.sh
echo "[update] ✅ Update complete"
