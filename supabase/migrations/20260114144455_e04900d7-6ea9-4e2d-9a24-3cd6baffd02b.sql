-- Create project_arts table for package art items
CREATE TABLE public.project_arts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  order_index integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_arts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own project arts"
  ON public.project_arts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project arts"
  ON public.project_arts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project arts"
  ON public.project_arts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project arts"
  ON public.project_arts FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all project arts"
  ON public.project_arts FOR SELECT
  USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_project_arts_updated_at
  BEFORE UPDATE ON public.project_arts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();