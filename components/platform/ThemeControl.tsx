import {
  Monitor as ComputerDesktopIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useSyncExternalStore } from "react";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { PreferenceGroup } from "../ui/navigation";

const options = [
  { value: "light", key: "light", Icon: SunIcon },
  { value: "dark", key: "dark", Icon: MoonIcon },
  { value: "system", key: "system", Icon: ComputerDesktopIcon },
] as const;

type ThemePreference = (typeof options)[number]["value"];

const subscribeToHydration = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function normalizeThemePreference(theme: string | undefined): ThemePreference {
  return options.some(({ value }) => value === theme)
    ? (theme as ThemePreference)
    : "system";
}

export function ThemeControl({ showLabels = false }: { showLabels?: boolean }) {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();
  // Keep the server and first client render identical, then synchronize the
  // preference that next-themes restored from localStorage. One normalized
  // preference drives every button, so provider timing cannot make two choices
  // look selected. "system" is the preference; the resolved light/dark
  // appearance remains next-themes' responsibility.
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );
  const selectedTheme = isHydrated ? normalizeThemePreference(theme) : "system";

  useEffect(() => {
    const preference = normalizeThemePreference(theme);

    // Recover safely from an unknown/corrupt persisted value. With no valid
    // preference, next-themes resolves the OS preference; CSS :root remains
    // the light fallback if that resolution cannot run.
    if (isHydrated && theme !== undefined && theme !== preference) {
      setTheme(preference);
    }
  }, [isHydrated, setTheme, theme]);

  function selectTheme(preference: ThemePreference) {
    setTheme(preference);
  }

  return (
    <PreferenceGroup label={t("theme")}>
      {options.map(({ value, key, Icon }) => (
        <button
          key={value}
          type="button"
          title={t(key)}
          aria-label={t(key)}
          aria-pressed={selectedTheme === value}
          data-theme-preference={value}
          onClick={() => selectTheme(value)}
          className="swp-preference-option"
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {showLabels ? <span className="ml-2 text-sm">{t(key)}</span> : null}
        </button>
      ))}
    </PreferenceGroup>
  );
}
