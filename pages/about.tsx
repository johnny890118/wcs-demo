import {
  ArrowsRightLeftIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { PublicHeader } from "../components/platform/PublicHeader";
import { PublicPageHead } from "../components/platform/PublicPageHead";
import { useLocale } from "../src/ui/i18n/locale-provider";
import { publicSiteUrl } from "../src/ui/seo/public-site";

type PublicPageProps = { siteOrigin: string };

export default function AboutPage({ siteOrigin }: PublicPageProps) {
  const { t } = useLocale();
  const principles = [
    {
      Icon: ArrowsRightLeftIcon,
      title: t("aboutModelTitle"),
      body: t("aboutModelBody"),
    },
    {
      Icon: CheckBadgeIcon,
      title: t("aboutEvidenceTitle"),
      body: t("aboutEvidenceBody"),
    },
    {
      Icon: ShieldCheckIcon,
      title: t("aboutSafetyTitle"),
      body: t("aboutSafetyBody"),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)]">
      <PublicPageHead
        title={t("aboutMetaTitle")}
        description={t("aboutIntro")}
        path="/about"
        siteOrigin={siteOrigin}
      />
      <PublicHeader />
      <main
        id="main-content"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {t("aboutEyebrow")}
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-[-0.035em] sm:text-6xl">
          {t("aboutTitle")}
        </h1>
        <p className="mt-7 max-w-3xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
          {t("aboutIntro")}
        </p>
        <section
          aria-labelledby="principles-title"
          className="mt-14 border-t border-[var(--border)] pt-10"
        >
          <h2 id="principles-title" className="text-sm font-bold">
            {t("designPrinciples")}
          </h2>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {principles.map(({ Icon, title, body }) => (
              <article
                key={title}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-panel)]"
              >
                <Icon
                  className="h-6 w-6 text-[var(--info)]"
                  aria-hidden="true"
                />
                <h3 className="mt-8 text-base font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </section>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/"
            className="ui-pressable rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-3 text-sm font-bold"
          >
            {t("backToPlatform")}
          </Link>
          <Link
            href="/contact"
            className="ui-pressable rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-bold text-[var(--on-accent)]"
          >
            {t("contactTeam")}
          </Link>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<
  PublicPageProps
> = async () => ({
  props: { siteOrigin: publicSiteUrl() },
});
