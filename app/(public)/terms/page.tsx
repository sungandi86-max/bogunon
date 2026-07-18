import type { Metadata } from "next";
import Link from "next/link";

import { PublicLegalPage } from "@/components/legal/public-legal-page";

export const metadata: Metadata = {
  title: "이용약관 | BOGUNON",
  description: "BOGUNON 서비스 이용 조건과 이용자의 책임을 안내합니다.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PublicLegalPage
      description="BOGUNON을 안전하게 이용하기 위한 기본 조건입니다."
      title="이용약관"
      updatedAt="2026-07-19"
    >
      <section><h2>1. 목적과 적용</h2><p>이 약관은 BOGUNON이 제공하는 교사용 개인 일정·업무 관리 서비스의 이용 조건을 정합니다. 서비스를 이용하면 이 약관과 <Link href="/privacy">개인정보처리방침</Link>에 동의한 것으로 봅니다.</p></section>
      <section><h2>2. 계정</h2><p>이용자는 본인의 Google 계정으로 로그인하며 계정 접근정보를 안전하게 관리해야 합니다. 비정상 접근을 알게 되면 즉시 운영자에게 알려 주세요.</p></section>
      <section><h2>3. 허용되는 이용</h2><p>BOGUNON은 교사 개인의 일정, 업무, 워크플로와 일반적인 운동 기록을 정리하는 용도입니다. 타인의 권리를 침해하거나 서비스 보안을 해치는 방식으로 사용할 수 없습니다.</p></section>
      <section><h2>4. 학생 정보 입력 금지</h2><div className="legal-callout"><strong>학생 개인정보와 건강정보를 입력하지 마세요.</strong><p>학생 이름, 학번, 연락처, 질병명, 상담·진료 내용 등 학생을 식별하거나 건강 상태를 알 수 있는 정보는 일정·업무·AI 요청 어디에도 입력할 수 없습니다.</p></div></section>
      <section><h2>5. AI 기능</h2><p>AI 기능은 이용자가 직접 실행하는 선택 기능이며 결과는 참고용 제안입니다. 결과를 실제 일정이나 업무에 반영하기 전에 정확성과 적절성을 확인해야 합니다. 학생 개인정보·건강정보가 포함된 요청은 차단됩니다.</p></section>
      <section><h2>6. 데이터 관리</h2><p>이용자는 자신이 작성한 기록을 직접 수정·삭제할 책임이 있습니다. 회원 탈퇴 또는 전체 삭제는 <a href="mailto:sungandi@sen.go.kr">sungandi@sen.go.kr</a>로 요청할 수 있습니다.</p></section>
      <section><h2>7. 서비스 변경과 중단</h2><p>유지보수, 보안 대응 또는 외부 서비스 장애로 서비스가 일시 중단될 수 있습니다. 중요한 기능이나 약관이 바뀌면 합리적인 기간 전에 알립니다.</p></section>
      <section><h2>8. 문의</h2><p>운영자: <strong>BOGUNON 운영자 쑤캥T</strong><br />이메일: <a href="mailto:sungandi@sen.go.kr">sungandi@sen.go.kr</a></p></section>
    </PublicLegalPage>
  );
}
