import { useLocale } from "../../src/ui/i18n/locale-provider";

export function LocaleControl() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-1"
      role="group"
      aria-label={t("locale")}
    >
      {(["zh-TW", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          onClick={() => setLocale(option)}
          className={`ui-pressable inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-semibold ${
            locale === option
              ? "ui-current-selection"
              : "text-[var(--text-muted)]"
          }`}
        >
          {option === "zh-TW" ? "繁中" : "EN"}
        </button>
      ))}
    </div>
  );
}
