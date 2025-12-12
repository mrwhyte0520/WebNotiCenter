import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendNotificationEmail } from "@/lib/email"

type RecipientInput = {
  user_id: string
  email?: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      app_id,
      title,
      message,
      type = "info",
      priority = "normal",
      data,
      expires_at,
      recipients,
      send_email = true,
    } = body as {
      app_id?: string
      title?: string
      message?: string
      type?: string
      priority?: string
      data?: Record<string, any>
      expires_at?: string | null
      recipients?: RecipientInput[]
      send_email?: boolean
    }

    if (!app_id || !title || !message) {
      return NextResponse.json({ ok: false, error: "app_id, title y message son requeridos" }, { status: 400 })
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ ok: false, error: "recipients es requerido" }, { status: 400 })
    }

    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id,name,owner_id")
      .eq("id", app_id)
      .eq("owner_id", user.id)
      .single()

    if (appError || !application) {
      return NextResponse.json({ ok: false, error: "Aplicación no encontrada o sin acceso" }, { status: 404 })
    }

    const results: Array<{
      user_id: string
      email?: string
      notification_id?: string
      inserted: boolean
      emailed: boolean
      email_error?: string
      error?: string
    }> = []

    for (const r of recipients) {
      const user_id = (r?.user_id || "").trim()
      const email = (r?.email || "").trim() || undefined

      if (!user_id) {
        results.push({ user_id: "", inserted: false, emailed: false, error: "user_id inválido" })
        continue
      }

      let resolvedEmail: string | undefined = email

      if (email) {
        await supabase.from("app_users").upsert({ app_id, external_user_id: user_id, email }, { onConflict: "app_id,external_user_id" })
      } else {
        const { data: mapped } = await supabase
          .from("app_users")
          .select("email")
          .eq("app_id", app_id)
          .eq("external_user_id", user_id)
          .maybeSingle()

        resolvedEmail = mapped?.email || undefined
      }

      const { data: notification, error: insertError } = await supabase
        .from("notifications")
        .insert({
          app_id,
          user_id,
          title,
          message,
          type,
          priority,
          data,
          expires_at: expires_at || null,
        })
        .select("id")
        .single()

      if (insertError || !notification) {
        results.push({ user_id, email: resolvedEmail, inserted: false, emailed: false, error: insertError?.message || "Error insertando" })
        continue
      }

      let emailed = false
      if (send_email && resolvedEmail) {
        try {
          await sendNotificationEmail({
            to: resolvedEmail,
            subject: title,
            title,
            message,
            appName: application.name,
          })
          emailed = true
        } catch (emailError: unknown) {
          emailed = false
          results.push({
            user_id,
            email: resolvedEmail,
            notification_id: notification.id,
            inserted: true,
            emailed: false,
            email_error: emailError instanceof Error ? emailError.message : "Error enviando email",
          })
          continue
        }
      } else if (send_email && !resolvedEmail) {
        results.push({
          user_id,
          email: resolvedEmail,
          notification_id: notification.id,
          inserted: true,
          emailed: false,
          email_error: "No se pudo resolver email para el destinatario",
        })
        continue
      }

      results.push({ user_id, email: resolvedEmail, notification_id: notification.id, inserted: true, emailed })
    }

    return NextResponse.json({ ok: true, results })
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error inesperado",
      },
      { status: 500 },
    )
  }
}
