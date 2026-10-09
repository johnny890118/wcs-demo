import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ComponentProps } from "react";
import { cn } from "./utils";

export type ActionVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "link";

// Adapted from the official shadcn/ui Tailwind 3 registry (new-york/button).
// Preserve SWP action aliases and the 44px industrial touch baseline.
export const buttonVariants = cva("swp-action", {
  variants: {
    variant: {
      default: "swp-action-primary",
      primary: "swp-action-primary",
      secondary: "swp-action-secondary",
      outline: "swp-action-secondary",
      destructive: "swp-action-danger",
      danger: "swp-action-danger",
      ghost: "swp-action-ghost",
      link: "swp-action-link",
    },
    size: { default: "", icon: "swp-action-icon", lg: "swp-action-lg" },
  },
  defaultVariants: { variant: "secondary", size: "default" },
});

export const Button = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & { asChild?: boolean }
>(({ asChild = false, variant, size, className, ...props }, ref) => {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});
Button.displayName = "Button";
