-- Add Mercado Pago fields to payments table
ALTER TABLE public.payments
ADD COLUMN mercadopago_payment_id TEXT,
ADD COLUMN mercadopago_preference_id TEXT,
ADD COLUMN mercadopago_init_point TEXT;