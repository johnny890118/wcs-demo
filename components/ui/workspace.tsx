import type { ComponentProps, ReactNode } from "react";

export function PageHeading({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="swp-page-heading">
      <div>
        <h1>{title}</h1>
        {description ? <p className="swp-secondary">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function Record({
  className = "",
  ...props
}: ComponentProps<"article">) {
  return <article className={`swp-record ${className}`} {...props} />;
}

export function DiagnosticDetails({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <details className="swp-diagnostics">
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  );
}
