-- Remove package fields from clients table
ALTER TABLE public.clients 
DROP COLUMN IF EXISTS package_total_value,
DROP COLUMN IF EXISTS package_total_arts,
DROP COLUMN IF EXISTS google_drive_link;

-- Add package and Google Drive fields to projects table
ALTER TABLE public.projects 
ADD COLUMN package_total_value numeric,
ADD COLUMN package_total_arts integer,
ADD COLUMN google_drive_link text;