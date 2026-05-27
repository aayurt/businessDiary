import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(_request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prompt = `
    Generate 20 unique, high-potential business ideas for a "Business Diary".
    The ideas should range across tech, sustainability, finance, and consumer goods.

    Output exactly 20 ideas as a JSON array:
    [
      { "id": "uuid", "title": "string", "score": number, "category": "string" }
    ]
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemma-4-31b-it",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = result.text ?? "[]";
    const jsonStr = text.match(/\[[\s\S]*\]/)?.[0] || text;
    const ideas = JSON.parse(jsonStr);
    return NextResponse.json({ success: true, data: ideas });
  } catch (error) {
    console.error("Failed to generate ideas", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
