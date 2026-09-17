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

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: "400",
});

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <>
      <Head>
        <title>Warehouse OS</title>
        <meta
          name="description"
          content="Hardware-independent warehouse execution, deterministic simulation, and accountable inventory movement."
        />
        <link rel="icon" href="/female.png" />
      </Head>
      <div className={ubuntu.className}>
        <SessionProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <LocaleProvider>
              <Component {...pageProps} />
            </LocaleProvider>
          </ThemeProvider>
        </SessionProvider>
      </div>
    </>
  );
}

export default MyApp;
