-- Add columns for payment confirmation details
ALTER TABLE public.payments
ADD COLUMN payment_method text,
ADD COLUMN fee_percentage numeric DEFAULT 0,
ADD COLUMN fee_amount numeric DEFAULT 0,
ADD COLUMN net_amount numeric,
ADD COLUMN confirmed_at timestamp with time zone,
ADD COLUMN receipt_info text;