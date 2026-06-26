#!/usr/bin/env bash
# Background installer — runs while user fills setup page
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "[install] Starting dependency installation..."

# Install Python deps for ingest CLI
if command -v pip3 &>/dev/null; then
    pip3 install -q pypdf2 python-docx markdown requests 2>/dev/null && echo "[install] ✅ Python deps ready"
fi

# Pull Docker images in background
echo "[install] Pulling Docker base images..."
docker pull python:3.11-slim 2>/dev/null && echo "[install] ✅ Python image ready"
docker pull node:20-alpine 2>/dev/null && echo "[install] ✅ Node image ready"

echo "[install] ✅ All dependencies ready"
