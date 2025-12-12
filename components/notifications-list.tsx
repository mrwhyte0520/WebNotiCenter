"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import type { Notification, Application } from "@/lib/types"
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

interface NotificationsListProps {
  applications: Application[]
}

export function NotificationsList({ applications }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filterApp, setFilterApp] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterRead, setFilterRead] = useState<string>("all")

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100)

    if (filterApp !== "all") {
      query = query.eq("app_id", filterApp)
    }

    if (filterType !== "all") {
      query = query.eq("type", filterType)
    }

    if (filterRead !== "all") {
      query = query.eq("is_read", filterRead === "read")
    }

    const { data } = await query

    setNotifications(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadNotifications()
  }, [filterApp, filterType, filterRead])

  const markAsRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id)

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getAppName = (appId: string) => {
    return applications.find((app) => app.id === appId)?.name || "Desconocida"
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando notificaciones...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Select value={filterApp} onValueChange={setFilterApp}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas las apps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las apps</SelectItem>
            {applications.map((app) => (
              <SelectItem key={app.id} value={app.id}>
                {app.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="success">Éxito</SelectItem>
            <SelectItem value="warning">Advertencia</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterRead} onValueChange={setFilterRead}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="unread">No leídas</SelectItem>
            <SelectItem value="read">Leídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay notificaciones.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`p-4 ${notification.is_read ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="mt-1">{getTypeIcon(notification.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{notification.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {getAppName(notification.app_id)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{new Date(notification.created_at).toLocaleString()}</span>
                    <Badge variant="secondary">{notification.priority}</Badge>
                  </div>
                  {notification.data && (
                    <details className="mt-1 text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:underline">Ver detalles</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(notification.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                {!notification.is_read && (
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                    Marcar como leída
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
