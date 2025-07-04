-- Make the data101 bucket public so the video can be accessed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'data101';

-- Create policy to allow public access to objects in data101 bucket
CREATE POLICY "Public access to data101 bucket" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'data101');