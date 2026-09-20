import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { signIn } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { LocaleControl } from "../components/platform/LocaleControl";
import { ThemeControl } from "../components/platform/ThemeControl";
import { safeOperationsCallback } from "../src/ui/auth/login-routing";
import { useLocale } from "../src/ui/i18n/locale-provider";
import { authOptions } from "./api/auth/[...nextauth]";

type LoginPageProps = { callbackUrl: string };

export default function LoginPage({ callbackUrl }: LoginPageProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      username: String(form.get("username") ?? ""),
      password: String(form.get("password") ?? ""),
      callbackUrl,
      redirect: false,
    });
    if (!result?.ok) {
      setPending(false);
      setError(true);
      return;
    }
    await router.replace(callbackUrl);
  }

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)]">
      <Head>
        <title>{t("loginMetaTitle")}</title>
        <meta name="description" content={t("loginDescription")} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <a
        href="#main-content"
        className="absolute left-3 top-3 z-50 -translate-y-20 rounded-md bg-[var(--text)] px-3 py-2 text-sm font-semibold text-[var(--surface)] focus:translate-y-0"
      >
        {t("skipToContent")}
      </a>
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label={t("brand")}
            className="ui-pressable flex items-center gap-3 rounded-lg"
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent)] text-sm font-black text-[var(--on-accent)]"
              aria-hidden="true"
            >
              S
            </span>
            <span className="hidden text-sm font-bold tracking-tight sm:inline">
              {t("brand")}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LocaleControl />
            <ThemeControl />
          </div>
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:px-8"
      >
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            {t("protectedArea")}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
            {t("loginTitle")}
          </h1>
          <p className="mt-5 text-base leading-7 text-[var(--text-muted)]">
            {t("loginDescription")}
          </p>
          <p className="mt-5 text-sm leading-6 text-[var(--text-muted)]">
            {t("demoIdentityNotice")}
          </p>
        </div>
        <form
          onSubmit={(event) => void submit(event)}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-panel)] sm:p-8"
        >
          <div>
            <label htmlFor="username" className="text-sm font-bold">
              {t("username")}
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="mt-2 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]"
            />
          </div>
          <div className="mt-5">
            <label htmlFor="password" className="text-sm font-bold">
              {t("passwordLabel")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]"
            />
          </div>
          <p role="alert" className="mt-4 min-h-6 text-sm text-[var(--danger)]">
            {error ? t("invalidCredentials") : ""}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="ui-pressable mt-2 inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-bold text-[var(--on-accent)] disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? t("signingIn") : t("signIn")}
          </button>
          <Link
            href="/"
            className="ui-pressable mt-5 inline-flex rounded-sm text-sm font-semibold text-[var(--text-muted)]"
          >
            {t("backToPlatform")}
          </Link>
        </form>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<LoginPageProps> = async (
  context,
) => {
  const origin =
    process.env.NEXTAUTH_URL ??
    `http://${context.req.headers.host ?? "localhost:3000"}`;
  const callbackUrl = safeOperationsCallback(context.query.callbackUrl, origin);
  const session = await getServerSession(context.req, context.res, authOptions);
  if (session) {
    return { redirect: { destination: callbackUrl, permanent: false } };
  }
  return { props: { callbackUrl } };
};
