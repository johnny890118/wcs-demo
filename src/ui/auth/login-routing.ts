const OPERATIONS_PATH = /^\/operations(?:\/|$)/;
const PUBLIC_AUTH_DESTINATIONS = new Set(["/"]);

function firstQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function safeOperationsCallback(
  candidate: string | string[] | undefined,
  applicationOrigin: string,
): string {
  const fallback = "/operations";
  const value = firstQueryValue(candidate);
  if (!value) return fallback;

  try {
    const origin = new URL(applicationOrigin).origin;
    const destination = new URL(value, `${origin}/`);
    if (
      destination.origin !== origin ||
      destination.username ||
      destination.password ||
      !OPERATIONS_PATH.test(destination.pathname)
    ) {
      return fallback;
    }
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}

export function absoluteOperationsCallback(
  candidate: string | string[] | undefined,
  applicationOrigin: string,
): string {
  return new URL(
    safeOperationsCallback(candidate, applicationOrigin),
    `${new URL(applicationOrigin).origin}/`,
  ).toString();
}

export function absoluteAuthRedirect(
  candidate: string | string[] | undefined,
  applicationOrigin: string,
): string {
  const origin = new URL(applicationOrigin).origin;
  const value = firstQueryValue(candidate);
  if (!value) return new URL("/operations", `${origin}/`).toString();
  try {
    const destination = new URL(value, `${origin}/`);
    const allowedPath =
      OPERATIONS_PATH.test(destination.pathname) ||
      PUBLIC_AUTH_DESTINATIONS.has(destination.pathname);
    if (
      destination.origin !== origin ||
      destination.username ||
      destination.password ||
      !allowedPath
    ) {
      return new URL("/operations", `${origin}/`).toString();
    }
    return destination.toString();
  } catch {
    return new URL("/operations", `${origin}/`).toString();
  }
}

export function loginDestination(destination: string): string {
  return `/login?callbackUrl=${encodeURIComponent(destination)}`;
}
