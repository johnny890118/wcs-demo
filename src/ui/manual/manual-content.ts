import type { UserPermission } from "../../application/access/operational-access";
import type { Locale } from "../i18n/catalogs";
import { version as softwareVersion } from "../../../package.json";

export const manualVersion = "2026-10-05.1";
// Package release identity is distinct from the more granular manual revision.
export const manualSoftwareVersion = softwareVersion;
type Localized = Readonly<Record<Locale, string>>;
export type ManualArticle = Readonly<{
  id: string;
  title: Localized;
  paragraphs: readonly Localized[];
  links: readonly Readonly<{
    href: string;
    label: Localized;
    permission: UserPermission;
  }>[];
}>;
const text = (en: string, zh: string): Localized => ({ en, "zh-TW": zh });
const link = (
  href: string,
  en: string,
  zh: string,
  permission: UserPermission = "operations.view",
) => ({ href, label: text(en, zh), permission });

// Single content source for authenticated web guidance and subsequent PDF export.
// Describe shipped behavior; guidance never authorizes an operation.
export const manualArticles: readonly ManualArticle[] = [
  {
    id: "getting-started",
    title: text("Getting started and access", "開始使用與存取權限"),
    paragraphs: [
      text(
        "Sign in at your deployment's login page. Check the current warehouse and execution source before investigating work. Switching warehouse changes effective permissions and clears the previous workspace context.",
        "在所屬部署的登入頁登入。追查工作前，先確認目前倉庫與執行來源。切換倉庫會變更有效權限，並清除上一個工作區的情境。",
      ),
      text(
        "A role label is not authorization. Viewing requires operations.view; history requires audit.view. Receipt/order creation, transport execution and alarm response require separate permissions. Hidden or disabled controls do not replace backend checks.",
        "角色名稱不是授權依據。檢視需要 operations.view，歷史需要 audit.view；建立收貨／訂單、執行運輸與警報處理各有獨立權限。隱藏或停用控制不取代後端檢查。",
      ),
      text(
        "Expired or revoked sessions require sign-in again. Do not repeatedly submit a mutation after an uncertain response; inspect task and history evidence first. Production identity-provider integration and account administration are not complete product capabilities yet.",
        "Session 過期或撤銷後需重新登入。不確定回應時不要反覆送出修改，先檢查任務與歷史證據。正式 identity provider 整合與帳號管理尚不是完整產品能力。",
      ),
    ],
    links: [link("/operations", "Open Operations Home", "開啟營運首頁")],
  },
  {
    id: "daily-work",
    title: text("Daily work and task investigation", "日常工作與任務追查"),
    paragraphs: [
      text(
        "Start with attention items on Operations Home, then inspect the task queue and task detail. Read source/destination, recorded state, blocking reason and related alarms before technical identifiers.",
        "先查看營運首頁的待處理事項，再進入任務清單與詳情。優先閱讀來源／目的地、記錄狀態、阻擋原因及相關警報，再看技術識別碼。",
      ),
      text(
        "Task assignment records intended work, not physical movement. Unknown outcomes are unresolved, never success. The current queue is bounded; switch to All work and use Load more when a record is not visible. Text search is not provided in the task queue yet.",
        "任務指派記錄預定工作，不是實體移動。未知結果代表尚未解析，絕不是成功。目前清單有範圍上限；找不到紀錄時切換全部工作並使用載入更多。任務清單目前尚未提供文字搜尋。",
      ),
      text(
        "From task detail, Open this work opens its persisted receipt or order. Context links resolve the same task's load, stock, recorded endpoints, Live evidence, exception and permitted history on the server. Reopen or reload these URLs and use the visible Work/Task return links without remembering IDs or Browser Back. Recorded work state and task counts are not physical completion. Missing qualified evidence remains unresolved; history requires separate permission.",
        "從任務詳情選擇「開啟這筆工作」，查看對應的已保存單據。情境連結由伺服器解析同一任務的載貨、庫存、記錄端點、即時證據、異常與有權檢視的歷史。網址可直接開啟或重載，使用可見的工作／任務返回連結，不需記 ID 或瀏覽器返回。工作狀態與任務統計不等於實體完成；缺少合格證據仍未解析，歷史需要獨立權限。",
      ),
      text(
        "For shift operators, investigate work and freshness first; for exception responders, inspect alarms and affected tasks; for reviewers, follow permitted audit evidence. These are work paths, not hard-coded role grants.",
        "值班操作者先追查工作與新鮮度；例外處理人員追查警報與受影響任務；查核人員沿有權限的稽核證據檢查。這些是工作路徑，不是寫死的角色授權。",
      ),
      text(
        "Home attention links open the selected task or task-linked alarm evidence in task detail; equipment concerns open Live View. Missing bounded work context falls back to Tasks or Alarms, not proof that no work exists. Every destination checks current warehouse access again.",
        "首頁待處理事項會在任務詳情開啟所選任務或與任務相關的警報證據；設備問題開啟即時觀測。有範圍上限的工作情境缺少時導向任務或警報，不代表沒有工作存在。每個目的頁會重新檢查目前倉庫存取權限。",
      ),
    ],
    links: [
      link("/operations/tasks", "Open task queue", "開啟任務清單"),
      link("/operations/alarms", "Open alarms", "開啟警報"),
    ],
  },
  {
    id: "inbound-outbound",
    title: text("Inbound and outbound", "入庫與出庫"),
    paragraphs: [
      text(
        "Inbound: choose configured source/destination and enter item quantity, then create a receipt. Inspect its transport task and recorded route. Execution requires transport.execute and explicit confirmation; creation alone does not prove stock was stored.",
        "入庫：選擇已設定的來源／目的地並輸入品項數量，再建立收貨。檢查其運輸任務與記錄路徑。執行需要 transport.execute 與明確確認；建立收貨本身不代表庫存已入庫。",
      ),
      text(
        "Outbound: create an order and inspect its allocation and transport work. Available stock excludes reserved quantities; insufficient stock is a failure, not a partial success claim. Confirm execution only after reviewing warehouse, quantity and destination.",
        "出庫：建立訂單並檢查配置與運輸工作。可用庫存不包含已保留數量；庫存不足是失敗，不宣稱部分成功。確認倉庫、數量與目的地後才確認執行。",
      ),
      text(
        "Inventory changes follow accepted execution outcomes. A timeout, disconnected device or browser animation is not evidence of completion. Follow the task detail and permitted audit history when the outcome is unclear.",
        "庫存變更依據已接受的執行結果。逾時、設備斷線或瀏覽器動畫都不是完成證據。結果不清楚時追查任務詳情與有權限的稽核歷史。",
      ),
      text(
        "After creation, Open this work preserves the recorded job across navigation and reload. From Work, review a queued task to continue execution with a fresh confirmation and selected qualified equipment. Other task states require investigation, not blind resend. After any attempted execution, reopen Work to verify persisted outcome and remaining tasks. One completed task is not the whole job. Outbound SKU hints are bounded records, not reservation-adjusted availability; the backend decides allocation.",
        "建立後選擇「開啟這筆工作」，跨頁與重載仍保留已記錄案件。從工作檢查等待指派的任務，重新確認並選擇合格設備後續作。其他狀態須先調查，不可盲目重送。每次嘗試執行後，重新開啟工作確認持久化結果及剩餘任務；單一任務完成不等於整筆案件完成。出庫 SKU 提示是有上限的記錄，不是扣除保留後的可用量；配置由後端判定。",
      ),
    ],
    links: [
      link("/operations/inbound", "Open inbound", "開啟入庫"),
      link("/operations/outbound", "Open outbound", "開啟出庫"),
    ],
  },
  {
    id: "inventory",
    title: text("Inventory, loads and locations", "庫存、載具與庫位"),
    paragraphs: [
      text(
        "Inventory shows recorded stock and reservations. Loads show original received quantity separately from optional current stock. Missing inventory means not recorded, not zero; shipped historical stock has zero current balance.",
        "庫存呈現已記錄存量與保留量。載具將原收貨數量與可取得的目前庫存分列。缺少庫存是未記錄，不是零；已出庫的歷史存量目前餘額為零。",
      ),
      text(
        "Location status is configured, not a physical occupancy or safe-to-command guarantee. Recorded load/stock counts are rows, not mixed-SKU quantities or capacity. A readable location code is not a topology node ID; correlation requires an explicit active-version binding.",
        "庫位狀態是設定，不保證實體占用或可安全下令。載具／庫存筆數是紀錄列數，不是跨品項數量或容量。可讀庫位代碼不是拓撲節點 ID，關聯需要有效版本的明確綁定。",
      ),
      text(
        "Use literal search and load-more within the current warehouse. Related stock/load links use exact persisted load or location identity, not label search; the selected-record return link preserves that identity. Empty results do not prove physical absence. Clear the filter for the full warehouse list. These read-only workspaces do not provide configuration editing or stock adjustments.",
        "在目前倉庫使用文字搜尋與載入更多。相關庫存／載貨連結使用已保存的精確載貨或庫位 identity，不以標籤搜尋代替；返回原選取記錄的連結保留此 identity。空白不證明實體不存在，清除條件可回到全倉清單。這些唯讀工作區不提供設定編輯或庫存調整。",
      ),
    ],
    links: [
      link("/operations/inventory", "Open inventory", "開啟庫存"),
      link("/operations/loads", "Open loads", "開啟載具"),
      link("/operations/locations", "Open locations", "開啟庫位"),
    ],
  },
  {
    id: "live-view",
    title: text("Live View and trustworthy observations", "即時觀測與可信證據"),
    paragraphs: [
      text(
        "Current position requires active equipment, connected/good/current telemetry and the matching active topology version and node. Evidence expires after the server's received-observation window. The browser can only downgrade evidence, never establish current state.",
        "目前位置需要啟用設備、connected／good／current 遙測，以及符合啟用拓撲版本的節點。證據依後端收到觀測的有效時間窗過期。瀏覽器只能降級證據，不能建立目前狀態。",
      ),
      text(
        "Last-known means usable historical evidence, not ongoing movement. Unknown position means there is no usable qualified position. Reported work and assigned work are separate; unresolved task context does not prove equipment is idle.",
        "最後已知代表可用歷史證據，不是持續移動。位置未知代表沒有可用的合格位置。設備回報工作與系統指派工作分開；無法解析任務 context 不代表設備閒置。",
      ),
      text(
        "Live View is read-only and is not a calibrated physical floorplan or command authority. The topology inspector is an engineering diagram. Physical calibration, layout administration and commissioned hardware controls remain later capabilities.",
        "即時觀測是唯讀，並非已校準實體平面圖或命令授權。拓撲檢視是工程圖。實體校準、佈局管理與完成現場驗收的硬體控制仍是後續能力。",
      ),
      text(
        "A usable position reference identifies topology ID, revision and node; unknown positions have no reference. Configured diagram coordinate systems remain separate. Physical units, floor, coordinate frame and calibration are unrecorded: diagram X/Y/Z are not measured position, distance or safety evidence, and Z is not a floor number.",
        "可用位置 reference 指明拓撲 ID、版本與節點；未知位置沒有 reference。設定的工程圖座標系統保持分開。實體單位、樓層、座標框架與校準未記錄：工程圖 X／Y／Z 不是量測位置、距離或安全證據，Z 也不是樓層編號。",
      ),
    ],
    links: [
      link("/operations/warehouse", "Open Live View", "開啟即時觀測"),
      link(
        "/operations/warehouse/topology",
        "Open topology inspector",
        "開啟拓撲檢視",
      ),
    ],
  },
  {
    id: "exceptions",
    title: text("Alarms and unknown outcomes", "警報與未知結果"),
    paragraphs: [
      text(
        "Inspect the affected task and last trustworthy observation. Acknowledgement records awareness; it does not clear the underlying fault. Recovery requires its own permission, a strategy, a resolution note and explicit confirmation.",
        "檢查受影響任務與最後可信觀測。確認警報記錄已知悉，不會清除根本故障。復原需要獨立權限、策略、處置說明與明確確認。",
      ),
      text(
        "Resume or release only when the backend allows that recovery. Unknown command outcomes require reconciliation; do not infer success or repeatedly issue a new command. Safety interlocks and emergency stop remain independently authoritative equipment/site responsibilities.",
        "只有後端允許時才能繼續或釋放任務。未知命令結果需要 reconciliation；不要推測成功或反覆建立新命令。安全連鎖與緊急停止仍由獨立權威的設備／現場安全系統負責。",
      ),
      text(
        "No general-purpose manual override, automatic reset/replay or reconciliation editor is shipped yet. Preserve evidence and escalate unresolved divergence through your site's operating procedure; repository tests are not safety certification.",
        "目前尚未交付通用手動覆寫、自動 reset／replay 或 reconciliation 編輯器。保留證據，依現場作業程序升級處理未解差異；repository 測試不是安全認證。",
      ),
      text(
        "Inspect affected work in a new tab before confirming acknowledgement or recovery. An accepted recovery with an unknown outcome is still unresolved, not resumed or completed. An empty bounded alarm projection does not prove fault clearance; investigate task evidence when context is missing.",
        "確認警報或復原前，可在新分頁追查受影響工作。已接受但結果未知的復原仍未解析，不代表已繼續或完成。有範圍上限的警報投影為空不證明故障已解除；context 缺少時應追查任務證據。",
      ),
    ],
    links: [
      link("/operations/alarms", "Open alarm response", "開啟警報處理"),
      link("/operations/tasks", "Inspect affected work", "追查受影響工作"),
    ],
  },
  {
    id: "audit",
    title: text("Accountable history", "可歸責歷史"),
    paragraphs: [
      text(
        "With audit.view, inspect actor, action, resource and correlation evidence. Workflow links carry supported resource context; use history pagination to investigate older evidence. Sensitive fields are redacted and unknown actions remain explicitly unknown.",
        "具 audit.view 時檢查 actor、action、resource 與 correlation 證據。流程連結帶入支援的資源 context；使用歷史分頁追查較舊證據。敏感欄位會遮蔽，未知 action 仍明確標記未知。",
      ),
      text(
        "Audit history is not a full physical replay or proof that an unobserved movement occurred. Retention policy and reset preservation are governed separately; this screen cannot erase evidence or configure retention.",
        "稽核歷史不是完整實體 replay，也不證明未觀測到的移動發生。保留政策與 reset 證據保護另受治理；此畫面不能刪除證據或設定保留期限。",
      ),
    ],
    links: [
      link(
        "/operations/audit",
        "Open audit history",
        "開啟稽核歷史",
        "audit.view",
      ),
    ],
  },
  {
    id: "troubleshooting",
    title: text("Troubleshooting and terminology", "疑難排解與術語"),
    paragraphs: [
      text(
        "No results: check warehouse, search and bounded coverage before concluding no work exists. Unavailable or stale: retain last-known evidence, refresh and inspect connectivity; do not act on a frozen current label. Access denied: check effective warehouse permissions with your authorized administrator.",
        "沒有結果：先檢查倉庫、搜尋與範圍上限，再判斷沒有工作。不可用或過期：保留最後已知證據、重新整理並追查連線，不要依凍結的目前標示操作。存取被拒：與授權管理人員確認有效倉庫權限。",
      ),
      text(
        "Receipt: inbound business record. Order: outbound intent. Load: tracked carrier/content record. Inventory: persisted stock truth. Transport task: execution work. Topology: versioned connectivity. Observation: qualified equipment report, not inventory or authorization truth.",
        "收貨：入庫業務紀錄。訂單：出庫意圖。載具：受追蹤的載具／內容紀錄。庫存：持久化存量真相。運輸任務：執行工作。拓撲：版本化連通性。觀測：合格設備回報，不是庫存或授權真相。",
      ),
      text(
        "FAQ — Can I reset or replay here? Not yet. Can I edit warehouse/equipment configuration? Not yet. Does simulation prove production hardware safety? No; commissioned integration requires site-specific safety/security approval and failure drills.",
        "FAQ — 可以在這裡 reset 或 replay 嗎？尚未提供。可以編輯倉庫／設備設定嗎？尚未提供。Simulation 能證明正式硬體安全嗎？不能；現場整合需場域安全／資安核准與故障演練。",
      ),
    ],
    links: [
      link("/operations/projections", "Open read diagnostics", "開啟唯讀診斷"),
    ],
  },
];

export function normalizeManualSearch(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}
export function searchManual(
  query: unknown,
  locale: Locale,
): readonly ManualArticle[] {
  const needle = normalizeManualSearch(query).toLocaleLowerCase(locale);
  return manualArticles.filter(
    (article) =>
      !needle ||
      [article.title[locale], ...article.paragraphs.map((p) => p[locale])].some(
        (value) => value.toLocaleLowerCase(locale).includes(needle),
      ),
  );
}
export function manualTopic(value: unknown): string | null {
  return typeof value === "string" &&
    manualArticles.some((article) => article.id === value)
    ? value
    : null;
}
