// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OperationsDetails } from "../../src/application/operations/operations-details";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../components/platform/OperationsShell", () => ({
  OperationsShell: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("../../components/platform/WarehouseTopologyMap", () => ({
  WarehouseTopologyMap: ({
    details,
    projectionCurrent,
  }: {
    details: OperationsDetails;
    projectionCurrent: boolean;
  }) => (
    <p>
      {details.generatedAt}:{String(projectionCurrent)}
    </p>
  ),
}));
vi.mock("../../src/ui/i18n/locale-provider", () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));
import WarehousePage from "../../pages/operations/warehouse/topology";

const details: OperationsDetails = {
  generatedAt: "2026-10-03T00:00:00Z",
  tasks: [],
  equipment: [],
  inventory: [],
  alarms: [],
  locations: [],
  topology: null,
};
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("warehouse projection refresh", () => {
  it("remounts on warehouse changes even with identical projection timestamps", () => {
    const view = render(<WarehousePage warehouseId="one" details={details} />);
    expect(screen.getByText(`${details.generatedAt}:true`)).toBeTruthy();
    view.rerender(<WarehousePage warehouseId="two" details={null} />);
    expect(screen.queryByText(`${details.generatedAt}:true`)).toBeNull();
    expect(screen.getByText("serviceUnavailable")).toBeTruthy();
  });
  it("bounds in-flight refreshes, aborts obsolete reads and preserves failed evidence as noncurrent", async () => {
    vi.useFakeTimers();
    let resolveRequest!: (response: Response) => void;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const view = render(<WarehousePage warehouseId="one" details={details} />);
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveRequest(new Response("{}", { status: 503 }));
    });
    expect(screen.getByText(`${details.generatedAt}:false`)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const signal = fetchMock.mock.calls[1][1].signal as AbortSignal;
    view.rerender(<WarehousePage warehouseId="two" details={null} />);
    expect(signal.aborted).toBe(true);
    await act(async () => {
      resolveRequest(new Response(JSON.stringify(details), { status: 200 }));
    });
    expect(screen.queryByText(`${details.generatedAt}:true`)).toBeNull();
  });
});
