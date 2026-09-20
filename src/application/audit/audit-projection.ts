export type AuditActorType = "user" | "service" | "system";

export type AuditEvidenceValue = string | number | boolean | string[];

export type AuditEventProjection = {
  eventId: string;
  correlationId: string;
  occurredAt: string;
  actor: {
    type: AuditActorType;
    id: string;
  };
  action: string;
  knownAction: boolean;
  resource: {
    type: string;
    id: string;
  };
  knownResource: boolean;
  evidence: Record<string, AuditEvidenceValue>;
};

export type AuditEventPage = {
  events: AuditEventProjection[];
  nextCursor: string | null;
};

export type AuditEventQuery = {
  cursor?: string;
  limit?: number;
  resourceType?: string;
  resourceId?: string;
  correlationId?: string;
};

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isAuditEventPage(value: unknown): value is AuditEventPage {
  if (!isStringRecord(value) || !Array.isArray(value.events)) return false;
  if (value.nextCursor !== null && typeof value.nextCursor !== "string") {
    return false;
  }
  return value.events.every((event) => {
    if (!isStringRecord(event)) return false;
    const actor = event.actor;
    const resource = event.resource;
    const evidence = event.evidence;
    return (
      typeof event.eventId === "string" &&
      typeof event.correlationId === "string" &&
      typeof event.occurredAt === "string" &&
      typeof event.action === "string" &&
      typeof event.knownAction === "boolean" &&
      typeof event.knownResource === "boolean" &&
      isStringRecord(actor) &&
      ["user", "service", "system"].includes(String(actor.type)) &&
      typeof actor.id === "string" &&
      isStringRecord(resource) &&
      typeof resource.type === "string" &&
      typeof resource.id === "string" &&
      isStringRecord(evidence) &&
      Object.values(evidence).every(
        (item) =>
          ["string", "number", "boolean"].includes(typeof item) ||
          (Array.isArray(item) &&
            item.every((part) => typeof part === "string")),
      )
    );
  });
}
