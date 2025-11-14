-- Create materials table for PDFs
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete set null,
  title text not null,
  kind text not null check (kind in ('assignment','slides','reading','other')),
  storage_path text not null,
  text_extracted boolean not null default false,
  created_at timestamp with time zone default now(),
  created_by uuid not null
);

-- Create material_text table for extracted chunks
create table if not exists public.material_text (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Add full text search column
alter table public.material_text add column tsv tsvector;
create index material_text_tsv_idx on public.material_text using gin(tsv);

-- Enable RLS
alter table public.materials enable row level security;
alter table public.material_text enable row level security;

-- Teachers can manage their course materials
create policy "teacher_manage_materials"
on public.materials
for all
using (
  auth.uid() = created_by and 
  exists (
    select 1 from public.courses c 
    where c.id = course_id and c.teacher_id = auth.uid()
  )
)
with check (
  auth.uid() = created_by and 
  exists (
    select 1 from public.courses c 
    where c.id = course_id and c.teacher_id = auth.uid()
  )
);

-- Enrolled students and teachers can read materials
create policy "read_materials_for_enrolled"
on public.materials
for select
using (
  exists (
    select 1 from public.courses c
    left join public.enrollments e on e.course_id = c.id and e.student_id = auth.uid()
    where c.id = course_id and (c.teacher_id = auth.uid() or e.student_id is not null)
  )
);

-- Enrolled students and teachers can read material text
create policy "read_material_text_for_enrolled"
on public.material_text
for select
using (
  exists (
    select 1 from public.materials m
    join public.courses c on c.id = m.course_id
    left join public.enrollments e on e.course_id = c.id and e.student_id = auth.uid()
    where m.id = material_id and (c.teacher_id = auth.uid() or e.student_id is not null)
  )
);

-- Create storage bucket for materials
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

-- Storage policies for materials bucket
create policy "Teachers can upload materials"
on storage.objects
for insert
with check (
  bucket_id = 'materials' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Teachers can delete their materials"
on storage.objects
for delete
using (
  bucket_id = 'materials' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Enrolled users can download materials"
on storage.objects
for select
using (
  bucket_id = 'materials' and
  exists (
    select 1 from public.courses c
    left join public.enrollments e on e.course_id = c.id and e.student_id = auth.uid()
    where c.id::text = (storage.foldername(name))[1] and (c.teacher_id = auth.uid() or e.student_id is not null)
  )
);