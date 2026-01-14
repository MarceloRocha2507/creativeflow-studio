-- Add new columns to clients table for enhanced client registration
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS client_type text DEFAULT 'pessoa_fisica';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS origin text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS primary_contact_method text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS secondary_phone text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS preferred_contact_time text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS campaign_source text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS first_contact_date date;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS main_interest text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS product_service_interest text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS next_followup_date date;