# Tier 3: Admins — Documentation Accuracy Audit

**Auditor:** Claude (Opus 4.7)
**Date:** 2026-05-17
**Scope:** Five admin-tier docs verified against authoritative GAS source in `THE WARATAH/SHIFT REPORT SCRIPTS/` and `THE WARATAH/TASK MANAGEMENT SCRIPTS/`.

## Files Reviewed

- `docs/waratah/for-admins/README.md` (84 lines)
- `docs/waratah/for-admins/01-configuration-reference.md` (267 lines)
- `docs/waratah/for-admins/02-staff-and-access-management.md` (299 lines)
- `docs/waratah/for-admins/03-advanced-troubleshooting.md` (260 lines)
- `docs/waratah/for-admins/04-deployment-and-clasp.md` (214 lines)

## Code Sources Consulted

- `THE WARATAH/SHIFT REPORT SCRIPTS/_SETUP_ScriptProperties.js` (entire — 280 lines)
- `THE WARATAH/TASK MANAGEMENT SCRIPTS/_SETUP_ScriptProperties.gs` (entire — 234 lines)
- `THE WARATAH/SHIFT REPORT SCRIPTS/MenuWaratah.js` (entire — 282 lines)
- `THE WARATAH/TASK MANAGEMENT SCRIPTS/Menu_Updated_Waratah.gs` (entire — 239 lines)
- `THE WARATAH/TASK MANAGEMENT SCRIPTS/EnhancedTaskManagementWaratah.gs` (lines 1-130, 270-290, 1579-1631, 1850-2200)
- `THE WARATAH/SHIFT REPORT SCRIPTS/NightlyExportWaratah.js` (lines 1-150, sampled webhook/recipient lines)
- `THE WARATAH/SHIFT REPORT SCRIPTS/VenueConfig.js` (entire)
- `THE WARATAH/SHIFT REPORT SCRIPTS/WeeklyDigestWaratah.js` (sampled — trigger + sender)
- `THE WARATAH/SHIFT REPORT SCRIPTS/IntegrationHubWaratah.js` (sampled — runWeeklyBackfill_, setupWeeklyBackfillTrigger)
- `THE WARATAH/SHIFT REPORT SCRIPTS/WeeklyRolloverInPlaceWaratah.js` (createRolloverTrigger_Waratah at line 810, sampled)
- `THE WARATAH/TASK MANAGEMENT SCRIPTS/.clasp.json` (scriptId `1uCT7Be2OU6eCL1BhbOC3MFN0rpMH8W1oJH-ROi_yf7AFN5BGlhWJAqQG`)
- `THE WARATAH/SHIFT REPORT SCRIPTS/.clasp.json` (MISSING — not present locally)
- `.remember/remember.md` (empty file — no Phase 1 cutover state recorded here)

## Findings Summary

- Critical: 4
- High: 9
- Medium: 7
- Low: 4
- Unverified: 5

The most serious issues are: (a) a fabricated cross-project property model — `SLACK_DM_WEBHOOKS` is read ONLY by the Task Management project, not by Shift Report code; (b) the **Reinstall Weekly Rollover/Digest/Backfill Trigger** menu items in 03 and 04 do not exist (real items have different names); (c) the **Send TEST Report**, **Rebuild All Dashboards**, **Clear Manager Inputs (Day)**, **Re-sync Tasks**, **Run Escalation Now**, **Run Revenue Digest Now**, and **Run Weekly Rollover Now** menu items in 03/04 do not exist; (d) trigger handler names and counts in 03 §6 and 04 §5 are wrong for both projects.

---

## Findings — for-admins/README.md

### Finding A0-1: "Phase 1.3 mistake" reference is opaque/unverifiable
- **Severity:** LOW
- **Doc location:** README.md:54, 80-82
- **Claim (exact quote):** "Selecting the wrong project and editing the wrong property is a common Phase 1.3 mistake."
- **Code reality:** "Phase 1.3" is not defined anywhere in the codebase or in `.remember/remember.md` (which is empty). The README also lists "Phase 1.3" as part of Phase 2/3 of consolidation. Reader-confusing.
- **Evidence:** `/Users/evanstroevee/Desktop/POLLEN SYSTEMS/SHIFT REPORTS 3.0/.remember/remember.md` is 0 bytes.
- **Recommended fix:** Either define "Phase 1.3" in context or remove the phrase. This is a wording issue, not a factual error.

### Finding A0-2: Both projects described as `waratah/develop` clasp project
- **Severity:** LOW
- **Doc location:** README.md:51-52
- **Claim (exact quote):** "Waratah Shift Report (`waratah/develop` clasp project) ... Waratah Task Management (`waratah/develop` clasp project, separate folder)"
- **Code reality:** `waratah/develop` is the GIT branch, not the clasp project. Clasp uses scriptId per directory: TM scriptId is `1uCT7Be2OU6eCL1BhbOC3MFN0rpMH8W1oJH-ROi_yf7AFN5BGlhWJAqQG` (`THE WARATAH/TASK MANAGEMENT SCRIPTS/.clasp.json`). The SR project has its own scriptId (file `.clasp.json` missing locally; gitignored per CLAUDE.md).
- **Evidence:** `THE WARATAH/TASK MANAGEMENT SCRIPTS/.clasp.json` contents.
- **Recommended fix:** Reword as "Waratah Shift Report (Apps Script project bound to the shift report spreadsheet) ... Waratah Task Management (separate Apps Script project bound to the Master Actionables spreadsheet)".

### Finding A0-3: README claims `SHEET_PROTECTION_OWNER_EMAIL` is an admin concept, but no actual menu links to it
- **Severity:** LOW
- **Doc location:** README.md table indirectly via 01 §2.
- **Claim (exact quote):** (covered under 01 finding)
- **Code reality:** `RunWaratah.js:855` does read `SHEET_PROTECTION_OWNER_EMAIL`, so this property does exist in code. No issue at README level.

---

## Findings — for-admins/01-configuration-reference.md

### Finding A1-1: SLACK_DM_WEBHOOKS claimed to be read by BOTH projects — FALSE
- **Severity:** CRITICAL
- **Doc location:** 01-configuration-reference.md:49, 103, 234 (and Section 8 dual-update rule)
- **Claim (exact quote):** "`SLACK_DM_WEBHOOKS` ... Personal Slack DMs per staff member. ... Also stored in Task Management project." and "Both projects DM staff (nightly report DMs from SR, task DMs from TM)."
- **Code reality:** `SLACK_DM_WEBHOOKS` is set in the SR project's `_SETUP_ScriptProperties.js:68` and added to the verify required-list at line 146, BUT it is never read by any non-setup code in the SR project. Only `EnhancedTaskManagementWaratah.gs:72` (Task Management project) actually reads it. Therefore the SR project does not DM staff for nightly reports.
- **Evidence:**
  - `grep "SLACK_DM_WEBHOOKS" THE WARATAH/SHIFT REPORT SCRIPTS/*.js` returns only `_SETUP_ScriptProperties.js:68` and `:146`.
  - `THE WARATAH/TASK MANAGEMENT SCRIPTS/EnhancedTaskManagementWaratah.gs:71-77` — only place outside setup that reads it.
  - `THE WARATAH/SHIFT REPORT SCRIPTS/NightlyExportWaratah.js` searched in full — no `SLACK_DM_WEBHOOKS`, no `dmWebhook`, no `sendDm` call.
- **Recommended fix:** Either (a) remove SR copy from setup and verify list (it's a stale leftover), or (b) clarify in docs that the SR project's copy is currently a no-op/stub. Update Section 8 to drop the dual-update claim for nightly DMs.

### Finding A1-2: Six properties claimed to exist in both projects — actual SR setup includes ALL six but reality is mixed
- **Severity:** HIGH
- **Doc location:** 01-configuration-reference.md:94-107 (Section 3) and 225-244 (Section 8)
- **Claim (exact quote):** "every property in [Task Management project] is also defined in the Shift Report project."
- **Code reality:** The SR `_SETUP_ScriptProperties.js:117-147` `verifyScriptProperties()` lists all six (MENU_PASSWORD, TASK_MANAGEMENT_SPREADSHEET_ID, SLACK_MANAGERS_CHANNEL_WEBHOOK, SLACK_DM_WEBHOOKS, ESCALATION_EMAIL, ESCALATION_SLACK_WEBHOOK). But of these, the SR project ACTUALLY READS only: MENU_PASSWORD (MenuWaratah.js:19), TASK_MANAGEMENT_SPREADSHEET_ID (TaskIntegrationWaratah.js:14, NightlyExportWaratah.js:540 comment), and SLACK_MANAGERS_CHANNEL_WEBHOOK is not read by SR code (no `getScriptProperties().getProperty('SLACK_MANAGERS_CHANNEL_WEBHOOK')` hit in SR `.js` files outside setup). ESCALATION_EMAIL and ESCALATION_SLACK_WEBHOOK are not read by SR code either.
- **Evidence:** `grep -rn "ESCALATION_EMAIL\|ESCALATION_SLACK_WEBHOOK\|SLACK_MANAGERS_CHANNEL_WEBHOOK" THE WARATAH/SHIFT REPORT SCRIPTS/*.js` only matches `_SETUP_ScriptProperties.js`.
- **Recommended fix:** Rewrite Section 8 to clarify that the SR project setup *stores* these for symmetry / cross-project hygiene, but only MENU_PASSWORD and TASK_MANAGEMENT_SPREADSHEET_ID are read by SR runtime code. Dual-update is still a valid practice but the criticality assertion ("system behaves erratically") is overstated.

### Finding A1-3: Property count claim — "21 standard + 1 optional" — mismatches setup
- **Severity:** HIGH
- **Doc location:** 01-configuration-reference.md:11
- **Claim (exact quote):** "Shift Report project ... 22 properties (21 standard + 1 optional)"
- **Code reality:** `setupScriptProperties()` in `_SETUP_ScriptProperties.js` writes 20 properties (line 91: `Logger.log('Total properties set: 20');` and `verifyScriptProperties()` declares 18 required + 3 optional = 21). The breakdown in the script's own log: "Shift Reports: 14 properties / AI Insights: 2 properties / Task Management: 4 properties" = 20. Plus `SHEET_PROTECTION_OWNER_EMAIL` is documented as not in setup (manual only).
- **Evidence:** `_SETUP_ScriptProperties.js:91, 93-95` Logger output; `:126-147` required array (18 items); `:180` optional array (3 items).
- **Recommended fix:** Replace "21 standard + 1 optional" with "20 written by `setupScriptProperties()` (18 required + 2 default AI Insights); plus optional `ANTHROPIC_API_KEY`, `SHEET_PROTECTION_OWNER_EMAIL`, and `AI_INSIGHTS_EVAN_EMAIL` set manually = 23 total potential".

### Finding A1-4: `setupScriptProperties()` claim "Sets all 20 standard properties" — true; doc Section 4 says "all 20" — consistent
- **Severity:** LOW
- **Doc location:** 01-configuration-reference.md:117
- **Claim (exact quote):** "Sets all 20 standard properties to their initial values."
- **Code reality:** Confirmed at `_SETUP_ScriptProperties.js:91`.
- **Recommended fix:** No fix needed; but consistent reconciliation with finding A1-3 needed.

### Finding A1-5: `verifyScriptProperties()` claim "Identifies the 18 required properties and the 3 AI Insights properties (optional)"
- **Severity:** LOW (correct)
- **Doc location:** 01-configuration-reference.md:121
- **Claim (exact quote):** "Identifies the 18 required properties and the 3 AI Insights properties (optional)."
- **Code reality:** Required array has 18 items (`_SETUP_ScriptProperties.js:126-147`); optional array has 3 items (`:180`: `['ANTHROPIC_API_KEY', 'AI_INSIGHTS_MODE', 'AI_INSIGHTS_EVAN_EMAIL']`). However the doc earlier says AI_INSIGHTS_MODE and AI_INSIGHTS_EVAN_EMAIL are "Yes (default)" required — internal inconsistency. AI_INSIGHTS_MODE gets a default value in setup (`'evan_only'`); AI_INSIGHTS_EVAN_EMAIL is set to placeholder.
- **Recommended fix:** Align doc: in the property table mark AI_INSIGHTS_MODE and AI_INSIGHTS_EVAN_EMAIL as "Optional (defaulted by setup)" so it matches verifyScriptProperties's classification of all three as "OPTIONAL / AI INSIGHTS".

### Finding A1-6: ARCHIVE_ROOT_FOLDER_ID weekly-folder naming claim — unverified detail
- **Severity:** UNVERIFIED
- **Doc location:** 01-configuration-reference.md:135-145
- **Claim (exact quote):** "Each week's folder is auto-created on Monday at 9pm by the rollover script. The naming convention is `YYYY-Www` (ISO week)."
- **Code reality:** I did not read the archive folder creation block in `WeeklyRolloverInPlaceWaratah.js`. Trigger schedule (Monday 21:00 = 9pm) is confirmed. Folder-naming format unverified.
- **Recommended fix:** Verify the folder-name format in `WeeklyRolloverInPlaceWaratah.js` archive section, then either confirm or correct.

### Finding A1-7: Section 6 "JSON array" remark — incorrect history claim
- **Severity:** LOW
- **Doc location:** 01-configuration-reference.md:170
- **Claim (exact quote):** "accidentally using the JSON array form (`["email1", "email2"]`) which is the older format from before the May 2026 update."
- **Code reality:** `_SETUP_ScriptProperties.js:43` writes a JSON.stringify of an object. The `verifyScriptProperties()` mask string at line 163 labels the value `[JSON ARRAY]` even though it is an object — this is a code comment artifact, not actual evidence of an "older array format". No code path exists that handled an array form.
- **Recommended fix:** Remove the "older format from before May 2026" reference. Just state: "Must be a JSON object mapping email→display-name, not an array."

### Finding A1-8: WARATAH_SLACK_WEBHOOK_LIVE/TEST loaded via dynamic `${VENUE_NAME}_SLACK_WEBHOOK_LIVE` — doc presents only static names
- **Severity:** LOW
- **Doc location:** 01-configuration-reference.md:46-47
- **Claim (exact quote):** "`WARATAH_SLACK_WEBHOOK_LIVE` ... `WARATAH_SLACK_WEBHOOK_TEST`"
- **Code reality:** Static property keys are correct. `NightlyExportWaratah.js:32-53` build the property name dynamically from `VENUE_NAME`. So if `VENUE_NAME` were ever set to something other than `WARATAH`, the keys would change shape. Same for `WARATAH_EMAIL_RECIPIENTS`.
- **Evidence:** `NightlyExportWaratah.js:32-66` — `getSlackWebhookLive_()`, `getSlackWebhookTest_()`, `getEmailRecipients_()` all use `${venueName}_...`.
- **Recommended fix:** Add a footnote: "These keys are read dynamically as `${VENUE_NAME}_SLACK_WEBHOOK_LIVE` etc. (`NightlyExportWaratah.js:32-53`). Changing `VENUE_NAME` would change the expected key names."

### Finding A1-9: WARATAH_WORKING_FILE_ID "usually identical to WARATAH_SHIFT_REPORT_CURRENT_ID" — unverified
- **Severity:** UNVERIFIED
- **Doc location:** 01-configuration-reference.md:64
- **Claim (exact quote):** "Alias for the current working spreadsheet. Usually identical to `WARATAH_SHIFT_REPORT_CURRENT_ID`."
- **Code reality:** `WeeklyRolloverInPlaceWaratah.js:246-252` reads `WARATAH_WORKING_FILE_ID` and uses it as a safety guard comparing against the active spreadsheet ID. `IntegrationHubWaratah.js:31` reads `WARATAH_SHEET_ID` OR `WARATAH_SHIFT_REPORT_CURRENT_ID` as the shift report current ID — note the alternate property `WARATAH_SHEET_ID` is NOT in the docs at all.
- **Recommended fix:** Document `WARATAH_SHEET_ID` as a recognized alias (it's referenced as a fallback in `IntegrationHubWaratah.js:31`). Confirm at deployment whether all three IDs (`WARATAH_SHIFT_REPORT_CURRENT_ID`, `WARATAH_WORKING_FILE_ID`, `WARATAH_SHEET_ID`) are kept in sync.

### Finding A1-10: TASK_MANAGEMENT_SPREADSHEET_ID and WARATAH_TASK_MANAGEMENT_ID described as aliases — partially correct
- **Severity:** MEDIUM
- **Doc location:** 01-configuration-reference.md:65-66
- **Claim (exact quote):** "`WARATAH_TASK_MANAGEMENT_ID` ... `TASK_MANAGEMENT_SPREADSHEET_ID` ... Alias for `WARATAH_TASK_MANAGEMENT_ID`"
- **Code reality:** Both are read independently. `IntegrationHubWaratah.js:32` reads `WARATAH_TASK_MANAGEMENT_ID`. `TaskIntegrationWaratah.js:14` and `EnhancedTaskManagementWaratah.gs` read `TASK_MANAGEMENT_SPREADSHEET_ID`. They are NOT auto-aliased in code — admin must keep them in sync.
- **Recommended fix:** Reword: "These are independent properties read by different files. Admins must set them to identical values."

### Finding A1-11: SHEET_PROTECTION_OWNER_EMAIL claim — file location correct
- **Severity:** LOW (correct)
- **Doc location:** 01-configuration-reference.md:90
- **Claim (exact quote):** "Used by `RunWaratah.js` setup of sheet protections."
- **Code reality:** Confirmed `RunWaratah.js:855`.

### Finding A1-12: Section 8 "Properties That Exist in Both Projects" — incorrect for ESCALATION_EMAIL/ESCALATION_SLACK_WEBHOOK/SLACK_MANAGERS_CHANNEL_WEBHOOK
- **Severity:** HIGH
- **Doc location:** 01-configuration-reference.md:229-244 (and the same enumeration in 02 line 280-285)
- **Claim (exact quote):** "Both projects post to this channel (rollover confirmations from SR, task escalations from TM)" (for SLACK_MANAGERS_CHANNEL_WEBHOOK); same dual-use claim for ESCALATION_* properties.
- **Code reality:** The SR project's setup writes these but no SR code reads them. The rollover confirmation message in `WeeklyRolloverInPlaceWaratah.js` uses `WARATAH_SLACK_WEBHOOK_LIVE` (or TEST) for its Slack post, not `SLACK_MANAGERS_CHANNEL_WEBHOOK`. Verified by `grep "SLACK_MANAGERS_CHANNEL_WEBHOOK" THE WARATAH/SHIFT REPORT SCRIPTS/*.js` returning only `_SETUP_ScriptProperties.js` lines.
- **Evidence:** SR project file search returns only setup-file matches for `SLACK_MANAGERS_CHANNEL_WEBHOOK`, `ESCALATION_EMAIL`, `ESCALATION_SLACK_WEBHOOK`.
- **Recommended fix:** In Section 8, mark these three properties as "stored in SR setup for symmetry; only the Task Management project reads them at runtime." This removes the misleading "rollover confirmations from SR" claim.

---

## Findings — for-admins/02-staff-and-access-management.md

### Finding A2-1: STAFF_LIST array contents match exactly
- **Severity:** LOW (correct)
- **Doc location:** 02-staff-and-access-management.md:44-61
- **Claim (exact quote):** Quotes the 14 entries.
- **Code reality:** Verified line-by-line against `EnhancedTaskManagementWaratah.gs:273-288`.
- **Recommended fix:** None.

### Finding A2-2: "Add to SLACK_DM_WEBHOOKS Script Property (both projects)" — incorrect for SR project
- **Severity:** HIGH
- **Doc location:** 02-staff-and-access-management.md:80-105 (Section 2, Step 4)
- **Claim (exact quote):** "Open the **Shift Report project** Script Properties ... Find `SLACK_DM_WEBHOOKS` ... Repeat exactly the same in the **Task Management project**"
- **Code reality:** The SR project does not read `SLACK_DM_WEBHOOKS` (see A1-1). Updating it there is purely housekeeping; the only project that uses it is Task Management. The doc presents the dual update as critical, which is misleading.
- **Evidence:** Same as A1-1.
- **Recommended fix:** Note that the SR project copy is for hygiene/future-proofing only. The only consequential update is in the Task Management project.

### Finding A2-3: Section 2 Step 6 verification claim "TEST Slack message includes a DM to the new person" — code does not send DMs from SR
- **Severity:** HIGH
- **Doc location:** 02-staff-and-access-management.md:126-131
- **Claim (exact quote):** "Confirm the TEST Slack message includes a DM to the new person (their Slack should show the test message)."
- **Code reality:** `exportAndEmailPDF_TestToSelf` in NightlyExportWaratah.js posts to `WARATAH_SLACK_WEBHOOK_TEST` only, and sends email to a single test recipient (line 189: `AI_INSIGHTS_EVAN_EMAIL` or active user). It does not iterate `SLACK_DM_WEBHOOKS` for nightly DMs. The dropdown test for adding staff to nightly DMs is not actually exercised by Send TEST.
- **Evidence:** `NightlyExportWaratah.js:189` and full-file grep returning no `SLACK_DM_WEBHOOKS` reference in the SR project.
- **Recommended fix:** Verification must be done by triggering a task assignment in the Task Management spreadsheet, not by sending a TEST shift report.

### Finding A2-4: "Reapply Dropdowns and Formatting" menu path — name slightly different
- **Severity:** LOW
- **Doc location:** 02-staff-and-access-management.md:67, 164, 296
- **Claim (exact quote):** "**Waratah Tools > Admin Tools > Reapply Dropdowns and Formatting**" (and identical references)
- **Code reality:** The menu is in the Task Management spreadsheet, not Waratah Tools. The actual path is `Task Management > 🔐 Admin Tools > Cleanup > 🔧 Reapply Dropdowns & Formatting`. Top-level menu is `Task Management` (Menu_Updated_Waratah.gs:169), parent menu is "🔐 Admin Tools", item is "🔧 Reapply Dropdowns & Formatting" (with ampersand, not "and").
- **Evidence:** `Menu_Updated_Waratah.gs:169, 172, 187`.
- **Recommended fix:** Replace path: `Task Management > 🔐 Admin Tools > Cleanup > 🔧 Reapply Dropdowns & Formatting`.

### Finding A2-5: "roughly 17 admin menu items in the shift report spreadsheet" — count overstated/imprecise
- **Severity:** LOW
- **Doc location:** 02-staff-and-access-management.md:217
- **Claim (exact quote):** "The `MENU_PASSWORD` property gates roughly 17 admin menu items in the shift report spreadsheet"
- **Code reality:** Counted password-gated wrappers in `MenuWaratah.js:38-89`: 24 `pw_*` wrappers, of which approximately 23 are surfaced in the menu (some are duplicates/legacy). Either "roughly 17" is conservative or this is stale.
- **Evidence:** `MenuWaratah.js:38-89`.
- **Recommended fix:** Update to "about 20+" or count exactly.

### Finding A2-6: Admin password-recovery claim — accurate
- **Severity:** LOW (correct)
- **Doc location:** 02-staff-and-access-management.md:236-239
- **Claim (exact quote):** "The password is stored only in Script Properties."
- **Code reality:** Confirmed `MenuWaratah.js:18-21`.

### Finding A2-7: SLACK_DM_WEBHOOKS example uses 6 recipients (Evan, Cynthia, Adam, Jaiden, Joffy, Nick) — matches `CLAUDE.md` deployment notes
- **Severity:** LOW (consistent with CLAUDE.md, not directly verifiable from code)
- **Doc location:** 02-staff-and-access-management.md (Section 4 in 01-configuration-reference)
- **Claim (exact quote):** "Howie has no DM webhook by choice; he is omitted."
- **Code reality:** Howie is in `STAFF_LIST` (EnhancedTaskManagementWaratah.gs:281). The actual production `SLACK_DM_WEBHOOKS` JSON is in Script Properties and is not in source. Doc claim is consistent with `CLAUDE.md` May 17 note: "6-person DM list (Evan, Cynthia, Adam, Jaiden, Joffy, Nick)".
- **Recommended fix:** None; verifiable only at runtime.

---

## Findings — for-admins/03-advanced-troubleshooting.md

### Finding A3-1: Function name `performWeeklyRollover` referenced as primary handler — outdated
- **Severity:** HIGH
- **Doc location:** 03-advanced-troubleshooting.md:107, 119
- **Claim (exact quote):** "Look for `performWeeklyRollover` (or `pw_performWeeklyRollover`)."
- **Code reality:** Current canonical trigger handler is `runWaratahWeeklyRollover` (`WeeklyRolloverInPlaceWaratah.js:83`); `performWeeklyRollover` is referenced only as a legacy name in `MenuWaratah.js:101-102, 221` and `setupAllTriggers_Waratah` deletes it. `pw_performWeeklyRollover` exists in MenuWaratah.js:48 as a legacy wrapper but it is NOT in the rendered menu.
- **Evidence:** `WeeklyRolloverInPlaceWaratah.js:83` defines `runWaratahWeeklyRollover`; `MenuWaratah.js:131` exposes `pw_runWaratahWeeklyRollover`.
- **Recommended fix:** Update to "Look for `runWaratahWeeklyRollover` (current) or `performWeeklyRollover` (legacy)".

### Finding A3-2: Menu path "Waratah Tools > Admin Tools > Run Weekly Rollover Now" — does not exist
- **Severity:** CRITICAL
- **Doc location:** 03-advanced-troubleshooting.md:110, 131
- **Claim (exact quote):** "**Waratah Tools > Admin Tools > Run Weekly Rollover Now** (password gated)"
- **Code reality:** Actual menu item is `Waratah Tools > [⚠] Admin Tools > Weekly Reports > Weekly Rollover (In-Place) > Run Rollover Now` (`MenuWaratah.js:130-131`).
- **Evidence:** `MenuWaratah.js:130-131`.
- **Recommended fix:** Replace with full path: `Waratah Tools > Admin Tools > Weekly Reports > Weekly Rollover (In-Place) > Run Rollover Now`.

### Finding A3-3: Menu path "Clear Manager Inputs (Day)" — does not exist
- **Severity:** CRITICAL
- **Doc location:** 03-advanced-troubleshooting.md:120
- **Claim (exact quote):** "From the menu, run **Waratah Tools > Admin Tools > Clear Manager Inputs (Day)** for each affected tab."
- **Code reality:** No `Clear Manager Inputs` menu item exists in `MenuWaratah.js`. Search returned no matches.
- **Evidence:** `grep "Clear Manager" THE WARATAH/SHIFT REPORT SCRIPTS/MenuWaratah.js` returns nothing.
- **Recommended fix:** Either add this menu item to the code, or replace the procedure with a real one (e.g., rerunning rollover idempotently).

### Finding A3-4: Section 6 expected-trigger counts and reinstall menu items — fabricated
- **Severity:** CRITICAL
- **Doc location:** 03-advanced-troubleshooting.md:150-161
- **Claim (exact quote):** "Shift Report project: 3 time-based triggers (rollover Mon 9pm, digest Mon 4pm, backfill Mon 2am). ... **Admin Tools > Reinstall Weekly Rollover Trigger** ... **Admin Tools > Reinstall Revenue Digest Trigger** ... **Admin Tools > Reinstall Weekly Backfill Trigger**"
- **Code reality:**
  - SR project: 3 triggers via `setupAllTriggers_Waratah()` — rollover **Mon 9pm** (correct), backfill **Mon 8am** (NOT 2am), digest **Wed 8am** (NOT Mon 4pm). Reference: `MenuWaratah.js:218-273`.
  - The actual standalone digest trigger (`setupWeeklyDigestTrigger_Waratah`) sets Mon 9am (`WeeklyDigestWaratah.js:178-182`) — so depending on which installer was last run, digest is Mon 9am or Wed 8am. Neither matches "Mon 4pm".
  - The named menu items do NOT exist. Actual installer menu items: `Setup All SR Triggers` (one item that installs all three), `Setup Weekly Backfill Trigger`, `Setup Monday Digest Trigger`, `Create Rollover Trigger (Mon 9pm)`. No "Reinstall ..." prefixed items.
- **Evidence:**
  - `MenuWaratah.js:162` "Setup All SR Triggers"; `:141, 156` standalone digest/backfill trigger items; `:134` rollover trigger.
  - `MenuWaratah.js:243-248` backfill at hour 8; `:251-256` digest Wednesday hour 8; `:235-240` rollover Monday hour 21.
  - `WeeklyDigestWaratah.js:178-182` digest standalone at Monday hour 9.
- **Recommended fix:** Rewrite Section 6 to list:
  - Rollover handler: `runWaratahWeeklyRollover`, Mon 9pm, menu: `Setup All SR Triggers` OR `Create Rollover Trigger (Mon 9pm)`.
  - Backfill handler: `runWeeklyBackfill_`, Mon 8am, menu: `Setup All SR Triggers` OR `Setup Weekly Backfill Trigger`.
  - Digest handler: `sendWeeklyRevenueDigest_Waratah`, Wed 8am (from setupAllTriggers_Waratah) or Mon 9am (from setupWeeklyDigestTrigger_Waratah) — clarify.

### Finding A3-5: Task Management project trigger inventory and menu items — fabricated
- **Severity:** CRITICAL
- **Doc location:** 03-advanced-troubleshooting.md:150-161
- **Claim (exact quote):** "Task Management project: 6 time-based triggers (bi-hourly cleanup, daily 6am workload, daily 7am maintenance, Mon 6am archive, Mon 10am summary, on-edit handler)."
- **Code reality:** TM project has these creator functions in `EnhancedTaskManagementWaratah.gs`:
  - `createDailyMaintenanceTrigger`: handler `runDailyTaskMaintenance`, daily at 6am (NOT 7am) — `:1864-1868`.
  - `createWeeklySummaryTrigger`: handler `sendWeeklyActiveTasksSummary`, Mon 10am — `:1893-1898`.
  - `createOnEditTrigger`: handler `onTaskSheetEditWithAutoSort` (NOT `onEdit`) — `:1923-1926`.
  - `createBiHourlyCleanupTrigger`: handler `cleanupAndSortMasterActionables`, every 2 hours (no "business hours" filter) — `:1971-1974`.
  - `createDailyStaffWorkloadTrigger`: handler `runScheduledStaffWorkload` (not `refreshStaffWorkload`), 6am daily — `:2102-2106`.
  - `createWeeklyArchiveTrigger`: handler `runScheduledArchive` (NOT `archiveCompletedTasks`), Mon 6am — `:2130-2134`.
  - `createWeeklyOverdueSummaryTrigger`: disabled no-op — `:2151-2153`.
  - Menu items at `Menu_Updated_Waratah.gs:189-196` show actual menu names (e.g., "Create Daily Staff Workload Trigger (6am)" not "Reinstall Daily Workload Trigger").
- **Evidence:** lines above.
- **Recommended fix:** Replace the TM project trigger list with the actual 6 trigger creators, correct handler names, and correct menu item names.

### Finding A3-6: Daily maintenance trigger time — "Daily 7am" claim
- **Severity:** HIGH
- **Doc location:** 03-advanced-troubleshooting.md:150, 222-223
- **Claim (exact quote):** "Daily 7am task maintenance" and "The escalation runs as part of the daily 7am task maintenance trigger."
- **Code reality:** `createDailyMaintenanceTrigger` (`EnhancedTaskManagementWaratah.gs:1864-1868`) sets `atHour(6)` and Logger says "6-7am daily". The slot is 6am (with GAS's hour-window meaning the trigger fires sometime in the 6:00–7:00 hour).
- **Recommended fix:** Change to "Daily 6am task maintenance (fires within the 6–7am window)".

### Finding A3-7: "Rebuild All Dashboards" Waratah menu item — does not exist
- **Severity:** CRITICAL
- **Doc location:** 03-advanced-troubleshooting.md:200
- **Claim (exact quote):** "**Waratah Tools > Admin Tools > Rebuild All Dashboards** (password gated)."
- **Code reality:** The Waratah menu has `Analytics > Build Financial Dashboard` and `Build Executive Dashboard` (two separate items, `MenuWaratah.js:147-148`). No "Rebuild All Dashboards" item. (Sakura has this; Waratah does not.)
- **Evidence:** `MenuWaratah.js:147-149` shows the three Analytics items; no "Rebuild All" item exists.
- **Recommended fix:** Replace with: `Waratah Tools > Admin Tools > Analytics > Build Financial Dashboard` and then `Build Executive Dashboard`. Or add a Waratah-side `rebuildAllDashboards()` wrapper to match Sakura.

### Finding A3-8: `pw_buildFinancialDashboard` and `pw_buildExecutiveDashboard` function names — correct
- **Severity:** LOW (correct)
- **Doc location:** 03-advanced-troubleshooting.md:204
- **Claim (exact quote):** "the function `pw_buildFinancialDashboard` or `pw_buildExecutiveDashboard`"
- **Code reality:** Verified `MenuWaratah.js:39-40`.

### Finding A3-9: "Re-sync Tasks" menu item — does not exist
- **Severity:** CRITICAL
- **Doc location:** 03-advanced-troubleshooting.md:214
- **Claim (exact quote):** "**Waratah Tools > Admin Tools > Re-sync Tasks** for that day's tab."
- **Code reality:** No matching menu item in `MenuWaratah.js`.
- **Evidence:** `grep "Re-sync\|Resync\|Re-Sync" THE WARATAH/SHIFT REPORT SCRIPTS/MenuWaratah.js` returns nothing.
- **Recommended fix:** Either add the menu item to code or describe the actual recovery path (likely re-running `exportAndEmailPDF` or a backfill).

### Finding A3-10: "Run Escalation Now" menu item — does not exist with that name
- **Severity:** HIGH
- **Doc location:** 03-advanced-troubleshooting.md:227
- **Claim (exact quote):** "**Waratah Tools > Admin Tools > Run Escalation Now**."
- **Code reality:** The Task Management spreadsheet has `Task Management > 🔐 Admin Tools > Manual Actions > Check Blocked Escalations Now` (`Menu_Updated_Waratah.gs:200`). Backed by `protected_escalateBlockedTasks` → `escalateBlockedTasks_()`. Wrong top-level menu name in doc (Waratah Tools vs Task Management) and wrong item name.
- **Recommended fix:** Replace with `Task Management > 🔐 Admin Tools > Manual Actions > Check Blocked Escalations Now`.

### Finding A3-11: "Run Revenue Digest Now" menu item name — close but inexact
- **Severity:** MEDIUM
- **Doc location:** 03-advanced-troubleshooting.md:173, 184
- **Claim (exact quote):** "run **Waratah Tools > Admin Tools > Run Revenue Digest Now** to manually post the digest."
- **Code reality:** Actual item is `Send Revenue Digest (LIVE)` under `Weekly Digest` submenu (`MenuWaratah.js:138`).
- **Recommended fix:** Update path: `Waratah Tools > Admin Tools > Weekly Digest > Send Revenue Digest (LIVE)`.

### Finding A3-12: Curl command and HTTP error codes — unverified
- **Severity:** UNVERIFIED
- **Doc location:** 03-advanced-troubleshooting.md:55-62
- **Claim (exact quote):** Specific HTTP codes mapped to Slack webhook error bodies.
- **Code reality:** Not verifiable from local code. The doc is providing generic Slack API guidance.
- **Recommended fix:** No change needed; informational only.

### Finding A3-13: `sendWeeklyDigest_Waratah` vs `sendWeeklyRevenueDigest_Waratah`
- **Severity:** MEDIUM
- **Doc location:** 03-advanced-troubleshooting.md:172
- **Claim (exact quote):** "did the digest function (`sendWeeklyDigest_Waratah` or similar) run"
- **Code reality:** The actual function name is `sendWeeklyRevenueDigest_Waratah` (`WeeklyDigestWaratah.js:18`). "sendWeeklyDigest_Waratah" does not exist.
- **Recommended fix:** Drop the inaccurate "or similar" parenthetical and use only `sendWeeklyRevenueDigest_Waratah`.

### Finding A3-14: `pushTasksToManagement_` example handler name — unverified
- **Severity:** UNVERIFIED
- **Doc location:** 03-advanced-troubleshooting.md:212
- **Claim (exact quote):** "Look for the task-sync step (usually `pushTasksToManagement_` or similar)"
- **Code reality:** I did not verify this function name. The hedged "or similar" makes it weaker but still mentionable.
- **Recommended fix:** Search `TaskIntegrationWaratah.js` to confirm the actual function name and update.

---

## Findings — for-admins/04-deployment-and-clasp.md

### Finding A4-1: Pre-deploy step "change `WARATAH_SHIFT_REPORT_CURRENT_ID` Script Property in a separate Apps Script project" — but property is dynamically resolved
- **Severity:** MEDIUM
- **Doc location:** 04-deployment-and-clasp.md:35
- **Claim (exact quote):** "change `WARATAH_SHIFT_REPORT_CURRENT_ID` Script Property in a separate Apps Script project to point at the copy"
- **Code reality:** `WARATAH_SHIFT_REPORT_CURRENT_ID` is read in `IntegrationHubWaratah.js:31` as a fallback for `WARATAH_SHEET_ID`. Also note `WARATAH_WORKING_FILE_ID` is the property the rollover uses as a safety guard (`WeeklyRolloverInPlaceWaratah.js:246`). Setting only one of these on the copy may leave another pointing at production.
- **Recommended fix:** Add a note: "On the test copy, set both `WARATAH_SHIFT_REPORT_CURRENT_ID` and `WARATAH_WORKING_FILE_ID` to the copy's ID. Also set `WARATAH_SHEET_ID` if it exists."

### Finding A4-2: Section 5 Step 2 "Reinstall triggers (Shift Report project)" table — wrong handler/schedule/menu
- **Severity:** CRITICAL
- **Doc location:** 04-deployment-and-clasp.md:90-100
- **Claim (exact quote):**
  - Weekly Rollover | Mon 9pm | `performWeeklyRollover` | Admin Tools > Reinstall Weekly Rollover Trigger
  - Revenue Digest | Mon 4pm | `sendWeeklyDigest_Waratah` | Admin Tools > Reinstall Revenue Digest Trigger
  - Weekly Backfill | Mon 2am | `backfillEntireWeekToWarehouse` | Admin Tools > Reinstall Weekly Backfill Trigger
- **Code reality:** All three handler names are wrong; all three menu items don't exist; backfill time is wrong; digest time is wrong/ambiguous. The actual triggers and menu paths are:
  - Rollover: handler `runWaratahWeeklyRollover`, Mon 9:00pm (atHour(21)). Menu: `Setup All SR Triggers` (installs all three) or `Create Rollover Trigger (Mon 9pm)`. Code: `WeeklyRolloverInPlaceWaratah.js:819-824` and `MenuWaratah.js:134, 162, 235`.
  - Digest: handler `sendWeeklyRevenueDigest_Waratah`. From `setupAllTriggers_Waratah`: Wed 8:00am. From `setupWeeklyDigestTrigger_Waratah`: Mon 9:00am. Menu: `Setup Monday Digest Trigger` or `Setup All SR Triggers`.
  - Backfill: handler `runWeeklyBackfill_`, Mon 8:00am. Menu: `Setup Weekly Backfill Trigger` or `Setup All SR Triggers`. Code: `IntegrationHubWaratah.js:1196-1216` and `MenuWaratah.js:156, 162`.
- **Recommended fix:** Replace the entire table with the corrected handler/schedule/menu mapping. Remove "Reinstall" prefix; use actual menu strings.

### Finding A4-3: Section 5 Step 3 "Reinstall triggers (Task Management project)" table — wrong handlers/menu
- **Severity:** CRITICAL
- **Doc location:** 04-deployment-and-clasp.md:103-113
- **Claim (exact quote):**
  - Bi-hourly cleanup ... `runStatusCleanup` | Admin Tools > Reinstall Bi-Hourly Cleanup Trigger
  - Daily 6am ... `refreshStaffWorkload` | Admin Tools > Reinstall Daily Workload Trigger
  - Daily 7am ... `runDailyTaskMaintenance` | Admin Tools > Reinstall Daily Task Trigger
  - Mon 6am archive | `archiveCompletedTasks` | Admin Tools > Reinstall Weekly Archive Trigger
  - Mon 10am summary | `sendWeeklyActiveTaskSummary` | Admin Tools > Reinstall Weekly Summary Trigger
  - On-edit handler | `onEdit` | Installed automatically
- **Code reality:**
  - Bi-hourly cleanup handler is `cleanupAndSortMasterActionables` (NOT `runStatusCleanup`). Menu: `Create Bi-Hourly Cleanup Trigger (Every 2hrs)` (`Menu_Updated_Waratah.gs:192`).
  - Daily 6am staff workload handler is `runScheduledStaffWorkload` (NOT `refreshStaffWorkload`). Menu: `Create Daily Staff Workload Trigger (6am)` (`Menu_Updated_Waratah.gs:193`).
  - Daily task maintenance is at 6am NOT 7am (see A3-6). Handler `runDailyTaskMaintenance`. There is no menu item named "Reinstall Daily Task Trigger" — and there is no menu item to create it at all in the current TM menu (Menu_Updated_Waratah.gs lines 189-196). The creator function `createDailyMaintenanceTrigger()` exists but is not surfaced in the menu.
  - Weekly archive handler is `runScheduledArchive` (NOT `archiveCompletedTasks`). Menu: `Create Weekly Archive Trigger (Mon 6am)` (`Menu_Updated_Waratah.gs:194`).
  - Weekly summary handler is `sendWeeklyActiveTasksSummary` (PLURAL "Tasks", not "Task"). Menu: `Create Weekly Summary Trigger (Mon 10am)` (`Menu_Updated_Waratah.gs:191`).
  - On-edit handler is `onTaskSheetEditWithAutoSort` (NOT `onEdit`). It is installed via menu, NOT automatically; menu item: `Create Edit Trigger (Auto-sort)` (`Menu_Updated_Waratah.gs:190`). It is an installable on-edit trigger (`createOnEditTrigger()` in EnhancedTaskManagementWaratah.gs:1915), not a simple trigger.
- **Evidence:** All citations above.
- **Recommended fix:** Replace the entire TM trigger table with the six accurate entries.

### Finding A4-4: Section 6 "Quick rollback: `clasp pull` an older commit's code from local git history, then `clasp push`" — incorrect command flow
- **Severity:** MEDIUM
- **Doc location:** 04-deployment-and-clasp.md:158
- **Claim (exact quote):** "`clasp pull` an older commit's code from local git history, then `clasp push`."
- **Code reality:** `clasp pull` does NOT pull from local git; it pulls FROM Google's servers TO local. For a rollback the actual flow is: `git checkout <prev-commit> -- <path>` (or `git reset/revert`) to set local to a prior version, then `clasp push` to deploy. `clasp pull` is unrelated.
- **Recommended fix:** Replace with: "Check out the previous commit from local git (`git checkout <previous-commit-sha>` or `git revert HEAD`), then `clasp push` to deploy the older code."

### Finding A4-5: Section 8 Quick-Reference says "5 triggers" for TM — but Section 5 listed 6
- **Severity:** MEDIUM
- **Doc location:** 04-deployment-and-clasp.md:206
- **Claim (exact quote):** "Reinstall TM triggers | 5 triggers via menu"
- **Code reality:** TM has 6 creator functions (daily maintenance, weekly summary, on-edit, bi-hourly cleanup, daily staff workload, weekly archive), of which 5 are exposed in the menu (createDailyMaintenanceTrigger is NOT in the menu — see A4-3). Internal inconsistency with Section 5 which lists 6.
- **Recommended fix:** Reconcile counts. Actual menu-exposed trigger creators: 5 (edit, weekly summary, bi-hourly cleanup, daily staff workload, weekly archive). Total triggers if all installed: 6.

### Finding A4-6: `_SETUP_ScriptProperties.js` file extension distinction
- **Severity:** LOW (correct)
- **Doc location:** 04-deployment-and-clasp.md:36
- **Claim (exact quote):** Mentions `_SETUP_ScriptProperties.js` for SR project
- **Code reality:** Confirmed: SR file is `.js`, TM file is `.gs`. Doc correctly uses `.js` in this section.

### Finding A4-7: "clasp open" claim — unverified but conventionally true
- **Severity:** UNVERIFIED
- **Doc location:** 04-deployment-and-clasp.md:17
- **Claim (exact quote):** "`clasp open` | Opens the Apps Script editor in your browser for the configured project."
- **Code reality:** This is a clasp behavior, not Waratah-specific. Accurate as a generality.

### Finding A4-8: scriptId not surfaced — opportunity, not error
- **Severity:** LOW
- **Doc location:** Throughout 04
- **Claim (exact quote):** (None — doc never lists the scriptIds)
- **Code reality:** TM scriptId `1uCT7Be2OU6eCL1BhbOC3MFN0rpMH8W1oJH-ROi_yf7AFN5BGlhWJAqQG` from `.clasp.json`. SR scriptId not present locally (gitignored).
- **Recommended fix:** Optionally document scriptIds (or just file paths to `.clasp.json`) so an admin can verify which project they're pushing.

---

## Unverified Claims

### Finding UA-1: Drive archive folder naming pattern `YYYY-Www`
- **Doc:** 01:145
- **Reason unverified:** Did not read the archive folder creation block in WeeklyRolloverInPlaceWaratah.js.

### Finding UA-2: `pushTasksToManagement_` example handler name
- **Doc:** 03:212
- **Reason unverified:** Did not search for this exact function name across `TaskIntegrationWaratah.js`.

### Finding UA-3: Specific Slack HTTP error code mapping
- **Doc:** 03:60-62
- **Reason unverified:** Generic guidance, not Waratah-specific code.

### Finding UA-4: "Google Apps Script may destroy all installed time-based triggers" claim
- **Doc:** 04:46-52
- **Reason unverified:** This is a documented GAS behavior. Cannot be verified from code; conventionally accurate.

### Finding UA-5: SR project clasp.json scriptId / current target
- **Doc:** Throughout
- **Reason unverified:** `THE WARATAH/SHIFT REPORT SCRIPTS/.clasp.json` not present locally (gitignored per CLAUDE.md). The OLD vs NEW project ID story mentioned in the audit prompt ("`.remember/remember.md`") could not be verified — that file is empty (0 bytes).

---

## Cross-cutting Observations (not formal findings)

1. **The dual-project property model is overstated.** SR project setup writes 6 cross-shared properties but only reads 2 of them (`MENU_PASSWORD`, `TASK_MANAGEMENT_SPREADSHEET_ID`). Dual-update is good hygiene but is not "critical" for `SLACK_DM_WEBHOOKS`, `SLACK_MANAGERS_CHANNEL_WEBHOOK`, `ESCALATION_EMAIL`, `ESCALATION_SLACK_WEBHOOK` — those four are functional only in the TM project.

2. **Many "Reinstall …" menu items are entirely fabricated.** The real menu uses "Setup …" or "Create …" prefixes. An admin following 03/04 verbatim will not find any menu item beginning with "Reinstall …".

3. **Several function-name pairs are wrong.** Doc → Reality:
   - `performWeeklyRollover` → `runWaratahWeeklyRollover` (legacy name kept for cleanup only)
   - `sendWeeklyDigest_Waratah` → `sendWeeklyRevenueDigest_Waratah`
   - `backfillEntireWeekToWarehouse` → `runWeeklyBackfill_`
   - `runStatusCleanup` → `cleanupAndSortMasterActionables`
   - `refreshStaffWorkload` (as trigger handler) → `runScheduledStaffWorkload`
   - `archiveCompletedTasks` → `runScheduledArchive`
   - `sendWeeklyActiveTaskSummary` → `sendWeeklyActiveTasksSummary` (plural)
   - `onEdit` → `onTaskSheetEditWithAutoSort`

4. **Schedule mismatches.** Doc → Reality:
   - SR digest "Mon 4pm" → Wed 8am (`setupAllTriggers_Waratah`) or Mon 9am (`setupWeeklyDigestTrigger_Waratah`)
   - SR backfill "Mon 2am" → Mon 8am
   - TM daily task maintenance "7am" → 6am (fires within 6–7am window)

5. **The `_SETUP_ScriptProperties.js` setup writes a property count log of `20` while the doc claims "21 standard + 1 optional".** Reconcile.

6. **The empty `.remember/remember.md`.** The audit prompt references "Phase 1 cutover state (NEW project ID `1YATi...`, OLD project deprecated, triggers DELETED, 25-col schema, .clasp.json backed up to .clasp.json.bak-old-project)". None of this is present in `.remember/remember.md` (0 bytes), and no `.clasp.json.bak-old-project` file is present in the SR directory. The Phase 1 cutover state is unverifiable from local artifacts.
