// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PlatformPage from "../../pages";
import AboutPage from "../../pages/about";
import ContactPage from "../../pages/contact";
import LoginPage from "../../pages/login";
import OperationsProjectionsPage from "../../pages/operations/projections";
import InboundOperationsPage from "../../pages/operations/inbound";
import AlarmOperationsPage from "../../pages/operations/alarms";
import OutboundOperationsPage from "../../pages/operations/outbound";
import WarehouseOperationsPage from "../../pages/operations/warehouse";
import AuditHistoryPage from "../../pages/operations/audit";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import { LocaleProvider } from "../../src/ui/i18n/locale-provider";
import { testOperationalSession } from "../fixtures/operational-access";

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
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
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

const details: OperationsDetails = {
  locations: [
    {
      locationId: "LOCATION-01",
      code: "RECEIVING-01",
      kind: "receiving",
      status: "available",
      capabilities: ["load.pickup"],
      activeNodeId: "A",
    },
    {
      locationId: "LOCATION-02",
      code: "STORAGE-A-01",
      kind: "storage",
      status: "available",
      capabilities: ["load.dropoff", "inventory.store"],
      activeNodeId: "B",
    },
    {
      locationId: "LOCATION-03",
      code: "SHIPPING-01",
      kind: "shipping",
      status: "available",
      capabilities: ["load.dropoff", "outbound.stage"],
      activeNodeId: "C",
    },
  ],
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
      capabilities: ["transport.move", "load.pickup", "load.dropoff"],
      active: true,
      telemetry: {
        status: "moving_to_destination",
        taskId: "TASK-01",
        loadId: "LOAD-01",
        faultCode: null,
        topologyId: "TOPOLOGY-01",
        topologyRevision: 1,
        nodeId: "A",
        connectionStatus: "connected",
        quality: "good",
        freshness: "current",
        ageMs: 200,
        sequence: 4,
        observedAt: "2026-09-18T00:00:00.000Z",
        receivedAt: "2026-09-18T00:00:00.200Z",
        source: "test-simulator",
      },
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
      {
        nodeId: "A",
        kind: "transfer",
        capabilities: ["load.pickup"],
        position: { coordinateSystem: "test", x: 0, y: 0 },
      },
      {
        nodeId: "B",
        kind: "storage",
        capabilities: ["load.dropoff"],
        position: { coordinateSystem: "test", x: 10, y: 0 },
      },
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
        <PlatformPage
          siteOrigin="https://warehouse.example.com"
          entryHref="/login"
        />
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

  it("finds no detectable violations on the product login", async () => {
    const { container } = render(
      <LocaleProvider>
        <LoginPage callbackUrl="/operations" sessionExpired />
      </LocaleProvider>,
    );
    expect(screen.getByText("工作階段已過期")).toBeTruthy();
    await expectNoAutomatedViolations(container);
  });

  it("finds no detectable violations on populated operations projections", async () => {
    const { container } = render(
      <LocaleProvider>
        <OperationsProjectionsPage details={details} />
      </LocaleProvider>,
    );
    await expectNoAutomatedViolations(container);
  });

  it("finds no detectable violations on the warehouse topology map", async () => {
    const { container } = render(
      <LocaleProvider>
        <WarehouseOperationsPage details={details} />
      </LocaleProvider>,
    );
    await expectNoAutomatedViolations(container);
  });

  it("finds no detectable violations on the inbound confirmation workflow", async () => {
    const { container } = render(
      <LocaleProvider>
        <InboundOperationsPage
          details={details}
          canCreate
          canExecute
          canViewAudit
        />
      </LocaleProvider>,
    );
    await expectNoAutomatedViolations(container);
  });

  it("finds no detectable violations on the outbound confirmation workflow", async () => {
    const outboundDetails: OperationsDetails = {
      ...details,
      equipment: details.equipment.map((item) => ({
        ...item,
        telemetry: item.telemetry
          ? { ...item.telemetry, status: "idle" }
          : null,
      })),
    };
    const { container } = render(
      <LocaleProvider>
        <OutboundOperationsPage
          details={outboundDetails}
          canCreate
          canExecute
          canViewAudit
        />
      </LocaleProvider>,
    );
    await expectNoAutomatedViolations(container);
  });

  it("finds no detectable violations on the alarm recovery workflow", async () => {
    const { container } = render(
      <LocaleProvider>
        <AlarmOperationsPage
          details={details}
          canAcknowledge
          canRecover
          canViewAudit
        />
      </LocaleProvider>,
    );
    await expectNoAutomatedViolations(container);
  });

  it("explains and disables actions outside the effective permission set", async () => {
    const { container } = render(
      <LocaleProvider>
        <InboundOperationsPage
          details={details}
          canCreate={false}
          canExecute={false}
          canViewAudit={false}
        />
      </LocaleProvider>,
    );

    expect(
      (
        screen.getByRole("button", {
          name: "建立入庫單",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      screen.getByText("目前權限可以查看入庫作業，但不能建立入庫單。"),
    ).toBeTruthy();
    await expectNoAutomatedViolations(container);
  });

  it("finds no detectable violations on accountable audit history", async () => {
    const { container } = render(
      <LocaleProvider>
        <AuditHistoryPage
          filters={{}}
          initialPage={{
            events: [
              {
                eventId: "70000000-0000-4000-8000-000000000001",
                correlationId: "request:workflow-001",
                occurredAt: "2026-09-20T03:00:00.000Z",
                actor: { type: "user", id: "operator@example.test" },
                action: "transport_task.complete",
                knownAction: true,
                knownResource: true,
                resource: {
                  type: "TransportTask",
                  id: "50000000-0000-4000-8000-000000000001",
                },
                evidence: { equipmentId: "AMR-01" },
              },
            ],
            nextCursor: null,
          }}
        />
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
