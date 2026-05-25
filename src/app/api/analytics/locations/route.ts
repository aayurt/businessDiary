import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const locations = await db.location.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        file: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const mapped = locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      fileTitle: loc.file.title,
      fileSlug: loc.file.slug,
    }))

    return NextResponse.json({ success: true, data: mapped })
  } catch (error) {
    console.error("Failed to fetch locations:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch locations" } },
      { status: 500 }
    )
  }
}
