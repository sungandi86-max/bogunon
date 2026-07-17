import { CircleDashed } from "lucide-react";

interface EmptyStateProps {
  readonly description: string;
  readonly title: string;
}

export function EmptyState({ description, title }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <CircleDashed aria-hidden="true" size={18} />
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}
