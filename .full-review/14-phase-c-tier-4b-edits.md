# Phase C — Developer Tier 4b Edit Log

## Summary
- Findings actioned: 32 (out of 40 numbered findings; 4 Unverified UDP-* skipped per directive; 4 "no change needed" rows acknowledged but unedited)
- Findings skipped (Unverified or "no change needed"): 8 (UDP-1..4 plus W-6, W-18 left as-is, R-9, T-10, T-18)
- Files modified:
  - `docs/waratah/for-developers/04-warehouse-schemas.md`
  - `docs/waratah/for-developers/05-rollover-and-triggers.md`
  - `docs/waratah/for-developers/06-task-management-internals.md`
- Schema tables rewritten:
  - 04 §1 Tabs purpose/cadence
  - 04 §2 NIGHTLY_FINANCIAL 25-col mapping (H, V, W, X, Y corrected; real field names)
  - 04 §3 NIGHTLY_FINANCIAL write code (replaced fabricated `logToNightlyFinancial_` with real inline `logToDataWarehouse_` excerpt)
  - 04 §4 OPERATIONAL_EVENTS (rewritten as TO-DOs log, not maintenance/RSA; correct 8-col schema)
  - 04 §5 WASTAGE_COMPS (single-row append; col E = Notes, F = Logged At)
  - 04 §6 QUALITATIVE_LOG (removed Week Ending; col C = MOD; D-J narrative)
  - 04 §7 Duplicate prevention (inline `normaliseDateKey_`; per-sheet key columns corrected)
  - 04 §8 `parseCellDate_` and `toDateOnly_` (real `Utilities.parseDate`/`formatDate` bodies)
  - 04 §9 Backfill (Mon 8am; active-spreadsheet iteration; uppercase day names with `startsWith`)
  - 05 §1 Rollover summary list (no email/Slack-on-success; all 7 tabs)
  - 05 §2 Trigger table (Backfill Mon 8am; Revenue Digest installer note)
  - 05 §3 Daily maintenance schedule (6am window)
  - 05 §3 Overdue summary installer/handler clarification
  - 05 §4 Rollover sequence (11 internal steps; 30s lock; no email/Slack steps)
  - 05 §4.1 Preconditions (5 real Script-Property/sheet checks)
  - 05 §4.2 Idempotency (real string-equality logic)
  - 05 §6 Date update step (all 7 days; tabs ARE renamed; B3:F3 clear-then-write)
  - 05 §7 Archive folder structure (YYYY/YYYY-MM/{pdfs|sheets})
  - 05 §8 Dry-run (plain-text report + UI alert, not JSON)
  - 05 §10 Inspect triggers (removed fabricated `inspectTriggers_` helper)
  - 05 §11 `_warMarkUnrolledOver_` claim removed
  - 05 §12 Backfill timing (Mon 8am; 13 hours before rollover)
  - 06 §3 STAFF_LIST split note (7 named + 7 team/group)
  - 06 §4 State machine (marked "suggested, not enforced"; deleted auto-return-DEFERRED row)
  - 06 §5 escalateBlockedTasks_ (real `bk_*` builders, `bk_post`, `buildEscalationEmailHtml_`)
  - 06 §6 Recurring tasks (fires on DONE; original's Recurrence reset to "None"; inline switch; real `getNextMonday_`)
  - 06 §7 Audit log action enum + `logAuditEntry_` real body
  - 06 §8 On-edit (installable, not simple; no BLOCKED notification; only cell highlight)
  - 06 §9 runDailyTaskMaintenance (4 steps; `archiveOldCompletedTasks_`; no step 5; no MAINTENANCE_COMPLETE log)
  - 06 §10 Weekly Active Tasks Summary (two-stage core + DM helper; `getSlackDmWebhooks_`)
  - 06 §11 Trigger installers (overdue installer gutted; onEdit marked installable)
- Fabricated function names removed/negated: 20 (all forbidden names now appear only in negation-form sentences explaining they don't exist, or are replaced with real code paths)
- Code excerpts replaced with real code: 11

## Edits applied per finding, grouped by file

### docs/waratah/for-developers/04-warehouse-schemas.md
- **W-1:** Col H label corrected to `CashTakings` sourced from `shiftData.cashTake` (C19); `cashCounted` moved to col V.
- **W-2:** Cols V/W/X/Y rewritten: V=CashCounted, W=ExpectedCash, X=CashVariance, Y=LoggedAt.
- **W-3:** Col V no longer labelled Logged At; LoggedAt moved to Y.
- **W-4:** All fabricated `shiftData.MOD`, `production`, `totalDiscount`, etc. replaced with real field names (`mod`, `productionAmount`, `totalAdjustmentsDiscounts`, `discountsExcCashDiscount`, `grossSalesLessDiscounts`, `totalCashRecorded`, `cashTake`).
- **W-5:** §3 code excerpt replaced with the real `logToDataWarehouse_` inline header-assertion + appendRow block; deprecated cols now written as `null` literals, not `''`. Fabricated helpers explicitly stated as non-existent.
- **W-6:** Acknowledged sheet name alias note already correct; minimal copy edit only.
- **W-7:** §4 OPERATIONAL_EVENTS rewritten entirely as TO-DOs log (8 real cols: Date/Day/MOD/Description/Assignee/Priority literal/Source literal/LoggedAt) sourced from `shiftData.todos`.
- **W-8:** §4 code excerpt replaced with the real inline `newEventRows.push([...])` block; no standalone function, no `extractCost_`.
- **W-9:** §5 WASTAGE_COMPS: col E relabelled "Notes", col F to "Logged At"; sources corrected.
- **W-10:** §5 code excerpt replaced with the real single-row `wastageSheet.appendRow([...])` block.
- **W-11:** §6 QUALITATIVE_LOG cols D-J rewritten with real `generalShiftComments`/`guestsOfNote`/`theGood`/`theBad`/`kitchenNotes`/`maintenanceIssues`/`rsaIncidents` sources.
- **W-12:** Week Ending row removed from QUALITATIVE_LOG; col C relabelled MOD.
- **W-13:** §7 helper rewritten as negation form; real per-sheet dup keys table inserted.
- **W-14:** §8 `parseCellDate_` excerpt replaced with real `Utilities.parseDate` body.
- **W-15:** §8 `toDateOnly_` excerpt replaced with real round-trip body.
- **W-16:** Backfill schedule changed Mon 2am to Mon 8am (in §9 prose).
- **W-17:** §9 `runWeeklyBackfill_` excerpt replaced with real implementation pattern (active spreadsheet, uppercase day names, `startsWith`, pre-loaded key Set, `skipLock=true`).
- **W-18:** UDP-adjacent; schema-history 22-col row left in place as historical record.

### docs/waratah/for-developers/05-rollover-and-triggers.md
- **R-1:** Backfill row in §2 table changed to Mon 08:00; §12 changed "five hours before" to "13 hours before"; section heading updated.
- **R-2:** Revenue Digest row clarified with installer note; two-installer divergence flagged.
- **R-3:** No change required (count already matches table).
- **R-4:** Daily maintenance row changed to Daily 06:00 with Apps Script 6-7am window.
- **R-5:** §3 trailing paragraph rewritten: installer is gutted (no trigger created); wrapper `runScheduledOverdueSummary` is the gutted handler; internal `sendOverdueTasksSummary_` still implemented but unreachable.
- **R-6:** §4 sequence rewritten to 11 real steps; 30s lock; named-range verification + health check; no email/Slack-on-success.
- **R-7:** §4.1 preconditions rewritten to 5 real Script-Property/sheet checks.
- **R-8:** §4.2 idempotency rewritten to real string-equality logic with `parseCellDate_`/`formatDate` round-trip.
- **R-9:** No change needed.
- **R-10:** §6 reversed: tabs ARE renamed; the underlying sheet object is unchanged so named ranges stay bound.
- **R-11:** §6 excerpt rewritten: all 7 day names iterated; `B3:F3` clear-then-write; `setName` rename.
- **R-12:** §7 archive structure rewritten as YYYY/YYYY-MM/{pdfs|sheets}; fabricated `getISOWeek_` helper removed; correct PDF/snapshot naming convention added.
- **R-13:** §8 dry-run paragraph rewritten: plain-text report logged + UI-alert, not JSON; `_warListClearableCells_`/`_warComputeNextDates_` flagged as non-existent.
- **R-14:** Menu labels left as written (UDP-2 unverified per directive); not edited.
- **R-15:** §10 fabricated `inspectTriggers_` helper code block removed; replaced with a prose pointer to the editor's Triggers panel and a one-off snippet on `ScriptApp.getProjectTriggers()`.

### docs/waratah/for-developers/06-task-management-internals.md
- **T-1:** No change needed (doc 06 already says 9 states correctly).
- **T-2:** §3 STAFF_LIST split note corrected to "7 named individuals + 7 team/group entries".
- **T-3:** §4 transition table prefixed with "Suggested transitions (not enforced by code)"; surrounding prose clarified the dropdown is unconstrained.
- **T-4:** Auto-return-DEFERRED row deleted from §4 transition list and from "Automatic transitions" table; explicit negation added stating no hold-until field exists. §9 step 5 also removed (see T-13).
- **T-5:** §5 escalation excerpt rewritten with real helpers: `SpreadsheetApp.openById(getTaskSpreadsheetId_())`, inline days-blocked math, `bk_*` builders, `bk_post`, `buildEscalationEmailHtml_`.
- **T-6:** No change needed.
- **T-7:** §6 recurring tasks rewritten fundamentally: fires on `STATUSES.DONE` (not RECURRING); generates new TO DO instance; resets original's Recurrence to "None". Doc's "template stays at RECURRING permanently" claim corrected.
- **T-8:** §6 `getNextMonday_` excerpt replaced with real body; `computeNextOccurrence_` flagged as non-existent and replaced with inline switch; Monthly behaviour corrected ("snaps to next Monday after adding one calendar month", does not preserve day-of-month).
- **T-9:** §7 audit action enum replaced with the real set: EDIT, STATUS_CHANGE, CLEANUP, MIGRATION, ESCALATION, RECURRING_REGENERATED, ARCHIVE, CREATED, WEEKLY_SUMMARY, MAINTENANCE_ERROR, REFORMAT, TEST.
- **T-10:** No change needed.
- **T-11:** §8 onEdit text corrected: installable trigger; full UrlFetch/MailApp permissions; BLOCKED handler highlights cell only; bi-hourly cleanup does not dispatch DMs.
- **T-12:** §8 `notifyAssigneeOfBlock_` claim removed; explicit negation that no immediate-BLOCKED notification exists; real cell-highlight side-effect described.
- **T-13:** §9 daily maintenance: step 3 renamed `archiveOldCompletedTasks_`; step 5 (returnDeferredTasksWhenDue_) removed; success-path MAINTENANCE_COMPLETE log removed; failure log changed to MAINTENANCE_ERROR.
- **T-14:** §9 changed "daily 7am workhorse" to "daily 6am workhorse (Apps Script 6-7am window)"; §5 prose also corrected.
- **T-15:** Final MAINTENANCE_COMPLETE log removed from §9 excerpt.
- **T-16:** §10 weekly summary excerpt rewritten as two-stage `_sendWeeklyActiveTasksSummaryCore` + `_sendWeeklyActiveTasksDMs_`; channel-post commented out; `getSlackDmWebhooks_()` used instead of direct property read.
- **T-17:** §11 trigger-installer table: overdue-summary row marked "(gutted; no trigger created)"; trailing prose paragraph rewritten to explain wrapper vs internal handler vs gutted installer.
- **T-18:** No change needed.
- **T-19:** UDP; left in place.

## Phase A+B consequences applied
- Revenue Digest schedule treated as Mon 4pm canonical per Phase A; the doc 05 §2 table retained "Mon 16:00" and gained an installer-divergence note.
- 9 statuses, 25-col schema, `runWaratahWeeklyRollover` naming, Daily maintenance 6am, no Basic Report and no `sendShiftReportBasic` references introduced.
- "Phase 1.3" phrase not used.

## Style verification (counts)
- Em-dash count across the 3 modified docs: 0
- Stale-pattern hits:
  - "The Waratah Tools": 0
  - "Send Shift Report": 0
  - "Send TEST Report": 0
  - "Basic Report": 0
  - "8-status": 0
  - "36 fields": 0
  - "22-col": 1 (legitimate historical schema-version row in 04 §11; UDP-1 left as-is per directive)
  - "Phase 1.3": 0
- Fabricated function names appearing as positive references (not in negation form): 0. Each remaining occurrence is wrapped in a "there is no `X` helper" / "X does not exist" sentence.
- Schema column counts: NIGHTLY=25, OPERATIONAL=8, WASTAGE=6, QUALITATIVE=11 (matches code ground truth).

## Anything that did not fix cleanly
- R-14 (menu labels) flagged UDP-2 in the audit and was left unedited per directive.
- The schema-history table in 04 §11 retains its 17-col / 16-col / 22-col rows (UDP-1 unverified). The current 25-col row is accurate.
- §9 prose in doc 06 still references `getTaskSpreadsheetId_()` in the escalation excerpt; this helper does exist per audit evidence (lines 1074-1162 open the sheet via this pattern), so no negation form needed.
