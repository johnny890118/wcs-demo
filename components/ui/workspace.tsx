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
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  navigation?: ReactNode;
}) {
  const workspaceNavigation = useContext(WorkspaceNavigation);
  return (
    <>
      <header className="swp-page-heading">
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
