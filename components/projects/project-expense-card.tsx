"use client";

import {
  BedDouble,
  Bus,
  CalendarDays,
  CircleDollarSign,
  Dumbbell,
  Link2,
  MoreHorizontal,
  Package,
  Pencil,
  ReceiptText,
  ShoppingBag,
  Ticket,
  Trash2,
  Utensils,
} from "lucide-react";

import { EXPENSE_CATEGORIES, formatWon } from "@/lib/projects/budget";
import type { ProjectExpenseCategory, ProjectExpenseRow } from "@/types/database";

const icons = {
  accommodation: BedDouble,
  activity: Dumbbell,
  fee: ReceiptText,
  food: Utensils,
  other: CircleDollarSign,
  shopping: ShoppingBag,
  supplies: Package,
  ticket: Ticket,
  transportation: Bus,
} satisfies Record<ProjectExpenseCategory, typeof Bus>;

function displayDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

export function ProjectExpenseCard({
  expense,
  onDelete,
  onEdit,
  onToggleStatus,
}: {
  readonly expense: ProjectExpenseRow;
  readonly onDelete: () => void;
  readonly onEdit: () => void;
  readonly onToggleStatus: () => void;
}) {
  const Icon = icons[expense.category];
  const category = EXPENSE_CATEGORIES.find((item) => item.value === expense.category)?.label ?? "기타";
  const paid = expense.payment_status === "paid";

  return (
    <article className="project-expense-card">
      <span className="project-expense-card__icon"><Icon aria-hidden="true" size={18} /></span>
      <div className="project-expense-card__content">
        <div className="project-expense-card__primary">
          <h3>{expense.title}</h3>
          <strong>{formatWon(expense.amount)}</strong>
        </div>
        <div className="project-expense-card__meta">
          <span><CalendarDays aria-hidden="true" size={13} />{displayDate(expense.expense_date)}</span>
          <span>{category}</span>
          {expense.reservation_id && <span><Link2 aria-hidden="true" size={13} />예약 연결</span>}
        </div>
        {expense.memo && <p>{expense.memo}</p>}
        <button
          aria-label={paid ? "결제 예정으로 변경" : "결제 완료로 변경"}
          className={`project-expense-card__status ${paid ? "is-paid" : "is-planned"}`}
          onClick={onToggleStatus}
          type="button"
        >
          {paid ? "결제 완료" : "결제 예정"}
        </button>
      </div>
      <details className="project-expense-card__menu">
        <summary aria-label={`${expense.title} 지출 메뉴`}>
          <MoreHorizontal aria-hidden="true" size={18} />
        </summary>
        <div>
          <button onClick={onEdit} type="button"><Pencil aria-hidden="true" size={15} />수정</button>
          <button className="danger-text" onClick={onDelete} type="button">
            <Trash2 aria-hidden="true" size={15} />삭제
          </button>
        </div>
      </details>
    </article>
  );
}
