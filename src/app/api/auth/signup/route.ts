import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function POST(req: Request): Promise<NextResponse> {
  try {
    let body: { name?: string; email?: string; password?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }

    const { name, password } = body
    const email = body.email?.trim()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    if (password.length > 512) {
      return NextResponse.json(
        { error: "Password must be at most 512 characters" },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    await db.user.create({
      data: { name: name.trim(), email, hashedPassword },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as any).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
