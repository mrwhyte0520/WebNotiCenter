# WebNotiCenter

Centro de Notificaciones (Next.js + Supabase) para crear, recibir y visualizar notificaciones por aplicación/usuario.

## Requisitos

- Node.js 18+
- Cuenta/Proyecto en Supabase

## Configuración

1. Instala dependencias:

```bash
npm install
```

2. Crea/ajusta tu `.env.local` (no se sube al repo). Debes tener al menos:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Opcional para envío de emails:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

3. (Opcional) Ejecuta los scripts SQL en Supabase (carpeta `scripts/`).

## Correr en desarrollo

```bash
npm run dev
```

Luego abre `http://localhost:3000`.
