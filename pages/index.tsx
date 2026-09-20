import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { PublicPageHead } from "../components/platform/PublicPageHead";
import { PublicHeader } from "../components/platform/PublicHeader";
import { useLocale } from "../src/ui/i18n/locale-provider";
import { publicSiteUrl } from "../src/ui/seo/public-site";
import { authOptions } from "./api/auth/[...nextauth]";
import {
  isOperationalAccess,
  isOperationalRuntime,
} from "../src/application/access/operational-access";

type SystemEntryProps = { siteOrigin: string; entryHref: string };

export default function PlatformPage({
  siteOrigin,
  entryHref,
}: SystemEntryProps) {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)]">
      <PublicPageHead
        title={t("platformMetaTitle")}
        description={t("productTagline")}
        path="/"
        siteOrigin={siteOrigin}
      />
      <PublicHeader />
      <main
        id="main-content"
        className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl place-items-center px-4 py-16 sm:px-6 lg:px-8"
      >
        <section className="w-full max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            {t("operations")}
          </p>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-6xl">
            {t("brand")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
            {t("productTagline")}
          </p>
          <Link
            href={entryHref}
            className="ui-pressable mt-9 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[var(--on-accent)] shadow-sm"
          >
            {t("enterSystem")}
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<SystemEntryProps> = async (
  context,
) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  return {
    props: {
      siteOrigin: publicSiteUrl(),
      entryHref:
        session &&
        isOperationalAccess(session.access) &&
        isOperationalRuntime(session.runtime)
          ? "/operations"
          : "/login",
    },
  };
};
