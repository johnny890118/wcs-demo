import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import { useLocale } from "../../src/ui/i18n/locale-provider";

const options = [
  { value: "light", key: "light", Icon: SunIcon },
  { value: "dark", key: "dark", Icon: MoonIcon },
  { value: "system", key: "system", Icon: ComputerDesktopIcon },
] as const;

export function ThemeControl() {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();
  const selectedTheme = theme ?? "system";

  return (
    <div
      className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-1"
      role="group"
      aria-label={t("theme")}
    >
      {options.map(({ value, key, Icon }) => (
        <button
          key={value}
          type="button"
          title={t(key)}
          aria-label={t(key)}
          aria-pressed={selectedTheme === value}
          onClick={() => setTheme(value)}
          className={`ui-pressable rounded-md p-1.5 ${
            selectedTheme === value
              ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
              : "text-[var(--text-muted)]"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
