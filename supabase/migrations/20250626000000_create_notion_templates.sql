-- Create notion_templates table
CREATE TABLE public.notion_templates (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    template_name TEXT NOT NULL,
    template_description TEXT,
    price_usd NUMERIC(10, 2),
    cover_photo TEXT,
    face_photo TEXT,
    image_1 TEXT,
    image_2 TEXT,
    image_3 TEXT,
    image_4 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for notion_templates table
ALTER TABLE public.notion_templates ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to notion templates"
ON public.notion_templates
FOR SELECT
USING (true);

-- Allow insert for authenticated users
CREATE POLICY "Allow insert for authenticated users on notion templates"
ON public.notion_templates
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Create storage bucket for notion templates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('notion-templates', 'notion-templates', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif']);

-- RLS for notion-templates bucket
CREATE POLICY "Allow public read access to notion-templates"
ON storage.objects
FOR SELECT
USING (bucket_id = 'notion-templates');

CREATE POLICY "Allow insert for authenticated users on notion-templates"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'notion-templates' AND auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users on notion-templates"
ON storage.objects
FOR UPDATE
WITH CHECK (bucket_id = 'notion-templates' AND auth.role() = 'authenticated'); 