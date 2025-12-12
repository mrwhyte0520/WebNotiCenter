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
    const users = body?.users

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "users array is required" }, { status: 400, headers: corsHeaders })
    }

    const toUpsert = users
      .filter((u: any) => u?.user_id && u?.email)
      .map((u: any) => ({
        app_id: application.id,
        external_user_id: String(u.user_id),
        email: String(u.email),
        updated_at: new Date().toISOString(),
      }))

    if (toUpsert.length === 0) {
      return NextResponse.json({ error: "No valid users provided" }, { status: 400, headers: corsHeaders })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = supabaseUrl && serviceRoleKey
      ? createSupabaseJsClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
      : await createClient()

    const { data, error } = await supabase
      .from("app_users")
      .upsert(toUpsert, { onConflict: "app_id,external_user_id" })
      .select("id, app_id, external_user_id, email")

    if (error) {
      console.error("[v1] Error upserting app users:", error)
      return NextResponse.json(
        { error: "Failed to sync app users", details: error.message },
        { status: 500, headers: corsHeaders },
      )
    }

    return NextResponse.json(
      {
        success: true,
        count: data?.length || 0,
        users: data,
      },
      { status: 200, headers: corsHeaders },
    )
  } catch (error) {
    console.error("[v1] API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getCorsHeaders(request) },
    )
  }
}
