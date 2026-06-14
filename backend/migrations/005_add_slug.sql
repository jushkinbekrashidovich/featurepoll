-- Add slug column to projects
ALTER TABLE projects ADD COLUMN slug text UNIQUE;

-- Update existing projects with a generated slug (for seed data)
UPDATE projects SET slug = lower(replace(name, ' ', '-')) WHERE slug IS NULL;

-- Make slug NOT NULL after backfill
ALTER TABLE projects ALTER COLUMN slug SET NOT NULL;
