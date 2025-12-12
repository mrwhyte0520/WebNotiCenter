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
    const { user_id, title, message, type = "info", priority = "normal", data, expires_at } = body

    if (!user_id || !title || !message) {
      return NextResponse.json({ error: "user_id, title, and message are required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        app_id: application.id,
        user_id,
        title,
        message,
        type,
        priority,
        data,
        expires_at,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating notification:", error)
      return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
    }

    // Call webhook if configured
    if (application.webhook_url && notification) {
      try {
        await fetch(application.webhook_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Notification-Event": "notification.created",
            "X-Notification-App-Id": application.id,
          },
          body: JSON.stringify({
            event: "notification.created",
            notification,
          }),
        })
      } catch (webhookError) {
        console.error("[v0] Webhook error:", webhookError)
      }
    }

    return NextResponse.json({ success: true, notification }, { status: 201 })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const is_read = searchParams.get("is_read")
    const type = searchParams.get("type")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const supabase = await createClient()

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("app_id", application.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (user_id) {
      query = query.eq("user_id", user_id)
    }

    if (is_read !== null) {
      query = query.eq("is_read", is_read === "true")
    }

    if (type) {
      query = query.eq("type", type)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error("[v0] Error fetching notifications:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    return NextResponse.json({ success: true, notifications }, { status: 200 })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
