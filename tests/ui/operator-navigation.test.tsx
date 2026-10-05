// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { OperationsShell } from "../../components/platform/OperationsShell";
import { LocaleProvider } from "../../src/ui/i18n/locale-provider";
import { testOperationalSession } from "../fixtures/operational-access";
vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
  useSession: () => ({ data: testOperationalSession }),
}));
vi.mock("next/router", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  }),
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));
afterEach(cleanup);
it("shares six operator primary destinations, keeps WCS tasks under Work and technical tools secondary", () => {
  render(
    <LocaleProvider>
      <OperationsShell current="tasks">
        <h1>Task</h1>
      </OperationsShell>
    </LocaleProvider>,
  );
  const desktop = screen.getByRole("navigation", { name: "操作台桌面版導覽" });
  const mobile = screen.getByRole("navigation", { name: "操作台行動版導覽" });
  const destinations = [
    "/operations",
    "/operations/work",
    "/operations/warehouse",
    "/operations/alarms",
    "/operations/inventory",
    "/operations/help",
  ];
  for (const nav of [desktop, mobile]) {
    expect(
      within(nav)
        .getAllByRole("link")
        .map((l) => l.getAttribute("href")),
    ).toEqual(destinations);
    expect(
      within(nav)
        .getByRole("link", { name: "工作" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(within(nav).queryByRole("link", { name: "營運資料" })).toBeNull();
  }
  const work = screen.getByRole("navigation", { name: "工作情境導覽" });
  expect(
    within(work).getByRole("link", { name: "執行任務" }).getAttribute("href"),
  ).toBe("/operations/tasks");
  expect(screen.getByText("歷程與技術工具").closest("details")?.open).toBe(
    false,
  );
  expect(screen.getByText("模擬設備")).toBeTruthy(); // context not hidden on mobile
});
it("does not add Work subnavigation to Inventory or turn templates into authorization branches", () => {
  render(
    <LocaleProvider>
      <OperationsShell current="inventory">
        <h1>Stock</h1>
      </OperationsShell>
    </LocaleProvider>,
  );
  expect(screen.queryByRole("navigation", { name: "工作情境導覽" })).toBeNull();
  expect(screen.queryByRole("combobox", { name: /role|角色/i })).toBeNull();
});
