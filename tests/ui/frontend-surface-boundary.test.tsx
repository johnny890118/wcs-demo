// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("next-auth/react", () => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("next/router", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

import { getServerSession } from "next-auth/next";
import PlatformPage from "../../pages/index";
import { getServerSideProps as getEntryProps } from "../../pages/index";
import { getServerSideProps as getLoginProps } from "../../pages/login";
import { getServerSideProps as getAlarmProps } from "../../pages/operations/alarms";
import { getServerSideProps as getAuditProps } from "../../pages/operations/audit";
import { getServerSideProps as getInboundProps } from "../../pages/operations/inbound";
import { getServerSideProps as getOverviewProps } from "../../pages/operations/index";
import { getServerSideProps as getTaskQueueProps } from "../../pages/operations/tasks";
import { getServerSideProps as getInventoryProps } from "../../pages/operations/inventory";
import { getServerSideProps as getLoadProps } from "../../pages/operations/loads";
import { getServerSideProps as getLocationProps } from "../../pages/operations/locations";
import { getServerSideProps as getTaskDetailProps } from "../../pages/operations/tasks/[taskId]";
import { getServerSideProps as getOutboundProps } from "../../pages/operations/outbound";
import { getServerSideProps as getProjectionProps } from "../../pages/operations/projections";
import { getServerSideProps as getWarehouseProps } from "../../pages/operations/warehouse";
import { getServerSideProps as getTopologyProps } from "../../pages/operations/warehouse/topology";
import { getServerSideProps as getHelpProps } from "../../pages/operations/help";
import { LocaleProvider } from "../../src/ui/i18n/locale-provider";
import {
  classifyFrontendSurface,
  frontendSurfacePolicies,
} from "../../src/ui/navigation/frontend-surfaces";
import { testOperationalSession } from "../fixtures/operational-access";

const context = {
  req: { headers: { host: "warehouse.example.com" } },
  res: { setHeader: vi.fn(), headersSent: false },
  query: {},
};

describe("frontend surface boundary", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    process.env.NEXTAUTH_URL = "https://warehouse.example.com";
    process.env.PUBLIC_SITE_URL = "https://warehouse.example.com";
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    delete process.env.NEXTAUTH_URL;
    delete process.env.PUBLIC_SITE_URL;
  });

  it("classifies the five explicit surfaces without treating compatibility routes as products", () => {
    expect(classifyFrontendSurface("/")).toBe("public");
    expect(classifyFrontendSurface("/login")).toBe("login");
    expect(classifyFrontendSurface("/operations/warehouse")).toBe("operations");
    expect(classifyFrontendSurface("/api/operations/details")).toBe("api");
    expect(classifyFrontendSurface("/legacy/fdp")).toBe("legacy");
    expect(classifyFrontendSurface("/platform")).toBe("unknown");
    expect(frontendSurfacePolicies.public.indexable).toBe(true);
    expect(frontendSurfacePolicies.login.indexable).toBe(false);
    expect(frontendSurfacePolicies.operations.authenticated).toBe(true);
  });

  it.each([
    ["/operations", getOverviewProps],
    ["/operations/tasks", getTaskQueueProps],
    ["/operations/inventory", getInventoryProps],
    ["/operations/loads", getLoadProps],
    ["/operations/locations", getLocationProps],
    ["/operations/warehouse", getWarehouseProps],
    ["/operations/warehouse/topology", getTopologyProps],
    ["/operations/help", getHelpProps],
    ["/operations/projections", getProjectionProps],
    ["/operations/inbound", getInboundProps],
    ["/operations/outbound", getOutboundProps],
    ["/operations/alarms", getAlarmProps],
    ["/operations/audit", getAuditProps],
  ])(
    "redirects unauthenticated %s requests through the product login",
    async (path, getProps) => {
      await expect(
        getProps({ ...context, resolvedUrl: path } as never),
      ).resolves.toEqual({
        redirect: {
          destination: `/login?callbackUrl=${encodeURIComponent(path)}`,
          permanent: false,
        },
      });
    },
  );

  it("sanitizes login callbacks before rendering or redirecting", async () => {
    await expect(
      getLoginProps({
        ...context,
        query: { callbackUrl: "https://evil.example/operations" },
      } as never),
    ).resolves.toEqual({
      props: { callbackUrl: "/operations", sessionExpired: false },
    });

    await expect(
      getLoginProps({
        ...context,
        query: { callbackUrl: "/operations/inbound", reason: "expired" },
      } as never),
    ).resolves.toEqual({
      props: {
        callbackUrl: "/operations/inbound",
        sessionExpired: true,
      },
    });

    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    await expect(
      getLoginProps({
        ...context,
        query: { callbackUrl: "/operations/warehouse?focus=task-1" },
      } as never),
    ).resolves.toEqual({
      redirect: {
        destination: "/operations/warehouse?focus=task-1",
        permanent: false,
      },
    });
  });
  it("derives help links from validated effective access and bounds untrusted query values", async () => {
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    const result = await getHelpProps({
      ...context,
      query: { q: ["bad"], topic: "//evil.example" },
    } as never);
    expect(result).toMatchObject({
      props: {
        warehouseId: testOperationalSession.access.currentWarehouseId,
        query: "",
        topic: null,
        permissions: testOperationalSession.access.principal.permissions,
      },
    });
  });

  it("preserves the protected task detail destination without reading data", async () => {
    const path = "/operations/tasks/50000000-0000-4000-8000-000000000001";
    await expect(
      getTaskDetailProps({
        ...context,
        params: { taskId: "50000000-0000-4000-8000-000000000001" },
        resolvedUrl: path,
      } as never),
    ).resolves.toEqual({
      redirect: {
        destination: `/login?callbackUrl=${encodeURIComponent(path)}`,
        permanent: false,
      },
    });
  });

  it("routes the system entry CTA according to authentication state", async () => {
    await expect(getEntryProps(context as never)).resolves.toEqual({
      props: {
        siteOrigin: "https://warehouse.example.com",
        entryHref: "/login",
      },
    });

    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    await expect(getEntryProps(context as never)).resolves.toEqual({
      props: {
        siteOrigin: "https://warehouse.example.com",
        entryHref: "/operations",
      },
    });
  });

  it("renders a thin system entry without marketing or legacy navigation", () => {
    render(
      <LocaleProvider>
        <PlatformPage
          siteOrigin="https://warehouse.example.com"
          entryHref="/login"
        />
      </LocaleProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "Smart Warehouse Platform" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "進入系統" }).getAttribute("href"),
    ).toBe("/login");
    expect(screen.queryByRole("link", { name: "關於" })).toBeNull();
    expect(screen.queryByRole("link", { name: "聯絡" })).toBeNull();
    expect(screen.queryByRole("link", { name: /舊版/ })).toBeNull();
    expect(screen.queryByRole("contentinfo")).toBeNull();
  });
});
