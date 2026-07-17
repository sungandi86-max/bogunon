export type PrivacyInspection =
  | { readonly allowed: true; readonly warnings: readonly [] }
  | { readonly allowed: false; readonly warnings: readonly string[] };

const privacyPatterns = [
  { label: "상담 내용", pattern: /상담\s*(내용|기록|내역)/i },
  { label: "학번", pattern: /학번\s*[:#-]?\s*[0-9-]{2,}/i },
  { label: "연락처", pattern: /(?:연락처|전화(?:번호)?|휴대폰)?\s*0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/i },
  { label: "주민등록번호", pattern: /\d{6}[-\s]?[1-4]\d{6}/ },
  { label: "생년월일", pattern: /생년월일\s*[:#-]?\s*\d{6,8}/i },
  { label: "진단·증상", pattern: /(?:학생|개인|대상자).{0,12}(?:진단|증상|확진|질병명)/i },
  { label: "투약·처치", pattern: /(?:학생|개인|대상자).{0,12}(?:투약|처치|병원\s*이용)/i },
  { label: "검진 결과", pattern: /(?:학생|개인|대상자).{0,12}검진\s*결과/i },
  { label: "학생 이름", pattern: /학생\s*(?:이름|성명)\s*[:#-]?\s*[가-힣]{2,4}/ },
] as const;

const individuallyIdentifyingPatterns = [
  {
    label: "개인 식별 건강정보",
    pattern: /(?:[가-힣]{2,4}\s*학생|학생\s+[가-힣]{2,4}).{0,16}(?:상담|진단|증상|확진|검진\s*결과|투약|처치|병원\s*이용)/,
  },
  { label: "반·번호", pattern: /\d{1,2}학년\s*\d{1,2}반\s*\d{1,2}번/ },
] as const;

export function inspectPrivacy(value: string): PrivacyInspection {
  const identifyingWarnings = individuallyIdentifyingPatterns
    .filter(({ pattern }) => pattern.test(value))
    .map(({ label }) => label);
  if (identifyingWarnings.length > 0) return { allowed: false, warnings: identifyingWarnings };
  const warnings = privacyPatterns
    .filter(({ pattern }) => pattern.test(value))
    .map(({ label }) => label);
  return warnings.length === 0
    ? { allowed: true, warnings: [] }
    : { allowed: false, warnings };
}

function collectStrings(value: unknown, output: string[], key?: string): void {
  if (typeof value === "string") {
    if (key === "url" || key === "action" || key === "category" || key === "kind" || key?.endsWith("_id")) return;
    output.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, output, key));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([entryKey, item]) => collectStrings(item, output, entryKey));
  }
}

export function inspectStructuredPrivacy(value: unknown): PrivacyInspection {
  const strings: string[] = [];
  collectStrings(value, strings);
  const warnings = strings.flatMap((item) => {
    const result = inspectPrivacy(item);
    return result.allowed ? [] : result.warnings;
  }).filter((warning, index, all) => all.indexOf(warning) === index);
  return warnings.length === 0
    ? { allowed: true, warnings: [] }
    : { allowed: false, warnings };
}
