/**
 * Sovereign Agent Base — End-User Stack
 * Multi-provider inference (OpenAI / NVIDIA NIM / Ollama) + web search tool calling
 * + optional voice replies (Kokoro local TTS or ElevenLabs cloud TTS).
 * No ADAMA Brain, No AIRA, no proprietary graph. Clean sellable stack.
 * 3565
 */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

export interface AgentConfig {
  name: string;
  role: string;
  port: number;
  systemPrompt: string;
  defaultVoice?: string; // Kokoro voice id, e.g. "af_heart" — optional per-agent override
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information, news, research, or any real-time data.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          provider: { type: "string", enum: ["brave", "tavily"], description: "Search provider" }
        },
        required: ["query"]
      }
    }
  }
];

async function webSearch(query: string, provider = "brave"): Promise<string> {
  const BRAVE_KEY  = process.env.BRAVE_API_KEY || "";
  const TAVILY_KEY = process.env.TAVILY_API_KEY || "";

  if (provider === "tavily" && TAVILY_KEY) {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: TAVILY_KEY, query, max_results: 5 })
    });
    const d = await r.json() as any;
    return (d.results || []).map((x: any) => `${x.title}: ${x.content}`).join("\n").slice(0, 2000);
  }

  if (BRAVE_KEY) {
    const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
      headers: { "Accept": "application/json", "X-Subscription-Token": BRAVE_KEY }
    });
    const d = await r.json() as any;
    return (d.web?.results || []).map((x: any) => `${x.title}: ${x.description}`).join("\n").slice(0, 2000);
  }
  return "Search unavailable — no API key configured.";
}

// Strips common LLM artifacts (stray markdown fences, repeated whitespace,
// leaked role tags) before a reply is shown or spoken. Cheap, always run it.
function cleanReply(text: string): string {
  if (!text) return text;
  return text
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/^(assistant|system)\s*:\s*/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Provider-agnostic LLM call ────────────────────────────────────────────────
// All three providers speak the OpenAI chat-completions wire format, so one
// function handles all of them — only base URL, auth header, and model differ.
interface ProviderConfig { baseUrl: string; apiKey: string; model: string; authHeader: string; }

function resolveProvider(): ProviderConfig {
  const provider = (process.env.INFERENCE_PROVIDER || "openai").toLowerCase();

  if (provider === "nvidia_nim" || provider === "nim") {
    return {
      baseUrl: "https://integrate.api.nvidia.com/v1/chat/completions",
      apiKey: process.env.NVIDIA_NIM_API_KEY || "",
      model: process.env.NVIDIA_NIM_MODEL || "meta/llama-3.1-70b-instruct",
      authHeader: `Bearer ${process.env.NVIDIA_NIM_API_KEY || ""}`,
    };
  }
  if (provider === "ollama") {
    const host = process.env.OLLAMA_HOST || "http://host.docker.internal:11434";
    return {
      baseUrl: `${host.replace(/\/$/, "")}/v1/chat/completions`,
      apiKey: "",
      model: process.env.OLLAMA_MODEL || "llama3.1:8b",
      authHeader: "", // Ollama's OpenAI-compat endpoint doesn't require auth
    };
  }
  // default: openai
  return {
    baseUrl: "https://api.openai.com/v1/chat/completions",
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    authHeader: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
  };
}

async function callLLM(messages: any[], tools?: any[]): Promise<any> {
  const p = resolveProvider();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (p.authHeader) headers["Authorization"] = p.authHeader;

  const payload: any = { model: p.model, messages, max_tokens: 1024, temperature: 0.75 };
  if (tools) { payload.tools = tools; payload.tool_choice = "auto"; }

  const res = await fetch(p.baseUrl, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`${p.model} provider error (${res.status}): ${errBody.slice(0, 300)}`);
  }
  return res.json();
}

// ── Voice — Kokoro (local, free) or ElevenLabs (cloud, paid key) ─────────────
async function synthesizeSpeech(text: string, voice?: string): Promise<{ buffer: Buffer; mime: string } | null> {
  const ttsProvider = (process.env.TTS_PROVIDER || "elevenlabs").toLowerCase();

  if (ttsProvider === "kokoro") {
    const host = process.env.KOKORO_HOST || "http://kokoro:7960";
    const r = await fetch(`${host.replace(/\/$/, "")}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: voice || "af_heart", speed: 1.0 })
    });
    if (!r.ok) throw new Error(`Kokoro TTS error (${r.status})`);
    const arr = await r.arrayBuffer();
    return { buffer: Buffer.from(arr), mime: "audio/wav" };
  }

  const key = process.env.ELEVENLABS_API_KEY || "";
  if (!key) return null; // no TTS configured — caller should treat as "voice unavailable"
  const voiceId = voice || "21m00Tcm4TlvDq8ikWAM"; // "Rachel" default public voice id
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg" },
    body: JSON.stringify({ text, model_id: "eleven_turbo_v2_5" })
  });
  if (!r.ok) throw new Error(`ElevenLabs TTS error (${r.status})`);
  const arr = await r.arrayBuffer();
  return { buffer: Buffer.from(arr), mime: "audio/mpeg" };
}

export function createAgent(config: AgentConfig) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const TOKEN = process.env.SOVEREIGN_TOKEN || "YAHUAH-3565";

  function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const header = req.headers.authorization || "";
    if (header !== `Bearer ${TOKEN}`) { res.status(401).json({ error: "Unauthorized" }); return; }
    next();
  }

  async function infer(message: string, history: {role:string;content:string}[] = []): Promise<string> {
    const messages: any[] = [
      { role: "system", content: config.systemPrompt },
      ...history.slice(-8),
      { role: "user", content: message }
    ];

    // First call — with tools
    const d1 = await callLLM(messages, TOOLS);
    const choice = d1.choices?.[0];

    // If tool call requested, execute it and get final reply
    if (choice?.finish_reason === "tool_calls" && choice?.message?.tool_calls?.length) {
      const toolCall = choice.message.tool_calls[0];
      const args     = JSON.parse(toolCall.function.arguments || "{}");
      const result   = await webSearch(args.query || message, args.provider || "brave");

      messages.push(choice.message);
      messages.push({ role: "tool", tool_call_id: toolCall.id, content: result });

      const d2 = await callLLM(messages);
      return cleanReply(d2.choices?.[0]?.message?.content || "(no reply)");
    }

    return cleanReply(choice?.message?.content || "(no reply)");
  }

  app.get("/health", (_req, res) => {
    const provider = (process.env.INFERENCE_PROVIDER || "openai").toLowerCase();
    const tts      = (process.env.TTS_PROVIDER || "elevenlabs").toLowerCase();
    res.json({
      status: "ok",
      agent: config.name,
      role: config.role,
      port: config.port,
      tools: ["web_search"],
      inference_provider: provider,
      tts_provider: tts,
    });
  });

  app.post("/api/chat", auth, async (req, res) => {
    const { message, history = [] } = req.body;
    if (!message) { res.status(400).json({ error: "message required" }); return; }
    try {
      const reply = await infer(message, history);
      res.json({ reply, agent: config.name, role: config.role });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Text-to-speech for a given reply. Returns raw audio bytes (wav or mp3
  // depending on provider). Callers should treat a 501 as "voice not configured"
  // rather than an error — that's an expected, valid state.
  app.post("/api/speak", auth, async (req, res) => {
    const { text, voice } = req.body;
    if (!text) { res.status(400).json({ error: "text required" }); return; }
    try {
      const audio = await synthesizeSpeech(text, voice || config.defaultVoice);
      if (!audio) { res.status(501).json({ error: "No TTS provider configured (set TTS_PROVIDER=kokoro or add an ElevenLabs key)" }); return; }
      res.set("Content-Type", audio.mime);
      res.send(audio.buffer);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.listen(config.port, "0.0.0.0", () => {
    const provider = (process.env.INFERENCE_PROVIDER || "openai").toLowerCase();
    console.log(`[${config.name}] online @ port ${config.port} | provider: ${provider} | tools: web_search | 3565`);
  });

  return app;
}
