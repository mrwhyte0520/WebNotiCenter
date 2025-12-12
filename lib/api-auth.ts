import { createClient as createSupabaseJsClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export async function validateApiKey(apiKey: string) {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = supabaseUrl && serviceRoleKey
    ? createSupabaseJsClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    : await createClient()

  const { data: application, error } = await supabase
    .from("applications")
    .select("*")
    .eq("api_key", apiKey)
    .eq("is_active", true)
    .single()

  if (error || !application) {
    return null
  }

  return application
}
