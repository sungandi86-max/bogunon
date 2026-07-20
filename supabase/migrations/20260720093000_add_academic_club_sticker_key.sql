begin;

alter table public.calendar_stickers
  drop constraint if exists calendar_stickers_sticker_key_check;

alter table public.calendar_stickers
  add constraint calendar_stickers_sticker_key_check check (sticker_key in (
    'holiday', 'long-weekend', 'flexible-curriculum', 'other',
    'opening-ceremony', 'vacation-ceremony', 'exam-period', 'school-event',
    'school-closure', 'staff-training',
    'academic.admission', 'academic.semester-end', 'academic.graduation',
    'academic.summer-break', 'academic.winter-break', 'academic.diagnostic-assessment',
    'academic.midterm', 'academic.final', 'academic.performance-assessment',
    'academic.parent-meeting', 'academic.sports-day', 'academic.school-festival',
    'academic.field-trip', 'academic.school-trip', 'academic.graduation-photo',
    'academic.school-orientation', 'academic.principal-discretionary-holiday',
    'academic.substitute-holiday', 'academic.vacation-camp',
    'academic.supplementary-class', 'academic.curriculum-review', 'academic.club',
    'personal.hospital', 'personal.hair-salon', 'personal.appointment', 'personal.travel',
    'personal.date', 'personal.family', 'personal.birthday', 'personal.grocery',
    'personal.dining', 'personal.culture', 'personal.workout-meetup', 'personal.other',
    'health.student-checkup', 'health.urine-test', 'health.tuberculosis-test',
    'health.vision-test', 'health.oral-checkup', 'health.health-survey',
    'health.vaccination-check', 'health.cpr-training', 'health.first-aid-training',
    'health.sex-education', 'health.smoking-prevention', 'health.alcohol-prevention',
    'health.drug-misuse-prevention', 'health.infection-prevention',
    'health.life-respect-education', 'health.obesity-prevention', 'health.aed-check',
    'health.medicine-check', 'health.emergency-kit-check', 'health.health-room-check',
    'health.medical-waste-check', 'health.health-log', 'health.supply-purchase',
    'health.health-committee', 'health.statistics-report', 'health.official-document',
    'health.family-letter', 'health.teacher-cooperation',
    'holiday.new-year', 'holiday.march-first', 'holiday.constitution-day',
    'holiday.buddhas-birthday', 'holiday.labor-day', 'holiday.childrens-day',
    'holiday.memorial-day', 'holiday.liberation-day', 'holiday.national-foundation-day',
    'holiday.hangul-day', 'holiday.christmas', 'holiday.seollal', 'holiday.seollal-break',
    'holiday.chuseok', 'holiday.chuseok-break', 'holiday.substitute',
    'holiday.temporary', 'holiday.election-day'
  )) not valid;

alter table public.calendar_stickers
  validate constraint calendar_stickers_sticker_key_check;

commit;
