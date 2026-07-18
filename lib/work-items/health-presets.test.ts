import { describe, expect, it } from "vitest";

import { HEALTH_PRESETS } from "@/lib/work-items/health-presets";

describe("HEALTH_PRESETS", () => {
  it("contains the exact 12 requested school-health shortcuts", () => {
    expect(HEALTH_PRESETS.map((item) => item.name)).toEqual(["보건일지 작성", "보건소식지 작성·게시", "보건실 침구 세탁", "건강검진 준비", "보건교육 기안", "보건교육 실시", "보건교육 결과 보고", "검진 결과 보고", "약품·응급물품 점검", "보건실 월간 통계", "보건 관련 공문 확인·처리", "제출·회신 확인"]);
    expect(HEALTH_PRESETS).toHaveLength(12);
  });

  it("uses only existing Task/Event fields and required defaults", () => {
    const log = HEALTH_PRESETS.find((item) => item.key === "health-log");
    const education = HEALTH_PRESETS.find((item) => item.key === "health-education-event");
    const monthly = HEALTH_PRESETS.find((item) => item.key === "monthly-statistics");
    expect(log).toMatchObject({ kind: "task", estimatedMinutes: 10, recurrenceFrequency: "daily", checklist: ["당일 보건실 운영 내용 확인", "필요한 기록 정리", "일지 작성 완료"] });
    expect(education).toMatchObject({ kind: "event", title: "보건교육", estimatedMinutes: 50, startTime: "09:00", endTime: "09:50" });
    expect(monthly).toMatchObject({ title: "보건실 월간 통계 정리", estimatedMinutes: 30, recurrenceFrequency: "monthly" });
    expect(HEALTH_PRESETS.every((item) => item.area === "healthWork" && item.checklist.every((text) => !/학생 이름|학번|질병명|연락처/.test(text)))).toBe(true);
  });
});
