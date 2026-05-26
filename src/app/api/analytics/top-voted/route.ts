import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { TopVotedEntry } from "@/types/analytics"

export async function GET() {
  try {
    const entries = await db.mdFile.findMany({
      where: { privacy: "PUBLIC" },
      select: {
        id: true,
        title: true,
        slug: true,
        author: { select: { name: true } },
        _count: { select: { votes: true } },
      },
      orderBy: { votes: { _count: "desc" } },
      take: 5,
    })

    const topVoted: TopVotedEntry[] = entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      slug: entry.slug,
      voteCount: entry._count.votes,
      authorName: entry.author.name,
    }))

    return NextResponse.json({ success: true, data: topVoted })
  } catch (error) {
    console.error("Failed to fetch top voted entries:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch top voted entries" } },
      { status: 500 }
    )
  }
}
