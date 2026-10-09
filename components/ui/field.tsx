import { forwardRef, type ComponentProps } from "react";
import { cn } from "./utils";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        data-slot="input"
        className={cn("swp-input", className)}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(
  ({ className, ...props }, ref) => {
    return (
      <select
        data-slot="select"
        ref={ref}
        className={cn("swp-input", className)}
        {...props}
      />
    );
  },
);
Select.displayName = "Select";
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      data-slot="textarea"
      ref={ref}
      className={cn("swp-input", className)}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
export function FieldLabel({
  required = false,
  children,
  className = "",
  ...props
}: ComponentProps<"label"> & { required?: boolean }) {
  return (
    <label className={`swp-field-label ${className}`} {...props}>
      {children}
      {required ? (
        <span className="swp-required" aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
    </label>
  );
}
