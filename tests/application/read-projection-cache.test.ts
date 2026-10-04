import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ReadProjectionCache,
  ReadProjectionScopeError,
  projectionCacheIdentity,
} from "../../src/ui/operations/read-projection-cache";
const now = Date.parse("2026-10-04T00:00:00Z");
const authority = { scopeKey: "a".repeat(64), validUntil: now + 900000 };
afterEach(() => vi.useRealTimers());
describe("bounded authority-scoped read cache", () => {
  it("isolates authorities/locales/filters and clones caller/read data", () => {
    const cache = new ReadProjectionCache(),
      data = { items: ["owned"] };
    const key = projectionCacheIdentity(
      "/api/operations/inventory?search=SKU",
      "zh-TW",
    );
    expect(cache.put(authority, key, { data, authority }, now)).toBe(true);
    data.items[0] = "mutated";
    const read = cache.get<typeof data>(authority, key, now)!;
    read.data.items[0] = "reader";
    expect(cache.get(authority, key, now)?.data).toEqual({ items: ["owned"] });
    expect(
      cache.get({ ...authority, scopeKey: "b".repeat(64) }, key, now),
    ).toBeNull();
    expect(
      cache.get(
        authority,
        projectionCacheIdentity("/api/operations/inventory?search=SKU", "en"),
        now,
      ),
    ).toBeNull();
    expect(
      cache.get(
        authority,
        projectionCacheIdentity(
          "/api/operations/inventory?search=OTHER",
          "zh-TW",
        ),
        now,
      ),
    ).toBeNull();
  });
  it("enforces exact authority/retention deadlines and rejects future stored time", () => {
    const cache = new ReadProjectionCache();
    cache.put(
      authority,
      "key",
      { data: 1, authority: { ...authority, validUntil: now + 1000 } },
      now,
    );
    expect(cache.get(authority, "key", now + 999)?.data).toBe(1);
    expect(cache.get(authority, "key", now + 1000)).toBeNull();
    cache.put(authority, "key", { data: 1, authority }, now);
    expect(cache.get(authority, "key", now + 60000)).toBeNull();
    cache.put(authority, "key", { data: 1, authority }, now);
    expect(cache.get(authority, "key", now - 1)).toBeNull();
    expect(
      cache.put(
        { ...authority, validUntil: now },
        "strict",
        { data: 1, authority },
        now,
      ),
    ).toBe(false);
  });
  it("bounds entries and bytes without evicting command authority or retaining oversized data", () => {
    const cache = new ReadProjectionCache();
    for (let i = 0; i < 30; i++)
      cache.put(authority, String(i), { data: i, authority }, now);
    expect(cache.diagnostics().entries).toBe(24);
    expect(cache.get(authority, "0", now)).toBeNull();
    expect(
      cache.put(
        authority,
        "large",
        { data: "x".repeat(300000), authority },
        now,
      ),
    ).toBe(false);
    for (let i = 0; i < 20; i++)
      cache.put(
        authority,
        `large-${i}`,
        { data: "x".repeat(200000), authority },
        now,
      );
    expect(cache.diagnostics().bytes).toBeLessThanOrEqual(2 * 1024 * 1024);
    expect(cache.diagnostics().entries).toBeLessThanOrEqual(24);
  });
  it("coalesces same-scope read prefetch but never strict validation", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const cache = new ReadProjectionCache(),
      fetcher = vi.fn().mockResolvedValue({ data: { value: 1 }, authority });
    const results = await Promise.all([
      cache.fetch<{ value: number }>(authority, "same", fetcher),
      cache.fetch<{ value: number }>(authority, "same", fetcher),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    results[0].data.value = 2;
    expect(results[1].data.value).toBe(1);
    await Promise.all([
      cache.fetch(null, "same", fetcher),
      cache.fetch(null, "same", fetcher),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("aborts context/mutation invalidation and rejects late responses from repopulating cache", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const cache = new ReadProjectionCache();
    let resolve!: (value: {
      data: number;
      authority: typeof authority;
    }) => void;
    const pending = cache.fetch<number>(
      authority,
      "late",
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    await Promise.resolve();
    cache.clear();
    resolve({ data: 1, authority });
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(cache.diagnostics()).toEqual({ entries: 0, bytes: 0, pending: 0 });
  });
  it("bounds pending reads and fails a changed server scope without caching", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const cache = new ReadProjectionCache();
    const pending = Array.from({ length: 6 }, (_, i) =>
      cache.fetch<never>(
        authority,
        String(i),
        (signal) =>
          new Promise((_, reject) =>
            signal.addEventListener("abort", () =>
              reject(new DOMException("cancelled", "AbortError")),
            ),
          ),
      ),
    );
    await Promise.resolve();
    await expect(cache.fetch(authority, "overflow", vi.fn())).rejects.toThrow(
      "concurrency",
    );
    cache.clear();
    await Promise.allSettled(pending);
    await expect(
      cache.fetch(authority, "changed", async () => ({
        data: 1,
        authority: { ...authority, scopeKey: "b".repeat(64) },
      })),
    ).rejects.toBeInstanceOf(ReadProjectionScopeError);
    expect(cache.diagnostics().entries).toBe(0);
  });
  it("normalizes filter keys and excludes APIs outside the read allowlist", () => {
    expect(
      projectionCacheIdentity(
        "/api/operations/tasks?view=all&cursor=next",
        "en",
      ),
    ).toBe(
      projectionCacheIdentity(
        "/api/operations/tasks?cursor=next&view=all",
        "en",
      ),
    );
    for (const endpoint of [
      "https://foreign.example/api/operations/tasks",
      "/api/operations/tasks#fragment",
      "/api/operations/inbound",
      "/api/operations/audit",
      "/api/operations/tasks/id/execute",
    ])
      expect(() => projectionCacheIdentity(endpoint, "en")).toThrow();
    expect(() =>
      projectionCacheIdentity("/api/operations/tasks", "fr"),
    ).toThrow();
  });
  it("refuses missing, invalid or expired response authority, including late completion", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const cache = new ReadProjectionCache();
    for (const resultAuthority of [
      null,
      { scopeKey: "invalid", validUntil: now + 1 },
      { ...authority, validUntil: now },
    ]) {
      await expect(
        cache.fetch(authority, "invalid", async () => ({
          data: 1,
          authority: resultAuthority,
        })),
      ).rejects.toBeInstanceOf(ReadProjectionScopeError);
    }
    let resolve!: (value: {
      data: number;
      authority: typeof authority;
    }) => void;
    const pending = cache.fetch<number>(
      authority,
      "deadline",
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    await Promise.resolve();
    vi.setSystemTime(authority.validUntil);
    resolve({ data: 1, authority });
    await expect(pending).rejects.toBeInstanceOf(ReadProjectionScopeError);
    expect(cache.diagnostics().entries).toBe(0);
  });
});
