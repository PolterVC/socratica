-- Create materials storage bucket
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

-- Materials table
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete set null,
  title text not null,
  kind text not null check (kind in ('assignment','questions','answers','questions_with_answers','slides','reading','other')),
  storage_path text not null unique,
  file_size bigint,
  text_extracted boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid not null
);

-- Material text chunks table
create table if not exists public.material_text (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  tsv tsvector,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists material_text_material_idx on public.material_text(material_id, chunk_index);
create index if not exists material_text_tsv_idx on public.material_text using gin(tsv);

-- Trigger to populate tsv
create or replace function public.set_material_tsv() returns trigger as $$
begin
  new.tsv := to_tsvector('english', coalesce(new.content,''));
  return new;
end $$ language plpgsql;

drop trigger if exists material_text_tsv on public.material_text;
create trigger material_text_tsv before insert or update on public.material_text
for each row execute function public.set_material_tsv();

-- RLS
alter table public.materials enable row level security;
alter table public.material_text enable row level security;

-- Materials policies
drop policy if exists "teacher_manage_materials" on public.materials;
drop policy if exists "read_materials_for_enrolled" on public.materials;

create policy "teacher_manage_materials"
on public.materials
for all
to authenticated
using (created_by = auth.uid() and exists (
  select 1 from public.courses c where c.id = course_id and c.teacher_id = auth.uid()
))
with check (created_by = auth.uid() and exists (
  select 1 from public.courses c where c.id = course_id and c.teacher_id = auth.uid()
));

create policy "read_materials_for_enrolled"
on public.materials
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    left join public.enrollments e on e.course_id = c.id and e.student_id = auth.uid()
    where c.id = course_id and (c.teacher_id = auth.uid() or e.student_id is not null)
  )
);

-- Material text policies
drop policy if exists "read_material_text_for_enrolled" on public.material_text;
drop policy if exists "teacher_insert_text_for_own_material" on public.material_text;

create policy "read_material_text_for_enrolled"
on public.material_text
for select
to authenticated
using (
  exists (
    select 1
    from public.materials m
    join public.courses c on c.id = m.course_id
    left join public.enrollments e on e.course_id = c.id and e.student_id = auth.uid()
    where m.id = material_id and (c.teacher_id = auth.uid() or e.student_id is not null)
  )
);

create policy "teacher_insert_text_for_own_material"
on public.material_text
for insert
to authenticated
with check (
  exists (
    select 1 from public.materials m where m.id = material_id and m.created_by = auth.uid()
  )
);