import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { TagFrequency } from "@/types/analytics"

export async function GET() {
  try {
    const tags = await db.tag.findMany({
      select: {
        name: true,
        slug: true,
        _count: { select: { files: true } },
      },
      orderBy: { files: { _count: "desc" } },
      take: 50,
    })

    const maxCount = tags.length > 0 ? Math.max(...tags.map((t) => t._count.files)) : 1

    const tagCloud: TagFrequency[] = tags.map((tag) => ({
      name: tag.name,
      slug: tag.slug,
      count: tag._count.files,
      weight: Math.max(0.3, tag._count.files / maxCount),
    }))

    return NextResponse.json({ success: true, data: tagCloud })
  } catch (error) {
    console.error("Failed to fetch tag cloud:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch tag cloud" } },
      { status: 500 }
    )
  }
}
