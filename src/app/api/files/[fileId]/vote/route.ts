import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    const { fileId } = await params

    const file = await db.mdFile.findUnique({ where: { id: fileId } })
    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "File not found" } },
        { status: 404 }
      )
    }

    let body: { value?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } },
        { status: 400 }
      )
    }

    const { value } = body
    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_VALUE", message: "Vote value must be 1 or -1" } },
        { status: 400 }
      )
    }

    const existingVote = await db.vote.findUnique({
      where: { fileId_userId: { fileId, userId: session.user.id } },
    })

    if (existingVote) {
      if (existingVote.value === value) {
        await db.vote.delete({
          where: { id: existingVote.id },
        })
        return NextResponse.json({ success: true, data: { action: "removed", score: 0 } })
      }

      const updated = await db.vote.update({
        where: { id: existingVote.id },
        data: { value },
      })
      return NextResponse.json({ success: true, data: { action: "changed", score: updated.value } })
    }

    await db.vote.create({
      data: { value, fileId, userId: session.user.id },
    })

    return NextResponse.json({ success: true, data: { action: "created", score: value } }, { status: 201 })
  } catch (error) {
    console.error("Vote error:", error)
    if (
      error instanceof Error &&
      'code' in error &&
      (error as any).code === 'P2002'
    ) {
      return NextResponse.json(
        { success: false, error: { code: "CONFLICT", message: "Vote already exists" } },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to process vote" } },
      { status: 500 }
    )
  }
}
