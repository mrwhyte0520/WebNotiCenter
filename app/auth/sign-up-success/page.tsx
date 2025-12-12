import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-b from-background to-muted">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bell className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Centro de Notificaciones</h1>
          </div>
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Gracias por registrarte</CardTitle>
              <CardDescription>Verifica tu email para continuar</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                Te hemos enviado un email de confirmación. Por favor revisa tu bandeja de entrada y haz clic en el
                enlace para activar tu cuenta.
              </p>
              <Link href="/auth/login">
                <Button variant="outline">Volver al Inicio de Sesión</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
