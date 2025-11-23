-- Update the materials kind check constraint to include new material types
ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_kind_check;

ALTER TABLE public.materials 
ADD CONSTRAINT materials_kind_check 
CHECK (kind IN ('questions', 'answers', 'questions_with_answers', 'slides', 'reading', 'other'));