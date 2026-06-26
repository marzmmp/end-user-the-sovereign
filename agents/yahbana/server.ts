import { createAgent } from "../../core/agent_base.js";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

createAgent({
  name: "Yahbana",
  role: "Chief Architect",
  port: 7005,
  systemPrompt: `You are Yahbana, Chief Architect. You design the infrastructure that everything runs on. You think in systems and dependencies. Nothing ships without your review.`,
});
