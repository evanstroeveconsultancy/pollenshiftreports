# Phase C — Developer Tier 4a Edit Log

## Summary
- Findings actioned: 42 (out of 52)
- Findings skipped (verified-correct, no-change-needed, or UNVERIFIED): 10
- Files modified: 4 (README.md, 01-architecture-and-data-flow.md, 02-cell-reference-and-field-config.md, 03-integration-pipeline.md)
- Sections deleted/replaced wholesale: doc 03 §5 (Cash Reconciliation Sync); doc 02 §9 (BATCH_RANGES_BY_SHEET); doc 03 §3 sample body; doc 03 §6 fabricated Block Kit JSON sample; doc 03 §7 fabricated 4-destination table + sample; doc 03 §8 fabricated `generatePdfAndEmail_` sample; doc 03 §9 fabricated `pushTodosToMaster_` sample
- Code excerpts replaced or removed: ~10 (`runIntegrations`, `extractShiftData_`, `extractTodos_`, `syncToCashReconciliation_`, `buildSlackBlockKit_`, `sendSlackMessages_` + `postToSlack_`, `generatePdfAndEmail_`, `pushTodosToMaster_`, FIELD_CONFIG sample, BATCH_RANGES_BY_SHEET sample)
- Fabricated function/constant names removed: 12 (`syncToCashReconciliation_`, `buildSlackBlockKit_`, `postToSlackChannels_`, `postToSlackDMs_`, `sendSlackMessages_`, `postToSlack_`, `generatePdfAndEmail_`, `composeShiftReportEmail_`, `pushTodosToMaster_`, `extractTodos_`, `isDuplicateTask_`, `setFieldValue` and `BATCH_RANGES_BY_SHEET` constant)
- Edit method used per file: Edit for all 4 (large targeted blocks via `old_string`/`new_string`)

## Edits applied per finding, grouped by file

### docs/waratah/for-developers/README.md
- **D0-1:** "36 fields, 197 named ranges" → "39 fields, 197 named ranges" in row table (line 16).
- **D0-2:** Verified; no change required (README already says 9-status).
- **D0-3 / D0-4:** No README change needed per audit recommendation.
- Phase A consequence: `performWeeklyRollover` → `runWaratahWeeklyRollover` in trigger-context example.

### docs/waratah/for-developers/01-architecture-and-data-flow.md
- **D1-1:** "36 fields" → "39 fields" (intro and RunWaratah.js section).
- **D1-2:** "fallbackCell columns" → "fallback attribute"; explained that day-sheet helpers throw, non-day sheets use the A1 fallback.
- **D1-3:** Rewrote VenueConfig.js row entry: removed "Legacy not used at runtime", described it as live runtime config consulted by Slack/AI/email pipelines.
- **D1-4:** Trigger count statement reworded to "3 SR + 5 TM time-based + 1 on-edit + 1 deprecated installer".
- **D1-5:** `runDailyTaskMaintenance` "Daily 07:00" → "Daily 06:00 (Apps Script 6-7am window)".
- **D1-8 / D1-9 / D1-10 / D1-11 / D1-12 / D1-13 / D1-14 / D1-15 / D1-16 / D1-18:** Whole §6 (Nightly Export step-by-step) rewritten with the real 8-step `continueExport` pipeline. Removed `syncToCashReconciliation_`, `buildSlackBlockKitMessage`, `composeShiftReportEmail_`, the "DMs to 6 staff" claim, the "Acquire script lock" step at pipeline entry, the date+venue duplicate-key claim. Replaced with real step list referencing `runIntegrations`, AI Insights helpers, `buildTodoAggregationSheet_`, `postToSlackFromSheet`, `pushTodosToMasterActionables`, `generatePdfForSheet_NoUI_`, inline `GmailApp.sendEmail`, and `_notifyExportWarnings_`. Updated NIGHTLY_FINANCIAL duplicate key to date+MOD.
- **D1-19:** Verified; no change.
- **D1-20:** AIInsightsWaratah.js entry expanded to mention M1/M2/M3/M5 insights pipeline.
- **D1-21:** "17 .js files" → "18 .js files"; total updated from 23 GAS files to 24.
- **D1-22 / D1-23 / D1-24 / D1-25:** Verified; no change.
- Rule 2 / Rule 8 / module-responsibilities: `performWeeklyRollover` → `runWaratahWeeklyRollover` everywhere (Phase A consequence).
- Rule 3 reworded to reflect non-day-sheet A1 fallback semantics.
- Helper signature: `(fieldKey, sheetName)` → `(sheet, fieldKey)` in RunWaratah.js section.
- §1 Cutover Context: cash recon columns "W/X/Y" → "V/W/X" with LoggedAt moved to Y; "Phase 1.3" phrase removed.
- §11 Error Handling: blocking-error list updated to reflect real semantics (no pipeline-level lock; PDF blocking; pre-export validation blocking).

### docs/waratah/for-developers/02-cell-reference-and-field-config.md
- **D2-1:** "36 fields" → "39 fields".
- **D2-2:** Rebuilt range math: `1×7 + 38×5 = 197`; removed "+17 multi-row" fabrication.
- **D2-3:** "symmetry with Sakura" → "visual consistency in the spreadsheet UI; only date named range on Mon/Tue".
- **D2-4:** Replaced inaccurate row-group ranges with real cell ranges per FIELD_CONFIG (B3, B4, B6, B7, C10:C17, etc.).
- **D2-5:** Verified; no change.
- **D2-6:** `PublicTillCounts` → `PublicTillCount`; `TodoDescriptions` → `TodoTasks`; expanded multi-row list to include `PublicTillRefloat`, `TerraceTillCount`, `TerraceTillRefloat`.
- **D2-7:** Helper signatures reversed to `(sheet, fieldKey)`; removed non-existent `setFieldValue`; added explicit "no setFieldValue" note.
- **D2-8:** Return shape: `{OK, MISSING, WRONG}` → `{ ok, missing, wrong, unexpected }`.
- **D2-9:** Menu paths corrected to `Admin Tools > Setup & Utilities > Named Ranges > Diagnose Active Sheet` / `Create on Active Sheet`.
- **D2-10:** FIELD_CONFIG sample rewritten using real keys (`suffix`, `fallback`) and real suffix values (`SR_Date`, `SR_NetRevenue`).
- **D2-11:** isFormula list rewritten with the 12 real field keys (`cashTake` not `cashTakings`, `totalCashRecorded` not `cashRecorded`, `discountsExcCashDiscount`, `grossSalesLessDiscounts`).
- **D2-12:** Field-categories table rebuilt with correct categories and counts summing to 39.
- **D2-13:** Verified; no change.
- **D2-14:** Clarified that the narrative named ranges bind to column A only (visual merge is sheet formatting).
- **D2-15:** §8 Sheet Protection Model rewritten: whole-sheet protection + 27 carve-outs; restricted-editing (not warning) mode.
- **D2-16:** Menu path corrected to `Remove Protection (All Sheets)` then `Apply Protection (All Sheets)`.
- **D2-17:** §9 Integration Hub Batch Read Pattern: BATCH_RANGES_BY_SHEET fabricated constant removed; replaced with real `sheet.getRange("B3:F54")` etc. batch list and the `fin`/`finNum`/`finC`/`finC_Num`/`narr` accessor names.
- **D2-18:** §10 Quick Lookup Table fully rebuilt from FIELD_CONFIG with correct field keys (`mod`, `fohStaff`, `bohStaff`, `cashTake`, `totalCashRecorded`, `productionAmount`, `deposit`, `guestsOfNote`, `theGood`, `theBad`, `wastageComps`, `maintenanceIssues`, `todoTasks`, `todoAssignees`), correct suffixes (with `SR_` prefix), real A1 cells, and correct warehouse column letters (V/W/X for cash recon, O for discountsExcCashDiscount, P for grossSalesLessDiscounts, etc.).
- **D2-19:** UNVERIFIED — Sakura-side comparison columns left in place with explicit "unverified" caveat in the comparison table; Waratah-side numbers corrected (39 fields, V/W/X recon cols).
- §1 "Phase 1.3" phrase removed; title changed to "Cutover Status (May 17, 2026)".

### docs/waratah/for-developers/03-integration-pipeline.md
- **D3-1:** `sendShiftReport()` → `continueExport(sheetName, isTest)` (called by `exportAndEmailPDF()` after the pre-export checklist).
- **D3-2:** §1 pipeline overview rewritten: removed the 5 fabricated function names; replaced with the real 8-step `continueExport` sequence.
- **D3-3:** §2 `runIntegrations` sample replaced with the real warehouse-only shape returning `{ success, errors, warnings, integrations }`. Slack/email/AI/tasks orchestration moved to `continueExport` callout.
- **D3-4 / D3-5:** §3 extractShiftData_ section rewritten: removed `getFieldValue` per-field sample and `extractTodos_` (does not exist); described real batch-read pattern with `fin`/`finNum`/`finC`/`finC_Num`/`narr` accessors; documented real returned shape including `fohStaff`/`bohStaff`/`surchargeTips`/`totalAdjustmentsDiscounts`/`grossSalesLessDiscounts`; inlined TO-DO extraction description at `A69:D84`.
- **D3-6:** §4 validation table reduced to the 3 real rules (date Error, MOD Error, netRevenue ≤ 0 Warning) and noted the 2026-02-15 disabled cash-discrepancy rule.
- **D3-7:** §5 Cash Reconciliation Sync **DELETED ENTIRELY** and replaced with "Cash Reconciliation Storage" pointing to NIGHTLY_FINANCIAL columns V/W/X; explicit note that `WARATAH_CASH_RECON_FOLDER_ID` is not referenced.
- **D3-8:** §6 Slack Block Kit construction rewritten: no `buildSlackBlockKit_` function; describes inline construction in `postToSlackFromSheet` using `bk_*` helpers; removed cherry-blossom emoji; removed 2900-char guard claim.
- **D3-9:** §7 Slack Delivery rewritten: single webhook (`SLACK_WEBHOOK_URL_LIVE` for LIVE, `SLACK_WEBHOOK_URL_TEST` for TEST), no per-staff DMs from nightly export; only DM is to Evan via `_notifyExportWarnings_`.
- **D3-10:** §7 sample replaced with real `bk_post` body from `SlackBlockKitWaratahSR.js`.
- **D3-11:** §8 Email Distribution rewritten: no `generatePdfAndEmail_` function; PDF via `generatePdfForSheet_NoUI_` using `UrlFetchApp` against the spreadsheet export URL (not `getAs(MimeType.PDF)`); HTML body composed inline; `GmailApp.sendEmail` called inline.
- **D3-12:** `composeShiftReportEmail_` reference removed; explicit "there is no" statement added.
- **D3-13:** §9 Task Management Push rewritten: real function `pushTodosToMasterActionables(sheet, sheetName, preloadedConfig)`; duplicate detection via `openDescriptions` Set (excludes DONE/CANCELLED); fallback `pushTodosDirectToMasterActionables_` uses `setValues` batch (not `appendRow`); defaults corrected (Area = "General", Date Created = today via `new Date()`, Updated By = active user email).
- **D3-14:** "Waratah Tools > Send TEST Report" → "Shift Report > Export & Email (TEST to me)" → `exportAndEmailPDF_TestToSelf`.
- **D3-15:** §10 Error Handling philosophy rewritten: two blocking points (pre-export validation, PDF generation); warnings DM'd via `_notifyExportWarnings_` rather than per-step alert email.
- **D3-16:** UNVERIFIED — no change.
- §11 Testing: `buildSlackBlockKit_` reference removed.

## Phase A+B consequences applied
- Basic Report references deleted from: none found (these docs didn't carry the Basic Report claim)
- "36 fields" → "39 fields" in: README.md:16, 01-architecture-and-data-flow.md (intro and module-responsibilities), 02-cell-reference-and-field-config.md (multiple)
- "8-status" → not present in dev docs (Phase A reconciled README already used 9-status)
- "22-col" → not present in dev docs
- "Phase 1.3" purged from: 01-architecture-and-data-flow.md:9 area, 02-cell-reference-and-field-config.md (intro)
- "performWeeklyRollover" → "runWaratahWeeklyRollover" in 01-architecture-and-data-flow.md (3 occurrences: module list, Rule 2 trigger-context, Rule 8 password-gating example)
- Imaginary feature paragraphs deleted: cash-recon-Drive workbook section, BATCH_RANGES_BY_SHEET constant, fabricated step-list functions (`syncToCashReconciliation_`, `buildSlackBlockKit_`, `postToSlackChannels_`, `postToSlackDMs_`, `generatePdfAndEmail_`, `composeShiftReportEmail_`, `pushTodosToMaster_`, `sendSlackMessages_`, `postToSlack_`, `extractTodos_`, `isDuplicateTask_`, `setFieldValue`)
- "Waratah Tools > Send TEST Report" → real menu path "Shift Report > Export & Email (TEST to me)"

## Style verification (greps run after final pass)
- Em-dash count across all 4 modified docs: **0**
- "The Waratah Tools" occurrences: **0**
- "Send Shift Report" / "Send TEST Report" occurrences: **0**
- "Basic Report" occurrences: **0**
- "8-status" occurrences: **0**
- "36 fields" occurrences: **0**
- "22-col" occurrences: **0**
- "Phase 1.3" occurrences: **0**
- Fabricated function names from forbidden list: **0** active references. Two remaining mentions in 03-integration-pipeline.md are explicit negation statements ("There is no standalone `buildSlackBlockKit_` function", "There is no `composeShiftReportEmail_` function") per audit instructions to make the absence explicit.
- `namedRangeSuffix` / `fallbackCell` / `BATCH_RANGES_BY_SHEET` / `setFieldValue(` / `performWeeklyRollover`: **0**

## Anything that did not fix cleanly
- **D2-19 (Sakura comparison row):** Sakura code is out of audit scope, so the comparison row keeps a written "unverified" caveat on the Sakura column rather than asserting specific Sakura numbers.
- **D3-16 (`SLACK_MANAGERS_CHANNEL_WEBHOOK` shared with TM):** UNVERIFIED in the audit; left untouched.
- **UD-1 through UD-6:** all UNVERIFIED findings skipped per task brief.
- **D1-6 / D1-7 / D1-19 / D1-22 / D1-23 / D1-25 / D2-5 / D2-13 / D2-14 (partial):** audit recommended "no change" — no edit applied.
- A handful of em-dashes I introduced during paraphrasing were scrubbed in a post-pass (replaced with periods / colons / parentheses); verified final em-dash count = 0 across all 4 modified docs.
