"use client";
import { useFormStatus } from "react-dom";
export function NoticeSubmitButton({ children, className = "button" }: { readonly children: string; readonly className?: string }) { const { pending } = useFormStatus(); return <button className={className} disabled={pending} type="submit">{pending ? "처리 중…" : children}</button>; }
