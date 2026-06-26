#!/usr/bin/env bash
# Build all 8 agent Docker containers | 3565
set -e
echo "[build] Building Sovereign agent fleet..."
cd "$(dirname "$0")/.."

for agent in yahriel azari yahli-el yahziel yahbana yahseed yahsei yahdin; do
    echo "[build] Building $agent..."
    docker build -t sovereign-$agent ./agents/$agent 2>&1 | tail -2
    echo "[build] ✅ $agent built"
done

echo "[build] ✅ All 8 agents built"
