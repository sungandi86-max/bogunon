import type { ReactNode } from "react";

interface PageHeaderProps {
  readonly action?: ReactNode;
  readonly description?: string;
  readonly eyebrow?: string;
  readonly title: string;
}

export function PageHeader({ action, description, eyebrow, title }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-header__description">{description}</p>}
      </div>
      {action}
    </header>
  );
}
