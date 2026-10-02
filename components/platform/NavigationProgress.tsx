import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "../../src/ui/i18n/locale-provider";
export function NavigationProgress() {
  const router = useRouter();
  const { t } = useLocale();
  const target = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const start = (url: string) => {
      target.current = url;
      setPending(true);
    };
    const done = (url: string) => {
      if (target.current === url) {
        target.current = null;
        setPending(false);
      }
    };
    const error = (_error: unknown, url: string) => done(url);
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", done);
    router.events.on("routeChangeError", error);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", done);
      router.events.off("routeChangeError", error);
    };
  }, [router.events]);
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed left-1/2 top-2 z-50 -translate-x-1/2 rounded-md bg-[var(--text)] px-4 py-2 text-sm font-semibold text-[var(--surface)]"
      hidden={!pending}
    >
      {pending ? t("navigationPending") : ""}
    </div>
  );
}
