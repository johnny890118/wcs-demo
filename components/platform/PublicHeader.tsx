import Link from "next/link";
import { LocaleControl } from "./LocaleControl";
import { ThemeControl } from "./ThemeControl";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { ProductMark } from "./ProductMark";

export function PublicHeader() {
  const { t } = useLocale();

  return (
    <>
      <a
        href="#main-content"
        className="absolute left-3 top-3 z-50 -translate-y-20 rounded-md bg-[var(--text)] px-3 py-2 text-sm font-semibold text-[var(--surface)] focus:translate-y-0"
      >
        {t("skipToContent")}
      </a>
      <header className="border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)]">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label={t("brand")}
            className="ui-pressable flex items-center gap-3 rounded-lg"
          >
            <ProductMark />
            <span className="hidden text-sm font-bold tracking-tight sm:inline">
              {t("brand")}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LocaleControl />
            <ThemeControl />
          </div>
        </div>
      </header>
    </>
  );
}
