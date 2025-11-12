-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Add join_code to courses table
ALTER TABLE public.courses ADD COLUMN join_code TEXT NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8);
CREATE UNIQUE INDEX courses_join_code_idx ON public.courses(join_code);

-- Enable RLS on enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies for enrollments
CREATE POLICY "Students can view their own enrollments"
ON public.enrollments FOR SELECT
USING (has_role(auth.uid(), 'student'::app_role) AND student_id = auth.uid());

CREATE POLICY "Students can create their own enrollments"
ON public.enrollments FOR INSERT
WITH CHECK (has_role(auth.uid(), 'student'::app_role) AND student_id = auth.uid());

CREATE POLICY "Teachers can view enrollments in their courses"
ON public.enrollments FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = enrollments.course_id 
    AND courses.teacher_id = auth.uid()
  )
);

-- Update courses RLS: Students can only view courses they're enrolled in
DROP POLICY IF EXISTS "Students can view courses they have assignments in" ON public.courses;
CREATE POLICY "Students can view enrolled courses"
ON public.courses FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE enrollments.course_id = courses.id 
    AND enrollments.student_id = auth.uid()
  )
);

-- Update assignments RLS: Students can only view assignments in enrolled courses
DROP POLICY IF EXISTS "Students can view assignments" ON public.assignments;
CREATE POLICY "Students can view assignments in enrolled courses"
ON public.assignments FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE enrollments.course_id = assignments.course_id 
    AND enrollments.student_id = auth.uid()
  )
);

-- Update conversations RLS: Students can only create conversations for enrolled courses
DROP POLICY IF EXISTS "Students can create their own conversations" ON public.conversations;
CREATE POLICY "Students can create conversations in enrolled courses"
ON public.conversations FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'student'::app_role) 
  AND student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE enrollments.course_id = conversations.course_id 
    AND enrollments.student_id = auth.uid()
  )
);