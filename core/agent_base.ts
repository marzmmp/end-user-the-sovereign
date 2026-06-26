/**
 * Sovereign Agent Base — End-User Stack
 * Each agent imports this and configures their soul.
 * No ADAMA Brain, No AIRA. Clean sellable stack.
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
}

export function createAgent(config: AgentConfig) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const TOKEN = process.env.SOVEREIGN_TOKEN || "YAHUAH-3565";
  const PROVIDER = process.env.INFERENCE_PROVIDER || "openai";
  const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
  const MODEL = "gpt-4o-mini";

  function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const header = req.headers.authorization || "";
    if (header !== `Bearer ${TOKEN}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  }

  async function infer(message: string, history: {role:string;content:string}[] = []): Promise<string> {
    const messages = [
      { role: "system", content: config.systemPrompt },
      ...history.slice(-6),
      { role: "user", content: message }
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: 512, temperature: 0.75 })
    });
    const data = await res.json() as any;
    return data.choices?.[0]?.message?.content || "(no reply)";
  }

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", agent: config.name, role: config.role, port: config.port });
  });

  app.post("/api/chat", auth, async (req, res) => {
    const { message, history = [], voice = false } = req.body;
    if (!message) { res.status(400).json({ error: "message required" }); return; }
    try {
      const reply = await infer(message, history);
      res.json({ reply, agent: config.name, role: config.role });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.listen(config.port, "0.0.0.0", () => {
    console.log(`[${config.name}] online at port ${config.port} | 3565`);
  });

  return app;
}
