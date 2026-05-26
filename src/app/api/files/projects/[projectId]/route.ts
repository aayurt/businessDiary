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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params
    const { title, content } = await request.json()

    if (!title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 })
    }

    const slug = title.toLowerCase().replace(/ /g, "-") + "-" + Date.now()

    const file = await db.mdFile.create({
      data: {
        title,
        slug,
        content: content || "",
        authorId: session.user.id,
        projectId: projectId,
      },
    })

    return NextResponse.json({ success: true, data: file }, { status: 201 })
  } catch (error) {
    console.error("File POST error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
