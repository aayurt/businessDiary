import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { title, content, messages } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Gemini API key not configured" },
        { status: 500 },
      )
    }

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `I'm working on a business diary entry titled "${title}". Content: ${content ?? "(empty)"}`,
          },
        ],
      },
      ...(messages ?? []).map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ]

    const result = await ai.models.generateContent({
      model: "gemma-4-31b-it",
      config: {
        systemInstruction: "You are a business research assistant. Provide concise, actionable insights. Use bullet points. Keep responses brief and practical.",
      },
      contents,
    })

    const research = result.text ?? "No response."

    return NextResponse.json({ success: true, data: research })
  } catch (error) {
    console.error("Research POST error:", error)
    return NextResponse.json({ success: false, error: "Failed to get research" }, { status: 500 })
  }
}
