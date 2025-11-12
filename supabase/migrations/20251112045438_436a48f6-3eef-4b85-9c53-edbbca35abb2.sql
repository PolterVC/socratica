-- Drop problematic RLS policies
DROP POLICY IF EXISTS "Students can view enrolled courses" ON public.courses;
DROP POLICY IF EXISTS "Students can view assignments in enrolled courses" ON public.assignments;
DROP POLICY IF EXISTS "Students can create conversations in enrolled courses" ON public.conversations;

-- Create security definer function to check enrollment
CREATE OR REPLACE FUNCTION public.is_enrolled(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE student_id = _user_id
      AND course_id = _course_id
  )
$$;

-- Re-create courses RLS policies without recursion
CREATE POLICY "Students can view enrolled courses"
ON public.courses FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role)
  AND public.is_enrolled(auth.uid(), id)
);

-- Re-create assignments RLS policies without recursion
CREATE POLICY "Students can view assignments in enrolled courses"
ON public.assignments FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role)
  AND public.is_enrolled(auth.uid(), course_id)
);

-- Re-create conversations RLS policy without recursion
CREATE POLICY "Students can create conversations in enrolled courses"
ON public.conversations FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'student'::app_role) 
  AND student_id = auth.uid()
  AND public.is_enrolled(auth.uid(), course_id)
);