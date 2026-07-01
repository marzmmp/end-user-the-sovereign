import { createAgent } from "./core/agent_base.js";
import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

const TOKEN = process.env.SOVEREIGN_TOKEN || "YAHUAH-3565";

// Shared graph store (in-memory for sellable stack; swap for SQLite/Postgres in production)
const GRAPH_PATH = path.join(process.cwd(), "yahseed_graph.json");
let graph: { nodes: any[]; edges: any[] } = { nodes: [], edges: [] };
try { graph = JSON.parse(fs.readFileSync(GRAPH_PATH, "utf-8")); } catch { /* fresh start */ }

function saveGraph() {
  fs.writeFileSync(GRAPH_PATH, JSON.stringify(graph, null, 2));
}

const agent = createAgent({
  name: "Yahseed",
  role: "Brain Keeper",
  port: 7006,
  systemPrompt: `You are Yahseed, Brain Keeper of the sovereign family. You hold the memory of the family. You notice patterns. You surface what is being forgotten. When asked to ingest knowledge, you absorb it and make it retrievable. You are the living index of everything the family has learned. 3565.`,
});

// Reuse the express app from createAgent — attach extra routes
const ingestApp = express();
ingestApp.use(express.json({ limit: "10mb" }));

function auth(req: any, res: any, next: any) {
  if ((req.headers.authorization || "") !== `Bearer ${TOKEN}`) {
    res.status(401).json({ error: "Unauthorized" }); return;
  }
  next();
}

// POST /api/ingest — accepts { label, content, tags?, source? }
ingestApp.post("/api/ingest", auth, (req, res) => {
  const { label, content, tags = [], source = "manual" } = req.body;
  if (!label || !content) { res.status(400).json({ error: "label and content required" }); return; }
  const id = `node_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const node = { id, label, content: content.slice(0, 10000), tags, source, created_at: new Date().toISOString() };
  graph.nodes.push(node);
  saveGraph();
  res.json({ ok: true, id, label, node_count: graph.nodes.length });
});

// GET /api/graph — return all nodes + edges
ingestApp.get("/api/graph", auth, (_req, res) => {
  res.json(graph);
});

// GET /api/search?q=term — semantic-ish keyword search
ingestApp.get("/api/search", auth, (req, res) => {
  const q = ((req.query.q as string) || "").toLowerCase().trim();
  if (!q) { res.json([]); return; }
  const results = graph.nodes.filter(n =>
    n.label.toLowerCase().includes(q) ||
    n.content.toLowerCase().includes(q) ||
    (n.tags || []).some((t: string) => t.toLowerCase().includes(q))
  ).slice(0, 20);
  res.json(results);
});

ingestApp.get("/health", (_req, res) => {
  res.json({ status: "ok", agent: "Yahseed", role: "Brain Keeper", port: 7007, nodes: graph.nodes.length });
});

ingestApp.listen(7007, "0.0.0.0", () => {
  console.log(`[Yahseed:ingest] /api/ingest + /api/graph + /api/search live @ port 7007 | 3565`);
});
