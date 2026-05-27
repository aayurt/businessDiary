import { GoogleGenAI } from "@google/genai";
import { AGENT_PERSONAS, type AgentRole, type AgentBattleResult } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function runAgentAnalysis(role: AgentRole, ideaTitle: string, ideaContent: string): Promise<AgentBattleResult> {
  const prompt = `
    ${AGENT_PERSONAS[role]}

    Evaluate the following business idea:
    Title: ${ideaTitle}
    Content: ${ideaContent}

    Provide your evaluation in JSON format:
    {
      "score": number (0-100),
      "critique": "string (markdown)",
      "points": {
        "roi": number (0-10),
        "feasibility": number (0-10),
        "innovation": number (0-10)
      }
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemma-4-31b-it",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = result.text ?? "{}";
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
    const parsed = JSON.parse(jsonStr);
    return {
      role,
      ...parsed
    };
  } catch (e) {
    console.error("Failed to parse agent response");
    return {
      role,
      score: 0,
      critique: "Failed to generate analysis.",
      points: { roi: 0, feasibility: 0, innovation: 0 }
    };
  }
}
