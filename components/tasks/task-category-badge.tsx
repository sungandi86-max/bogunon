import { TASK_CATEGORY_LABELS } from "@/lib/work-items/categories";
import { cn } from "@/lib/utils";
import type { TaskCategory } from "@/types/database";

export function TaskCategoryBadge({
  category,
  className,
}: {
  readonly category: TaskCategory;
  readonly className?: string;
}) {
  return (
    <span className={cn("category-badge", `category-badge--${category}`, className)}>
      {TASK_CATEGORY_LABELS[category]}
    </span>
  );
}
