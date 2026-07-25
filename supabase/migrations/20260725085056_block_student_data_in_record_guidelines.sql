alter table public.record_guidelines
  add constraint record_guidelines_no_student_personal_data
  check (
    extracted_text !~ '[0-9]{6}[-[:space:]]?[1-4][0-9]{6}'
    and extracted_text !~* '(연락처|전화(번호)?|휴대폰)[[:space:]]*[:#-]?[[:space:]]*0[0-9]{1,2}[-[:space:]]?[0-9]{3,4}[-[:space:]]?[0-9]{4}'
    and extracted_text !~ '(학생[[:space:]]*)?(이름|성명)[[:space:]]*[:#-][[:space:]]*[가-힣]{2,4}([[:space:]]|$|[,.;])'
    and extracted_text !~ '[0-9]{1,2}학년[[:space:]]*[0-9]{1,2}반[[:space:]]*[0-9]{1,2}번'
  );

create or replace function public.enforce_record_guideline_year_text_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  existing_count bigint;
  existing_length bigint;
  new_label_length integer;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(new.user_id::text || ':' || new.school_year::text, 0)
  );

  select
    count(*),
    coalesce(sum(
      char_length(extracted_text)
      + case document_type
          when 'guide' then char_length('[학교생활기록부 기재요령]') + 1
          when 'correction' then char_length('[교육부 공식 정오표]') + 1
          when 'supplement' then char_length('[공식 보완자료]') + 1
          when 'other' then char_length('[기타 공개 기준자료]') + 1
        end
    ), 0)
  into existing_count, existing_length
  from public.record_guidelines
  where user_id = new.user_id
    and school_year = new.school_year
    and id <> new.id;

  new_label_length := case new.document_type
    when 'guide' then char_length('[학교생활기록부 기재요령]') + 1
    when 'correction' then char_length('[교육부 공식 정오표]') + 1
    when 'supplement' then char_length('[공식 보완자료]') + 1
    when 'other' then char_length('[기타 공개 기준자료]') + 1
  end;

  if existing_length
      + char_length(new.extracted_text)
      + new_label_length
      + (existing_count * 2) > 100000 then
    raise exception 'record guideline yearly text limit exceeded'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
