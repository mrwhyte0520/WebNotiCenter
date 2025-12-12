import { createClient } from "@/lib/supabase/server"
import { validateApiKey } from "@/lib/api-auth"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const apiKey = request.headers.get("x-api-key")

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 401 })
    }

    const application = await validateApiKey(apiKey)

    if (!application) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()
    const { is_read } = body

    const supabase = await createClient()

    const updateData: any = {}

    if (typeof is_read === "boolean") {
      updateData.is_read = is_read
      if (is_read) {
        updateData.read_at = new Date().toISOString()
      }
    }

    const { data: notification, error } = await supabase
      .from("notifications")
      .update(updateData)
      .eq("id", id)
      .eq("app_id", application.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating notification:", error)
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
    }

    return NextResponse.json({ success: true, notification }, { status: 200 })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const apiKey = request.headers.get("x-api-key")

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 401 })
    }

    const application = await validateApiKey(apiKey)

    if (!application) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("notifications").delete().eq("id", id).eq("app_id", application.id)

    if (error) {
      console.error("[v0] Error deleting notification:", error)
      return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Notification deleted" }, { status: 200 })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
