# Tier 4a: Developers Part 1 — Documentation Accuracy Audit

## Files Reviewed

- `docs/waratah/for-developers/README.md` (94 lines)
- `docs/waratah/for-developers/01-architecture-and-data-flow.md` (349 lines)
- `docs/waratah/for-developers/02-cell-reference-and-field-config.md` (318 lines)
- `docs/waratah/for-developers/03-integration-pipeline.md` (452 lines)

## Code Sources Consulted (with line ranges)

- `THE WARATAH/SHIFT REPORT SCRIPTS/RunWaratah.js` (1–1134) — FIELD_CONFIG, helpers, diagnostics, protections
- `THE WARATAH/SHIFT REPORT SCRIPTS/SetupWaratah.js` (1–640) — SETUP_FIELD_CONFIG, named range create/verify
- `THE WARATAH/SHIFT REPORT SCRIPTS/IntegrationHubWaratah.js` (1–1216) — runIntegrations, extractShiftData_, logToDataWarehouse_, parseCellDate_, toDateOnly_, runWeeklyBackfill_
- `THE WARATAH/SHIFT REPORT SCRIPTS/NightlyExportWaratah.js` (1–1175) — continueExport, postToSlackFromSheet, pushTodosToMasterActionables, buildTodoAggregationSheet_
- `THE WARATAH/SHIFT REPORT SCRIPTS/VenueConfig.js` (1–251) — getVenueConfig_ (Waratah `usesNamedRanges: true`)
- `THE WARATAH/SHIFT REPORT SCRIPTS/TaskIntegrationWaratah.js` (1–59) — TASK_COLS, TASK_SHEET_NAME
- `THE WARATAH/SHIFT REPORT SCRIPTS/MenuWaratah.js` (1–281) — onOpen menu, setupAllTriggers_Waratah
- `THE WARATAH/SHIFT REPORT SCRIPTS/SlackBlockKitWaratahSR.js` (function-list view) — bk_header/section/fields/divider/context/buttons/list/post
- `THE WARATAH/SHIFT REPORT SCRIPTS/AIInsightsWaratah.js` (function-list view) — generateShiftSummary_Waratah, classifyTask_Waratah, computeShiftAnalytics_Waratah, etc.
- `THE WARATAH/SHIFT REPORT SCRIPTS/WeeklyRolloverInPlaceWaratah.js` (function-list view) — runWaratahWeeklyRollover, _war*_ internals
- `THE WARATAH/SHIFT REPORT SCRIPTS/WeeklyDigestWaratah.js` (function-list view)
- `THE WARATAH/SHIFT REPORT SCRIPTS/appsscript.json`
- `THE WARATAH/TASK MANAGEMENT SCRIPTS/EnhancedTaskManagementWaratah.gs` (selected regions: 150–225 STATUSES, 1856–2197 trigger installers)

## Findings Summary

- Critical: 13 | High: 11 | Medium: 9 | Low: 5 | Unverified: 6

## Key Verifications

### FIELD_CONFIG actual entry count

**39 entries**, NOT 36, located at `RunWaratah.js:42–295`.

Entries (alphabetical-by-section order):
1. `date`, 2. `mod`, 3. `fohStaff`, 4. `bohStaff`,
5. `publicTillCount`, 6. `publicTillRefloat`, 7. `terraceTillCount`, 8. `terraceTillRefloat`,
9. `cashCounted`, 10. `cashTake`, 11. `cashReturns`, 12. `cdDiscount`, 13. `totalCashRecorded`, 14. `cashVariance`,
15. `cashTips`, 16. `cardTips`, 17. `surchargeTips`, 18. `totalTips`,
19. `productionAmount`, 20. `deposit`, 21. `cardExpenses`,
22. `cashTakeDisplay`, 23. `grossSales`, 24. `totalAdjustmentsDiscounts`, 25. `discountsExcCashDiscount`,
26. `grossSalesLessDiscounts`, 27. `taxes`, 28. `netRevenue`, 29. `runningTotals`,
30. `generalShiftComments`, 31. `guestsOfNote`, 32. `theGood`, 33. `theBad`, 34. `kitchenNotes`,
35. `todoTasks`, 36. `todoAssignees`,
37. `wastageComps`, 38. `maintenanceIssues`, 39. `rsaIncidents`.

`isFormula: true` count = **15** (not "Roughly 12" as doc 02 claims):
`cashCounted`, `cashTake`, `totalCashRecorded`, `cashVariance`, `totalTips`,
`cashTakeDisplay`, `grossSales`, `discountsExcCashDiscount`, `grossSalesLessDiscounts`, `taxes`, `netRevenue`, `runningTotals` = 12 in the financial section. Plus none additional — recount: actual `isFormula: true` per grep is 15. Listed by code: `cashCounted (C18), cashTake (C19), totalCashRecorded (C24), cashVariance (C26), totalTips (C32), cashTakeDisplay (B47), grossSales (B48), discountsExcCashDiscount (B51), grossSalesLessDiscounts (B52), taxes (B53), netRevenue (B54), runningTotals (D37:D54)` = 12. The grep returned 15 because RunWaratah.js comment block also contains `isFormula: true` references in JSDoc at lines 33 (1×) and the file header (2× more total context). Authoritative FIELD_CONFIG body has **12** formula fields. Doc 02 says "Roughly 12 of the 36 fields" — count of 12 is correct, but the list it gives is **inaccurate** (lists 12 names, includes non-existent fields like `cashRecorded`).

### Named ranges actually created by SetupWaratah_

**197 total**, located at `SetupWaratah.js:58–352` (SETUP_FIELD_CONFIG with 39 entries) and `SetupWaratah.js:376–494` (`setupWaratahNamedRanges_`).

Math: 1 field with `activeOnly: false` × 7 day prefixes (MON–SUN) = 7
     + 38 fields with `activeOnly: true` × 5 active day prefixes (WED–SUN) = 190
     **Total = 197** ✓

But note: `SetupWaratah.js:37` self-describes as creating "~75 ranges"; `:367` says "~167 ranges"; both are internal stale comments. The actual computed total from data is 197. The doc's "197" claim is correct.

Naming convention: `{DAY}_SR_{Suffix}` where `Suffix` already starts with `SR_` (so the full constructed name like `WEDNESDAY_SR_NetRevenue` is built by `dayPrefix + '_' + suffix` where `suffix = 'SR_NetRevenue'`). See `RunWaratah.js:330` `buildNamedRangeName(dayPrefix, suffix) → ${dayPrefix}_${suffix}` and the suffix values in FIELD_CONFIG (e.g. `suffix: "SR_Date"` at line 46). The doc statement of the pattern is correct but obscures the implementation detail.

### Pipeline step count in NightlyExportWaratah / IntegrationHubWaratah

`runIntegrations` in `IntegrationHubWaratah.js:73–151` performs **3 logical steps**:
1. `extractShiftData_` (step 1/3)
2. `validateShiftData_` (step 2/3)
3. `logToDataWarehouse_` (step 3/3) — single warehouse call writing 4 sheets internally

`continueExport` (LIVE branch) in `NightlyExportWaratah.js:172–351` is the user-facing entry that orchestrates the bigger pipeline. Order:
1. `runIntegrations(sheetName)` (line 226) — does extract/validate/warehouse internally
2. AI Insights pre-compute + `generateShiftInsight_Waratah` + `deliverAIInsights_Waratah` (lines 238–282)
3. `buildTodoAggregationSheet_` (line 286) — TO-DOs aggregation tab
4. `postToSlackFromSheet` (line 294) — Slack live channel
5. `pushTodosToMasterActionables` (line 302) — task push
6. `generatePdfForSheet_NoUI_` (line 310) — PDF
7. `GmailApp.sendEmail` (line 333) — email
8. `_notifyExportWarnings_` (line 341) — Evan DM if warnings

There is no script-lock around continueExport (only inside `logToDataWarehouse_` lines 433–449). There is no separate `syncToCashReconciliation_` step — cash recon writes are **not** in the codebase.

### Schema column count in IntegrationHubWaratah

**25 columns A–Y**, per the assertion at `IntegrationHubWaratah.js:484–498`:
```
if (actualCols > 0 && actualCols !== 25) {
  throw new Error('NIGHTLY_FINANCIAL has ' + actualCols + ' columns but expected 25. ...');
}
```
The `appendRow` at `IntegrationHubWaratah.js:500–526` has 25 values. The comment at line 412 says "22 cols" — that is stale code-comment.

Schema (A–Y per code lines 501–525):
A=Date, B=Day, C=WeekEnding, D=MOD, E=Staff, F=NetRevenue, G=ProductionAmount,
H=CashTakings (sources C19), I=GrossSalesIncCash (sources B48), J=CashReturns (C22),
K=CDDiscount (C23), L=Refunds (NULL), M=CDRedeem (NULL), N=TotalDiscount (sources B50),
O=DiscountsCompsExcCD (sources B51), P=GrossTaxableSales (sources B52), Q=Taxes (B53),
R=NetSalesWTips (NULL), S=CardTips (C30), T=CashTips (C29), U=TotalTips (C32),
V=CashCounted (C18), W=ExpectedCash (sources C24), X=CashVariance (C26), Y=LoggedAt.

---

## Findings — for-developers/README.md

### Finding D0-1: "All 36 fields, 197 named ranges" — field count wrong
- **Severity:** CRITICAL
- **Doc location:** `README.md:16`
- **Claim (exact quote):** "All 36 fields, 197 named ranges, FIELD_CONFIG structure, named range naming convention, setup-bug procedure, rollover clearables list"
- **Code reality:** FIELD_CONFIG in `RunWaratah.js:42–295` has 39 entries; SETUP_FIELD_CONFIG in `SetupWaratah.js:58–352` has 39 entries. "197" total named ranges is correct (1×7 + 38×5).
- **Evidence:** `grep -cE "^  [a-zA-Z]+:\s*\{" RunWaratah.js` returns 39; `SetupWaratah.js` returns 39. Doc 02 propagates the same "36" error.
- **Recommended fix:** Replace "36 fields, 197 named ranges" with "39 fields, 197 named ranges". Update doc 02 and 01 in lockstep.

### Finding D0-2: "9-status state machine" claim
- **Severity:** LOW (matches code, but inconsistent across docs)
- **Doc location:** `README.md:20`
- **Claim:** "EnhancedTaskManagementWaratah internals: 9-status state machine"
- **Code reality:** `EnhancedTaskManagementWaratah.gs:155–164` defines 9 STATUSES: NEW, TO DO, IN PROGRESS, TO DISCUSS, BLOCKED, DEFERRED, DONE, CANCELLED, RECURRING. Doc README is correct here.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:155–164`
- **Recommended fix:** None for README. But note other Waratah docs (CLAUDE.md, manager docs) say "8-status workflow"; these need reconciliation in their own tier audit.

### Finding D0-3: "trigger destruction recovery" referenced; one trigger handler is gutted
- **Severity:** MEDIUM
- **Doc location:** `README.md:19`
- **Claim:** "trigger setup/teardown, formula preservation, archive folder structure, trigger destruction recovery"
- **Code reality:** `createWeeklyOverdueSummaryTrigger()` at `EnhancedTaskManagementWaratah.gs:2151–2155` is a no-op stub; its handler `runScheduledOverdueSummary` at `:2056–2063` is gutted. Doc 01:175 mentions this but README's "trigger destruction recovery" is a forward reference that's underspecified.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:2151`
- **Recommended fix:** None directly to README. Verify that doc 05 covers the gutted-handler caveat.

### Finding D0-4: Auto-routing list missing `claude-api-agent` / `data-warehouse-agent` cross-link
- **Severity:** LOW
- **Doc location:** `README.md:25–35` (For Claude AI Agents)
- **Claim:** Lists agents `/tah`, `/waratah`, `/review`, `/deploy`, `/rollover`.
- **Code reality:** Project `CLAUDE.md` auto-routing table includes `claude-api-agent` and `data-warehouse-agent` as triggers; these are touched by `AIInsightsWaratah.js` and `IntegrationHubWaratah.js` respectively.
- **Evidence:** CLAUDE.md Agent Auto-Routing Rules.
- **Recommended fix:** Optional — add a one-line cross-reference in the For-Claude-AI section.

---

## Findings — for-developers/01-architecture-and-data-flow.md

### Finding D1-1: "FIELD_CONFIG in RunWaratah.js holds 36 fields"
- **Severity:** CRITICAL
- **Doc location:** `01-architecture-and-data-flow.md:14`
- **Claim:** "`FIELD_CONFIG` in `RunWaratah.js` holds 36 fields with `isFormula` flags."
- **Code reality:** 39 entries. Per-section: 4 header + 4 till + 6 cash recon + 4 tips + 3 production + 8 financial calc + 5 narrative + 2 tasks + 3 incidents = 39.
- **Evidence:** `RunWaratah.js:42–295` — 39 keyed entries.
- **Recommended fix:** Change "36 fields" → "39 fields". Also update `RunWaratah.js:38` self-comment which says "36 fields" and `SetupWaratah.js:44` which says "36 fields" — they too should say 39 to match the code.

### Finding D1-2: "no silent fallback (the legacy FIELD_CONFIG.fallbackCell columns exist but the helpers getFieldValue/getFieldRange raise rather than fall back)"
- **Severity:** HIGH
- **Doc location:** `01-architecture-and-data-flow.md:13`
- **Claim:** Implies silent fallback removed AND there are `fallbackCell` columns.
- **Code reality:** The field attribute key is `fallback` not `fallbackCell` (`RunWaratah.js:47, 53, 59, …`). Comment at `:298` confirms "_fallbackWarnings Set removed — silent fallback eliminated in Phase 1 migration." Helpers throw at `:376–380`. So the raise-on-missing claim is correct; the column-name reference is wrong.
- **Evidence:** `RunWaratah.js:341–380` — `config.fallback`, not `config.fallbackCell`. Also non-day sheets DO silently fall back to A1 ref at `:353` (`if (!dayPrefix) return sheet.getRange(config.fallback)`).
- **Recommended fix:** Rename "fallbackCell" → "fallback" in this doc and doc 02. Note the edge case: non-day sheets still use the fallback A1 ref (this is intentional and rare).

### Finding D1-3: "VenueConfig.js — Legacy hardcoded fallback cell map (kept for fallback documentation; not used at runtime in Phase 1.3)"
- **Severity:** HIGH
- **Doc location:** `01-architecture-and-data-flow.md:29`
- **Claim:** VenueConfig.js is legacy and not used at runtime.
- **Code reality:** VenueConfig.js is *actively* called at runtime by `NightlyExportWaratah.js:100, 242, 765` via `getVenueConfig_()` and the `cfg_.ranges.*` paths (date, mod, fohStaff, bohStaff, netRevenue, cardTips, cashTips, totalTips, cashVariance, etc.). The Waratah config has `usesNamedRanges: true` (`VenueConfig.js:89`). The hardcoded `ranges` map at `:46–90` is read by `postToSlackFromSheet` for cell reads in Slack and AI extraction.
- **Evidence:** `VenueConfig.js:46–90` and consumers `NightlyExportWaratah.js:242–263, 765–822`.
- **Recommended fix:** Change description to: "VenueConfig.js — Live runtime config map. `getVenueConfig_()` returns the Waratah `ranges` block; `usesNamedRanges: true` is set but the A1 cell strings here are still consulted by Slack/AI/Email pipelines for direct `sheet.getRange()` reads."

### Finding D1-4: "8 time-based triggers + 1 on-edit trigger" — count wrong
- **Severity:** HIGH
- **Doc location:** `01-architecture-and-data-flow.md:154` + tables `:156–175`
- **Claim:** "8 time-based triggers + 1 on-edit trigger".
- **Code reality:** Shift Report project has 3 time-based triggers (rollover, digest, backfill) per `MenuWaratah.js:218–258` `setupAllTriggers_Waratah()`. Task Management project has 5 installer functions:
  - `createDailyMaintenanceTrigger` → `runDailyTaskMaintenance` at **6am** not 7am (`EnhancedTaskManagementWaratah.gs:1856–1866`)
  - `createWeeklySummaryTrigger` → `sendWeeklyActiveTasksSummary` Mon 10am
  - `createOnEditTrigger` → `onTaskSheetEditWithAutoSort`
  - `createBiHourlyCleanupTrigger` → `cleanupAndSortMasterActionables` every 2h
  - `createDailyStaffWorkloadTrigger` → `runScheduledStaffWorkload` daily 6am
  - `createWeeklyArchiveTrigger` → `runScheduledArchive` Mon 6am
  - `createWeeklyOverdueSummaryTrigger` → **gutted no-op**
  That's 5 active time triggers + 1 on-edit + 1 gutted = 6 time + 1 on-edit in TM, plus 3 in SR = **9 active time triggers + 1 on-edit**, total **10 distinct trigger handlers** if you count both projects. Doc claim of "8 time-based + 1 on-edit" undercounts by 1.
- **Evidence:** `MenuWaratah.js:218`, `EnhancedTaskManagementWaratah.gs:1856–2197`.
- **Recommended fix:** Recount per project. Either:
  - "Shift Report: 3 time-based; Task Management: 5 time-based + 1 on-edit + 1 deprecated", or
  - Provide the matrix in a single table with separate project columns.

### Finding D1-5: `runDailyTaskMaintenance` daily 07:00 — wrong hour
- **Severity:** CRITICAL
- **Doc location:** `01-architecture-and-data-flow.md:168`
- **Claim:** "`runDailyTaskMaintenance` | Daily 07:00 | `createDailyMaintenanceTrigger()`"
- **Code reality:** `EnhancedTaskManagementWaratah.gs:1864–1867`:
  ```
  ScriptApp.newTrigger("runDailyTaskMaintenance")
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .create();
  ```
  Hour is **6**, not **7**.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1864–1867`.
- **Recommended fix:** Change "Daily 07:00" → "Daily 06:00".

### Finding D1-6: `runScheduledStaffWorkload` Daily 06:00 - confirmed, but missing from table
- **Severity:** MEDIUM
- **Doc location:** `01-architecture-and-data-flow.md:171`
- **Claim:** Listed correctly.
- **Code reality:** `EnhancedTaskManagementWaratah.gs:2095–2110` → `.atHour(6)` daily — confirmed.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:2102–2104`.
- **Recommended fix:** None (verified).

### Finding D1-7: `runScheduledArchive` Mon 06:00 - confirmed
- **Severity:** None
- **Doc location:** `01-architecture-and-data-flow.md:172`
- **Code reality:** `:2123–2133` — Monday at 6am. Confirmed.

### Finding D1-8: "Step 5. syncToCashReconciliation_(shiftData): Drive lookup, weekly file, sheet by day name"
- **Severity:** CRITICAL
- **Doc location:** `01-architecture-and-data-flow.md:202` (and doc 03 sections 1, 5)
- **Claim:** A `syncToCashReconciliation_` step exists.
- **Code reality:** No such function exists anywhere in the codebase. `grep -rn "syncToCashReconciliation\|CashReconciliation\|WARATAH_CASH_RECON" THE\ WARATAH/SHIFT\ REPORT\ SCRIPTS/` returns nothing in the production codebase. There is no separate cash recon workbook write path.
- **Evidence:** Function does not exist in IntegrationHub or NightlyExport.
- **Recommended fix:** Remove all references to `syncToCashReconciliation_`. Cash recon data IS written to the warehouse (cols V/W/X: CashCounted/ExpectedCash/CashVariance) but no separate Drive file is created.

### Finding D1-9: "Block Kit JSON" via `buildSlackBlockKitMessage(shiftData, insights)`
- **Severity:** CRITICAL
- **Doc location:** `01-architecture-and-data-flow.md:205`
- **Claim:** Pipeline calls `buildSlackBlockKitMessage(shiftData, insights)`.
- **Code reality:** No such function. The Slack send is performed inline in `postToSlackFromSheet(spreadsheet, sheet, sheetName, webhookUrl)` at `NightlyExportWaratah.js:764–988`. It uses `bk_*` helpers from `SlackBlockKitWaratahSR.js` (`bk_header`, `bk_section`, `bk_fields`, etc.) and finishes with `bk_post(webhookUrl, blocks, fallbackText)`.
- **Evidence:** `NightlyExportWaratah.js:764`; `SlackBlockKitWaratahSR.js:26–188`.
- **Recommended fix:** Replace "buildSlackBlockKitMessage" with "postToSlackFromSheet (builds blocks inline using bk_* helpers and posts via bk_post)".

### Finding D1-10: "8. postToSlack(webhooks): managers channel + DMs to 6 staff"
- **Severity:** CRITICAL
- **Doc location:** `01-architecture-and-data-flow.md:206`
- **Claim:** Nightly send posts to managers channel AND DMs 6 staff.
- **Code reality:** `continueExport` posts ONLY to `SLACK_WEBHOOK_URL_LIVE` via `postToSlackFromSheet` (`NightlyExportWaratah.js:294`). There are no per-staff DM posts in the nightly export. `SLACK_DM_WEBHOOKS` script property exists but is consumed by task management DMs, not the nightly shift report.
- **Evidence:** `NightlyExportWaratah.js:292–298` (single webhook post). `_SETUP_ScriptProperties.js:68` lists `SLACK_DM_WEBHOOKS` but no shift-report code reads it.
- **Recommended fix:** Remove the "DMs to 6 staff" claim from the nightly export pipeline. Move that detail to the task management doc if relevant.

### Finding D1-11: "9. composeShiftReportEmail_(shiftData): HTML email + PDF attachment"
- **Severity:** HIGH
- **Doc location:** `01-architecture-and-data-flow.md:207`
- **Claim:** Function `composeShiftReportEmail_` exists.
- **Code reality:** No such function. The email body is built inline at `NightlyExportWaratah.js:321–331` as an HTML template literal, with PDF attached via `attachments: [pdfBlob]` at `:335`. Send is via `GmailApp.sendEmail`.
- **Evidence:** `NightlyExportWaratah.js:309–337`.
- **Recommended fix:** Replace with "HTML body composed inline in continueExport(); PDF generated by generatePdfForSheet_NoUI_(); sent via GmailApp.sendEmail".

### Finding D1-12: "10. sendEmail(WARATAH_EMAIL_RECIPIENTS): 6 recipients"
- **Severity:** MEDIUM
- **Doc location:** `01-architecture-and-data-flow.md:208`
- **Claim:** `sendEmail` is called; 6 recipients.
- **Code reality:** `GmailApp.sendEmail(emailAddresses.join(','), ...)` at `NightlyExportWaratah.js:333` is the actual API. Recipient count is not 6 by definition — it's `Object.keys(JSON.parse(WARATAH_EMAIL_RECIPIENTS))` which is data-dependent. CLAUDE.md indicates 6 managers as of May 2026, so this number is accurate operationally but should be cited as "loaded from `WARATAH_EMAIL_RECIPIENTS` JSON property (currently 6 managers)".
- **Evidence:** `NightlyExportWaratah.js:333`.
- **Recommended fix:** Rephrase to "GmailApp.sendEmail to recipients from WARATAH_EMAIL_RECIPIENTS (currently 6 managers)".

### Finding D1-13: "11. pushTodosToMasterActionables(shiftData.todos): Task Management spreadsheet"
- **Severity:** MEDIUM
- **Doc location:** `01-architecture-and-data-flow.md:209`
- **Claim:** Argument is `shiftData.todos`.
- **Code reality:** Real signature is `pushTodosToMasterActionables(sheet, sheetName, preloadedConfig)` at `NightlyExportWaratah.js:448`. It reads TO-DOs from the sheet itself via `TODO_TASK_RANGE`/`TODO_ASSIGNEE_RANGE`, not from a pre-extracted shiftData.todos.
- **Evidence:** `NightlyExportWaratah.js:448–529`.
- **Recommended fix:** Change to `pushTodosToMasterActionables(sheet, sheetName)`.

### Finding D1-14: "12. Release script lock / 13. Show success dialog"
- **Severity:** MEDIUM
- **Doc location:** `01-architecture-and-data-flow.md:210–211`
- **Claim:** Script lock is released at step 12; success dialog shown to MOD.
- **Code reality:** `continueExport` does not acquire a script lock. The only script lock in the nightly pipeline is in `logToDataWarehouse_` (acquired/released at `IntegrationHubWaratah.js:435–449, 656`). The user-facing success message is returned to the dialog via `return { success: true, message: 'Export complete. Emails sent.' }` at `:344`, and the HTML dialog renders it client-side — no native `getUi().alert()` from continueExport.
- **Evidence:** `NightlyExportWaratah.js:172–351` (no `LockService` call); `IntegrationHubWaratah.js:435–449, 656`.
- **Recommended fix:** Re-describe step 12 as "Return { success, message } to HTML dialog for in-modal display." Note the lock scope is per-warehouse-write, not per-pipeline.

### Finding D1-15: Pipeline header "Acquire script lock (30s timeout)"
- **Severity:** HIGH
- **Doc location:** `01-architecture-and-data-flow.md:187`
- **Claim:** Step 1 = "Acquire script lock (30s timeout)".
- **Code reality:** No lock at pipeline entry. The 30s lock is inside `logToDataWarehouse_` (warehouse-step only).
- **Evidence:** `IntegrationHubWaratah.js:435–449`.
- **Recommended fix:** Remove step 1 (lock acquire) or move it to step 4 explicitly framed as "warehouse-step internal lock".

### Finding D1-16: Header fields list "(date, day, MOD, staff)" vs split FOH/BOH
- **Severity:** MEDIUM
- **Doc location:** `01-architecture-and-data-flow.md:188`
- **Claim:** Header fields are `(date, day, MOD, staff)`.
- **Code reality:** Header is `date (B3), mod (B4), fohStaff (B6), bohStaff (B7)` — staff is **split into FOH/BOH** on the new sheet. The combined `staff` field for warehouse compatibility is built by concatenation at `IntegrationHubWaratah.js:282–284` and `NightlyExportWaratah.js:255, 806–808`.
- **Evidence:** `RunWaratah.js:57–68`; `IntegrationHubWaratah.js:279–284`.
- **Recommended fix:** Change "staff" to "fohStaff, bohStaff (combined for warehouse staff column)".

### Finding D1-17: "Task fields (16 rows of description + assignee)" — column wrong elsewhere
- **Severity:** None for this doc location
- **Doc location:** `01-architecture-and-data-flow.md:191`
- **Claim:** 16 rows of description + assignee.
- **Code reality:** Confirmed (16 rows A69:A84 / D69:D84).

### Finding D1-18: "logToDataWarehouse_(shiftData): 4 sheets written, NIGHTLY_FINANCIAL (25 cols, duplicate-prevented by date+venue key)"
- **Severity:** HIGH
- **Doc location:** `01-architecture-and-data-flow.md:197–201`
- **Claim:** "duplicate-prevented by date+venue key"; "QUALITATIVE_LOG (11 cols)".
- **Code reality:** Duplicate prevention is **date+MOD**, not date+venue (`IntegrationHubWaratah.js:474–478`). Other sheets: OPERATIONAL_EVENTS uses date+description (`:543–546`), WASTAGE_COMPS uses date+MOD (`:578–581`), QUALITATIVE_LOG uses date+MOD (`:604–607`). Schema dimensions: NIGHTLY_FINANCIAL=25, OPERATIONAL_EVENTS=8, WASTAGE_COMPS=6, QUALITATIVE_LOG=11. The 11 cols for QUALITATIVE_LOG is correct.
- **Evidence:** `IntegrationHubWaratah.js:474–626`.
- **Recommended fix:** Change "date+venue key" → "date+MOD".

### Finding D1-19: Rollover step list — function names check
- **Severity:** None
- **Doc location:** `01-architecture-and-data-flow.md:223–237`
- **Claim:** `_warValidatePreconditions_`, `_warAlreadyRolledOver_`, `_warGenerateWeekSummary_`, `_warExportPdfToArchive_`, `_warCreateArchiveSnapshot_`, `_warClearAllSheetData_`, `_warUpdateAllTabDates_`, `_warDryRun_`, `_warValidateRolloverResult_`.
- **Code reality:** All confirmed in `WeeklyRolloverInPlaceWaratah.js:242, 290, 324, 407, 502, 571, 628, 675, 737`.
- **Evidence:** Above lines.
- **Recommended fix:** None.

### Finding D1-20: "AIInsightsWaratah.js | Claude-API-backed shift summary generation (optional, gated by ANTHROPIC_API_KEY)"
- **Severity:** LOW (mostly accurate)
- **Doc location:** `01-architecture-and-data-flow.md:37`
- **Claim:** Optional, gated by ANTHROPIC_API_KEY.
- **Code reality:** Confirmed at `AIInsightsWaratah.js:78, 345, 773` — early return / skip when key missing. The file does much more than the doc says: `classifyTask_Waratah`, `detectRevenueAnomalies_Waratah`, `computeShiftAnalytics_Waratah`, `generateShiftInsight_Waratah`, `deliverAIInsights_Waratah`, `logInsightToWarehouse_Waratah`. The single-line summary undersells the file.
- **Evidence:** `AIInsightsWaratah.js` function list (32, 76, 196, 342, 463, 765, 945, 1008).
- **Recommended fix:** Expand to: "Claude-API-backed analytics + insights pipeline (M1 summary, M2 anomaly detection, M3 task classification, M5 insight delivery); gated by ANTHROPIC_API_KEY."

### Finding D1-21: Shift Report file inventory — "17 .js files plus 4 .html"
- **Severity:** MEDIUM
- **Doc location:** `01-architecture-and-data-flow.md:47`
- **Claim:** "17 `.js` files plus 4 `.html` files".
- **Code reality:** `ls THE WARATAH/SHIFT REPORT SCRIPTS/` shows 18 `.js` files (the table at `:26–45` lists exactly these except misses `WeeklyDigestWaratah.js`) plus 4 `.html` files.
- **Evidence:** `ls` output: AIInsightsWaratah.js, AnalyticsDashboardWaratah.js, DiagnoseSlack.js, IntegrationHubWaratah.js, MenuWaratah.js, NightlyExportWaratah.js, RunWaratah.js, SetupWaratah.js, SlackBlockKitWaratahSR.js, TaskIntegrationWaratah.js, UIServerWaratah.js, VenueConfig.js, WeeklyDigestWaratah.js, WeeklyRolloverInPlaceWaratah.js, _SETUP_ScriptProperties.js, plus TEST_DataExtractionVerification.js, TEST_SlackBlockKitLibrary.js, TEST_VenueConfig.js = 18 .js files; 4 .html (analytics-viewer, checklist-dialog, export-dashboard, rollover-wizard).
- **Recommended fix:** Change "17" → "18" and add `WeeklyDigestWaratah.js` to the table (`sendWeeklyRevenueDigest_Waratah` + helpers).

### Finding D1-22: Task Management "6 .gs files plus 1 .html"
- **Severity:** None
- **Doc location:** `01-architecture-and-data-flow.md:60`
- **Code reality:** Confirmed exactly: EnhancedTaskManagementWaratah.gs, Menu_Updated_Waratah.gs, SlackBlockKitWaratah.gs, TaskDashboardWaratah.gs, UIServerWaratah.gs, _SETUP_ScriptProperties.gs + task-manager.html.

### Finding D1-23: Table row "UIServerWaratah.js" vs Task Management "UIServerWaratah.gs"
- **Severity:** LOW
- **Doc location:** `01-architecture-and-data-flow.md:40, 56`
- **Claim:** Both projects have a `UIServerWaratah.js`/`UIServerWaratah.gs`.
- **Code reality:** Confirmed. The SR one is `.js`, the TM one is `.gs`. Doc differentiates correctly.

### Finding D1-24: "Task Management project triggers (5 time + 1 on-edit)" but lists 6 time-trigger rows
- **Severity:** HIGH
- **Doc location:** `01-architecture-and-data-flow.md:164–174`
- **Claim:** Heading "5 time + 1 on-edit" but the table below has 6 rows including the on-edit one.
- **Code reality:** The table lists `runDailyTaskMaintenance`, `sendWeeklyActiveTasksSummary`, `cleanupAndSortMasterActionables`, `runScheduledStaffWorkload`, `runScheduledArchive`, `onTaskSheetEditWithAutoSort` — 5 time + 1 on-edit. The text count is correct; the table is consistent.
- **Recommended fix:** None on count, but see D1-5 for hour error and D1-4 for total tally inclusive of the gutted seventh installer.

### Finding D1-25: Rule 8 password-gated wrappers — `pw_` prefix usage
- **Severity:** None (verified)
- **Doc location:** `01-architecture-and-data-flow.md:303–313`
- **Code reality:** Confirmed by `MenuWaratah.js:38–89`.

---

## Findings — for-developers/02-cell-reference-and-field-config.md

### Finding D2-1: "36 fields in FIELD_CONFIG"
- **Severity:** CRITICAL
- **Doc location:** `02-cell-reference-and-field-config.md:11`
- **Claim:** "36 fields in FIELD_CONFIG".
- **Code reality:** 39 fields.
- **Evidence:** `RunWaratah.js:42–295` count.
- **Recommended fix:** "39 fields".

### Finding D2-2: "Each day tab has 36 fields; 36 × 5 = 180 base ranges, plus 17 multi-row ranges for till entries, card expense lines, and TO-DO rows = 197 total."
- **Severity:** CRITICAL
- **Doc location:** `02-cell-reference-and-field-config.md:15`
- **Claim:** Math `36 × 5 + 17 = 197`.
- **Code reality:** True math is `38 × 5 (activeOnly) + 1 × 7 (date is all-days) = 197`. The `+17 multi-row` claim is a fabrication — multi-row ranges are stored as **single named ranges spanning the row block**, not as 17 extra ranges. Multi-row examples include `*_SR_PublicTillCount` (C10:C17 = 1 range), `*_SR_TodoTasks` (A69:A84 = 1 range), `*_SR_CardExpenses` (B40:B45 = 1 range), `*_SR_RunningTotals` (D37:D54 = 1 range). They are already counted in the 38 active-day fields.
- **Evidence:** `SetupWaratah.js:71–82, 92–119, 211–218, 263–274, 315–328` (each multi-row range is one entry).
- **Recommended fix:** Replace with "39 fields total. 1 field (date) bound on all 7 day tabs (MON–SUN) = 7 ranges. 38 fields bound on the 5 active day tabs (WED–SUN) = 190 ranges. Total = 197."

### Finding D2-3: "Service days are Wednesday through Sunday. Monday and Tuesday tabs exist for symmetry with Sakura"
- **Severity:** LOW (minor wording — Sakura runs Mon–Sat, not Wed–Sun)
- **Doc location:** `02-cell-reference-and-field-config.md:35`
- **Claim:** "exist for symmetry with Sakura".
- **Code reality:** SetupWaratah.js comment at `:11–12` says the Mon/Tue tabs are for "visual consistency"; not "symmetry with Sakura". Sakura's days are Mon–Sat, so symmetry argument doesn't hold. The code at `NightlyExportWaratah.js:212–220` explicitly blocks LIVE export on Mon/Tue.
- **Evidence:** `SetupWaratah.js:11–12`; `NightlyExportWaratah.js:213–220`.
- **Recommended fix:** "exist for visual consistency in the spreadsheet UI; only the date named range is created for those tabs (rollover renames them)".

### Finding D2-4: Layout row groups
- **Severity:** HIGH
- **Doc location:** `02-cell-reference-and-field-config.md:41–45`
- **Claim:**
  - Rows 1-3: Date and MOD/Staff header
  - Rows 5-15: Cash till counts (Public and Terrace, two columns each)
  - Rows 16-32: Financial fields
  - Rows 41-52: Five narrative fields (merged A:F, odd rows hold values)
  - Rows 53-68: 16 TO-DO rows
  - Rows 63-67: Three incident fields (wastage, maintenance, RSA)
- **Code reality:** Per `RunWaratah.js` / `SetupWaratah.js`:
  - Date is B3; MOD B4; FohStaff B6; BohStaff B7
  - Till counts/refloats: C10:C17, D10:D17, E10:E17, F10:F17 (rows 10–17, four columns)
  - Cash recon: C18 (cashCounted), C19 (cashTake), C22–C24, C26, C29–C32 (tips)
  - Production B37, Deposit B38, CardExpenses B40:B45
  - Financial calculations: B47–B54 (and D37:D54 running totals)
  - Narratives: A59 (gen), A61 (guests), A63 (good), A65 (bad), A67 (kitchen)
  - TO-DOs: A69:A84 (16 rows), D69:D84 (assignee)
  - Incidents: A86 wastage, A88 maintenance, A90 RSA
- **Evidence:** `RunWaratah.js:45–294`.
- **Recommended fix:** Replace the whole row-group list with the corrected ranges above. The current ranges (5–15, 16–32, 41–52, 53–68, 63–67) bear no resemblance to the actual new-sheet layout.

### Finding D2-5: Named range examples in convention section
- **Severity:** CRITICAL
- **Doc location:** `02-cell-reference-and-field-config.md:54–63`
- **Claim:** Examples like `WEDNESDAY_SR_NetRevenue`, `WEDNESDAY_SR_Date`, `WEDNESDAY_SR_MOD`, `SUNDAY_SR_KitchenNotes`.
- **Code reality:** Confirmed — these match actual `WEDNESDAY_SR_NetRevenue` etc. (built from `dayPrefix + '_' + suffix` where suffix = `SR_NetRevenue`).
- **Evidence:** `SetupWaratah.js:262–267, 61–67, 70–76, 306–312`.
- **Recommended fix:** None.

### Finding D2-6: Multi-row range examples — wrong names
- **Severity:** CRITICAL
- **Doc location:** `02-cell-reference-and-field-config.md:67–72`
- **Claim:**
  - `WEDNESDAY_SR_PublicTillCounts` (plural, "Counts")
  - `WEDNESDAY_SR_CardExpenses`
  - `WEDNESDAY_SR_TodoDescriptions`
  - `WEDNESDAY_SR_TodoAssignees`
- **Code reality:** The actual range names per `SetupWaratah.js`:
  - `WEDNESDAY_SR_PublicTillCount` (singular, no `s`)
  - `WEDNESDAY_SR_PublicTillRefloat`, `WEDNESDAY_SR_TerraceTillCount`, `WEDNESDAY_SR_TerraceTillRefloat`
  - `WEDNESDAY_SR_CardExpenses` ✓
  - `WEDNESDAY_SR_TodoTasks` (not `TodoDescriptions`)
  - `WEDNESDAY_SR_TodoAssignees` ✓
- **Evidence:** `SetupWaratah.js:93, 100, 107, 114, 211, 315, 322`.
- **Recommended fix:** Change `PublicTillCounts` → `PublicTillCount` and `TodoDescriptions` → `TodoTasks`.

### Finding D2-7: Helper signatures `getFieldRange(fieldKey, sheetName)`
- **Severity:** CRITICAL
- **Doc location:** `02-cell-reference-and-field-config.md:77–83`
- **Claim:** Signatures: `getFieldRange(fieldKey, sheetName)`, `getFieldValue(fieldKey, sheetName)`, `getFieldValues(fieldKey, sheetName)`, `setFieldValue(fieldKey, sheetName, value)`.
- **Code reality:** Actual signatures are **(sheet, fieldKey)** — argument order is reversed:
  - `getFieldRange(sheet, fieldKey)` at `RunWaratah.js:341`
  - `getFieldDisplayValue(sheet, fieldKey)` at `:389`
  - `getFieldValue(sheet, fieldKey)` at `:401`
  - `getFieldValues(sheet, fieldKey)` at `:413`
  No `setFieldValue` exists in RunWaratah.js. (`VenueConfig.js:176–196` has `setRangeValue_` but that's different.)
- **Evidence:** `RunWaratah.js:341, 389, 401, 413`.
- **Recommended fix:** Reverse the argument order in the doc to `(sheet, fieldKey)`. Remove `setFieldValue` from the table or note it does not exist.

### Finding D2-8: "verifyWaratahNamedRanges_()" return shape
- **Severity:** MEDIUM
- **Doc location:** `02-cell-reference-and-field-config.md:83` (and 01:108)
- **Claim:** Returns `{OK: N, MISSING: M, WRONG: W}`.
- **Code reality:** Returns `{ ok: okCount, missing: missingCount, wrong: wrongCount, unexpected: unexpectedCount }` per `SetupWaratah.js:634`. Note (a) case is lower; (b) there is a 4th key `unexpected`.
- **Evidence:** `SetupWaratah.js:634`.
- **Recommended fix:** Update return-shape doc to `{ ok, missing, wrong, unexpected }` (lowercase).

### Finding D2-9: Setup-bug procedure mentions Wrong-Sheet binding
- **Severity:** LOW (procedure is approximately right)
- **Doc location:** `02-cell-reference-and-field-config.md:93–107`
- **Claim:** Run "Admin Tools > Diagnose Named Ranges" then "Admin Tools > Recreate Named Ranges on Active Sheet".
- **Code reality:** Menu items per `MenuWaratah.js:168–180` are nested under `Admin Tools > Setup & Utilities > Named Ranges > Diagnose Active Sheet`, `Create on Active Sheet`, etc. Doc's menu path is approximated.
- **Recommended fix:** Update menu path to match: `Admin Tools > Setup & Utilities > Named Ranges > Diagnose Active Sheet` and `Create on Active Sheet`.

### Finding D2-10: FIELD_CONFIG sample structure uses `namedRangeSuffix` and `fallbackCell`
- **Severity:** CRITICAL
- **Doc location:** `02-cell-reference-and-field-config.md:115–130`
- **Claim:** Sample shows attribute names `namedRangeSuffix`, `fallbackCell`, `isFormula`, `description`.
- **Code reality:** Actual attribute names are `suffix`, `fallback`, `isFormula`, `description` (per `RunWaratah.js:46–50`). A developer copy-pasting this sample would write code that fails.
- **Evidence:** `RunWaratah.js:45–50` show keys `suffix:`, `fallback:`, `isFormula:`, `description:`.
- **Recommended fix:** Rewrite the sample using the real attribute names:
  ```javascript
  date: {
    suffix: "SR_Date",
    fallback: "B3:F3",
    isFormula: false,
    description: "Report date (merged B3:F3)"
  }
  ```

### Finding D2-11: "Roughly 12 of the 36 fields are formula cells"
- **Severity:** HIGH
- **Doc location:** `02-cell-reference-and-field-config.md:137`
- **Claim:** 12 formula fields, then lists names including `cashCounted`, `cashTakings`, `cashRecorded`, `cashVariance`, `totalTips`, `cashTakeDisplay`, `grossSales`, `discountsExcCash`, `grossSalesLessDisc`, `taxes`, `netRevenue`, `runningTotals`.
- **Code reality:** Actual formula fields = 12, but list includes wrong names:
  - `cashCounted` ✓ (real)
  - `cashTakings` ✗ — the real field is `cashTake` (no plural)
  - `cashRecorded` ✗ — real field is `totalCashRecorded`
  - `cashVariance` ✓
  - `totalTips` ✓
  - `cashTakeDisplay` ✓
  - `grossSales` ✓
  - `discountsExcCash` ✗ — real is `discountsExcCashDiscount`
  - `grossSalesLessDisc` ✗ — real is `grossSalesLessDiscounts`
  - `taxes` ✓
  - `netRevenue` ✓
  - `runningTotals` ✓
- **Evidence:** `RunWaratah.js:97–228` (12 entries with `isFormula: true`).
- **Recommended fix:** Use the exact 12 field keys: `cashCounted`, `cashTake`, `totalCashRecorded`, `cashVariance`, `totalTips`, `cashTakeDisplay`, `grossSales`, `discountsExcCashDiscount`, `grossSalesLessDiscounts`, `taxes`, `netRevenue`, `runningTotals`.

### Finding D2-12: Field categories table — "Header 4" and arithmetic to 36/37
- **Severity:** HIGH
- **Doc location:** `02-cell-reference-and-field-config.md:153–161`
- **Claim:** Categories total to 37, "canonical count is 36 (one entry is a multi-row alias not counted separately)".
- **Code reality:** Categories actual:
  - Header: `date, mod, fohStaff, bohStaff` = **4** (doc lists `date, dayOfWeek, MOD, staff` — `dayOfWeek` does not exist in FIELD_CONFIG; `staff` was split into `fohStaff`/`bohStaff`)
  - Cash tills: `publicTillCount, publicTillRefloat, terraceTillCount, terraceTillRefloat` = 4 (not 9)
  - Cash recon: `cashCounted, cashTake, cashReturns, cdDiscount, totalCashRecorded, cashVariance` = 6
  - Tips: `cashTips, cardTips, surchargeTips, totalTips` = 4
  - Revenue/Production: `productionAmount, deposit, cardExpenses` = 3
  - Financial calcs: `cashTakeDisplay, grossSales, totalAdjustmentsDiscounts, discountsExcCashDiscount, grossSalesLessDiscounts, taxes, netRevenue, runningTotals` = 8
  - Narratives: 5 (matches doc)
  - Tasks: 2 (matches doc)
  - Incidents: 3 (matches doc)
  Total: **4 + 4 + 6 + 4 + 3 + 8 + 5 + 2 + 3 = 39**. The doc's category counts (Header 4, Cash tills 9, etc.) are wrong.
- **Evidence:** `RunWaratah.js:44–294`.
- **Recommended fix:** Rewrite the table with the categories above and a total of 39.

### Finding D2-13: "isFormula derivation note" lists `getClearableFieldKeys_()`
- **Severity:** None
- **Doc location:** `02-cell-reference-and-field-config.md:147, 175–180`
- **Code reality:** Confirmed at `RunWaratah.js:424–426`:
  ```javascript
  function getClearableFieldKeys_() {
    return Object.keys(FIELD_CONFIG).filter(key => !FIELD_CONFIG[key].isFormula);
  }
  ```
  Matches doc.

### Finding D2-14: "Merged Cell Reading Rule" example uses `WEDNESDAY_SR_GeneralShiftComments`
- **Severity:** LOW
- **Doc location:** `02-cell-reference-and-field-config.md:211–215`
- **Claim:** Named range name `WEDNESDAY_SR_GeneralShiftComments`.
- **Code reality:** Confirmed; suffix is `SR_GeneralShiftComments` (`SetupWaratah.js:279`). However, the example "merged A:F" is wrong — narrative fields target column **A only** (e.g. `A59`, `A61`, `A63`, `A65`, `A67`), not `A:F`. Visual rendering may show merge, but the named range itself binds to A only.
- **Evidence:** `RunWaratah.js:231–260`, `SetupWaratah.js:278–312` (`cell: 'A59'`, etc.).
- **Recommended fix:** Clarify that named range points to col A only; visual merge spans columns but the data is on A.

### Finding D2-15: "Sheet Protection Model" — 12 formula × 5 = 60 ranges
- **Severity:** MEDIUM
- **Doc location:** `02-cell-reference-and-field-config.md:225`
- **Claim:** "12 formula cells per day × 5 days = 60 protected ranges; plus label cells and Read Me tab. Warning mode."
- **Code reality:** Per `RunWaratah.js:846–873` `setupSheetProtection_`:
  - Whole-sheet protection set per day; editable carve-outs are `getClearableFieldKeys_()` (= 39 − 12 = 27 fields).
  - Protection mode is **restrict editing to owner**, not "warning". Lines 856–862: `.addEditor(ownerEmail); .removeEditors(others)`.
  - There is no separate "12 × 5 = 60 protected ranges" model.
  - Read Me tab is not separately mentioned by the protection code.
- **Evidence:** `RunWaratah.js:846–873`.
- **Recommended fix:** Replace section with: "Whole-sheet protection applied to each WED–SUN tab; editable carve-outs derived from `getClearableFieldKeys_()` (27 input fields). Editing restricted to `SHEET_PROTECTION_OWNER_EMAIL` (or effective user fallback)."

### Finding D2-16: "If protections become out of sync after a sheet edit, run Admin Tools > Reset Sheet Protections"
- **Severity:** MEDIUM
- **Doc location:** `02-cell-reference-and-field-config.md:232`
- **Claim:** Menu item "Reset Sheet Protections".
- **Code reality:** Actual menu items per `MenuWaratah.js:181–184`: "Apply Protection (All Sheets)" → `pw_setupAllSheetsProtection`, "Remove Protection (All Sheets)" → `pw_removeAllSheetsProtection`. No "Reset" item.
- **Evidence:** `MenuWaratah.js:181–184`.
- **Recommended fix:** "If protections become out of sync, run Admin Tools > Setup & Utilities > Sheet Protection > Remove Protection (All Sheets), then Apply Protection (All Sheets)."

### Finding D2-17: "Integration Hub Batch Read Pattern" — `BATCH_RANGES_BY_SHEET` named-range constant
- **Severity:** CRITICAL
- **Doc location:** `02-cell-reference-and-field-config.md:236–254`
- **Claim:** A `BATCH_RANGES_BY_SHEET` constant exists; defines `WEDNESDAY_SR_HeaderBlock` (A1:F3), `*_FinancialBlock` (B5:D32), `*_NarrativeBlock` (A41:F52), `*_TodoBlock` (A53:D68).
- **Code reality:** No such constant or named ranges. Actual batch reads in `extractShiftData_` use **direct A1 ranges**:
  - `sheet.getRange("B3:F54")` — financial batch
  - `sheet.getRange("B3:B7")` — header display values
  - `sheet.getRange("A59:A90")` — narrative + incidents
  - `sheet.getRange("A69:D84")` — TO-DOs
- **Evidence:** `IntegrationHubWaratah.js:245, 261, 293, 308`.
- **Recommended fix:** Remove the `BATCH_RANGES_BY_SHEET` section entirely. Replace with the actual ranges read: 4 A1 batches per the code.

### Finding D2-18: Quick Lookup Table — multiple wrong named-range suffixes
- **Severity:** CRITICAL
- **Doc location:** `02-cell-reference-and-field-config.md:261–298`
- **Claim:** Lists 36 row entries with named range suffix and warehouse column.
- **Code reality:** Multiple entries do not exist in FIELD_CONFIG and the warehouse column mapping is wrong:
  - `dayOfWeek` — not in FIELD_CONFIG. `shiftData.dayOfWeek` is computed at runtime via `Utilities.formatDate(date, 'EEEE')` (`IntegrationHubWaratah.js:329`).
  - `staff` — not in FIELD_CONFIG. Real: `fohStaff`, `bohStaff` (separate).
  - `MOD` (uppercase) — real key is `mod` (lowercase) per `RunWaratah.js:51`.
  - `publicTillCounts`, `terraceTillCounts` — wrong key names (real: `publicTillCount`, etc.).
  - `cashTakings` — real is `cashTake`.
  - `cashRecorded` — real is `totalCashRecorded`.
  - `production` — real is `productionAmount`.
  - `functionDeposit` — real is `deposit`.
  - `cashTakings | CashTakings | Yes | Yes (NIGHTLY_FINANCIAL X)` — wrong column; CashTake sources warehouse **H** not X.
  - `cashVariance | Yes | Yes (NIGHTLY_FINANCIAL Y)` — wrong column; CashVariance is **X**, LoggedAt is Y (`IntegrationHubWaratah.js:524–525`).
  - `cashCounted | Yes | Yes (NIGHTLY_FINANCIAL H)` — wrong column; CashCounted is **V** (`IntegrationHubWaratah.js:522`).
  - Many other warehouse column letters in the table are wrong (e.g. `discountsExcCash` → real `discountsExcCashDiscount` → warehouse col O, not N as doc says).
  - `vipsNotes`, `goodHighlights`, `badHighlights` — wrong keys; real are `guestsOfNote`, `theGood`, `theBad`.
  - `wastageNotes` — real is `wastageComps`.
  - `maintenanceNotes` — real is `maintenanceIssues`.
- **Evidence:** `RunWaratah.js:42–295`; `IntegrationHubWaratah.js:500–526`; `SetupWaratah.js:58–352`.
- **Recommended fix:** Rebuild this entire table from FIELD_CONFIG. Suggested header: `Field key | Suffix | A1 | isFormula | Warehouse col`. Use actual data only.

### Finding D2-19: Comparison with Sakura — "Number of fields ~32" / "Multi-row ranges 12" / "Total named ranges ~210"
- **Severity:** UNVERIFIED
- **Doc location:** `02-cell-reference-and-field-config.md:308–317`
- **Claim:** Sakura ~32 fields, ~210 ranges.
- **Code reality:** Sakura code not within this audit's scope. Marked unverified.

---

## Findings — for-developers/03-integration-pipeline.md

### Finding D3-1: Pipeline overview says "9 steps", entry point `runIntegrations(sheetName)` and wrapper `sendShiftReport()`
- **Severity:** CRITICAL
- **Doc location:** `03-integration-pipeline.md:4–5, 9–28`
- **Claim:** Entry wrapper named `sendShiftReport()` in `NightlyExportWaratah.js`.
- **Code reality:** No `sendShiftReport()` exists. The user-facing entries are `exportAndEmailPDF()` (`:362`) → `showPreExportChecklist_` → `continueExport(sheetName, isTest)` (`:172`). The integration entry is `runIntegrations(sheetName)`.
- **Evidence:** `NightlyExportWaratah.js:362, 146, 172`.
- **Recommended fix:** Replace `sendShiftReport()` → `continueExport()` (called from `exportAndEmailPDF` via a checklist dialog).

### Finding D3-2: Pipeline lists "5 destinations" with `syncToCashReconciliation_`, `buildSlackBlockKit_`, `postToSlackChannels_`, `postToSlackDMs_`, `generatePdfAndEmail_`, `pushTodosToMaster_`
- **Severity:** CRITICAL
- **Doc location:** `03-integration-pipeline.md:11–25`
- **Claim:** Function names: `syncToCashReconciliation_`, `buildSlackBlockKit_`, `postToSlackChannels_`, `postToSlackDMs_`, `generatePdfAndEmail_`, `pushTodosToMaster_`.
- **Code reality:** **None of these functions exist.** Actual function names:
  - `extractShiftData_` ✓ (exists)
  - `validateShiftData_` ✓ (exists)
  - `logToDataWarehouse_` ✓ (exists)
  - `syncToCashReconciliation_` ✗ (does not exist)
  - `buildSlackBlockKit_` ✗ — Slack message is built inline in `postToSlackFromSheet`
  - `postToSlackChannels_`, `postToSlackDMs_` ✗ — single call to `postToSlackFromSheet` which posts to one webhook
  - `generatePdfAndEmail_` ✗ — separate `generatePdfForSheet_NoUI_` + inline GmailApp.sendEmail
  - `pushTodosToMaster_` ✗ — actual: `pushTodosToMasterActionables`
- **Evidence:** `grep -nE "^function " THE\ WARATAH/SHIFT\ REPORT\ SCRIPTS/*.js` returns no matches for any of the fabricated names.
- **Recommended fix:** Rewrite step list using real function names from `NightlyExportWaratah.js:172–351`.

### Finding D3-3: `runIntegrations` sample code body
- **Severity:** CRITICAL
- **Doc location:** `03-integration-pipeline.md:34–72`
- **Claim:** Code includes `results.cashRecon`, `results.slack`, `results.email`, `results.tasks`; returns `{ success: true, results, warnings: validation.warnings }`.
- **Code reality:** Actual `runIntegrations` at `IntegrationHubWaratah.js:73–151` only handles **warehouse** (warehouse-only). It returns `{ success, errors: [], warnings: [], integrations: { dataExtraction, validation, warehouse } }`. No cashRecon, slack, email, or tasks fields. Slack/email/tasks are orchestrated by `continueExport`, NOT by runIntegrations.
- **Evidence:** `IntegrationHubWaratah.js:73–151`.
- **Recommended fix:** Either (a) rewrite this section to reflect the real two-tier architecture (`runIntegrations` = warehouse only; `continueExport` = pipeline orchestrator), or (b) replace the sample with the actual code from the file.

### Finding D3-4: extractShiftData_ field list omits fohStaff/bohStaff/surchargeTips/totalAdjustmentsDiscounts/grossSalesLessDiscounts
- **Severity:** HIGH
- **Doc location:** `03-integration-pipeline.md:82–131`
- **Claim:** Sample `extractShiftData_` body uses `getFieldValue('staff', name)`, `getFieldValue('cashRecorded', name)`, etc.
- **Code reality:** Actual extractShiftData_ at `IntegrationHubWaratah.js:228–389` does NOT use `getFieldValue`; it uses **direct batch reads** via `sheet.getRange("B3:F54").getValues()` then helper accessors `fin()`, `finNum()`, `finC()`, `finC_Num()`, `narr()`. It returns: `date, dayOfWeek, weekEnding, mod, fohStaff, bohStaff, staff (combined), netRevenue, productionAmount, cashTake, cashCounted, cashReturns, cdDiscount, totalCashRecorded, cashVariance, cashTips, cardTips, surchargeTips, totalTips, tipsTotal (alias), grossSales, totalAdjustmentsDiscounts, discountsExcCashDiscount, grossSalesLessDiscounts, taxes, refunds: null, cdRedeem: null, netSalesWTips: null, todos, generalShiftComments, guestsOfNote, theGood, theBad, kitchenNotes, wastageComps, maintenanceIssues, rsaIncidents, sheetName`.
- **Evidence:** `IntegrationHubWaratah.js:325–389`.
- **Recommended fix:** Rewrite this entire section. Replace the `getFieldValue` sample with a description of the batch-read pattern and the actual returned object shape.

### Finding D3-5: extractTodos_ helper function
- **Severity:** CRITICAL
- **Doc location:** `03-integration-pipeline.md:135–155`
- **Claim:** Function `extractTodos_(sheetName)` exists and uses `getFieldValues('todoDescriptions', sheetName)`.
- **Code reality:** No `extractTodos_` function exists. TO-DO extraction is inlined in `extractShiftData_` at `IntegrationHubWaratah.js:304–319`: `sheet.getRange("A69:D84").getValues()`, then filter for non-empty descriptions. The field key is `todoTasks` not `todoDescriptions`.
- **Evidence:** `IntegrationHubWaratah.js:304–319`.
- **Recommended fix:** Remove `extractTodos_` sample. Inline-document the TODO read at `A69:D84` with `description = row[0]; assignee = row[3]`.

### Finding D3-6: Validation rules table
- **Severity:** HIGH
- **Doc location:** `03-integration-pipeline.md:165–174`
- **Claim:** Rules include "Cash variance over ±$50 (Warning)", "At least one narrative field has content (Warning)", "No tasks added (Warning)", "Card tips and cash tips both zero (Warning)".
- **Code reality:** Actual `validateShiftData_` at `IntegrationHubWaratah.js:671–720` enforces only:
  1. Date is a valid Date (Error) — "Invalid or missing date (cell B3)"
  2. MOD present (Error) — "MOD name is required (cell B4)"
  3. `netRevenue <= 0` (Warning) — "Net revenue is $0 or negative (cell B54) — verify before exporting. Continuing."

  All other rules in the doc (cash variance, narrative content, no-tasks, zero-tips) are **not in the code**. The cash discrepancy rules were explicitly disabled on 2026-02-15 (comment block at `:691–712`).
- **Evidence:** `IntegrationHubWaratah.js:671–720`.
- **Recommended fix:** Reduce the table to the 3 real rules. Note the disabled cash discrepancy rule explicitly if useful for historical context.

### Finding D3-7: Section 5 Cash Reconciliation Sync — entire section fabricated
- **Severity:** CRITICAL
- **Doc location:** `03-integration-pipeline.md:179–210`
- **Claim:** `syncToCashReconciliation_(shiftData)` writes to a separate Drive workbook keyed by week, reads `WARATAH_CASH_RECON_FOLDER_ID` Script Property, writes `B4:F8`/`B10:F14` etc.
- **Code reality:** The function does not exist. The Script Property `WARATAH_CASH_RECON_FOLDER_ID` is not referenced anywhere in the codebase (`grep -rn "WARATAH_CASH_RECON_FOLDER_ID" THE\ WARATAH/` returns nothing). Cash recon data lives in NIGHTLY_FINANCIAL columns V/W/X.
- **Evidence:** Absence of function and property.
- **Recommended fix:** Delete Section 5 entirely. Replace with a note "Cash reconciliation data is written into the NIGHTLY_FINANCIAL warehouse table at columns V (CashCounted), W (ExpectedCash), X (CashVariance). There is no separate cash recon workbook."

### Finding D3-8: Slack Block Kit construction sample
- **Severity:** HIGH
- **Doc location:** `03-integration-pipeline.md:214–261`
- **Claim:** `buildSlackBlockKit_(shiftData, insights)` is a function; uses 🌸 emoji header.
- **Code reality:** No standalone `buildSlackBlockKit_` function. Blocks are built inline in `postToSlackFromSheet` (`NightlyExportWaratah.js:888–982`). Header is `bk_header("The Waratah — Nightly Shift Report")` — no 🌸 (cherry blossom is the **Sakura** emoji, not Waratah). There is no 2900-char truncation guard mentioned at the end. The Block Kit helpers are defined in `SlackBlockKitWaratahSR.js` (`bk_header`, `bk_section`, `bk_fields`, `bk_divider`, `bk_context`, `bk_buttons`, `bk_list`, `bk_post`).
- **Evidence:** `NightlyExportWaratah.js:888–982`; `SlackBlockKitWaratahSR.js:26–188`.
- **Recommended fix:** Rewrite Section 6 to describe the inline pattern in `postToSlackFromSheet` and reference `bk_*` helpers from SlackBlockKitWaratahSR.js. Remove 🌸 emoji claim.

### Finding D3-9: Slack delivery — "3 webhook destinations plus per-staff DMs"
- **Severity:** CRITICAL
- **Doc location:** `03-integration-pipeline.md:266–308`
- **Claim:** Posts to 3 destinations (`#waratah-shift-reports`, test channel, managers channel, plus DMs).
- **Code reality:** `postToSlackFromSheet` posts to a **single** webhook (the one passed in: `SLACK_WEBHOOK_URL_LIVE` for LIVE, `SLACK_WEBHOOK_URL_TEST` for TEST). No managers-channel post, no per-staff DMs from the nightly export. `SLACK_DM_WEBHOOKS` and `SLACK_MANAGERS_CHANNEL_WEBHOOK` are consumed by other code paths (task management, weekly summary) — not the nightly export.
- **Evidence:** `NightlyExportWaratah.js:292–298` (single post); `SlackBlockKitWaratahSR.js:188–214` (`bk_post` posts to a single webhookUrl arg).
- **Recommended fix:** Reduce Section 7 to one webhook destination per LIVE/TEST. Document any per-staff DM behaviour separately in the task-management doc.

### Finding D3-10: sendSlackMessages_ sample body
- **Severity:** CRITICAL
- **Doc location:** `03-integration-pipeline.md:278–305`
- **Claim:** Function `sendSlackMessages_(shiftData)` exists and `postToSlack_(webhook, blockKit)` with `UrlFetchApp.fetch`.
- **Code reality:** Neither function exists. The actual entry is `postToSlackFromSheet(spreadsheet, sheet, sheetName, webhookUrl)` (`:764`) which calls `bk_post(webhookUrl, blocks, fallbackText)` at `:984`. `bk_post` lives in `SlackBlockKitWaratahSR.js:188–214` and uses `UrlFetchApp.fetch`.
- **Evidence:** `NightlyExportWaratah.js:764, 984`; `SlackBlockKitWaratahSR.js:188`.
- **Recommended fix:** Replace sample with `postToSlackFromSheet` and `bk_post` from real code.

### Finding D3-11: Email distribution — `generatePdfAndEmail_(shiftData)` and `exportTabAsPdf_`
- **Severity:** CRITICAL
- **Doc location:** `03-integration-pipeline.md:312–346`
- **Claim:** `generatePdfAndEmail_(shiftData)` function; PDF via `exportTabAsPdf_(sheetName)` and `getAs(MimeType.PDF)`.
- **Code reality:** Neither function exists. PDF generation is via `generatePdfForSheet_NoUI_(spreadsheet, sheet, filename)` at `NightlyExportWaratah.js:1002–1030`, which uses **UrlFetchApp.fetch** against the export URL (`docs.google.com/spreadsheets/d/{id}/export?format=pdf...`) — not `getAs(MimeType.PDF)`. Email send is direct `GmailApp.sendEmail` inline at `:333`.
- **Evidence:** `NightlyExportWaratah.js:309–337, 1002–1030`.
- **Recommended fix:** Rewrite Section 8 using real function names. Replace the `getAs(MimeType.PDF)` mention with the actual export-URL fetch.

### Finding D3-12: composeShiftReportEmail_ fabricated
- **Severity:** HIGH
- **Doc location:** `03-integration-pipeline.md:346`
- **Claim:** `composeShiftReportEmail_` builds HTML body.
- **Code reality:** No such function; HTML body composed inline at `NightlyExportWaratah.js:321–331`.
- **Recommended fix:** Remove `composeShiftReportEmail_` reference.

### Finding D3-13: Task Management Push sample body
- **Severity:** HIGH
- **Doc location:** `03-integration-pipeline.md:354–394`
- **Claim:** Function `pushTodosToMaster_(shiftData)` with `isDuplicateTask_` helper and 14-column appendRow.
- **Code reality:** Real function is `pushTodosToMasterActionables(sheet, sheetName, preloadedConfig)` at `NightlyExportWaratah.js:448`. Duplicate detection uses `openDescriptions` Set (DONE/CANCELLED exclude) at `:477–506`, not a `isDuplicateTask_` helper. The fallback `pushTodosDirectToMasterActionables_` at `:538` batches via `setValues` (not `appendRow` per row), writing 14 columns matching `TASK_COLS` from `TaskIntegrationWaratah.js:24–39`.

  The column order in the doc sample MATCHES the actual `TASK_COLS` constants and `pushTodosDirectToMasterActionables_` rows (cols A=Priority, B=Status, C=Staff, D=Area, E=Description, F=Due Date, G=Date Created, H=Date Completed, I=Days Open, J=Blocker Notes, K=Source, L=Recurrence, M=Last Updated, N=Updated By). Defaults are mostly correct, BUT:
  - Doc has `'',                                    // D Area (blank, manager fills)`
  - Real code has `"General",          // Area` at `:559`. So Area default is "General", not blank.
  - Doc Date Created uses `toDateOnly_(shiftData.date)`; real uses `now` (current Date) at `:561`. The Date Created is **today**, not the shift date.
  - Doc passes `shiftData.MOD` as Updated By; real uses `Session.getActiveUser().getEmail() || "System"` at `:552`.
  - The sample uses `appendRow` per todo; real uses `setValues` batch at `:572`.
- **Evidence:** `NightlyExportWaratah.js:538–594`; `TaskIntegrationWaratah.js:24–39`.
- **Recommended fix:** Replace sample with the actual `pushTodosDirectToMasterActionables_` body. Correct the Area, Date Created, and Updated By values. Note batch `setValues` not `appendRow`.

### Finding D3-14: Test harness mentions "Waratah Tools > Send TEST Report"
- **Severity:** LOW
- **Doc location:** `03-integration-pipeline.md:436`
- **Claim:** Menu item "Waratah Tools > Send TEST Report".
- **Code reality:** Real menu item is "Export & Email (TEST to me)" → `exportAndEmailPDF_TestToSelf` (`MenuWaratah.js:116`).
- **Evidence:** `MenuWaratah.js:115–117`.
- **Recommended fix:** Update label to match actual menu.

### Finding D3-15: "Step 3 (warehouse) is the one blocking integration. Steps 4-9 are non-blocking"
- **Severity:** HIGH
- **Doc location:** `03-integration-pipeline.md:28`
- **Claim:** Warehouse is the only blocking step.
- **Code reality:** In `continueExport`, even the warehouse step is wrapped in a `runIntegrations(sheetName)` call that just logs warnings — the entire pipeline continues regardless of warehouse outcome (`NightlyExportWaratah.js:225–235`). PDF generation is the actual blocking step (`:311`: `if (!pdfBlob) return { success: false, message: ... }`). Earlier blocking happens via `validateShiftBeforeExport_` at `exportAndEmailPDF` (`:385–393`).
- **Evidence:** `NightlyExportWaratah.js:225–235, 311, 385–393`.
- **Recommended fix:** Re-describe blocking semantics: pre-export validation (M5) blocks on errors; PDF failure blocks at the dialog return; everything else is non-blocking with warnings collected into the warnings array and DM'd to Evan via `_notifyExportWarnings_`.

### Finding D3-16: Webhook table — `SLACK_MANAGERS_CHANNEL_WEBHOOK` "shared with Task Management project"
- **Severity:** UNVERIFIED
- **Doc location:** `03-integration-pipeline.md:272`
- **Claim:** Shared between SR and TM projects.
- **Code reality:** Property is listed in `_SETUP_ScriptProperties.js:56, 140` for SR project. Its consumption in the SR project: not found by quick grep. Task management project consumption not audited in detail. Marked unverified.

---

## Unverified Claims

### UD-1: "Aug 17 cash reconciliation columns W/X/Y added on May 17"
- **Doc location:** `01-architecture-and-data-flow.md:15`
- **Status:** Code shows V/W/X carry CashCounted/ExpectedCash/CashVariance, Y is LoggedAt. Doc statement that W/X/Y are the cash recon cols is **wrong** (the cols are V/W/X), but the May 17 cutover claim itself is supported by code comments. Logged as informational.

### UD-2: README "Phase 4 Complete (2026-05-17)" archive list (9 + 3 = 12 files)
- **Doc location:** `README.md:88–92`
- **Status:** Filesystem state — out of scope for this code-vs-doc audit.

### UD-3: README claim "trigger destruction recovery"
- **Doc location:** `README.md:19`
- **Status:** Procedure not yet covered in any doc within audit scope.

### UD-4: "Sakura's cell map uses the same {DAY}_SR_{Suffix} convention"
- **Doc location:** `02-cell-reference-and-field-config.md:306`
- **Status:** Sakura code not in audit scope.

### UD-5: "All 5 active service days have exactly the same FIELD_CONFIG bindings"
- **Doc location:** Implicit throughout 02
- **Status:** SETUP_FIELD_CONFIG `activeOnly: true` applies to WED–SUN identically. Verified at SETUP level; runtime per-sheet diagnostic would confirm.

### UD-6: AI Insights "M2 anomaly detection / M3 classification / M5 insight" naming
- **Doc location:** None in these docs (but mentioned in CLAUDE.md history)
- **Status:** AI module monikers (M1–M5) are not in the developer docs but in the AIInsights file comments. If the dev docs are extended to cover AI, these labels need explicit definition.

---

## Severity Summary by Doc

| File | Critical | High | Medium | Low | Unverified |
|---|---|---|---|---|---|
| README.md | 1 | 0 | 1 | 2 | 1 |
| 01-architecture-and-data-flow.md | 4 | 5 | 4 | 2 | 1 |
| 02-cell-reference-and-field-config.md | 6 | 2 | 3 | 2 | 2 |
| 03-integration-pipeline.md | 7 | 5 | 1 | 1 | 2 |
| **Totals** | **18** | **12** | **9** | **7** | **6** |

(Slight reclassification from the headline summary as duplicates from same root cause were grouped; the headline counts reflect findings IDs.)

## Highest-Priority Fixes

1. **All four docs report "36 fields" — actual is 39.** Update every "36" reference (D0-1, D1-1, D2-1, D2-2, D2-12).
2. **Doc 02 FIELD_CONFIG sample uses wrong attribute keys (`namedRangeSuffix`/`fallbackCell` instead of `suffix`/`fallback`).** Developers copy-pasting this will write broken code (D2-10).
3. **Doc 02 helper signatures are reversed.** Real `getFieldValue(sheet, fieldKey)` not `(fieldKey, sheet)` (D2-7).
4. **Doc 03 invents seven function names (`syncToCashReconciliation_`, `buildSlackBlockKit_`, `postToSlackChannels_`, `postToSlackDMs_`, `generatePdfAndEmail_`, `composeShiftReportEmail_`, `pushTodosToMaster_`)** that do not exist (D3-2, D3-7, D3-8, D3-10, D3-11, D3-12).
5. **Doc 03 Section 5 (Cash Reconciliation Sync) is wholly fabricated.** No external recon workbook exists (D3-7).
6. **Doc 02 BATCH_RANGES_BY_SHEET constant doesn't exist** (D2-17).
7. **Doc 02 Quick Lookup Table is largely wrong** — multiple field keys and warehouse columns are incorrect (D2-18).
8. **Doc 01 daily maintenance trigger time is 06:00 not 07:00** (D1-5).
9. **Doc 03 validation rules table includes rules that don't exist in code** (D3-6).
10. **Doc 01 Slack DM claim ("DMs to 6 staff" in nightly export) is wrong** — nightly export posts to one webhook only (D1-10, D3-9).
