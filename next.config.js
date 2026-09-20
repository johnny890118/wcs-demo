/** @type {import('next').NextConfig} */
const {
  noIndexHeaderSources,
} = require("./src/ui/navigation/frontend-surfaces");

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async redirects() {
    return [
      { source: "/platform", destination: "/", permanent: true },
      { source: "/fdp", destination: "/legacy/fdp", permanent: true },
      {
        source: "/engineeringMode",
        destination: "/legacy/engineering-mode",
        permanent: true,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value:
          "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'",
      },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      },
    ];
    const noIndexHeaders = noIndexHeaderSources.map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }));
    const apiRule = noIndexHeaders.find((rule) => rule.source === "/api/:path*");
    if (apiRule) {
      apiRule.headers.unshift({ key: "Cache-Control", value: "no-store" });
    }
    return [
      { source: "/(.*)", headers: securityHeaders },
      ...noIndexHeaders,
    ];
  },
};

module.exports = nextConfig;
