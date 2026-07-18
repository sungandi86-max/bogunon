import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PrivacyPage, { metadata as privacyMetadata } from "@/app/(public)/privacy/page";
import TermsPage, { metadata as termsMetadata } from "@/app/(public)/terms/page";

describe("public legal pages", () => {
  it("publishes the complete privacy notice with accountable contact details", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("heading", { level: 1, name: "개인정보처리방침" })).toBeInTheDocument();
    expect(screen.getByText("BOGUNON 운영자 쑤캥T")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "sungandi@sen.go.kr" })).toHaveAttribute(
      "href",
      "mailto:sungandi@sen.go.kr",
    );
    expect(screen.getByText(/학생 개인정보를 수집하거나 처리하는 용도로 제공되지 않습니다/)).toBeInTheDocument();
    expect(screen.getByText(/회원 탈퇴 또는 삭제 요청 시까지/)).toBeInTheDocument();
    expect(screen.getByText("Supabase")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText(/개인정보를 제3자에게 제공하지 않습니다/)).toBeInTheDocument();
    expect(privacyMetadata.title).toContain("개인정보처리방침");
  });

  it("publishes terms that link back to the privacy notice", () => {
    render(<TermsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "이용약관" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "개인정보처리방침" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(termsMetadata.title).toContain("이용약관");
  });
});
