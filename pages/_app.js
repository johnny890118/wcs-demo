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
import {
  PRODUCT_NAME,
  PRODUCT_ICON,
  PRODUCT_ICON_PNG,
  PRODUCT_APP_ICON,
} from "@/src/ui/identity/product-identity";

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
        <title>
          {surface === "legacy"
            ? `Legacy reference | ${PRODUCT_NAME}`
            : PRODUCT_NAME}
        </title>
        <meta name="application-name" content={PRODUCT_NAME} />
        <meta name="apple-mobile-web-app-title" content={PRODUCT_NAME} />
        <meta property="og:site_name" content={PRODUCT_NAME} />
        <meta
          property="og:title"
          content={PRODUCT_NAME}
          key="product-og-title"
        />
        <meta
          name="description"
          content="Hardware-independent warehouse execution, deterministic simulation, and accountable inventory movement."
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={PRODUCT_ICON_PNG}
          key="product-png-icon"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          sizes="any"
          href={PRODUCT_ICON}
          key="product-svg-icon"
        />
        <link rel="apple-touch-icon" sizes="180x180" href={PRODUCT_APP_ICON} />
      </Head>
      <div className={ubuntu.className}>{content}</div>
    </>
  );
}

export default MyApp;
