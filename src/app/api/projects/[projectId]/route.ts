import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    const { projectId } = await params
    const body = await request.json()

    const project = await db.project.update({
      where: { id: projectId, userId: session.user.id },
      data: body,
    })

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error("Project PATCH error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    const { projectId } = await params

    await db.project.delete({
      where: { id: projectId, userId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Project DELETE error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
