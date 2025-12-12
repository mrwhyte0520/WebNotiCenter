import { createClient } from "@/lib/supabase/server"

export async function validateApiKey(apiKey: string) {
  const supabase = await createClient()

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
