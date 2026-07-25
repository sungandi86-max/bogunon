alter table public.record_guidelines
  add constraint record_guidelines_safe_filename
  check (
    original_filename !~ '[\/\\]'
    and original_filename !~ '[[:cntrl:]]'
  );
