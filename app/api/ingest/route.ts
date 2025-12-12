import { createClient } from "@/lib/supabase/server"
import { validateApiKey } from "@/lib/api-auth"
import { type NextRequest, NextResponse } from "next/server"

// Endpoint simplificado para integraciones externas:
// Permite enviar notificaciones SOLO usando una URL con api_key como query param.
// Ejemplo:
// POST /api/ingest?api_key=NTF_...
// Body JSON igual que /api/v1/notifications

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.nextUrl.searchParams.get("api_key")

    if (!apiKey) {
      return NextResponse.json({ error: "api_key query param is required" }, { status: 401 })
    }

    const application = await validateApiKey(apiKey)

    if (!application) {
      return NextResponse.json({ error: "Invalid api_key" }, { status: 401 })
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
      console.error("[ingest] Error creating notification:", error)
      return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
    }

    // Opcionalmente podríamos reutilizar el webhook de la app
    if (application.webhook_url && notification) {
      try {
        await fetch(application.webhook_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event: "notification.created",
            notification,
          }),
        })
      } catch (webhookError) {
        console.error("[ingest] Webhook error:", webhookError)
      }
    }

    return NextResponse.json({ success: true, notification }, { status: 201 })
  } catch (error) {
    console.error("[ingest] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
