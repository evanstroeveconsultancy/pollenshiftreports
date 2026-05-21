# Tier 2: Managers — Documentation Accuracy Audit

## Files Reviewed
- docs/waratah/for-managers/README.md
- docs/waratah/for-managers/01-shift-reports.md
- docs/waratah/for-managers/02-task-management.md
- docs/waratah/for-managers/03-weekly-automation.md
- docs/waratah/for-managers/04-staff-and-recipients.md
- docs/waratah/for-managers/05-troubleshooting.md

## Code Sources Consulted
- THE WARATAH/SHIFT REPORT SCRIPTS/MenuWaratah.js (full, 282 lines)
- THE WARATAH/SHIFT REPORT SCRIPTS/RunWaratah.js (FIELD_CONFIG block, ~lines 1–100, plus grep audit; 1134 lines total)
- THE WARATAH/SHIFT REPORT SCRIPTS/NightlyExportWaratah.js (1–250, 355–500, 760–990; 1175 lines total)
- THE WARATAH/SHIFT REPORT SCRIPTS/IntegrationHubWaratah.js (480–540 and grep; 1216 lines total)
- THE WARATAH/SHIFT REPORT SCRIPTS/WeeklyRolloverInPlaceWaratah.js (1–250, 405–560; 879 lines total)
- THE WARATAH/SHIFT REPORT SCRIPTS/WeeklyDigestWaratah.js (full, 191 lines)
- THE WARATAH/SHIFT REPORT SCRIPTS/TaskIntegrationWaratah.js (full, 59 lines)
- THE WARATAH/SHIFT REPORT SCRIPTS/_SETUP_ScriptProperties.js (full, 280 lines)
- THE WARATAH/TASK MANAGEMENT SCRIPTS/Menu_Updated_Waratah.gs (full, 238 lines)
- THE WARATAH/TASK MANAGEMENT SCRIPTS/EnhancedTaskManagementWaratah.gs (lines 80–330, 1060–1260, 1530–1870, 2056–2310; 2384 lines total)
- THE WARATAH/TASK MANAGEMENT SCRIPTS/TaskDashboardWaratah.gs (grep only)
- Cross-reference greps: `sendShiftReportBasic`, `openTaskManager`, `openExportDashboard`, `STAFF_LIST`, `Status History`, `daysBeforeArchive`

## Findings Summary
- Critical: 7
- High: 21
- Medium: 11
- Low: 4
- Unverified: 5

---

## Findings — for-managers/README.md

### Finding M0-1: Glossary defines "9-Status Workflow" but the README in line 7 says "five files plus this one"
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/README.md:7
- **Claim (exact quote):** "This directory holds the manager-tier documentation in five files plus this one."
- **Code reality:** N/A — file-count claim. README + 5 files = 6 files total. Correct.
- **Evidence:** filesystem listing
- **Recommended fix:** No change needed; flag retained only for record.

### Finding M0-2: "9-Status Workflow" naming inconsistency between README and 02-task-management.md
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/README.md:55
- **Claim (exact quote):** "**9-Status Workflow** | The nine task states a task can move through: NEW, TO DO, IN PROGRESS, TO DISCUSS, BLOCKED, DEFERRED, DONE, CANCELLED, RECURRING."
- **Code reality:** Confirmed nine statuses in code. Counts match. But sibling file 02-task-management.md is titled "The 9-Status Workflow" yet 02 line 19 says "9-state workflow (Section 4)" — terminology is fine, just inconsistent (workflow vs state vs status). Glossary lists nine states correctly.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:155-165` — `STATUSES` object has 9 entries
- **Recommended fix:** Note also that 02-task-management.md line 19 calls this "a 9-state workflow" while the section header (line 51) and README glossary call it "9-Status". Standardise to "9-Status Workflow" throughout.

### Finding M0-3: Auto-escalation glossary description partly correct, partly speculative
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/README.md:57
- **Claim (exact quote):** "The system automatically sends a Slack alert and email when a task has been BLOCKED for more than 14 days. The escalation recipient is configured in Script Properties (`ESCALATION_EMAIL` and `ESCALATION_SLACK_WEBHOOK`)."
- **Code reality:** Confirmed. `escalateBlockedTasks_()` uses `TASK_CONFIG.escalation.blockedDaysBeforeEscalate = 14`. Sends Slack to `ESCALATION_SLACK_WEBHOOK` and email to `ESCALATION_EMAIL`. Correct.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:97` `blockedDaysBeforeEscalate: 14`; `EnhancedTaskManagementWaratah.gs:1142-1151` send paths.
- **Recommended fix:** No change. (Cited here for completeness.)

### Finding M0-4: Phase reference to legacy files in lines 71–74 — verify file existence
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/README.md:71-74
- **Claim (exact quote):** Lists `docs/waratah/explainers/02-INTERMEDIATE-How-The-System-Works.md` and three "FILE EXPLAINERS" sources
- **Code reality:** Per git status those four legacy files have been moved/renamed to `docs/waratah/_archive/`. Source-path references in this README still point to the pre-archive paths.
- **Evidence:** git status (conversation context) shows renames such as `docs/waratah/explainers/02-INTERMEDIATE-…` → `docs/waratah/_archive/…`.
- **Recommended fix:** Update the four paths to their `_archive/` locations or note that the legacy paths no longer exist.

---

## Findings — for-managers/01-shift-reports.md

### Finding M1-1: "Send Shift Report" menu item does NOT exist
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:52, 79, 83, and elsewhere referenced as "Send Shift Report"
- **Claim (exact quote):** Table at line 52 says "LIVE (Send Shift Report)"; line 83 says menu item is "Send Shift Report".
- **Code reality:** Actual menu item is `Export & Email PDF (LIVE)` calling `exportAndEmailPDF`. There is no "Send Shift Report" menu item.
- **Evidence:** `MenuWaratah.js:115` — `.addItem('Export & Email PDF (LIVE)', 'exportAndEmailPDF')`
- **Recommended fix:** Replace every "Send Shift Report" with "Export & Email PDF (LIVE)". Note the actual function name is `exportAndEmailPDF`.

### Finding M1-2: "Send TEST Report" menu item does NOT exist
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:53, 84
- **Claim (exact quote):** Line 53 "TEST (Send TEST Report)"; line 84 "Send TEST Report".
- **Code reality:** Actual menu item is `Export & Email (TEST to me)` calling `exportAndEmailPDF_TestToSelf`.
- **Evidence:** `MenuWaratah.js:116` — `.addItem('Export & Email (TEST to me)', 'exportAndEmailPDF_TestToSelf')`
- **Recommended fix:** Replace with "Export & Email (TEST to me)".

### Finding M1-3: Menu hierarchy is flat in doc but actually wrapped in "Daily Reports" submenu
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:77-89
- **Claim (exact quote):** "Open the shift report spreadsheet, then click **The Waratah Tools** in the top menu bar. Daily managers see: | Menu item | ..."
- **Code reality:** Menu name is "Waratah Tools" (no "The"). All daily items live inside a `Daily Reports` submenu, not at top level. Admin items live inside `Admin Tools` submenu (or `⚠ Admin Tools` if triggers missing).
- **Evidence:** `MenuWaratah.js:112` `ui.createMenu('Waratah Tools')`; `MenuWaratah.js:114` `.addSubMenu(ui.createMenu('Daily Reports')`.
- **Recommended fix:** Drop the "The" from "The Waratah Tools". Restructure Section 5 to show `Waratah Tools > Daily Reports > [item]` paths.

### Finding M1-4: "Open Task Manager" listed in Waratah Tools menu — does NOT exist there
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:86
- **Claim (exact quote):** "| Open Task Manager | Opens the Task Management spreadsheet in a new tab | When you need to look at outstanding tasks |"
- **Code reality:** `Open Task Manager` only exists in the Task Management spreadsheet's `Task Management` menu, NOT in the shift report's `Waratah Tools` menu.
- **Evidence:** `Menu_Updated_Waratah.gs:170` `.addItem('Open Task Manager', 'openTaskManager')`; absent from `MenuWaratah.js`. `openTaskManager` defined in `THE WARATAH/TASK MANAGEMENT SCRIPTS/UIServerWaratah.gs:13`.
- **Recommended fix:** Remove from the Section 5 table, or relabel it as "in the Task Management spreadsheet".

### Finding M1-5: "Refresh Dashboard" listed in Waratah Tools — does NOT exist
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:87
- **Claim (exact quote):** "| Refresh Dashboard | Re-runs the analytics dashboard calculations | When dashboard numbers look stale |"
- **Code reality:** No "Refresh Dashboard" item in Waratah Tools. Closest is `Admin Tools > Analytics > Build Financial Dashboard` / `Build Executive Dashboard` / `Open Analytics Viewer` (all password-gated). Task Mgmt has `Refresh Staff Workload Stats` — different sheet, different menu, different function.
- **Evidence:** `MenuWaratah.js:147-149` — Analytics submenu items. `Menu_Updated_Waratah.gs:179` for Refresh Staff Workload Stats.
- **Recommended fix:** Remove from the table or replace with the actual menu items.

### Finding M1-6: "View Current PDF Preview" — FABRICATED, does not exist anywhere
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:88
- **Claim (exact quote):** "| View Current PDF Preview | Generates and previews the current day's PDF without sending | When you want to check formatting before send |"
- **Code reality:** No such menu item or function in either GAS project. Closest is `Daily Reports > Open Export Dashboard` (`openExportDashboard`), which opens an HTML side panel, not a PDF preview.
- **Evidence:** `MenuWaratah.js:119` `.addItem('Open Export Dashboard', 'openExportDashboard')`. Grep of repo finds zero matches for "PDF Preview".
- **Recommended fix:** Delete this row entirely.

### Finding M1-7: Missing menu item — "Send Basic Report" listed but underlying function does NOT exist
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:85
- **Claim (exact quote):** "| Send Basic Report | Stripped-down emergency send (no Slack, no warehouse, no task sync) | Only when the main Send fails repeatedly; alert Evan after using this |"
- **Code reality:** The menu item exists at `MenuWaratah.js:117` and is wired to `sendShiftReportBasic`, but `sendShiftReportBasic` is **not defined anywhere in the codebase**. Clicking it would throw an Apps Script error. (Code-level bug, but managers should not be told to use a broken item.)
- **Evidence:** `MenuWaratah.js:117` `.addItem('Send Basic Report', 'sendShiftReportBasic')`. `grep -rn "function sendShiftReportBasic" THE\ WARATAH/` returns no matches.
- **Recommended fix:** Either flag this as a known-broken item in the doc, or remove the row until the function is implemented. (This is also a CODE bug to file with developers.)

### Finding M1-8: "Open Export Dashboard" menu item missing from the docs entirely
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:Section 5
- **Claim (exact quote):** Section 5 table omits the actual "Open Export Dashboard" entry.
- **Code reality:** Real menu has `Daily Reports > Open Export Dashboard` which opens an HTML side panel.
- **Evidence:** `MenuWaratah.js:119` `.addItem('Open Export Dashboard', 'openExportDashboard')`.
- **Recommended fix:** Add a row documenting this.

### Finding M1-9: Pipeline described as "nine sequential steps" — internally consistent but speculative; code is non-linear
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:28-38
- **Claim (exact quote):** "The pipeline runs nine sequential steps: 1. Read tonight's data ... 9. Sync tasks to Task Management."
- **Code reality:** The pipeline in `continueExport()` and `exportAndEmailPDF()` does not enumerate as nine discrete steps. The actual code: (a) validates `validateShiftBeforeExport_`, (b) shows checklist dialog, (c) `continueExport`: runIntegrations (warehouse write happens here, before Slack), AI insights, post-to-Slack, push TO-DOs to Master Actionables, generate PDF, send email. Order is: warehouse → AI → Slack → tasks → PDF → email. Doc has these in wrong order (Slack before warehouse, tasks last) and the count of 9 is invented.
- **Evidence:** `NightlyExportWaratah.js:172-345` (continueExport function). Comments at top of `exportAndEmailPDF` (line 355) list 6 steps: "1. Blocks export on instruction tabs. 2. Rebuilds 'TO-DOs' sheet from WED–SUN tabs. 3. Posts formatted nightly summary + To-Dos to Slack. 4. Pushes TO-DOs to Master Actionables Sheet. 5. Generates a one-tab PDF. 6. Emails the PDF to full Waratah distro."
- **Recommended fix:** Either rewrite to match the actual 6-step process from the code header comment, or remove specific step-count claims and describe behaviour qualitatively.

### Finding M1-10: "30 seconds" duration claim — UNVERIFIED
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:26
- **Claim (exact quote):** "...the system runs an end-to-end pipeline in about 30 seconds."
- **Code reality:** No measured duration in code. May be reasonable empirically, but no source.
- **Evidence:** None.
- **Recommended fix:** Mark UNVERIFIED. Soften to "typically completes within tens of seconds" or remove.

### Finding M1-11: "six staff with personal DM webhooks (Evan, Cynthia, Adam, Jaiden, Joffy, Nick)" — claim is consistent across docs
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:35
- **Claim (exact quote):** "as direct messages to the six staff with personal DM webhooks (Evan, Cynthia, Adam, Jaiden, Joffy, Nick)"
- **Code reality:** Cannot verify the actual webhook keys because they live in Script Properties (`SLACK_DM_WEBHOOKS`). The shift report nightly pipeline (`postToSlackFromSheet`) posts to the LIVE webhook only; it does NOT iterate the DM map for nightly send. DM map is used by Task Management weekly summary and overdue notifications.
- **Evidence:** `NightlyExportWaratah.js:764-988` (postToSlackFromSheet) — single webhookUrl parameter, no DM iteration. `EnhancedTaskManagementWaratah.gs:1798` reads `getSlackDmWebhooks_()` in task DM logic.
- **Recommended fix:** Either remove the claim that the nightly send DMs the six people, or verify against current Script Properties JSON. The DM list is task-related, not shift-report-related at send time.

### Finding M1-12: "Email the PDF. Sent to the five configured recipients (Evan, Cynthia, Nick, Ian, Adam)" — recipient count and Ian inclusion contradict other docs
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:36
- **Claim (exact quote):** "Sent to the five configured recipients (Evan, Cynthia, Nick, Ian, Adam)."
- **Code reality:** Recipients come from Script Property `WARATAH_EMAIL_RECIPIENTS`; count/names cannot be definitively verified from code. But doc 04-staff-and-recipients.md and project CLAUDE.md both say SIX recipients (Evan, Cynthia, Nick, Chef, Howie, Adam). Both lists differ: 01 says 5 with "Ian"; 04 says 6 with "Chef" and "Howie". "Ian" is not in `STAFF_LIST` and is not mentioned elsewhere in the project. Almost certainly a hallucination.
- **Evidence:** `_SETUP_ScriptProperties.js:39-43` shows the property structure but uses placeholder values. CLAUDE.md (project root, lines around "WARATAH_EMAIL_RECIPIENTS") says 6 managers (Evan, Cynthia, Nick, Chef, Howie, Adam). `docs/waratah/for-managers/04-staff-and-recipients.md:42-48` agrees with 6 + Chef + Howie.
- **Recommended fix:** Change to "the six configured recipients (Evan, Cynthia, Nick, Chef, Howie, Adam)" and remove "Ian".

### Finding M1-13: "Backfill Entire Week to Warehouse" — menu item name wrong
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:42
- **Claim (exact quote):** "run a backfill the next morning from **Waratah Tools > Admin Tools > Backfill Entire Week to Warehouse**."
- **Code reality:** Actual item is `Admin Tools > Data Warehouse > Backfill This Sheet to Warehouse` (function `pw_backfillShiftToWarehouse`). No "Backfill Entire Week to Warehouse" item exists. There is a weekly automated `runWeeklyBackfill_` (no UI). For TO-DOs there is `Admin Tools > Setup & Utilities > Backfill TO-DOs (All Days)`.
- **Evidence:** `MenuWaratah.js:153` `.addItem('Backfill This Sheet to Warehouse', 'pw_backfillShiftToWarehouse')`; line 166 `.addItem('Backfill TO-DOs (All Days)', 'pw_backfillAllDaysTodos')`. Grep finds no "Backfill Entire Week".
- **Recommended fix:** Correct the menu path. Note that this also routes through `Admin Tools > Data Warehouse > ...`, not direct under Admin Tools.

### Finding M1-14: "the system reads every input field ... cash counts, financial figures, narrative notes, tasks, wastage and incident fields" — broadly accurate
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:30
- **Claim (exact quote):** "1. **Read tonight's data.** The code reads every input field on the day's tab..."
- **Code reality:** Code does read these fields. Accurate at a high level.
- **Evidence:** `RunWaratah.js` `FIELD_CONFIG` has 39 keys covering till counts, financial fields, narratives, todos, wastage, RSA, etc.
- **Recommended fix:** None required.

### Finding M1-15: "36 field config, 197 named ranges" — incorrect field count
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:117
- **Claim (exact quote):** "**36 field config, 197 named ranges.**"
- **Code reality:** A direct count of top-level entries in `FIELD_CONFIG` returns 39, not 36. The header comment at `RunWaratah.js:38` says "36 fields", contradicting the actual count. The "197 named ranges" comes from 5 days × 39 fields = 195 (or 5 × 36 = 180), but the comment's own arithmetic is unclear.
- **Evidence:** `awk` count of FIELD_CONFIG entries = 39; `RunWaratah.js:38` comment "Layout version: new sheet (live May 2026) — 36 fields." `namedRangeHealthCheck_Waratah` line 959: `EXPECTED_TOTAL = VALID_DAY_PREFIXES.length * Object.keys(FIELD_CONFIG).length;` — so expected is 5 × actual_field_count. With 39 fields that's 195, not 197.
- **Recommended fix:** Verify the true count against the live sheet. Likely the doc should say "39 fields, 195 named ranges" (or correct whichever number is wrong). Mark UNVERIFIED until reconciled.

### Finding M1-16: Re-sync tasks menu item — FABRICATED
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md → cross-link only; same fabrication appears in 02-task-management.md:319-321
- **Claim (exact quote):** Per 02-task-management.md:320: "Run **Waratah Tools > Re-sync Tasks** (requires admin password)."
- **Code reality:** No "Re-sync Tasks" menu item exists. Closest is `Admin Tools > Setup & Utilities > Backfill TO-DOs (All Days)` (function `backfillAllDaysTodos`).
- **Evidence:** `MenuWaratah.js:166` `.addItem('Backfill TO-DOs (All Days)', 'pw_backfillAllDaysTodos')`. No menu item named "Re-sync Tasks".
- **Recommended fix:** Replace with the correct menu path or function name.

### Finding M1-17: "Triggers may not yet be installed" — accurate transitional statement
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:118
- **Claim (exact quote):** "As of Phase 1.3 the new system has not yet had its scheduled triggers re-installed."
- **Code reality:** Consistent with `MenuWaratah.js:97-110` which shows the `Admin Tools` label flips to `⚠ Admin Tools` when triggers are missing — confirming the doc's framing.
- **Evidence:** `MenuWaratah.js:97-110`
- **Recommended fix:** None.

---

## Findings — for-managers/02-task-management.md

### Finding M2-1: "9-state workflow" vs "9-Status Workflow" terminology
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/02-task-management.md:19, 51
- **Claim (exact quote):** Line 19 "a 9-state workflow (Section 4)"; line 51 "## 4. The 9-Status Workflow"
- **Code reality:** Status names match code exactly. Just internal terminology inconsistency.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:155-165` (STATUSES object).
- **Recommended fix:** Use one term consistently. "9-Status" matches the code constant `STATUSES`.

### Finding M2-2: Section 4 status colour for TO DO claims "White"
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/02-task-management.md:60
- **Claim (exact quote):** "| **TO DO** | Triaged, owner assigned, ready to start | White |"
- **Code reality:** TO DO colour is `#ff6d01` (Orange), not white.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:193` `[STATUSES.TODO]: "#ff6d01",       // Orange`
- **Recommended fix:** Change "White" to "Orange".

### Finding M2-3: Section 4 status colour for IN PROGRESS claims "Yellow"
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/02-task-management.md:61
- **Claim (exact quote):** "| **IN PROGRESS** | Actively being worked on | Yellow |"
- **Code reality:** Yellow (`#fbbc04`) — matches.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:194`
- **Recommended fix:** None.

### Finding M2-4: Section 4 status colour for DEFERRED claims "Orange"
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/02-task-management.md:64
- **Claim (exact quote):** "| **DEFERRED** | Postponed to a specific date; will auto-return to TO DO when that date arrives | Orange |"
- **Code reality:** Orange (`#ff6d01`) — colour matches. But the "auto-return to TO DO when that date arrives" behaviour is NOT implemented (see M2-7).
- **Evidence:** `EnhancedTaskManagementWaratah.gs:197`
- **Recommended fix:** Keep colour; remove auto-return claim.

### Finding M2-5: Section 4 status RECURRING colour claim "Light green"
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/02-task-management.md:65
- **Claim (exact quote):** "| **RECURRING** | A template task that regenerates itself on a cadence | Light green |"
- **Code reality:** Purple (`#a142f4`), not light green.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:200` `[STATUSES.RECURRING]: "#a142f4"   // Purple`
- **Recommended fix:** Change to "Purple".

### Finding M2-6: Section 4 NEW colour "Light blue"
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/02-task-management.md:59
- **Claim (exact quote):** "| **NEW** | Just arrived, not yet triaged | Light blue |"
- **Code reality:** Blue (`#4285f4`) — close enough. STATUS_EMOJI is 🔵 (blue circle).
- **Evidence:** `EnhancedTaskManagementWaratah.gs:192`
- **Recommended fix:** None required.

### Finding M2-7: "A DEFERRED task's hold-until date arrives | Status auto-transitions back to TO DO" — FABRICATED behaviour
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/02-task-management.md:102, 248-250
- **Claim (exact quote):** Line 102: "| A DEFERRED task's hold-until date arrives | Status auto-transitions back to TO DO |"; line 249-250: "Set Hold-Until date (column N). The system will auto-transition the task back to TO DO on that date."
- **Code reality:** No auto-transition logic exists. There is no "Hold-Until" column N. The actual column N is `UPDATED_BY` (per `COLS` definition). The 14-column schema is: A=Priority, B=Status, C=Staff, D=Area, E=Description, F=Due Date, G=Date Created, H=Date Completed, I=Days Open, J=Blocker Notes, K=Source, L=Recurrence, M=Last Updated, N=Updated By. No "Hold-Until" exists. `runDailyTaskMaintenance` does not auto-progress DEFERRED tasks.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:112-127` (COLS); `EnhancedTaskManagementWaratah.gs:1579-1607` (runDailyTaskMaintenance — no DEFERRED auto-transition step).
- **Recommended fix:** Remove the "auto-transition back to TO DO" claim and the "Hold-Until date (column N)" instruction. DEFERRED is manual-only.

### Finding M2-8: "Bi-hourly status cleanup ... auto-progresses DEFERRED tasks past their hold dates" — FABRICATED
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/02-task-management.md:134; 03-weekly-automation.md:142
- **Claim (exact quote):** "| **Bi-hourly status cleanup** | Every 2 hours during business hours | Validates Status column, advances DEFERRED tasks past their hold date, ensures dropdowns stay consistent |"
- **Code reality:** Bi-hourly trigger runs `cleanupAndSortMasterActionables` which removes empty rows and re-sorts. It does NOT advance DEFERRED tasks. Also, it is not "during business hours" — `everyHours(2)` runs around the clock.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1963-1984` `createBiHourlyCleanupTrigger` → `cleanupAndSortMasterActionables` (sort+removeEmptyRows only); `EnhancedTaskManagementWaratah.gs:499` `cleanupAndSortMasterActionables` function body.
- **Recommended fix:** Rewrite to: "Every 2 hours: removes blank rows and re-sorts tasks by Active/Priority/Status/Staff."

### Finding M2-9: Recurring task generates "with new dates and resets status" — partial accuracy
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/02-task-management.md:103, 155
- **Claim (exact quote):** "| A RECURRING task is marked DONE | A new instance is generated with the next due date |"; line 155: "Each instance is a separate row with its own Status, so you can have a DONE instance and a TO DO instance simultaneously."
- **Code reality:** Confirmed: `processRecurringTasks_` runs daily via `runDailyTaskMaintenance` for DONE tasks with recurrence set. Creates new row with Status=TO DO. Old row's recurrence is reset to "None" (line 1276). So you do NOT have both rows with the same recurrence flag — the original loses its template status.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1207-1276` (processRecurringTasks_).
- **Recommended fix:** Section 8 "Setting up a recurring task" advises `Status = RECURRING`. But code only regenerates `DONE` tasks with Recurrence set, not RECURRING-status tasks (line 1228 `if (status !== STATUSES.DONE) return;`). The doc claim "Set Status = RECURRING" then "system generates next instance when current one is marked DONE" is partially right but mixes two pieces of state. Rewrite Section 8 to match: set Recurrence column to Weekly/Fortnightly/Monthly; when you mark the task DONE, next instance is auto-generated with Status TO DO.

### Finding M2-10: "Setting up a recurring task ... Set Recurrence (column M)" — wrong column
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/02-task-management.md:152
- **Claim (exact quote):** "Set Recurrence (column M) to one of: Weekly, Fortnightly, Monthly."
- **Code reality:** Recurrence is column L (zero-indexed 11), not M. Column M is "Last Updated".
- **Evidence:** `EnhancedTaskManagementWaratah.gs:124` `RECURRENCE: 11,      // L: Recurrence`; line 125 `LAST_UPDATED: 12,    // M: Last Updated`.
- **Recommended fix:** Change to "column L".

### Finding M2-11: Section 7 daily 6am and 7am triggers — two separate triggers claimed; reality is different
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/02-task-management.md:135-137
- **Claim (exact quote):** "| **Daily 6am staff workload refresh** | Daily at 6am | Recalculates each staff member's open task count for the dashboard | **Daily 7am task maintenance** | Daily at 7am | Due-date checks, BLOCKED escalation checks, recurring task generation |"
- **Code reality:** `createDailyMaintenanceTrigger` schedules `runDailyTaskMaintenance` for `atHour(6)` (line 1864-1866; comment says "6-7am daily"). `createDailyStaffWorkloadTrigger` also schedules `atHour(6)` for staff workload. So both run at 6am, not 6am and 7am.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1866` `.atHour(6).everyDays(1)`; line 2104 `.atHour(6).everyDays(1)`.
- **Recommended fix:** Correct times. Both triggers fire at 6am (not 6am vs 7am). Note the actual order is non-deterministic since two triggers share the hour.

### Finding M2-12: "Monday 6am Weekly Task Archive" — confirmed
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/02-task-management.md:137
- **Claim (exact quote):** "| **Monday 6am weekly archive** | Weekly | Moves DONE and CANCELLED tasks older than 7 days to the Archive tab |"
- **Code reality:** Day and time correct, but "older than 7 days" is wrong — archive cutoff is 30 days.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:2123-2134` `createWeeklyArchiveTrigger` — Monday 6am ✓; line 103 `daysBeforeArchive: 30  // 1 month` — 30 days, not 7.
- **Recommended fix:** Change "older than 7 days" to "older than 30 days".

### Finding M2-13: "DONE tasks stay on the active list for 7 days before the Monday 6am archive" — same 7-day error
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/02-task-management.md:342
- **Claim (exact quote):** "DONE tasks stay on the active list for 7 days before the Monday 6am archive moves them."
- **Code reality:** 30 days, per `daysBeforeArchive: 30`.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:103`
- **Recommended fix:** Change "7 days" to "30 days".

### Finding M2-14: "Monday 10am weekly summary" channel post — DM-only
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/02-task-management.md:138, 175
- **Claim (exact quote):** Line 138: "| **Monday 10am weekly summary** | Weekly | Sends each staff member a Slack DM with their open tasks for the week |"; line 175 says "Monday 10am weekly summary | DM to each staff with personal webhook | Six recipients".
- **Code reality:** `sendWeeklyActiveTasksSummary` runs Monday 10am. Channel post was REMOVED in April 2026 ("Apr 2026" comment at line 1777). It now only sends DMs. The function still computes a channel-style block-kit message and logs "channel post skipped". The doc says it's DM-only — correct.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1777-1786` "Channel post removed — weekly summary now DM-only (Apr 2026)".
- **Recommended fix:** No change required for this claim; flagged for record.

### Finding M2-15: Slack notification scenario "A new task is assigned to a person | DM to the assignee" — FABRICATED
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/02-task-management.md:171
- **Claim (exact quote):** "| A new task is assigned to a person | DM to the assignee | Just the assignee |"
- **Code reality:** No such DM is sent on task creation/assignment. `createTask` does NOT trigger a DM. `handleStatusChange_` does not DM either. DMs are sent only via: (a) weekly summary, (b) overdue summary (also removed?), (c) BLOCKED >14d escalation.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:2197-2238` (createTask — only writes row, logs audit, no DM). `EnhancedTaskManagementWaratah.gs:1537-1568` (handleStatusChange_ — no DM dispatch).
- **Recommended fix:** Remove this row. Or implement the feature in code.

### Finding M2-16: "A task is marked URGENT | DM to the assignee" — FABRICATED
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/02-task-management.md:172, 124, 230
- **Claim (exact quote):** Line 124: "URGENT tasks trigger an immediate Slack DM to the assignee, not just the weekly summary." Line 172: "| A task is marked URGENT | DM to the assignee | ..."; line 230: "If you raise to URGENT, the assignee gets a fresh DM."
- **Code reality:** No DM sent on URGENT priority change. URGENT only affects conditional formatting (red background) and sort order. No DM code path exists.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1472-1531` (onTaskSheetEditWithAutoSort — no priority-DM logic); whole codebase grep `URGENT.*DM` returns nothing.
- **Recommended fix:** Remove the URGENT-DM claim from Section 6, 9, and 11.

### Finding M2-17: "A task with a due date hits its due date | DM to the assignee" — Stale logic; overdue DM exists but uncertain whether scheduled
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/02-task-management.md:174
- **Claim (exact quote):** "| A task with a due date hits its due date | DM to the assignee | Just the assignee |"
- **Code reality:** `sendOverdueTasksDMs_` exists (line 1430), called by `sendOverdueTasksSummary_` (line 1347). However `sendOverdueTasksSummary_` is no longer wired into `runDailyTaskMaintenance` (line 1605 comment: "5. Overdue summary removed — was clogging management Slack channel (Apr 2026)"). And `runScheduledOverdueSummary` is a no-op (line 2056-2058). So in practice this DM is NOT being sent.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1605, 1347, 2056-2058`.
- **Recommended fix:** Remove this claim or mark it as "not currently running (Apr 2026)".

### Finding M2-18: Reassign task "previous assignee receives an 'unassigned' DM" — FABRICATED
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/02-task-management.md:223
- **Claim (exact quote):** "The previous assignee receives an 'unassigned from task X' DM; the new assignee receives an 'assigned task X' DM."
- **Code reality:** No such code path exists. `onTaskSheetEditWithAutoSort` audits changes but does not DM on staff changes.
- **Evidence:** grep "unassigned" returns no DM dispatcher.
- **Recommended fix:** Remove this row.

### Finding M2-19: Audit trail "Status History (last 5 status changes with timestamps)" — FABRICATED column
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/02-task-management.md:258-264
- **Claim (exact quote):** "Each row has hidden columns capturing: - Date Created - Created By (user email) - Date Last Modified - Modified By (user email) - Status History (last 5 status changes with timestamps)"
- **Code reality:** Schema has 14 columns. Visible: Priority, Status, Staff, Area, Description, Due Date, Date Created, Date Completed, Days Open, Blocker Notes, Source, Recurrence, Last Updated, Updated By. No hidden "Created By", no "Status History" column. There is a separate AUDIT LOG sheet (`ensureAuditLogSheet_`), which records changes. That is the audit trail; it is not a hidden column on the task row.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:112-127` (COLS) — 14 columns total. Lines 898-963 (audit log sheet — separate tab).
- **Recommended fix:** Replace this paragraph with a description of the separate AUDIT LOG sheet.

### Finding M2-20: "If running Reapply Dropdowns does not fix the issue" — wrong menu path elsewhere
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/02-task-management.md:213, line in 04 file is correct
- **Claim (exact quote):** Line 213: "Click the first empty row at the bottom (or use **Waratah Tools > New Task**)."
- **Code reality:** No "New Task" menu item exists in either sheet's menu.
- **Evidence:** Grep "New Task" across both menu files — no matches.
- **Recommended fix:** Remove "(or use **Waratah Tools > New Task**)". Just instruct user to type in next empty row.

### Finding M2-21: Section 14 "Run Waratah Tools > Re-sync Tasks (requires admin password)" — FABRICATED
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/02-task-management.md:320
- **Claim (exact quote):** "Run **Waratah Tools > Re-sync Tasks** (requires admin password)."
- **Code reality:** No "Re-sync Tasks" menu item. Closest = `Admin Tools > Setup & Utilities > Backfill TO-DOs (All Days)`.
- **Evidence:** `MenuWaratah.js:166`
- **Recommended fix:** Replace with the correct path.

### Finding M2-22: "Each instance is a separate row with its own Status, so you can have a DONE instance and a TO DO instance simultaneously" — half-true
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/02-task-management.md:155
- **Claim (exact quote):** "Each instance is a separate row with its own Status, so you can have a DONE instance and a TO DO instance simultaneously."
- **Code reality:** Confirmed at line 1252-1262: when DONE recurring task is processed, a new TO DO row is appended. The original stays DONE. So yes, DONE + TO DO co-exist briefly. But after Monday 6am archive (30 days later), the DONE row moves to Archive.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1252-1276`.
- **Recommended fix:** Add "(the DONE instance is archived after 30 days)".

### Finding M2-23: Section 2 table — Task Management tabs "Tasks + Archive + Staff Workload Summary + Dashboards"
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/02-task-management.md:30
- **Claim (exact quote):** "| Tabs | 5 day tabs (Wed to Sun) + Read Me + Task Management + Analytics + Executive Dashboard | Tasks + Archive + Staff Workload Summary + Dashboards |"
- **Code reality:** Actual sheet names per `TASK_CONFIG.sheets` are `MASTER ACTIONABLES SHEET`, `AUDIT LOG`, `ARCHIVE`. Plus dashboards built by `buildTaskDashboard()`. There is no "Staff Workload Summary" tab name in the constants; staff workload is rendered onto the Dashboard tab.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:85-89` sheet names.
- **Recommended fix:** Change Task Management tabs to "MASTER ACTIONABLES SHEET + Archive + AUDIT LOG + Dashboard". Also shift report tabs: real tabs are Wednesday/Thursday/Friday/Saturday/Sunday (+ Monday/Tuesday rename-only for visual consistency), plus Read Me/Analytics/etc — verify against the live sheet.

### Finding M2-24: Section 3 "From either spreadsheet, click The Waratah Tools > Open Task Manager"
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/02-task-management.md:40
- **Claim (exact quote):** "From either spreadsheet, click **The Waratah Tools > Open Task Manager**."
- **Code reality:** "Open Task Manager" only exists in the Task Management spreadsheet's `Task Management` menu (line 170 of Menu_Updated_Waratah.gs). Cannot be reached from the shift report spreadsheet at all.
- **Evidence:** `Menu_Updated_Waratah.gs:170`; absent from `MenuWaratah.js`.
- **Recommended fix:** Change to: "In the Task Management spreadsheet, click **Task Management > Open Task Manager**." Also drop the "The".

### Finding M2-25: "Task Dashboard tab ... updates automatically every 2 hours"
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/02-task-management.md:185
- **Claim (exact quote):** "The Task Dashboard tab in the Task Management spreadsheet is a one-screen overview. It updates automatically every 2 hours"
- **Code reality:** Bi-hourly trigger calls `cleanupAndSortMasterActionables` only — that does NOT rebuild the dashboard. Dashboard rebuild is a separate menu action (`buildTaskDashboard`). The staff workload data behind the dashboard refreshes daily at 6am via `runScheduledStaffWorkload`, not every 2 hours.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1963-1984` (bi-hourly = sort/cleanup). `EnhancedTaskManagementWaratah.gs:2095-2116` (daily 6am staff workload).
- **Recommended fix:** Change to "Staff workload data refreshes daily at 6am; the dashboard layout is rebuilt manually via Admin Tools > Dashboard."

### Finding M2-26: Bullet "A simple trend chart of open task count over the last 8 weeks" — UNVERIFIED
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/02-task-management.md:194
- **Claim (exact quote):** "A simple trend chart of open task count over the last 8 weeks"
- **Code reality:** Did not exhaustively read `TaskDashboardWaratah.gs`. `buildTaskDashboard` and `buildSLASection_` are present (line 23, 459). Chart may or may not be implemented.
- **Evidence:** Grep only.
- **Recommended fix:** Mark UNVERIFIED. Verify against `buildTaskDashboard()` body.

### Finding M2-27: Source list "From shift reports / From meetings / Ad-hoc"
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/02-task-management.md:14-17
- **Claim (exact quote):** "From shift reports ... From meetings ... Ad-hoc."
- **Code reality:** Matches code: `SOURCES = ["Shift Report", "Meeting", "Ad-hoc"]`.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:260-264`.
- **Recommended fix:** None.

### Finding M2-28: Section 6 "Priority Levels" — five priorities matches code; defaults to MEDIUM matches
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/02-task-management.md:114-122
- **Claim (exact quote):** Five priorities URGENT/HIGH/MEDIUM/LOW/ONE DAY.
- **Code reality:** Matches `PRIORITY_LIST` at line 231-237. Default from `createTask` is `PRIORITIES.MEDIUM` (line 2213).
- **Evidence:** As cited.
- **Recommended fix:** None.

### Finding M2-29: "Area = blank initially (can be filled in Task Management)" — wrong default
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/02-task-management.md:104, 303
- **Claim (exact quote):** Line 104: "Area = blank initially (can be filled in Task Management)"; line 303: "Area = blank".
- **Code reality:** `appendShiftReportTodos` passes `area: "General"` (line 2257), so the row is created with Area = "General", not blank.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:2257`.
- **Recommended fix:** Change "blank" to "General" (the default; can be changed).

---

## Findings — for-managers/03-weekly-automation.md

### Finding M3-1: Monday 2am Weekly Backfill — wrong time
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:15
- **Claim (exact quote):** "| Mon | 2am | **Weekly Backfill** | Re-pushes any missed nightly data into the warehouse |"
- **Code reality:** Trigger is Monday 8am (atHour(8)), per `setupAllTriggers_Waratah`. No 2am trigger exists.
- **Evidence:** `MenuWaratah.js:243-248` — `.onWeekDay(MONDAY).atHour(8).nearMinute(0)`.
- **Recommended fix:** Change "2am" to "8am". Update Section 8 likewise.

### Finding M3-2: Monday 4pm Revenue Digest — wrong day AND wrong time
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:18, also 01:17 and elsewhere
- **Claim (exact quote):** "| Mon | 4pm | **Revenue Digest** | Posts the week's revenue summary to Slack |"
- **Code reality:** Two conflicting trigger functions exist in code. `setupAllTriggers_Waratah` schedules **Wednesday 8am** (`MenuWaratah.js:251-256`). But `setupWeeklyDigestTrigger_Waratah` (WeeklyDigestWaratah.js:173-191) schedules **Monday 9am**. Neither matches the doc's "Monday 4pm". Header comment at top of WeeklyDigestWaratah.js says "Monday at 9am". Header comment at MenuWaratah.js:217 says "Wednesday 8:00am (Waratah digest runs Wed)".
- **Evidence:** `MenuWaratah.js:251-256` (WED 8am); `WeeklyDigestWaratah.js:178-182` (MON 9am).
- **Recommended fix:** Resolve the code conflict first. Then update the doc to match. "Monday 4pm" is a fabrication.

### Finding M3-3: Monday 9pm Weekly Rollover — confirmed
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:19
- **Claim (exact quote):** "| Mon | 9pm | **Weekly Rollover** | Archives the week, resets the spreadsheet for new week |"
- **Code reality:** Trigger is Monday 9pm (`atHour(21)`).
- **Evidence:** `MenuWaratah.js:235-240`.
- **Recommended fix:** None.

### Finding M3-4: Daily 6am Staff Workload Refresh — confirmed
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:20
- **Claim (exact quote):** "| Daily | 6am | **Daily Staff Workload Refresh** | ..."
- **Code reality:** Confirmed: `runScheduledStaffWorkload` daily at 6am.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:2102-2105`.
- **Recommended fix:** None.

### Finding M3-5: Daily 7am Task Maintenance — wrong time
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:21
- **Claim (exact quote):** "| Daily | 7am | **Daily Task Maintenance** | Bi-hourly status cleanup, due-date checks, escalation checks |"
- **Code reality:** `createDailyMaintenanceTrigger` uses `atHour(6)`, not 7am. Comment in code says "6-7am daily" reflecting Google's window, but scheduled hour is 6.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1864-1870`.
- **Recommended fix:** Either say 6am, or use the GAS window "6-7am". Same as M2-11.

### Finding M3-6: Section 2 "does five things in sequence"
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:30-38
- **Claim (exact quote):** Lists five steps; bullet 1 says "compiled into one PDF report and emailed to the six recipients (Evan, Cynthia, Nick, Chef, Howie, Adam)."
- **Code reality:** `runWaratahWeeklyRollover` performs 9 internal steps (per `WeeklyRolloverInPlaceWaratah.js:11-21` header) — validate, idempotency, summary, PDF archive, snapshot archive, clear, rename, verify, validate, health-check. The rollover does NOT email anyone — there is no `GmailApp.sendEmail` in `WeeklyRolloverInPlaceWaratah.js`. PDF is stored to Drive only.
- **Evidence:** `WeeklyRolloverInPlaceWaratah.js:407-488` (`_warExportPdfToArchive_` writes to Drive, no email). Grep for `sendEmail` in WeeklyRollover file = 0 matches.
- **Recommended fix:** Remove "emailed to the six recipients". The rollover archives a PDF to Drive only. The end-of-shift nightly export is what emails.

### Finding M3-7: Rollover "Posts a Slack confirmation" — UNVERIFIED, likely fabricated
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:38
- **Claim (exact quote):** "5. **Posts a Slack confirmation.** A short message is posted to the manager channels saying the rollover completed, and listing what was archived."
- **Code reality:** `runWaratahWeeklyRollover` shows a UI alert on success but does NOT post to Slack on success. Slack only posts on FAILURE via `notifyError_` (line 206).
- **Evidence:** `WeeklyRolloverInPlaceWaratah.js:188-220`. No `bk_post` / `UrlFetchApp.fetch` in the success path.
- **Recommended fix:** Remove the "posts a Slack confirmation" step from the doc, and remove the "Posted Slack confirmation" verification check in line 55.

### Finding M3-8: Section 3 Drive archive filename format claims `Waratah_Week_YYYY-MM-DD.pdf`
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:66-68
- **Claim (exact quote):** "**`Waratah_Week_YYYY-MM-DD.pdf`**: the full-week PDF report" and "**`Waratah_Shift_Report_YYYY-MM-DD.gsheet`**: a Google Sheets copy"
- **Code reality:** Actual filenames are `Waratah Shift Report W.E. DD.MM.YYYY.pdf` and `Waratah Shift Report W.E. DD.MM.YYYY` (snapshot).
- **Evidence:** `WeeklyRolloverInPlaceWaratah.js:410` (`'Waratah Shift Report W.E. ' + weekEndDate.replace(/\//g, '.') + '.pdf'`); line 505 same pattern without `.pdf`.
- **Recommended fix:** Fix the filename templates.

### Finding M3-9: Drive folder structure claim "one subfolder per week, named with the year and ISO week number (`2026-W17`, `2026-W18`)" — FABRICATED
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:64
- **Claim (exact quote):** "The Drive archive folder contains one subfolder per week, named with the year and ISO week number (`2026-W17`, `2026-W18`, and so on)."
- **Code reality:** Folder structure is `Archive/YYYY/YYYY-MM/{pdfs|sheets}/` — by year then year-month, NOT by ISO week. No `2026-W17` folders exist.
- **Evidence:** `WeeklyRolloverInPlaceWaratah.js:528-553` (`_warGetOrCreateArchiveSubfolder_` and `_warGetArchivePath_` show year/year-month structure).
- **Recommended fix:** Replace with: "Archive structure is `Archive/YYYY/YYYY-MM/pdfs/` (PDF) and `Archive/YYYY/YYYY-MM/sheets/` (Sheets snapshot)."

### Finding M3-10: Section 3 "Waratah_Tasks_YYYY-MM-DD.gsheet" task archive claim — FABRICATED
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:69
- **Claim (exact quote):** "**`Waratah_Tasks_YYYY-MM-DD.gsheet`** (if the task archive ran that week): a copy of completed tasks archived that week"
- **Code reality:** No such file is created by the weekly rollover. The task archive (`archiveOldCompletedTasks_`) moves rows to an `ARCHIVE` tab inside the Task Management spreadsheet — it does NOT save a Drive copy.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:993-1063` (`archiveOldCompletedTasks_` writes to ARCHIVE sheet in same spreadsheet).
- **Recommended fix:** Remove this bullet.

### Finding M3-11: Section 4 Revenue Digest "Monday 4pm" — fabricated time
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:76
- **Claim (exact quote):** "Five hours before rollover, the system posts a Slack summary of the just-finished week's revenue numbers."
- **Code reality:** Per M3-2, actual schedule is contested between WED 8am and MON 9am — never "Mon 4pm" (which would be 5 hours before Mon 9pm). The "5 hours before" math is based on a fictional 4pm time.
- **Evidence:** `MenuWaratah.js:251-256`; `WeeklyDigestWaratah.js:178-182`.
- **Recommended fix:** Rewrite once code is resolved.

### Finding M3-12: Section 4 digest content: "Number of services that night (cover counts if recorded)"
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:86
- **Claim (exact quote):** "Number of services that night (cover counts if recorded)"
- **Code reality:** The digest only shows: this week revenue, vs last week (%), total tips, days reported, best shift. No cover counts.
- **Evidence:** `WeeklyDigestWaratah.js:147-165`.
- **Recommended fix:** Remove cover-count claim. Add "Best shift of the week" which is in the actual output.

### Finding M3-13: Section 4 "Run Revenue Digest Now" menu path
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:95
- **Claim (exact quote):** "run it manually from **Waratah Tools > Admin Tools > Run Revenue Digest Now** (requires admin password)."
- **Code reality:** Actual path is `Waratah Tools > Admin Tools > Weekly Digest > Send Revenue Digest (LIVE)`. The item is "Send Revenue Digest (LIVE)", inside a "Weekly Digest" submenu.
- **Evidence:** `MenuWaratah.js:137-141`.
- **Recommended fix:** Correct the path.

### Finding M3-14: Section 5 EXECUTIVE_DASHBOARD tab — referenced but UNVERIFIED for Waratah
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:104-107
- **Claim (exact quote):** "| **EXECUTIVE_DASHBOARD** | Current month rolling, monthly trend, rolling 4-week, revenue by day |"
- **Code reality:** Menu items in Analytics submenu are `Build Financial Dashboard`, `Build Executive Dashboard`, `Open Analytics Viewer`. AnalyticsDashboardWaratah.js exists but I did not read it. Could not confirm the exact dashboards/columns.
- **Evidence:** `MenuWaratah.js:147-149`.
- **Recommended fix:** Mark UNVERIFIED. Read `AnalyticsDashboardWaratah.js` to confirm.

### Finding M3-15: Section 5 "Rebuild All Dashboards" menu path
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:109
- **Claim (exact quote):** "run **Waratah Tools > Admin Tools > Rebuild All Dashboards** which forces a refresh."
- **Code reality:** No "Rebuild All Dashboards" menu item exists in the Waratah Tools menu. The Analytics submenu has separate Build Financial / Build Executive items. (CLAUDE.md mentions this for Sakura, not Waratah.)
- **Evidence:** `MenuWaratah.js:147-149`.
- **Recommended fix:** Replace with the actual two separate menu items.

### Finding M3-16: Section 6 "Refresh Dashboard" menu path (again)
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:123
- **Claim (exact quote):** "run **Waratah Tools > Refresh Dashboard** to force a manual recalculation."
- **Code reality:** No such menu item. The closest is `Task Management > Admin Tools > Dashboard > Refresh Staff Workload Stats` (in the Task Management spreadsheet, not Waratah Tools).
- **Evidence:** `Menu_Updated_Waratah.gs:179`.
- **Recommended fix:** Correct sheet and menu path.

### Finding M3-17: Section 7 Bi-hourly cleanup "during business hours" + scope claim
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:141-145
- **Claim (exact quote):** "Every two hours during business hours, the system runs a light cleanup pass: ensures status columns are consistent, auto-progresses DEFERRED tasks past their hold dates to TO DO, marks RECURRING task instances as DONE when the next instance is generated."
- **Code reality:** Bi-hourly fires every 2 hours 24/7. Does only sort + removeEmptyRows. Does NOT auto-progress DEFERRED. Does NOT mark RECURRING as DONE.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1971-1973`, line 499 (cleanupAndSortMasterActionables is sort+remove only).
- **Recommended fix:** Rewrite to: "Every 2 hours: removes blank rows and re-sorts tasks. That is all."

### Finding M3-18: Section 8 Backfill "8am" not "2am" — same as M3-1
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:149-150
- **Claim (exact quote):** "At 2am Monday, before the digest and rollover, the system re-scans the previous week's shift report spreadsheet"
- **Code reality:** 8am, not 2am.
- **Evidence:** `MenuWaratah.js:243-248`.
- **Recommended fix:** Change "2am" to "8am".

### Finding M3-19: "Backfill Tonight to Warehouse" menu — FABRICATED
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:163
- **Claim (exact quote):** "Run **Waratah Tools > Admin Tools > Backfill Tonight to Warehouse** for the specific night"
- **Code reality:** No such menu item. Actual menu has only `Backfill This Sheet to Warehouse` (operates on the currently active sheet, which corresponds to one night).
- **Evidence:** `MenuWaratah.js:153`.
- **Recommended fix:** Replace with "Backfill This Sheet to Warehouse" (note this implicitly backfills the active sheet's night).

### Finding M3-20: "Backfill Entire Week" menu — FABRICATED
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:163
- **Claim (exact quote):** "or **Backfill Entire Week** for everything"
- **Code reality:** No such item. The whole-week backfill is a scheduled-only function (`runWeeklyBackfill_`) with no UI button.
- **Evidence:** `MenuWaratah.js` does not list a manual whole-week backfill.
- **Recommended fix:** Remove or replace with: "For full-week backfill, ask Evan to run `runWeeklyBackfill_` from the Apps Script editor."

### Finding M3-21: Section 9 trigger discussion is consistent
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:167-178
- **Claim (exact quote):** Generic trigger-pending description.
- **Code reality:** Matches the `⚠ Admin Tools` warning behaviour in MenuWaratah.js. The advice to escalate to Evan and check Apps Script Triggers is sound.
- **Evidence:** `MenuWaratah.js:97-110`, line 218-273.
- **Recommended fix:** Note that `setupAllTriggers_Waratah` installs 3 triggers in one call: Mon 9pm rollover, Mon 8am backfill, Wed 8am digest. The doc could mention this convenience function.

---

## Findings — for-managers/04-staff-and-recipients.md

### Finding M4-1: Section 1 "5 role-based options" but lists 7 items
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/04-staff-and-recipients.md:11
- **Claim (exact quote):** Line 11: "7 named individuals plus 5 role-based options"; then lines 25-31 list seven role/catch-all items (Bar Team, Kitchen Team, FOH Team, General Management, Marketing Explicit, Contractor, All).
- **Code reality:** `STAFF_LIST` (line 273-288) has 14 entries total: 7 individuals (Evan, Cynthia, Adam, Jaiden, Joffy, Nick, Howie) + 7 role/catch-all (Bar Team, Kitchen Team, FOH Team, General Management, Marketing Explicit, Contractor, All). So "5 role-based options" is wrong — there are 7.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:273-288`.
- **Recommended fix:** Change "5 role-based options" to "7 role-based options". Section 7 quick-lookup also says "5 role-based" and "2 catch-all" — same total (7), but framing inconsistent with section 1.

### Finding M4-2: "Marketing Explicit" — actually correct in code
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/04-staff-and-recipients.md:28
- **Claim (exact quote):** "Marketing Explicit"
- **Code reality:** Matches `STAFF_LIST` entry "Marketing Explicit" (line 287). Confirmed.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:287`.
- **Recommended fix:** None. (The name is unusual but matches code.)

### Finding M4-3: Order of STAFF_LIST in code differs from doc
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/04-staff-and-recipients.md:14-31
- **Claim (exact quote):** Lists individuals first, then role-based.
- **Code reality:** Actual `STAFF_LIST` order is: Evan, Cynthia, Adam, Jaiden, Joffy, Bar Team, Nick, Howie, Kitchen Team, All, Contractor, FOH Team, General Management, Marketing Explicit. Mixed order in code.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:273-288`.
- **Recommended fix:** Note the code order vs doc grouping — managers may see different order in the dropdown. Minor.

### Finding M4-4: Section 2 email recipients confirmed 6 — matches CLAUDE.md
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/04-staff-and-recipients.md:38-48
- **Claim (exact quote):** Six email recipients: Evan, Cynthia, Nick, Chef, Howie, Adam.
- **Code reality:** Cannot directly verify (Script Property). But consistent with project CLAUDE.md May 4/May 17 deployment notes.
- **Evidence:** Project CLAUDE.md "Deployment (May 4, 2026)" entry: "6 managers (Evan, Cynthia, Nick, Chef, Howie, Adam)".
- **Recommended fix:** None. Mark consistent.

### Finding M4-5: Section 3 DM table has 8 rows but section title says 6 recipients
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/04-staff-and-recipients.md:58-69
- **Claim (exact quote):** "Personal Slack direct messages (DMs) for nightly shift reports go to six people:" then a table listing 8 rows (Evan/Cynthia/Adam/Jaiden/Joffy/Nick = yes; Howie/Chef = no).
- **Code reality:** Cannot directly verify Script Property contents. The table is internally consistent (6 "Yes"). Title is correct count of recipients.
- **Evidence:** Property `SLACK_DM_WEBHOOKS`, not in source. Project CLAUDE.md May 17 deployment confirms 6 personal DMs.
- **Recommended fix:** None — table is correct, intro line counts only the "Yes" rows.

### Finding M4-6: "nightly shift reports go to six people" — DM logic is task-related, not nightly-shift-related
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/04-staff-and-recipients.md:58
- **Claim (exact quote):** "Personal Slack direct messages (DMs) for nightly shift reports go to six people"
- **Code reality:** `postToSlackFromSheet` posts the nightly Block Kit message to ONE webhook (the LIVE webhook). It does NOT iterate `SLACK_DM_WEBHOOKS`. Personal DMs are sent only for task-related events (weekly summary Mon 10am, blocked >14d escalation). So the framing "DMs for nightly shift reports" is inaccurate.
- **Evidence:** `NightlyExportWaratah.js:764-988` (single-webhook nightly post). `EnhancedTaskManagementWaratah.gs:1792-1845` (weekly task DMs iterate dm map).
- **Recommended fix:** Reframe: "Personal Slack DM webhooks (used for task notifications such as weekly summary and blocked escalations)" — not nightly shift reports.

### Finding M4-7: Section 4 Slack Channels table lists 3 channels — three Script Property names mentioned do not match _SETUP_ScriptProperties.js
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/04-staff-and-recipients.md:82-87
- **Claim (exact quote):** "| `#waratah-shift-reports` | Full nightly Slack Block Kit message | Every LIVE send (Wed to Sun) | | `#waratah-management` | Full nightly Slack Block Kit message | Every LIVE send (mirror of above for visibility) | | `#waratah-tasks` | Task-related notifications (assignments, blocked task escalations) | As tasks are created, assigned, or escalated | ... Channel webhooks live in Script Properties (`WARATAH_SLACK_WEBHOOK_PRIMARY`, `WARATAH_SLACK_WEBHOOK_TASKS`, and so on)."
- **Code reality:** Property names actually used are `WARATAH_SLACK_WEBHOOK_LIVE` and `WARATAH_SLACK_WEBHOOK_TEST` (per `_SETUP_ScriptProperties.js:34-35`). Plus `SLACK_MANAGERS_CHANNEL_WEBHOOK` (line 56) and `ESCALATION_SLACK_WEBHOOK` (line 60). There is NO `WARATAH_SLACK_WEBHOOK_PRIMARY` or `WARATAH_SLACK_WEBHOOK_TASKS`. The nightly send uses one LIVE webhook — there is no mirror posting to a second channel. The channel names `#waratah-shift-reports`, `#waratah-management`, `#waratah-tasks` are not referenced anywhere in code; they may or may not exist in the workspace.
- **Evidence:** `_SETUP_ScriptProperties.js:34-35, 56, 60`. `NightlyExportWaratah.js:174` reads a single LIVE webhook only.
- **Recommended fix:** Correct Script Property names. Acknowledge that the nightly post goes to ONE webhook (LIVE). Channel names are workspace config, not in code — mark UNVERIFIED.

### Finding M4-8: Section 7 Quick Lookup numbers
- **Severity:** MEDIUM
- **Doc location:** docs/waratah/for-managers/04-staff-and-recipients.md:125-135
- **Claim (exact quote):** "**5 role-based assignees:** Bar Team, Kitchen Team, FOH Team, General Management, Marketing Explicit." + "**2 catch-all assignees:** Contractor, All."
- **Code reality:** STAFF_LIST has 7 non-individual entries. Doc's framing (5 + 2 = 7) is internally consistent. Just inconsistent with Section 1's "5 role-based options".
- **Evidence:** `EnhancedTaskManagementWaratah.gs:273-288`.
- **Recommended fix:** Align Section 1 with Section 7. Both should say "5 team-level + 2 catch-all = 7 non-individual options".

### Finding M4-9: Section 5 "STAFF_LIST is hard-coded in EnhancedTaskManagementWaratah.gs" — confirmed
- **Severity:** LOW
- **Doc location:** docs/waratah/for-managers/04-staff-and-recipients.md:102
- **Claim (exact quote):** "Adding or removing names from the `STAFF_LIST`. The dropdown is hard-coded in `EnhancedTaskManagementWaratah.gs`."
- **Code reality:** Confirmed.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:273-288`.
- **Recommended fix:** None.

### Finding M4-10: Section 6 "Reapply Dropdowns and Formatting" menu path
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/04-staff-and-recipients.md:115
- **Claim (exact quote):** "run **Waratah Tools > Admin Tools > Reapply Dropdowns and Formatting** in the Task Management spreadsheet."
- **Code reality:** Wrong menu name and wrong sheet. The Task Management spreadsheet menu is "Task Management" (not "Waratah Tools"). The item is "🔧 Reapply Dropdowns & Formatting" (with emoji and ampersand) under `Task Management > 🔐 Admin Tools > Cleanup > 🔧 Reapply Dropdowns & Formatting`.
- **Evidence:** `Menu_Updated_Waratah.gs:169, 172, 181-187`.
- **Recommended fix:** Change to: "In the Task Management spreadsheet, click **Task Management > 🔐 Admin Tools > Cleanup > 🔧 Reapply Dropdowns & Formatting**."

---

## Findings — for-managers/05-troubleshooting.md

### Finding M5-1: Section 2 "The Waratah Tools menu is not in the menu bar"
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/05-troubleshooting.md:27
- **Claim (exact quote):** "Open the shift report or Task Management spreadsheet and **The Waratah Tools** menu is not in the menu bar."
- **Code reality:** Shift Report menu is "Waratah Tools" (no "The"). Task Management menu is "Task Management" — completely different name. The doc conflates them.
- **Evidence:** `MenuWaratah.js:112`; `Menu_Updated_Waratah.gs:169`.
- **Recommended fix:** Differentiate: "The shift-report **Waratah Tools** menu or the task-management **Task Management** menu is missing."

### Finding M5-2: Section 3 "Waratah Tools > Admin Tools > Run Weekly Rollover Now"
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/05-troubleshooting.md:50
- **Claim (exact quote):** "**Waratah Tools > Admin Tools > Run Weekly Rollover Now** for the rollover."
- **Code reality:** Actual path is `Waratah Tools > Admin Tools > Weekly Reports > Weekly Rollover (In-Place) > Run Rollover Now`.
- **Evidence:** `MenuWaratah.js:126, 130-131`.
- **Recommended fix:** Correct the menu path.

### Finding M5-3: Section 3 "Run Revenue Digest Now" path
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/05-troubleshooting.md:51
- **Claim (exact quote):** "**Waratah Tools > Admin Tools > Run Revenue Digest Now** for the digest."
- **Code reality:** Actual path is `Waratah Tools > Admin Tools > Weekly Digest > Send Revenue Digest (LIVE)`.
- **Evidence:** `MenuWaratah.js:137-138`.
- **Recommended fix:** Correct the menu path.

### Finding M5-4: Section 3 "Backfill Entire Week to Warehouse" — FABRICATED
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/05-troubleshooting.md:52
- **Claim (exact quote):** "**Waratah Tools > Admin Tools > Backfill Entire Week to Warehouse** for the backfill."
- **Code reality:** No such item. Closest is `Admin Tools > Data Warehouse > Backfill This Sheet to Warehouse` (single-sheet backfill). Whole-week backfill (`runWeeklyBackfill_`) has no menu entry.
- **Evidence:** `MenuWaratah.js:153`.
- **Recommended fix:** Replace with the single-sheet backfill, or note that whole-week backfill requires running `runWeeklyBackfill_` from the Apps Script editor.

### Finding M5-5: Section 4 "running **Waratah Tools > Send Shift Report**" — same as M1-1
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/05-troubleshooting.md:73
- **Claim (exact quote):** "Resend the shift report by running **Waratah Tools > Send Shift Report** again."
- **Code reality:** Item is `Waratah Tools > Daily Reports > Export & Email PDF (LIVE)`.
- **Evidence:** `MenuWaratah.js:115`.
- **Recommended fix:** Use the correct name.

### Finding M5-6: Section 5 "Send TEST Report" — same as M1-2
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/05-troubleshooting.md:93
- **Claim (exact quote):** "send a TEST report (**Waratah Tools > Send TEST Report**)"
- **Code reality:** `Waratah Tools > Daily Reports > Export & Email (TEST to me)`.
- **Evidence:** `MenuWaratah.js:116`.
- **Recommended fix:** Correct the name.

### Finding M5-7: Section 6 rollover symptom "Run Weekly Rollover Now" path
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/05-troubleshooting.md:111
- **Claim (exact quote):** "Run Weekly Rollover Now"
- **Code reality:** See M5-2.
- **Recommended fix:** Use the full path `Admin Tools > Weekly Reports > Weekly Rollover (In-Place) > Run Rollover Now`.

### Finding M5-8: Section 6 "Clear Manager Inputs (Day)" menu — FABRICATED
- **Severity:** CRITICAL
- **Doc location:** docs/waratah/for-managers/05-troubleshooting.md:120
- **Claim (exact quote):** "Evan will run **Waratah Tools > Admin Tools > Clear Manager Inputs (Day)** for each affected tab."
- **Code reality:** No such menu item exists anywhere. No function named anything like that.
- **Evidence:** Grep across the codebase returns 0 matches for "Clear Manager Inputs".
- **Recommended fix:** Remove or describe the actual remediation (Evan would re-run rollover with `runWaratahWeeklyRollover` or manually use `_warClearAllSheetData_` from the script editor).

### Finding M5-9: Section 7 "197 named ranges"
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/05-troubleshooting.md:132
- **Claim (exact quote):** "As of May 2026 there are 197 named ranges across the system."
- **Code reality:** Likely 195 (5 days × 39 FIELD_CONFIG fields). See M1-15.
- **Evidence:** `RunWaratah.js:959` arithmetic.
- **Recommended fix:** Mark UNVERIFIED; reconcile against `namedRangeHealthCheck_Waratah` output.

### Finding M5-10: Section 9 "Reapply Dropdowns and Formatting" — wrong sheet/menu
- **Severity:** HIGH
- **Doc location:** docs/waratah/for-managers/05-troubleshooting.md:175
- **Claim (exact quote):** "| Dropdown missing | Run Reapply Dropdowns and Formatting | Menu action | Yes |"
- **Code reality:** Item exists in the Task Management spreadsheet's menu (not Waratah Tools). Path: `Task Management > 🔐 Admin Tools > Cleanup > 🔧 Reapply Dropdowns & Formatting`. Password-gated.
- **Evidence:** `Menu_Updated_Waratah.gs:187`.
- **Recommended fix:** Note that it lives in the Task Management spreadsheet menu and requires admin password (so "Yes" for manager is misleading — it's password-gated).

---

## Unverified Claims

### Finding UM-1: README — Drive folder ID is in a Script Property
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:72-73
- **Claim:** "The Drive folder ID is stored in a Script Property."
- **Status:** Likely correct. `_SETUP_ScriptProperties.js:55` shows `ARCHIVE_ROOT_FOLDER_ID`. Marked verified.

### Finding UM-2: Trend chart in dashboard
- **Doc location:** docs/waratah/for-managers/02-task-management.md:194
- **Claim:** "A simple trend chart of open task count over the last 8 weeks"
- **Status:** UNVERIFIED — did not read `TaskDashboardWaratah.gs` line-by-line. Recommend reading `buildTaskDashboard()` body to confirm chart presence and 8-week window.

### Finding UM-3: EXECUTIVE_DASHBOARD layout details
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:107
- **Claim:** "Current month rolling, monthly trend, rolling 4-week, revenue by day"
- **Status:** UNVERIFIED — `AnalyticsDashboardWaratah.js` not read in this audit.

### Finding UM-4: "197 named ranges" vs actual count
- **Doc location:** docs/waratah/for-managers/01-shift-reports.md:117, 05-troubleshooting.md:132
- **Claim:** "197 named ranges"
- **Status:** Arithmetic from code suggests 195 (5 × 39). Doc says 197. Mismatch noted but actual installed-named-range count cannot be measured from static code.

### Finding UM-5: "Five hours before rollover" arithmetic
- **Doc location:** docs/waratah/for-managers/03-weekly-automation.md:76
- **Claim:** Implies digest at Mon 4pm, rollover Mon 9pm.
- **Status:** Rollover is confirmed Mon 9pm. Digest schedule conflicts between code files. Once that's resolved, the "five hours before" claim should be re-checked.
