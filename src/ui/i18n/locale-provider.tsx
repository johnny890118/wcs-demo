import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { catalogs, type Locale, type MessageKey } from "./catalogs";

type LocaleContextValue = Readonly<{
  locale: Locale;
  setLocale(locale: Locale): void;
  t(key: MessageKey): string;
}>;

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore<Locale>(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener("warehouse-locale-change", onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener("warehouse-locale-change", onStoreChange);
      };
    },
    () => {
      const stored = window.localStorage.getItem("warehouse-locale");
      return stored === "en" ? "en" : "zh-TW";
    },
    () => "zh-TW",
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    window.localStorage.setItem("warehouse-locale", nextLocale);
    window.dispatchEvent(new Event("warehouse-locale-change"));
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => catalogs[locale][key],
    }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context)
    throw new Error("useLocale must be used inside LocaleProvider.");
  return context;
}
