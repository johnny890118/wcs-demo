export const auditActions = [
  "alarm.acknowledge",
  "inbound_receipt.create",
  "outbound_order.allocate",
  "transport_task.assigned",
  "transport_task.block_for_fault",
  "transport_task.complete",
  "transport_task.in_progress",
  "transport_task.mark_unknown",
  "transport_task.recover_release",
  "transport_task.recover_resume",
] as const;

export type AuditAction = (typeof auditActions)[number];

export const auditResourceTypes = [
  "Alarm",
  "InboundReceipt",
  "OutboundOrder",
  "TransportTask",
] as const;

export type AuditResourceType = (typeof auditResourceTypes)[number];

export function isKnownAuditAction(action: string): action is AuditAction {
  return auditActions.includes(action as AuditAction);
}

export function isKnownAuditResource(
  resourceType: string,
): resourceType is AuditResourceType {
  return auditResourceTypes.includes(resourceType as AuditResourceType);
}
