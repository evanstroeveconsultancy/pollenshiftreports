# Tier 1: README + Daily Users — Documentation Accuracy Audit

## Files Reviewed
- docs/waratah/README.md (84 lines)
- docs/waratah/for-daily-users/shift-report-walkthrough.md (384 lines)

## Code Sources Consulted
- THE WARATAH/SHIFT REPORT SCRIPTS/MenuWaratah.js:1-282 (full)
- THE WARATAH/SHIFT REPORT SCRIPTS/NightlyExportWaratah.js:1-1176 (full)
- THE WARATAH/SHIFT REPORT SCRIPTS/RunWaratah.js:1-1135 (full)
- THE WARATAH/SHIFT REPORT SCRIPTS/VenueConfig.js:1-251 (full)
- THE WARATAH/SHIFT REPORT SCRIPTS/UIServerWaratah.js:300-355 (validateShiftBeforeExport_)
- THE WARATAH/SHIFT REPORT SCRIPTS/checklist-dialog.html:1-160 (full)
- THE WARATAH/SHIFT REPORT SCRIPTS/_SETUP_ScriptProperties.js:1-90
- THE WARATAH/SHIFT REPORT SCRIPTS/WeeklyRolloverInPlaceWaratah.js:50-825 (selected)
- THE WARATAH/TASK MANAGEMENT SCRIPTS/EnhancedTaskManagementWaratah.gs:260-289 (STAFF_LIST)
- THE WARATAH/SHIFT REPORT SCRIPTS/IntegrationHubWaratah.js (grep only — variance threshold check)

## Findings Summary
- Critical: 5
- High: 6
- Medium: 5
- Low: 4
- Unverified: 3

## Findings — docs/waratah/README.md

No findings — all claims verified against code.

(README.md is a routing/index document; it makes no claims about menu items, cell references, function names, or schemas. Style standards and phase status are project-internal and not code-verifiable.)

## Findings — docs/waratah/for-daily-users/shift-report-walkthrough.md

### Finding D-1: Menu name wrong — "The Waratah Tools" does not exist
- **Severity:** CRITICAL
- **Doc location:** shift-report-walkthrough.md:149, 165 (heading), 182, 194, 287, 288, 352
- **Claim (exact quote):** "Go to the menu bar at the top of the spreadsheet and click **The Waratah Tools**, then **Send Shift Report**."
- **Code reality:** The menu is named `Waratah Tools` (no leading "The"). The menu has a `Daily Reports` submenu — daily items live there, not at top level.
- **Evidence:** MenuWaratah.js:112 — `ui.createMenu('Waratah Tools')`
- **Recommended fix:** Replace every occurrence of `The Waratah Tools` with `Waratah Tools`, and add the `Daily Reports` submenu hop. Example: "click **Waratah Tools** → **Daily Reports** → **Export & Email PDF (LIVE)**".

### Finding D-2: Menu item name wrong — "Send Shift Report" does not exist
- **Severity:** CRITICAL
- **Doc location:** shift-report-walkthrough.md:149, 190, 287, 288, 352
- **Claim (exact quote):** "click **The Waratah Tools**, then **Send Shift Report**" / "the main Send Shift Report function" / "Click **Send Shift Report** (not TEST) and retry" / "The Waratah Tools menu, then Send Shift Report"
- **Code reality:** The actual menu item is `Export & Email PDF (LIVE)` — wired to function `exportAndEmailPDF`.
- **Evidence:** MenuWaratah.js:115 — `.addItem('Export & Email PDF (LIVE)', 'exportAndEmailPDF')`
- **Recommended fix:** Replace all references to "Send Shift Report" with `Export & Email PDF (LIVE)`.

### Finding D-3: Menu item name wrong — "Send TEST Report" does not exist
- **Severity:** CRITICAL
- **Doc location:** shift-report-walkthrough.md:182, 288
- **Claim (exact quote):** "go to **The Waratah Tools** then **Send TEST Report**" / "Sent TEST when you meant LIVE"
- **Code reality:** The actual menu item is `Export & Email (TEST to me)` — wired to function `exportAndEmailPDF_TestToSelf`.
- **Evidence:** MenuWaratah.js:116 — `.addItem('Export & Email (TEST to me)', 'exportAndEmailPDF_TestToSelf')`
- **Recommended fix:** Replace "Send TEST Report" with `Export & Email (TEST to me)`. Clarify in Section 3 that TEST mode emails the test recipient (set via `AI_INSIGHTS_EVAN_EMAIL` script property), not literally nobody.

### Finding D-4: Menu item name wrong — "Send Basic Report" path described inaccurately
- **Severity:** HIGH
- **Doc location:** shift-report-walkthrough.md:194, 360
- **Claim (exact quote):** "Go to **The Waratah Tools** then **Send Basic Report**." / "use Send Basic Report"
- **Code reality:** The menu item is named `Send Basic Report` (correct), but it lives at `Waratah Tools → Daily Reports → Send Basic Report`, not top level. Also note the wired function is `sendShiftReportBasic`.
- **Evidence:** MenuWaratah.js:117 — `.addItem('Send Basic Report', 'sendShiftReportBasic')`
- **Recommended fix:** Change path to "Waratah Tools → Daily Reports → Send Basic Report".

### Finding D-5: Checklist count wrong — two boxes, not four
- **Severity:** CRITICAL
- **Doc location:** shift-report-walkthrough.md:354
- **Claim (exact quote):** "Tick all four checklist boxes"
- **Code reality:** The checklist dialog presents exactly TWO items: `Deputy Timesheets Approved` and `Fruit Order Done`. Both must be checked to enable the Confirm & Send button.
- **Evidence:** checklist-dialog.html:91-100 — `<ul class="checklist"><li … >Deputy Timesheets Approved</li><li … >Fruit Order Done</li></ul>`; line 119-121 confirms button only enables when both are checked.
- **Recommended fix:** Change "Tick all four checklist boxes" to "Tick both checklist boxes". (Section 2.7 already correctly says two — only Section 10 is wrong.)

### Finding D-6: Confirm button label wrong
- **Severity:** MEDIUM
- **Doc location:** shift-report-walkthrough.md:157
- **Claim (exact quote):** "Tick the boxes and click **Send**."
- **Code reality:** The button label is `Confirm & Send`, not `Send`.
- **Evidence:** checklist-dialog.html:104 — `<button id="confirmBtn" onclick="onConfirm()" disabled>Confirm &amp; Send</button>`
- **Recommended fix:** Change "click **Send**" to "click **Confirm & Send**".

### Finding D-7: TEST-mode email claim wrong — one test email IS sent
- **Severity:** HIGH
- **Doc location:** shift-report-walkthrough.md:178
- **Claim (exact quote):** "**No email** is sent to the management team" (under TEST mode bullets, framed alongside "No data is written to the warehouse", "No tasks are pushed")
- **Code reality:** In TEST mode the code DOES send one PDF email — to the `AI_INSIGHTS_EVAN_EMAIL` script property (or the active user's email as fallback). The team distro is not used, but it is wrong to imply nothing is emailed.
- **Evidence:** NightlyExportWaratah.js:189, 204 — `const testRecipient = PropertiesService.getScriptProperties().getProperty('AI_INSIGHTS_EVAN_EMAIL') || Session.getActiveUser().getEmail();` ... `GmailApp.sendEmail(testRecipient, subject, "", { htmlBody: htmlBody, attachments: [pdfBlob] });`
- **Recommended fix:** Change to: "**No email goes to the management team.** A single PDF email is sent only to the test recipient (Evan, by default)."

### Finding D-8: Five narrative fields claimed as "merged A:F" — wrong column span
- **Severity:** HIGH
- **Doc location:** shift-report-walkthrough.md:23 ("Five large merged cells lower down on the sheet"), 102-110 (table), and the implicit "merged A:F" pattern carried over from older docs/MEMORY.md
- **Claim (exact quote):** "Below the financial section are five large narrative fields. Each is one paragraph in length, with the field name on its own row above."
- **Code reality:** The five narrative fields are stored at A59 (Shift Report / generalShiftComments), A61 (VIPs / guestsOfNote), A63 (Good), A65 (Bad), A67 (Kitchen). The doc doesn't actually quote merge ranges here so the description is roughly accurate (five fields, paragraph each) — but downstream context implied "Five large merged cells lower down on the sheet" without specifying. Note: project MEMORY.md still describes the OLD layout (A43/A45/A47/A49/A51 merged A:F); current code uses A59-A67.
- **Evidence:** RunWaratah.js:231-260 — `generalShiftComments: { fallback: "A59" }, guestsOfNote: { fallback: "A61" }, theGood: { fallback: "A63" }, theBad: { fallback: "A65" }, kitchenNotes: { fallback: "A67" }`. VenueConfig.js:74-78 confirms.
- **Recommended fix:** No correction needed in the daily-user doc body for end users — but if precise rows are listed elsewhere they must be A59/A61/A63/A65/A67 (new sheet, May 2026), not A43/A45/A47/A49/A51.

### Finding D-9: Task section row count wrong — sixteen rows, not "sixteen rows" range
- **Severity:** LOW
- **Doc location:** shift-report-walkthrough.md:118
- **Claim (exact quote):** "There is a tasks section with sixteen rows."
- **Code reality:** Correct — task range is A69:A84, assignees D69:D84, exactly 16 rows.
- **Evidence:** RunWaratah.js:265,271 — `fallback: "A69:A84"` (16 rows); `fallback: "D69:D84"`. VenueConfig.js:84-85 confirms.
- **Recommended fix:** None — already correct. (Listed here only because the count is verified against code.)

### Finding D-10: Assignee column described ambiguously
- **Severity:** LOW
- **Doc location:** shift-report-walkthrough.md:118-119
- **Claim (exact quote):** "Each row has a task description column and an assignee column."
- **Code reality:** Correct in concept. For developer reference: tasks live in col A (merged A:C); assignees in col D. Earlier sheet layout had assignees in col F.
- **Evidence:** NightlyExportWaratah.js:451-452 — `// 16 x 1 (A69:A84) ... 16 x 1 (D69:D84)`; comment line 829 — `// col D (index 3) — was col F (index 5)`.
- **Recommended fix:** None for end-user doc; flagged for cross-reference accuracy.

### Finding D-11: Wastage/Maintenance/RSA — three fields described, code has them at A86/A88/A90
- **Severity:** LOW
- **Doc location:** shift-report-walkthrough.md:135-141 (table of three fields)
- **Claim (exact quote):** "Below the tasks section are three narrative fields for incidents..."
- **Code reality:** Correct — wastageComps at A86, maintenanceIssues at A88, rsaIncidents at A90.
- **Evidence:** RunWaratah.js:279, 285, 291; VenueConfig.js:79-81.
- **Recommended fix:** None — claim is accurate (3 fields). Flagged for completeness.

### Finding D-12: "$50 variance triggers a system warning" — no such warning exists
- **Severity:** HIGH
- **Doc location:** shift-report-walkthrough.md:44, 74-77
- **Claim (exact quote):** "If the cash variance shown by the sheet is more than fifty dollars in either direction, **stop and recount before sending**. A variance of plus or minus fifty triggers a system warning..."
- **Code reality:** `validateShiftBeforeExport_()` only checks: MOD field empty (error), netRevenue ≤ 0 (error), shiftSummary empty (warning), theGood empty (warning), unassigned TODOs (warning). It does NOT validate cash variance at all. The Slack message displays the variance with "(over)" or "(under)" but does not flag $50 as a threshold. The only $50 constant in the export pipeline is `criticalDiscrepancy: 50.00` in IntegrationHubWaratah.js:49, which governs warehouse reconciliation, not user-facing send-time warnings.
- **Evidence:** UIServerWaratah.js:307-354 (full `validateShiftBeforeExport_` body); NightlyExportWaratah.js:899-924 (Slack variance display has no threshold logic); IntegrationHubWaratah.js:49 (`criticalDiscrepancy: 50.00`, in a config block about warehouse, not the send dialog).
- **Recommended fix:** Either (a) remove the "$50 triggers a system warning" claim, leaving just the operational guidance to recount; or (b) describe the threshold accurately: it is an operational rule the doc imposes, not a code-enforced warning. Same applies to Section 8 row "Cash Variance over $50 not investigated → Slack message flags the variance" — the Slack message displays variance but does NOT flag $50 specifically.

### Finding D-13: Trigger time wrong — "around 9pm" matches, but described as if rollover runs on Monday from MON tab perspective
- **Severity:** MEDIUM
- **Doc location:** shift-report-walkthrough.md:302
- **Claim (exact quote):** "Every Monday at around 9pm, the system runs the **weekly rollover**."
- **Code reality:** Correct — `setupAllTriggers_Waratah` and `createRolloverTrigger_Waratah` install the rollover at Monday `.atHour(21)`. Confirmed.
- **Evidence:** MenuWaratah.js:234-240 — `.onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(21).nearMinute(0)`; WeeklyRolloverInPlaceWaratah.js:819-823 same.
- **Recommended fix:** None — claim is accurate. (Confirmed for completeness.)

### Finding D-14: Recipient list claims six people but lists five
- **Severity:** CRITICAL
- **Doc location:** shift-report-walkthrough.md:265-274
- **Claim (exact quote):** "As of May 2026, that is six people:" followed by a five-row table (Evan, Cynthia, Nick, Ian, Adam).
- **Code reality:** Email recipients are stored in `WARATAH_EMAIL_RECIPIENTS` Script Property as a JSON map (not in source). The source code does not enumerate recipients. CLAUDE.md line referencing "6 managers (Evan, Cynthia, Nick, Chef, Howie, Adam)" in the May 4 entry implies a different 6-person list. The doc-internal arithmetic mismatch (says six, shows five, includes "Ian" not present in CLAUDE.md, omits Cynthia's actual role wording, omits Chef/Howie) is a documentation-only claim — cannot be confirmed from code.
- **Evidence:** _SETUP_ScriptProperties.js:39-43 (the recipients are placeholder values, populated at deploy time); NightlyExportWaratah.js:58-66 (`getEmailRecipients_` reads from Script Property); CLAUDE.md May 4 entry — "email recipient list updated to 6 managers (Evan, Cynthia, Nick, Chef, Howie, Adam)".
- **Recommended fix:** Either (a) align the table to the CLAUDE.md-stated 6 managers and reconcile with whatever the live `WARATAH_EMAIL_RECIPIENTS` actually contains, or (b) replace the table with a pointer to the admin-config doc and avoid hardcoding a list in user-facing docs. Note: this is the same hallucination class flagged in `.remember/remember.md` — recipient counts must be sourced from the live Script Property at audit time, not invented.

### Finding D-15: "Refloat: Always $350" — refloat value not codified
- **Severity:** MEDIUM
- **Doc location:** shift-report-walkthrough.md:65
- **Claim (exact quote):** "Refloat: the cash you left in the till to start tomorrow's service. Always $350."
- **Code reality:** The refloat is a manager-entered cell (D10:D17 for Public, F10:F17 for Terrace). No code enforces, defaults, or validates a $350 value. This is operational policy, not system behaviour.
- **Evidence:** RunWaratah.js:77-94 — refloat ranges are `isFormula: false` (manager input); no validation of refloat values.
- **Recommended fix:** Flag as operational rule (e.g. "Always $350 per house policy") so future readers don't assume the system enforces it.

### Finding D-16: Tab name claim — "If today is Wednesday, the active tab should say 'Wednesday'"
- **Severity:** MEDIUM
- **Doc location:** shift-report-walkthrough.md:52
- **Claim (exact quote):** "the active tab should say 'Wednesday' and the date in the top-left should be today's date"
- **Code reality:** Sheets are named with a day-prefix AND a date suffix, e.g. `WEDNESDAY 19/03/2026`. The code's `extractDayPrefix()` checks `sheetName.startsWith(day)` and `VALID_DAY_PREFIXES` is `["WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]` (all uppercase). The tab will not just say "Wednesday".
- **Evidence:** RunWaratah.js:27 — `const VALID_DAY_PREFIXES = ["WEDNESDAY", ...]`; comment at line 307 — `"WEDNESDAY 19/03/2026" -> "WEDNESDAY"`. Also NightlyExportWaratah.js comment 442 — `"WEDNESDAY 29/01/2025"`.
- **Recommended fix:** Update the example to: "the active tab should say something like `WEDNESDAY 19/03/2026` (in all caps with the date appended), and the date in B3:F3 should match today's date".

### Finding D-17: "Tabs cycle automatically each Monday evening" claim — Mon/Tue tabs exist but aren't day sheets
- **Severity:** LOW
- **Doc location:** shift-report-walkthrough.md:52
- **Claim (exact quote):** "The tabs cycle automatically each Monday evening, so if today is Wednesday..."
- **Code reality:** Roughly correct — the rollover runs Monday 9pm, which renames day tabs to next week's dates. Note that the spreadsheet also has Monday and Tuesday tabs "for visual consistency only" — exporting from them is blocked.
- **Evidence:** NightlyExportWaratah.js:213-220 — `if (_sheetDayUpper.startsWith('MONDAY') || _sheetDayUpper.startsWith('TUESDAY')) { return { success: false, message: 'Monday and Tuesday are not active Waratah shift days.' } }`; WeeklyRolloverInPlaceWaratah.js:50 — `WAR_ROLLOVER_ALL_DAYS` includes Mon/Tue.
- **Recommended fix:** Consider adding a one-line note that Monday/Tuesday tabs exist but cannot be exported (the system blocks them) — useful context for new users.

### Finding D-18: Section 4 — Basic Report "does not run the pre-send checklist dialog"
- **Severity:** UNVERIFIED → see Claim U-2 below
- **Doc location:** shift-report-walkthrough.md:201-205
- **Claim (exact quote):** "What the Basic Report does: ... Does **not** run the pre-send checklist dialog ... Does **not** sync tasks to the Task Management spreadsheet ... Does **not** write to the data warehouse"
- **Code reality:** `sendShiftReportBasic` was not read in this audit pass (function exists per MenuWaratah.js:117 but its body was not loaded — see Unverified U-2). The claim plausibility is high but UNVERIFIED.
- **Evidence:** N/A — function body not read.
- **Recommended fix:** See U-2.

### Finding D-19: "Action buttons: link to view PDF, link to email team"
- **Severity:** MEDIUM
- **Doc location:** shift-report-walkthrough.md:256-257
- **Claim (exact quote):** "A link to view the full PDF report" / "A link to email the team"
- **Code reality:** The Slack message has TWO action buttons: `View PDF` (links to a PDF export URL) and `Open Shift Report` (links to the live spreadsheet). There is no "email the team" button.
- **Evidence:** NightlyExportWaratah.js:976-979 — `blocks.push(bk_buttons([ { text: "View PDF", url: exportUrl, style: "primary" }, { text: "Open Shift Report", url: sheetUrl } ]));`
- **Recommended fix:** Change to: "A `View PDF` button (links to the PDF export) and an `Open Shift Report` button (links to the live spreadsheet)."

### Finding D-20: "Multiple manager channels for redundancy" claim
- **Severity:** MEDIUM
- **Doc location:** shift-report-walkthrough.md:275
- **Claim (exact quote):** "The Slack message goes to the venue's manager channels (multiple channels for redundancy) and also as direct messages to a subset of the team who have opted in."
- **Code reality:** The nightly export posts ONCE to a SINGLE webhook (`WARATAH_SLACK_WEBHOOK_LIVE`). It does not post to "multiple channels for redundancy". DMs and personal channels are handled separately via `SLACK_DM_WEBHOOKS` in the task-management context, not the nightly export. The "multiple channels for redundancy" framing is misleading.
- **Evidence:** NightlyExportWaratah.js:294 — `postToSlackFromSheet(spreadsheet, sheet, sheetName, SLACK_WEBHOOK_URL_LIVE);` (single call, single webhook). Only one call site, no fan-out.
- **Recommended fix:** Change to: "The Slack message goes to the venue's manager channel via a single webhook. Personal DMs to staff who have opted in are sent separately via the Task Management system."

## Unverified Claims

### Claim U-1: "Slack outage, popup blocker, or expired webhook" detection
- **Doc location:** shift-report-walkthrough.md:292
- **Claim:** "Slack message did not appear → Slack outage, popup blocker, or expired webhook"
- **Why unverifiable:** Operational troubleshooting advice — not a code-verifiable claim. Plausibly correct.
- **What would resolve it:** N/A — guidance, not a fact.

### Claim U-2: Basic Report behaviour ("does not run checklist, does not sync tasks, does not write to warehouse")
- **Doc location:** shift-report-walkthrough.md:201-205
- **Claim:** Basic Report skips checklist, task push, and warehouse write.
- **Why unverifiable:** `sendShiftReportBasic` function body was not read during this audit (the menu wires it but the implementation lives in a file not loaded — likely in NightlyExportWaratah.js or a sibling file). Cannot confirm what it skips.
- **What would resolve it:** Read the full `sendShiftReportBasic` function body and confirm it bypasses `showPreExportChecklist_()`, `pushTodosToMasterActionables()`, and `runIntegrations()`.

### Claim U-3: AI Insights fallback claim — "If the AI service is unavailable, a simpler version is generated from the raw numbers"
- **Doc location:** shift-report-walkthrough.md:252
- **Claim:** AI summary has a non-AI fallback path
- **Why unverifiable:** AIInsightsWaratah.js was not read in full. The code at NightlyExportWaratah.js:274-279 calls `generateShiftInsight_Waratah()` and `deliverAIInsights_Waratah()`; the fallback behaviour when Claude API fails is not confirmed here. The wrapping try/catch will silently drop AI output, but whether "a simpler version is generated from the raw numbers" is true or whether the AI block is simply omitted is unverified.
- **What would resolve it:** Read `generateShiftInsight_Waratah()` and `deliverAIInsights_Waratah()` bodies in AIInsightsWaratah.js to confirm fallback behaviour.
