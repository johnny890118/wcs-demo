import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { useState } from "react";
import { OperationsShell } from "../../components/platform/OperationsShell";
import {
  hasUserPermission,
  userPermissions,
  type UserPermission,
} from "../../src/application/access/operational-access";
import {
  manualTopic,
  manualVersion,
  manualSoftwareVersion,
  normalizeManualSearch,
  searchManual,
} from "../../src/ui/manual/manual-content";
import { operationalPageAccess } from "../../src/ui/auth/operational-page-access";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";

type Props = {
  permissions: readonly UserPermission[];
  warehouseId: string;
  query: string;
  topic: string | null;
};
export default function HelpPage(props: Props) {
  return (
    <HelpWorkspace
      key={`${props.warehouseId}:${props.query}:${props.topic ?? "all"}`}
      {...props}
    />
  );
}
function HelpWorkspace({ permissions, query, topic }: Props) {
  const { locale, t } = useLocale();
  const [search, setSearch] = useState(query);
  const results = searchManual(search, locale);
  const ordered =
    topic && !search
      ? [...results].sort(
          (a, b) => Number(b.id === topic) - Number(a.id === topic),
        )
      : results;
  return (
    <OperationsShell current="help">
      <h1 className="text-3xl font-black tracking-tight">{t("helpTitle")}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
        {t("helpDescription")}
      </p>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        {t("helpVersion")}: {manualVersion} · {t("helpSoftwareVersion")}:{" "}
        {manualSoftwareVersion}
      </p>
      <a
        href={`/api/operations/manual/${locale}`}
        className="ui-pressable ui-link mt-3 inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold"
      >
        {t("helpDownloadPdf")}
      </a>
      <label className="mt-6 block max-w-xl text-sm font-semibold">
        {t("helpSearch")}
        <input
          type="search"
          value={search}
          maxLength={120}
          onChange={(event) => setSearch(event.target.value.slice(0, 120))}
          className="mt-2 min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--text)]"
        />
      </label>
      <p role="status" className="mt-3 text-sm text-[var(--text-muted)]">
        {t("helpResults")}: {results.length}
      </p>
      {!results.length ? (
        <p className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          {t("helpNoResults")}
        </p>
      ) : (
        <>
          <nav
            aria-label={t("helpContents")}
            className="my-6 flex flex-wrap gap-2"
          >
            {ordered.map((article) => (
              <a
                key={article.id}
                href={`#${article.id}`}
                className="ui-pressable ui-link inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold"
              >
                {article.title[locale]}
              </a>
            ))}
          </nav>
          <div className="space-y-5">
            {ordered.map((article) => (
              <section
                key={article.id}
                id={article.id}
                aria-labelledby={`${article.id}-heading`}
                tabIndex={-1}
                className="scroll-mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <h2 id={`${article.id}-heading`} className="text-xl font-bold">
                  {article.title[locale]}
                </h2>
                <div className="mt-3 max-w-4xl space-y-3 text-sm leading-7 text-[var(--text-muted)]">
                  {article.paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph[locale]}</p>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {article.links
                    .filter((link) => permissions.includes(link.permission))
                    .map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="ui-pressable ui-link inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold"
                      >
                        {link.label[locale]}
                      </Link>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </OperationsShell>
  );
}
export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const access = operationalPageAccess(
    session,
    "operations.view",
    "/operations/help",
  );
  if (!access.allowed)
    return { redirect: { destination: access.destination, permanent: false } };
  return {
    props: {
      session,
      warehouseId: access.access.currentWarehouseId,
      permissions: userPermissions.filter((permission) =>
        hasUserPermission(access.access, permission),
      ),
      query: normalizeManualSearch(context.query.q),
      topic: manualTopic(context.query.topic),
    },
  };
};
