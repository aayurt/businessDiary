import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { CategoryDistribution } from "@/types/analytics"

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export async function GET() {
  try {
    const categories = await db.category.findMany({
      select: {
        name: true,
        slug: true,
        _count: { select: { files: true } },
      },
      orderBy: { files: { _count: "desc" } },
    })

    const distribution: CategoryDistribution[] = categories.map((cat, index) => ({
      name: cat.name,
      slug: cat.slug,
      count: cat._count.files,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }))

    return NextResponse.json({ success: true, data: distribution })
  } catch (error) {
    console.error("Failed to fetch category distribution:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch category distribution" } },
      { status: 500 }
    )
  }
}
