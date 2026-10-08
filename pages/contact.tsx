import Link from "next/link";
import type { GetServerSideProps } from "next";
import { PublicHeader } from "../components/platform/PublicHeader";
import { PublicPageHead } from "../components/platform/PublicPageHead";
import { useLocale } from "../src/ui/i18n/locale-provider";
import { publicSiteUrl } from "../src/ui/seo/public-site";

const contactEmail = "johnny0929560027@gmail.com";

type PublicPageProps = { siteOrigin: string };

export default function ContactPage({ siteOrigin }: PublicPageProps) {
  const { t } = useLocale();
  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)]">
      <PublicPageHead
        title={t("contactMetaTitle")}
        description={t("contactIntro")}
        path="/contact"
        siteOrigin={siteOrigin}
      />
      <PublicHeader />
      <main
        id="main-content"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {t("contactEyebrow")}
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-[-0.035em] sm:text-6xl">
          {t("contactTitle")}
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
          {t("contactIntro")}
        </p>
        <section
          aria-labelledby="project-contact"
          className="mt-12 max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-panel)] sm:p-8"
        >
          <h2 id="project-contact" className="text-lg font-bold">
            {t("projectContact")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            {t("projectContactBody")}
          </p>
          <a
            href={`mailto:${contactEmail}`}
            className="ui-pressable mt-7 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-bold text-[var(--on-accent)]"
          >
            {contactEmail}
          </a>
          <p className="mt-6 border-t border-[var(--border)] pt-6 text-sm leading-6 text-[var(--text-muted)]">
            {t("securityContactNotice")}
          </p>
        </section>
        <Link
          href="/"
          className="ui-pressable mt-10 inline-flex rounded-sm text-sm font-bold"
        >
          {t("backToPlatform")}
        </Link>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<
  PublicPageProps
> = async () => ({
  props: { siteOrigin: publicSiteUrl() },
});
