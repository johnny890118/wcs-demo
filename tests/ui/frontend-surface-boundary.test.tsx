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
import { getServerSideProps as getOutboundProps } from "../../pages/operations/outbound";
import { getServerSideProps as getProjectionProps } from "../../pages/operations/projections";
import { getServerSideProps as getWarehouseProps } from "../../pages/operations/warehouse";
import { LocaleProvider } from "../../src/ui/i18n/locale-provider";
import {
  classifyFrontendSurface,
  frontendSurfacePolicies,
} from "../../src/ui/navigation/frontend-surfaces";
import { testOperationalSession } from "../fixtures/operational-access";

const context = {
  req: { headers: { host: "warehouse.example.com" } },
  res: {},
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
    ["/operations/warehouse", getWarehouseProps],
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
    ).resolves.toEqual({ props: { callbackUrl: "/operations" } });

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
