/** Read-cache partition/deadline metadata, never command authorization. */
export type ReadProjectionAuthority = Readonly<{
  scopeKey: string;
  validUntil: number;
}>;
export function isReadProjectionAuthority(
  value: unknown,
): value is ReadProjectionAuthority {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as ReadProjectionAuthority;
  return (
    typeof item.scopeKey === "string" &&
    /^[a-f0-9]{64}$/.test(item.scopeKey) &&
    Number.isSafeInteger(item.validUntil) &&
    item.validUntil > 0
  );
}
