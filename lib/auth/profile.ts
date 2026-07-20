import type { UserRole } from "@/lib/notices/model";

export type AuthProfile = {
  readonly email: string;
  readonly initial: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly role: UserRole;
};

export function createAuthProfile(email: string | undefined, values?: { readonly displayName?: string | null; readonly avatarUrl?: string | null; readonly role?: UserRole }): AuthProfile {
  const accountLabel = email?.trim() || "Google 계정";
  return {
    email: accountLabel,
    initial: accountLabel === "Google 계정" ? "보" : accountLabel.slice(0, 1).toLocaleUpperCase("ko-KR"),
    displayName: values?.displayName?.trim() || accountLabel,
    avatarUrl: values?.avatarUrl ?? null,
    role: values?.role ?? "user",
  };
}
