# Sakura House — Verified Code Fact Sheet (2026-05-22)

**Purpose:** Single source of truth for the Sakura docs restructuring pass. Every doc writer (subagent or primary session) must cite from this sheet, not from prior docs, memory, or Waratah analogy. Each fact below has a `file:line` citation traceable to actual code in `SAKURA HOUSE/`.

**Methodology:** Three parallel Explore agents read the codebase on 2026-05-22 with strict "cite or say NOT FOUND" instructions. No inference, no summary, no analogy. All `file:line` references below were verified before this sheet was written.

---

## 1. FIELD_CONFIG (RunSakura.gs:29-190)

**Total: 24 fields.**

| Field key | Suffix | Fallback cell | isFormula | Description |
|-----------|--------|---------------|-----------|-------------|
| date | SR_Date | B3:D3 | false | Report date |
| mod | SR_MOD | B4:D4 | false | Manager on Duty |
| fohStaff | SR_FOHStaff | B6:D6 | false | FOH staff on shift |
| bohStaff | SR_BOHStaff | B7:D7 | false | BOH staff on shift |
| cashCount | SR_CashCount | C10:E17 | false | Cash count breakdown |
| cashRecord | SR_CashRecord | C22:D23 | false | Cash record totals |
| pettyCashTransactions | SR_PettyCashTransactions | B40:B45 | false | Petty cash transactions |
| netRevenue | SR_NetRevenue | B54 | **true** | Net revenue (formula — never cleared) |
| shiftSummary | SR_ShiftSummary | A59:D59 | false | General overview |
| todoTasks | SR_TodoTasks | A69:A84 | false | TO-DO task descriptions |
| todoAssignees | SR_TodoAssignees | D69:D84 | false | TO-DO assignees |
| cashTips | SR_CashTips | C29 | false | Tips - cash |
| cardTips | SR_CardTips | C30 | false | Tips - card |
| surchargeTips | SR_SurchargeTips | C31 | false | Tips - surcharge |
| productionAmount | SR_ProductionAmount | B37 | false | Production amount (Lightspeed) |
| deposit | SR_Deposit | B38 | false | Deposit / non-Lightspeed revenue |
| discounts | SR_Discounts | B50 | false | Total discounts (Lightspeed) |
| guestsOfNote | SR_GuestsOfNote | A61:D61 | false | VIPs / regulars |
| goodNotes | SR_GoodNotes | A63:D63 | false | Positive feedback |
| issues | SR_Issues | A65:D65 | false | Issues / improvements |
| kitchenNotes | SR_KitchenNotes | A67:D67 | false | Kitchen notes |
| wastageComps | SR_WastageComps | A86:D86 | false | Wastage / comps / discounts |
| maintenance | SR_Maintenance | A88:D88 | false | Maintenance items |
| rsaIncidents | SR_RSAIncidents | A90:D90 | false | RSA / intoxication / refusals |

**Day prefix list:** `RunSakura.gs:23` — `VALID_DAY_PREFIXES = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"]` (6 days).

**Total named ranges:** 24 fields × 6 day prefixes = **144 named ranges** (e.g. `MONDAY_SR_NetRevenue`).

---

## 2. Warehouse Schemas (IntegrationHubSakura.gs)

### NIGHTLY_FINANCIAL — 16 cols A-P (lines 412-429)

| Col | Letter | Field | Source |
|-----|--------|-------|--------|
| 1 | A | Date | `toDateOnly_(shiftData.date)` |
| 2 | B | Day | `shiftData.dayOfWeek` |
| 3 | C | Week Ending | `toDateOnly_(shiftData.weekEnding)` |
| 4 | D | MOD | `shiftData.mod` |
| 5 | E | Net Revenue | `shiftData.netRevenue` |
| 6 | F | Cash Total | from C19 |
| 7 | G | Cash Tips | C29 |
| 8 | H | Tips Total | C32 |
| 9 | I | Logged At | `new Date()` |
| 10 | J | Production Amount | B37 |
| 11 | K | Discounts | B50 |
| 12 | L | Deposit | B38 |
| 13 | M | FOH Staff | B6 |
| 14 | N | BOH Staff | B7 |
| 15 | O | Card Tips | C30 |
| 16 | P | Surcharge Tips | C31 |

**No explicit row-length assertion** (unlike Waratah's `IntegrationHubWaratah.js:492`). Duplicate detection at `IntegrationHubSakura.gs:406` checks col 0 (Date) + col 3 (MOD).

### OPERATIONAL_EVENTS — 9 cols A-I (lines 448-458)

A=Date, B=Type, C=Item, D=Quantity, E=Value, F=Staff, G=Reason, H=Category, I=Source.

### WASTAGE_COMPS — 5 cols A-E (lines 473-479)

A=Date, B=Day, C=Week Ending, D=MOD, E=COMMENTS.

### QUALITATIVE_LOG — 11 cols A-K (lines 492-504)

A=Date, B=Day, C=MOD, D=Shift Summary, E=Guests of Note, F=The Good, G=The Bad / Issues, H=Kitchen Notes, I=Maintenance, J=RSA/Incidents, K=Logged At.

**Note:** Existing docs sometimes refer to this as `QUALITATIVE_NOTES`. Actual sheet name in code is `QUALITATIVE_LOG`.

### AI_INSIGHTS_LOG (AIInsightsSakura.gs:1037, 1041)

Auto-created in data warehouse on first write. Holds AI-generated shift summaries and anomaly detection output.

**Warehouse spreadsheet ID:** Script Property `SAKURA_DATA_WAREHOUSE_ID` (`IntegrationHubSakura.gs:25`).

---

## 3. Task Management (EnhancedTaskManagement_Sakura.gs)

### Statuses — 9 total (lines 160-182)

`STATUSES = { NEW, TODO ("TO DO"), IN_PROGRESS ("IN PROGRESS"), TO_DISCUSS ("TO DISCUSS"), BLOCKED, DEFERRED, DONE, CANCELLED, RECURRING }`.

**RECURRING is a status, not a flag.** It appears in `STATUS_LIST` (line 173-181) and `ETM_ACTIVE_STATUSES` (line 217).

Recurrence frequency lives in a separate **Recurrence column (L)** with values: `["None","Weekly","Fortnightly","Monthly"]` (lines 268-273).

### Tasks sheet column layout (lines 115-153)

| Col | Letter | Field |
|-----|--------|-------|
| 1 | A | Priority |
| 2 | B | Status |
| 3 | C | Staff Allocated |
| 4 | D | Area |
| 5 | E | Description |
| 6 | F | Due Date |
| 7 | G | Date Created |
| 8 | H | Date Completed |
| 9 | I | Days Open |
| 10 | J | Blocker Notes |
| 11 | K | Source |
| 12 | L | Recurrence |
| 13 | M | Last Updated |
| 14 | N | Updated By |
| 15 | O | Notes |

**15 columns total.**

### Auto-escalation (lines 100, 848-924)

- **BLOCKED threshold:** 14 days (line 100: `blockedDaysBeforeEscalate: 14`)
- **Escalation target:** Evan (line 101: `escalateToName: "Evan"`)
- **No other automatic status-based escalation** exists.
- **Archive threshold:** 8 days for DONE/CANCELLED (line 106: `daysBeforeArchive: 8`) — note: this is archival, not escalation.

### Triggers

| Function | Schedule | Code line |
|----------|----------|-----------|
| `runDailyTaskMaintenance()` | Daily 7am | EnhancedTaskManagement_Sakura.gs:1250 |
| `sendWeeklyActiveTasksSummary()` | Monday 6am | EnhancedTaskManagement_Sakura.gs:1296 |
| `onTaskSheetEditWithAutoSort(e)` | onEdit (installable) | EnhancedTaskManagement_Sakura.gs:1135 |

Creator functions: `createDailyMaintenanceTrigger()` (line 1509), `createWeeklySummaryTrigger()` (line 1531), `createOnEditTrigger()` (line 1553).

### Weekly active task summary delivery

- Posts to **managers channel only** (line 1298, via `_sendWeeklyActiveTasksSummaryCore(getManagersChannelWebhook_(), false)`).
- DMs **disabled** May 2026 (inline comment line 1427-1428).
- Webhook: `SLACK_MANAGERS_CHANNEL_WEBHOOK` (line 62).

### STAFF_LIST (lines 275-288)

12 entries: Evan, Nick, Gooch, Cynthia, Adam, Ian, FOH Team, Bar Team, Kitchen Team, All, Contractor, General Management.

---

## 4. Weekly Rollover (WeeklyRolloverInPlace.gs)

- **Handler:** `performInPlaceRollover()` (line 1019 — referenced)
- **Schedule:** Monday 10:00 AM Australia/Sydney (lines 1025-1030: `onWeekDay(MONDAY).atHour(10).nearMinute(0)`)
- **CLEARABLE_FIELDS:** 22 of 24 FIELD_CONFIG keys (lines 81-90). Excludes `netRevenue` (formula).
- **Trigger create:** `createRolloverTrigger_Sakura()` (line 1025)
- **Archive folder:** Script Property `ARCHIVE_ROOT_FOLDER_ID` (line 52)
- **Working file ID:** Script Property `SAKURA_WORKING_FILE_ID` (line 48)

---

## 5. Menu Structure (MenuSakura.gs — 28 handlers, lines 120-166)

Top level: **Shift Report**. Two top items + four admin submenus:

- Top: Send Nightly Report (line 120), Send Test Report (line 121)
- Admin > Weekly Digest (3 items, lines 129-132)
- Admin > Weekly Rollover (7 items, lines 135-141)
- Admin > Integrations & Analytics (4 items, lines 144-148) — includes `Rebuild All Dashboards (Admin)` → `pw_rebuildAllDashboards` (line 148)
- Admin > Data Warehouse (2 items, lines 151-152)
- Admin > Set Up & Diagnostics (12 items, lines 155-166) — includes Sheet Protection sub-submenu

**No `Send Overdue Summary Now` or `Create Overdue Summary Trigger` handlers exist.** (Confirms April 2 removal.)

### Task Management menu (Menu_Updated_Sakura.gs)

- Slack: `Send Weekly Active Tasks (LIVE)` (line 175) → `protected_sendWeeklyActiveTasksSummary`
- Slack: `Send Weekly Active Tasks (TEST to Evan)` (line 176) → `protected_sendWeeklyActiveTasksSummary_Test`
- Daily maintenance: `protected_runDailyTaskMaintenance` (line 138)

---

## 6. Nightly Send Pipeline (NightlyExportSakura.gs)

**Entry:** `exportAndEmailPDF()` (line 278). Test variant: `exportAndEmailPDF_TestToSelf()` (line 333).

**Order of integrations (LIVE path):**

1. `runIntegrations(sheetName)` — line 159 (orchestrator → warehouse log + AI insights)
2. `buildTodoAggregationSheet_(spreadsheet)` — line 214
3. `postToSlackFromSheet_(...)` — line 220 (LIVE webhook)
4. `pushTodosToActionables(sheet, sheetName)` — line 229

TEST path: only step 3, with TEST webhook (line 127).

---

## 7. Analytics Dashboards (AnalyticsDashboardSakura.gs)

**Functions:**
- `buildFinancialDashboard()` (line 56) → writes to `ANALYTICS` sheet (config line 28)
- `buildExecutiveDashboard()` (line 366) → writes to `EXECUTIVE_DASHBOARD` sheet (config line 29)

**ANALYTICS sheet row layout (post-Apr 2 cleanup):**
- Row 1: header (line 90)
- Row 4: THIS WEEK hero card (line 115)
- Row 11: WEEK-OVER-WEEK section header (line 158)
- Row 21: DAY-OF-WEEK AVERAGES section header (line 208)
- Row 30: AVERAGE WEEKLY (ALL WEEKS) section header (line 241)

**EXECUTIVE_DASHBOARD row layout:**
- Row 1: header (line 399)
- Row 4: CURRENT MONTH hero card (line 422)
- Row 10: MONTHLY TREND (line 524)
- Row 26: ROLLING 4-WEEK COMPARISON (line 554)
- Row 37: THIS WEEK vs 13W BASELINE (line 631)

**Design helpers (DashboardStyleSakura.gs):** `applyColumnWidths_`, `applyRowHeight_`, `applyHeroCard_`, `applyHairlineSection_`, `applyTableHeader_`, `applyTableBody_`, `applyDeltaCell_`.

---

## 8. AI Insights (AIInsightsSakura.gs)

**Entry-points:**
- `generateShiftSummary_Sakura()` (line 151)
- `detectRevenueAnomalies_Sakura()` (line 234)
- `classifyTask_Sakura()` (line 380)
- `computeShiftAnalytics_Sakura()` (line 478)
- `generateShiftInsight_Sakura()` (line 817)
- `deliverAIInsights_Sakura()` (line 968)
- `logInsightToWarehouse_Sakura()` (line 1031)

**API config:**
- Endpoint: `https://api.anthropic.com/v1/messages` (line 94)
- Model: `claude-haiku-4-5-20251001` (line 70)
- API version header: `2023-06-01` (line 87)

**Gating:** Script Property `AI_INSIGHTS_MODE` (line 969) — values `live` or `evan_only` (default). Feature is shipped; mode controls delivery routing, not enable/disable.

**Delivery (`evan_only` mode):** email to `AI_INSIGHTS_EVAN_EMAIL` (line 979) or Slack `SAKURA_SLACK_WEBHOOK_TEST` (line 997).

---

## 9. Weekly Revenue Digest (WeeklyDigestSakura.gs)

- Entry: `sendWeeklyRevenueDigest_Sakura()` (line 18)
- Trigger create: `setupWeeklyDigestTrigger_Sakura()` (line 294) — Monday 8am (lines 301-302)
- Slack only — uses `SAKURA_SLACK_WEBHOOK_LIVE` (resolved via `getSakuraSlackWebhookLive_()`, NightlyExportSakura.gs:23-26)

---

## 10. Task Integration (TaskIntegrationSakura.gs)

- Push function: `pushTodosToActionables()` (line 60)
- Reads from named ranges `todoTasks` (A69:A84) and `todoAssignees` (D69:D84) (lines 63-64)
- Task spreadsheet ID: Script Property `TASK_MANAGEMENT_SPREADSHEET_ID` (line 21)

---

## 11. UI Server (UIServerSakura.gs — shift report side)

**HTML served:** `rollover-wizard` (line 22), `export-dashboard` (line 29), `analytics-viewer` (line 34).

**RPC-callable functions:**
- `getRolloverPreview()` (line 47)
- `executeRollover()` (line 120)
- `getExportStatus()` (line 147)
- `runExportLive()` (line 179)
- `runExportTest()` (line 191)
- `getAnalyticsData()` (line 209)
- `refreshDashboard()` (line 257)
- `closeDialog()` (line 273)

---

## 12. Venue Config (VenueConfigSakura.gs — shift report side)

- Operating days (line 38): `['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']` — **6 days, closed Sunday**
- Timezone (line 74): `Australia/Sydney`
- No FOH/BOH role constants here; valid areas defined in `AIInsightsSakura.gs:418` as `['FOH','BOH','Kitchen','Management','General']`

---

## 13. Script Properties — Complete Inventory

### Shift Report side (14 keys)

| Key | File:line | Purpose |
|-----|-----------|---------|
| `SAKURA_DATA_WAREHOUSE_ID` | IntegrationHubSakura.gs:25 | Warehouse spreadsheet ID |
| `SHEET_PROTECTION_OWNER_EMAIL` | RunSakura.gs:681 | Sheet protection ACL owner |
| `SAKURA_SLACK_WEBHOOK_LIVE` | NightlyExportSakura.gs:24 | LIVE Slack webhook |
| `SAKURA_SLACK_WEBHOOK_TEST` | NightlyExportSakura.gs:33 | TEST Slack webhook |
| `SAKURA_EMAIL_RECIPIENTS` | NightlyExportSakura.gs:42 | JSON email recipient map |
| `VENUE_NAME` | VenueConfigSakura.gs:23 | Venue identifier ("SAKURA") |
| `ANTHROPIC_API_KEY` | AIInsightsSakura.gs:153 | Claude API key |
| `MENU_PASSWORD` | MenuSakura.gs:18 | Admin menu password |
| `SAKURA_WORKING_FILE_ID` | WeeklyRolloverInPlace.gs:48 | Working file ID |
| `ARCHIVE_ROOT_FOLDER_ID` | WeeklyRolloverInPlace.gs:52 | Archive folder ID |
| `INTEGRATION_ALERT_EMAIL_PRIMARY` | WeeklyRolloverInPlace.gs:69 | Alert email (Evan) |
| `AI_INSIGHTS_MODE` | AIInsightsSakura.gs:969 | `live` or `evan_only` |
| `AI_INSIGHTS_EVAN_EMAIL` | AIInsightsSakura.gs:979 | AI insights routing email |
| `TASK_MANAGEMENT_SPREADSHEET_ID` | TaskIntegrationSakura.gs:21 | Sakura Actionables Sheet ID |

### Task Management side (9 keys)

| Key | File:line | Purpose |
|-----|-----------|---------|
| `TASK_MANAGEMENT_SPREADSHEET_ID` | EnhancedTaskManagement_Sakura.gs:35 | Tasks spreadsheet ID |
| `ESCALATION_EMAIL` | EnhancedTaskManagement_Sakura.gs:44 | BLOCKED escalation email |
| `ESCALATION_SLACK_WEBHOOK` | EnhancedTaskManagement_Sakura.gs:53 | Escalation Slack DM (Evan) |
| `SLACK_MANAGERS_CHANNEL_WEBHOOK` | EnhancedTaskManagement_Sakura.gs:62 | Managers channel |
| `SLACK_DM_WEBHOOKS` | EnhancedTaskManagement_Sakura.gs:71 | JSON staff→DM webhook map |
| `MENU_PASSWORD` | Menu_Updated_Sakura.gs:17 | Admin menu password |
| `SAKURA_DATA_WAREHOUSE_ID` | SlackBlockKitSAKURA.gs:164 | Warehouse spreadsheet ID |
| `SAKURA_SLACK_WEBHOOK_TEST` | SlackBlockKitSAKURA.gs:137, TaskDashboard_Sakura.gs:584 | TEST webhook |
| `VENUE_NAME` | VenueConfigSakura.gs:23 (task-mgmt side) | Venue identifier |

---

## 14. Existing Stale References (require correction in migrated docs)

1. `SAKURA HOUSE/FILE EXPLAINERS/2_TASK_MANAGEMENT.md` — describes 8 statuses. Reality: 9.
2. `SAKURA HOUSE/FILE EXPLAINERS/4_TROUBLESHOOTING.md` — references "Send Overdue Summary Now" and "Create Overdue Summary Trigger" menu items. They no longer exist.
3. `SAKURA HOUSE/FILE EXPLAINERS/1_DAILY_SHIFT_REPORT.md` — describes AI insights as "soft launch". Reality: shipped, gated by `AI_INSIGHTS_MODE` Script Property.
4. `CLAUDE_SAKURA.md` and `CLAUDE_SHARED.md` — may both reference 8-status workflow. Update during the docs migration commit.
5. Sheet name `QUALITATIVE_NOTES` appears in some docs. Actual code name is `QUALITATIVE_LOG`.

---

**Use this sheet exclusively. If a fact you need is not here, grep the code and add it before writing — do not invent.**
