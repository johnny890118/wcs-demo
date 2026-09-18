// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PlatformPage from "../../pages/platform";
import AboutPage from "../../pages/about";
import ContactPage from "../../pages/contact";
import OperationsProjectionsPage from "../../pages/operations/projections";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import { LocaleProvider } from "../../src/ui/i18n/locale-provider";

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
vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

const details: OperationsDetails = {
  tasks: [
    {
      taskId: "TASK-01",
      status: "in_progress",
      source: "RECEIVING-01",
      destination: "STORAGE-A-01",
      equipmentId: "MOBILE-01",
      updatedAt: "2026-09-18T00:00:00.000Z",
    },
  ],
  equipment: [
    {
      equipmentId: "MOBILE-01",
      adapterKey: "simulator.mobile-transport",
      capabilities: ["transport.move", "load.pickup"],
      active: true,
    },
  ],
  inventory: [
    {
      inventoryUnitId: "INVENTORY-01",
      sku: "SKU-01",
      quantity: 12,
      location: "STORAGE-A-01",
      status: "available",
      updatedAt: "2026-09-18T00:00:00.000Z",
    },
  ],
  alarms: [
    {
      alarmId: "ALARM-01",
      taskId: "TASK-01",
      equipmentId: "MOBILE-01",
      code: "DRIVE_BLOCKED",
      severity: "critical",
      message: "Travel path is blocked.",
      status: "acknowledged",
      raisedAt: "2026-09-18T00:00:00.000Z",
      acknowledgedAt: "2026-09-18T00:01:00.000Z",
      clearedAt: null,
      resolution: null,
    },
  ],
  topology: {
    topologyId: "TOPOLOGY-01",
    revision: 1,
    nodes: [
      { nodeId: "A", kind: "transfer", capabilities: ["load.pickup"] },
      { nodeId: "B", kind: "storage", capabilities: ["load.dropoff"] },
    ],
    edges: [
      {
        edgeId: "A-B",
        fromNodeId: "A",
        toNodeId: "B",
        status: "available",
        requiredCapabilities: ["navigation.graph"],
        resourceIds: [],
      },
    ],
  },
  generatedAt: "2026-09-18T00:00:00.000Z",
};

async function expectNoAutomatedViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // jsdom has no layout engine, so contrast remains a manual/browser check.
      "color-contrast": { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("automated accessibility baseline", () => {
  it("finds no detectable violations on the public product entry", async () => {
    const { container } = render(
      <LocaleProvider>
        <PlatformPage siteOrigin="https://warehouse.example.com" />
      </LocaleProvider>,
    );
    await expectNoAutomatedViolations(container);
  });

  it.each([
    ["about", AboutPage],
    ["contact", ContactPage],
  ])(
    "finds no detectable violations on the public %s page",
    async (_name, Page) => {
      const { container } = render(
        <LocaleProvider>
          <Page siteOrigin="https://warehouse.example.com" />
        </LocaleProvider>,
      );
      await expectNoAutomatedViolations(container);
    },
  );

  it("finds no detectable violations on populated operations projections", async () => {
    const { container } = render(
      <LocaleProvider>
        <OperationsProjectionsPage details={details} />
      </LocaleProvider>,
    );
    await expectNoAutomatedViolations(container);
  });

  it("finds no detectable violations in the unavailable state", async () => {
    const { container } = render(
      <LocaleProvider>
        <OperationsProjectionsPage details={null} />
      </LocaleProvider>,
    );
    await expectNoAutomatedViolations(container);
  });
});
