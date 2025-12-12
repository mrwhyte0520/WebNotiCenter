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
    const users = body?.users

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "users array is required" }, { status: 400 })
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
      return NextResponse.json({ error: "No valid users provided" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("app_users")
      .upsert(toUpsert, { onConflict: "app_id,external_user_id" })
      .select("id, app_id, external_user_id, email")

    if (error) {
      console.error("[v1] Error upserting app users:", error)
      return NextResponse.json({ error: "Failed to sync app users" }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        count: data?.length || 0,
        users: data,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v1] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
