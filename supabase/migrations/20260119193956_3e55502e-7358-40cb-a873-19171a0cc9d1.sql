ALTER TABLE public.payments
DROP COLUMN IF EXISTS mercadopago_payment_id,
DROP COLUMN IF EXISTS mercadopago_preference_id,
DROP COLUMN IF EXISTS mercadopago_init_point;