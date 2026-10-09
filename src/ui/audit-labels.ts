import {
  isKnownAuditAction,
  isKnownAuditResource,
  type AuditAction,
  type AuditResourceType,
} from "../application/audit/audit-vocabulary";
import type { Locale } from "./i18n/catalogs";

const actions: Record<AuditAction, readonly [string, string]> = {
  "access.login_succeeded": ["登入成功", "Signed in"],
  "access.logout": ["登出", "Signed out"],
  "access.session_revoked": ["登入工作階段已撤銷", "Session revoked"],
  "access_context.warehouse_entered": ["進入倉庫", "Entered warehouse"],
  "access_context.warehouse_left": ["離開倉庫", "Left warehouse"],
  "alarm.acknowledge": ["異常已確認", "Alarm acknowledged"],
  "inbound_receipt.create": ["建立入庫收貨單", "Inbound receipt created"],
  "outbound_order.allocate": ["出庫訂單配置", "Outbound order allocated"],
  "transport_task.assigned": ["運輸任務已指派", "Transport task assigned"],
  "transport_task.block_for_fault": [
    "運輸任務因故障阻擋",
    "Transport task blocked by fault",
  ],
  "transport_task.complete": ["運輸任務完成", "Transport task completed"],
  "transport_task.in_progress": [
    "運輸任務執行中",
    "Transport task in progress",
  ],
  "transport_task.mark_unknown": [
    "運輸任務結果未知",
    "Transport task outcome unknown",
  ],
  "transport_task.recover_release": [
    "運輸任務復原解除",
    "Transport task recovery release",
  ],
  "transport_task.recover_resume": [
    "運輸任務復原繼續",
    "Transport task recovery resume",
  ],
};

const resources: Record<AuditResourceType, readonly [string, string]> = {
  Alarm: ["異常", "Alarm"],
  InboundReceipt: ["入庫收貨單", "Inbound receipt"],
  OutboundOrder: ["出庫訂單", "Outbound order"],
  Principal: ["使用者", "Principal"],
  Session: ["登入工作階段", "Session"],
  TransportTask: ["運輸任務", "Transport task"],
  Warehouse: ["倉庫", "Warehouse"],
};

export function auditActionLabel(
  action: string,
  known: boolean,
  locale: Locale,
): string {
  if (!known || !isKnownAuditAction(action)) {
    return locale === "en"
      ? "Unrecognized recorded action"
      : "未識別的已記錄動作";
  }
  return actions[action][locale === "en" ? 1 : 0];
}

export function auditResourceLabel(type: string, locale: Locale): string {
  return isKnownAuditResource(type)
    ? resources[type][locale === "en" ? 1 : 0]
    : type;
}
