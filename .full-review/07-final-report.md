# Comprehensive Documentation Accuracy Audit — Final Report

**Target:** `docs/waratah/` — 20 active markdown files across 4 audience tiers, ~6,800 lines total.

**Method:** 5 parallel doc-vs-code audit agents, each verifying factual claims against `THE WARATAH/SHIFT REPORT SCRIPTS/` and `THE WARATAH/TASK MANAGEMENT SCRIPTS/` with mandatory file:line citations.

**Date:** 2026-05-17. **Audited by:** Claude (Opus 4.7) via `/comprehensive-review:full-review` adapted for documentation verification.

---

## Executive Summary

The documentation set under `docs/waratah/` contains **192 verified factual errors** across 19 of 20 docs, plus **23 unverified claims** the audit could not resolve from code alone. The top-level `README.md` is the only clean file.

**Severity totals: 51 Critical · 57 High · 38 Medium · 23 Low · 23 Unverified.**

The Critical findings are not edge cases. They include:

- **Fabricated menu items** that do not exist anywhere in code (`Send Shift Report`, `Send TEST Report`, `Refresh Dashboard`, `View Current PDF Preview`, `Run Weekly Rollover Now`, `Clear Manager Inputs (Day)`, `Re-sync Tasks`, `Rebuild All Dashboards`, `Backfill Entire Week to Warehouse`, and every `Reinstall X Trigger` variant)
- **Fabricated features** consistently described across multiple tiers — auto-return-DEFERRED, Hold-Until column, Status History column, DM-on-task-assignment, DM-on-URGENT-priority-change, Cash-Reconciliation-Folder sync — none of which exist in the codebase
- **Wrong column mappings** in the warehouse schema (column count of 25 is right, but cols H/V/W/X/Y are mis-mapped)
- **Fabricated function names** (~30 helper functions referenced across developer docs that do not exist in any source file)
- **Wrong trigger handler names** in admin and developer docs — following these to set up Monday's triggers would install nothing or install the wrong handler

The audit also surfaced **one production runtime bug**: the `Send Basic Report` menu item is wired to `sendShiftReportBasic` but that function is not implemented in any file. Clicking it from production triggers a TypeError.

---

## Findings by Doc

| Doc | C | H | M | L | U | Total |
|---|---:|---:|---:|---:|---:|---:|
| `README.md` | 0 | 0 | 0 | 0 | 0 | 0 |
| `for-daily-users/shift-report-walkthrough.md` | 5 | 6 | 5 | 4 | 3 | 23 |
| `for-managers/*` (6 docs) | 7 | 21 | 11 | 4 | 5 | 48 |
| `for-admins/*` (5 docs) | 4 | 9 | 7 | 4 | 5 | 29 |
| `for-developers/{README,01,02,03}` | 18 | 12 | 9 | 7 | 6 | 52 |
| `for-developers/{04,05,06}` | 17 | 9 | 6 | 4 | 4 | 40 |
| **Total** | **51** | **57** | **38** | **23** | **23** | **192** |

Full per-finding evidence lives in:

- `.full-review/01-tier-1-readme-daily.md`
- `.full-review/02-tier-2-managers.md`
- `.full-review/03-tier-3-admins.md`
- `.full-review/04-tier-4a-developers-pt1.md`
- `.full-review/05-tier-4b-developers-pt2.md`
- `.full-review/06-style-sweep.md` — style + terminology

---

## P0 Standalone Production Bug

**Finding M1-fix (from Tier 2 audit):** `MenuWaratah.js:117` wires the menu item `Send Basic Report` to function `sendShiftReportBasic`. That function is not defined anywhere in `THE WARATAH/SHIFT REPORT SCRIPTS/`. Clicking the menu item from any production sheet throws `TypeError: sendShiftReportBasic is not a function`.

The daily-user walkthrough (`for-daily-users/shift-report-walkthrough.md` Section 4) directs MODs to this menu item as the emergency fallback when the main send fails. The fallback is broken.

**Decision required:** implement the function, or remove the menu wire-up + delete all doc references to a Basic Report.

---

## P0 Upstream Stale Comments (root cause of doc agent contamination)

The doc agents that wrote `docs/waratah/` did not invent every wrong number from scratch — some were copied faithfully from comments in the source code that are themselves stale. Fixing the docs without fixing these will let the next doc-regeneration cycle reintroduce the same wrong values.

| File | Line | Stale claim | Reality |
|---|---|---|---|
| `RunWaratah.js` | ~38 | "36 fields" in FIELD_CONFIG header | 39 fields |
| `EnhancedTaskManagementWaratah.gs` | ~5 | "8-status workflow" in file JSDoc | 9 statuses |
| `WeeklyDigestWaratah.js` | ~96-98 | "new 22-col schema" in inline comment | 25 cols |
| `MenuWaratah.js` | ~214 | JSDoc says rollover "Monday 10:00am" | Monday 9pm (`atHour(21)`) |
| `WeeklyRolloverInPlaceWaratah.js` | ~25-26 | JSDoc says "Revenue Digest runs Monday 4pm" | Wed 8am (canonical) or Mon 9am (lone installer) |
| `EnhancedTaskManagementWaratah.gs` | ~1577 | JSDoc says daily maintenance "7am" | `atHour(6)` (6-7am window) |
| `MenuWaratah.js` | ~215 | JSDoc references `performWeeklyRollover` | `runWaratahWeeklyRollover` (legacy name kept only for trigger cleanup) |

The `.remember/remember.md` handoff state I was operating from at session start (`FIELD_CONFIG rewritten with 36 fields`) was also wrong on the field count — same propagation chain.

---

## Top 20 Critical Doc Fixes (ranked by user impact)

### A — Daily user / manager facing (every MOD or manager encounters these)

1. **Menu item `Send Shift Report` is fabricated.** Real path: `Waratah Tools → Daily Reports → Export & Email PDF (LIVE)`. 19 doc references. Files: daily walkthrough, all 3 manager docs that mention sending, troubleshooting, several admin and dev docs.
2. **Menu item `Send TEST Report` is fabricated.** Real path: `Waratah Tools → Daily Reports → Export & Email (TEST to me)`. Same 19-instance sweep.
3. **`Open Task Manager` in `Waratah Tools` is fabricated.** It exists, but in the **Task Management spreadsheet's menu**, not the Shift Report sheet's menu. Two separate Google Sheets, two separate GAS projects.
4. **Section 5 of `for-managers/01-shift-reports.md`** lists `Refresh Dashboard` and `View Current PDF Preview` — neither exists anywhere. Whole section needs rewrite against actual `MenuWaratah.js:112-184` hierarchy.
5. **Checklist dialog has 2 boxes, not 4.** `checklist-dialog.html:91-100` shows `Deputy Timesheets Approved` and `Fruit Order Done`. The daily walkthrough Section 10 says "all four". Confirm button is `Confirm & Send`, not `Send`.
6. **No `$50 variance system warning` exists** (daily walkthrough §3, §8). `validateShiftBeforeExport_()` in `UIServerWaratah.js:307-354` only checks MOD/netRevenue/shiftSummary/theGood/unassigned-TODOs. Rewrite to operational guidance not code-enforced rule.
7. **Recipient list contradiction.** Daily walkthrough §16 says "six people" then lists five; CLAUDE.md May 4 entry lists a different six. Source of truth is the live `WARATAH_EMAIL_RECIPIENTS` Script Property, not source code.

### B — Admin / operator facing (Evan's Monday trigger setup runs on these)

8. **Trigger schedule table in `for-admins/04-deployment-and-clasp.md` §5 is comprehensively wrong.** Both the SR and TM tables list wrong handler names AND wrong schedules. Real handlers + schedules:
   - SR rollover: `runWaratahWeeklyRollover`, Mon 9pm (`MenuWaratah.js:235-240`)
   - SR backfill: `runWeeklyBackfill_`, Mon **8am** (not 2am) (`MenuWaratah.js:243-248`)
   - SR digest: `sendWeeklyRevenueDigest_Waratah`, Wed 8am via canonical installer OR Mon 9am via standalone installer (resolve which is intended)
   - TM bi-hourly cleanup: `cleanupAndSortMasterActionables` (not `runStatusCleanup`)
   - TM daily workload: `runScheduledStaffWorkload` (not `refreshStaffWorkload`)
   - TM daily maintenance: `runDailyTaskMaintenance`, **6am** (not 7am)
   - TM weekly archive: `runScheduledArchive` (not `archiveCompletedTasks`)
   - TM weekly summary: `sendWeeklyActiveTasksSummary` (plural — not Task)
   - TM on-edit: `onTaskSheetEditWithAutoSort` (not `onEdit`), **installable** trigger, not simple
9. **All `Reinstall X Trigger` menu items in admin docs 03 + 04 do not exist.** Real menu prefixes are `Setup …` and `Create …`. The full coherent fabricated naming pattern needs replacing with actual menu strings.
10. **`SLACK_DM_WEBHOOKS` cross-project model is overstated.** Shift Report project setup writes it but no SR runtime code reads it. Only Task Management project consumes it. Doc claims "Both projects DM staff (nightly DMs from SR, task DMs from TM)" — there are no nightly DMs from SR.
11. **`clasp pull` rollback flow is wrong** (`for-admins/04` §6). `clasp pull` pulls from Google, not local git. Correct rollback: `git checkout <prev-commit>` then `clasp push`.

### C — Developer facing (writing or maintaining code from these will break things)

12. **OPERATIONAL_EVENTS schema is wrong.** Doc 04 §4 describes maintenance/RSA events with Estimated Cost. Real schema (`IntegrationHubWaratah.js:551-560`) is a TO-DOs log: A=Date, B=Day, C=MOD, D=Description, E=Assignee, F=Priority (literal "MEDIUM"), G=Source (literal "Shift Report"), H=Logged At. Rewrite entire §4.
13. **NIGHTLY_FINANCIAL cols H/V/W/X/Y mis-mapped.** Count of 25 is correct. Real mapping (`IntegrationHubWaratah.js:500-526`): V=CashCounted (C18), W=ExpectedCash (C24), X=CashVariance (C26), Y=LoggedAt. Doc puts LoggedAt at V.
14. **WASTAGE_COMPS and QUALITATIVE_LOG schemas wrong.** Doc 04 §5 §6 describe per-item splitting and a fabricated Week Ending column on QUALITATIVE_LOG. Real WASTAGE_COMPS is a single-row append; real QUALITATIVE_LOG has 11 cols A=Date, B=Day, C=MOD, D=Shift Summary, E=Guests of Note, F=Good, G=Bad, H=Kitchen, I=Maintenance, J=RSA/Incidents, K=Logged At — no Week Ending.
15. **Auto-return-DEFERRED feature is wholly fabricated.** Referenced in `for-developers/06` (§4, §9) and `for-managers/02` (Hold-Until column claim). No `returnDeferredTasksWhenDue_` function exists, no Hold-Until field exists, no related logic in `runDailyTaskMaintenance` (`EnhancedTaskManagementWaratah.gs:1579-1630`). Delete from all docs.
16. **Recurring tasks regenerate on `DONE` status, not `RECURRING`.** Doc 06 §6 has the mechanic backwards: it says RECURRING templates regenerate; real code (`EnhancedTaskManagementWaratah.gs:1228-1229`) fires when a task's status hits DONE and Recurrence is set. After regenerating, the original task's Recurrence is set to None.
17. **`onTaskSheetEditWithAutoSort` is an installable trigger.** Doc 06 §8 says simple onEdit "no UrlFetch, no MailApp". Wrong — installable has full scopes (`createOnEditTrigger()` at `EnhancedTaskManagementWaratah.gs:1915-1929` uses `ScriptApp.newTrigger(...).onEdit().create()`).
18. **Rollover flow has 11 internal steps, not 11 numbered including Email/Slack confirmation.** Real sequence in `WeeklyRolloverInPlaceWaratah.js:92-220` has NO email-summary step and NO Slack-on-success step. Slack only fires from `_warValidateRolloverResult_` on FAILURE. Doc 05 §4 currently tells managers to expect a Slack success confirmation.
19. **Archive folder structure is `Archive/YYYY/YYYY-MM/{pdfs,sheets}/`, not ISO weeks.** Doc 05 §7 fabricates a `getISOWeek_` helper and an ISO-week folder format. No such helper exists. Filenames: `Waratah Shift Report W.E. dd.mm.yyyy.pdf`. PDFs and snapshots go to separate subfolders.
20. **`for-developers/02-cell-reference-and-field-config.md` FIELD_CONFIG sample uses fabricated attribute keys** (`namedRangeSuffix`, `fallbackCell`). Real keys (`RunWaratah.js:42-295`): `suffix`, `fallback`. A developer copy-pasting from the doc will write broken code. Also: `getFieldRange` signature is `(sheet, fieldKey)` not `(fieldKey, sheetName)`; `setFieldValue` does not exist; `BATCH_RANGES_BY_SHEET` constant does not exist.

---

## Recurring Fabrication Patterns

The hallucinations are not random. They cluster into a few coherent patterns:

### Pattern 1 — The "richer task system" fiction

A self-consistent imagined feature set spanning four doc tiers:
- Hold-Until column on tasks (fictional — column N is `Updated By`)
- Auto-return DEFERRED on Hold-Until date (fictional)
- Status History column on each row (fictional — audit lives in a separate AUDIT LOG sheet)
- DM-on-task-assignment / DM-on-URGENT / DM-on-unassignment (fictional)
- BLOCKED-status immediate DM via `notifyAssigneeOfBlock_` (fictional)

These appear in `for-managers/02` and `for-developers/06`. They describe a task system more capable than what exists. Likely source: a doc-generation prompt that asked "describe a complete enterprise task system" without grounding in code.

### Pattern 2 — Imaginary admin menu (`Reinstall X Trigger`)

The admin docs systematically describe menu items prefixed `Reinstall …` (e.g. `Reinstall Weekly Rollover Trigger`, `Reinstall Revenue Digest Trigger`, `Reinstall Bi-Hourly Cleanup Trigger`). The real menu uses `Setup …` or `Create …`. The pattern is too uniform to be a one-off slip — it reads like an entire admin menu was imagined.

### Pattern 3 — Fabricated helper functions (~30+ counted)

`getProp_`, `isDuplicateInSheet_`, `computeWeekEnding_`, `extractCost_`, `daysBetween_`, `getMasterActionablesSheet_`, `getAuditLogSheet_`, `buildEscalationBlockKit_`, `composeEscalationEmail_`, `buildWeeklySummaryBlockKit_`, `postToSlack_`, `notifyAssigneeOfBlock_`, `returnDeferredTasksWhenDue_`, `notifyAdminOfMaintenanceFailure_`, `computeNextOccurrence_`, `getISOWeek_`, `syncToCashReconciliation_`, `buildSlackBlockKit_`, `postToSlackChannels_`, `postToSlackDMs_`, `sendSlackMessages_`, `generatePdfAndEmail_`, `composeShiftReportEmail_`, `pushTodosToMaster_`, `extractTodos_`, `inspectTriggers_`, `_warMarkUnrolledOver_`, `_warListClearableCells_`, `_warComputeNextDates_`. All plausible names, none exist. Tier 4a/4b agents independently confirmed via grep.

### Pattern 4 — Sheet attribution conflation

Two Google Sheets (Shift Report + Task Management), two GAS projects, two menus. Multiple docs conflate them by putting Task Management menu items under `Waratah Tools` (e.g. `Open Task Manager`, `Refresh Dashboard`). This is a structural trap: anyone editing the docs needs to be explicit about which sheet a menu lives in.

### Pattern 5 — Trigger schedule scrambling

Same wrong numbers appear across all three relevant tiers:
- Backfill `Mon 2am` (wrong) instead of `Mon 8am` — in manager doc 03, admin doc 04, developer docs 04 and 05
- Daily task maintenance `7am` (wrong) instead of `6am` — in manager docs 02 and 03, developer docs 05 and 06
- Revenue digest `Mon 4pm` (wrong) — but here the code itself is inconsistent (canonical installer = Wed 8am; lone installer = Mon 9am). Code conflict needs resolving before docs can be fixed.

---

## Cross-Cutting Code Issues Surfaced

The doc audit incidentally caught real issues in the code:

1. **`sendShiftReportBasic` not implemented** (P0 production bug — see above)
2. **Revenue Digest schedule conflict**: `setupAllTriggers_Waratah()` installs Wed 8am; `setupWeeklyDigestTrigger_Waratah()` installs Mon 9am. Both functions exist and both can be invoked from menus. One must be retired or the docs must explain when each is correct.
3. **Stale JSDoc / inline comments** in code (listed in P0 Upstream Stale Comments table above) propagate wrong numbers to anyone who reads them, including future doc-regeneration agents.
4. **`SLACK_DM_WEBHOOKS` set in SR project but never read by SR code.** Either remove from SR setup as a no-op, or add an SR consumer if the dual-storage was intentional.
5. **`createWeeklyOverdueSummaryTrigger` is a no-op installer** (function body is one log line). The associated handler `sendOverdueTasksSummary_` is still fully implemented but unreachable from any trigger. Either retire the orphaned handler or restore the trigger.

---

## Style Sweep Summary

From `06-style-sweep.md`:

- **Em-dash count: 0** — style rule fully honoured
- **US-spelling violations: 0 substantive** (false positives only — `dialog` is the Apps Script API term)
- **Terminology hallucinations**: 8× "The Waratah Tools", 19× "Send Shift Report"/"Send TEST Report", 7× "36 fields", 2× "8-status workflow", 1× "22-col". Mechanical find-and-replace will resolve once the code-of-truth strings are agreed (see 06-style-sweep.md final section).

---

## Recommended Remediation Plan

The fix scope is large but the work decomposes cleanly. Recommended ordering:

### Phase A — Stop the bleeding (0.5 day)
- **Fix `sendShiftReportBasic`** — implement or remove (P0)
- **Fix upstream stale JSDoc/comments** in 7 code locations listed in the P0 Upstream table — otherwise next doc-regen cycle reintroduces the same wrong numbers
- **Resolve the Revenue Digest schedule conflict** in code (canonical Wed 8am vs lone Mon 9am)

### Phase B — Fix user-facing docs (1 day)
Run targeted find-and-replace per `06-style-sweep.md` recommendations, plus structured rewrites of:
- `for-daily-users/shift-report-walkthrough.md` Sections 5, 10, 16, 19
- `for-managers/01-shift-reports.md` Sections 5, 6, 8 (Section 5 needs full rewrite against real menu hierarchy)
- `for-managers/05-troubleshooting.md` menu-path references
- `for-admins/03-advanced-troubleshooting.md` §6 and `for-admins/04-deployment-and-clasp.md` §5 trigger tables

### Phase C — Fix developer docs (1.5–2 days)
These are the largest rewrites. Most of `for-developers/04-warehouse-schemas.md`, `05-rollover-and-triggers.md`, and `06-task-management-internals.md` needs sections replaced. Strategy:
- Delete every fabricated code excerpt
- Either replace with real excerpts from the cited files, or mark sections as "out of scope until rewritten"
- Remove the imaginary-feature cluster (Hold-Until, auto-return-DEFERRED, Status History column, etc.) entirely — don't try to preserve any of it

### Phase D — Verify (0.5 day)
- Re-run a smaller cross-check sweep on the rewritten docs against the same code
- Fix the empty `.remember/remember.md` problem (it's 0 bytes; the cutover narrative must live elsewhere — find and align)

**Total estimated effort: 3–4 days of focused doc rewriting + one production code fix.**

Alternative path if speed matters: revert `docs/waratah/{for-developers,for-admins,for-managers,for-daily-users}/` to the pre-consolidation state and start over with code-grounded generation. The audit found enough fabrication that revert-and-rewrite may be cheaper than fix-in-place for the developer tier.

---

## Methodological Note

This audit was deliberately built to avoid the same failure mode that produced the original docs. Specifically:
- The five parallel agents were `general-purpose`, not the project's `documentation-agent` (which the May 17 handoff explicitly flagged as having hallucinated twice that day)
- Every finding required a file:line citation from code
- Claims that could not be verified against code were marked UNVERIFIED, not assumed correct
- Convergent verification across tier boundaries caught the imaginary-feature cluster: the same fabrications appearing in both manager and developer docs increased confidence in the diagnosis

Of the 23 Unverified claims, most are operational guidance (Slack outage troubleshooting) or claims that need live-sheet data (audit log row counts). None of the Critical or High findings depend on Unverified items.

---

## Files Produced by This Audit

```
.full-review/
├── state.json
├── 00-scope.md
├── 01-tier-1-readme-daily.md       (Tier 1 raw findings)
├── 02-tier-2-managers.md            (Tier 2 raw findings)
├── 03-tier-3-admins.md              (Tier 3 raw findings)
├── 04-tier-4a-developers-pt1.md     (Tier 4a raw findings)
├── 05-tier-4b-developers-pt2.md     (Tier 4b raw findings)
├── 06-style-sweep.md                (style + terminology sweep)
└── 07-final-report.md               (this file)
```
