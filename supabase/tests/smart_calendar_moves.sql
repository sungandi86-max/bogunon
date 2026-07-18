begin;
select plan(4);
select has_function('public', 'move_calendar_item', array['text','uuid','date','text'], 'smart calendar move RPC exists');
select function_lang_is('public', 'move_calendar_item', array['text','uuid','date','text'], 'plpgsql', 'move RPC uses plpgsql');
select function_privs_are('public', 'move_calendar_item', array['text','uuid','date','text'], 'anon', array[]::text[], 'anon cannot execute move RPC');
select function_privs_are('public', 'move_calendar_item', array['text','uuid','date','text'], 'authenticated', array['EXECUTE'], 'authenticated users can execute move RPC');
select * from finish();
rollback;
