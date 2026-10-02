import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function fingerprintLoginIdentifier(
  identityProvider: string,
  identifier: string,
): string {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("NEXTAUTH_SECRET is required for login protection.");
  }
  const normalized = identifier
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en");
  return createHmac("sha256", secret)
    .update(identityProvider)
    .update("\0")
    .update(normalized)
    .digest("hex");
}

export function credentialsMatch(
  providedUsername: string,
  providedPassword: string,
  expectedUsername: string,
  expectedPassword: string,
): boolean {
  const usernameMatches = safeDigestEqual(providedUsername, expectedUsername);
  const passwordMatches = safeDigestEqual(providedPassword, expectedPassword);
  return usernameMatches && passwordMatches;
}

function safeDigestEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}
