export function publicSiteUrl(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const configured = environment.PUBLIC_SITE_URL?.trim();
  if (!configured) {
    if (environment.NODE_ENV === "production") {
      throw new Error("PUBLIC_SITE_URL is required in production.");
    }
    return "http://localhost:3000";
  }

  const url = new URL(configured);
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("PUBLIC_SITE_URL must be a credential-free origin.");
  }
  if (
    environment.NODE_ENV === "production" &&
    url.protocol !== "https:" &&
    url.hostname !== "localhost" &&
    url.hostname !== "127.0.0.1"
  ) {
    throw new Error("PUBLIC_SITE_URL must use HTTPS in production.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("PUBLIC_SITE_URL must use HTTP or HTTPS.");
  }
  return url.origin;
}
