import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { DashboardSummary } from "@/types/analytics"

export async function GET() {
  try {
    const [totalEntries, totalVotes, budgetData, totalComments, totalLocations, totalInvestmentInterests, publicEntries] =
      await Promise.all([
        db.mdFile.count(),
        db.vote.count(),
        db.budgetEstimate.aggregate({ _sum: { amount: true } }),
        db.comment.count(),
        db.location.count(),
        db.investmentInterest.count(),
        db.mdFile.count({ where: { privacy: "PUBLIC" } }),
      ])

    const summary: DashboardSummary = {
      totalEntries,
      totalVotes,
      totalBudget: budgetData._sum.amount ?? 0,
      budgetCurrency: "USD",
      totalComments,
      totalLocations,
      totalInvestmentInterests,
      publicEntries,
    }

    return NextResponse.json({ success: true, data: summary })
  } catch (error) {
    console.error("Failed to fetch dashboard summary:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch dashboard summary" } },
      { status: 500 }
    )
  }
}
