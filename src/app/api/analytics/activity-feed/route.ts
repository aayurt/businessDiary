import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { ActivityEvent } from "@/types/analytics"

export async function GET() {
  try {
    const limit = 20

    const [recentFiles, recentVotes, recentComments, recentBudgets, recentInvestments] = await Promise.all([
      db.mdFile.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, title: true, author: { select: { name: true } }, createdAt: true },
      }),
      db.vote.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          value: true,
          file: { select: { id: true, title: true } },
          user: { select: { name: true } },
          createdAt: true,
        },
      }),
      db.comment.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          file: { select: { id: true, title: true } },
          author: { select: { name: true } },
          createdAt: true,
        },
      }),
      db.budgetEstimate.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          amount: true,
          currency: true,
          file: { select: { id: true, title: true } },
          createdBy: { select: { name: true } },
          createdAt: true,
        },
      }),
      db.investmentInterest.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          amount: true,
          file: { select: { id: true, title: true } },
          user: { select: { name: true } },
          createdAt: true,
        },
      }),
    ])

    const events: ActivityEvent[] = [
      ...recentFiles.map(
        (f): ActivityEvent => ({
          id: `create-${f.id}`,
          type: "create",
          description: `Created entry "${f.title}"`,
          entityId: f.id,
          entityTitle: f.title,
          userName: f.author.name,
          timestamp: f.createdAt.toISOString(),
        })
      ),
      ...recentVotes.map(
        (v): ActivityEvent => ({
          id: `vote-${v.id}`,
          type: "vote",
          description: `${v.value > 0 ? "Upvoted" : "Downvoted"} "${v.file.title}"`,
          entityId: v.file.id,
          entityTitle: v.file.title,
          userName: v.user.name,
          timestamp: v.createdAt.toISOString(),
        })
      ),
      ...recentComments.map(
        (c): ActivityEvent => ({
          id: `comment-${c.id}`,
          type: "comment",
          description: `Commented on "${c.file.title}"`,
          entityId: c.file.id,
          entityTitle: c.file.title,
          userName: c.author.name,
          timestamp: c.createdAt.toISOString(),
        })
      ),
      ...recentBudgets.map(
        (b): ActivityEvent => ({
          id: `budget-${b.id}`,
          type: "budget",
          description: `Added budget ${b.amount} ${b.currency} to "${b.file.title}"`,
          entityId: b.file.id,
          entityTitle: b.file.title,
          userName: b.createdBy.name,
          timestamp: b.createdAt.toISOString(),
        })
      ),
      ...recentInvestments.map(
        (inv): ActivityEvent => ({
          id: `investment-${inv.id}`,
          type: "investment",
          description: `Recorded investment interest${inv.amount ? ` of ${inv.amount}` : ""} in "${inv.file.title}"`,
          entityId: inv.file.id,
          entityTitle: inv.file.title,
          userName: inv.user.name,
          timestamp: inv.createdAt.toISOString(),
        })
      ),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({ success: true, data: events })
  } catch (error) {
    console.error("Failed to fetch activity feed:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch activity feed" } },
      { status: 500 }
    )
  }
}
