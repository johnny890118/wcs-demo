import type { GetServerSideProps } from "next";
import { publicSiteUrl } from "../src/ui/seo/public-site";

export default function SitemapXml() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const origin = publicSiteUrl();
  const locations = ["/platform", "/about", "/contact"]
    .map((path) => `  <url><loc>${origin}${path}</loc></url>`)
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locations}\n</urlset>\n`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400",
  );
  res.write(body);
  res.end();
  return { props: {} };
};
