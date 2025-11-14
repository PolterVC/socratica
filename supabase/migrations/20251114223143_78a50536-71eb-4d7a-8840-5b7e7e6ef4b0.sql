-- Create function to update tsv column after inserting chunks
create or replace function public.update_material_text_tsv(mat_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.material_text
  set tsv = to_tsvector('english', content)
  where material_id = mat_id;
end;
$$;