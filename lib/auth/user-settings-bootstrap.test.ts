import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";

import { queueUserSettingsBootstrap } from "@/lib/auth/user-settings-bootstrap";

describe("user settings bootstrap queue", () => {
  it("rejects a request without an authenticated user identifier", () => {
    const response = NextResponse.next();

    expect(() => queueUserSettingsBootstrap(response, " ")).toThrow(
      "An authenticated user is required to initialize settings.",
    );
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
