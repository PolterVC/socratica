-- Fix the materials read policy to properly link materials to courses
DROP POLICY IF EXISTS "read_materials_for_enrolled" ON public.materials;

CREATE POLICY "read_materials_for_enrolled" 
ON public.materials 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM courses c
    LEFT JOIN enrollments e ON (e.course_id = c.id AND e.student_id = auth.uid())
    WHERE c.id = materials.course_id 
      AND (c.teacher_id = auth.uid() OR e.student_id IS NOT NULL)
  )
);