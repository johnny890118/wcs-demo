// @vitest-environment jsdom
import { createRef } from "react";
import Link from "next/link";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/field";
import {
  ContextNavigation,
  ContextNavigationLink,
} from "../../components/ui/navigation";
import {
  PageHeading,
  WorkspaceNavigation,
} from "../../components/ui/workspace";

afterEach(cleanup);

it("preserves native button behavior, disabled commands and forwarded focus", () => {
  const onClick = vi.fn();
  const ref = createRef<HTMLButtonElement>();
  const { rerender } = render(
    <Button ref={ref} variant="danger" disabled onClick={onClick}>
      Cancel
    </Button>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClick).not.toHaveBeenCalled();
  rerender(
    <Button ref={ref} onClick={onClick}>
      Inspect
    </Button>,
  );
  ref.current?.focus();
  expect(document.activeElement).toBe(ref.current);
  fireEvent.click(ref.current!);
  expect(onClick).toHaveBeenCalledOnce();
});

it("styles actual navigation without inventing a command or nested interactive element", () => {
  render(
    <Button asChild variant="secondary">
      <Link href="/operations/work">Open work</Link>
    </Button>,
  );
  const link = screen.getByRole("link", { name: "Open work" });
  expect(link.getAttribute("href")).toBe("/operations/work");
  expect(link.classList.contains("swp-action-secondary")).toBe(true);
  expect(screen.queryByRole("button")).toBeNull();
});

it("preserves required native fields and form identity", () => {
  render(
    <label>
      Load
      <Input name="loadId" required defaultValue="load-1" />
    </label>,
  );
  const input = screen.getByRole("textbox", {
    name: "Load",
  }) as HTMLInputElement;
  expect(input.required).toBe(true);
  expect(input.name).toBe("loadId");
  expect(input.value).toBe("load-1");
});

it("places URL-backed context navigation after the work heading, with one current destination", () => {
  render(
    <WorkspaceNavigation.Provider
      value={
        <ContextNavigation label="Work context">
          <ContextNavigationLink href="/operations/work" current>
            Work
          </ContextNavigationLink>
          <ContextNavigationLink href="/operations/tasks" current={false}>
            Tasks
          </ContextNavigationLink>
        </ContextNavigation>
      }
    >
      <PageHeading title="Current work" />
    </WorkspaceNavigation.Provider>,
  );
  const heading = screen.getByRole("heading", { level: 1 });
  const navigation = screen.getByRole("navigation", { name: "Work context" });
  expect(
    heading.compareDocumentPosition(navigation) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(navigation.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  expect(screen.queryByRole("tab")).toBeNull();
});
