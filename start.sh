#!/usr/bin/env bash
# End-User Sovereign — Start Script | 3565
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "  ████████╗██████╗ ██╗   ██╗███████╗███████╗██╗████████╗███████╗"
echo "      ██╔╝██╔══██╗██║   ██║██╔════╝██╔════╝██║╚══██╔══╝██╔════╝"
echo "     ██╔╝ ██████╔╝██║   ██║█████╗  ███████╗██║   ██║   █████╗  "
echo "    ██╔╝  ██╔══██╗██║   ██║██╔══╝  ╚════██║██║   ██║   ██╔══╝  "
echo "   ██╔╝   ██║  ██║╚██████╔╝███████╗███████║██║   ██║   ███████╗"
echo "   ╚═╝    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝╚═╝   ╚═╝   ╚══════╝"
echo ""
echo "  Sovereign AI — End-User Stack | TrueSite Technologies | 3565"
echo ""

# Check Docker
if ! command -v docker &>/dev/null; then
    echo "❌ Docker not found. Install Docker Desktop first: https://docker.com/get-started"
    exit 1
fi

# Install backend deps in background
echo "⚡ Installing dependencies in background..."
bash scripts/install.sh &
INSTALL_PID=$!

# Open setup page
echo "🌐 Opening Setup Page..."
sleep 1

if command -v python3 &>/dev/null; then
    cd setup && python3 setup_server.py &
    SERVER_PID=$!
    sleep 2
    if command -v open &>/dev/null; then open http://localhost:7890
    elif command -v xdg-open &>/dev/null; then xdg-open http://localhost:7890
    elif command -v start &>/dev/null; then start http://localhost:7890
    fi
    cd ..
else
    echo "❌ Python3 not found. Please install Python 3.8+"
    exit 1
fi

echo ""
echo "  → Setup running at http://localhost:7890"
echo "  → Installing deps in background (watch the terminal)"
echo "  → When ready, click LAUNCH MY SYSTEM in the browser"
echo ""
wait $SERVER_PID
