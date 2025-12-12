import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function generateApiKey() {
  return `ntf_${Math.random().toString(36).substring(2, 15)}${Math.random()
    .toString(36)
    .substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, message: "No autenticado" }, { status: 401 })
  }

  const applicationId = params.id
  const newApiKey = generateApiKey()

  const { data, error } = await supabase
    .from("applications")
    .update({ api_key: newApiKey })
    .eq("id", applicationId)
    .eq("owner_id", user.id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json(
      {
        ok: false,
        message: "No se pudo regenerar la API Key",
        error: error?.message ?? "Aplicación no encontrada",
      },
      { status: 400 },
    )
  }

  return NextResponse.json({ ok: true, message: "API Key regenerada", application: data })
}
