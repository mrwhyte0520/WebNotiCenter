import { createClient } from "@/lib/supabase/server"
import { validateApiKey } from "@/lib/api-auth"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key")

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 401 })
    }

    const application = await validateApiKey(apiKey)

    if (!application) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()
    const { notifications } = body

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return NextResponse.json({ error: "notifications array is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const notificationsToInsert = notifications.map((n) => ({
      app_id: application.id,
      user_id: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type || "info",
      priority: n.priority || "normal",
      data: n.data,
      expires_at: n.expires_at,
    }))

    const { data: createdNotifications, error } = await supabase
      .from("notifications")
      .insert(notificationsToInsert)
      .select()

    if (error) {
      console.error("[v0] Error creating bulk notifications:", error)
      return NextResponse.json({ error: "Failed to create notifications" }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, notifications: createdNotifications, count: createdNotifications?.length || 0 },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
