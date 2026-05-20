# Warehouse Schemas

**Audience:** Developers writing, backfilling, or schema-evolving the central data warehouse spreadsheet.

The warehouse is a separate Google Sheets spreadsheet whose ID lives in `WARATAH_DATA_WAREHOUSE_ID` Script Property. It has four tabs: `NIGHTLY_FINANCIAL`, `OPERATIONAL_EVENTS`, `WASTAGE_COMPS`, `QUALITATIVE_LOG`. Each tab has a fixed schema enforced at write time.

---

## 1. Spreadsheet Layout

| Tab | Purpose | Write cadence |
|---|---|---|
| `NIGHTLY_FINANCIAL` | One row per service day with all financial numbers | Once per nightly send |
| `OPERATIONAL_EVENTS` | One row per TO-DO captured on the shift report | Per-todo batch on send |
| `WASTAGE_COMPS` | One row per service day holding the wastage/comps narrative | Once per nightly send |
| `QUALITATIVE_LOG` | One row per service day with the narrative fields | Once per nightly send |

The warehouse is opened by ID, not by name. The script owner must have edit access. If permissions are revoked, the entire write step fails with a `You do not have permission` error.

---

## 2. NIGHTLY_FINANCIAL Schema (25 Columns, A-Y)

**Header assertion:** before any write, the code asserts the warehouse tab has exactly 25 columns. If the header row is mis-sized, writes are blocked with a clear error. This prevents column drift between code and schema.

The current 25-column schema (May 17, 2026 cutover):

| Column | Header (per code) | Source field | Notes |
|---|---|---|---|
| A | Date | `shiftData.date` (via `toDateOnly_`) | Date |
| B | Day | `shiftData.dayOfWeek` | String |
| C | Week Ending | computed weekEnding (via `toDateOnly_`) | Date |
| D | MOD | `shiftData.mod` | String |
| E | Staff | `shiftData.staff` (concat "FOH: ... \| BOH: ...") | String |
| F | Net Revenue | `shiftData.netRevenue` | B54 formula |
| G | Production Amount | `shiftData.productionAmount` | B37 |
| H | CashTakings | `shiftData.cashTake` | C19 (header label retained for schema compat) |
| I | GrossSalesIncCash | `shiftData.grossSales` | B48 |
| J | Cash Returns | `shiftData.cashReturns` | C22 |
| K | CD Discount | `shiftData.cdDiscount` | C23 |
| L | Refunds | `null` literal | Deprecated post-May 2026 |
| M | CDRedeem | `null` literal | Deprecated post-May 2026 |
| N | TotalDiscount | `shiftData.totalAdjustmentsDiscounts` | B50 |
| O | DiscountsCompsExcCD | `shiftData.discountsExcCashDiscount` | B51 |
| P | GrossTaxableSales | `shiftData.grossSalesLessDiscounts` | B52 |
| Q | Taxes | `shiftData.taxes` | B53 |
| R | NetSalesWTips | `null` literal | Deprecated post-May 2026 |
| S | Card Tips | `shiftData.cardTips` | C30 |
| T | Cash Tips | `shiftData.cashTips` | C29 |
| U | Total Tips | `shiftData.totalTips` | C32 formula |
| V | CashCounted | `shiftData.cashCounted \|\| null` | C18 formula (was LoggedAt pre-cutover) |
| W | ExpectedCash | `shiftData.totalCashRecorded \|\| null` | C24 (header label retained) |
| X | CashVariance | `shiftData.cashVariance \|\| null` | C26 formula |
| Y | LoggedAt | `new Date()` | Server timestamp; moved from V to Y at cutover |

**Deprecated columns (L, M, R):** these were active in earlier schema versions. They are now written as the `null` literal (not an empty string) to preserve column positions for historical rows. Do not remove these columns; do not repurpose them.

**Cash reconciliation columns (V, W, X):** added on May 17, 2026 when the cash recon workflow was integrated into the warehouse. LoggedAt moved from V to Y at the same cutover. Historical rows before May 17 have V/W/X empty.

---

## 3. NIGHTLY_FINANCIAL Write Code

The write is in `IntegrationHubWaratah.js` inside `logToDataWarehouse_(shiftData, config, skipLock)` (line 425). There is no standalone `logToNightlyFinancial_` helper, no `getProp_` helper, no `isDuplicateInSheet_` helper, and no `computeWeekEnding_` helper. The warehouse ID is read inline from Script Properties; weekEnding is computed inside `extractShiftData_` (lines 322-324); duplicate detection is inline using `normaliseDateKey_` (line 404).

Real header assertion and appendRow block (illustrative excerpt of the inline code):

```javascript
// Header assertion (IntegrationHubWaratah.js:484-498)
var actualCols = nfSheet.getLastColumn();
if (actualCols > 0 && actualCols !== 25) {
  throw new Error('NIGHTLY_FINANCIAL header has ' + actualCols + ' columns, expected 25');
}

// appendRow (IntegrationHubWaratah.js:500-526). Null literals for deprecated cols
nfSheet.appendRow([
  toDateOnly_(shiftData.date),               // A: Date
  shiftData.dayOfWeek,                       // B: Day
  toDateOnly_(shiftData.weekEnding),         // C: Week Ending
  shiftData.mod,                             // D: MOD
  shiftData.staff,                           // E: Staff
  shiftData.netRevenue,                      // F: Net Revenue (B54)
  shiftData.productionAmount,                // G: Production Amount (B37)
  shiftData.cashTake,                        // H: CashTakings (C19)
  shiftData.grossSales,                      // I: GrossSalesIncCash (B48)
  shiftData.cashReturns,                     // J: Cash Returns (C22)
  shiftData.cdDiscount,                      // K: CD Discount (C23)
  null,                                      // L: Refunds (deprecated)
  null,                                      // M: CDRedeem (deprecated)
  shiftData.totalAdjustmentsDiscounts,       // N: TotalDiscount (B50)
  shiftData.discountsExcCashDiscount,        // O: DiscountsCompsExcCD (B51)
  shiftData.grossSalesLessDiscounts,         // P: GrossTaxableSales (B52)
  shiftData.taxes,                           // Q: Taxes (B53)
  null,                                      // R: NetSalesWTips (deprecated)
  shiftData.cardTips,                        // S: Card Tips (C30)
  shiftData.cashTips,                        // T: Cash Tips (C29)
  shiftData.totalTips,                       // U: Total Tips (C32)
  shiftData.cashCounted  || null,            // V: CashCounted (C18 formula)
  shiftData.totalCashRecorded || null,       // W: ExpectedCash (C24)
  shiftData.cashVariance || null,            // X: CashVariance (C26 formula)
  new Date()                                 // Y: LoggedAt
]);
```

Deprecated columns (L, M, R) are written as the `null` literal, not as empty strings.

---

## 4. OPERATIONAL_EVENTS Schema (8 Columns, A-H)

OPERATIONAL_EVENTS is the **TO-DOs log**, not a maintenance/RSA log. Rows come from `shiftData.todos` (the TO-DOs list captured on the shift report). There is no Week Ending column and no Event Type column. Maintenance and RSA narratives are warehoused in QUALITATIVE_LOG instead (Section 6).

| Column | Header | Source |
|---|---|---|
| A | Date | `toDateOnly_(shiftData.date)` |
| B | Day | `shiftData.dayOfWeek` |
| C | MOD | `shiftData.mod` |
| D | Description | `todo.description` |
| E | Assignee | `todo.assignee` |
| F | Priority | literal `"MEDIUM"` |
| G | Source | literal `"Shift Report"` |
| H | Logged At | `new Date()` |

### Write code

There is no standalone `logToOperationalEvents_` function and no `extractCost_` helper. The write is inline inside `logToDataWarehouse_` (IntegrationHubWaratah.js:531-567), iterating `shiftData.todos`:

```javascript
// Inline inside logToDataWarehouse_ (IntegrationHubWaratah.js:551-560)
newEventRows.push([
  toDateOnly_(shiftData.date),  // A: Date
  shiftData.dayOfWeek,          // B: Day
  shiftData.mod,                // C: MOD
  todo.description,             // D: Description
  todo.assignee,                // E: Assignee
  "MEDIUM",                     // F: Priority (literal)
  "Shift Report",               // G: Source (literal)
  new Date()                    // H: Logged At
]);
```

Duplicate prevention is inline using `normaliseDateKey_` on Date + Description (cols 0 + 3).

---

## 5. WASTAGE_COMPS Schema (6 Columns, A-F)

One row per service day. The full wastage/comps narrative is written as a single string in col E. No per-item splitting, no cost regex, no `extractCost_` helper.

| Column | Header | Source |
|---|---|---|
| A | Date | `toDateOnly_(shiftData.date)` |
| B | Day | `shiftData.dayOfWeek` |
| C | Week Ending | `toDateOnly_(shiftData.weekEnding)` |
| D | MOD | `shiftData.mod` |
| E | Notes | `shiftData.wastageComps` (full narrative as one string) |
| F | Logged At | `new Date()` |

### Write pattern

Single-row append per shift. Real inline block (IntegrationHubWaratah.js:583-590):

```javascript
wastageSheet.appendRow([
  toDateOnly_(shiftData.date),           // A: Date
  shiftData.dayOfWeek,                   // B: Day
  toDateOnly_(shiftData.weekEnding),     // C: Week Ending
  shiftData.mod,                         // D: MOD
  shiftData.wastageComps,                // E: Notes (full narrative)
  new Date()                             // F: Logged At
]);
```

Duplicate prevention is inline using `normaliseDateKey_` on Date + MOD (cols 0 + 3).

---

## 6. QUALITATIVE_LOG Schema (11 Columns, A-K)

One row per service day. There is no Week Ending column in this sheet (unlike NIGHTLY_FINANCIAL and WASTAGE_COMPS). MOD lives at col C; narrative fields run D-J; Logged At at K.

| Column | Header | Source |
|---|---|---|
| A | Date | `toDateOnly_(shiftData.date)` |
| B | Day | `shiftData.dayOfWeek` |
| C | MOD | `shiftData.mod` |
| D | Shift Summary | `shiftData.generalShiftComments` |
| E | Guests of Note | `shiftData.guestsOfNote` |
| F | Good | `shiftData.theGood` |
| G | Bad | `shiftData.theBad` |
| H | Kitchen | `shiftData.kitchenNotes` |
| I | Maintenance | `shiftData.maintenanceIssues` |
| J | RSA/Incidents | `shiftData.rsaIncidents` |
| K | Logged At | `new Date()` |

**Sheet name alias note:** historical code and docs sometimes call this sheet `QUALITATIVE_NOTES` rather than `QUALITATIVE_LOG`. The canonical name in current code is `QUALITATIVE_LOG`. If a deployment created the sheet under the alternative name, rename it before writes resume.

---

## 7. Duplicate Prevention

There is no standalone `isDuplicateInSheet_` helper. Each warehouse write block inside `logToDataWarehouse_` performs duplicate detection inline using `normaliseDateKey_(v)` (helper at IntegrationHubWaratah.js:404) to normalise the date portion of the key. Existing keys are pre-loaded into a `Set` for O(1) lookup before any append.

Per-sheet duplicate keys (per inline code at lines 469-478, 539-546, 573-581, 600-608):

| Sheet | Key columns | Key form |
|---|---|---|
| NIGHTLY_FINANCIAL | Date + MOD (cols 0 + 3) | `normaliseDateKey_(date) + '|' + mod` |
| OPERATIONAL_EVENTS | Date + Description (cols 0 + 3) | `normaliseDateKey_(date) + '|' + description` |
| WASTAGE_COMPS | Date + MOD (cols 0 + 3) | `normaliseDateKey_(date) + '|' + mod` |
| QUALITATIVE_LOG | Date + MOD (cols 0 + 2) | `normaliseDateKey_(date) + '|' + mod` |

The composite key strategy lets a write re-run idempotently without creating duplicates. This is what makes the Monday 8am backfill safe to re-run.

---

## 8. Date Handling, `toDateOnly_(d)` and `parseCellDate_(v)`

The Australia locale fix on April 2, 2026 set the spreadsheet to `Australia/Sydney` and dd/mm/yyyy parsing. Two helpers enforce this:

### `parseCellDate_(value)`

Used when reading raw cell values that might be Date objects, strings, or numbers. Real body at IntegrationHubWaratah.js:170-181:

```javascript
function parseCellDate_(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  var str = String(value || '').trim();
  if (!str) return new Date('');
  try {
    return Utilities.parseDate(str, 'Australia/Sydney', 'dd/MM/yyyy');
  } catch (e) {
    Logger.log('parseCellDate_: could not parse "' + str + '"; falling back to invalid date');
    return new Date('');
  }
}
```

Note the deliberate `new Date('')` (invalid) fallback on parse exception. Earlier code used `new Date(str)` which would parse US format and silently mis-interpret dd/mm dates. The new behaviour is to fail loud rather than write a wrong date.

### `toDateOnly_(d)`

Used immediately before any warehouse appendRow to strip time components. Real body at IntegrationHubWaratah.js:191-195:

```javascript
function toDateOnly_(d) {
  if (!d || isNaN(d.getTime())) return null;
  var s = Utilities.formatDate(d, 'Australia/Sydney', 'yyyy-MM-dd');
  return Utilities.parseDate(s, 'Australia/Sydney', 'yyyy-MM-dd');
}
```

The round-trip via `Utilities.formatDate` + `Utilities.parseDate` returns a Date at midnight Sydney via locale-aware parsing, rather than a naïve Date constructor.

Without this, a Date object with a time component (`2026-04-01 19:00:00`) writes the time too, and downstream analytics sometimes interpret the date wrong (April 1 19:00 → "Sunday" because Sunday in some timezones starts at 21:00 the previous day).

**Every** `appendRow` in `logToDataWarehouse_` wraps date values with `toDateOnly_`. Forgetting this is the most common cause of off-by-one-day errors in the warehouse.

---

## 9. Backfill Flow

`runWeeklyBackfill_()` runs Monday at 8am. It re-pushes any night's data that did not land in the warehouse during the original send.

Real implementation (IntegrationHubWaratah.js:1111-1189) operates on the active spreadsheet (the shift report itself, not an external file), iterates the uppercase day names, uses `startsWith` to match tabs that have been renamed by rollover (for example `WEDNESDAY 21/05/2026`), pre-loads existing warehouse keys into a `Set` for fast dedup, and passes `skipLock=true` to the inner `logToDataWarehouse_` call:

```javascript
// Illustrative excerpt; see IntegrationHubWaratah.js:1111-1189 for full body
function runWeeklyBackfill_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dayNames = ['WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  var sheets = ss.getSheets();

  // Pre-load existing keys for dup-skip
  // ...build Set of existing Date+MOD keys from NIGHTLY_FINANCIAL...

  for (var d = 0; d < dayNames.length; d++) {
    var dayUpper = dayNames[d];
    var sheet = sheets.find(function (s) {
      return s.getName().toUpperCase().startsWith(dayUpper);
    });
    if (!sheet) continue;

    var shiftData = extractShiftData_(sheet);
    if (!shiftData.date || !shiftData.mod) continue;

    try {
      logToDataWarehouse_(shiftData, getWarehouseConfig_(), /*skipLock=*/true);
    } catch (e) {
      Logger.log('Backfill error for ' + sheet.getName() + ': ' + e.message);
    }
  }
}
```

The duplicate prevention inside `logToDataWarehouse_` is what makes this safe to re-run. Nights already in the warehouse are skipped silently; only missing rows are written.

The Mon 8am timing is well before the rollover (Mon 9pm) so the spreadsheet still contains last week's data when backfill runs.

---

## 10. Adding a Column to NIGHTLY_FINANCIAL

To extend the schema (for example, adding a 26th column for refund volume):

1. Update the header row in the warehouse spreadsheet first. Add the new column name in column Z.
2. Update the header assertion in `logToNightlyFinancial_` to expect 26 columns.
3. Add the new field to `extractShiftData_` (read from the appropriate cell).
4. Add the appendRow value for the new column.
5. Document the new column in this file's Section 2 table.
6. Update [`02-cell-reference-and-field-config.md`](02-cell-reference-and-field-config.md) Section 10 quick lookup table.
7. Deploy via clasp push, verify with a TEST report.

Order matters: header update first, then code. If you push code expecting 26 columns to a 25-column warehouse, the header assertion will fail and writes are blocked.

To remove a column, the reverse but more cautious: set future writes to write '' for that column position (deprecate), keep the column in place, communicate the schema change widely. Never delete a column from a warehouse with historical data.

---

## 11. Schema History Notes

The NIGHTLY_FINANCIAL schema has evolved:

| Version | Columns | Date | Notes |
|---|---|---|---|
| 17-col | A-Q | 2026-03-01 | Initial Phase 1 schema |
| 16-col | A-P | 2026-03-06 | Column J "Total Tips" deleted as redundant (now derived from S+T) |
| 22-col | A-V | 2026-03-06 | Extended with G-V breakdown (Production through Logged At) |
| 25-col | A-Y | 2026-05-17 | Added W, X, Y for cash reconciliation (cash recorded, counted, variance) |

The 25-column schema is current. Historical rows from earlier versions have empty cells for columns added after their write time. The assertion check is for current schema; historical data is read by analytics queries that ignore the empty cells.

If you are doing analytics across the schema versions, expect cash recon data only from May 17 onward.

---

## 12. Performance Notes

- The warehouse writes happen serially within `logToDataWarehouse_`. Each `appendRow` is one API call.
- For high-volume backfill, consider batching: use `setValues` over a range rather than per-row `appendRow`. This is what OPERATIONAL_EVENTS and WASTAGE_COMPS use for batching incident rows.
- The duplicate check reads the entire sheet via `getDataRange().getValues()`. For warehouses approaching 10,000+ rows, this becomes slow. Consider caching the date set or maintaining a separate index sheet if performance degrades.
- The header assertion is fast (single range read of row 1) and worth keeping; it has prevented at least one mis-aligned write incident.
