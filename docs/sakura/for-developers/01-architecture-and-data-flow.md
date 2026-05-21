# Architecture and Data Flow

**Audience:** Developers and Claude AI agents who need to understand the Sakura House codebase before changing it.

This file is the canonical entry point to the Sakura technical reference. It covers the file inventory, dependency layering, module responsibilities, trigger inventory, and the key technical rules that the rest of the developer documentation builds on.

---

## 1. System Context

Sakura House is a 6-day operation (closed Sundays, `VenueConfigSakura.gs:38`). The codebase splits across two Apps Script projects (Shift Report and Task Management) sharing one git repository.

Relevant facts for developers:

- The Shift Report project uses **named ranges** for all day-tab cell access. `RunSakura.gs` holds `FIELD_CONFIG` with **24 fields** (`RunSakura.gs:29-190`); each field has a `suffix`, `fallback` A1 reference, `isFormula` flag, and `description`.
- The day prefix list is `["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"]` (`RunSakura.gs:23`). That gives **24 fields x 6 day prefixes = 144 named ranges** (e.g. `MONDAY_SR_NetRevenue`).
- Unlike Waratah, Sakura's `FIELD_CONFIG` retains live `fallback` A1 references that helpers consult when a named range is missing. The named range is authoritative; the fallback is a safety net for partially-set-up sheets.
- The weekly rollover happens **in place** on the working file. Tabs are not duplicated; cells are cleared (formula cells preserved) and dates re-rolled.
- Time-based triggers in Sakura's Apps Script project are not destroyed by `clasp push` in normal practice, but always verify the triggers panel post-deploy.

---

## 2. File Inventory

### Shift Report project: `SAKURA HOUSE/SHIFT REPORT SCRIPTS/`

| File | Lines | Role |
|---|---|---|
| `RunSakura.gs` | 952 | Named range infrastructure: `FIELD_CONFIG`, field read/write helpers, named-range diagnostics, setup helpers |
| `NightlyExportSakura.gs` | 664 | Nightly send entry point: `exportAndEmailPDF` (line 278), `exportAndEmailPDF_TestToSelf` (line 333), pre-send checklist dialog, orchestrates integrations, Slack, PDF, email |
| `IntegrationHubSakura.gs` | 996 | Data warehouse logging, validation, extraction helpers, integration alert pipeline |
| `TaskIntegrationSakura.gs` | 305 | `pushTodosToActionables` (line 60), pushes nightly TO-DOs into the Task Management spreadsheet |
| `WeeklyRolloverInPlace.gs` | 1087 | `performInPlaceRollover` (line 1019), Mon 10am in-place rollover; archive PDF, clear input cells, re-roll dates |
| `WeeklyDigestSakura.gs` | 310 | `sendWeeklyRevenueDigest_Sakura` (line 18), Mon 8am revenue digest to Slack |
| `AnalyticsDashboardSakura.gs` | 1167 | `buildFinancialDashboard` (line 56) and `buildExecutiveDashboard` (line 366); writes to `ANALYTICS` and `EXECUTIVE_DASHBOARD` sheets |
| `DashboardStyleSakura.gs` | 192 | Centralised dashboard design tokens and helpers: `applyHeroCard_`, `applyHairlineSection_`, `applyTableHeader_`, `applyTableBody_`, `applyDeltaCell_`, `applyColumnWidths_`, `applyRowHeight_` |
| `AIInsightsSakura.gs` | 1075 | Claude API integration (model `claude-haiku-4-5-20251001`, line 70). Entry points: `generateShiftSummary_Sakura` (151), `detectRevenueAnomalies_Sakura` (234), `classifyTask_Sakura` (380), `computeShiftAnalytics_Sakura` (478), `generateShiftInsight_Sakura` (817), `deliverAIInsights_Sakura` (968), `logInsightToWarehouse_Sakura` (1031). Gated by `AI_INSIGHTS_MODE` Script Property (`live` or `evan_only`, default `evan_only`) |
| `MenuSakura.gs` | 313 | Top-level Shift Report menu, password gating wrappers (`pw_*`) |
| `UIServerSakura.gs` | 347 | HTML dialog server for rollover wizard, export dashboard, analytics viewer |
| `VenueConfigSakura.gs` | 228 | Runtime venue config: 6-day operating days, `Australia/Sydney` timezone |
| `SlackBlockKitSakuraSR.gs` | 216 | Block Kit message builders for the nightly Slack post |
| `_SETUP_ScriptProperties_SakuraOnly.gs` | 435 | One-shot Script Properties setup helper. **Gitignored** (contains webhook secrets) |

**14 `.gs` files in the Shift Report project.**

### Task Management project: `SAKURA HOUSE/TASK MANAGEMENT SCRIPTS/`

| File | Lines | Role |
|---|---|---|
| `EnhancedTaskManagement_Sakura.gs` | 1781 | 9-status workflow, auto-escalation, recurring tasks, daily maintenance, weekly active task summary, audit log, trigger installers |
| `TaskDashboard_Sakura.gs` | 640 | Read-only task analytics dashboard builder |
| `Menu_Updated_Sakura.gs` | 212 | Task Management menu and password gating |
| `UIServerSakura.gs` | 122 | HTML dialog server for the task manager UI |
| `SlackActionablesPoster_Sakura.gs` | 212 | Slack posters for the actionables flow |
| `SlackBlockKitSAKURA.gs` | 216 | Block Kit builders for task DMs and channel posts |
| `VenueConfigSakura.gs` | 257 | Task-side venue config |
| `_SETUP_ScriptProperties_TaskMgmt_Sakura.gs` | 182 | One-shot Script Properties setup helper. **Gitignored** |

**8 `.gs` files in the Task Management project.**

Total Sakura code: **22 GAS files** across the two projects plus HTML templates served from `UIServerSakura.gs` in each project.

---

## 3. Layered Dependency Model

The Shift Report project is layered:

```
[Foundation]     RunSakura.gs / VenueConfigSakura.gs
                 (FIELD_CONFIG, named-range helpers, venue constants)
       |
[Service]        IntegrationHubSakura.gs, TaskIntegrationSakura.gs,
                 SlackBlockKitSakuraSR.gs, AIInsightsSakura.gs,
                 DashboardStyleSakura.gs
       |
[Application]    NightlyExportSakura.gs, WeeklyRolloverInPlace.gs,
                 WeeklyDigestSakura.gs, AnalyticsDashboardSakura.gs
       |
[Entry]          MenuSakura.gs + time-based triggers
       |
[UI dialogs]     UIServerSakura.gs + HTML templates
```

**Rule:** higher layers may import from lower; lower must not depend on higher. Adding a cross-layer import indicates a missing helper in the foundation layer.

For the cross-project flow:

```
Shift Report project --(TaskIntegrationSakura.gs)--> Task Management spreadsheet
Task Management project --(reads its own spreadsheet only)--> Task Management spreadsheet
```

There is no reverse arrow. The Task Management project does not call back into the Shift Report project.

---

## 4. Module Responsibilities

The most important modules in detail.

### `RunSakura.gs` (foundation)

Owns:
- `FIELD_CONFIG` (lines 29-190): 24-field map keyed by camelCase field name. Each entry has `suffix` (e.g. `SR_NetRevenue`), `fallback` (A1 reference such as `B54`), `isFormula`, and `description`.
- `VALID_DAY_PREFIXES` (line 23): the 6 operating-day prefixes.
- Field read and write helpers that resolve `${DAY_PREFIX}_${suffix}` named ranges first, then fall back to the A1 string if the named range is missing.
- Diagnostics: walk every field on every day sheet and report missing or wrongly-bound named ranges. Used by the admin menu to rebuild bindings after structural edits.

The `netRevenue` field is a formula (`isFormula: true`, fallback `B54`). The rollover excludes it from the clearable set; never type into B54.

### `IntegrationHubSakura.gs` (service)

Owns:
- Warehouse logging into the four warehouse sheets (see Section 5).
- Date helpers `parseCellDate_` and `toDateOnly_` (Apr 2 2026 locale fix).
- Duplicate detection: `isDuplicateInSheet_` checks date plus a discriminator column before writing (line 406 for the NIGHTLY_FINANCIAL check on col 0 + col 3).
- Validation and extraction helpers used by the nightly pipeline.

### `NightlyExportSakura.gs` (application)

Owns:
- `exportAndEmailPDF()` (line 278), LIVE menu entry; runs the pre-send checklist dialog, then the LIVE pipeline.
- `exportAndEmailPDF_TestToSelf()` (line 333), TEST variant; posts to `SAKURA_SLACK_WEBHOOK_TEST` and emails Evan only.
- Sequential pipeline calls (LIVE path): `runIntegrations(sheetName)` at line 159, `buildTodoAggregationSheet_(spreadsheet)` at line 214, `postToSlackFromSheet_(...)` at line 220, `pushTodosToActionables(sheet, sheetName)` at line 229.
- Webhook resolution helpers including `getSakuraSlackWebhookLive_()` (lines 23-26).

### `WeeklyRolloverInPlace.gs` (application)

Owns:
- `performInPlaceRollover()` (line 1019), Mon 10am handler. Archives the week's PDF, clears manager input cells across all 6 day tabs (formula cells preserved via the clearable-field derivation), re-rolls tab dates to the next week.
- `createRolloverTrigger_Sakura()` (line 1025), installs the Mon 10am time-based trigger (`onWeekDay(MONDAY).atHour(10).nearMinute(0)`).
- Reads `SAKURA_WORKING_FILE_ID` (line 48) and `ARCHIVE_ROOT_FOLDER_ID` (line 52) from Script Properties.

### `EnhancedTaskManagement_Sakura.gs` (task system, foundation + service + entry combined)

Owns the entire task system:
- **9 statuses** (lines 160-182): `NEW`, `TO DO`, `IN PROGRESS`, `TO DISCUSS`, `BLOCKED`, `DEFERRED`, `DONE`, `CANCELLED`, `RECURRING`. RECURRING is a status, not a flag; recurrence frequency lives in a separate column L with values `["None","Weekly","Fortnightly","Monthly"]` (lines 268-273).
- **15-column Tasks sheet layout** (lines 115-153): A Priority, B Status, C Staff Allocated, D Area, E Description, F Due Date, G Date Created, H Date Completed, I Days Open, J Blocker Notes, K Source, L Recurrence, M Last Updated, N Updated By, O Notes.
- Auto-escalation: BLOCKED tasks escalate to Evan after 14 days (lines 100-101). No other automatic status-based escalation exists. Archive threshold for DONE / CANCELLED is 8 days (line 106), archival, not escalation.
- 12-entry `STAFF_LIST` (lines 275-288): Evan, Nick, Gooch, Cynthia, Adam, Ian, FOH Team, Bar Team, Kitchen Team, All, Contractor, General Management.
- Trigger handlers and installers (see Section 6).

See [`06-task-management-internals.md`](06-task-management-internals.md) when written for the full breakdown.

---

## 5. Warehouse Schemas

All warehouse writes happen inside `IntegrationHubSakura.gs`. The warehouse spreadsheet ID is in Script Property `SAKURA_DATA_WAREHOUSE_ID` (line 25).

| Sheet | Cols | Range | Source lines |
|---|---|---|---|
| `NIGHTLY_FINANCIAL` | **16** | A-P | 412-429 |
| `OPERATIONAL_EVENTS` | **9** | A-I | 448-458 |
| `WASTAGE_COMPS` | **5** | A-E | 473-479 |
| `QUALITATIVE_LOG` | **11** | A-K | 492-504 |

`NIGHTLY_FINANCIAL` columns (A-P): Date, Day, Week Ending, MOD, Net Revenue, Cash Total, Cash Tips, Tips Total, Logged At, Production Amount, Discounts, Deposit, FOH Staff, BOH Staff, Card Tips, Surcharge Tips. Unlike the Waratah pipeline, there is no explicit row-length assertion; duplicate detection at line 406 keys on col 0 (Date) and col 3 (MOD).

`OPERATIONAL_EVENTS` columns (A-I): Date, Type, Item, Quantity, Value, Staff, Reason, Category, Source.

`WASTAGE_COMPS` columns (A-E): Date, Day, Week Ending, MOD, COMMENTS.

`QUALITATIVE_LOG` columns (A-K): Date, Day, MOD, Shift Summary, Guests of Note, The Good, The Bad / Issues, Kitchen Notes, Maintenance, RSA/Incidents, Logged At. **The sheet name in code is `QUALITATIVE_LOG`.** Some older docs refer to it as `QUALITATIVE_NOTES`; that name is incorrect.

A fifth warehouse sheet `AI_INSIGHTS_LOG` is auto-created on first write by `logInsightToWarehouse_Sakura` (`AIInsightsSakura.gs:1031, 1037, 1041`); it holds Claude-generated shift summaries and anomaly outputs.

---

## 6. Triggers

Sakura runs **4 time-based triggers + 1 on-edit trigger** when fully installed.

| Function | Schedule | Code line | Installer |
|---|---|---|---|
| `performInPlaceRollover` | Mon 10:00 AM | `WeeklyRolloverInPlace.gs:1019` | `createRolloverTrigger_Sakura()` line 1025 |
| `sendWeeklyRevenueDigest_Sakura` | Mon 08:00 AM | `WeeklyDigestSakura.gs:18` | `setupWeeklyDigestTrigger_Sakura()` line 294 |
| `runDailyTaskMaintenance` | Daily 07:00 AM | `EnhancedTaskManagement_Sakura.gs:1250` | `createDailyMaintenanceTrigger()` line 1509 |
| `sendWeeklyActiveTasksSummary` | Mon 06:00 AM | `EnhancedTaskManagement_Sakura.gs:1296` | `createWeeklySummaryTrigger()` line 1531 |
| `onTaskSheetEditWithAutoSort` | On any cell edit (installable) | `EnhancedTaskManagement_Sakura.gs:1135` | `createOnEditTrigger()` line 1553 |

All schedules are Australia/Sydney.

`sendWeeklyActiveTasksSummary` posts to the **managers channel only** (line 1298, via `_sendWeeklyActiveTasksSummaryCore(getManagersChannelWebhook_(), false)`). DMs were disabled in May 2026; the inline comment at lines 1427-1428 documents the change. The managers webhook is `SLACK_MANAGERS_CHANNEL_WEBHOOK` (line 62).

---

## 7. Nightly Send Pipeline, Step by Step

When the MOD opens the Shift Report menu and clicks Send Nightly Report, `exportAndEmailPDF()` runs the pre-send checklist dialog, then the LIVE pipeline. Steps below are in execution order as called by `exportAndEmailPDF`.

```
1. runIntegrations(sheetName)               NightlyExportSakura.gs:159
   - Extract every field via FIELD_CONFIG (named ranges first, A1 fallback otherwise)
   - Validate required fields (date, MOD, netRevenue)
   - Log to warehouse: NIGHTLY_FINANCIAL (16 cols), OPERATIONAL_EVENTS (9),
                       WASTAGE_COMPS (5), QUALITATIVE_LOG (11).
     All dates wrapped in toDateOnly_() before appendRow.
   - Optionally invoke AI Insights (gated by AI_INSIGHTS_MODE) and
     write to AI_INSIGHTS_LOG.

2. buildTodoAggregationSheet_(spreadsheet)   NightlyExportSakura.gs:214
   - Aggregate the day's TO-DOs into a single sheet for downstream consumers.

3. postToSlackFromSheet_(...)                NightlyExportSakura.gs:220
   - Build Block Kit blocks via SlackBlockKitSakuraSR.gs.
   - LIVE path posts to SAKURA_SLACK_WEBHOOK_LIVE.
   - TEST path (exportAndEmailPDF_TestToSelf) posts to SAKURA_SLACK_WEBHOOK_TEST.

4. pushTodosToActionables(sheet, sheetName)  NightlyExportSakura.gs:229
   - Reads named ranges todoTasks (A69:A84) and todoAssignees (D69:D84).
   - Writes new task rows into the Task Management spreadsheet
     (Script Property TASK_MANAGEMENT_SPREADSHEET_ID).

5. PDF export and Gmail send
   - Generate PDF via UrlFetchApp against the spreadsheet export URL.
   - GmailApp.sendEmail to recipients loaded from SAKURA_EMAIL_RECIPIENTS.
```

The TEST path runs only step 3 with the TEST webhook (line 127) and emails Evan only. Steps 1, 2, 4, and 5 are LIVE-only.

The pre-send checklist dialog blocks the pipeline on user-confirmed errors before any of these steps run. Warehouse writes are duplicate-prevented at step 1 via `isDuplicateInSheet_`.

See [`03-integration-pipeline.md`](03-integration-pipeline.md) when written for the code-level walkthrough.

---

## 8. Weekly Rollover, Step by Step

The Mon 10am `performInPlaceRollover()` runs against the working file (Script Property `SAKURA_WORKING_FILE_ID`). The rollover is **in place**: tabs are not duplicated, the same working file rolls week over week.

```
1. Validate preconditions (working file accessible, tabs present).
2. Generate the week summary and export the weekly PDF to the
   archive folder (Script Property ARCHIVE_ROOT_FOLDER_ID).
3. Clear all clearable fields on each of the 6 day tabs.
   - The clearable set is derived from FIELD_CONFIG by filtering
     isFormula === false. netRevenue (B54) is excluded because it is
     a formula; clearing it would erase the formula.
   - Uses Range.clearContent() (singular), never Sheet.clear().
4. Update each tab's date to the next week's corresponding day.
5. Email rollover summary and post Slack confirmation.
6. Alert INTEGRATION_ALERT_EMAIL_PRIMARY (Evan) on failure.
```

See [`05-rollover-and-triggers.md`](05-rollover-and-triggers.md) when written for the internals of each step.

---

## 9. Key Technical Rules

These rules have either burned the project before or are subtle enough that they warrant explicit statement.

### Rule 1: `sheet.clear()` is forbidden

`Sheet.clear()` destroys formatting, validation, conditional formatting, and notes. Never call it.

Safe alternatives:
- `Range.clearContent()` (singular) on a Range, for clearing cell values only.
- `Sheet.clearContents()` (plural) on a Sheet, for clearing all values without losing formatting.
- `sheet.clearContent()` (singular, on Sheet) **does not exist**. Calling it raises a TypeError.

Lint before any commit: `grep -n "\.clear(" *.gs`.

### Rule 2: `SpreadsheetApp.getUi()` throws in trigger context

If a function may run from a time-based trigger, every `getUi().alert(...)` call must be wrapped in try / catch. Otherwise the trigger fails silently and the work aborts.

Functions that are both menu-callable AND trigger-fired: `performInPlaceRollover`, `sendWeeklyRevenueDigest_Sakura`, `runDailyTaskMaintenance`, `sendWeeklyActiveTasksSummary`, and any `pw_*` wrappers installed as triggers (do not install `pw_*` wrappers as triggers, see Rule 8).

### Rule 3: Named ranges are authoritative; FIELD_CONFIG `fallback` is the safety net

Sakura's `RunSakura.gs` helpers resolve `${DAY_PREFIX}_${suffix}` first. If the named range is missing, the helper falls back to the A1 string in `FIELD_CONFIG[field].fallback`. This is by design: it tolerates partially-set-up sheets, but it can mask a binding bug. After any structural edit, run the admin diagnostic to confirm all 144 bindings (24 fields x 6 days) are present and bound to the expected ranges.

### Rule 4: Inserting or deleting rows on a day tab breaks named ranges

The day sheet layout is fixed. Any row insertion or deletion shifts the named range bindings; subsequent reads return data from the wrong cells or hit `#REF!`. Immediate recovery is Cmd+Z. If the undo window has passed, use `Shift Report > Admin Tools > Set Up & Diagnostics > pw_forceUpdateNamedRangesOnAllSheets` to rebind from `FIELD_CONFIG`.

### Rule 5: `clasp push` may destroy time-based triggers

Time-based triggers are tied to handler function names. If a function is renamed, removed, or moved between files in a way that breaks discovery, the trigger is silently destroyed. Sakura's pipeline has historically tolerated `clasp push` well, but always verify the triggers panel after deployment and reinstall via the menu if any are missing.

### Rule 6: Warehouse writes must use `toDateOnly_(d)`

The Australia locale fix on 2 April 2026 set the spreadsheet locale to Australia (dd/mm/yyyy). Warehouse rows with time components cause off-by-one-day errors in analytics. Every `appendRow` call into a warehouse sheet must wrap date values with `toDateOnly_(d)`.

The Sakura shift report spreadsheet locale must remain set to Australia (File > Settings > Locale). A US locale will silently misparse manager-entered dates.

### Rule 7: `netRevenue` is a formula; never type into B54

`FIELD_CONFIG.netRevenue.isFormula === true` (`RunSakura.gs:29-190` block). The rollover deliberately excludes it from the clearable set. Typing a literal into B54 destroys the formula and the next rollover will leave it cleared.

### Rule 8: Password-gated menu items are wrappers

The pattern in `MenuSakura.gs`:

```javascript
function performInPlaceRollover() { /* actual work */ }
function pw_performInPlaceRollover() {
  if (requirePassword_()) performInPlaceRollover();
}
```

The menu wires to `pw_*`. The underlying function is callable from code without the password gate. **Triggers must always call the unwrapped function**, never `pw_*`, because the password prompt would fail in trigger context.

### Rule 9: Merged narrative cells, read from column A

Narrative fields (`shiftSummary`, `guestsOfNote`, `goodNotes`, `issues`, `kitchenNotes`, `wastageComps`, `maintenance`, `rsaIncidents`) are merged across columns A-D on their respective rows. When reading, only the column A cell holds the value. When clearing, target the A cell.

---

## 10. Error Handling Philosophy

The codebase distinguishes blocking errors from non-blocking errors.

**Blocking errors** halt the pipeline and surface to the MOD:
- Missing required field (date or MOD).
- PDF generation failure (without a PDF the email cannot send).
- Warehouse-step lock contention (another send is mid-warehouse-write).

**Non-blocking errors** are logged but do not halt the pipeline:
- Slack post failure (one or more posts).
- Email send failure (one or more recipients).
- AI Insights API failure (degrades silently; the rest of the report still ships).
- Task Management push failure (can be re-synced manually).
- Dashboard refresh failure.

For non-blocking errors, the system logs to `Logger.log()`, optionally sends an alert to `INTEGRATION_ALERT_EMAIL_PRIMARY`, and continues. The MOD is shown a success message even if Slack failed, because the report data is safely captured.

---

## 11. Deployment Context

This file is part of the developer documentation hierarchy at `/docs/sakura/for-developers/`. For deployment procedures (clasp push, trigger verification, post-deploy checklist), see the for-admins documentation set when written.

The two-project structure (Shift Report + Task Management) means deployments come in pairs. Always push to both projects in the same session, then verify both projects' triggers in the Apps Script triggers panel. Skipping one is the most common cause of post-deploy partial failure.

Git workflow: branch from `sakura/develop`, push code via clasp, commit to git, push to GitHub, cross-merge to `waratah/develop` if shared files changed. See project root [`CLAUDE.md`](../../../CLAUDE.md) Cross-merge rule.
