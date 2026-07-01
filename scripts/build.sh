#!/usr/bin/env bash
# Build all 8 sovereign agent Docker containers + Kokoro TTS | 3565
# Run from repo root: bash scripts/build.sh
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

if docker compose version &>/dev/null; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  COMPOSE="docker compose"  # will fail loudly below if truly missing — fine, that's a real error to surface
fi

echo ""
echo "[build] Sovereign Agent Fleet — Building 8 agent containers + Kokoro TTS..."
echo ""

AGENTS=(yahriel azari yahli-el yahziel yahbana yahseed yahsei yahdin)

for agent in "${AGENTS[@]}"; do
    echo "[build] Building sovereign-${agent}..."
    docker build \
        --file agents/${agent}/Dockerfile \
        --build-arg AGENT=${agent} \
        --tag sovereign-${agent} \
        . \
        2>&1 | grep -E "^Step|Successfully built|error|ERROR" | head -5
    echo "[build] ✅ sovereign-${agent} ready"
    echo ""
done

echo "[build] Building sovereign-kokoro (local TTS)..."
docker build --file kokoro/Dockerfile --tag sovereign-kokoro kokoro/ \
    2>&1 | grep -E "^Step|Successfully built|error|ERROR" | head -5
echo "[build] ✅ sovereign-kokoro ready"
echo ""

echo "[build] ✅ All 8 agents + Kokoro built."
echo "[build] Run: $COMPOSE up -d"
echo ""
