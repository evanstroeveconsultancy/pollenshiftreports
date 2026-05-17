# Architecture and Data Flow

**Audience:** Developers and Claude AI agents who need to understand the Waratah codebase before changing it.

This file is the canonical entry point to the technical reference. It covers the file inventory, dependency layering, module responsibilities, trigger inventory, and the key technical rules that the rest of the developer documentation builds on.

---

## 1. System Cutover Context (May 17, 2026)

The Waratah codebase had a structural overhaul in Phase 1.3, completed 2026-05-17. The relevant changes for developers:

- The code now uses **named ranges** for all sheet cell access (197 ranges across 5 day tabs). Named ranges throw on missing; there is no silent fallback (the legacy `FIELD_CONFIG.fallbackCell` columns exist but the helpers `getFieldValue`/`getFieldRange` raise rather than fall back).
- `FIELD_CONFIG` in `RunWaratah.js` holds 36 fields with `isFormula` flags.
- Warehouse schema extended to **25 columns (A-Y)** with cash reconciliation columns W/X/Y added on May 17.
- Time-based triggers were destroyed by the clasp push and have not yet been reinstalled. Until Evan installs them, weekly rollover, digest, and backfill must be run manually from the menu.

The codebase splits across two Apps Script projects (Shift Report and Task Management) sharing one git repository.

---

## 2. File Inventory

### Shift Report project: `THE WARATAH/SHIFT REPORT SCRIPTS/`

| File | Role |
|---|---|
| `RunWaratah.js` | Named range infrastructure: `FIELD_CONFIG`, `getFieldRange`, `getFieldValue`, setup helpers, diagnostics |
| `VenueConfig.js` | Legacy hardcoded fallback cell map (kept for fallback documentation; not used at runtime in Phase 1.3) |
| `SetupWaratah.js` | One-shot setup runner that creates the 197 named ranges across all 5 day tabs |
| `NightlyExportWaratah.js` | The nightly send entry point: orchestrates extraction, validation, Slack, email, warehouse, task push |
| `IntegrationHubWaratah.js` | Data warehouse logging, integration alert pipeline, backfill helpers, schema enforcement |
| `WeeklyRolloverInPlaceWaratah.js` | The Mon 9pm rollover: archive, clear, rename tabs, summary email and Slack |
| `WeeklyDigestWaratah.js` | The Mon 4pm revenue digest |
| `TaskIntegrationWaratah.js` | Push tasks from a sent shift report into the Task Management spreadsheet |
| `SlackBlockKitWaratahSR.js` | Block Kit message builders for the nightly Slack post |
| `AIInsightsWaratah.js` | Claude-API-backed shift summary generation (optional, gated by `ANTHROPIC_API_KEY`) |
| `AnalyticsDashboardWaratah.js` | ANALYTICS and EXECUTIVE_DASHBOARD tab builders, real-time refresh |
| `MenuWaratah.js` | Spreadsheet menu, password gating wrappers (`pw_*` functions) |
| `UIServerWaratah.js` | Backend for the dialog HTML side panels and modal forms |
| `DiagnoseSlack.js` | Webhook diagnostics (test posts, expired-webhook detection) |
| `TEST_DataExtractionVerification.js` | Test harness for extraction correctness |
| `TEST_SlackBlockKitLibrary.js` | Test harness for Block Kit construction |
| `TEST_VenueConfig.js` | Test harness for VenueConfig and FIELD_CONFIG fidelity |
| `_SETUP_ScriptProperties.js` | One-shot setup of all Script Properties; `verifyScriptProperties()` companion |

**17 `.js` files plus 4 `.html` files for dialogs and side panels.**

### Task Management project: `THE WARATAH/TASK MANAGEMENT SCRIPTS/`

| File | Role |
|---|---|
| `EnhancedTaskManagementWaratah.gs` | The task system: status state machine, escalation, recurring task generation, daily maintenance, audit log, trigger installers |
| `TaskDashboardWaratah.gs` | Read-only dashboard builder (counts, breakdowns, trends) |
| `Menu_Updated_Waratah.gs` | Spreadsheet menu for the task system |
| `UIServerWaratah.gs` | Backend for the task manager HTML dialog |
| `SlackBlockKitWaratah.gs` | Block Kit builders for task DMs and channel posts |
| `_SETUP_ScriptProperties.gs` | One-shot setup of Task Management Script Properties |

**6 `.gs` files plus 1 `.html` for the task manager UI.**

Total Waratah code: 23 GAS files (17 `.js` + 6 `.gs`) plus 5 HTML templates.

---

## 3. Layered Dependency Model

The codebase is layered:

```
[Foundation]     RunWaratah.js / VenueConfig.js (config, named ranges, FIELD_CONFIG)
       │
[Service]        IntegrationHubWaratah.js, TaskIntegrationWaratah.js,
                 SlackBlockKitWaratahSR.js, AIInsightsWaratah.js, DiagnoseSlack.js
       │
[Application]    NightlyExportWaratah.js, WeeklyRolloverInPlaceWaratah.js,
                 WeeklyDigestWaratah.js, AnalyticsDashboardWaratah.js, SetupWaratah.js
       │
[Entry]          MenuWaratah.js (UI menu items) + time-based triggers
       │
[UI dialogs]     UIServerWaratah.js + HTML templates
```

**Rule:** higher layers may import from lower; lower must not depend on higher. Adding cross-layer imports indicates a missing helper in the foundation layer.

For the cross-project flow:

```
Shift Report project --(TaskIntegrationWaratah.js)--> Task Management spreadsheet
Task Management project --(reads its own spreadsheet only)--> Task Management spreadsheet
```

There is no reverse arrow. The Task Management project does not call back into the Shift Report project.

---

## 4. Module Responsibilities

The most important modules in detail:

### `RunWaratah.js` (foundation)

Owns:
- `FIELD_CONFIG`: 36-field config object keyed by camelCase field name (e.g. `netRevenue`, `cardTips`, `generalShiftComments`). Each entry has `namedRangeSuffix`, `fallbackCell`, `isFormula`, and `description`.
- `getFieldRange(fieldKey, sheetName)`: returns the `Range` object for a field. Throws if the named range is missing.
- `getFieldValue(fieldKey, sheetName)`: returns the cell value. Convenience wrapper.
- `getClearableFieldKeys_()`: derives the list of safely-clearable fields by filtering `isFormula === false`. Used by rollover.
- `verifyWaratahNamedRanges_()`: diagnostic that walks `FIELD_CONFIG` and verifies every named range exists with the right binding. Returns `{OK: N, MISSING: M, WRONG: W}`.
- `diagnoseNamedRanges()`, `diagnoseAllSheets()`, `createNamedRangesOnActiveSheet()`: admin diagnostics.

### `IntegrationHubWaratah.js` (service)

Owns:
- `runIntegrations(sheetName)`: the orchestration entry. Calls extract, validate, then dispatches to all 5 destinations.
- `extractShiftData_(sheet)`: pulls every field from the sheet via `getFieldValue`, returning a structured `shiftData` object.
- `validateShiftData_(shiftData)`: runs validation rules and returns `{blocking: [...], warnings: [...]}`.
- `logToDataWarehouse_(shiftData)`: 25-col write to NIGHTLY_FINANCIAL plus the other warehouse sheets.
- `isDuplicateInSheet_(sheet, key)`: shared helper for duplicate prevention across all 4 warehouse sheets.
- `parseCellDate_(value)`, `toDateOnly_(date)`: date hardening helpers (Apr 2 locale fix).
- `runWeeklyBackfill_()`: trigger handler for the Mon 2am backfill.

### `NightlyExportWaratah.js` (application)

Owns:
- The entry function for the menu item Send Shift Report.
- Calls `runIntegrations(sheetName)` then handles UI feedback.
- Wraps the call in a script lock to prevent concurrent sends.
- Builds the success/failure dialog payload.

### `WeeklyRolloverInPlaceWaratah.js` (application)

Owns:
- `runWaratahWeeklyRollover(options)`: trigger handler for the Mon 9pm rollover.
- `performWeeklyRollover()`: alias / menu entry point.
- `_warValidatePreconditions_`, `_warAlreadyRolledOver_`, `_warGenerateWeekSummary_`, `_warExportPdfToArchive_`, `_warCreateArchiveSnapshot_`, `_warClearAllSheetData_`, `_warUpdateAllTabDates_`, `_warDryRun_`, `_warValidateRolloverResult_`: internal steps. Underscored to discourage external use.
- `createRolloverTrigger_Waratah()`: installs the time-based trigger.

### `EnhancedTaskManagementWaratah.gs` (task system, foundation + service + entry combined)

Owns the entire task system:
- Constants: `STATUSES`, `PRIORITIES`, `AREAS`, `STAFF_LIST`, `RECURRENCE_OPTIONS`, `COLS`, `HEADERS`, `TASK_CONFIG`.
- State machine handler: `onTaskSheetEditWithAutoSort(e)`.
- Maintenance loop: `runDailyTaskMaintenance()`.
- Escalation: `escalateBlockedTasks_()`.
- Recurring task generation: `processRecurringTasks_()`.
- Trigger installers: 7 separate `create*Trigger()` functions.

See [`06-task-management-internals.md`](06-task-management-internals.md) for the full breakdown.

---

## 5. Triggers (Current State)

The Waratah system relies on **8 time-based triggers + 1 on-edit trigger** when fully installed. As of Phase 1.3, the triggers have been destroyed by the clasp push and not all have been reinstalled.

### Shift Report project triggers (3)

| Function name | Schedule | Installer | Status |
|---|---|---|---|
| `runWaratahWeeklyRollover` | Mon 21:00 | `createRolloverTrigger_Waratah()` | Pending |
| `sendWeeklyRevenueDigest_Waratah` | Mon 16:00 | `setupWeeklyDigestTrigger_Waratah()` | Pending |
| `runWeeklyBackfill_` | Mon 02:00 | `setupWeeklyBackfillTrigger()` | Pending |

### Task Management project triggers (5 time + 1 on-edit)

| Function name | Schedule | Installer | Status |
|---|---|---|---|
| `runDailyTaskMaintenance` | Daily 07:00 | `createDailyMaintenanceTrigger()` | Pending |
| `sendWeeklyActiveTasksSummary` | Mon 10:00 | `createWeeklySummaryTrigger()` | Pending |
| `cleanupAndSortMasterActionables` | Every 2 hours | `createBiHourlyCleanupTrigger()` | Pending |
| `runScheduledStaffWorkload` | Daily 06:00 | `createDailyStaffWorkloadTrigger()` | Pending |
| `runScheduledArchive` | Mon 06:00 | `createWeeklyArchiveTrigger()` | Pending |
| `onTaskSheetEditWithAutoSort` | On any cell edit | `createOnEditTrigger()` | Pending |

There is a seventh installer `createWeeklyOverdueSummaryTrigger()` that remains in code for backwards-compatibility, but the corresponding handler was gutted in April 2026. **Do not recreate this trigger**; it does nothing useful at runtime.

After any `clasp push`, expect to reinstall all of these. The procedure is documented in [`for-admins/04-deployment-and-clasp.md`](../for-admins/04-deployment-and-clasp.md).

---

## 6. Nightly Export, Step by Step

When the MOD clicks Send and confirms, this pipeline runs:

```
1. Acquire script lock (30s timeout)
2. extractShiftData_(sheet): read every field via getFieldValue
   ├── Header fields (date, day, MOD, staff)
   ├── Financial fields (cash, tips, expenses, production)
   ├── Narrative fields (5 paragraphs)
   ├── Task fields (16 rows of description + assignee)
   └── Incident fields (3 narrative fields)
3. validateShiftData_(shiftData): rules: required fields present,
   numeric fields parse, narratives have content, ±$50 variance flag
   └── Returns {blocking: [...], warnings: [...]}
   └── If blocking errors, abort with dialog
4. logToDataWarehouse_(shiftData): 4 sheets written:
   ├── NIGHTLY_FINANCIAL (25 cols, duplicate-prevented by date+venue key)
   ├── OPERATIONAL_EVENTS (8 cols, batch write)
   ├── WASTAGE_COMPS (6 cols, per-incident row)
   └── QUALITATIVE_LOG (11 cols)
5. syncToCashReconciliation_(shiftData): Drive lookup, weekly file, sheet by day name
6. AI insights generation (if ANTHROPIC_API_KEY set)
   └── If unavailable, generate generic summary from numbers
7. buildSlackBlockKitMessage(shiftData, insights): Block Kit JSON
8. postToSlack(webhooks): managers channel + DMs to 6 staff
9. composeShiftReportEmail_(shiftData): HTML email + PDF attachment
10. sendEmail(WARATAH_EMAIL_RECIPIENTS): 6 recipients
11. pushTodosToMasterActionables(shiftData.todos): Task Management spreadsheet
12. Release script lock
13. Show success dialog to MOD
```

Each step is wrapped in try/catch. If a non-blocking step fails (Slack, email, AI), the other steps still complete. The warehouse write is the only blocking step in production.

See [`03-integration-pipeline.md`](03-integration-pipeline.md) for the full code-level walkthrough.

---

## 7. Weekly Rollover, Step by Step

The Mon 9pm rollover follows a strict sequence:

```
1. Acquire global lock
2. _warValidatePreconditions_(spreadsheet): sheet exists, dates parseable, no in-progress send
3. _warAlreadyRolledOver_(spreadsheet): idempotency check (don't rollover twice)
4. _warGenerateWeekSummary_(spreadsheet): collect Wed-Sun totals
5. _warExportPdfToArchive_(spreadsheet, weekEndDate): generate weekly PDF, save to Drive
6. _warCreateArchiveSnapshot_(spreadsheet, weekEndDate): full spreadsheet copy to Drive
7. _warClearAllSheetData_(spreadsheet): clear manager input cells only (formula cells preserved via getClearableFieldKeys_())
8. _warUpdateAllTabDates_(spreadsheet): rename each day tab to next week's date
9. Email rollover summary to recipients
10. Post Slack confirmation to managers channel
11. _warValidateRolloverResult_(spreadsheet): post-condition check
12. Release lock
```

See [`05-rollover-and-triggers.md`](05-rollover-and-triggers.md) for the internals of each step.

---

## 8. Key Technical Rules

These rules have either burned the project before or are subtle enough that they warrant explicit statement.

### Rule 1: `sheet.clear()` is forbidden

`Sheet.clear()` destroys formatting, validation, conditional formatting, notes. Never call it.

Safe alternatives:
- `Range.clearContent()` (singular) for clearing cell values only, on a Range.
- `Sheet.clearContents()` (plural) for clearing all values on a sheet without losing formatting.
- `sheet.clearContent()` (singular, on Sheet) **does not exist**. Calling it raises a TypeError.

Safe pattern when you need to clear an entire sheet: `sheet.getDataRange().clearContent()`.

This rule has burned the project twice (TaskDashboard in both venues). Use the linter: `grep -n "\.clear(" *.js *.gs` before any commit.

### Rule 2: `SpreadsheetApp.getUi()` throws in trigger context

If a function may run from a time-based trigger, all `getUi().alert(...)` calls must be wrapped in try/catch:

```javascript
try {
  SpreadsheetApp.getUi().alert('Done');
} catch (e) {
  Logger.log('UI skipped: running from trigger context');
}
```

Functions that are both menu-callable AND trigger-fired: `performWeeklyRollover`, `runDailyTaskMaintenance`, all `pw_*` wrappers that may be installed as triggers.

### Rule 3: Named ranges throw on missing, no silent fallback

`getFieldRange(fieldKey, sheetName)` raises if the named range does not exist for that sheet. There is no runtime fallback to the `FIELD_CONFIG.fallbackCell` value (that column exists for documentation only).

If a named range is missing, the system fails loud. Fix the binding via `SetupWaratah.js` or the admin diagnostic menu.

### Rule 4: Inserting or deleting rows breaks named ranges

The sheet layout is fixed. Any row insertion or deletion on a day tab shifts named range bindings, causing the next nightly send to write data into the wrong cells or fail with `#REF!`.

If a row insertion happens accidentally, the immediate recovery is Cmd+Z. If the undo window has passed, run `createNamedRangesOnActiveSheet()` to rebind from `FIELD_CONFIG`.

### Rule 5: `clasp push` may destroy triggers

Time-based triggers are tied to handler function names. If a function is renamed, removed, or moved between files in a way that breaks discovery, the trigger is silently destroyed.

Always reinstall triggers after deployment. See [`05-rollover-and-triggers.md`](05-rollover-and-triggers.md) and [`for-admins/04-deployment-and-clasp.md`](../for-admins/04-deployment-and-clasp.md).

### Rule 6: Warehouse writes must use `toDateOnly_(d)`

The Australia locale fix on April 2, 2026 set the spreadsheet to dd/mm/yyyy parsing. Warehouse rows with time components cause off-by-one-day errors in analytics. All `appendRow` calls into warehouse sheets must wrap date values with `toDateOnly_(d)`.

See [`04-warehouse-schemas.md`](04-warehouse-schemas.md) Section on Date Handling.

### Rule 7: Merged cells, read from column A

The narrative fields and some incident fields are merged across columns A through F. When reading, only the column A cell holds the value. When clearing, target the A cell; clearing the whole merge is a no-op for the merge body but works for the value.

### Rule 8: Password-gated menu items are wrapped, not inline

The pattern is:

```javascript
function performWeeklyRollover() { /* actual work */ }
function pw_performWeeklyRollover() {
  if (requirePassword_()) performWeeklyRollover();
}
```

The `pw_` prefix is what the menu wires to. The underlying function is callable from code without the password gate. **Triggers should always call the unwrapped function**, never the `pw_` wrapper, because the password prompt would fail in trigger context.

---

## 9. Error Handling Philosophy

The codebase distinguishes blocking errors from non-blocking errors.

**Blocking errors** halt the pipeline and surface to the user:
- Missing required field in the shift report.
- Cash variance over $50 without acknowledgement.
- Warehouse write failure (the warehouse is the source of truth; if it fails, the night is not captured).
- Lock acquisition failure (another send is in progress).

**Non-blocking errors** are logged but do not halt the pipeline:
- Slack post failure (one or more channels).
- Email send failure (one or more recipients).
- AI Insights API failure (degrades to generic summary).
- Task Management push failure (can be re-synced).
- Dashboard refresh failure.

For non-blocking errors, the system logs to `Logger.log()`, optionally sends an alert to `INTEGRATION_ALERT_EMAIL_PRIMARY`, and continues. The MOD is shown a success message even if Slack failed, because the report data is safely captured.

For blocking errors, the MOD sees a red dialog with the error and the option to resolve (e.g. "Cash variance is $73. Confirm or recount?").

---

## 10. Deployment Context

This file is part of the developer documentation hierarchy at `/docs/waratah/for-developers/`. For deployment procedures (clasp push, trigger reinstall, post-deploy verification), see:

- [`for-admins/04-deployment-and-clasp.md`](../for-admins/04-deployment-and-clasp.md): operational deployment procedure
- [`05-rollover-and-triggers.md`](05-rollover-and-triggers.md): trigger setup internals

The two-project structure (Shift Report + Task Management) means deployments come in pairs. Always push to both projects in the same session, then reinstall both projects' triggers. Skipping one is the most common cause of post-deploy partial failure.

Git workflow: branch from `waratah/develop`, push code via clasp, commit to git, push to GitHub, cross-merge to `sakura/develop` if shared files changed. See project root [`CLAUDE.md`](../../../CLAUDE.md) Cross-merge rule.
