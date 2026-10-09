import type { ComponentProps } from "react";

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input data-slot="input" className={`swp-input ${className}`} {...props} />
  );
}
export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={`swp-input ${className}`}
      {...props}
    />
  );
}
export function Textarea({
  className = "",
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={`swp-input ${className}`}
      {...props}
    />
  );
}
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
