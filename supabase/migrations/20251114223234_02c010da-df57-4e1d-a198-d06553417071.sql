-- Fix search path for update_material_text_tsv function
drop function if exists public.update_material_text_tsv(uuid);

create or replace function public.update_material_text_tsv(mat_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.material_text
  set tsv = to_tsvector('english', content)
  where material_id = mat_id;
end;
$$;