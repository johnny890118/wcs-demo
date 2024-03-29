// pages/_app.js
import "../styles/globals.css";
import "../styles/for_index_test.css";
import "../styles/map.scss";
import "../styles/font.css";
import "../styles/animation.css";
import "@/styles/engineeringMode.css";
import { Ubuntu } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import Head from "next/head";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: "400",
});

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <>
      <Head>
        <title>X&X派車系統</title>
        <link rel="icon" href="/female.png" />
      </Head>
      <main className={ubuntu.className}>
        <SessionProvider session={session}>
          <Component {...pageProps} />
        </SessionProvider>
      </main>
    </>
  );
}

export default MyApp;
