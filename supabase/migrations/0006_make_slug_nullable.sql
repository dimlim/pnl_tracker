-- Make slug column nullable in assets table
ALTER TABLE assets ALTER COLUMN slug DROP NOT NULL;
