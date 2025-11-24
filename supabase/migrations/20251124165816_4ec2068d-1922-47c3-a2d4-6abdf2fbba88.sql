-- Fix search_path for security
create or replace function public.set_material_tsv() returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  new.tsv := to_tsvector('english', coalesce(new.content,''));
  return new;
end $$;