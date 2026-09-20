const frontendSurfacePolicies = Object.freeze({
  public: Object.freeze({
    routes: ["/", "/about", "/contact", "/robots.txt", "/sitemap.xml"],
    indexable: true,
    authenticated: false,
  }),
  login: Object.freeze({
    routes: ["/login"],
    indexable: false,
    authenticated: false,
  }),
  operations: Object.freeze({
    prefix: "/operations",
    indexable: false,
    authenticated: true,
  }),
  api: Object.freeze({
    prefix: "/api",
    indexable: false,
    authenticated: "endpoint-specific",
  }),
  legacy: Object.freeze({
    prefix: "/legacy",
    indexable: false,
    authenticated: "legacy-specific",
  }),
});

const noIndexHeaderSources = Object.freeze([
  "/login",
  "/operations/:path*",
  "/legacy/:path*",
  "/api/:path*",
]);

function hasPathPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function classifyFrontendSurface(pathname) {
  if (frontendSurfacePolicies.public.routes.includes(pathname)) return "public";
  if (frontendSurfacePolicies.login.routes.includes(pathname)) return "login";
  if (hasPathPrefix(pathname, frontendSurfacePolicies.operations.prefix))
    return "operations";
  if (hasPathPrefix(pathname, frontendSurfacePolicies.api.prefix)) return "api";
  if (hasPathPrefix(pathname, frontendSurfacePolicies.legacy.prefix))
    return "legacy";
  return "unknown";
}

module.exports = {
  classifyFrontendSurface,
  frontendSurfacePolicies,
  noIndexHeaderSources,
};
