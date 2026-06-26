/**
 * Sovereign Agent Base — End-User Stack
 * OpenAI-powered with Brave + Tavily search tool calling.
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
  const BRAVE_KEY   = process.env.BRAVE_API_KEY || "";
  const TAVILY_KEY  = process.env.TAVILY_API_KEY || "";

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

export function createAgent(config: AgentConfig) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const TOKEN      = process.env.SOVEREIGN_TOKEN || "YAHUAH-3565";
  const OPENAI_KEY = process.env.OPENAI_API_KEY  || "";
  const MODEL      = "gpt-4o-mini";

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
    const res1 = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, tool_choice: "auto", max_tokens: 1024, temperature: 0.75 })
    });
    const d1 = await res1.json() as any;
    const choice = d1.choices?.[0];

    // If tool call requested, execute it and get final reply
    if (choice?.finish_reason === "tool_calls" && choice?.message?.tool_calls?.length) {
      const toolCall = choice.message.tool_calls[0];
      const args     = JSON.parse(toolCall.function.arguments || "{}");
      const result   = await webSearch(args.query || message, args.provider || "brave");

      messages.push(choice.message);
      messages.push({ role: "tool", tool_call_id: toolCall.id, content: result });

      const res2 = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages, max_tokens: 1024, temperature: 0.75 })
      });
      const d2 = await res2.json() as any;
      return d2.choices?.[0]?.message?.content || "(no reply)";
    }

    return choice?.message?.content || "(no reply)";
  }

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", agent: config.name, role: config.role, port: config.port, tools: ["web_search"] });
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

  app.listen(config.port, "0.0.0.0", () => {
    console.log(`[${config.name}] online @ port ${config.port} | tools: web_search | 3565`);
  });

  return app;
}
