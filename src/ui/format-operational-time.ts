/** Stable server/browser presentation independent of ICU and local time zones. */
export function formatOperationalTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return `${date.toISOString().slice(0, 19).replace("T", " ")} UTC`;
}
