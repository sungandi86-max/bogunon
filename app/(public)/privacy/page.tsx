import type { Metadata } from "next";

import { PublicLegalPage } from "@/components/legal/public-legal-page";

export const metadata: Metadata = {
  title: "개인정보처리방침 | BOGUNON",
  description: "BOGUNON 개인정보 처리 항목, 목적, 보유 기간과 이용자 권리를 안내합니다.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PublicLegalPage
      description="BOGUNON이 어떤 정보를 왜 처리하고 어떻게 보호하는지 공개합니다."
      title="개인정보처리방침"
      updatedAt="2026-07-19"
    >
      <section>
        <h2>핵심 안내</h2>
        <div className="legal-callout">
          <strong>BOGUNON은 교사 개인의 일정·업무 관리 도구입니다.</strong>
          <p>학생 개인정보를 수집하거나 처리하는 용도로 제공되지 않습니다. 학생 이름·학번·연락처·질병명·상담 내용 등 학생 개인정보와 건강정보를 입력해서는 안 되며, 학생용 계정을 제공하지 않습니다.</p>
        </div>
      </section>

      <section>
        <h2>1. 개인정보의 처리 목적</h2>
        <ul>
          <li>회원 인증과 계정 유지, 부정 이용 방지</li>
          <li>이용자가 작성한 일정·업무·워크플로·설정의 저장과 동기화</li>
          <li>이용자가 선택한 경우에만 AI 업무 정리 제안 제공</li>
          <li>서비스 안정성 유지, 장애 분석과 보안 대응</li>
        </ul>
        <p>위 목적이 바뀌면 사전에 이 방침을 변경하여 알립니다.</p>
      </section>

      <section>
        <h2>2. 처리하는 개인정보 항목</h2>
        <div className="legal-table-scroll">
          <table>
            <thead><tr><th>구분</th><th>항목</th><th>수집 방법</th></tr></thead>
            <tbody>
              <tr><td>계정</td><td>이메일 주소, Google 계정 식별자, 인증·세션 정보</td><td>Google 로그인</td></tr>
              <tr><td>사용자 작성 정보</td><td>일정, 할 일, 워크플로, 체크리스트, 링크·알림, 운동 기록, 환경설정</td><td>이용자 직접 입력</td></tr>
              <tr><td>선택적 AI</td><td>최대 1,200자의 요청문, 이용자가 선택한 일정·업무·워크플로 제목과 생성 결과</td><td>AI 기능 실행 시</td></tr>
              <tr><td>자동 생성 정보</td><td>IP 주소, 사용자 에이전트, 요청 경로, 오류·요청 시각 등 접속 기록</td><td>서비스 이용 과정</td></tr>
            </tbody>
          </table>
        </div>
        <p><strong>처리하지 않는 정보:</strong> 주민등록번호, 학생 개인정보, 학생 건강정보, 상담·진료 기록은 수집하거나 처리하지 않습니다.</p>
      </section>

      <section>
        <h2>3. 보유 기간과 파기</h2>
        <ul>
          <li>계정과 사용자 작성 정보: 회원 탈퇴 또는 삭제 요청 시까지. 개별 기록은 이용자가 직접 삭제할 수 있습니다.</li>
          <li>AI 요청·결과: 기본적으로 BOGUNON에 저장하지 않습니다. 이용자가 ‘기록 저장’을 선택한 경우 직접 삭제하거나 회원 탈퇴할 때까지 보관합니다.</li>
          <li>임시 설정 쿠키: 10분, 로그인 세션: 만료 또는 로그아웃 때까지</li>
          <li>OpenAI 안전·오남용 로그: 기본 설정에서 최대 30일. Vercel 운영 로그: 계약 플랜에 정해진 기간</li>
        </ul>
        <p>보유 목적이 끝난 정보는 지체 없이 삭제합니다. 전자 파일은 복구하기 어려운 방식으로 삭제하고, 법령상 별도 보존 의무가 있으면 해당 정보만 분리 보관합니다.</p>
      </section>

      <section>
        <h2>4. 제3자 제공</h2>
        <p>BOGUNON은 개인정보를 제3자에게 제공하지 않습니다. 또한 개인정보를 판매하지 않습니다. 다만 이용자의 별도 동의가 있거나 법률에 특별한 규정이 있는 경우에는 예외로 합니다. 아래 수탁업체 처리는 서비스 운영을 위한 위탁이며 제3자 제공과 구분됩니다.</p>
      </section>

      <section>
        <h2>5. 처리 위탁과 국외 이전</h2>
        <p>서비스 운영에 필요한 범위에서 다음 업체에 처리를 맡깁니다. 정보는 서비스 이용 시 암호화된 네트워크를 통해 이전될 수 있습니다.</p>
        <div className="legal-table-scroll">
          <table>
            <thead><tr><th>업체·이전 지역</th><th>업무와 항목</th><th>시점·보유 기간</th></tr></thead>
            <tbody>
              <tr><td><strong>Supabase</strong>, Inc.<br />미국 및 하위처리자 소재국</td><td>인증·데이터베이스 운영. 이메일, 계정 식별자, 사용자 작성 정보</td><td>로그인·저장 시 / 계정 삭제 또는 계약상 보유 기간까지</td></tr>
              <tr><td>Vercel, Inc.<br />미국 및 글로벌 인프라</td><td>호스팅·CDN·운영 로그. IP, 요청 정보, 서비스 전송 내용</td><td>접속 시 / 플랜별 로그 보유 기간까지</td></tr>
              <tr><td><strong>OpenAI</strong>, L.L.C.<br />미국 및 하위처리자 소재국</td><td>선택적 AI 생성. 요청문과 선택한 업무 맥락</td><td>AI 실행 시 / 기본 오남용 로그 최대 30일</td></tr>
              <tr><td>Google LLC<br />미국 및 글로벌 인프라</td><td>OAuth 로그인. 이메일, Google 계정 식별자</td><td>로그인 시 / Google 정책과 계정 설정에 따른 기간</td></tr>
            </tbody>
          </table>
        </div>
        <p>AI 국외 이전은 AI 기능을 사용하지 않아 거부할 수 있습니다. Supabase·Vercel·Google 인증 처리를 거부하면 계정 기반 서비스 제공이 어렵습니다. 이전 관련 문의와 요청은 개인정보 보호책임자에게 할 수 있습니다.</p>
      </section>

      <section>
        <h2>6. 이용자의 권리와 행사 방법</h2>
        <p>이용자는 자신의 개인정보에 대해 열람, 정정·삭제, 처리정지, 동의 철회 및 회원 탈퇴를 요구할 수 있습니다. 앱에서 개별 기록과 선택 저장한 AI 기록을 직접 삭제할 수 있고, 회원 탈퇴·전체 삭제 요청은 <a aria-label="개인정보 권리 행사 이메일" href="mailto:sungandi@sen.go.kr">sungandi@sen.go.kr</a>로 보내 주세요.</p>
        <p>요청자의 본인 여부를 확인한 뒤 원칙적으로 10일 이내에 결과를 안내합니다. 법령에 따라 요청을 제한하거나 거절해야 하는 경우에는 사유와 이의제기 방법을 함께 알립니다.</p>
      </section>

      <section>
        <h2>7. 만 14세 미만 아동과 학생 정보</h2>
        <p>BOGUNON은 교사를 위한 도구이며 만 14세 미만 아동을 직접 회원으로 받지 않습니다. 학생 개인정보와 건강정보를 입력하지 마세요. 이러한 정보가 의도치 않게 발견되면 이용을 제한하고 확인 후 지체 없이 삭제합니다.</p>
      </section>

      <section>
        <h2>8. 안전성 확보 조치</h2>
        <ul>
          <li>HTTPS 암호화 통신, 보안 쿠키와 콘텐츠 보안 정책 적용</li>
          <li>Supabase 행 수준 보안(RLS)으로 계정별 데이터 접근 분리</li>
          <li>AI 전송 전 학생 개인정보·건강정보 형태 차단, 필요한 제목 중심의 최소 맥락만 전송</li>
          <li>서버 비밀키의 브라우저 노출 방지, 접근권한 최소화</li>
          <li>수탁업체의 저장 암호화·백업·접근통제와 보안 사고 대응 절차 활용</li>
        </ul>
      </section>

      <section>
        <h2>9. 개인정보 보호책임자</h2>
        <p><strong>BOGUNON 운영자 쑤캥T</strong><br />이메일: <a href="mailto:sungandi@sen.go.kr">sungandi@sen.go.kr</a></p>
        <p>개인정보 침해 상담은 개인정보침해 신고센터(국번 없이 118) 또는 개인정보 분쟁조정위원회(1833-6972)에도 문의할 수 있습니다.</p>
      </section>

      <section>
        <h2>10. 방침 변경</h2>
        <p>이 방침은 2026년 7월 19일부터 시행합니다. 중요한 내용이 바뀌면 시행 7일 전부터 서비스 화면에 알리며, 이용자 권리에 중대한 변경은 30일 전에 알립니다.</p>
      </section>
    </PublicLegalPage>
  );
}
