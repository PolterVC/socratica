-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('student', 'teacher');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role on signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Teachers can view their own courses"
  ON public.courses FOR SELECT
  USING (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());

CREATE POLICY "Students can view courses they have assignments in"
  ON public.courses FOR SELECT
  USING (public.has_role(auth.uid(), 'student'));

CREATE POLICY "Teachers can create courses"
  ON public.courses FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own courses"
  ON public.courses FOR UPDATE
  USING (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own courses"
  ON public.courses FOR DELETE
  USING (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  allow_direct_answers BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Assignments policies
CREATE POLICY "Teachers can manage assignments in their courses"
  ON public.assignments FOR ALL
  USING (
    public.has_role(auth.uid(), 'teacher') AND
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = assignments.course_id
        AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view assignments"
  ON public.assignments FOR SELECT
  USING (public.has_role(auth.uid(), 'student'));

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Students can view their own conversations"
  ON public.conversations FOR SELECT
  USING (public.has_role(auth.uid(), 'student') AND student_id = auth.uid());

CREATE POLICY "Students can create their own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'student') AND student_id = auth.uid());

CREATE POLICY "Teachers can view conversations in their courses"
  ON public.conversations FOR SELECT
  USING (
    public.has_role(auth.uid(), 'teacher') AND
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = conversations.course_id
        AND courses.teacher_id = auth.uid()
    )
  );

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('student', 'tutor')),
  text TEXT NOT NULL,
  question_number INTEGER,
  topic_tag TEXT,
  confusion_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Students can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view messages in their course conversations"
  ON public.messages FOR SELECT
  USING (
    public.has_role(auth.uid(), 'teacher') AND
    EXISTS (
      SELECT 1 FROM public.conversations
      JOIN public.courses ON courses.id = conversations.course_id
      WHERE conversations.id = messages.conversation_id
        AND courses.teacher_id = auth.uid()
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();