#!/usr/bin/env bash
# Restart all sovereign containers | 3565
docker-compose down && docker-compose up -d
echo "[restart] ✅ All containers restarted"
