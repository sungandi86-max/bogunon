import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  upsert: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  })),
}));

import { getDefaultNeisSchool, upsertDefaultNeisSchool } from "@/lib/neis/school-settings";

const school = {
  officeCode: "B10",
  schoolCode: "7010082",
  name: "여의도고등학교",
  officeName: "서울특별시교육청",
};

describe("NEIS default school settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.maybeSingle.mockResolvedValue({
      data: {
        neis_office_code: school.officeCode,
        neis_school_code: school.schoolCode,
        neis_school_name: school.name,
        neis_office_name: school.officeName,
      },
      error: null,
    });
    mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.upsert.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ select: mocks.select, upsert: mocks.upsert });
  });

  it("loads only the authenticated user's saved school", async () => {
    await expect(getDefaultNeisSchool()).resolves.toEqual(school);
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("upserts the four school fields under the authenticated user id", async () => {
    await expect(upsertDefaultNeisSchool(school)).resolves.toBeUndefined();
    expect(mocks.upsert).toHaveBeenCalledWith({
      user_id: "user-1",
      neis_office_code: "B10",
      neis_school_code: "7010082",
      neis_school_name: "여의도고등학교",
      neis_office_name: "서울특별시교육청",
    }, { onConflict: "user_id" });
  });
});
