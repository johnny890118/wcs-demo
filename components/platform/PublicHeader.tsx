import Link from "next/link";
import { LocaleControl } from "./LocaleControl";
import { ThemeControl } from "./ThemeControl";
import { useLocale } from "../../src/ui/i18n/locale-provider";

export function PublicHeader() {
  const { t } = useLocale();

  return (
    <header className="border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)]">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/platform"
          className="ui-pressable flex items-center gap-3 rounded-lg"
        >
          <span
            className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent)] text-sm font-black text-white"
            aria-hidden="true"
          >
            W
          </span>
          <span className="text-sm font-bold tracking-tight">{t("brand")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LocaleControl />
          <ThemeControl />
        </div>
      </div>
    </header>
  );
}
