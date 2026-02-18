
-- Drop existing overly permissive storage policies for barber-content
DROP POLICY IF EXISTS "Authenticated users can upload barber content" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update barber content" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete barber content" ON storage.objects;

-- Create restrictive policies scoped to company ownership
CREATE POLICY "Company owners can upload barber content"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'barber-content' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can update barber content"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'barber-content' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can delete barber content"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'barber-content' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies WHERE owner_user_id = auth.uid()
    )
  );
