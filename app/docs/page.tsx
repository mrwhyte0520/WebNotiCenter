import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Code, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Centro de Notificaciones</h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Documentación de API</h1>
          <p className="text-xl text-muted-foreground">
            Aprende cómo integrar el Centro de Notificaciones en tu aplicación
          </p>
        </div>

        <Tabs defaultValue="getting-started" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="getting-started">Inicio Rápido</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="examples">Ejemplos</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle>Inicio Rápido</CardTitle>
                </div>
                <CardDescription>Configura tu aplicación en minutos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">1. Crea una cuenta</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Regístrate en el Centro de Notificaciones y crea tu primera aplicación desde el dashboard.
                  </p>
                  <Link href="/auth/sign-up">
                    <Button size="sm">Crear Cuenta</Button>
                  </Link>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2. Obtén tu API Key</h3>
                  <p className="text-sm text-muted-foreground">
                    Una vez creada tu aplicación, se generará automáticamente una API Key única. Esta clave es necesaria
                    para todas las llamadas a la API.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3. Envía tu primera notificación</h3>
                  <p className="text-sm text-muted-foreground mb-3">Usa esta petición de ejemplo:</p>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {`curl -X POST https://tu-dominio.com/api/v1/notifications \\
  -H "x-api-key: tu_api_key_aqui" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_id": "usuario123",
    "title": "Bienvenido!",
    "message": "Tu primera notificación",
    "type": "info",
    "priority": "normal"
  }'`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Autenticación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Todas las peticiones a la API deben incluir tu API Key en el header:
                </p>
                <pre className="bg-muted p-4 rounded-lg text-sm">x-api-key: tu_api_key_aqui</pre>
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <Badge variant="outline" className="mt-1">
                    IMPORTANTE
                  </Badge>
                  <p className="text-sm">
                    Nunca expongas tu API Key en código del cliente. Úsala solo en tu servidor backend.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>POST /api/v1/notifications</CardTitle>
                <CardDescription>Crea una nueva notificación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Request Body</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {`{
  "user_id": "string",           // Requerido: ID del usuario
  "title": "string",             // Requerido: Título de la notificación
  "message": "string",           // Requerido: Mensaje
  "type": "info",                // Opcional: info, success, warning, error
  "priority": "normal",          // Opcional: low, normal, high, urgent
  "data": {},                    // Opcional: Datos adicionales en JSON
  "expires_at": "2024-12-31"     // Opcional: Fecha de expiración
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Response (201)</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {`{
  "success": true,
  "notification": {
    "id": "uuid",
    "app_id": "uuid",
    "user_id": "usuario123",
    "title": "Título",
    "message": "Mensaje",
    "type": "info",
    "priority": "normal",
    "is_read": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GET /api/v1/notifications</CardTitle>
                <CardDescription>Obtén notificaciones con filtros</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Query Parameters</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {`user_id    (opcional): Filtrar por ID de usuario
is_read    (opcional): true/false - Filtrar por estado de lectura
type       (opcional): info/success/warning/error
limit      (opcional): Número máximo de resultados (default: 50)`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Ejemplo</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    GET /api/v1/notifications?user_id=usuario123&is_read=false&limit=20
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PATCH /api/v1/notifications/:id</CardTitle>
                <CardDescription>Actualiza una notificación (marcar como leída)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Request Body</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {`{
  "is_read": true
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>DELETE /api/v1/notifications/:id</CardTitle>
                <CardDescription>Elimina una notificación</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Envía una petición DELETE con el ID de la notificación en la URL.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>POST /api/v1/notifications/bulk</CardTitle>
                <CardDescription>Crea múltiples notificaciones a la vez</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Request Body</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {`{
  "notifications": [
    {
      "user_id": "usuario1",
      "title": "Título 1",
      "message": "Mensaje 1",
      "type": "info"
    },
    {
      "user_id": "usuario2",
      "title": "Título 2",
      "message": "Mensaje 2",
      "type": "success"
    }
  ]
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GET /api/v1/stats</CardTitle>
                <CardDescription>Obtén estadísticas de notificaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Query Parameters</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    user_id (opcional): Estadísticas para un usuario específico
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Response</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {`{
  "success": true,
  "stats": {
    "total": 150,
    "unread": 23,
    "read": 127
  }
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-5 w-5 text-primary" />
                  <CardTitle>Ejemplos de Integración</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Node.js / JavaScript</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {`// Enviar notificación
async function sendNotification(userId, title, message) {
  const response = await fetch('https://tu-dominio.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.NOTIFICATION_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      title: title,
      message: message,
      type: 'info',
      priority: 'normal'
    })
  });
  
  const data = await response.json();
  return data.notification;
}

// Obtener notificaciones de un usuario
async function getUserNotifications(userId) {
  const response = await fetch(
    \`https://tu-dominio.com/api/v1/notifications?user_id=\${userId}&limit=50\`,
    {
      headers: {
        'x-api-key': process.env.NOTIFICATION_API_KEY
      }
    }
  );
  
  const data = await response.json();
  return data.notifications;
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Python</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {`import requests
import os

API_KEY = os.getenv('NOTIFICATION_API_KEY')
BASE_URL = 'https://tu-dominio.com/api/v1'

def send_notification(user_id, title, message, notification_type='info'):
    headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
    }
    
    payload = {
        'user_id': user_id,
        'title': title,
        'message': message,
        'type': notification_type,
        'priority': 'normal'
    }
    
    response = requests.post(
        f'{BASE_URL}/notifications',
        headers=headers,
        json=payload
    )
    
    return response.json()

def get_user_notifications(user_id, limit=50):
    headers = {'x-api-key': API_KEY}
    params = {'user_id': user_id, 'limit': limit}
    
    response = requests.get(
        f'{BASE_URL}/notifications',
        headers=headers,
        params=params
    )
    
    return response.json()`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">PHP</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {`<?php

function sendNotification($userId, $title, $message) {
    $apiKey = getenv('NOTIFICATION_API_KEY');
    
    $data = [
        'user_id' => $userId,
        'title' => $title,
        'message' => $message,
        'type' => 'info',
        'priority' => 'normal'
    ];
    
    $ch = curl_init('https://tu-dominio.com/api/v1/notifications');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'x-api-key: ' . $apiKey,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

?>`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Webhooks</CardTitle>
                <CardDescription>Recibe notificaciones en tiempo real en tu servidor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Los webhooks te permiten recibir una notificación HTTP POST en tu servidor cada vez que se crea una
                  notificación. Configura tu URL de webhook desde el dashboard.
                </p>

                <div>
                  <h4 className="font-semibold mb-2 text-sm">Payload del Webhook</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tu servidor recibirá un POST con el siguiente payload:
                  </p>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {`{
  "event": "notification.created",
  "notification": {
    "id": "uuid",
    "app_id": "uuid",
    "user_id": "usuario123",
    "title": "Título",
    "message": "Mensaje",
    "type": "info",
    "priority": "normal",
    "is_read": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm">Ejemplo de Handler (Node.js/Express)</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {`app.post('/webhook/notifications', express.json(), (req, res) => {
  const { event, notification } = req.body;
  
  if (event === 'notification.created') {
    console.log('Nueva notificación:', notification);
    
    // Procesar la notificación
    // Por ejemplo, enviar un email, push notification, etc.
    
    // Responder con 200 para confirmar recepción
    res.status(200).json({ received: true });
  }
});`}
                  </pre>
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Badge variant="outline" className="mt-1">
                    TIP
                  </Badge>
                  <p className="text-sm">
                    Asegúrate de que tu endpoint de webhook responda con un status 200 para confirmar la recepción. En
                    caso de fallo, el sistema reintentará la petición.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
