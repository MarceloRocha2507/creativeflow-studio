-- Add new columns to shop_status for professional message
ALTER TABLE public.shop_status
ADD COLUMN IF NOT EXISTS estimated_start_time text,
ADD COLUMN IF NOT EXISTS custom_message text;