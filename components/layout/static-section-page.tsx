import type { ReactNode } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { MobileCreateButton } from "@/components/layout/mobile-create-button";
import { PageHeader } from "@/components/layout/page-header";

interface StaticSectionPageProps {
  readonly description: string;
  readonly emptyDescription: string;
  readonly emptyTitle: string;
  readonly title: string;
  readonly extra?: ReactNode;
}

export function StaticSectionPage({
  description,
  emptyDescription,
  emptyTitle,
  extra,
  title,
}: StaticSectionPageProps) {
  return (
    <main className="page-canvas">
      <PageHeader action={<MobileCreateButton />} description={description} title={title} />
      {extra}
      <EmptyState description={emptyDescription} title={emptyTitle} />
    </main>
  );
}
