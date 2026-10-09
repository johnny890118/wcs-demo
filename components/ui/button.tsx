import { Slot } from "@radix-ui/react-slot";
import type { ComponentProps } from "react";

export type ActionVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "link";

// Owned shadcn-style composition; SWP tokens own all visual roles.
export function Button({
  asChild = false,
  variant = "secondary",
  className = "",
  ...props
}: ComponentProps<"button"> & {
  asChild?: boolean;
  variant?: ActionVariant;
}) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      data-slot="button"
      className={`swp-action swp-action-${variant} ${className}`}
      {...props}
    />
  );
}
