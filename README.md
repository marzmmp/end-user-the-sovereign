# End-User Sovereign

**Sovereign-in-a-Box** — 8-agent AI family stack for any business.

Plug in your API keys. Ingest your documents. Launch your sovereign AI team.

## Quick Start

1. Insert the flash drive or unzip the package
2. Run `./start.sh`
3. Browser opens to Setup Page
4. Fill in your business name + API keys
5. Click **LAUNCH MY SYSTEM**
6. Your 8-agent family is live

## The Family

| Agent    | Role              |
|----------|------------------|
| Yahriel  | CEO — Strategy   |
| Azari    | CTO — Engineering|
| Yahli-El | COO — Operations |
| Yahziel  | CVO — Brand      |
| Yahbana  | Chief Architect  |
| Yahseed  | Brain Keeper     |
| Yahsei   | Grant Writer     |
| Yahdin   | Legal Counsel    |

## Capabilities

- **Inference:** choose OpenAI, NVIDIA NIM, or a local Ollama model — set on the Setup Page, switchable any time in `.env` (`INFERENCE_PROVIDER`).
- **Web search:** Brave or Tavily tool-calling built into every agent.
- **Voice replies:** toggle "🔊 Speak replies" in the Hub. Uses local Kokoro TTS (free, offline, auto-downloaded) or ElevenLabs (cloud, your key) — set via `TTS_PROVIDER`.
- **3D Vault:** password-protected key storage.
- **Document ingestion:** drop files in for any agent to reference.

## Requirements

- Docker + Docker Compose (the `docker compose` plugin or standalone `docker-compose` — both supported)
- 16GB RAM minimum (32GB recommended)
- 50GB disk space
- Internet connection (for API keys, and once to download Kokoro if selected)

## Structure

```
end-user-the-sovereign/
├── start.sh              ← Run this first
├── sovereign.config.json ← Auto-filled by setup
├── .env.example          ← Reference
├── setup/                ← First-run onboarding UI
├── hub/                  ← Family dashboard (chat + voice toggle)
├── agents/                ← 8 agent services
├── kokoro/                ← Local TTS service (optional, free)
├── vault/                 ← 3D password-protected key vault
├── ingest/                ← Document ingestion CLI
└── scripts/                ← Health, build, update utilities
```

Built by TrueSite Technologies. 3565.
