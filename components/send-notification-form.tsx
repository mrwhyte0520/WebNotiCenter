"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Application } from "@/lib/types"

type Recipient = { user_id: string; email?: string }

interface SendNotificationFormProps {
  applications: Application[]
  onSent?: () => void
}

function parseRecipients(input: string): Recipient[] {
  const lines = input
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  const result: Recipient[] = []

  for (const line of lines) {
    const parts = line.split(",")
    const user_id = (parts[0] || "").trim()
    const email = (parts[1] || "").trim() || undefined

    if (!user_id) continue

    if (!email && isEmail(user_id)) {
      result.push({ user_id, email: user_id })
      continue
    }

    result.push({ user_id, email })
  }

  return result
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function SendNotificationForm({ applications, onSent }: SendNotificationFormProps) {
  const [appId, setAppId] = useState<string>(applications[0]?.id || "")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState<string>("info")
  const [priority, setPriority] = useState<string>("normal")
  const [sendEmail, setSendEmail] = useState<boolean>(true)
  const [broadcastAll, setBroadcastAll] = useState<boolean>(false)

  const [recipientsText, setRecipientsText] = useState("")
  const [dataText, setDataText] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const parsedRecipients = useMemo(() => parseRecipients(recipientsText), [recipientsText])

  const handleSend = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!appId) {
        setError("Selecciona una aplicación")
        return
      }

      if (!title.trim() || !message.trim()) {
        setError("Completa título y mensaje")
        return
      }

      if (!broadcastAll) {
        if (parsedRecipients.length === 0) {
          setError("Agrega al menos un destinatario")
          return
        }
      }

      let data: any = undefined
      if (dataText.trim()) {
        data = JSON.parse(dataText)
      }

      const response = await fetch("/api/dashboard/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: appId,
          title: title.trim(),
          message: message.trim(),
          type,
          priority,
          data,
          recipients: broadcastAll ? undefined : parsedRecipients,
          broadcast_all: broadcastAll,
          send_email: sendEmail,
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload?.ok) {
        setError(payload?.error || "No se pudo enviar")
        return
      }

      if (payload?.broadcast_all) {
        const totalUsers = Number(payload.total_users || 0)
        const inserted = Number(payload.inserted_count || 0)
        const emailed = Number(payload.emailed_count || 0)
        const failed = Number(payload.failed_email_count || 0)
        setSuccess(`Usuarios: ${totalUsers}. Notificaciones creadas: ${inserted}. Emails enviados: ${emailed}. Emails fallidos: ${failed}.`)
      } else {
        const total = Array.isArray(payload.results) ? payload.results.length : 0
        const emailed = Array.isArray(payload.results) ? payload.results.filter((r: any) => r.emailed).length : 0
        setSuccess(`Enviadas: ${total}. Emails enviados: ${emailed}.`)
      }
      setTitle("")
      setMessage("")
      setRecipientsText("")
      setDataText("")
      onSent?.()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Aplicación</Label>
          <Select value={appId} onValueChange={setAppId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {applications.map((app) => (
                <SelectItem key={app.id} value={app.id}>
                  {app.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Enviar email</Label>
          <Select value={sendEmail ? "yes" : "no"} onValueChange={(v) => setSendEmail(v === "yes")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Sí</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Enviar a todos los usuarios</Label>
          <Select value={broadcastAll ? "yes" : "no"} onValueChange={(v) => setBroadcastAll(v === "yes")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="yes">Sí</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
        </div>
        <div className="grid gap-4 grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Éxito</SelectItem>
                <SelectItem value="warning">Advertencia</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Prioridad</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">low</SelectItem>
                <SelectItem value="normal">normal</SelectItem>
                <SelectItem value="high">high</SelectItem>
                <SelectItem value="urgent">urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Mensaje</Label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mensaje" />
      </div>

      {!broadcastAll && (
        <div className="space-y-2">
          <Label>Destinatarios (una línea por usuario)</Label>
          <Textarea
            value={recipientsText}
            onChange={(e) => setRecipientsText(e.target.value)}
            placeholder="user_123,user@example.com\nuser_456,otro@example.com\nsoloemail@example.com"
          />
          <div className="text-xs text-muted-foreground">Detectados: {parsedRecipients.length}</div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Data JSON (opcional)</Label>
        <Textarea value={dataText} onChange={(e) => setDataText(e.target.value)} placeholder='{"url":"/mi-link"}' />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertTitle>OK</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSend} disabled={loading}>
          {loading ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </Card>
  )
}
