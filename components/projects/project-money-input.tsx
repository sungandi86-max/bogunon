"use client";

import { useState } from "react";

import { MAX_PROJECT_AMOUNT } from "@/lib/projects/budget";

function displayedAmount(value: string | number | null | undefined): string {
  const digits = String(value ?? "").replaceAll(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("ko-KR").format(Number(digits));
}

export function ProjectMoneyInput({
  defaultValue,
  id,
  name,
  required = false,
}: {
  readonly defaultValue?: string | number | null;
  readonly id: string;
  readonly name: string;
  readonly required?: boolean;
}) {
  const [value, setValue] = useState(() => displayedAmount(defaultValue));

  return (
    <div className="project-money-input">
      <input
        autoComplete="off"
        id={id}
        inputMode="numeric"
        maxLength={17}
        name={name}
        onChange={(event) => {
          const digits = event.currentTarget.value.replaceAll(/\D/g, "");
          const amount = Math.min(Number(digits || 0), MAX_PROJECT_AMOUNT);
          setValue(digits ? displayedAmount(amount) : "");
        }}
        pattern="[0-9,]*"
        required={required}
        value={value}
      />
      <span aria-hidden="true">원</span>
    </div>
  );
}
