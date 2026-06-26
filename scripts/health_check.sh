#!/usr/bin/env bash
# Sovereign Health Check | 3565
echo ""
echo "=== SOVEREIGN HEALTH CHECK ==="
echo ""

AGENTS=(
  "Yahriel CEO 7001"
  "Azari CTO 7002"
  "Yahli-El COO 7003"
  "Yahziel CVO 7004"
  "Yahbana Architect 7005"
  "Yahseed Brain 7006"
  "Yahsei Grants 7007"
  "Yahdin Legal 7008"
)

ONLINE=0
TOTAL=${#AGENTS[@]}

for agent_str in "${AGENTS[@]}"; do
  read -r name role port <<< "$agent_str"
  if curl -sf "http://localhost:$port/health" --max-time 3 &>/dev/null; then
    echo "  ✅ $name ($role) — port $port"
    ((ONLINE++))
  else
    echo "  ❌ $name ($role) — port $port DOWN"
  fi
done

echo ""
echo "  $ONLINE/$TOTAL agents online"
echo ""
