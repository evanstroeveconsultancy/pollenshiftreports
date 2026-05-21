# Phase B — Admin Tier Edit Log

## Summary
- Findings actioned: 21 (out of 29; 5 Unverified UA-* skipped, 3 "correct/no change needed" skipped)
- Findings skipped (Unverified or "no change needed"): 8 (UA-1/A1-6, UA-2/A3-14, UA-3/A3-12, UA-4, UA-5/A4-7; plus A1-4, A1-11, A2-1, A2-6, A2-7, A3-8, A4-6 marked correct)
- Files modified: README.md, 01-configuration-reference.md, 02-staff-and-access-management.md, 03-advanced-troubleshooting.md, 04-deployment-and-clasp.md
- Trigger tables rewritten: 03-advanced-troubleshooting.md §6 (replaced both SR and TM tables); 04-deployment-and-clasp.md §5 Step 2 (SR table) and §5 Step 3 (TM table)
- Sections deleted: None (replaced text in-place)
- Edit method used per file: Edit (targeted edits across all five)

## Edits applied per finding, grouped by file

### docs/waratah/for-admins/README.md
- **Finding A0-1 (LOW):** "Phase 1.3 mistake" replaced with "common mistake" (removed Phase 1.3 phrase).
- **Finding A0-2 (LOW):** "waratah/develop clasp project" wording replaced with "Apps Script project bound to the [shift report / Master Actionables] spreadsheet".
- **Finding A0-3 (LOW):** No change required (claim was correct).

### docs/waratah/for-admins/01-configuration-reference.md
- **Finding A1-1 (CRITICAL):** SLACK_DM_WEBHOOKS row reworded to clarify it is used by Task Management project; SR copy is hygiene/symmetry only.
- **Finding A1-2 (HIGH):** Section 3 table reworked — added "Read by Shift Report runtime?" column, marked four properties as hygiene-only in SR (SLACK_MANAGERS_CHANNEL_WEBHOOK, SLACK_DM_WEBHOOKS, ESCALATION_EMAIL, ESCALATION_SLACK_WEBHOOK).
- **Finding A1-3 (HIGH):** Property count corrected — "22 properties (21 standard + 1 optional)" replaced with "20 written by setupScriptProperties() (18 required + 2 default AI Insights); plus 3 optional manually-set properties = up to 23 total". Section 2 heading retitled.
- **Finding A1-4 (LOW correct):** No change needed.
- **Finding A1-5 (LOW):** AI_INSIGHTS_MODE and AI_INSIGHTS_EVAN_EMAIL reclassified in table as "Optional (defaulted by setup)".
- **Finding A1-6 (UNVERIFIED):** Skipped.
- **Finding A1-7 (LOW):** "older format from before the May 2026 update" sentence removed; replaced with plain statement that array form is invalid.
- **Finding A1-8 (LOW):** Added footnote on dynamic resolution of `${VENUE_NAME}_SLACK_WEBHOOK_*` keys to both LIVE and TEST rows.
- **Finding A1-9 (UNVERIFIED expanded):** Added `WARATAH_SHEET_ID` to the Spreadsheet IDs table as an optional fallback property read by IntegrationHubWaratah.js.
- **Finding A1-10 (MEDIUM):** TASK_MANAGEMENT_SPREADSHEET_ID / WARATAH_TASK_MANAGEMENT_ID reworded — they are independent properties read by different files, admins must set them to identical values (no auto-aliasing).
- **Finding A1-11 (LOW correct):** No change.
- **Finding A1-12 (HIGH):** Section 8 fully rewritten with per-property "Read by SR runtime? / Read by TM runtime?" columns and clarification that only MENU_PASSWORD and TASK_MANAGEMENT_SPREADSHEET_ID are functionally dual-read.
- Also: ESCALATION_EMAIL and ESCALATION_SLACK_WEBHOOK rows in Section 2 reworded to say SR stores them for symmetry only.
- Also: Section 1 two-project caution updated to drop "Phase 1.3" language and reflect the corrected hygiene-only model.

### docs/waratah/for-admins/02-staff-and-access-management.md
- **Finding A2-1 (LOW correct):** No change.
- **Finding A2-2 (HIGH):** Section 2 Step 4 reworded — SR project copy of SLACK_DM_WEBHOOKS is hygiene/symmetry only; TM copy is the consequential one.
- **Finding A2-3 (HIGH):** Section 2 Step 6 rewritten — verification now uses a Task Management dropdown change to trigger a DM, not Send TEST shift report (which does not exercise SLACK_DM_WEBHOOKS). Email recipient verification retained separately via TEST report.
- **Finding A2-4 (LOW):** All three menu-path references updated to `Task Management > 🔐 Admin Tools > Cleanup > 🔧 Reapply Dropdowns & Formatting` (replace_all).
- **Finding A2-5 (LOW):** "roughly 17" replaced with "about 20".
- **Finding A2-6 / A2-7 (LOW correct):** No change.
- Section 8 dual-update reminder rewritten to flag which properties are functionally dual-read and which are hygiene-only.

### docs/waratah/for-admins/03-advanced-troubleshooting.md
- **Finding A3-1 (HIGH):** `performWeeklyRollover` references updated to `runWaratahWeeklyRollover` (current) with legacy name retained as parenthetical.
- **Finding A3-2 (CRITICAL):** "Run Weekly Rollover Now" path replaced with full path `Waratah Tools > Admin Tools > Weekly Reports > Weekly Rollover (In-Place) > Run Rollover Now`.
- **Finding A3-3 (CRITICAL):** "Clear Manager Inputs (Day)" menu item deleted; replaced with guidance to re-run rollover idempotently or contact developer.
- **Finding A3-4 (CRITICAL):** Section 6 SR trigger table fully rewritten with correct handlers and Phase A canonical schedules (rollover Mon 9pm, backfill Mon 8am, digest Mon 4pm) and real menu paths.
- **Finding A3-5 (CRITICAL):** Section 6 TM trigger table fully rewritten with 6 correct handlers and real menu paths under `🔐 Admin Tools > 🔧 Setup Triggers`. `createDailyMaintenanceTrigger` noted as Apps Script editor only.
- **Finding A3-6 (HIGH):** "Daily 7am" corrected to "Daily 6am (fires within the 6 to 7am window)" in §6 and §9.
- **Finding A3-7 (CRITICAL):** "Rebuild All Dashboards" replaced with two-step `Build Financial Dashboard` then `Build Executive Dashboard`.
- **Finding A3-8 (LOW correct):** No change.
- **Finding A3-9 (CRITICAL):** "Re-sync Tasks" menu item deleted; replaced with guidance that `pushTodosToMasterActionables` runs in the export pipeline, so re-running export re-syncs.
- **Finding A3-10 (HIGH):** "Run Escalation Now" replaced with `Task Management > 🔐 Admin Tools > Manual Actions > Check Blocked Escalations Now`.
- **Finding A3-11 (MEDIUM):** "Run Revenue Digest Now" replaced with `Waratah Tools > Admin Tools > Weekly Digest > Send Revenue Digest (LIVE)` (two locations in §7).
- **Finding A3-12 (UNVERIFIED):** Skipped.
- **Finding A3-13 (MEDIUM):** `sendWeeklyDigest_Waratah` (with "or similar" hedge) replaced with `sendWeeklyRevenueDigest_Waratah` in §7.
- **Finding A3-14 (UNVERIFIED):** Skipped (replaced with the verified `pushTodosToMasterActionables` name as part of A3-9 fix).
- Section 10 quick-ref updated for new rollover handler name.

### docs/waratah/for-admins/04-deployment-and-clasp.md
- **Finding A4-1 (MEDIUM):** Pre-deploy Step 1 reworded to include both `WARATAH_SHIFT_REPORT_CURRENT_ID` and `WARATAH_WORKING_FILE_ID` (plus `WARATAH_SHEET_ID` if used).
- **Finding A4-2 (CRITICAL):** §5 Step 2 SR trigger table fully replaced with correct handler/schedule/menu mapping per Phase A canonical schedule (digest Mon 4pm).
- **Finding A4-3 (CRITICAL):** §5 Step 3 TM trigger table fully replaced — all six handlers corrected, on-edit handler clarified as installable not simple, daily maintenance noted as not menu-exposed.
- **Finding A4-4 (MEDIUM):** §6 rollback flow replaced — `clasp pull` removed; replaced with `git checkout <previous-commit-sha>` then `clasp push`. Explicit note added that `clasp pull` is the wrong direction for rollback.
- **Finding A4-5 (MEDIUM):** §8 quick-reference updated — SR "3 triggers via menu (Setup All SR Triggers installs all three)"; TM "5 triggers via menu plus 1 from the Apps Script editor".
- **Finding A4-6 (LOW correct):** No change.
- **Finding A4-7 (UNVERIFIED):** Skipped.
- **Finding A4-8 (LOW opportunity):** Skipped (optional only).

## Phase A consequences applied
- Basic Report references deleted from: none (no "Basic Report" wording appeared in these five admin docs)
- Digest schedule normalised to Mon 4pm in: 03-advanced-troubleshooting.md §6, 04-deployment-and-clasp.md §5 Step 2 (both tables now say Mon 4pm canonical)
- Trigger handler names corrected: 8 (performWeeklyRollover, sendWeeklyDigest_Waratah, backfillEntireWeekToWarehouse, runStatusCleanup, refreshStaffWorkload, archiveCompletedTasks, sendWeeklyActiveTaskSummary, onEdit) — replaced with their real names per the Decision 3 tables
- "Reinstall X" replaced with real menu names: all occurrences (zero remain)
- `clasp pull` rollback replaced with git-checkout flow: yes

## Style verification
- Em-dash count across all 5 modified docs: 0
- "Reinstall " occurrences: 0
- "performWeeklyRollover" occurrences: 1 (intentional, kept as parenthetical legacy reference next to current `runWaratahWeeklyRollover`)
- "sendWeeklyDigest_Waratah" occurrences (without "Revenue" in middle): 0
- "Wed 8am" / "Mon 9am" digest references (excluding history notes): 0
- "Basic Report" / "Send Basic Report": 0
- "Phase 1.3" occurrences: 0
- "clasp pull" used as rollback procedure: 0 (the two remaining `clasp pull` mentions are: §1 descriptive table entry; §6 explicit anti-pattern warning that `clasp pull` is wrong direction)

## Anything that did not fix cleanly
- A4-7 (clasp open behavior) and A4-8 (scriptIds) marked UNVERIFIED / optional — skipped per rules.
- A1-6 (archive folder naming convention `YYYY-Www`) left as-is; UNVERIFIED.
- A3-12 (HTTP error code mapping for Slack) left as-is; UNVERIFIED informational only.
- A3-14 (`pushTasksToManagement_` example) effectively superseded by A3-9 fix which uses the verified `pushTodosToMasterActionables` name.
