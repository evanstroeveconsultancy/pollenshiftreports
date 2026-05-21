# Tier 4b: Developers Part 2 — Documentation Accuracy Audit

## Files Reviewed
- `docs/waratah/for-developers/04-warehouse-schemas.md` — 408 lines
- `docs/waratah/for-developers/05-rollover-and-triggers.md` — 369 lines
- `docs/waratah/for-developers/06-task-management-internals.md` — 598 lines

## Code Sources Consulted (with line ranges)
- `THE WARATAH/SHIFT REPORT SCRIPTS/IntegrationHubWaratah.js:1-1217` (full file; key: schema assertion 484-498, appendRow 500-526, runValidationReport 950-1025, runWeeklyBackfill_ 1111-1189, setupWeeklyBackfillTrigger 1196-1216)
- `THE WARATAH/SHIFT REPORT SCRIPTS/WeeklyRolloverInPlaceWaratah.js:1-880` (full file; runWaratahWeeklyRollover 83-221, _warClearAllSheetData_ 571-598, _warUpdateAllTabDates_ 628-664, _warDryRun_ 675-722, createRolloverTrigger_Waratah 810-836)
- `THE WARATAH/SHIFT REPORT SCRIPTS/MenuWaratah.js:200-281` (setupAllTriggers_Waratah 218-273)
- `THE WARATAH/SHIFT REPORT SCRIPTS/WeeklyDigestWaratah.js:1-192` (sendWeeklyRevenueDigest_Waratah 18-39, setupWeeklyDigestTrigger_Waratah 173-191)
- `THE WARATAH/TASK MANAGEMENT SCRIPTS/EnhancedTaskManagementWaratah.gs:1-2384` (full file, read in chunks: 1-400, 400-800, 800-1300, 1300-1800, 1800-2050, 2050-2385; constants 84-289, STATUSES 155-221, STAFF_LIST 273-288, escalateBlockedTasks_ 1074-1162, processRecurringTasks_ 1207-1312, sendOverdueTasksSummary_ 1347-1424 (live code), runDailyTaskMaintenance 1579-1630, sendWeeklyActiveTasksSummary 1642-1786, createDailyMaintenanceTrigger 1856-1878, createWeeklySummaryTrigger 1885-1908, createOnEditTrigger 1915-1929, createBiHourlyCleanupTrigger 1963-1984, runScheduledOverdueSummary 2056-2058 (gutted to no-op), runScheduledStaffWorkload 2065-2088, createDailyStaffWorkloadTrigger 2095-2116, createWeeklyArchiveTrigger 2123-2144, createWeeklyOverdueSummaryTrigger 2151-2153 (gutted))
- `THE WARATAH/TASK MANAGEMENT SCRIPTS/Menu_Updated_Waratah.gs:60-194` (menu wiring of installers)

## Findings Summary
- Critical: 17 | High: 9 | Medium: 6 | Low: 4 | Unverified: 4

---

## Key Verifications (ground truth)

### Warehouse NIGHTLY_FINANCIAL column count per code assertion
- **25** — `IntegrationHubWaratah.js:492` (`if (actualCols > 0 && actualCols !== 25)`)
- Confirmed elsewhere: `IntegrationHubWaratah.js:484` comment ("enforce 25-column schema"), `:527` log ("25 cols"), `:979` runValidationReport expects 25.
- **Note:** WeeklyDigestWaratah.js comments at lines 96, 98 still call it "new 22-col schema" — code comment is stale (the actual data extraction uses col indexes 5 and 20 which match cols F and U of the live 25-col schema, so behaviour is fine; just the comment is wrong).

### Warehouse columns A–Y header mapping (from code `appendRow` at IntegrationHubWaratah.js:500-526)

| Col | Header (per code comment) | Source field | Value written |
|---|---|---|---|
| A | Date | `shiftData.date` | `toDateOnly_(shiftData.date)` |
| B | Day | `shiftData.dayOfWeek` | `shiftData.dayOfWeek` |
| C | Week Ending | computed weekEnding | `toDateOnly_(shiftData.weekEnding)` |
| D | MOD | `shiftData.mod` | `shiftData.mod` |
| E | Staff | concat "FOH: … \| BOH: …" | `shiftData.staff` |
| F | Net Revenue | B54 formula | `shiftData.netRevenue` |
| G | Production Amount | B37 | `shiftData.productionAmount` |
| H | CashTakings (header kept) — sources C19 | `shiftData.cashTake` | (C19 formula on new sheet) |
| I | GrossSalesIncCash (header kept) — sources B48 | `shiftData.grossSales` | (B48 formula) |
| J | Cash Returns | C22 | `shiftData.cashReturns` |
| K | CD Discount | C23 | `shiftData.cdDiscount` |
| L | Refunds | (field removed from sheet) | `null` |
| M | CDRedeem | (field removed from sheet) | `null` |
| N | TotalDiscount (header kept) — sources B50 | `shiftData.totalAdjustmentsDiscounts` | (B50) |
| O | DiscountsCompsExcCD (header kept) — sources B51 | `shiftData.discountsExcCashDiscount` | (B51) |
| P | GrossTaxableSales (header kept) — sources B52 | `shiftData.grossSalesLessDiscounts` | (B52) |
| Q | Taxes | B53 formula | `shiftData.taxes` |
| R | NetSalesWTips | (no equivalent on new sheet) | `null` |
| S | Card Tips | C30 | `shiftData.cardTips` |
| T | Cash Tips | C29 | `shiftData.cashTips` |
| U | Total Tips | C32 formula | `shiftData.totalTips` |
| V | **CashCounted** (C18 formula) | `shiftData.cashCounted \|\| null` | (formerly LoggedAt; renamed at cutover) |
| W | **ExpectedCash** (header kept) — sources C24 | `shiftData.totalCashRecorded \|\| null` |
| X | **CashVariance** (C26 formula) | `shiftData.cashVariance \|\| null` |
| Y | **LoggedAt** | `new Date()` | (moved from V to Y at cutover) |

Cols L, M, R = `null` (null literal, NOT empty string).
Cols V, W, X = `... || null` (fall back to null if 0/false).

### 8-status workflow actual status names (EnhancedTaskManagementWaratah.gs:155-189)
There are **9 statuses, not 8**. Exact strings (single quotes preserve case):

1. `"NEW"`
2. `"TO DO"` (space, not "TODO")
3. `"IN PROGRESS"` (space, not "IN_PROGRESS")
4. `"TO DISCUSS"`
5. `"BLOCKED"`
6. `"DEFERRED"`
7. `"DONE"`
8. `"CANCELLED"` (UK spelling, double L)
9. `"RECURRING"`

JSDoc header at line 5 says "8-status workflow" — wrong, code has 9. (See `STATUS_LIST`, lines 167-177, listing 9 items.)

`ACTIVE_STATUSES` (line 204-212) = 7 items: NEW, TO DO, IN PROGRESS, TO DISCUSS, BLOCKED, DEFERRED, RECURRING.

### Trigger schedules per code

**Shift Report project (`SHIFT REPORT SCRIPTS/`):**
- `runWaratahWeeklyRollover`: Monday, hour 21 (9:00pm), nearMinute 0 — `WeeklyRolloverInPlaceWaratah.js:819-824` AND `MenuWaratah.js:235-240`. JSDoc at `MenuWaratah.js:214` says "performWeeklyRollover: Monday 10:00am" but actual code installs `runWaratahWeeklyRollover` at Monday 9pm. **JSDoc is stale.**
- `runWeeklyBackfill_`: Monday, hour 8 (8:00am), nearMinute 0 — `MenuWaratah.js:243-248` AND `IntegrationHubWaratah.js:1201-1205`. (Not 2am as doc 05 claims.)
- `sendWeeklyRevenueDigest_Waratah`: Wednesday, hour 8 (8:00am), nearMinute 0 — `MenuWaratah.js:251-256`. CONFLICT: separate single-trigger installer `setupWeeklyDigestTrigger_Waratah` in `WeeklyDigestWaratah.js:178-182` installs Monday 9am instead. (Doc-relevant: the canonical `setupAllTriggers_Waratah` installs Wed 8am.)

**Task Management project (`TASK MANAGEMENT SCRIPTS/EnhancedTaskManagementWaratah.gs`):**
- `runDailyTaskMaintenance`: daily, hour 6 (6:00am, runs between 6-7am window) — lines 1864-1868. Doc 05 §3 / doc 06 §9 say "Daily 07:00" — **WRONG**.
- `sendWeeklyActiveTasksSummary`: Monday hour 10 (10:00am) — lines 1893-1898. (Doc correct.)
- `cleanupAndSortMasterActionables`: every 2 hours — lines 1971-1974. (Doc correct.)
- `runScheduledStaffWorkload`: daily, hour 6 (6:00am) — lines 2102-2106. (Doc correct.)
- `runScheduledArchive`: Monday hour 6 (6:00am) — lines 2130-2134. (Doc correct.)
- `onTaskSheetEditWithAutoSort`: installable onEdit trigger (not "simple" trigger) — `createOnEditTrigger()` at lines 1923-1926 uses `ScriptApp.newTrigger(...).forSpreadsheet(...).onEdit().create()`. Doc 06 §8 says "simple `onEdit` trigger" — **WRONG**. Doc explicitly notes installable in JSDoc at line 1467.
- `createWeeklyOverdueSummaryTrigger`: function exists at line 2151 but is gutted (logs and returns). No trigger gets created. (Doc 05 §3 partly correct re: deprecation, but inaccurate about trigger slot consumption.)

### Current STAFF_LIST contents (EnhancedTaskManagementWaratah.gs:273-288)
Exact array, 14 entries, in order:
```
"Evan", "Cynthia", "Adam", "Jaiden", "Joffy",
"Bar Team", "Nick", "Howie",
"Kitchen Team", "All", "Contractor",
"FOH Team", "General Management", "Marketing Explicit"
```
Named individuals: Evan, Cynthia, Adam, Jaiden, Joffy, Nick, Howie — **7**.
Team/group entries: Bar Team, Kitchen Team, FOH Team, General Management, Marketing Explicit, Contractor, All — **7**.

### Current SLACK_DM_WEBHOOKS key usage
Code does not hard-code keys; it reads JSON map from Script Property `SLACK_DM_WEBHOOKS` and looks up by assignee name. Per CLAUDE.md and project memory (May 17, 2026), the 6 active DM webhook keys are: Evan, Cynthia, Adam, Jaiden, Joffy, Nick. (No webhook for Howie or for team groups.) Code itself only references key `"Evan"` directly (line 1671 for the test sender).

---

## Findings — for-developers/04-warehouse-schemas.md

### Finding W-1: Column J/H labels mis-mapped in schema table
- **Severity:** CRITICAL
- **Doc location:** 04-warehouse-schemas.md:37
- **Claim (exact quote):** "| H | Cash Counted | `shiftData.cashCounted` | Number |"
- **Code reality:** Col H header is "CashTakings" (kept for schema compat); the value written is `shiftData.cashTake` (C19, the cash-take formula = counted minus refloats), not `shiftData.cashCounted`. CashCounted is written to col V, not col H.
- **Evidence:** `IntegrationHubWaratah.js:508` — `shiftData.cashTake, // H: CashTakings — schema header kept; sources C19`. Plus the dedicated CashCounted column at `:522` — `shiftData.cashCounted || null, // V: CashCounted (C18, formula)`.
- **Recommended fix:** Change row H to "CashTakings (cash take from C19 formula) — `shiftData.cashTake`". Move "Cash Counted" entry to col V.

### Finding W-2: Cols W/X/Y header names wrong (cash recon)
- **Severity:** CRITICAL
- **Doc location:** 04-warehouse-schemas.md:52-54
- **Claim (exact quote):** "| W | Cash Take (POS expected) | `shiftData.cashRecorded` | Number |\n| X | Cash Take (counted) | `shiftData.cashTakings` | Number |\n| Y | Cash Variance | `shiftData.cashVariance` | Number |"
- **Code reality:** The actual write per code comments:
  - Col V = **CashCounted** (`shiftData.cashCounted`, C18 formula)
  - Col W = **ExpectedCash** (`shiftData.totalCashRecorded`, C24 formula)
  - Col X = **CashVariance** (`shiftData.cashVariance`, C26 formula)
  - Col Y = **LoggedAt** (`new Date()`)
- **Evidence:** `IntegrationHubWaratah.js:522-525` — block:
  ```
  shiftData.cashCounted  || null,             // V: CashCounted (C18, formula)
  shiftData.totalCashRecorded || null,        // W: ExpectedCash — schema header kept; sources C24
  shiftData.cashVariance || null,             // X: CashVariance (C26, formula)
  new Date()                                  // Y: LoggedAt (moved from V to Y)
  ```
  Plus header comment `:486` — "V=CashCounted, W=ExpectedCash, X=CashVariance, Y=LoggedAt".
- **Recommended fix:** Rewrite rows V–Y. Doc has Logged At at V and shifts cash recon to W/X/Y; real code puts cash recon at V/W/X and Logged At at Y.

### Finding W-3: Col V wrong (Logged At vs CashCounted)
- **Severity:** CRITICAL
- **Doc location:** 04-warehouse-schemas.md:51
- **Claim:** "| V | Logged At | `new Date()` server timestamp | Datetime |"
- **Code reality:** Col V = CashCounted (C18 formula). Logged At was moved from V to Y at the May 17 cutover.
- **Evidence:** `IntegrationHubWaratah.js:486` ("LoggedAt moved from V to Y vs the old-sheet schema"); `:522`; `:525`.
- **Recommended fix:** Replace doc col V with CashCounted; place LoggedAt at col Y. See W-2.

### Finding W-4: Source field names invented (`shiftData.MOD`, `shiftData.production`, `shiftData.totalDiscount`, `shiftData.discountsExcCD`, `shiftData.grossSalesLessDisc`, `shiftData.cashRecorded`, `shiftData.cashTakings`)
- **Severity:** CRITICAL
- **Doc location:** 04-warehouse-schemas.md:33, 36, 43-45, 52-53
- **Claim:** Various `shiftData.MOD`, `shiftData.production`, etc.
- **Code reality:** Real field names in the `extractShiftData_` return (`IntegrationHubWaratah.js:326-388`):
  - `mod` (lowercase, not `MOD`)
  - `productionAmount` (not `production`)
  - `totalAdjustmentsDiscounts` (not `totalDiscount`)
  - `discountsExcCashDiscount` (not `discountsExcCD`)
  - `grossSalesLessDiscounts` (not `grossSalesLessDisc`)
  - `totalCashRecorded` (not `cashRecorded`)
  - `cashTake` (not `cashTakings`)
- **Evidence:** `IntegrationHubWaratah.js:326-388` whole return object.
- **Recommended fix:** Replace fabricated names with the real field names listed above.

### Finding W-5: Code excerpt block in §3 is fabricated
- **Severity:** CRITICAL
- **Doc location:** 04-warehouse-schemas.md:66-116 (the entire JavaScript code block)
- **Claim (exact quote):** "function logToNightlyFinancial_(shiftData) { ... }" plus a function body that uses `getProp_`, `isDuplicateInSheet_`, `computeWeekEnding_`, and writes `''` (empty string) for deprecated cols.
- **Code reality:**
  - Real function is `logToDataWarehouse_(shiftData, config, skipLock)` (IntegrationHubWaratah.js:425) — not `logToNightlyFinancial_`.
  - Deprecated cols L, M, R are written as `null` literals, not `''` empty strings.
  - Helpers `getProp_`, `isDuplicateInSheet_`, `computeWeekEnding_` don't exist (confirmed by grep across all files). Real code reads Script Properties inline, performs duplicate detection inline via `normaliseDateKey_`, and computes weekEnding inside `extractShiftData_` (lines 322-324).
  - Header-count assertion is at `:492`, threshold form is `if (actualCols > 0 && actualCols !== 25) { throw ... }`, not the simpler `if (headerCount !== 25)` shown.
- **Evidence:** `IntegrationHubWaratah.js:425, 469-498, 500-526`.
- **Recommended fix:** Replace the code excerpt with an excerpt from the real `logToDataWarehouse_` function, or mark the doc excerpt as "illustrative pseudo-code".

### Finding W-6: §1 "Tabs" table — `QUALITATIVE_LOG` sheet name vs `QUALITATIVE_NOTES`
- **Severity:** MEDIUM
- **Doc location:** 04-warehouse-schemas.md:5, 16, 244
- **Claim:** "QUALITATIVE_LOG"
- **Code reality:** Sheet name is `QUALITATIVE_LOG` per `IntegrationHubWaratah.js:42` config. Doc's alias note at line 244 is correct ("canonical name in current code is QUALITATIVE_LOG"). However the file header at line 4 also says four tabs include `QUALITATIVE_NOTES`. (Section 2 says `QUALITATIVE_LOG` — minor self-inconsistency.) Phase 1 reference (CLAUDE_WARATAH.md) calls it `QUALITATIVE_NOTES` historically.
- **Evidence:** `IntegrationHubWaratah.js:42` — `qualitativeLog: "QUALITATIVE_LOG"`.
- **Recommended fix:** Doc is essentially right; just align the §1 table reference too.

### Finding W-7: OPERATIONAL_EVENTS schema wrong (8 cols, but content/order)
- **Severity:** CRITICAL
- **Doc location:** 04-warehouse-schemas.md:126-135
- **Claim:** Cols are A=Date, B=Day, C=Week Ending, D=MOD, E=Event Type, F=Description, G=Estimated Cost, H=Logged At; events derive from `shiftData.maintenance` and `shiftData.rsaIncidents`.
- **Code reality:** Cols are A=Date, B=Day, **C=MOD** (no Week Ending column), D=Description, E=Assignee, F=Priority ("MEDIUM" literal), G=Source ("Shift Report" literal), H=Logged At. Rows come from `shiftData.todos` (the TO-DOs list), not from maintenance/RSA narrative.
- **Evidence:** `IntegrationHubWaratah.js:551-560`:
  ```
  newEventRows.push([
    toDateOnly_(shiftData.date),       // A: Date
    shiftData.dayOfWeek,  // B: Day
    shiftData.mod,        // C: MOD
    todo.description,     // D: Description
    todo.assignee,        // E: Assignee
    "MEDIUM",             // F: Priority
    "Shift Report",       // G: Source
    new Date()            // H: Logged At
  ]);
  ```
- **Recommended fix:** Rewrite the entire §4 schema table to match the TO-DO log shape. Drop the "Event Type" and "Week Ending" cols; add Assignee, Priority, Source. Also rewrite §4 narrative ("maintenance and RSA incidents") — OPERATIONAL_EVENTS holds TO-DOs, not maintenance/RSA events.

### Finding W-8: OPERATIONAL_EVENTS write-code excerpt fabricated
- **Severity:** CRITICAL
- **Doc location:** 04-warehouse-schemas.md:139-171
- **Claim:** A `logToOperationalEvents_(shiftData)` function that iterates maintenance/RSA events with regex cost extraction via `extractCost_`.
- **Code reality:** No standalone `logToOperationalEvents_` function exists; the write is inline inside `logToDataWarehouse_` (lines 531-567). `extractCost_` does not exist in any file (grep confirmed).
- **Evidence:** `IntegrationHubWaratah.js:531-567`.
- **Recommended fix:** Replace excerpt with the real inline block from `logToDataWarehouse_`. Remove all `extractCost_` references.

### Finding W-9: WASTAGE_COMPS schema wrong (cols + sources)
- **Severity:** CRITICAL
- **Doc location:** 04-warehouse-schemas.md:183-190
- **Claim:** 6 cols A=Date, B=Day, C=Week Ending, D=MOD, E=Description, F=Estimated Cost.
- **Code reality:** 6 cols A=Date, B=Day, **C=Week Ending**, D=MOD, E=**Notes**, F=**Logged At**. Sources from `shiftData.wastageComps` (A86 narrative), single-row append per shift; no per-item splitting, no cost regex.
- **Evidence:** `IntegrationHubWaratah.js:583-590`:
  ```
  wastageSheet.appendRow([
    toDateOnly_(shiftData.date),           // A: Date
    shiftData.dayOfWeek,                   // B: Day
    toDateOnly_(shiftData.weekEnding),     // C: Week Ending
    shiftData.mod,            // D: MOD
    shiftData.wastageComps,   // E: Notes
    new Date()                // F: Logged At
  ]);
  ```
- **Recommended fix:** Replace F="Estimated Cost" with F="Logged At"; relabel E as "Notes" (not "Description"); doc col C is correct.

### Finding W-10: WASTAGE_COMPS write excerpt fabricated (splitting and cost extraction)
- **Severity:** CRITICAL
- **Doc location:** 04-warehouse-schemas.md:196-222
- **Claim:** Splits wastage narrative on `[\n,]`, maps to per-item rows with `extractCost_(item)`.
- **Code reality:** Single appendRow with the entire wastage narrative as one string in col E. No splitting; no regex.
- **Evidence:** `IntegrationHubWaratah.js:570-595`.
- **Recommended fix:** Replace excerpt with the real single-append block.

### Finding W-11: QUALITATIVE_LOG schema partly wrong (cols F and J)
- **Severity:** HIGH
- **Doc location:** 04-warehouse-schemas.md:233-243
- **Claim:** "| F | VIPs | `shiftData.vipsNotes` |" and "| J | Task Count | `shiftData.todos.length` |"
- **Code reality:** Real schema has no "Task Count" column; the slot at J is `shiftData.rsaIncidents` (RSA/Incidents). Col F is `shiftData.theGood`. Col E "Shift Report" is `shiftData.generalShiftComments`. Doc-fabricated `shiftData.vipsNotes` is actually `shiftData.guestsOfNote`. Doc's mapping for E, G, H, I is similar in spirit but uses fabricated source-field names.
- **Evidence:** `IntegrationHubWaratah.js:610-621`:
  ```
  A: Date, B: Day, C: MOD,
  D: shiftData.generalShiftComments (Shift Summary),
  E: shiftData.guestsOfNote (Guests of Note),
  F: shiftData.theGood,
  G: shiftData.theBad,
  H: shiftData.kitchenNotes,
  I: shiftData.maintenanceIssues,
  J: shiftData.rsaIncidents,
  K: Logged At
  ```
- **Recommended fix:** Replace cols D–J entirely. Also note doc has Week Ending column for QUALITATIVE_LOG which is fabricated — real schema goes Date, Day, MOD, then narrative cols. Doc table appears to mis-shift one position.

### Finding W-12: QUALITATIVE_LOG has no Week Ending column
- **Severity:** HIGH
- **Doc location:** 04-warehouse-schemas.md:234
- **Claim:** "| C | Week Ending | computed |"
- **Code reality:** Col C is MOD. There is no Week Ending column in QUALITATIVE_LOG (unlike NIGHTLY_FINANCIAL and WASTAGE_COMPS).
- **Evidence:** `IntegrationHubWaratah.js:611-613` — `shiftData.dayOfWeek, // B: Day`; `shiftData.mod, // C: MOD`.
- **Recommended fix:** Remove the Week Ending row; relabel C as MOD; renumber other rows.

### Finding W-13: Duplicate detection helper invented
- **Severity:** CRITICAL
- **Doc location:** 04-warehouse-schemas.md:252-273
- **Claim:** A function `isDuplicateInSheet_(sheet, key, sheetName)` with a `keyCols` map.
- **Code reality:** No such function exists. Real duplicate detection is inline in `logToDataWarehouse_` using `normaliseDateKey_(v)` (helper at line 404). NIGHTLY_FINANCIAL dup key = Date + MOD (cols 0 + 3); OPERATIONAL_EVENTS dup key = Date + Description (cols 0 + 3); WASTAGE_COMPS dup key = Date + MOD (cols 0 + 3); QUALITATIVE_LOG dup key = Date + MOD (cols 0 + 2). Not "Date only" as doc claims for NIGHTLY_FINANCIAL or QUALITATIVE_LOG.
- **Evidence:** `IntegrationHubWaratah.js:404-408, 469-478, 539-546, 573-581, 600-608`.
- **Recommended fix:** Replace excerpt and table with the real inline dup-detection pattern. Update dup-key lists to (Date+MOD) / (Date+Description) / (Date+MOD) / (Date+MOD).

### Finding W-14: `parseCellDate_` excerpt fabricated
- **Severity:** HIGH
- **Doc location:** 04-warehouse-schemas.md:283-307
- **Claim:** A `parseCellDate_` body that handles Date/number/string with regex, returns invalid Date on failure.
- **Code reality:** Real function (lines 170-181) uses `Utilities.parseDate(str, 'Australia/Sydney', 'dd/MM/yyyy')` and falls back to `new Date('')` only on parse exception. Doc's regex parsing is not present in the real code (although both achieve similar outcomes).
- **Evidence:** `IntegrationHubWaratah.js:170-181`.
- **Recommended fix:** Replace with the real 12-line implementation.

### Finding W-15: `toDateOnly_` excerpt fabricated
- **Severity:** MEDIUM
- **Doc location:** 04-warehouse-schemas.md:316-322
- **Claim:** Body uses `new Date(d.getFullYear(), d.getMonth(), d.getDate())`.
- **Code reality:** Real body uses `Utilities.formatDate` + `Utilities.parseDate` round-trip (lines 191-195). Returns Date at midnight Sydney via locale-aware parsing, not naïve Date constructor.
- **Evidence:** `IntegrationHubWaratah.js:191-195`.
- **Recommended fix:** Replace with real 4-line implementation.

### Finding W-16: Backfill schedule wrong (Mon 2am vs Mon 8am)
- **Severity:** CRITICAL
- **Doc location:** 04-warehouse-schemas.md:333, 363; cross-referenced from 05-rollover-and-triggers.md:39
- **Claim:** "Monday at 2am" / "Mon 2am"
- **Code reality:** `runWeeklyBackfill_` trigger runs Monday at 8:00am.
- **Evidence:** `IntegrationHubWaratah.js:1201-1205` — `.onWeekDay(MONDAY).atHour(8)`; `MenuWaratah.js:243-248` confirms Monday 8am; `IntegrationHubWaratah.js:1207` log message — "runs every Monday at 8am".
- **Recommended fix:** Change every "2am" to "8am". The §9 ordering claim ("Mon 2am timing is before the rollover Mon 9pm") is still correct since 8am < 9pm.

### Finding W-17: `runWeeklyBackfill_()` excerpt fabricated
- **Severity:** CRITICAL
- **Doc location:** 04-warehouse-schemas.md:336-358
- **Claim:** Function opens `WARATAH_SHIFT_REPORT_CURRENT_ID` external spreadsheet, iterates `['Wednesday', ..., 'Sunday']`.
- **Code reality:** Function uses `SpreadsheetApp.getActiveSpreadsheet()` (not external open), iterates uppercase `['WEDNESDAY', ..., 'SUNDAY']`, uses `startsWith` prefix matching (because tabs are renamed like "WEDNESDAY 21/05/2026"), pre-loads existing keys via `Set` for performance, and passes `skipLock=true` to inner `logToDataWarehouse_`.
- **Evidence:** `IntegrationHubWaratah.js:1111-1189`.
- **Recommended fix:** Replace excerpt with the real implementation, or mark as illustrative.

### Finding W-18: Schema-history table claim about 22-col version
- **Severity:** MEDIUM
- **Doc location:** 04-warehouse-schemas.md:393
- **Claim:** "| 22-col | A-V | 2026-03-06 | Extended with G-V breakdown |"
- **Code reality:** Plausible based on `WeeklyDigestWaratah.js:96` stale comment ("new 22-col schema"). Cannot verify dates from code alone, but the 25-col current schema is confirmed.
- **Recommended fix:** Verify the 22-col history step from git log; otherwise leave but mark as historical.

---

## Findings — for-developers/05-rollover-and-triggers.md

### Finding R-1: Backfill schedule wrong (Mon 2am vs Mon 8am)
- **Severity:** CRITICAL
- **Doc location:** 05-rollover-and-triggers.md:39, 332, 334, 336, 338
- **Claim:** "| Weekly Backfill | `runWeeklyBackfill_` | Mon 02:00 | …", and §12 narrative "The backfill runs five hours before the rollover".
- **Code reality:** Backfill runs Mon 8am, not Mon 2am. 8am→9pm gap is 13 hours, not 5.
- **Evidence:** `IntegrationHubWaratah.js:1201-1205`; `MenuWaratah.js:243-248`.
- **Recommended fix:** Mon 02:00 → Mon 08:00 throughout §2 table and §12 prose. Update "five hours before" to "13 hours before".

### Finding R-2: Revenue Digest schedule wrong (Mon 16:00 vs Wed 8:00)
- **Severity:** CRITICAL
- **Doc location:** 05-rollover-and-triggers.md:38
- **Claim:** "| Revenue Digest | `sendWeeklyRevenueDigest_Waratah` | Mon 16:00 | `setupWeeklyDigestTrigger_Waratah()` in `WeeklyDigestWaratah.js` |"
- **Code reality:** Canonical installer `setupAllTriggers_Waratah` schedules **Wednesday 8:00am**. The lone-installer `setupWeeklyDigestTrigger_Waratah` schedules Monday 9:00am. Neither matches "Mon 16:00" (4pm).
- **Evidence:** `MenuWaratah.js:251-256` — `.onWeekDay(WEDNESDAY).atHour(8).nearMinute(0)`. `WeeklyDigestWaratah.js:178-182` — `.onWeekDay(MONDAY).atHour(9)`. JSDoc at `WeeklyDigestWaratah.js:6` does say "Monday at 9am". JSDoc at `WeeklyRolloverInPlaceWaratah.js:25-26` mentions "Weekly Revenue Digest runs Monday 4pm" — this is the source of the doc's confusion, but the comment is stale.
- **Recommended fix:** Update §2 table to Wed 08:00 (per canonical setupAllTriggers_Waratah), and add a note that two installers exist with divergent schedules and `setupAllTriggers_Waratah` is the canonical one.

### Finding R-3: §3 table claim of "Five time-based triggers" — count mismatch
- **Severity:** MEDIUM
- **Doc location:** 05-rollover-and-triggers.md:73, table 75-82
- **Claim:** "Five time-based triggers + one on-edit trigger". Table actually lists 5 time-based: Daily maintenance, Weekly summary, Bi-hourly cleanup, Daily staff workload, Weekly archive.
- **Code reality:** Body text says "five" but the count is correct (5 active + 1 deprecated = 6 installers total).
- **Recommended fix:** Body text already matches table; just minor note that §11 of doc 06 lists 7 installers — should be reconciled.

### Finding R-4: Daily maintenance schedule wrong (07:00 vs 06:00)
- **Severity:** CRITICAL
- **Doc location:** 05-rollover-and-triggers.md:77
- **Claim:** "| Daily maintenance | `runDailyTaskMaintenance` | Daily 07:00 |"
- **Code reality:** Trigger installer schedules `atHour(6)` daily, with Apps Script running it in the 6-7am window. Doc log message inside `createDailyMaintenanceTrigger` says "Created daily maintenance trigger (6-7am daily)" (line 1870).
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1864-1868`. The "7am" mentioned in JSDoc at line 1577 is misleading; actual `.atHour(6)`.
- **Recommended fix:** Change "Daily 07:00" → "Daily 06:00 (Apps Script 6-7am window)".

### Finding R-5: `createWeeklyOverdueSummaryTrigger` behaviour mischaracterised
- **Severity:** HIGH
- **Doc location:** 05-rollover-and-triggers.md:84
- **Claim:** "**Do not recreate this trigger**; it does nothing useful at runtime."
- **Code reality:** Actually safer than that: the installer function itself was gutted — it does NOT create any trigger. It just logs a deprecation message and returns. So even calling it cannot install a trigger.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:2151-2153` — entire function body is one log line.
- **Recommended fix:** "Even calling this installer does nothing — it logs a deprecation notice and returns without creating a trigger." Also: `sendOverdueTasksSummary_` (the handler) is **NOT** "gutted to a no-op" — it's still fully implemented (lines 1347-1424). Only the public wrapper `runScheduledOverdueSummary` and the installer are gutted. Doc text "the corresponding handler `sendOverdueTasksSummary_` was gutted to a no-op" is **WRONG** — it remains fully implemented and could be called directly.

### Finding R-6: Rollover execution flow — 11 steps vs actual 9 steps; ordering wrong
- **Severity:** HIGH
- **Doc location:** 05-rollover-and-triggers.md:90-105
- **Claim:** 11-step (12-numbered) sequence: lock(60s) → preconditions → idempotency → summary → PDF → snapshot → clear → updateDates → emailSummary → slackConfirm → validateResult → release.
- **Code reality:** Real sequence (lines 92-220):
  1. Acquire script lock (30s timeout, not 60s)
  2. Validate preconditions
  3. Already-rolled-over check (early return if true)
  4. Generate week summary
  5. Export PDF to archive
  6. Create sheets snapshot
  7. Clear data
  8. Update all tab dates
  9. Verify named ranges (non-blocking)
  10. Post-rollover validation
  11. Named range health check (non-blocking)
  
  No "Email rollover summary" step and no "Slack confirmation" step (Slack only fires from `_warValidateRolloverResult_` on failure, not on success — and the success UI is a `SpreadsheetApp.getUi().alert`, not email/Slack).
- **Evidence:** `WeeklyRolloverInPlaceWaratah.js:92-220`.
- **Recommended fix:** Rewrite §4 sequence to match real 11 internal steps. Remove "Email" and "Post Slack confirmation" steps (these don't exist). Change "60s" lock timeout to "30s".

### Finding R-7: `_warValidatePreconditions_` checks fabricated
- **Severity:** HIGH
- **Doc location:** 05-rollover-and-triggers.md:111-118
- **Claim:** Preconditions: sheet is the Waratah file, all 5 day tabs present, each has valid date in named range, no in-progress nightly send.
- **Code reality:** Real checks (lines 242-280):
  1. Script Property `WARATAH_WORKING_FILE_ID` is set
  2. Active spreadsheet's ID matches `WARATAH_WORKING_FILE_ID`
  3. Script Property `VENUE_NAME` === `'WARATAH'`
  4. Script Property `ARCHIVE_ROOT_FOLDER_ID` is set and the folder is accessible
  5. WEDNESDAY sheet exists (just one tab, not all 5)
  
  No check for "valid date in named range", no check for "in-progress nightly send".
- **Evidence:** `WeeklyRolloverInPlaceWaratah.js:242-280`.
- **Recommended fix:** Replace §4.1 checks with the real list.

### Finding R-8: `_warAlreadyRolledOver_` excerpt wrong logic
- **Severity:** HIGH
- **Doc location:** 05-rollover-and-triggers.md:125-132
- **Claim:** `if (wednesdayDate > today) return true;`
- **Code reality:** Compares formatted date strings of current Wednesday B3 cell vs expected next Wednesday. Returns true only when they match.
- **Evidence:** `WeeklyRolloverInPlaceWaratah.js:290-311` — `var expectedNextWedDate = ...; ... return currentDateStr === expectedStr;`
- **Recommended fix:** Replace excerpt with real string-equality logic.

### Finding R-9: `_warClearAllSheetData_` excerpt missing `clearableKeys` derivation source
- **Severity:** LOW
- **Doc location:** 05-rollover-and-triggers.md:153
- **Claim:** "`const clearableKeys = getClearableFieldKeys_();  // derived from FIELD_CONFIG isFormula`"
- **Code reality:** Correct in spirit; `getClearableFieldKeys_()` is from `RunWaratah.js` (per code comment at line 587). The "// derived from FIELD_CONFIG isFormula" annotation is reasonable.
- **Evidence:** `WeeklyRolloverInPlaceWaratah.js:585-594`.
- **Recommended fix:** No change needed.

### Finding R-10: Date update step — tabs ARE renamed
- **Severity:** HIGH
- **Doc location:** 05-rollover-and-triggers.md:212
- **Claim:** "Note: the tab name itself stays the same (always 'Wednesday'). Only the date cell and header text change. This is the in-place model in action."
- **Code reality:** Tabs ARE renamed by the rollover. The new tab name format is `'WEDNESDAY 21/05/2026'` (uppercase day + space + dd/MM/yyyy date).
- **Evidence:** `WeeklyRolloverInPlaceWaratah.js:647-660` — `var newTabName = dayName + ' ' + formattedDate; sheet.setName(newTabName);`
- **Recommended fix:** Reverse this paragraph entirely: the tab IS renamed to include the new date; the underlying sheet object stays the same (so named ranges still target it).

### Finding R-11: `_warUpdateAllTabDates_` excerpt uses wrong day count and writes wrong cell
- **Severity:** HIGH
- **Doc location:** 05-rollover-and-triggers.md:189-208
- **Claim:** Iterates 5 day tabs Wed–Sun; writes to "header range B1" using `setValue('Wednesday 17 May 2026')`.
- **Code reality:** Iterates **all 7** days (Mon–Sun); writes to range `B3:F3` (clear) then `B3` (cell 1,1 of B3:F3) with `'dd/MM/yyyy'` formatted string.
- **Evidence:** `WeeklyRolloverInPlaceWaratah.js:50, 631, 651-658` — `WAR_ROLLOVER_ALL_DAYS = ['MONDAY', ..., 'SUNDAY']`; `var dateRange = sheet.getRange('B3:F3'); dateRange.clearContent(); dateRange.getCell(1, 1).setValue(formattedDate);`.
- **Recommended fix:** Update §6 to say "all 7 day tabs (Mon–Sun)"; replace B1 with B3; show the actual `B3:F3` clear-then-write pattern.

### Finding R-12: Archive folder structure wrong (ISO week format claim)
- **Severity:** CRITICAL
- **Doc location:** 05-rollover-and-triggers.md:220-238
- **Claim:** Layout uses ISO weeks like `2026-W17/`; `_warGetArchivePath_(weekEndDateStr)` returns `${year}-W${week}`.
- **Code reality:** Real layout is `ArchiveRoot/YYYY/YYYY-MM/{pdfs|sheets}/`. Folder names use year + year-month (`2026-04`), not ISO week. PDFs go in a `pdfs/` subfolder; the spreadsheet snapshot goes in a `sheets/` subfolder. PDF filename: `Waratah Shift Report W.E. dd.mm.yyyy.pdf`. Snapshot name: `Waratah Shift Report W.E. dd.mm.yyyy` (no extension).
- **Evidence:** `WeeklyRolloverInPlaceWaratah.js:528-553` — `_warGetOrCreateArchiveSubfolder_` and `_warGetArchivePath_`. No `getISOWeek_` helper anywhere in the codebase.
- **Recommended fix:** Rewrite §7 to show year/year-month/{pdfs|sheets} structure. Remove fabricated `getISOWeek_` helper.

### Finding R-13: `_warDryRun_` excerpt fabricated
- **Severity:** HIGH
- **Doc location:** 05-rollover-and-triggers.md:248-258
- **Claim:** Returns a JSON object with cellsThatWouldClear, nextDates, archivePath.
- **Code reality:** `_warDryRun_` builds a plain-text report string with section headers ("Preconditions", "Idempotency", "Next week tab renames", "Fields to clear per active day"), logs it, and shows it in a `SpreadsheetApp.getUi().alert` — does not return JSON. Helpers `_warListClearableCells_`, `_warComputeNextDates_` don't exist.
- **Evidence:** `WeeklyRolloverInPlaceWaratah.js:675-722`.
- **Recommended fix:** Replace excerpt with the real report-string approach.

### Finding R-14: Menu labels invented
- **Severity:** MEDIUM
- **Doc location:** 05-rollover-and-triggers.md:260, 272-274
- **Claim:** Menu: "Admin Tools > Preview Rollover (Dry Run)" and "Admin Tools > Reinstall Weekly Rollover Trigger" etc.
- **Code reality:** Menu structure not verified line-by-line in this audit, but functions `setupAllTriggers_Waratah` (3 SR triggers at once) and `createRolloverTrigger_Waratah` exist. The exact menu wording per code is not necessarily what doc lists.
- **Evidence:** Inferential — based on Menu_Updated_Waratah.gs labels for the task project ("Create Weekly Summary Trigger (Mon 10am)", etc.).
- **Recommended fix:** Verify menu labels against `MenuWaratah.js` `onOpen` builder; align doc.

### Finding R-15: `inspectTriggers_` excerpt fabricated
- **Severity:** LOW
- **Doc location:** 05-rollover-and-triggers.md:288-296
- **Claim:** A `inspectTriggers_` helper.
- **Code reality:** No such function exists in the codebase (grep confirmed).
- **Recommended fix:** Mark as illustrative or remove.

---

## Findings — for-developers/06-task-management-internals.md

### Finding T-1: "8-status workflow" terminology in code header but doc body says 9
- **Severity:** LOW
- **Doc location:** 06-task-management-internals.md:80 ("(9 states)"), conflicts with project memo / CLAUDE files calling it "8-status workflow".
- **Claim:** "STATUSES (9 states)" — actual count.
- **Code reality:** 9 states declared (`STATUSES` enum, lines 155-165). File header JSDoc at line 5 says "8-status workflow system" which is itself stale.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:155-165` and `:5` JSDoc.
- **Recommended fix:** Doc 06 is correct (9 states). The "8-status workflow" label across the rest of the project is the one that should be updated; doc 06 already calls this out at line 118. No change to doc 06 needed.

### Finding T-2: STAFF_LIST claim "7 named individuals + 5 team-level + 2 catch-all"
- **Severity:** MEDIUM
- **Doc location:** 06-task-management-internals.md:177
- **Claim:** "7 named individuals + 5 team-level + 2 catch-all"
- **Code reality:** 7 named + 7 team/group entries (Bar Team, Kitchen Team, FOH Team, General Management, Marketing Explicit, Contractor, All). 14 total. The 5+2 doesn't split cleanly along the team/catch-all line.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:273-288`.
- **Recommended fix:** "7 named individuals + 7 team/group entries (incl. 'All' and 'Contractor' as catch-alls)."

### Finding T-3: Allowed state transitions fabricated as enforced
- **Severity:** MEDIUM
- **Doc location:** 06-task-management-internals.md:187-197
- **Claim:** A "Allowed transitions" table with specific arrows like "NEW → TO DO | TO DISCUSS | CANCELLED".
- **Code reality:** The transition graph is not enforced by code anywhere; doc admits this at line 199 ("the system does not block any transition"). However, the upstream transition table is presented as if real. Doc could be misleading.
- **Evidence:** `EnhancedTaskManagementWaratah.gs` — no transition matrix exists in code. `handleStatusChange_` (lines 1537-1568) only handles DONE/CANCELLED/BLOCKED side-effects, not transition validation.
- **Recommended fix:** Either drop the transition table entirely, or precede it with "Suggested transitions (not enforced by code)".

### Finding T-4: "Auto-return DEFERRED on hold-until date" feature fabricated
- **Severity:** CRITICAL
- **Doc location:** 06-task-management-internals.md:193, 208, 458
- **Claim:** "DEFERRED → TO DO | IN PROGRESS | CANCELLED (auto-returns to TO DO on hold-until date)" and "Auto-return DEFERRED tasks past their hold-until date" via `returnDeferredTasksWhenDue_`.
- **Code reality:** No such logic exists. No `returnDeferredTasksWhenDue_` function exists. `runDailyTaskMaintenance` (lines 1579-1630) runs: cleanup-and-sort, processRecurringTasks_, archiveOldCompletedTasks_, escalateBlockedTasks_. There is no "hold-until date" field anywhere in the 14-column schema.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1579-1630`; grep confirmed `returnDeferredTasksWhenDue_` does not exist.
- **Recommended fix:** Remove the parenthetical claim from §4 and the "5. Auto-return DEFERRED" step from §9.

### Finding T-5: `escalateBlockedTasks_` excerpt uses fabricated helpers
- **Severity:** HIGH
- **Doc location:** 06-task-management-internals.md:218-260
- **Claim:** Uses `getMasterActionablesSheet_()`, `daysBetween_(...)`, `buildEscalationBlockKit_(...)`, `postToSlack_(...)`, `composeEscalationEmail_(...)`.
- **Code reality:** None of those helpers exist. Real code opens the sheet via `SpreadsheetApp.openById(getTaskSpreadsheetId_())`, calculates days inline via `Math.floor((today - referenceDate) / (24*60*60*1000))`, builds blocks inline using `bk_header`/`bk_section`/`bk_divider`/`bk_buttons`, posts via `bk_post(webhook, blocks, fallbackText)`, builds HTML inline via `buildEscalationEmailHtml_(tasks)`.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1074-1162` and `1168-1195`.
- **Recommended fix:** Rewrite excerpt to use real helpers (`bk_*` builders, `bk_post`, `buildEscalationEmailHtml_`).

### Finding T-6: §5 closing sentence — "(Script Properties point at webhook and email; the threshold and recipient name are config)"
- **Severity:** LOW
- **Doc location:** 06-task-management-internals.md:265
- **Claim:** Correct — `TASK_CONFIG.escalation.blockedDaysBeforeEscalate = 14` and `escalateToName = "Evan"` are in code; webhook/email come from Script Properties via `getEscalationSlackWebhook_()`/`getEscalationEmail_()`.
- **Code reality:** Confirmed at lines 96-99 and lines 44-58.
- **Recommended fix:** No change.

### Finding T-7: `processRecurringTasks_` excerpt — wrong status filter
- **Severity:** CRITICAL
- **Doc location:** 06-task-management-internals.md:278-280
- **Claim:** "if (row[COLS.STATUS] !== STATUSES.RECURRING) continue;" — only RECURRING-status templates regenerate.
- **Code reality:** Real code (lines 1228-1229) processes **DONE**-status tasks with recurrence set:
  ```
  if (status !== STATUSES.DONE) return;
  if (!recurrence || recurrence === "None") return;
  ```
  After regenerating, sets the original task's Recurrence column to "None" (line 1277), so the template task does NOT stay at RECURRING. Doc claim at line 340 ("The RECURRING template task itself is never marked DONE; it stays at RECURRING permanently, regenerating instances") is **WRONG**.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1207-1312`.
- **Recommended fix:** Rewrite §6 fundamentally. The model is: "complete a recurring task → on next daily maintenance, a fresh TODO is generated for the next occurrence, and the original task's Recurrence is set to None." Not "templates stay at RECURRING permanently."

### Finding T-8: `computeNextOccurrence_` and `getNextMonday_` excerpts fabricated
- **Severity:** HIGH
- **Doc location:** 06-task-management-internals.md:319-336
- **Claim:** Both `computeNextOccurrence_` and a specific `getNextMonday_` body using `(1 - dayOfWeek + 7) % 7 || 7`.
- **Code reality:** No `computeNextOccurrence_` function exists. `getNextMonday_(fromDate, weeksAhead)` does exist (lines 1318-1336) but with different logic:
  ```
  if (dayOfWeek === 0) result.setDate(result.getDate() + 1);
  else if (dayOfWeek === 1) { if (weeksAhead === 0) result.setDate(result.getDate() + 7); }
  else { const daysUntilMonday = 8 - dayOfWeek; result.setDate(result.getDate() + daysUntilMonday); }
  ```
  Recurrence logic uses a `switch` inline (lines 1235-1249), not a separate helper:
  - Weekly: `getNextMonday_(lastDueDate, 1)`
  - Fortnightly: `getNextMonday_(lastDueDate, 2)`
  - Monthly: add 1 month, then `getNextMonday_(nextDueDate, 0)` (snaps to next Monday — does NOT preserve day-of-month as doc claims)
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1231-1249, 1318-1336`.
- **Recommended fix:** Replace excerpt with the real `getNextMonday_` and inline switch. Correct the Monthly description: "Monthly anchors to the Monday after the same day-of-month next month."

### Finding T-9: Audit log "Action" enum list incomplete
- **Severity:** LOW
- **Doc location:** 06-task-management-internals.md:351
- **Claim:** Actions: STATUS_CHANGE, ESCALATION, RECURRING_GENERATED, ARCHIVE, CREATED, DELETED, ERROR.
- **Code reality:** Real actions logged in code include: `EDIT`, `STATUS_CHANGE` (referenced but uses EDIT in practice), `CLEANUP`, `MIGRATION`, `ESCALATION`, `RECURRING_REGENERATED` (not _GENERATED), `ARCHIVE`, `CREATED`, `WEEKLY_SUMMARY`, `MAINTENANCE_ERROR`, `REFORMAT`, `TEST`.
- **Evidence:** Grep of `logAuditEntry_(` across the file (lines 437, 642, 1057-1060, 1157-1161, 1300-1308, 1782, 1611, 2235, 2299, 2328).
- **Recommended fix:** Replace doc enum with the real set (or note that doc list is illustrative).

### Finding T-10: `logAuditEntry_` excerpt missing `taskId` and `fieldChanged` params in body
- **Severity:** LOW
- **Doc location:** 06-task-management-internals.md:360-370
- **Claim:** Function signature `function logAuditEntry_(action, user, details, taskId, fieldChanged)` and the body uses both.
- **Code reality:** Correct — real signature/body matches.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:934-957`.
- **Recommended fix:** No change.

### Finding T-11: `onTaskSheetEditWithAutoSort` is INSTALLABLE, not simple
- **Severity:** CRITICAL
- **Doc location:** 06-task-management-internals.md:379, 428
- **Claim:** "installed as a simple `onEdit` trigger" and "Simple onEdit triggers run with restricted permissions (no UrlFetch, no MailApp)."
- **Code reality:** Installed as an installable trigger via `ScriptApp.newTrigger(...).forSpreadsheet(...).onEdit().create()`. Installable triggers DO have full permissions (UrlFetch, MailApp). The JSDoc at line 1467 explicitly says "installable trigger".
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1915-1929`; `:1467`.
- **Recommended fix:** Change "simple" → "installable". Remove the "restricted permissions" claim — installable onEdit has full scopes. Also remove the claim that "the bi-hourly cleanup trigger picks up the state change and dispatches notifications" — cleanup is just sort/empty-row removal; notifications come from `onTaskSheetEditWithAutoSort` directly via `handleStatusChange_` (lines 1537-1568) but the real code does NOT dispatch DMs on BLOCKED transitions either — it just highlights the Blocker Notes cell.

### Finding T-12: `notifyAssigneeOfBlock_` invented (no immediate BLOCKED notification)
- **Severity:** HIGH
- **Doc location:** 06-task-management-internals.md:417-419
- **Claim:** "Notify assignee if status changed to BLOCKED (immediate, before 14-day escalation)" via `notifyAssigneeOfBlock_(taskData)`.
- **Code reality:** No such function exists. `handleStatusChange_` only sets background colour and adds a note to the Blocker Notes cell when status changes to BLOCKED. No Slack DM, no email.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1549-1560`. Grep confirmed `notifyAssigneeOfBlock_` does not exist.
- **Recommended fix:** Remove this claim entirely.

### Finding T-13: `runDailyTaskMaintenance` step list — order wrong + fabricated steps
- **Severity:** CRITICAL
- **Doc location:** 06-task-management-internals.md:444-460
- **Claim:** Steps:
  1. cleanupAndSortMasterActionables();
  2. processRecurringTasks_();
  3. archiveCompletedTasks_();
  4. escalateBlockedTasks_();
  5. returnDeferredTasksWhenDue_();
- **Code reality:** Real steps (lines 1588-1607):
  1. cleanupAndSortMasterActionables()
  2. processRecurringTasks_()
  3. archiveOldCompletedTasks_() (note: **OldCompleted**, not **Completed**)
  4. escalateBlockedTasks_()
  Step 5 (returnDeferredTasksWhenDue_) does not exist. There is a comment line about "Overdue summary removed (Apr 2026)".
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1579-1630`.
- **Recommended fix:** Remove step 5; correct step 3 function name to `archiveOldCompletedTasks_`.

### Finding T-14: `runDailyTaskMaintenance` claim "Daily 7am workhorse"
- **Severity:** HIGH
- **Doc location:** 06-task-management-internals.md:434, 215 ("each morning at 7am")
- **Claim:** "daily 7am workhorse"
- **Code reality:** Trigger fires at hour 6 (6-7am window). The "7am" terminology is inherited from the file JSDoc but the actual installer uses `.atHour(6)`.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1864-1868`; JSDoc:1577 says 7am but is stale.
- **Recommended fix:** "Daily 6am workhorse (Apps Script 6-7am window)".

### Finding T-15: `runDailyTaskMaintenance` excerpt — wrong final logAuditEntry
- **Severity:** LOW
- **Doc location:** 06-task-management-internals.md:460
- **Claim:** `logAuditEntry_('MAINTENANCE_COMPLETE', 'System', 'Daily maintenance succeeded');`
- **Code reality:** No such success audit log entry exists. Only a failure log: `logAuditEntry_("MAINTENANCE_ERROR", "System", e.message);` (line 1611).
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1586-1607`.
- **Recommended fix:** Remove the MAINTENANCE_COMPLETE line from excerpt.

### Finding T-16: `sendWeeklyActiveTasksSummary` excerpt missing channel-post→DM split
- **Severity:** HIGH
- **Doc location:** 06-task-management-internals.md:482-512
- **Claim:** "DM each assignee with personal webhook" loop, sends Slack DMs directly.
- **Code reality:** Real flow is two-stage: (1) `_sendWeeklyActiveTasksSummaryCore` is called, which historically posted a channel summary then DMs; channel post is now commented out (April 2026 change at lines 1777-1780); only `_sendWeeklyActiveTasksDMs_(staffMap, today, tz, isTest)` runs. Also: the function does NOT directly read `SLACK_DM_WEBHOOKS`; it goes through `getSlackDmWebhooks_()` helper (line 71).
- **Evidence:** `EnhancedTaskManagementWaratah.gs:1642-1786, 1792-...`.
- **Recommended fix:** Replace excerpt with the real two-function structure: top-level `sendWeeklyActiveTasksSummary` → `_sendWeeklyActiveTasksSummaryCore(getManagersChannelWebhook_(), false)` → `_sendWeeklyActiveTasksDMs_(...)`.

### Finding T-17: §11 trigger installers — 7 listed; mis-categorisation of `sendOverdueTasksSummary_`
- **Severity:** HIGH
- **Doc location:** 06-task-management-internals.md:533, 535
- **Claim:** "| `createWeeklyOverdueSummaryTrigger()` | `sendOverdueTasksSummary_` (deprecated) | Sun 09:00 |" and "The corresponding handler is a no-op as of April 2026, so installing the trigger only consumes a trigger slot in the project's 20-trigger quota without doing useful work."
- **Code reality:**
  - The handler is **NOT** `sendOverdueTasksSummary_` — the trigger handler would have been `runScheduledOverdueSummary` (the public wrapper). The internal `sendOverdueTasksSummary_` is still fully implemented but unreachable from any trigger.
  - `createWeeklyOverdueSummaryTrigger` no longer creates ANY trigger (function body is one log line). It cannot consume a trigger slot because it does not call `ScriptApp.newTrigger(...)`.
  - The "Sun 09:00" schedule that "would have been" — JSDoc at line 21 mentions "Weekly Sun 9am" but installer is gutted, so this is just historical.
- **Evidence:** `EnhancedTaskManagementWaratah.gs:2056-2058, 2151-2153`.
- **Recommended fix:** Rewrite the row: handler should be `runScheduledOverdueSummary` (gutted to no-op); installer is also gutted and does not create a trigger; "consumes a slot" claim is wrong.

### Finding T-18: §11 table — handler for `sendWeeklyActiveTasksSummary` notes installer doesn't notify on test
- **Severity:** LOW
- **Doc location:** 06-task-management-internals.md:528
- **Claim:** "| `createWeeklySummaryTrigger()` | `sendWeeklyActiveTasksSummary` | Mon 10:00 |"
- **Code reality:** Correct — `createWeeklySummaryTrigger()` at lines 1885-1908 installs Monday 10am.
- **Recommended fix:** No change.

### Finding T-19: §13 audit log row count "around 8,000 rows after ~6 months"
- **Severity:** UNVERIFIED
- **Doc location:** 06-task-management-internals.md:560
- **Claim:** "Currently around 8,000 rows after ~6 months of operation."
- **Code reality:** Cannot verify without reading the live AUDIT LOG sheet.
- **Recommended fix:** Mark as illustrative or pull live row count for accuracy.

---

## Unverified Claims

### UDP-1: Doc 04 §11 history — "16-col on 2026-03-06" vs "17-col on 2026-03-01"
Schema version history cannot be verified from code alone; relies on git log. The current 25-col schema is confirmed.

### UDP-2: Doc 05 §9 menu items "Admin Tools > Reinstall Weekly Rollover Trigger" etc.
The menu structure builder in `MenuWaratah.js:onOpen` was not fully read in this audit. Doc may list non-existent menu items.

### UDP-3: Doc 05 §13 historical claim that earlier versions used a "duplication model"
Not verifiable from current code. Possibly true based on commit history.

### UDP-4: Doc 06 §13 performance claim "MASTER ACTIONABLES SHEET grows ~50 rows per week … 200-300 active rows"
Not verifiable from code alone; would require reading live sheet.

---

## Top-Priority Corrections (recommended order)

1. **04-warehouse-schemas.md** — Rewrite NIGHTLY_FINANCIAL §2 table for cols H, V, W, X, Y; rewrite §4 OPERATIONAL_EVENTS schema (it's TO-DOs, not maintenance/RSA); rewrite §5 WASTAGE_COMPS schema (col F is LoggedAt, single-row write); rewrite §6 QUALITATIVE_LOG (no Week Ending col; F is theGood, J is RSA/Incidents).
2. **04 & 05** — Backfill schedule is Monday 08:00, not Monday 02:00.
3. **05-rollover-and-triggers.md** — Revenue Digest is Wed 08:00 (canonical), not Mon 16:00; rollover archive uses YYYY/YYYY-MM/{pdfs,sheets}, not ISO weeks; tabs ARE renamed; updateAllTabDates iterates all 7 days (Mon–Sun) and writes B3 not B1; rollover lock timeout is 30s not 60s; preconditions check Script Properties (WORKING_FILE_ID, VENUE_NAME, ARCHIVE_ROOT_FOLDER_ID) not "no in-progress nightly send".
4. **06-task-management-internals.md** — Recurring task processing fires on **DONE** status (not RECURRING); auto-return-DEFERRED feature does not exist (remove from §4 and §9); `onTaskSheetEditWithAutoSort` is INSTALLABLE not simple; daily maintenance fires at hour 6 not 7; step 3 is `archiveOldCompletedTasks_` not `archiveCompletedTasks_`; `runScheduledOverdueSummary` (not `sendOverdueTasksSummary_`) is the gutted handler; the installer `createWeeklyOverdueSummaryTrigger` is also gutted (no trigger created).
5. **All three docs** — Stop using fabricated helper names (`getProp_`, `isDuplicateInSheet_`, `computeWeekEnding_`, `extractCost_`, `getMasterActionablesSheet_`, `getAuditLogSheet_`, `daysBetween_`, `buildEscalationBlockKit_`, `composeEscalationEmail_`, `buildWeeklySummaryBlockKit_`, `postToSlack_`, `notifyAssigneeOfBlock_`, `returnDeferredTasksWhenDue_`, `notifyAdminOfMaintenanceFailure_`, `computeNextOccurrence_`, `getISOWeek_`, `_warMarkUnrolledOver_`, `_warListClearableCells_`, `_warComputeNextDates_`, `inspectTriggers_`). Either use the real helper names or replace excerpts with the actual inline code.
