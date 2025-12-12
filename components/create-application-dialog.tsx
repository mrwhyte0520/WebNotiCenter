"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Application } from "@/lib/types"

interface CreateApplicationDialogProps {
  onApplicationCreated: (app: Application) => void
}

export function CreateApplicationDialog({ onApplicationCreated }: CreateApplicationDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateApiKey = () => {
    return `ntf_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("Debes estar autenticado")
      setLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from("applications")
      .insert({
        name,
        api_key: generateApiKey(),
        owner_id: user.id,
        webhook_url: webhookUrl || null,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    onApplicationCreated(data)
    setOpen(false)
    setName("")
    setWebhookUrl("")
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Agregar aplicación
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar aplicación</DialogTitle>
            <DialogDescription>
              Registra un nuevo sistema integrado y define la URL donde quieres recibir callbacks opcionales.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre de la Aplicación</Label>
              <Input
                id="name"
                placeholder="Mi Aplicación"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="webhook">URL del sistema integrado (opcional)</Label>
              <Input
                id="webhook"
                type="url"
                placeholder="https://tu-sistema.com/webhook-o-endpoint"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Si la especificas, este centro enviará una petición POST a esa URL cada vez que se cree una notificación.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Aplicación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
