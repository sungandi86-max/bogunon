export type CalendarStickerPack = "school" | "academic" | "health" | "personal";
export type CalendarStickerGroup =
  | "school"
  | "semester"
  | "exam"
  | "event"
  | "operation"
  | "screening"
  | "education"
  | "administration"
  | "personal";

export type CalendarStickerDefinition = {
  readonly key: string;
  readonly label: string;
  readonly pack: CalendarStickerPack;
  readonly category: CalendarStickerGroup;
  readonly assetPath: string;
  readonly keywords: readonly string[];
  readonly sortOrder: number;
};

export const SCHOOL_CALENDAR_STICKERS = [
  { key: "holiday", label: "공휴일", pack: "school", category: "school", assetPath: "/stickers/school-calendar/holiday.svg", keywords: ["휴일", "학교"], sortOrder: 10 },
  { key: "long-weekend", label: "연휴", pack: "school", category: "school", assetPath: "/stickers/school-calendar/long-weekend.svg", keywords: ["휴일", "연속 휴일"], sortOrder: 20 },
  { key: "flexible-curriculum", label: "수업량 유연화", pack: "school", category: "school", assetPath: "/stickers/school-calendar/flexible-curriculum.svg", keywords: ["교육과정", "수업"], sortOrder: 30 },
  { key: "other", label: "기타", pack: "school", category: "school", assetPath: "/stickers/school-calendar/other.svg", keywords: ["학교", "일정"], sortOrder: 40 },
] as const satisfies readonly CalendarStickerDefinition[];

export const ACADEMIC_CALENDAR_STICKERS = [
  { key: "academic.admission", label: "입학식", pack: "academic", category: "semester", assetPath: "/stickers/academic/admission.svg", keywords: ["입학", "새학기", "새싹", "책"], sortOrder: 10 },
  { key: "opening-ceremony", label: "개학식", pack: "academic", category: "semester", assetPath: "/stickers/academic/semester-start.svg", keywords: ["개학", "학기 시작", "새학기"], sortOrder: 20 },
  { key: "academic.semester-end", label: "종업식", pack: "academic", category: "semester", assetPath: "/stickers/academic/semester-end.svg", keywords: ["종업", "학기 종료", "마침"], sortOrder: 30 },
  { key: "academic.graduation", label: "졸업식", pack: "academic", category: "semester", assetPath: "/stickers/academic/graduation.svg", keywords: ["졸업", "학사모"], sortOrder: 40 },
  { key: "vacation-ceremony", label: "방학식", pack: "academic", category: "semester", assetPath: "/stickers/academic/vacation-ceremony.svg", keywords: ["방학", "학기 종료", "여행가방"], sortOrder: 50 },
  { key: "academic.summer-break", label: "여름방학", pack: "academic", category: "semester", assetPath: "/stickers/academic/summer-break.svg", keywords: ["방학", "여름", "휴가"], sortOrder: 60 },
  { key: "academic.winter-break", label: "겨울방학", pack: "academic", category: "semester", assetPath: "/stickers/academic/winter-break.svg", keywords: ["방학", "겨울", "눈"], sortOrder: 70 },
  { key: "academic.diagnostic-assessment", label: "진단평가", pack: "academic", category: "exam", assetPath: "/stickers/academic/diagnostic-assessment.svg", keywords: ["시험", "평가", "진단", "시험지"], sortOrder: 110 },
  { key: "academic.midterm", label: "중간고사", pack: "academic", category: "exam", assetPath: "/stickers/academic/midterm.svg", keywords: ["시험", "중간", "고사"], sortOrder: 120 },
  { key: "academic.final", label: "기말고사", pack: "academic", category: "exam", assetPath: "/stickers/academic/final.svg", keywords: ["시험", "기말", "고사"], sortOrder: 130 },
  { key: "exam-period", label: "시험기간", pack: "academic", category: "exam", assetPath: "/stickers/academic/exam-period.svg", keywords: ["시험", "평가", "고사 기간"], sortOrder: 140 },
  { key: "academic.performance-assessment", label: "수행평가", pack: "academic", category: "exam", assetPath: "/stickers/academic/performance-assessment.svg", keywords: ["시험", "평가", "과제", "수행"], sortOrder: 150 },
  { key: "academic.parent-meeting", label: "학부모총회", pack: "academic", category: "event", assetPath: "/stickers/academic/parent-meeting.svg", keywords: ["학부모", "총회", "회의"], sortOrder: 210 },
  { key: "academic.sports-day", label: "체육대회", pack: "academic", category: "event", assetPath: "/stickers/academic/sports-day.svg", keywords: ["운동회", "체육", "행사"], sortOrder: 220 },
  { key: "academic.school-festival", label: "학교축제", pack: "academic", category: "event", assetPath: "/stickers/academic/school-festival.svg", keywords: ["축제", "행사", "가랜드"], sortOrder: 230 },
  { key: "academic.field-trip", label: "현장체험학습", pack: "academic", category: "event", assetPath: "/stickers/academic/field-trip.svg", keywords: ["체험", "현장학습", "버스", "지도"], sortOrder: 240 },
  { key: "academic.school-trip", label: "수학여행", pack: "academic", category: "event", assetPath: "/stickers/academic/school-trip.svg", keywords: ["여행", "숙박", "버스", "캐리어"], sortOrder: 250 },
  { key: "academic.graduation-photo", label: "졸업앨범 촬영", pack: "academic", category: "event", assetPath: "/stickers/academic/graduation-photo.svg", keywords: ["졸업", "앨범", "촬영", "카메라"], sortOrder: 260 },
  { key: "academic.school-orientation", label: "학교 설명회", pack: "academic", category: "event", assetPath: "/stickers/academic/school-orientation.svg", keywords: ["설명회", "발표", "학교 안내"], sortOrder: 270 },
  { key: "school-event", label: "교내행사", pack: "academic", category: "event", assetPath: "/stickers/academic/in-school-event.svg", keywords: ["학교행사", "교내", "행사", "무대"], sortOrder: 280 },
  { key: "school-closure", label: "재량휴업일", pack: "academic", category: "operation", assetPath: "/stickers/academic/discretionary-holiday.svg", keywords: ["휴업", "휴일", "재량"], sortOrder: 310 },
  { key: "academic.principal-discretionary-holiday", label: "학교장 재량휴업일", pack: "academic", category: "operation", assetPath: "/stickers/academic/principal-discretionary-holiday.svg", keywords: ["휴업", "휴일", "학교장", "재량"], sortOrder: 320 },
  { key: "academic.substitute-holiday", label: "대체공휴일", pack: "academic", category: "operation", assetPath: "/stickers/academic/substitute-holiday.svg", keywords: ["휴일", "공휴일", "대체"], sortOrder: 330 },
  { key: "academic.vacation-camp", label: "방학캠프", pack: "academic", category: "operation", assetPath: "/stickers/academic/vacation-camp.svg", keywords: ["방학", "캠프", "텐트"], sortOrder: 340 },
  { key: "academic.supplementary-class", label: "보충수업", pack: "academic", category: "operation", assetPath: "/stickers/academic/supplementary-class.svg", keywords: ["수업", "보충", "책"], sortOrder: 350 },
  { key: "staff-training", label: "교직원 연수", pack: "academic", category: "operation", assetPath: "/stickers/academic/staff-training.svg", keywords: ["교직원", "연수", "교육", "발표"], sortOrder: 360 },
  { key: "academic.curriculum-review", label: "교육과정 평가회", pack: "academic", category: "operation", assetPath: "/stickers/academic/curriculum-review.svg", keywords: ["교육과정", "평가", "회의", "차트"], sortOrder: 370 },
] as const satisfies readonly CalendarStickerDefinition[];

export const HEALTH_CALENDAR_STICKERS = [
  { key: "health.student-checkup", label: "학생건강검진", pack: "health", category: "screening", assetPath: "/stickers/health/student-checkup.svg", keywords: ["건강검진", "학생검진", "검진", "건강검사"], sortOrder: 10 },
  { key: "health.urine-test", label: "소변검사", pack: "health", category: "screening", assetPath: "/stickers/health/urine-test.svg", keywords: ["소변", "요검사", "뇨검사", "별도검사"], sortOrder: 20 },
  { key: "health.tuberculosis-test", label: "결핵검사", pack: "health", category: "screening", assetPath: "/stickers/health/tuberculosis-test.svg", keywords: ["결핵", "흉부촬영", "X-ray", "별도검사"], sortOrder: 30 },
  { key: "health.vision-test", label: "시력검사", pack: "health", category: "screening", assetPath: "/stickers/health/vision-test.svg", keywords: ["시력", "시력표", "눈", "별도검사"], sortOrder: 40 },
  { key: "health.oral-checkup", label: "구강검사", pack: "health", category: "screening", assetPath: "/stickers/health/oral-checkup.svg", keywords: ["구강", "치아", "치과", "별도검사"], sortOrder: 50 },
  { key: "health.health-survey", label: "건강조사", pack: "health", category: "screening", assetPath: "/stickers/health/health-survey.svg", keywords: ["건강조사", "설문", "조사", "학생 건강"], sortOrder: 60 },
  { key: "health.vaccination-check", label: "예방접종 확인", pack: "health", category: "screening", assetPath: "/stickers/health/vaccination-check.svg", keywords: ["예방접종", "접종 확인", "접종", "확인"], sortOrder: 70 },
  { key: "health.cpr-training", label: "심폐소생술 교육", pack: "health", category: "education", assetPath: "/stickers/health/cpr-training.svg", keywords: ["심폐소생술", "CPR", "AED", "응급처치"], sortOrder: 110 },
  { key: "health.first-aid-training", label: "응급처치 교육", pack: "health", category: "education", assetPath: "/stickers/health/first-aid-training.svg", keywords: ["응급처치", "응급", "처치", "안전교육"], sortOrder: 120 },
  { key: "health.sex-education", label: "성교육", pack: "health", category: "education", assetPath: "/stickers/health/sex-education.svg", keywords: ["성교육", "보호", "관계", "인권"], sortOrder: 130 },
  { key: "health.smoking-prevention", label: "흡연예방교육", pack: "health", category: "education", assetPath: "/stickers/health/smoking-prevention.svg", keywords: ["흡연예방", "금연", "담배", "예방"], sortOrder: 140 },
  { key: "health.alcohol-prevention", label: "음주예방교육", pack: "health", category: "education", assetPath: "/stickers/health/alcohol-prevention.svg", keywords: ["음주예방", "술", "알코올", "예방"], sortOrder: 150 },
  { key: "health.drug-misuse-prevention", label: "약물오남용 예방교육", pack: "health", category: "education", assetPath: "/stickers/health/drug-misuse-prevention.svg", keywords: ["약물오남용", "약물", "의약품", "예방"], sortOrder: 160 },
  { key: "health.infection-prevention", label: "감염병 예방교육", pack: "health", category: "education", assetPath: "/stickers/health/infection-prevention.svg", keywords: ["감염병", "감염 예방", "손씻기", "방역"], sortOrder: 170 },
  { key: "health.life-respect-education", label: "생명존중교육", pack: "health", category: "education", assetPath: "/stickers/health/life-respect-education.svg", keywords: ["생명존중", "마음건강", "존중", "상담"], sortOrder: 180 },
  { key: "health.obesity-prevention", label: "비만예방교육", pack: "health", category: "education", assetPath: "/stickers/health/obesity-prevention.svg", keywords: ["비만예방", "영양", "운동", "생활습관"], sortOrder: 190 },
  { key: "health.aed-check", label: "AED 점검", pack: "health", category: "operation", assetPath: "/stickers/health/aed-check.svg", keywords: ["AED", "자동심장충격기", "장비", "점검"], sortOrder: 210 },
  { key: "health.medicine-check", label: "의약품 점검", pack: "health", category: "operation", assetPath: "/stickers/health/medicine-check.svg", keywords: ["의약품", "약품", "재고", "점검"], sortOrder: 220 },
  { key: "health.emergency-kit-check", label: "응급키트 점검", pack: "health", category: "operation", assetPath: "/stickers/health/emergency-kit-check.svg", keywords: ["응급키트", "응급가방", "비상용품", "점검"], sortOrder: 230 },
  { key: "health.health-room-check", label: "보건실 환경점검", pack: "health", category: "operation", assetPath: "/stickers/health/health-room-check.svg", keywords: ["보건실", "환경", "위생", "점검"], sortOrder: 240 },
  { key: "health.medical-waste-check", label: "의료폐기물 점검", pack: "health", category: "operation", assetPath: "/stickers/health/medical-waste-check.svg", keywords: ["의료폐기물", "폐기물", "수거함", "점검"], sortOrder: 250 },
  { key: "health.health-log", label: "보건일지 정리", pack: "health", category: "operation", assetPath: "/stickers/health/health-log.svg", keywords: ["보건일지", "일지", "기록", "정리"], sortOrder: 260 },
  { key: "health.supply-purchase", label: "보건실 물품구매", pack: "health", category: "operation", assetPath: "/stickers/health/supply-purchase.svg", keywords: ["물품구매", "구매", "물품", "비품"], sortOrder: 270 },
  { key: "health.health-committee", label: "보건위원회", pack: "health", category: "administration", assetPath: "/stickers/health/health-committee.svg", keywords: ["보건위원회", "위원회", "회의", "협의"], sortOrder: 310 },
  { key: "health.statistics-report", label: "통계 보고", pack: "health", category: "administration", assetPath: "/stickers/health/statistics-report.svg", keywords: ["통계", "보고", "자료", "차트"], sortOrder: 320 },
  { key: "health.official-document", label: "공문 제출", pack: "health", category: "administration", assetPath: "/stickers/health/official-document.svg", keywords: ["공문", "제출", "문서", "보고"], sortOrder: 330 },
  { key: "health.family-letter", label: "가정통신문 발송", pack: "health", category: "administration", assetPath: "/stickers/health/family-letter.svg", keywords: ["가정통신문", "통신문", "발송", "안내장"], sortOrder: 340 },
  { key: "health.teacher-cooperation", label: "담임 협조 요청", pack: "health", category: "administration", assetPath: "/stickers/health/teacher-cooperation.svg", keywords: ["담임", "협조", "안내", "학급"], sortOrder: 350 },
] as const satisfies readonly CalendarStickerDefinition[];

export const PERSONAL_CALENDAR_STICKERS = [
  { key: "personal.hospital", label: "병원", pack: "personal", category: "personal", assetPath: "/stickers/personal-calendar/hospital.svg", keywords: ["진료", "예약"], sortOrder: 10 },
  { key: "personal.hair-salon", label: "미용실", pack: "personal", category: "personal", assetPath: "/stickers/personal-calendar/hair-salon.svg", keywords: ["미용", "예약"], sortOrder: 20 },
  { key: "personal.appointment", label: "약속", pack: "personal", category: "personal", assetPath: "/stickers/personal-calendar/appointment.svg", keywords: ["만남", "일정"], sortOrder: 30 },
  { key: "personal.travel", label: "여행", pack: "personal", category: "personal", assetPath: "/stickers/personal-calendar/travel.svg", keywords: ["휴가", "관광"], sortOrder: 40 },
  { key: "personal.date", label: "데이트", pack: "personal", category: "personal", assetPath: "/stickers/personal-calendar/date.svg", keywords: ["만남", "약속"], sortOrder: 50 },
  { key: "personal.family", label: "가족 일정", pack: "personal", category: "personal", assetPath: "/stickers/personal-calendar/family.svg", keywords: ["가족", "모임"], sortOrder: 60 },
  { key: "personal.birthday", label: "생일", pack: "personal", category: "personal", assetPath: "/stickers/personal-calendar/birthday.svg", keywords: ["기념일", "축하"], sortOrder: 70 },
  { key: "personal.grocery", label: "장보기", pack: "personal", category: "personal", assetPath: "/stickers/personal-calendar/grocery.svg", keywords: ["쇼핑", "마트"], sortOrder: 80 },
  { key: "personal.dining", label: "외식", pack: "personal", category: "personal", assetPath: "/stickers/personal-calendar/dining.svg", keywords: ["식사", "예약"], sortOrder: 90 },
  { key: "personal.culture", label: "공연·전시", pack: "personal", category: "personal", assetPath: "/stickers/personal-calendar/culture.svg", keywords: ["문화", "관람"], sortOrder: 100 },
  { key: "personal.workout-meetup", label: "운동 약속", pack: "personal", category: "personal", assetPath: "/stickers/personal-calendar/workout-meetup.svg", keywords: ["운동", "만남"], sortOrder: 110 },
  { key: "personal.other", label: "기타", pack: "personal", category: "personal", assetPath: "/stickers/personal-calendar/other.svg", keywords: ["개인", "일정"], sortOrder: 120 },
] as const satisfies readonly CalendarStickerDefinition[];

export const CALENDAR_STICKER_CATALOG = [...SCHOOL_CALENDAR_STICKERS, ...ACADEMIC_CALENDAR_STICKERS, ...HEALTH_CALENDAR_STICKERS, ...PERSONAL_CALENDAR_STICKERS] as const;

export type CalendarStickerKey = (typeof CALENDAR_STICKER_CATALOG)[number]["key"];
export type CalendarStickerRegistryEntry = (typeof CALENDAR_STICKER_CATALOG)[number];
export type CalendarStickerCategory = "school" | "personal";

export function calendarStickerCategory(key: string): CalendarStickerCategory {
  return calendarStickerByKey(key)?.pack === "personal" ? "personal" : "school";
}

export function calendarStickerByKey(key: string): CalendarStickerRegistryEntry | undefined {
  return CALENDAR_STICKER_CATALOG.find((sticker) => sticker.key === key);
}

export function filterCalendarStickers(catalog: readonly CalendarStickerDefinition[], query: string, category: CalendarStickerGroup | "all" = "all"): readonly CalendarStickerDefinition[] {
  const normalized = query.trim().toLocaleLowerCase("ko-KR");
  return catalog
    .filter((sticker) => category === "all" || sticker.category === category)
    .filter((sticker) => !normalized || [sticker.label, sticker.category, sticker.pack, ...sticker.keywords].some((value) => value.toLocaleLowerCase("ko-KR").includes(normalized)))
    .toSorted((left, right) => left.sortOrder - right.sortOrder);
}
