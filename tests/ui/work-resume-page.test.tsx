// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth/next";
import { getServerSideProps } from "../../pages/operations/work/[flow]/[workId]/resume/[taskId]";
import { WorkExecutionPanel } from "../../components/platform/WorkExecutionPanel";
import {
  fetchTaskDetail,
  fetchOperationsDetails,
} from "../../src/infrastructure/http/wcs-api-client";
import type { TaskDetail } from "../../src/application/operations/task-projection";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import { testOperationalSession } from "../fixtures/operational-access";
vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../src/infrastructure/http/wcs-api-client", () => ({
  fetchTaskDetail: vi.fn(),
  fetchOperationsDetails: vi.fn(),
  WcsProjectionError: class extends Error {},
}));
vi.mock("../../components/platform/OperationsShell", () => ({
  OperationsShell: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../src/ui/i18n/locale-provider", () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));
afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
it("ages out equipment evidence while the operator remains on the page", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(detail.generatedAt));
  render(
    <WorkExecutionPanel detail={detail} equipment={equipment} canExecute />,
  );
  expect(screen.getByRole("option", { name: "EQ" })).toBeTruthy();
  vi.setSystemTime(new Date(Date.parse(detail.generatedAt) + 31_000));
  act(() => vi.advanceTimersByTime(1_000));
  expect(screen.queryByRole("option", { name: "EQ" })).toBeNull();
});
it("changing the selected equipment clears confirmation", () => {
  render(
    <WorkExecutionPanel detail={detail} equipment={equipment} canExecute />,
  );
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "EQ" } });
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Reviewed exact movement" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
    false,
  );
});
const taskId = "50000000-0000-4000-8000-000000000001";
const workId = "30000000-0000-4000-8000-000000000001";
const detail = {
  task: {
    taskId,
    flow: "inbound",
    status: "queued",
    source: "Receiving",
    destination: "Storage",
    sku: "SKU",
    quantity: 3,
  },
  originResource: { type: "InboundReceipt", id: workId },
  generatedAt: new Date().toISOString(),
} as TaskDetail;
const equipment = [
  {
    equipmentId: "EQ",
    adapterKey: "simulator",
    active: true,
    capabilities: ["transport.move", "load.pickup", "load.dropoff"],
    telemetry: {
      status: "idle",
      connectionStatus: "connected",
      quality: "good",
      freshness: "current",
      nodeId: "N",
      ageMs: 0,
      receivedAt: new Date().toISOString(),
      observedAt: new Date().toISOString(),
      taskId: null,
      loadId: null,
      faultCode: null,
      topologyId: null,
      topologyRevision: null,
      sequence: 1,
      source: "simulator",
    },
  },
] as OperationsDetails["equipment"];
const request = (query = {}) => ({
  params: { flow: "inbound", workId, taskId },
  query,
  req: {},
  res: { setHeader: vi.fn(), headersSent: false },
});
it("rejects mismatched persisted Work before equipment reads", async () => {
  vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
  vi.mocked(fetchTaskDetail).mockResolvedValue({
    ...detail,
    originResource: { ...detail.originResource, id: taskId },
  });
  expect(await getServerSideProps(request() as never)).toEqual({
    notFound: true,
  });
  expect(fetchOperationsDetails).not.toHaveBeenCalled();
});
it("rejects a sibling task response even within the same Work", async () => {
  vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
  vi.mocked(fetchTaskDetail).mockResolvedValue({
    ...detail,
    task: { ...detail.task, taskId: workId },
  });
  expect(await getServerSideProps(request() as never)).toEqual({
    notFound: true,
  });
  expect(fetchOperationsDetails).not.toHaveBeenCalled();
});
it("rejects extra warehouse/return query and unauthenticated read", async () => {
  expect(
    await getServerSideProps(request({ warehouseId: "other" }) as never),
  ).toEqual({ notFound: true });
  vi.mocked(getServerSession).mockResolvedValue(null);
  expect(await getServerSideProps(request() as never)).toHaveProperty(
    "redirect",
  );
  expect(fetchTaskDetail).not.toHaveBeenCalled();
});
it.each([
  "unknown",
  "blocked",
  "completed",
  "assigned",
  "in_progress",
  "cancelled",
] as const)("does not offer execute for %s", (status) => {
  render(
    <WorkExecutionPanel
      detail={{ ...detail, task: { ...detail.task, status } }}
      equipment={equipment}
      canExecute
    />,
  );
  expect(screen.queryByRole("button")).toBeNull();
  expect(
    screen.getByRole("link", { name: "openWorkContext" }).getAttribute("href"),
  ).toContain(workId);
});
it("announces pending outcome without offering another command", async () => {
  let finish!: (value: unknown) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    ),
  );
  render(
    <WorkExecutionPanel detail={detail} equipment={equipment} canExecute />,
  );
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "EQ" } });
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Reviewed exact movement" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByRole("status").textContent).toBe("workExecutionPending");
  expect(screen.queryByRole("button")).toBeNull();
  await act(async () =>
    finish({ ok: false, status: 503, json: async () => ({}) }),
  );
  expect(screen.getByRole("alert")).toBeTruthy();
});
it("requires selection/reason/confirmation, preserves strict payload and prevents blind resend after failed response", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
  vi.stubGlobal("fetch", fetch);
  render(
    <WorkExecutionPanel detail={detail} equipment={equipment} canExecute />,
  );
  const button = screen.getByRole("button");
  expect((button as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "EQ" } });
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Reviewed movement risk" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(button);
  await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    equipmentId: "EQ",
    confirmedAction: "execute_inbound_task",
    confirmationReason: "Reviewed movement risk",
  });
  expect(screen.queryByRole("button")).toBeNull();
});
it.each([
  { taskId, equipmentId: "EQ", status: "unknown", completedAt: 1 },
  { taskId: workId, equipmentId: "EQ", status: "completed", completedAt: 1 },
  { taskId, equipmentId: "OTHER", status: "completed", completedAt: 1 },
  { taskId, equipmentId: "EQ", status: "completed" },
])(
  "rejects HTTP200 with uncertain/malformed/wrong identity outcome %#",
  async (payload) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => payload,
      }),
    );
    render(
      <WorkExecutionPanel detail={detail} equipment={equipment} canExecute />,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "EQ" } });
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Reviewed exact movement" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.queryByText("workExecutionRecorded")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  },
);
