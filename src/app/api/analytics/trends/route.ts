import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { TrendPoint, TrendsData } from "@/types/analytics"

function generateDateRange(daysBack: number): Date[] {
  const dates: Date[] = []
  const now = new Date()
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    dates.push(d)
  }
  return dates
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0] ?? ""
}

async function getEntriesOverTime(daysBack: number): Promise<TrendPoint[]> {
  const dateRange = generateDateRange(daysBack)
  const entries = await db.mdFile.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const countMap = new Map<string, number>()
  for (const date of dateRange) {
    countMap.set(formatDate(date), 0)
  }

  let runningTotal = 0
  const sortedEntries = entries.map((e) => e.createdAt)

  for (const date of dateRange) {
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    while (sortedEntries.length > 0) {
      const first = sortedEntries[0]
      if (!first || first > endOfDay) break
      runningTotal++
      sortedEntries.shift()
    }
    countMap.set(formatDate(date), runningTotal)
  }

  return dateRange.map((d) => ({
    date: formatDate(d),
    count: countMap.get(formatDate(d)) ?? 0,
  }))
}

async function getVotesOverTime(daysBack: number): Promise<TrendPoint[]> {
  const dateRange = generateDateRange(daysBack)
  const votes = await db.vote.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const countMap = new Map<string, number>()
  for (const date of dateRange) {
    countMap.set(formatDate(date), 0)
  }

  let runningTotal = 0
  const sortedVotes = votes.map((v) => v.createdAt)

  for (const date of dateRange) {
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    while (sortedVotes.length > 0) {
      const first = sortedVotes[0]
      if (!first || first > endOfDay) break
      runningTotal++
      sortedVotes.shift()
    }
    countMap.set(formatDate(date), runningTotal)
  }

  return dateRange.map((d) => ({
    date: formatDate(d),
    count: countMap.get(formatDate(d)) ?? 0,
  }))
}

export async function GET() {
  try {
    const daysBack = 30

    const [entriesOverTime, votesOverTime] = await Promise.all([
      getEntriesOverTime(daysBack),
      getVotesOverTime(daysBack),
    ])

    const trends: TrendsData = { entriesOverTime, votesOverTime }

    return NextResponse.json({ success: true, data: trends })
  } catch (error) {
    console.error("Failed to fetch trends:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch trends" } },
      { status: 500 }
    )
  }
}
