import { createClient } from "@/lib/supabase/server"
import { validateApiKey } from "@/lib/api-auth"
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin")
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Api-Key",
    Vary: "Origin",
  }
}

function getApiKey(request: NextRequest) {
  const headerKey = request.headers.get("x-api-key")
  if (headerKey) return headerKey

  const auth = request.headers.get("authorization")
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim()
    if (token) return token
  }

  const { searchParams } = new URL(request.url)
  return searchParams.get("api_key")
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) })
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey(request)
    const corsHeaders = getCorsHeaders(request)

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 401, headers: corsHeaders })
    }

    const application = await validateApiKey(apiKey)

    if (!application) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401, headers: corsHeaders })
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
      return NextResponse.json({ error: "title and message are required" }, { status: 400, headers: corsHeaders })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = supabaseUrl && serviceRoleKey
      ? createSupabaseJsClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
      : await createClient()

    const { data: appUsers, error: usersError } = await supabase
      .from("app_users")
      .select("external_user_id")
      .eq("app_id", application.id)

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500, headers: corsHeaders })
    }

    const recipients = (appUsers || []).map((u) => String(u.external_user_id || "").trim()).filter(Boolean)

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: true, broadcast_all: true, total_users: 0, inserted_count: 0 },
        { status: 200, headers: corsHeaders },
      )
    }

    const notificationsToInsert = recipients.map((user_id) => ({
      app_id: application.id,
      user_id,
      title,
      message,
      type,
      priority,
      data,
      expires_at,
    }))

    const { data: created, error: insertError } = await supabase
      .from("notifications")
      .insert(notificationsToInsert)
      .select("id")

    if (insertError) {
      console.error("[v1] Error broadcasting notifications:", insertError)
      return NextResponse.json(
        { error: "Failed to broadcast notifications", details: insertError.message },
        { status: 500, headers: corsHeaders },
      )
    }

    return NextResponse.json(
      {
        success: true,
        broadcast_all: true,
        total_users: recipients.length,
        inserted_count: created?.length || 0,
      },
      { status: 201, headers: corsHeaders },
    )
  } catch (error) {
    console.error("[v1] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: getCorsHeaders(request) })
  }
}
