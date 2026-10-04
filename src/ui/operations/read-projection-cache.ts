import {
  isReadProjectionAuthority,
  type ReadProjectionAuthority,
} from "../../application/access/read-projection-authority";

type Entry = {
  data: unknown;
  authority: ReadProjectionAuthority;
  storedAt: number;
  bytes: number;
};
export type ReadProjectionResult<T> = {
  data: T;
  authority: ReadProjectionAuthority | null;
};
export class ReadProjectionScopeError extends Error {}
/** Per-Operations-layout memory only. No SSR/global/localStorage persistence. */
export class ReadProjectionCache {
  private readonly entries = new Map<string, Entry>();
  private readonly pending = new Map<
    string,
    {
      controller: AbortController;
      promise: Promise<ReadProjectionResult<unknown>>;
    }
  >();
  private bytes = 0;
  private generation = 0;
  readonly limits = Object.freeze({
    entries: 24,
    bytes: 2 * 1024 * 1024,
    entryBytes: 256 * 1024,
    pending: 6,
    retainMs: 60_000,
  });
  private identity(authority: ReadProjectionAuthority, key: string): string {
    return `${authority.scopeKey}:${key}`;
  }
  private remove(key: string): void {
    const entry = this.entries.get(key);
    if (entry) this.bytes -= entry.bytes;
    this.entries.delete(key);
  }
  get<T>(
    authority: ReadProjectionAuthority | null,
    key: string,
    now = Date.now(),
  ): { data: T; storedAt: number } | null {
    if (!isReadProjectionAuthority(authority) || authority.validUntil <= now)
      return null;
    const identity = this.identity(authority, key),
      entry = this.entries.get(identity);
    if (!entry) return null;
    if (
      entry.authority.validUntil <= now ||
      now - entry.storedAt >= this.limits.retainMs ||
      now < entry.storedAt
    ) {
      this.remove(identity);
      return null;
    }
    this.entries.delete(identity);
    this.entries.set(identity, entry);
    return { data: structuredClone(entry.data) as T, storedAt: entry.storedAt };
  }
  put<T>(
    authority: ReadProjectionAuthority | null,
    key: string,
    result: ReadProjectionResult<T>,
    now = Date.now(),
  ): boolean {
    if (
      !isReadProjectionAuthority(authority) ||
      !isReadProjectionAuthority(result.authority) ||
      authority.scopeKey !== result.authority.scopeKey ||
      Math.min(authority.validUntil, result.authority.validUntil) <= now
    )
      return false;
    const encoded = JSON.stringify(result.data);
    if (typeof encoded !== "string") return false;
    const bytes = new TextEncoder().encode(encoded).length;
    if (bytes > this.limits.entryBytes) return false;
    const identity = this.identity(authority, key);
    this.remove(identity);
    while (
      this.entries.size >= this.limits.entries ||
      this.bytes + bytes > this.limits.bytes
    ) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.remove(oldest);
    }
    this.entries.set(identity, {
      data: structuredClone(result.data),
      authority: {
        scopeKey: authority.scopeKey,
        validUntil: Math.min(authority.validUntil, result.authority.validUntil),
      },
      storedAt: now,
      bytes,
    });
    this.bytes += bytes;
    return true;
  }
  fetch<T>(
    authority: ReadProjectionAuthority | null,
    key: string,
    fetcher: (signal: AbortSignal) => Promise<ReadProjectionResult<T>>,
    now = Date.now(),
  ): Promise<ReadProjectionResult<T>> {
    // Strict/no-authority requests are intentionally not coalesced or cached.
    const reusable =
      isReadProjectionAuthority(authority) && authority.validUntil > now;
    const identity = reusable ? this.identity(authority, key) : null;
    if (identity) {
      const existing = this.pending.get(identity);
      if (existing)
        return existing.promise.then(
          (result) => structuredClone(result) as ReadProjectionResult<T>,
        );
    }
    if (this.pending.size >= this.limits.pending)
      return Promise.reject(
        new Error("Read projection concurrency limit reached."),
      );
    const controller = new AbortController(),
      generation = this.generation;
    const pendingKey = identity ?? `strict:${this.generation}:${Math.random()}`;
    const promise = Promise.resolve()
      .then(() => fetcher(controller.signal))
      .then((result) => {
        if (controller.signal.aborted || generation !== this.generation)
          throw new DOMException("Read scope changed.", "AbortError");
        if (
          reusable &&
          (!isReadProjectionAuthority(result.authority) ||
            result.authority.scopeKey !== authority.scopeKey ||
            Math.min(authority.validUntil, result.authority.validUntil) <=
              Date.now())
        )
          throw new ReadProjectionScopeError("Read authority changed.");
        if (reusable) this.put(authority, key, result);
        return structuredClone(result);
      })
      .finally(() => {
        if (this.pending.get(pendingKey)?.controller === controller)
          this.pending.delete(pendingKey);
      });
    this.pending.set(pendingKey, {
      controller,
      promise: promise as Promise<ReadProjectionResult<unknown>>,
    });
    return promise;
  }
  clear(): void {
    this.generation++;
    for (const item of this.pending.values()) item.controller.abort();
    this.pending.clear();
    this.entries.clear();
    this.bytes = 0;
  }
  diagnostics(): { entries: number; bytes: number; pending: number } {
    return {
      entries: this.entries.size,
      bytes: this.bytes,
      pending: this.pending.size,
    };
  }
}

/** Allowlisted read identity; locale and normalized filters cannot collide. */
export function projectionCacheIdentity(
  endpoint: string,
  locale: string,
): string {
  const parsed = new URL(endpoint, "https://internal.invalid");
  if (
    !endpoint.startsWith("/api/operations/") ||
    parsed.origin !== "https://internal.invalid" ||
    parsed.hash ||
    !/^\/api\/operations\/(overview|tasks(?:\/[0-9a-f-]{36})?|inventory|loads|locations|live-view|details)$/.test(
      parsed.pathname,
    ) ||
    !["zh-TW", "en"].includes(locale) ||
    endpoint.length > 500
  )
    throw new Error("Invalid read projection identity.");
  parsed.searchParams.sort();
  return `${locale}:${parsed.pathname}?${parsed.searchParams.toString()}`;
}
