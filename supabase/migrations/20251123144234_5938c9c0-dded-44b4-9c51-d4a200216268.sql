-- Add file_size column to materials table
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS file_size bigint;