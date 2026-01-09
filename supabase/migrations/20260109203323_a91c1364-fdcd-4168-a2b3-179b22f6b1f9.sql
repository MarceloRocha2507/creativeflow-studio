-- Create shop_status table for storing order status
CREATE TABLE public.shop_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  active_orders INTEGER NOT NULL DEFAULT 0,
  accepting_orders BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_status ENABLE ROW LEVEL SECURITY;

-- Everyone can view the status (public)
CREATE POLICY "Anyone can view shop status"
ON public.shop_status
FOR SELECT
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert shop status"
ON public.shop_status
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Only admins can update
CREATE POLICY "Admins can update shop status"
ON public.shop_status
FOR UPDATE
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_shop_status_updated_at
BEFORE UPDATE ON public.shop_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial row
INSERT INTO public.shop_status (active_orders, accepting_orders) VALUES (0, true);