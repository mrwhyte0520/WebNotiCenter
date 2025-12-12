import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

interface TimelinePageProps {
  searchParams: {
    app_id?: string
    user_id?: string
    limit?: string
  }
}

function getTypeIcon(type: string) {
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

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const appId = searchParams.app_id
  const userId = searchParams.user_id
  const limit = Number.parseInt(searchParams.limit || "50")

  if (!appId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Timeline de Notificaciones</CardTitle>
            <CardDescription>
              Debes proporcionar al menos el parámetro <code>app_id</code> en la URL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ejemplo: <code>/timeline?app_id=APP_ID&user_id=USER_ID_OPCIONAL</code>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("id", appId)
    .eq("owner_id", user.id)
    .single()

  if (!application) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Timeline de Notificaciones</CardTitle>
            <CardDescription>No se encontró la aplicación o no tienes acceso a ella.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("app_id", appId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data: notifications } = await query

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Timeline de Notificaciones</h1>
              <p className="text-xs text-muted-foreground">
                Aplicación: <span className="font-semibold">{application.name}</span>
                {userId && (
                  <>
                    {" "}- Usuario: <span className="font-mono text-xs">{userId}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {(!notifications || notifications.length === 0) ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay notificaciones para los filtros actuales.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n: any) => (
              <Card key={n.id} className={`p-4 ${n.is_read ? "opacity-70" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getTypeIcon(n.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{n.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {n.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                      {n.user_id && (
                        <span className="font-mono text-[11px]">user_id: {n.user_id}</span>
                      )}
                    </div>
                    {n.data && (
                      <details className="mt-1 text-xs text-muted-foreground">
                        <summary className="cursor-pointer hover:underline">Ver detalles</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(n.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
