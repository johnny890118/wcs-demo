import Head from "next/head";

export function PublicPageHead({
  title,
  description,
  path,
  siteOrigin,
}: {
  title: string;
  description: string;
  path: string;
  siteOrigin: string;
}) {
  const canonical = new URL(path, `${siteOrigin}/`).toString();
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} key="product-og-title" />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary" />
    </Head>
  );
}
