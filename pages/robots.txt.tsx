import type { GetServerSideProps } from "next";
import { publicSiteUrl } from "../src/ui/seo/public-site";

export default function RobotsTxt() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /login",
    "Disallow: /operations",
    "Disallow: /legacy",
    "Disallow: /api",
    `Sitemap: ${publicSiteUrl()}/sitemap.xml`,
    "",
  ].join("\n");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400",
  );
  res.write(body);
  res.end();
  return { props: {} };
};
