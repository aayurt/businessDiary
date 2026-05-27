import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runAgentAnalysis } from "@/lib/agents/engine";
import { AgentRole } from "@/lib/agents/types";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, content } = await request.json();

  const roles: AgentRole[] = ['STRATEGIST', 'ARCHITECT', 'SKEPTIC', 'VISIONARY', 'OPERATOR'];

  const results = await Promise.all(
    roles.map(role => runAgentAnalysis(role, title, content))
  );

  return NextResponse.json({ success: true, data: results });
}
