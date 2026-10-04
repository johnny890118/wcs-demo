// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth/next";
import Page, {
  getServerSideProps,
} from "../../pages/operations/context/[taskId]/[surface]";
import {
  fetchExactContext,
  fetchAuditEvents,
} from "../../src/infrastructure/http/wcs-api-client";
import { testOperationalSession } from "../fixtures/operational-access";
vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../src/infrastructure/http/wcs-api-client", () => ({
  fetchExactContext: vi.fn(),
  fetchAuditEvents: vi.fn(),
  WcsProjectionError: class extends Error {},
}));
vi.mock("../../components/platform/OperationsShell", () => ({
  OperationsShell: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../src/ui/i18n/locale-provider", () => ({
  useLocale: () => ({ locale: "en", t: (key: string) => key }),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const id = "50000000-0000-4000-8000-000000000001";
const request = (surface: string, query = {}) => ({
  params: { taskId: id, surface },
  query,
  req: {},
  res: { setHeader: vi.fn(), headersSent: false },
});
it("does not fetch context or history without independent audit permission", async () => {
  vi.mocked(getServerSession).mockResolvedValue({
    ...testOperationalSession,
    access: {
      ...testOperationalSession.access,
      principal: {
        ...testOperationalSession.access.principal,
        permissions: ["operations.view"],
        warehouseScopes:
          testOperationalSession.access.principal.warehouseScopes.map(
            (scope) => ({ ...scope, permissions: ["operations.view"] }),
          ),
      },
    },
  });
  expect(await getServerSideProps(request("history") as never)).toHaveProperty(
    "redirect",
  );
  expect(fetchExactContext).not.toHaveBeenCalled();
  expect(fetchAuditEvents).not.toHaveBeenCalled();
});
it("history permission alone cannot read operational context", async () => {
  vi.mocked(getServerSession).mockResolvedValue({
    ...testOperationalSession,
    access: {
      ...testOperationalSession.access,
      principal: {
        ...testOperationalSession.access.principal,
        permissions: ["audit.view"],
        warehouseScopes:
          testOperationalSession.access.principal.warehouseScopes.map(
            (scope) => ({ ...scope, permissions: ["audit.view"] }),
          ),
      },
    },
  });
  expect(await getServerSideProps(request("history") as never)).toEqual({
    notFound: true,
  });
  expect(fetchExactContext).not.toHaveBeenCalled();
  expect(fetchAuditEvents).not.toHaveBeenCalled();
});
it("rejects ambiguous alarm and pagination on non-history surfaces before reads", async () => {
  expect(
    await getServerSideProps(request("load", { alarmId: [id, id] }) as never),
  ).toEqual({ notFound: true });
  expect(
    await getServerSideProps(request("live", { cursor: "a" }) as never),
  ).toEqual({ notFound: true });
  expect(fetchExactContext).not.toHaveBeenCalled();
});
it("does not invent an alternative context on unavailable projection", () => {
  render(
    <Page
      context={null}
      surface="load"
      events={null}
      cursor={null}
      alarmId={null}
      canViewAudit={false}
      canAcknowledge={false}
      canRecover={false}
    />,
  );
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    "taskDataUnavailable",
  );
  expect(screen.queryByRole("link")).toBeNull();
});
