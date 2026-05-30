-- Add new columns
ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS estimate_file_url text,
  ADD COLUMN IF NOT EXISTS estimate_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS site_visit_date date,
  ADD COLUMN IF NOT EXISTS site_visit_notes text;

-- Storage bucket for attachments (public read so URLs open from mobile)
INSERT INTO storage.buckets (id, name, public)
VALUES ('enquiry-attachments', 'enquiry-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Open policies (matches existing public-by-design approach in this app)
DROP POLICY IF EXISTS "enquiry-attachments read" ON storage.objects;
CREATE POLICY "enquiry-attachments read" ON storage.objects
  FOR SELECT USING (bucket_id = 'enquiry-attachments');

DROP POLICY IF EXISTS "enquiry-attachments insert" ON storage.objects;
CREATE POLICY "enquiry-attachments insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'enquiry-attachments');

DROP POLICY IF EXISTS "enquiry-attachments update" ON storage.objects;
CREATE POLICY "enquiry-attachments update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'enquiry-attachments');

DROP POLICY IF EXISTS "enquiry-attachments delete" ON storage.objects;
CREATE POLICY "enquiry-attachments delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'enquiry-attachments');
