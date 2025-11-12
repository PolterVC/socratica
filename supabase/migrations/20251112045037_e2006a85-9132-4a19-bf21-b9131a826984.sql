-- Fix the join_code column to be nullable with a proper default
ALTER TABLE public.courses ALTER COLUMN join_code DROP NOT NULL;
ALTER TABLE public.courses ALTER COLUMN join_code SET DEFAULT upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

-- Update any existing courses that might not have a join_code
UPDATE public.courses 
SET join_code = upper(substring(md5(random()::text || clock_timestamp()::text || id::text) from 1 for 8))
WHERE join_code IS NULL OR join_code = '';