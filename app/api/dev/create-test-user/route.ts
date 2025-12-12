import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Crea un usuario de prueba en Supabase usando el anon key configurado en .env.local
// IMPORTANTE: si en Supabase tienes activada la confirmación por email,
// deberás revisar el correo de este usuario para confirmar la cuenta.

const TEST_EMAIL = "test-user@example.com"
const TEST_PASSWORD = "Test1234!" // puedes cambiarlo si quieres

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Error al crear usuario de prueba",
        error: error.message,
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: "Usuario de prueba creado (o ya existente)",
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    data,
  })
}
