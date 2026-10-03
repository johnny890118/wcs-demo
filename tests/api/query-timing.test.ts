import type { PoolClient } from "pg";
import { AsyncLocalStorage } from "node:async_hooks";
import { describe, expect, it, vi } from "vitest";
import { instrumentQueryTiming } from "../../apps/api/src/database/query-timing";
import {
  requestTimingHeader,
  withRequestTiming,
} from "../../src/infrastructure/http/request-timing";

describe("PostgreSQL client timing", () => {
  it("preserves promise results, errors and client receiver", async () => {
    const client = {
      query: vi.fn(function (this: unknown) {
        expect(this).toBe(client);
        return Promise.resolve({ rows: [{ value: 1 }] });
      }),
    } as unknown as PoolClient;
    instrumentQueryTiming(client);
    await withRequestTiming(async () => {
      expect(await client.query("test-only query")).toEqual({
        rows: [{ value: 1 }],
      });
      expect(requestTimingHeader()).toMatch(/^database_query;dur=\d+\.\d{2}$/);
    });
    const failing = {
      query: () => Promise.reject(new Error("query failed")),
    } as unknown as PoolClient;
    instrumentQueryTiming(failing);
    await withRequestTiming(async () => {
      await expect(failing.query("test-only query")).rejects.toThrow(
        "query failed",
      );
      expect(requestTimingHeader()).toMatch(/^database_query;dur=\d+\.\d{2}$/);
    });
  });

  it("attributes pooled callbacks to the dispatch context, not completion context", () => {
    let complete: ((error: null, result: unknown) => unknown) | undefined;
    const client = {
      query: (_text: string, callback: typeof complete) => {
        complete = callback;
      },
    } as unknown as PoolClient;
    instrumentQueryTiming(client);
    const callback = vi.fn();
    let dispatchHeader: (() => string) | undefined;
    withRequestTiming(() => {
      client.query("test-only query", callback);
      // Capture a function that re-enters this request's context after completion.
      const snapshot = AsyncLocalStorage.snapshot();
      dispatchHeader = () => snapshot(requestTimingHeader);
    });
    withRequestTiming(() => {
      complete!(null, { rows: [] });
      expect(requestTimingHeader()).toBe("");
    });
    expect(callback).toHaveBeenCalledWith(null, { rows: [] });
    expect(dispatchHeader!()).toMatch(/^database_query;dur=\d+\.\d{2}$/);
  });
});
