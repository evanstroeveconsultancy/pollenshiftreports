# Phase B — Manager Tier Edit Log

## Summary
- Findings actioned: 42 (out of 48; 5 UM-* unverified findings deliberately skipped; 1 was "no change needed")
- Findings skipped (Unverified or "no change needed"): 6 — UM-1, UM-2, UM-3, UM-4, UM-5; M0-1 (no change needed); M0-3 (no change needed); M1-14 (no change needed); M1-17 (no change needed); M2-3 (no change needed); M2-6 (no change needed); M2-12 (only the 7-day part actioned, day/time was correct); M2-14 (no change needed); M2-27 (no change needed); M2-28 (no change needed); M4-2 (no change needed); M4-3 (note only, no doc change); M4-4 (no change needed); M4-5 (no change needed); M4-9 (no change needed)
- Files modified: 6 (README.md, 01-shift-reports.md, 02-task-management.md, 03-weekly-automation.md, 04-staff-and-recipients.md, 05-troubleshooting.md)
- Sections rewritten end-to-end: 01-shift-reports.md:Section 2 (six-step pipeline), 01-shift-reports.md:Section 5 (menu structure), 02-task-management.md:Section 9 (Slack notifications), 03-weekly-automation.md:Section 2 (rollover steps), 03-weekly-automation.md:Section 3 (Drive archive layout), 03-weekly-automation.md:Section 4 (Revenue Digest), 03-weekly-automation.md:Section 7 (bi-hourly cleanup), 04-staff-and-recipients.md:Section 3 (DM scope), 04-staff-and-recipients.md:Section 4 (channel webhooks), 05-troubleshooting.md:Section 6 (rollover symptom-spotting)
- Sections deleted: README.md:Glossary "Basic Report" entry; 02-task-management.md:Section 6 row "DEFERRED hold-until auto-transition"; 02-task-management.md:Section 7 fabricated cleanup behaviour; 02-task-management.md:Section 9 fabricated DM-on-assignment/URGENT/due-date scenarios; 02-task-management.md:Section 12 fabricated "Status History column"; 03-weekly-automation.md:Section 2 "Slack confirmation on success"; 03-weekly-automation.md:Section 3 task-archive Drive file fabrication; 04-staff-and-recipients.md:Section 4 mirror-channel fabrication
- Edit method used per file: README.md → Edit; 01-shift-reports.md → Write (full rewrite due to Section 5 + Section 2 structural changes); 02-task-management.md → Edit (many targeted); 03-weekly-automation.md → Edit (many targeted); 04-staff-and-recipients.md → Edit; 05-troubleshooting.md → Edit

## Edits applied per finding, grouped by file

### docs/waratah/for-managers/README.md
- **Finding M0-1:** No change needed — file count correct.
- **Finding M0-2:** Changed "8-status workflow" reference in TOC table → "9-Status Workflow"; existing glossary entry already said "9-Status Workflow".
- **Finding M0-3:** No change needed (escalation glossary accurate).
- **Finding M0-4:** Updated four legacy paths to `docs/waratah/_archive/` locations.
- **Phase A consequence:** Removed "Basic Report" glossary entry. Updated "weekly backfill" in TOC table to "Monday 8am backfill".

### docs/waratah/for-managers/01-shift-reports.md
- **Finding M1-1, M1-2:** Replaced "Send Shift Report" / "Send TEST Report" with "Export & Email PDF (LIVE)" and "Export & Email (TEST to me)" throughout.
- **Finding M1-3:** Dropped "The" before "Waratah Tools"; restructured Section 5 to show `Waratah Tools > Daily Reports > [item]` paths.
- **Finding M1-4:** Removed "Open Task Manager" row from the menu table; added explanatory note that it lives in the Task Management spreadsheet's own menu.
- **Finding M1-5:** Removed "Refresh Dashboard" row.
- **Finding M1-6:** Deleted "View Current PDF Preview" row.
- **Finding M1-7:** Deleted "Send Basic Report" row (Phase A removed the broken menu wire).
- **Finding M1-8:** Added "Open Export Dashboard" row to the Daily Reports submenu table.
- **Finding M1-9:** Rewrote Section 2 pipeline to the 6 sequential steps documented in the `exportAndEmailPDF` header.
- **Finding M1-10:** Softened "30 seconds" to "typically completes within tens of seconds".
- **Finding M1-11:** Replaced explicit DM enumeration with pointer to `WARATAH_EMAIL_RECIPIENTS` / `SLACK_DM_WEBHOOKS` Script Properties and link to `04-staff-and-recipients.md`.
- **Finding M1-12:** Replaced fabricated five-recipient list (with "Ian") with the same pointer language.
- **Finding M1-13:** Corrected backfill menu path to `Waratah Tools > Admin Tools > Data Warehouse > Backfill This Sheet to Warehouse`.
- **Finding M1-14:** No change needed.
- **Finding M1-15:** Replaced "36 field config, 197 named ranges" with a pointer to `namedRangeHealthCheck_Waratah` (marked UNVERIFIED in spirit).
- **Finding M1-16:** Re-sync Tasks fabrication is in 02-task-management.md; cross-reference fixed there.
- **Finding M1-17:** No change needed.

### docs/waratah/for-managers/02-task-management.md
- **Finding M2-1:** Standardised "9-state workflow" → "9-Status Workflow".
- **Finding M2-2:** Changed TO DO colour "White" → "Orange".
- **Finding M2-3:** No change needed.
- **Finding M2-4:** Kept Orange colour, removed auto-return claim.
- **Finding M2-5:** Changed RECURRING colour "Light green" → "Purple".
- **Finding M2-6:** No change needed.
- **Finding M2-7:** Deleted DEFERRED auto-return row from Section 5 automatic-transitions table; rewrote Section 11 "Defer a task" steps to remove Hold-Until column reference.
- **Finding M2-8:** Rewrote bi-hourly cleanup row in Section 7 to "Removes blank rows and re-sorts tasks by Active/Priority/Status/Staff."
- **Finding M2-9, M2-22:** Rewrote Section 8 "Setting up a recurring task" to match code (set Recurrence column, generation on DONE). Added note about 30-day archive of DONE instances.
- **Finding M2-10:** Changed "Recurrence (column M)" → "Recurrence (column L)".
- **Finding M2-11, M3-5:** Daily task maintenance row now says "Daily 6am (Apps Script 6 to 7am window)".
- **Finding M2-12, M2-13:** Archive cutoff updated everywhere "7 days" → "30 days".
- **Finding M2-14:** No change needed.
- **Finding M2-15, M2-16, M2-18:** Rewrote Section 9 Slack notifications: removed assignment-DM, URGENT-DM, due-date-DM, unassign-DM rows. Kept only weekly summary + BLOCKED-14d escalation. Section 6 priority text updated: URGENT now described as visual highlight + sort order. Section 11 reassign and change-priority steps updated.
- **Finding M2-17:** Due-date DM claim removed (Section 9 rewrite).
- **Finding M2-19:** Section 12 rewritten: replaced hidden-columns-on-row claim with description of separate AUDIT LOG sheet. FAQ "undo a status change" updated to reference AUDIT LOG.
- **Finding M2-20:** Removed "(or use Waratah Tools > New Task)" from Section 11; instruct user to type in next empty row.
- **Finding M2-21:** Replaced "Re-sync Tasks" with `Waratah Tools > Admin Tools > Setup & Utilities > Backfill TO-DOs (All Days)`.
- **Finding M2-23:** Corrected Section 2 tabs row to "MASTER ACTIONABLES SHEET + Archive + AUDIT LOG + Dashboard". Removed stray "+ Task Management" from shift report side.
- **Finding M2-24:** Section 3 "From either spreadsheet" → "In the Task Management spreadsheet, click Task Management > Open Task Manager"; renamed tab references to "MASTER ACTIONABLES SHEET tab".
- **Finding M2-25:** Section 10 dashboard refresh claim corrected to "Staff workload data refreshes daily at 6am; the dashboard layout is rebuilt manually via the Task Management menu's admin tools."
- **Finding M2-26:** UNVERIFIED — left as is.
- **Finding M2-27, M2-28:** No change needed.
- **Finding M2-29:** Area default changed "blank" → "General" in two places.

### docs/waratah/for-managers/03-weekly-automation.md
- **Finding M3-1, M3-18:** Backfill schedule "Monday 2am" → "Monday 8am" (table, Section 8 heading and body).
- **Finding M3-2, M3-11:** Revenue Digest schedule normalised to Mon 4pm per Phase A canonical decision (table row, Section 4 heading and body retained Mon 4pm).
- **Finding M3-3, M3-4:** No change needed (already correct).
- **Finding M3-5:** Daily task maintenance corrected to 6am window.
- **Finding M3-6:** Section 2 rewritten to 4 steps. Removed "emailed to the six recipients" — replaced with "archives the PDF to Drive; the rollover itself does not email".
- **Finding M3-7:** Removed "Posts a Slack confirmation" step; replaced with "Success is silent; on failure Slack posts an error via notifyError_". Updated Section 2 verification checks accordingly.
- **Finding M3-8:** Filename templates corrected to `Waratah Shift Report W.E. DD.MM.YYYY.pdf` / same name without `.pdf` for snapshot.
- **Finding M3-9:** Replaced ISO-week folder claim with the real `Archive/YYYY/YYYY-MM/{pdfs|sheets}/` layout.
- **Finding M3-10:** Removed the fabricated `Waratah_Tasks_YYYY-MM-DD.gsheet` bullet.
- **Finding M3-12:** Revenue Digest content list rewritten to match `WeeklyDigestWaratah.js` actual output (revenue vs last week, total tips, days reported, best shift).
- **Finding M3-13:** Digest menu path corrected to `Waratah Tools > Admin Tools > Weekly Digest > Send Revenue Digest (LIVE)`.
- **Finding M3-14:** UNVERIFIED — left as is.
- **Finding M3-15:** "Rebuild All Dashboards" replaced with the two actual menu items (Build Financial Dashboard and Build Executive Dashboard under Admin Tools > Analytics).
- **Finding M3-16:** "Refresh Dashboard" replaced with `Task Management > Admin Tools > Dashboard > Refresh Staff Workload Stats` in the Task Management spreadsheet.
- **Finding M3-17:** Bi-hourly cleanup rewritten to remove fabricated DEFERRED auto-progress and RECURRING-DONE claims; now describes the real sort + remove-empty-rows scope.
- **Finding M3-19, M3-20:** Backfill manual instructions corrected — `Backfill This Sheet to Warehouse` for single sheet, ask Evan to run `runWeeklyBackfill_` from the Apps Script editor for whole-week.
- **Finding M3-21:** Added one-sentence mention of `setupAllTriggers_Waratah` convenience function.
- Archive cutoff "7 days" → "30 days" in Section 7's weekly archive description.

### docs/waratah/for-managers/04-staff-and-recipients.md
- **Finding M4-1, M4-8:** Section 1 "5 role-based options" → "7 non-individual options (5 team-level plus 2 catch-all)". Section 7 reworded with matching breakdown.
- **Finding M4-2, M4-3, M4-4, M4-5, M4-9:** No change needed.
- **Finding M4-6:** Section 3 intro rewritten — clarified DM webhooks are used for task notifications (weekly summary, BLOCKED escalations), not the nightly shift report which uses a single LIVE channel webhook.
- **Finding M4-7:** Section 4 rewritten with the four real Script Property names (`WARATAH_SLACK_WEBHOOK_LIVE`, `WARATAH_SLACK_WEBHOOK_TEST`, `SLACK_MANAGERS_CHANNEL_WEBHOOK`, `ESCALATION_SLACK_WEBHOOK`). Removed fabricated `WARATAH_SLACK_WEBHOOK_PRIMARY` and `WARATAH_SLACK_WEBHOOK_TASKS`. Removed fabricated mirror-channel post claim. Section 7 quick-lookup updated to list the four webhook properties.
- **Finding M4-10:** Section 6 Reapply Dropdowns path corrected to `Task Management > Admin Tools > Cleanup > Reapply Dropdowns & Formatting` in the Task Management spreadsheet, marked as admin-password gated.

### docs/waratah/for-managers/05-troubleshooting.md
- **Finding M5-1:** Section 2 reworded to differentiate Waratah Tools (shift report) and Task Management (task spreadsheet) menus.
- **Finding M5-2, M5-7:** Rollover menu path corrected to `Waratah Tools > Admin Tools > Weekly Reports > Weekly Rollover (In-Place) > Run Rollover Now`.
- **Finding M5-3:** Digest path corrected to `Waratah Tools > Admin Tools > Weekly Digest > Send Revenue Digest (LIVE)`.
- **Finding M5-4:** Backfill instruction corrected — `Backfill This Sheet to Warehouse` for per-sheet, ask Evan to run `runWeeklyBackfill_` for full week.
- **Finding M5-5:** "Send Shift Report" replaced with `Export & Email PDF (LIVE)` in Section 4 body and Section 8 and Section 9 quick table.
- **Finding M5-6:** "Send TEST Report" replaced with `Export & Email (TEST to me)`; TEST mode emails-only-running-user clarification added.
- **Finding M5-8:** "Clear Manager Inputs (Day)" fabrication replaced with description of the actual remediation (re-run rollover, or have Evan use `_warClearAllSheetData_` from the script editor). Rollover summary corrected from "five things" to "four things" to match Section 2 corrections; added the "success silent / failure Slacks error via notifyError_" sentence.
- **Finding M5-9:** "197 named ranges" replaced with pointer to `namedRangeHealthCheck_Waratah` diagnostic.
- **Finding M5-10:** Quick-table row reworded to point to Task Management spreadsheet's Admin Tools menu with password gate; "Yes" changed to "Partly (needs admin password)".

## Phase A consequences applied
- Basic Report references deleted from: README.md (glossary entry), 01-shift-reports.md (Section 5 table row), 05-troubleshooting.md (replaced in Section 6 recovery procedure with the re-run-rollover or `_warClearAllSheetData_` remediation).
- Digest schedule normalised to Mon 4pm in: README.md (TOC line already correct), 01-shift-reports.md (Section 1 table), 03-weekly-automation.md (Section 1 table; Section 4 heading and body). No "Wed 8am" or "Mon 9am" wording introduced into manager-tier docs.
- Fabricated-feature paragraphs deleted (count: 8): Hold-Until column / auto-return DEFERRED (02:Sections 5, 11; 03:Section 7), Status History row column (02:Section 12), DM-on-assignment / DM-on-URGENT / DM-on-unassign / DM-on-due-date (02:Sections 6, 9, 11), Bi-hourly cleanup advancing DEFERRED + marking RECURRING DONE (02:Section 7; 03:Section 7), Rollover Slack confirmation on success (03:Section 2; 05:Section 6), Mirror channel post (04:Section 4), Drive task-archive .gsheet (03:Section 3), Clear Manager Inputs (Day) menu (05:Section 6).

## Style verification (greps run on all 6 modified docs)
- Em-dash count: 0
- "The Waratah Tools" occurrences: 0
- "Send Shift Report" occurrences: 0
- "Send TEST Report" occurrences: 0
- "Basic Report" occurrences: 0
- "8-status" / "8-state" occurrences: 0
- "Hold-Until" occurrences: 0
- "Status History column" occurrences: 0
- "Mon 2am" / "Monday 2am" occurrences: 0
- "Mon 4pm" / "Monday 4pm" occurrences: 5 (all correct per Phase A canonical schedule)
- "auto-return" occurrences: 1 (a negation explaining the system does NOT auto-return DEFERRED; this is the corrected wording per Finding M2-7)

## Anything that did not fix cleanly
- M1-15 / M5-9 / UM-4: The "197 named ranges" claim could not be replaced with a verified figure because the actual installed count requires running `namedRangeHealthCheck_Waratah` against the live sheet. The doc now points the reader to that diagnostic rather than asserting a number. Per the spec, UNVERIFIED claims were skipped from definitive replacement.
- M2-26 / UM-2: "Trend chart of open task count over the last 8 weeks" was left in place (Section 10 bullet) per the spec to skip UM-prefixed findings.
- M3-14 / UM-3: EXECUTIVE_DASHBOARD content description left in place per spec.
- M4-3: Code-vs-doc dropdown order is a note-only finding; no doc change required.
- M4-5: Section 3 "6 recipients" intro count was preserved since the table is internally consistent (6 "Yes" rows out of 8). The intro line was rewritten anyway to reflect M4-6's correction (DMs are for task notifications, not nightly shift reports), so the count is now phrased as "six people have a personal DM webhook configured".
