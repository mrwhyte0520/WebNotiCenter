export interface Notification {
  id: string
  app_id: string
  user_id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  priority: "low" | "normal" | "high" | "urgent"
  is_read: boolean
  data?: Record<string, any>
  created_at: string
  read_at?: string
  expires_at?: string
}

export interface Application {
  id: string
  name: string
  api_key: string
  owner_id: string
  webhook_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NotificationSettings {
  id: string
  app_id: string
  user_id: string
  enabled: boolean
  email_notifications: boolean
  push_notifications: boolean
  settings?: Record<string, any>
  created_at: string
  updated_at: string
}
