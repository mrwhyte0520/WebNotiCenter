import { createClient } from "@/lib/supabase/server"
import { validateApiKey } from "@/lib/api-auth"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key")

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 401 })
    }

    const application = await validateApiKey(apiKey)

    if (!application) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const user_id = searchParams.get("user_id")

    const supabase = await createClient()

    let query = supabase
      .from("notifications")
      .select("id, is_read, type", { count: "exact" })
      .eq("app_id", application.id)

    if (user_id) {
      query = query.eq("user_id", user_id)
    }

    const { count: total, error: totalError } = await query

    if (totalError) {
      console.error("[v0] Error fetching total count:", totalError)
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }

    let unreadQuery = supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("app_id", application.id)
      .eq("is_read", false)

    if (user_id) {
      unreadQuery = unreadQuery.eq("user_id", user_id)
    }

    const { count: unread, error: unreadError } = await unreadQuery

    if (unreadError) {
      console.error("[v0] Error fetching unread count:", unreadError)
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        stats: {
          total: total || 0,
          unread: unread || 0,
          read: (total || 0) - (unread || 0),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
