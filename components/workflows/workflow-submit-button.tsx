"use client";

import type { MouseEvent, ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function WorkflowSubmitButton({ children, className, confirmMessage }: { readonly children: ReactNode; readonly className: string; readonly confirmMessage?: string }) {
  const { pending } = useFormStatus();
  const confirmSubmit = (event: MouseEvent<HTMLButtonElement>) => {
    if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
  };
  return <button className={className} disabled={pending} onClick={confirmSubmit} type="submit">{pending ? "처리 중…" : children}</button>;
}
