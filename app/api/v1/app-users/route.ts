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
    const external_user_id = (body?.external_user_id || body?.user_id || "").toString().trim()
    const email = (body?.email || "").toString().trim()

    if (!external_user_id || !email) {
      return NextResponse.json({ error: "external_user_id and email are required" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabaseAdmin
      .from("app_users")
      .upsert(
        {
          app_id: application.id,
          external_user_id,
          email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "app_id,external_user_id" },
      )
      .select("id,app_id,external_user_id,email,created_at,updated_at")
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Failed to upsert user" }, { status: 500 })
    }

    return NextResponse.json({ success: true, app_user: data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}
