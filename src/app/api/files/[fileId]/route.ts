import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await auth()
    const { fileId } = await params

    const file = await db.mdFile.findUnique({
      where: { id: fileId },
      include: {
        votes: true,
        accessGrants: { include: { user: { select: { id: true, name: true, email: true } } } },
        publicPage: true,
      },
    })

    if (!file) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }

    const isAuthor = session?.user?.id && file.authorId === session.user.id
    const hasAccess = file.accessGrants.some((g) => g.userId === session?.user?.id)

    if (file.privacy === "PRIVATE" && !isAuthor) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }

    if (file.privacy === "SHARED" && !isAuthor && !hasAccess) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: file })
  } catch (error) {
    console.error("File GET error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    const { fileId } = await params
    const body = await request.json()

    const file = await db.mdFile.update({
      where: { id: fileId, authorId: session.user.id },
      data: body,
    })

    return NextResponse.json({ success: true, data: file })
  } catch (error) {
    console.error("File PATCH error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    const { fileId } = await params

    await db.mdFile.delete({
      where: { id: fileId, authorId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("File DELETE error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
