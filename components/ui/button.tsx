import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode;
  readonly iconOnly?: boolean;
  readonly variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      className,
      iconOnly = false,
      type = "button",
      variant = "primary",
      ...props
    },
    ref,
  ) {
    return (
      <button
        className={cn(
          "button",
          `button--${variant}`,
          iconOnly && "button--icon",
          className,
        )}
        ref={ref}
        type={type}
        {...props}
      >
        {children}
      </button>
    );
  },
);
