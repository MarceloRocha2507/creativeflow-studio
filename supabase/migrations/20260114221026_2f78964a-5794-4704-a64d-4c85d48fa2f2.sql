-- Create client_interactions table for timeline
CREATE TABLE public.client_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own interactions"
ON public.client_interactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
ON public.client_interactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
ON public.client_interactions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
ON public.client_interactions
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all interactions"
ON public.client_interactions
FOR SELECT
USING (is_admin(auth.uid()));