export type AuthProfile = {
  readonly email: string;
  readonly initial: string;
};

export function createAuthProfile(email: string | undefined): AuthProfile {
  const accountLabel = email?.trim() || "Google 계정";
  return {
    email: accountLabel,
    initial: accountLabel === "Google 계정" ? "보" : accountLabel.slice(0, 1).toLocaleUpperCase("ko-KR"),
  };
}
