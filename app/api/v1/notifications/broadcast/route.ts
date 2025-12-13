import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { createAdminClient } from "@/lib/supabase/admin"

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
    const { title, message, type = "info", priority = "normal", data, expires_at } = body as {
      title?: string
      message?: string
      type?: string
      priority?: string
      data?: Record<string, any>
      expires_at?: string | null
    }

    if (!title || !message) {
      return NextResponse.json({ error: "title and message are required" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    const PAGE_SIZE = 1000
    const INSERT_BATCH_SIZE = 500

    let total_users = 0
    let inserted_count = 0

    let from = 0
    while (true) {
      const to = from + PAGE_SIZE - 1
      const { data: appUsers, error: appUsersError } = await supabaseAdmin
        .from("app_users")
        .select("external_user_id")
        .eq("app_id", application.id)
        .order("created_at", { ascending: true })
        .range(from, to)

      if (appUsersError) {
        return NextResponse.json({ error: appUsersError.message }, { status: 500 })
      }

      if (!appUsers || appUsers.length === 0) {
        break
      }

      total_users += appUsers.length

      for (let i = 0; i < appUsers.length; i += INSERT_BATCH_SIZE) {
        const chunk = appUsers.slice(i, i + INSERT_BATCH_SIZE)

        const notificationsToInsert = chunk.map((u) => ({
          app_id: application.id,
          user_id: u.external_user_id,
          title,
          message,
          type,
          priority,
          data,
          expires_at: expires_at || null,
        }))

        const { data: createdNotifications, error: insertError } = await supabaseAdmin
          .from("notifications")
          .insert(notificationsToInsert)
          .select("id")

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        inserted_count += createdNotifications?.length || 0
      }

      if (appUsers.length < PAGE_SIZE) {
        break
      }

      from += PAGE_SIZE
    }

    let webhook_sent = false
    let webhook_error: string | undefined

    if (application.webhook_url && inserted_count > 0) {
      try {
        await fetch(application.webhook_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Notification-Event": "notification.broadcast_created",
            "X-Notification-App-Id": application.id,
          },
          body: JSON.stringify({
            event: "notification.broadcast_created",
            app_id: application.id,
            title,
            message,
            type,
            priority,
            data,
            expires_at: expires_at || null,
            count: inserted_count,
          }),
        })
        webhook_sent = true
      } catch (webhookError: unknown) {
        webhook_sent = false
        webhook_error = webhookError instanceof Error ? webhookError.message : "Webhook error"
      }
    }

    return NextResponse.json(
      {
        success: true,
        broadcast_all: true,
        total_users,
        inserted_count,
        webhook_sent,
        webhook_error,
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}
