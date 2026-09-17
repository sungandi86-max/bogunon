delete from public.practical_tools
where scope = 'public'
  and owner_id is null
  and (
    (name = 'AED 점검' and url = '/aed')
    or (name = '생기부 도우미' and url = '/ai-writer')
    or (name = '자주 쓰는 링크' and url = '/settings/quick-links')
  );
