import nodemailer from "nodemailer"

export type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user?: string
  pass?: string
  from: string
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST
  const portRaw = process.env.SMTP_PORT
  const from = process.env.SMTP_FROM

  if (!host || !portRaw || !from) {
    return null
  }

  const port = Number.parseInt(portRaw, 10)
  const secure = process.env.SMTP_SECURE === "true" || port === 465

  return {
    host,
    port,
    secure,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from,
  }
}

export async function sendNotificationEmail(params: {
  to: string
  subject: string
  title: string
  message: string
  appName?: string
}) {
  const config = getSmtpConfig()
  if (!config) {
    throw new Error("SMTP is not configured")
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined,
  })

  const safeApp = params.appName ? ` (${params.appName})` : ""

  const text = `${params.title}${safeApp}\n\n${params.message}`

  const html = `<!doctype html>
<html>
  <body style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.4;">
    <div style="max-width: 640px; margin: 0 auto; padding: 16px;">
      <h2 style="margin: 0 0 8px;">${escapeHtml(params.title)}${escapeHtml(safeApp)}</h2>
      <p style="margin: 0; color: #334155; white-space: pre-wrap;">${escapeHtml(params.message)}</p>
    </div>
  </body>
</html>`

  await transporter.sendMail({
    from: config.from,
    to: params.to,
    subject: params.subject,
    text,
    html,
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}
