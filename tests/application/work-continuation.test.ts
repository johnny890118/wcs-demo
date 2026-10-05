import { describe, expect, it } from "vitest";
import {
  belongsToWork,
  canOfferWorkExecution,
  workAttention,
  workResumePath,
} from "../../src/application/operations/work-continuation";
import {
  taskStatuses,
  type TaskDetail,
  type TaskQueueItem,
} from "../../src/application/operations/task-projection";
import type { WorkDetail } from "../../src/application/operations/work-projection";

describe("durable Work continuation selection", () => {
  it.each(taskStatuses)("only queued is normal execution, not %s", (status) => {
    expect(canOfferWorkExecution({ status } as TaskQueueItem)).toBe(
      status === "queued",
    );
  });
  it("requires exact persisted origin and flow", () => {
    const detail = {
      task: { flow: "inbound" },
      originResource: { type: "InboundReceipt", id: "AAA" },
    } as TaskDetail;
    expect(belongsToWork(detail, "inbound", "aaa")).toBe(true);
    expect(belongsToWork(detail, "outbound", "aaa")).toBe(false);
    expect(belongsToWork(detail, "inbound", "bbb")).toBe(false);
    expect(workResumePath("inbound", "AAA", "BBB")).toBe(
      "/operations/work/inbound/aaa/resume/bbb",
    );
  });
  it("prioritizes incomplete/unknown evidence over terminal records and ignores page size", () => {
    const detail = {
      execution: {
        referencedTaskCount: 100,
        qualifiedTaskCount: 100,
        counts: { completed: 99, unknown: 1 },
        page: { tasks: [] },
      },
    } as unknown as WorkDetail;
    expect(workAttention(detail)).toBe("unknown");
    expect(
      workAttention({
        ...detail,
        execution: { ...detail.execution, referencedTaskCount: 101 },
      }),
    ).toBe("incomplete");
    expect(
      workAttention({
        ...detail,
        execution: {
          ...detail.execution,
          counts: { ...detail.execution.counts, unknown: 0, queued: 1 },
        },
      }),
    ).toBe("waiting");
  });
});
