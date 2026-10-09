import { describe, expect, it } from "vitest";
import {
  auditActions,
  auditResourceTypes,
} from "../../src/application/audit/audit-vocabulary";
import {
  auditActionLabel,
  auditResourceLabel,
} from "../../src/ui/audit-labels";
import { formatOperationalTime } from "../../src/ui/format-operational-time";

describe("human-readable recorded evidence", () => {
  it("labels every approved action and resource in both languages", () => {
    for (const locale of ["zh-TW", "en"] as const) {
      for (const action of auditActions) {
        expect(auditActionLabel(action, true, locale)).not.toBe(action);
      }
      for (const resource of auditResourceTypes) {
        expect(auditResourceLabel(resource, locale)).toBeTruthy();
      }
    }
  });
  it("does not invent outcomes for unknown or untrusted actions", () => {
    expect(auditActionLabel("new.success", true, "en")).toBe(
      "Unrecognized recorded action",
    );
    expect(auditActionLabel("transport_task.complete", false, "en")).toBe(
      "Unrecognized recorded action",
    );
    expect(auditResourceLabel("UnrecognizedResource", "en")).toBe(
      "UnrecognizedResource",
    );
  });
  it("formats evidence with an explicit deterministic timezone", () => {
    expect(formatOperationalTime("2026-10-09T20:10:01+08:00")).toBe(
      "2026-10-09 12:10:01 UTC",
    );
    expect(formatOperationalTime("invalid")).toBe("—");
  });
});
