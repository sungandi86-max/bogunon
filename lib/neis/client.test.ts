import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchNeisSchedules,
  searchNeisSchools,
} from "@/lib/neis/client";

const originalApiKey = process.env["NEIS_API_KEY"];

describe("NEIS server client", () => {
  beforeEach(() => {
    process.env["NEIS_API_KEY"] = "test-server-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalApiKey === undefined) delete process.env["NEIS_API_KEY"];
    else process.env["NEIS_API_KEY"] = originalApiKey;
  });

  it("fails safely when the server API key is missing", async () => {
    delete process.env["NEIS_API_KEY"];

    await expect(searchNeisSchools({ query: "상계고" })).rejects.toMatchObject({
      code: "missing-key",
    });
  });

  it("maps school search rows without returning the API key", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return new Response(JSON.stringify({
      schoolInfo: [
        { head: [{ list_total_count: 1 }, { RESULT: { CODE: "INFO-000", MESSAGE: "정상 처리되었습니다." } }] },
        { row: [{
          ATPT_OFCDC_SC_CODE: "B10",
          ATPT_OFCDC_SC_NM: "서울특별시교육청",
          SD_SCHUL_CODE: "7010082",
          SCHUL_NM: "상계고등학교",
          SCHUL_KND_SC_NM: "고등학교",
          LCTN_SC_NM: "서울특별시",
          JU_ORG_NM: "서울특별시교육청",
          ORG_RDNMA: "서울특별시 노원구 노해로 432",
        }] },
      ],
      }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const schools = await searchNeisSchools({ query: "상계고", officeCode: "B10" });

    expect(schools).toEqual([{
      officeCode: "B10",
      schoolCode: "7010082",
      name: "상계고등학교",
      type: "고등학교",
      region: "서울특별시",
      officeName: "서울특별시교육청",
      address: "서울특별시 노원구 노해로 432",
    }]);
    const requestUrl = fetchMock.mock.calls[0]?.[0];
    expect(requestUrl).toBeInstanceOf(URL);
    if (!(requestUrl instanceof URL)) throw new Error("URL 요청이 필요합니다.");
    expect(requestUrl.searchParams.get("KEY")).toBe("test-server-key");
    expect(JSON.stringify(schools)).not.toContain("test-server-key");
  });

  it("returns an empty list for the official no-data response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      RESULT: { CODE: "INFO-200", MESSAGE: "해당하는 데이터가 없습니다." },
    }))));

    await expect(searchNeisSchools({ query: "없는학교" })).resolves.toEqual([]);
  });

  it("rejects malformed responses instead of treating them as no data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({}))));

    await expect(searchNeisSchools({ query: "상계고" })).rejects.toMatchObject({
      code: "invalid-response",
    });
    await expect(fetchNeisSchedules({
      officeCode: "B10",
      schoolCode: "7010082",
      schoolName: "상계고등학교",
      fromDate: "2026-03-01",
      toDate: "2026-03-31",
    })).rejects.toMatchObject({ code: "invalid-response" });
  });

  it("maps, sorts, and labels schedule grades", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      SchoolSchedule: [
        { head: [{ list_total_count: 2 }, { RESULT: { CODE: "INFO-000", MESSAGE: "정상 처리되었습니다." } }] },
        { row: [
          { AA_YMD: "20260303", EVENT_NM: "입학식", EVENT_CNTNT: "체육관", ONE_GRADE_EVENT_YN: "Y", TW_GRADE_EVENT_YN: "N", THREE_GRADE_EVENT_YN: "N", FR_GRADE_EVENT_YN: "*", FIV_GRADE_EVENT_YN: "*", SIX_GRADE_EVENT_YN: "*" },
          { AA_YMD: "20260302", EVENT_NM: "개학식", EVENT_CNTNT: "", ONE_GRADE_EVENT_YN: "Y", TW_GRADE_EVENT_YN: "Y", THREE_GRADE_EVENT_YN: "Y", FR_GRADE_EVENT_YN: "*", FIV_GRADE_EVENT_YN: "*", SIX_GRADE_EVENT_YN: "*" },
          { AA_YMD: "20260304", EVENT_NM: "초등 행사", EVENT_CNTNT: "", ONE_GRADE_EVENT_YN: "Y", TW_GRADE_EVENT_YN: "Y", THREE_GRADE_EVENT_YN: "Y", FR_GRADE_EVENT_YN: "Y", FIV_GRADE_EVENT_YN: "Y", SIX_GRADE_EVENT_YN: "N" },
        ] },
      ],
    }))));

    const schedules = await fetchNeisSchedules({
      officeCode: "B10",
      schoolCode: "7010082",
      schoolName: "상계고등학교",
      fromDate: "2026-03-01",
      toDate: "2026-03-31",
    });

    expect(schedules.map((item) => item.title)).toEqual(["개학식", "입학식", "초등 행사"]);
    expect(schedules[0]).toMatchObject({ date: "2026-03-02", grades: ["전 학년"] });
    expect(schedules[1]).toMatchObject({ date: "2026-03-03", grades: ["1학년"], content: "체육관" });
    expect(schedules[2]).toMatchObject({ grades: ["1학년", "2학년", "3학년", "4학년", "5학년"] });
  });

  it("converts NEIS and network failures into safe typed errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      RESULT: { CODE: "ERROR-300", MESSAGE: "인증키가 유효하지 않습니다." },
    }))));
    await expect(searchNeisSchools({ query: "상계고" })).rejects.toMatchObject({ code: "api-error" });

    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed with secret URL"); }));
    await expect(searchNeisSchools({ query: "상계고" })).rejects.toMatchObject({ code: "network-error" });
  });
});
