import { useLocale } from "../../src/ui/i18n/locale-provider";
import { PreferenceGroup } from "../ui/navigation";

export function LocaleControl() {
  const { locale, setLocale, t } = useLocale();

  return (
    <PreferenceGroup label={t("locale")}>
      {(["zh-TW", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          onClick={() => setLocale(option)}
          className="swp-preference-option"
        >
          {option === "zh-TW" ? "繁中" : "EN"}
        </button>
      ))}
    </PreferenceGroup>
  );
}
