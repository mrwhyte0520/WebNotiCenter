import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function validateApiKey(apiKey: string) {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : await createClient()

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
