-- Migration: Update notion_templates table
ALTER TABLE public.notion_templates
  DROP COLUMN IF EXISTS image_1,
  DROP COLUMN IF EXISTS image_2,
  DROP COLUMN IF EXISTS image_3,
  DROP COLUMN IF EXISTS image_4;

ALTER TABLE public.notion_templates
  ADD COLUMN IF NOT EXISTS short_description TEXT; 