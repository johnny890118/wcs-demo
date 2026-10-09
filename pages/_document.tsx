import { Head, Html, Main, NextScript } from "next/document";

// Presentation-only preference: restore geometry before the first paint. Never
// use browser storage to establish warehouse, identity or command authority.
const navigationBootstrap = `try{document.documentElement.dataset.swpNavigation=localStorage.getItem('swp-navigation-collapsed')==='true'?'collapsed':'expanded'}catch{}`;

export default function Document() {
  return (
    <Html>
      <Head>
        <script dangerouslySetInnerHTML={{ __html: navigationBootstrap }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
