-- Add project_type column to projects table
ALTER TABLE projects 
ADD COLUMN project_type text NOT NULL DEFAULT 'single';