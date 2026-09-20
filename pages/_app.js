// pages/_app.js
import "../styles/globals.css";
import "../styles/for_index_test.css";
import "../styles/map.scss";
import "../styles/font.css";
import "../styles/animation.css";
import "@/styles/engineeringMode.css";
import { Ubuntu } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import Head from "next/head";
import { LocaleProvider } from "@/src/ui/i18n/locale-provider";
import { useRouter } from "next/router";
import { classifyFrontendSurface } from "@/src/ui/navigation/frontend-surfaces";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: "400",
});

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  const surface = classifyFrontendSurface(router.pathname);
  const page = <Component {...pageProps} />;
  const themedPage = (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LocaleProvider>{page}</LocaleProvider>
    </ThemeProvider>
  );
  const content =
    surface === "legacy" ? (
      <SessionProvider session={session}>{page}</SessionProvider>
    ) : surface === "login" || surface === "operations" ? (
      <SessionProvider session={session}>{themedPage}</SessionProvider>
    ) : (
      themedPage
    );

  return (
    <>
      <Head>
        <title>Smart Warehouse Platform</title>
        <meta
          name="description"
          content="Hardware-independent warehouse execution, deterministic simulation, and accountable inventory movement."
        />
        <link rel="icon" href="/female.png" />
      </Head>
      <div className={ubuntu.className}>{content}</div>
    </>
  );
}

export default MyApp;
