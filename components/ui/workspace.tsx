import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from "react";

export const WorkspaceNavigation = createContext<ReactNode>(null);

export function PageHeading({
  id,
  title,
  description,
  action,
  navigation,
  density = "standard",
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  navigation?: ReactNode;
  density?: "standard" | "compact";
}) {
  const workspaceNavigation = useContext(WorkspaceNavigation);
  return (
    <>
      <header className="swp-page-heading" data-density={density}>
        <div>
          <h1 id={id}>{title}</h1>
          {description ? <p className="swp-secondary">{description}</p> : null}
        </div>
        {action}
      </header>
      {navigation ?? workspaceNavigation}
    </>
  );
}

export function Record({
  className = "",
  appearance = "card",
  ...props
}: ComponentProps<"article"> & { appearance?: "card" | "row" }) {
  return (
    <article
      className={`swp-record ${
        appearance === "row" ? "swp-record-row" : ""
      } ${className}`}
      {...props}
    />
  );
}

export function DiagnosticDetails({
  title,
  children,
  density = "standard",
}: {
  title: ReactNode;
  children: ReactNode;
  density?: "standard" | "compact";
}) {
  return (
    <details className="swp-diagnostics" data-density={density}>
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  );
}
