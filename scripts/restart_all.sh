#!/usr/bin/env bash
# Restart all sovereign containers | 3565
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

# Modern Docker installs ship the "docker compose" plugin; older ones ship
# the standalone "docker-compose" binary. Support both transparently.
if docker compose version &>/dev/null; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  echo "❌ Neither 'docker compose' nor 'docker-compose' found. Install Docker Desktop / Docker Engine + Compose plugin."
  exit 1
fi

$COMPOSE down && $COMPOSE up -d
echo "[restart] ✅ All containers restarted"
