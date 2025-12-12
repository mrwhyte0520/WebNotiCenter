-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  priority TEXT NOT NULL DEFAULT 'normal',
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(app_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_app_id ON public.notifications(app_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_applications_api_key ON public.applications(api_key);
CREATE INDEX IF NOT EXISTS idx_applications_owner_id ON public.applications(owner_id);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applications table
CREATE POLICY "Users can view their own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own applications"
  ON public.applications FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own applications"
  ON public.applications FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for notifications table
-- Note: Notifications are accessed by user_id (string) not auth.uid()
-- This allows external apps to send notifications via API key
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can update notifications"
  ON public.notifications FOR UPDATE
  USING (TRUE);

CREATE POLICY "Users can delete notifications"
  ON public.notifications FOR DELETE
  USING (TRUE);

-- RLS Policies for notification_settings table
CREATE POLICY "Users can view notification settings"
  ON public.notification_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create notification settings"
  ON public.notification_settings FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can update notification settings"
  ON public.notification_settings FOR UPDATE
  USING (TRUE);

CREATE POLICY "Users can delete notification settings"
  ON public.notification_settings FOR DELETE
  USING (TRUE);
