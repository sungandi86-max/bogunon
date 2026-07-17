import { Pencil, Trash2 } from "lucide-react";

import { deleteWorkItemAction } from "@/app/(app)/work-item-actions";
import { CreateItemForm } from "@/components/layout/create-item-form";
import type { EventRow } from "@/types/database";

export function EventList({ events }: { readonly events: EventRow[] }) {
  if (!events.length) return <p className="static-note">이 달에 등록된 일정이 없습니다.</p>;
  return <section className="calendar-list" aria-label="월간 일정 목록">{events.map((event) => <article className="calendar-list__item" key={event.id}><div><time>{event.start_date}{event.start_time ? ` ${event.start_time.slice(0, 5)}` : ""}</time><strong>{event.title}</strong></div><div className="work-item-actions"><details><summary><Pencil aria-hidden="true" size={16} />편집</summary><div className="inline-editor"><CreateItemForm initialItem={event} /></div></details><form action={deleteWorkItemAction}><input name="id" type="hidden" value={event.id} /><input name="kind" type="hidden" value="event" /><button className="danger-action" type="submit"><Trash2 aria-hidden="true" size={16} />삭제</button></form></div></article>)}</section>;
}
