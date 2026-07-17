import type { ReactNode } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { MobileCreateButton } from "@/components/layout/mobile-create-button";
import { PageHeader } from "@/components/layout/page-header";

interface StaticSectionPageProps {
  readonly actionLabel?: string;
  readonly description: string;
  readonly emptyDescription: string;
  readonly emptyTitle: string;
  readonly icon?: "default" | "exercise" | "project";
  readonly title: string;
  readonly extra?: ReactNode;
}

export function StaticSectionPage({
  actionLabel,
  description,
  emptyDescription,
  emptyTitle,
  extra,
  icon,
  title,
}: StaticSectionPageProps) {
  return (
    <main className="page-canvas">
      <PageHeader action={<MobileCreateButton />} description={description} title={title} />
      {extra}
      <EmptyState {...(actionLabel ? { actionLabel } : {})} description={emptyDescription} {...(icon ? { icon } : {})} title={emptyTitle} />
    </main>
  );
}
