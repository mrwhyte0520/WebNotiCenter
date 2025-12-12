import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardContent } from "@/components/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  return <DashboardContent applications={applications || []} user={user} />
}
