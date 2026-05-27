import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    const { projectId } = await params
    const { title, content } = await request.json()

    if (!title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 })
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true },
    })
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const slug = `${baseSlug}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`

    const file = await db.mdFile.create({
      data: {
        title,
        slug,
        content: content || "",
        authorId: session.user.id,
        projectId: project.id,
      },
    })

    return NextResponse.json({ success: true, data: file }, { status: 201 })
  } catch (error) {
    console.error("File POST error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
