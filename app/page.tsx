import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Zap, Shield, Code, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Centro de Notificaciones</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Iniciar Sesión</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button>Comenzar</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Sistema de Notificaciones Centralizado para tus Aplicaciones
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Integra un centro de notificaciones potente en minutos. API REST simple, webhooks en tiempo real y panel de
            control completo.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg">
                Comenzar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline">
                Ver Documentación
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Integración Rápida</CardTitle>
                <CardDescription>
                  API REST intuitiva. Envía tu primera notificación en menos de 5 minutos con cualquier lenguaje de
                  programación.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Seguro por Defecto</CardTitle>
                <CardDescription>
                  Autenticación con API Keys, políticas de seguridad a nivel de fila y webhooks verificados para máxima
                  protección.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Code className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Flexible y Escalable</CardTitle>
                <CardDescription>
                  Tipos de notificación personalizables, prioridades, datos adicionales y webhooks para integración
                  completa.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">Características Principales</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">API REST Completa</h3>
                <ul className="space-y-1 text-sm opacity-90">
                  <li>Crear, leer, actualizar y eliminar notificaciones</li>
                  <li>Operaciones masivas (bulk)</li>
                  <li>Estadísticas y análisis</li>
                  <li>Filtros avanzados por usuario, tipo y estado</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Panel de Control</h3>
                <ul className="space-y-1 text-sm opacity-90">
                  <li>Gestión de aplicaciones integradas</li>
                  <li>Visualización de notificaciones en tiempo real</li>
                  <li>Estadísticas y métricas</li>
                  <li>Configuración de webhooks</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Webhooks</h3>
                <ul className="space-y-1 text-sm opacity-90">
                  <li>Notificaciones en tiempo real a tu servidor</li>
                  <li>Eventos personalizables</li>
                  <li>Reintento automático en caso de fallo</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Tipos y Prioridades</h3>
                <ul className="space-y-1 text-sm opacity-90">
                  <li>Info, Success, Warning, Error</li>
                  <li>Prioridades: Low, Normal, High, Urgent</li>
                  <li>Datos adicionales en formato JSON</li>
                  <li>Expiración automática de notificaciones</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Listo para comenzar</h2>
          <p className="text-muted-foreground mb-8">Crea tu cuenta gratis y comienza a integrar notificaciones hoy</p>
          <Link href="/auth/sign-up">
            <Button size="lg">
              Crear Cuenta Gratuita
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Centro de Notificaciones - Sistema de gestión de notificaciones para aplicaciones</p>
        </div>
      </footer>
    </div>
  )
}
