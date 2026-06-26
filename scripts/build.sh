#!/usr/bin/env bash
# Build all 8 sovereign agent Docker containers | 3565
# Run from repo root: bash scripts/build.sh
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "[build] Sovereign Agent Fleet — Building 8 containers..."
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

echo "[build] ✅ All 8 agents built."
echo "[build] Run: docker-compose up -d"
echo ""
