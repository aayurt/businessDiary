import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "untitled"
}

async function uniqueSlug(base: string, fileId: string): Promise<string> {
  let slug = base
  let attempt = 0
  while (true) {
    const existing = await db.publicPage.findUnique({ where: { slug } })
    if (!existing || existing.fileId === fileId) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

export async function POST(
  request: Request,
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
      select: { id: true, title: true, content: true, privacy: true },
    })

    if (!file) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }

    const baseSlug = slugify(file.title)
    const slug = await uniqueSlug(baseSlug, fileId)

    const existing = await db.publicPage.findUnique({ where: { fileId } })

    if (existing) {
      const updated = await db.publicPage.update({
        where: { fileId },
        data: {
          title: file.title,
          content: file.content,
          publishedAt: new Date(),
          slug,
        },
      })

      const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const url = `${origin}/p/${updated.slug}`

      return NextResponse.json({ success: true, data: { slug: updated.slug, url } })
    }

    const page = await db.publicPage.create({
      data: {
        fileId,
        slug,
        title: file.title,
        content: file.content,
        publishedAt: new Date(),
      },
    })

    if (file.privacy === "PRIVATE") {
      await db.mdFile.update({
        where: { id: fileId },
        data: { privacy: "PUBLIC" },
      })
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const url = `${origin}/p/${page.slug}`

    return NextResponse.json({ success: true, data: { slug: page.slug, url } }, { status: 201 })
  } catch (error) {
    console.error("Publish error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
