-- Add package and Google Drive fields to clients table
ALTER TABLE public.clients 
ADD COLUMN package_total_value numeric,
ADD COLUMN package_total_arts integer,
ADD COLUMN google_drive_link text;