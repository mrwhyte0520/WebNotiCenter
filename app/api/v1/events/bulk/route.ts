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
    const { events } = body as {
      events?: Array<{
        title?: string
        message?: string
        type?: string
        priority?: string
        data?: Record<string, any>
        expires_at?: string | null
      }>
    }

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "events array is required" }, { status: 400, headers: corsHeaders })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = supabaseUrl && serviceRoleKey
      ? createSupabaseJsClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
      : await createClient()

    const notificationsToInsert = events
      .filter((e) => e?.title && e?.message)
      .map((e) => ({
        app_id: application.id,
        user_id: application.owner_id,
        title: e.title,
        message: e.message,
        type: e.type || "info",
        priority: e.priority || "normal",
        data: e.data,
        expires_at: e.expires_at,
      }))

    if (notificationsToInsert.length === 0) {
      return NextResponse.json(
        { error: "At least one event with title and message is required" },
        { status: 400, headers: corsHeaders },
      )
    }

    const { data: created, error } = await supabase
      .from("notifications")
      .insert(notificationsToInsert)
      .select()

    if (error) {
      console.error("[v1] Error creating bulk event notifications:", error)
      return NextResponse.json(
        { error: "Failed to create bulk event notifications", details: error.message },
        { status: 500, headers: corsHeaders },
      )
    }

    return NextResponse.json({ success: true, count: created?.length || 0 }, { status: 201, headers: corsHeaders })
  } catch (error) {
    console.error("[v1] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: getCorsHeaders(request) })
  }
}
