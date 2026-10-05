// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth/next";
import WorkQueue, { getServerSideProps } from "../../pages/operations/work";
import { fetchWorkQueue } from "../../src/infrastructure/http/wcs-api-client";
import { en } from "../../src/ui/i18n/catalogs";
import {
  testOperationalSession,
  testOperationalAccess,
} from "../fixtures/operational-access";
import type { WorkQueuePage } from "../../src/application/operations/work-queue";
vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../src/infrastructure/http/wcs-api-client", async (original) => ({
  ...(await original<object>()),
  fetchWorkQueue: vi.fn(),
}));
vi.mock("../../components/platform/OperationsShell", () => ({
  OperationsShell: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock("../../src/ui/i18n/locale-provider", () => ({
  useLocale: () => ({ locale: "en", t: (k: keyof typeof en) => en[k] }),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const page: WorkQueuePage = {
  works: [
    {
      workId: "30000000-0000-4000-8000-000000000001",
      flow: "inbound",
      externalReference: "READABLE-JOB",
      status: "requested",
      createdAt: "2026-10-05T00:00:00Z",
      updatedAt: "2026-10-05T00:00:00Z",
      execution: {
        referencedTaskCount: 2,
        qualifiedTaskCount: 1,
        counts: {
          queued: 1,
          assigned: 0,
          in_progress: 0,
          blocked: 0,
          unknown: 0,
          completed: 0,
          cancelled: 0,
        },
      },
    },
  ],
  nextCursor: "ownedcursor",
  generatedAt: "2026-10-05T00:00:00Z",
};
it("shows readable persisted roots with incomplete evidence, owned deep links and reloadable paging", () => {
  render(<WorkQueue page={page} query={{ view: "all", limit: 1 }} />);
  expect(screen.getByRole("heading", { name: "READABLE-JOB" })).toBeTruthy();
  expect(screen.getByText(en.workAttention_incomplete)).toBeTruthy();
  expect(
    screen.getByRole("link", { name: /Open this work/ }).getAttribute("href"),
  ).toBe("/operations/work/inbound/30000000-0000-4000-8000-000000000001");
  expect(
    screen.getByRole("link", { name: en.workQueueNext }).getAttribute("href"),
  ).toBe("/operations/work?view=all&cursor=ownedcursor&limit=1");
  expect(screen.queryByText(en.workStatus_completed)).toBeNull();
});
it("does not confuse service failure with an empty list", () => {
  const view = render(<WorkQueue page={null} query={{}} />);
  expect(screen.getByRole("alert").textContent).toBe(en.workQueueUnavailable);
  expect(screen.queryByText(en.workQueueEmpty)).toBeNull();
  view.rerender(<WorkQueue page={{ ...page, works: [] }} query={{}} />);
  expect(screen.getByRole("status").textContent).toBe(en.workQueueEmpty);
});
const context = (query: Record<string, unknown> = {}) =>
  ({
    req: { method: "GET" },
    res: { setHeader: vi.fn(), headersSent: false },
    query,
    resolvedUrl: "/operations/work",
  }) as never;
it("SSR denies unauthenticated and unauthorized reads before projections", async () => {
  vi.mocked(getServerSession).mockResolvedValue(null);
  expect(await getServerSideProps(context())).toMatchObject({
    redirect: { destination: "/login?callbackUrl=%2Foperations%2Fwork" },
  });
  vi.mocked(getServerSession).mockResolvedValue({
    ...testOperationalSession,
    access: {
      ...testOperationalAccess,
      principal: {
        ...testOperationalAccess.principal,
        permissions: ["audit.view"],
        warehouseScopes: testOperationalAccess.principal.warehouseScopes.map(
          (s) => ({ ...s, permissions: ["audit.view"] }),
        ),
      },
    },
  });
  expect(await getServerSideProps(context())).toMatchObject({
    redirect: { destination: "/operations/access-denied" },
  });
  expect(fetchWorkQueue).not.toHaveBeenCalled();
});
it("SSR rejects scope override and ambiguous selection, forwards only signed current scope", async () => {
  vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
  for (const query of [
    { warehouseId: "other" },
    { view: ["all"] },
    { limit: "101" },
  ])
    expect(await getServerSideProps(context(query))).toEqual({
      notFound: true,
    });
  expect(fetchWorkQueue).not.toHaveBeenCalled();
  vi.mocked(fetchWorkQueue).mockResolvedValue(page);
  expect(await getServerSideProps(context({ view: "all" }))).toMatchObject({
    props: { page, query: { view: "all" } },
  });
  expect(fetchWorkQueue).toHaveBeenCalledWith(testOperationalAccess, {
    view: "all",
  });
});
