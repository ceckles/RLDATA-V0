-- Create bug reports system for user feedback and admin management

-- Create enum for bug report status
CREATE TYPE bug_report_status AS ENUM ('submitted', 'working', 'resolved', 'fixed');

-- Create bug_reports table
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  status bug_report_status NOT NULL DEFAULT 'submitted',
  browser_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create bug_report_comments table
CREATE TABLE IF NOT EXISTS public.bug_report_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_report_id UUID NOT NULL REFERENCES public.bug_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON public.bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON public.bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON public.bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_report_comments_bug_report_id ON public.bug_report_comments(bug_report_id);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_report_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bug_reports
-- Users can view their own bug reports
CREATE POLICY "Users can view own bug reports"
  ON public.bug_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own bug reports
CREATE POLICY "Users can insert own bug reports"
  ON public.bug_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all bug reports
CREATE POLICY "Admins can view all bug reports"
  ON public.bug_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Admins can update bug reports
CREATE POLICY "Admins can update bug reports"
  ON public.bug_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- RLS Policies for bug_report_comments
-- Users can view comments on their own bug reports
CREATE POLICY "Users can view comments on own reports"
  ON public.bug_report_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bug_reports br
      WHERE br.id = bug_report_id
      AND br.user_id = auth.uid()
    )
  );

-- Admins can view all comments
CREATE POLICY "Admins can view all comments"
  ON public.bug_report_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Admins can insert comments
CREATE POLICY "Admins can insert comments"
  ON public.bug_report_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bug_report_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_bug_reports_updated_at
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_report_updated_at();

-- Create Supabase Storage bucket for bug report screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-reports', 'bug-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for bug-reports bucket
-- Users can upload their own screenshots
CREATE POLICY "Users can upload bug report screenshots"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'bug-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own screenshots
CREATE POLICY "Users can view own bug report screenshots"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'bug-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can view all screenshots
CREATE POLICY "Admins can view all bug report screenshots"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'bug-reports'
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );
