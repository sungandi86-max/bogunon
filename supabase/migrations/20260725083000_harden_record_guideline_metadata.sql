alter table public.record_guidelines
  add constraint record_guidelines_safe_filename
  check (
    original_filename !~ '[\/\\]'
    and original_filename !~ '[[:cntrl:]]'
  );

create or replace function public.enforce_record_guideline_year_text_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  existing_length bigint;
begin
  select coalesce(sum(char_length(extracted_text)), 0)
    into existing_length
    from public.record_guidelines
   where user_id = new.user_id
     and school_year = new.school_year
     and id <> new.id;

  if existing_length + char_length(new.extracted_text) > 100000 then
    raise exception 'record guideline yearly text limit exceeded'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger record_guidelines_year_text_limit
before insert or update of user_id, school_year, extracted_text
on public.record_guidelines
for each row execute function public.enforce_record_guideline_year_text_limit();
