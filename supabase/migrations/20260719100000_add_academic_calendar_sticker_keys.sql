begin;

alter table public.calendar_stickers
  drop constraint if exists calendar_stickers_sticker_key_check;

alter table public.calendar_stickers
  add constraint calendar_stickers_sticker_key_check check (sticker_key in (
    'holiday',
    'long-weekend',
    'flexible-curriculum',
    'other',
    'opening-ceremony',
    'vacation-ceremony',
    'exam-period',
    'school-event',
    'school-closure',
    'staff-training',
    'academic.admission',
    'academic.semester-end',
    'academic.graduation',
    'academic.summer-break',
    'academic.winter-break',
    'academic.diagnostic-assessment',
    'academic.midterm',
    'academic.final',
    'academic.performance-assessment',
    'academic.parent-meeting',
    'academic.sports-day',
    'academic.school-festival',
    'academic.field-trip',
    'academic.school-trip',
    'academic.graduation-photo',
    'academic.school-orientation',
    'academic.principal-discretionary-holiday',
    'academic.substitute-holiday',
    'academic.vacation-camp',
    'academic.supplementary-class',
    'academic.curriculum-review',
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
