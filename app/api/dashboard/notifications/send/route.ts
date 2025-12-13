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
      broadcast_all = false,
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
      broadcast_all?: boolean
      send_email?: boolean
    }

    if (!app_id || !title || !message) {
      return NextResponse.json({ ok: false, error: "app_id, title y message son requeridos" }, { status: 400 })
    }

    if (!broadcast_all) {
      if (!Array.isArray(recipients) || recipients.length === 0) {
        return NextResponse.json({ ok: false, error: "recipients es requerido" }, { status: 400 })
      }
    }

    let resolvedRecipients: RecipientInput[] = Array.isArray(recipients) ? recipients : []

    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id,name,owner_id,webhook_url")
      .eq("id", app_id)
      .eq("owner_id", user.id)
      .single()

    if (appError || !application) {
      return NextResponse.json({ ok: false, error: "Aplicación no encontrada o sin acceso" }, { status: 404 })
    }

    if (broadcast_all) {
      const PAGE_SIZE = 1000
      const INSERT_BATCH_SIZE = 500

      let total_users = 0
      let inserted_count = 0
      let emailed_count = 0
      let failed_email_count = 0

      let webhook_sent = false
      let webhook_error: string | undefined

      let from = 0
      while (true) {
        const to = from + PAGE_SIZE - 1
        const { data: appUsers, error: appUsersError } = await supabase
          .from("app_users")
          .select("external_user_id,email")
          .eq("app_id", app_id)
          .order("created_at", { ascending: true })
          .range(from, to)

        if (appUsersError) {
          return NextResponse.json({ ok: false, error: appUsersError.message }, { status: 500 })
        }

        if (!appUsers || appUsers.length === 0) {
          break
        }

        total_users += appUsers.length

        for (let i = 0; i < appUsers.length; i += INSERT_BATCH_SIZE) {
          const chunk = appUsers.slice(i, i + INSERT_BATCH_SIZE)

          const notificationsToInsert = chunk.map((u) => ({
            app_id,
            user_id: u.external_user_id,
            title,
            message,
            type,
            priority,
            data,
            expires_at: expires_at || null,
          }))

          const { data: createdNotifications, error: insertError } = await supabase
            .from("notifications")
            .insert(notificationsToInsert)
            .select("id,user_id")

          if (insertError) {
            return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 })
          }

          inserted_count += createdNotifications?.length || 0

          if (send_email) {
            const emailByUserId = new Map<string, string>()
            for (const u of chunk) {
              if (u.email) emailByUserId.set(u.external_user_id, u.email)
            }

            for (const n of createdNotifications || []) {
              const toEmail = emailByUserId.get(n.user_id)
              if (!toEmail) {
                failed_email_count += 1
                continue
              }
              try {
                await sendNotificationEmail({
                  to: toEmail,
                  subject: title,
                  title,
                  message,
                  appName: application.name,
                })
                emailed_count += 1
              } catch {
                failed_email_count += 1
              }
            }
          }
        }

        if (appUsers.length < PAGE_SIZE) {
          break
        }
        from += PAGE_SIZE
      }

      if (application.webhook_url && inserted_count > 0) {
        try {
          await fetch(application.webhook_url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Notification-Event": "notification.broadcast_created",
              "X-Notification-App-Id": app_id,
            },
            body: JSON.stringify({
              event: "notification.broadcast_created",
              app_id,
              title,
              message,
              type,
              priority,
              data,
              expires_at: expires_at || null,
              count: inserted_count,
            }),
          })
          webhook_sent = true
        } catch (webhookError: unknown) {
          webhook_sent = false
          webhook_error = webhookError instanceof Error ? webhookError.message : "Error enviando webhook"
        }
      }

      return NextResponse.json({
        ok: true,
        broadcast_all: true,
        total_users,
        inserted_count,
        send_email,
        emailed_count,
        failed_email_count,
        webhook_sent,
        webhook_error,
      })
    }

    if (!Array.isArray(resolvedRecipients) || resolvedRecipients.length === 0) {
      return NextResponse.json({ ok: false, error: "recipients es requerido" }, { status: 400 })
    }

    const results: Array<{
      user_id: string
      email?: string
      notification_id?: string
      inserted: boolean
      emailed: boolean
      email_error?: string
      webhook_sent?: boolean
      webhook_error?: string
      error?: string
    }> = []

    for (const r of resolvedRecipients) {
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

      let webhook_sent = false
      let webhook_error: string | undefined

      if (application.webhook_url) {
        try {
          await fetch(application.webhook_url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Notification-Event": "notification.created",
              "X-Notification-App-Id": app_id,
            },
            body: JSON.stringify({
              event: "notification.created",
              notification: {
                id: notification.id,
                app_id,
                user_id,
                title,
                message,
                type,
                priority,
                data,
                expires_at: expires_at || null,
              },
            }),
          })
          webhook_sent = true
        } catch (webhookError: unknown) {
          webhook_sent = false
          webhook_error = webhookError instanceof Error ? webhookError.message : "Error enviando webhook"
        }
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
            webhook_sent,
            webhook_error,
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
          webhook_sent,
          webhook_error,
        })
        continue
      }

      results.push({
        user_id,
        email: resolvedEmail,
        notification_id: notification.id,
        inserted: true,
        emailed,
        webhook_sent,
        webhook_error,
      })
    }

    if (broadcast_all) {
      const total_users = resolvedRecipients.length
      const inserted_count = results.filter((r) => r.inserted).length
      const emailed_count = results.filter((r) => r.emailed).length
      const failed_email_count = results.filter((r) => Boolean(r.email_error)).length
      return NextResponse.json({
        ok: true,
        broadcast_all: true,
        total_users,
        inserted_count,
        emailed_count,
        failed_email_count,
        results,
      })
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
