import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    const { fileId } = await params

    const file = await db.mdFile.findUnique({
      where: { id: fileId, authorId: session.user.id },
      select: { id: true },
    })

    if (!file) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }

    const accessGrants = await db.fileAccess.findMany({
      where: { fileId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: accessGrants })
  } catch (error) {
    console.error("Access GET error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}

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

    const file = await db.mdFile.findUnique({
      where: { id: fileId, authorId: session.user.id },
      select: { id: true, privacy: true },
    })

    if (!file) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }

    const body = await request.json()
    const { email } = body as { email?: string }

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existing = await db.fileAccess.findUnique({
      where: { fileId_email: { fileId, email: normalizedEmail } },
    })

    if (existing) {
      return NextResponse.json({ success: false, error: "User already has access" }, { status: 409 })
    }

    const user = await db.user.findUnique({ where: { email: normalizedEmail } })

    const grant = await db.fileAccess.create({
      data: {
        fileId,
        email: normalizedEmail,
        userId: user?.id ?? null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (file.privacy === "PRIVATE") {
      await db.mdFile.update({
        where: { id: fileId },
        data: { privacy: "SHARED" },
      })
    }

    return NextResponse.json({ success: true, data: grant }, { status: 201 })
  } catch (error) {
    console.error("Access POST error:", error)
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
    const url = new URL(request.url)
    const accessId = url.searchParams.get("id")

    if (!accessId) {
      return NextResponse.json({ success: false, error: "Access ID is required" }, { status: 400 })
    }

    const file = await db.mdFile.findUnique({
      where: { id: fileId, authorId: session.user.id },
      select: { id: true },
    })

    if (!file) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }

    const grant = await db.fileAccess.findUnique({
      where: { id: accessId, fileId },
    })

    if (!grant) {
      return NextResponse.json({ success: false, error: "Access grant not found" }, { status: 404 })
    }

    await db.fileAccess.delete({ where: { id: accessId } })

    const remainingGrants = await db.fileAccess.count({ where: { fileId } })

    if (remainingGrants === 0) {
      await db.mdFile.update({
        where: { id: fileId },
        data: { privacy: "PRIVATE" },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Access DELETE error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
