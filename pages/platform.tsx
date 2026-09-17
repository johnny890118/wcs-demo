import {
  ArrowRightIcon,
  BeakerIcon,
  CircleStackIcon,
  CubeTransparentIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { PublicHeader } from "../components/platform/PublicHeader";
import { useLocale } from "../src/ui/i18n/locale-provider";

export default function PlatformPage() {
  const { t } = useLocale();
  const features = [
    {
      title: t("simulator"),
      description: t("simulatorDescription"),
      Icon: BeakerIcon,
    },
    {
      title: t("traceable"),
      description: t("traceableDescription"),
      Icon: CircleStackIcon,
    },
    {
      title: t("hardwareIndependent"),
      description: t("hardwareDescription"),
      Icon: CubeTransparentIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)]">
      <PublicHeader />
      <main id="main-content">
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
          <div className="max-w-4xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              {t("heroEyebrow")}
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
              {t("heroBody")}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/operations"
                className="ui-pressable inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-bold text-[var(--on-accent)] shadow-sm"
              >
                {t("openOperations")}
                <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/"
                className="ui-pressable inline-flex items-center rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-3 text-sm font-bold"
              >
                {t("viewLegacyDemo")}
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="mb-8 text-sm font-bold">{t("platformProof")}</p>
            <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
              {features.map(({ title, description, Icon }) => (
                <article key={title} className="bg-[var(--surface)] p-6 sm:p-8">
                  <Icon
                    className="mb-8 h-6 w-6 text-[var(--accent)]"
                    aria-hidden="true"
                  />
                  <h2 className="text-base font-bold">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
