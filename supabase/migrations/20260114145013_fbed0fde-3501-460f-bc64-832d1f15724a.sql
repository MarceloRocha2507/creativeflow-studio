-- Add art_type column to project_arts table
ALTER TABLE project_arts 
ADD COLUMN art_type text NOT NULL DEFAULT 'feed';

-- Add comment for documentation
COMMENT ON COLUMN project_arts.art_type IS 'Tipo da arte: feed, story, flyer, banner, logo, reels, carrossel, outro';