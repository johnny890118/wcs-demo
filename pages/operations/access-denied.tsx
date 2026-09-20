import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { OperationsShell } from "../../components/platform/OperationsShell";
import { isOperationalAccess } from "../../src/application/access/operational-access";
import { loginDestination } from "../../src/ui/auth/login-routing";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";

export default function AccessDeniedPage() {
  const { t } = useLocale();
  return (
    <OperationsShell>
      <section className="mx-auto max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-panel)] sm:p-8">
        <ShieldExclamationIcon
          className="h-8 w-8 text-[var(--warning)]"
          aria-hidden="true"
        />
        <h1 className="mt-5 text-2xl font-black tracking-[-0.02em]">
          {t("accessDenied")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          {t("accessDeniedDescription")}
        </p>
        <Link
          href="/operations"
          className="ui-pressable mt-6 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--on-accent)]"
        >
          {t("returnToOperations")}
        </Link>
      </section>
    </OperationsShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || !isOperationalAccess(session.access)) {
    return {
      redirect: {
        destination: loginDestination("/operations"),
        permanent: false,
      },
    };
  }
  return { props: { session } };
};
