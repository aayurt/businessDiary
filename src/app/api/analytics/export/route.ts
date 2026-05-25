import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const format = url.searchParams.get("format")
    const type = url.searchParams.get("type")

    if (!type) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_PARAM", message: "Export type is required" } },
        { status: 400 }
      )
    }

    if (!format) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_PARAM", message: "Export format is required" } },
        { status: 400 }
      )
    }

    let csv = ""

    if (type === "entries") {
      const entries = await db.mdFile.findMany({
        include: {
          author: { select: { name: true, email: true } },
          _count: { select: { votes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
      })

      const headers = "ID,Title,Slug,Published,Author,Author Email,Votes,Comments,Created At,Updated At\n"
      const rows = entries
        .map(
          (e) =>
            `"${e.id}","${e.title.replace(/"/g, '""')}","${e.slug}","${e.published}","${e.author?.name ?? ""}","${e.author?.email ?? ""}",${e._count.votes},${e._count.comments},"${e.createdAt.toISOString()}","${e.updatedAt.toISOString()}"`
        )
        .join("\n")
      csv = headers + rows
    } else if (type === "budgets") {
      const budgets = await db.budgetEstimate.findMany({
        include: {
          file: { select: { title: true, slug: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      })

      const headers = "ID,File Title,File Slug,Amount,Currency,Description,Created By,Created At\n"
      const rows = budgets
        .map(
          (b) =>
            `"${b.id}","${b.file.title.replace(/"/g, '""')}","${b.file.slug}",${b.amount},"${b.currency}","${(b.description ?? "").replace(/"/g, '""')}","${b.createdBy.name ?? ""}","${b.createdAt.toISOString()}"`
        )
        .join("\n")
      csv = headers + rows
    } else if (type === "votes") {
      const votes = await db.vote.findMany({
        include: {
          file: { select: { title: true, slug: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      })

      const headers = "ID,Value,File Title,File Slug,User,User Email,Created At\n"
      const rows = votes
        .map(
          (v) =>
            `"${v.id}",${v.value},"${v.file.title.replace(/"/g, '""')}","${v.file.slug}","${v.user.name ?? ""}","${v.user.email}","${v.createdAt.toISOString()}"`
        )
        .join("\n")
      csv = headers + rows
    } else if (type === "investments") {
      const investments = await db.investmentInterest.findMany({
        include: {
          file: { select: { title: true, slug: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      })

      const headers = "ID,File Title,File Slug,User,User Email,Amount,Message,Created At\n"
      const rows = investments
        .map(
          (inv) =>
            `"${inv.id}","${inv.file.title.replace(/"/g, '""')}","${inv.file.slug}","${inv.user.name ?? ""}","${inv.user.email}",${inv.amount ?? ""},"${(inv.message ?? "").replace(/"/g, '""')}","${inv.createdAt.toISOString()}"`
        )
        .join("\n")
      csv = headers + rows
    } else {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_TYPE", message: "Invalid export type" } },
        { status: 400 }
      )
    }

    if (format === "csv") {
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${type}-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({ success: true, data: csv })
  } catch (error) {
    console.error("Failed to export data:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to export data" } },
      { status: 500 }
    )
  }
}
