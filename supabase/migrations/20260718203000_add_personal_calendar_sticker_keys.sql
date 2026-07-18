begin;

alter table public.calendar_stickers
  drop constraint if exists calendar_stickers_sticker_key_check;

alter table public.calendar_stickers
  add constraint calendar_stickers_sticker_key_check check (sticker_key in (
    'vacation-ceremony',
    'opening-ceremony',
    'holiday',
    'long-weekend',
    'school-closure',
    'exam-period',
    'school-event',
    'staff-training',
    'flexible-curriculum',
    'other',
    'personal.hospital',
    'personal.hair-salon',
    'personal.appointment',
    'personal.travel',
    'personal.date',
    'personal.family',
    'personal.birthday',
    'personal.grocery',
    'personal.dining',
    'personal.culture',
    'personal.workout-meetup',
    'personal.other'
  )) not valid;

alter table public.calendar_stickers
  validate constraint calendar_stickers_sticker_key_check;

commit;
