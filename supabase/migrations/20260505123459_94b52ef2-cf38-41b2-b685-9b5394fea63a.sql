
-- Automation log table for duplicate prevention
CREATE TABLE IF NOT EXISTS public.whatsapp_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID,
  course_id UUID,
  class_id UUID,
  session_id UUID,
  enrollment_id UUID,
  message_type TEXT NOT NULL,
  reminder_stage TEXT,
  phone TEXT,
  message_body TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT DEFAULT 'hostgrap',
  api_response JSONB,
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wal_dedupe
  ON public.whatsapp_automation_logs (student_id, message_type, reminder_stage, course_id, class_id, session_id, status);
CREATE INDEX IF NOT EXISTS idx_wal_created ON public.whatsapp_automation_logs (created_at DESC);

ALTER TABLE public.whatsapp_automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage automation_logs"
  ON public.whatsapp_automation_logs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read own automation_logs"
  ON public.whatsapp_automation_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

-- Automation settings
CREATE TABLE IF NOT EXISTS public.whatsapp_automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  expiry_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  expiry_stages JSONB NOT NULL DEFAULT '{"d7":true,"d3":true,"d1":true,"d0":true,"expired":true}'::jsonb,
  class_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  class_stages JSONB NOT NULL DEFAULT '{"h24":true,"h1":true,"m10":true}'::jsonb,
  default_reminder_time TIME DEFAULT '09:00',
  last_expiry_run_at TIMESTAMPTZ,
  last_class_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_automation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage automation_settings"
  ON public.whatsapp_automation_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.whatsapp_automation_settings DEFAULT VALUES;
