"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Copy, Trash2, ExternalLink } from "lucide-react"
import type { Application } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ApplicationsListProps {
  applications: Application[]
  onApplicationDeleted: (id: string) => void
  onApplicationUpdated?: (app: Application) => void
}

export function ApplicationsList({ applications, onApplicationDeleted, onApplicationUpdated }: ApplicationsListProps) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const deleteApplication = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("applications").delete().eq("id", id)

    if (!error) {
      onApplicationDeleted(id)
    }
  }

  const regenerateApiKey = async (id: string) => {
    try {
      setRegeneratingId(id)

      const response = await fetch(`/api/applications/${id}/regenerate-key`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        console.error("Error regenerando API Key:", data?.error || data)
        return
      }

      if (onApplicationUpdated) {
        onApplicationUpdated(data.application as Application)
      }

      setVisibleKeys((prev) => {
        const next = new Set(prev)
        next.add(id)
        return next
      })
    } finally {
      setRegeneratingId(null)
    }
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No tienes aplicaciones registradas.</p>
        <p className="text-sm mt-2">Crea tu primera aplicación para comenzar a recibir notificaciones.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <Card key={app.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{app.name}</h3>
                <Badge variant={app.is_active ? "default" : "secondary"}>{app.is_active ? "Activa" : "Inactiva"}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">API Key:</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                    {visibleKeys.has(app.id) ? app.api_key : "••••••••••••••••••••••••••••••••"}
                  </code>
                  <Button variant="ghost" size="sm" onClick={() => toggleKeyVisibility(app.id)}>
                    {visibleKeys.has(app.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(app.api_key)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => regenerateApiKey(app.id)}
                    disabled={regeneratingId === app.id}
                  >
                    {regeneratingId === app.id ? "Regenerando..." : "Regenerar API Key"}
                  </Button>
                </div>
              </div>

              <div className="space-y-1 mt-3">
                <p className="text-sm text-muted-foreground">URL de integración (ingesta directa):</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {`/api/ingest?api_key=${app.api_key}`}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`/api/ingest?api_key=${app.api_key}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {app.webhook_url && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Webhook URL:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">{app.webhook_url}</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(app.webhook_url!)}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">Creada: {new Date(app.created_at).toLocaleDateString()}</p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar Aplicación</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará la aplicación y todas sus notificaciones asociadas. Esta acción no se puede
                    deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteApplication(app.id)}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      ))}
    </div>
  )
}
