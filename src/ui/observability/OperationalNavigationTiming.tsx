import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

/** Browser-local diagnostics only; no route/resource identity or remote telemetry. */
export function OperationalNavigationTiming({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const pending = useRef<{ url: string; started: number } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const start = (url: string) => {
      pending.current = { url, started: performance.now() };
    };
    const finish = (url: string, cancelled = false) => {
      const active = pending.current;
      if (!active || active.url !== url) return;
      pending.current = null;
      if (typeof performance.measure !== "function") return;
      const name = cancelled
        ? "swp.navigation_interrupted"
        : "swp.navigation_total";
      try {
        if (performance.getEntriesByName(name).length >= 50)
          performance.clearMeasures(name);
        performance.measure(name, {
          start: active.started,
          end: performance.now(),
        });
      } catch {
        // Unsupported timing must never interfere with navigation or authorization.
      }
    };
    const complete = (url: string) => finish(url);
    const error = (_error: unknown, url: string) => finish(url, true);
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", complete);
    router.events.on("routeChangeError", error);
    return () => {
      pending.current = null;
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", complete);
      router.events.off("routeChangeError", error);
    };
  }, [enabled, router.events]);
  return null;
}
