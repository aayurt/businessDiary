import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { title } = await request.json()

    // Mocking Gemini AI Research for now
    // In a real app, you'd call Google Gemini API here
    const mockResearch = `Based on your idea "${title}", here is some background research:

1. **Market Trends:** The industry for this idea is growing at 15% CAGR.
2. **Competitor Analysis:** Main competitors include X and Y, but they lack the personalized diary aspect.
3. **Target Audience:** Primarily entrepreneurs and early-stage startup founders.
4. **Potential Risks:** Regulatory changes in data privacy could affect the roadmap.
5. **Growth Hack:** Focus on community-led growth and early adopter feedback loops.

*Note: This is a generated research brief.*`

    return NextResponse.json({ success: true, data: mockResearch })
  } catch (error) {
    console.error("Research POST error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
