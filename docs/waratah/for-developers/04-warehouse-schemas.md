# Warehouse Schemas

**Audience:** Developers writing, backfilling, or schema-evolving the central data warehouse spreadsheet.

The warehouse is a separate Google Sheets spreadsheet whose ID lives in `WARATAH_DATA_WAREHOUSE_ID` Script Property. It has four tabs: `NIGHTLY_FINANCIAL`, `OPERATIONAL_EVENTS`, `WASTAGE_COMPS`, `QUALITATIVE_LOG`. Each tab has a fixed schema enforced at write time.

---

## 1. Spreadsheet Layout

| Tab | Purpose | Write cadence |
|---|---|---|
| `NIGHTLY_FINANCIAL` | One row per service day with all financial numbers | Once per nightly send |
| `OPERATIONAL_EVENTS` | One row per maintenance or RSA incident | Per-event batch on send |
| `WASTAGE_COMPS` | One row per wastage entry | Per-item batch on send |
| `QUALITATIVE_LOG` | One row per service day with the five narrative fields | Once per nightly send |

The warehouse is opened by ID, not by name. The script owner must have edit access. If permissions are revoked, the entire write step fails with a `You do not have permission` error.

---

## 2. NIGHTLY_FINANCIAL Schema (25 Columns, A-Y)

**Header assertion:** before any write, the code asserts the warehouse tab has exactly 25 columns. If the header row is mis-sized, writes are blocked with a clear error. This prevents column drift between code and schema.

The current 25-column schema (May 17, 2026 cutover):

| Column | Header | Source field | Type |
|---|---|---|---|
| A | Date | `shiftData.date` (via `toDateOnly_`) | Date |
| B | Day | `shiftData.dayOfWeek` | String |
| C | Week Ending | computed from date | Date |
| D | MOD | `shiftData.MOD` | String |
| E | Staff | `shiftData.staff` | String |
| F | Net Revenue | `shiftData.netRevenue` | Number |
| G | Production Amount | `shiftData.production` | Number |
| H | Cash Counted | `shiftData.cashCounted` | Number |
| I | Gross Sales (inc Cash) | `shiftData.grossSales` | Number |
| J | Cash Returns | `shiftData.cashReturns` | Number |
| K | CD Discount | `shiftData.cdDiscount` | Number |
| L | Refunds | (deprecated, NULL going forward) | Number |
| M | CD Redeem | (deprecated, NULL going forward) | Number |
| N | Total Discount | `shiftData.totalDiscount` | Number |
| O | Discounts/Comps (excl CD) | `shiftData.discountsExcCD` | Number |
| P | Gross Taxable Sales | `shiftData.grossSalesLessDisc` | Number |
| Q | Taxes | `shiftData.taxes` | Number |
| R | Net Sales w/Tips | (deprecated, NULL going forward) | Number |
| S | Card Tips | `shiftData.cardTips` | Number |
| T | Cash Tips | `shiftData.cashTips` | Number |
| U | Total Tips | `shiftData.totalTips` | Number |
| V | Logged At | `new Date()` server timestamp | Datetime |
| W | Cash Take (POS expected) | `shiftData.cashRecorded` | Number |
| X | Cash Take (counted) | `shiftData.cashTakings` | Number |
| Y | Cash Variance | `shiftData.cashVariance` | Number |

**Deprecated columns (L, M, R):** these were active in earlier schema versions. They are now written as null (or empty string) to preserve column positions for historical rows. Do not remove these columns; do not repurpose them.

**Cash reconciliation columns (W, X, Y):** added on May 17, 2026 when the cash recon workflow was integrated into the warehouse. Historical rows before May 17 have these columns empty.

---

## 3. NIGHTLY_FINANCIAL Write Code

The write is in `IntegrationHubWaratah.js`:

```javascript
function logToNightlyFinancial_(shiftData) {
  const warehouseId = getProp_('WARATAH_DATA_WAREHOUSE_ID');
  const warehouse = SpreadsheetApp.openById(warehouseId);
  const sheet = warehouse.getSheetByName('NIGHTLY_FINANCIAL');

  // Header assertion: enforce 25-column schema before writing.
  const headerCount = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].length;
  if (headerCount !== 25) {
    throw new Error(`NIGHTLY_FINANCIAL header has ${headerCount} columns, expected 25`);
  }

  // Duplicate prevention
  if (isDuplicateInSheet_(sheet, shiftData.date, 'NIGHTLY_FINANCIAL')) {
    Logger.log(`Skipping duplicate write for ${shiftData.date} ${shiftData.dayOfWeek}`);
    return { skipped: true, reason: 'duplicate' };
  }

  const weekEnding = computeWeekEnding_(shiftData.date);

  sheet.appendRow([
    toDateOnly_(shiftData.date),         // A Date
    shiftData.dayOfWeek,                  // B Day
    toDateOnly_(weekEnding),              // C Week Ending
    shiftData.MOD,                        // D MOD
    shiftData.staff,                      // E Staff
    shiftData.netRevenue,                 // F Net Revenue
    shiftData.production,                 // G Production
    shiftData.cashCounted,                // H Cash Counted
    shiftData.grossSales,                 // I Gross Sales
    shiftData.cashReturns,                // J Cash Returns
    shiftData.cdDiscount,                 // K CD Discount
    '',                                   // L Refunds (deprecated)
    '',                                   // M CD Redeem (deprecated)
    shiftData.totalDiscount,              // N Total Discount
    shiftData.discountsExcCD,             // O Discounts excl CD
    shiftData.grossSalesLessDisc,         // P Gross Taxable Sales
    shiftData.taxes,                      // Q Taxes
    '',                                   // R Net Sales w/Tips (deprecated)
    shiftData.cardTips,                   // S Card Tips
    shiftData.cashTips,                   // T Cash Tips
    shiftData.totalTips,                  // U Total Tips
    new Date(),                           // V Logged At
    shiftData.cashRecorded,               // W Cash Take (POS expected)
    shiftData.cashTakings,                // X Cash Take (counted)
    shiftData.cashVariance                // Y Cash Variance
  ]);

  return { written: true };
}
```

Note the explicit empty strings for deprecated columns (L, M, R) to preserve positions.

---

## 4. OPERATIONAL_EVENTS Schema (8 Columns, A-H)

For maintenance and RSA incidents.

| Column | Header | Source |
|---|---|---|
| A | Date | `shiftData.date` (via `toDateOnly_`) |
| B | Day | `shiftData.dayOfWeek` |
| C | Week Ending | computed |
| D | MOD | `shiftData.MOD` |
| E | Event Type | "Maintenance" or "RSA" |
| F | Description | the maintenance or RSA narrative |
| G | Estimated Cost | optional, from narrative parsing |
| H | Logged At | `new Date()` |

### Write code

```javascript
function logToOperationalEvents_(shiftData) {
  const sheet = warehouse.getSheetByName('OPERATIONAL_EVENTS');

  const events = [];
  if (shiftData.maintenance && shiftData.maintenance !== 'None') {
    events.push({ type: 'Maintenance', description: shiftData.maintenance });
  }
  if (shiftData.rsaIncidents && shiftData.rsaIncidents !== 'None') {
    events.push({ type: 'RSA', description: shiftData.rsaIncidents });
  }

  if (events.length === 0) return { written: 0 };

  const weekEnding = computeWeekEnding_(shiftData.date);
  const rows = events.map(event => [
    toDateOnly_(shiftData.date),
    shiftData.dayOfWeek,
    toDateOnly_(weekEnding),
    shiftData.MOD,
    event.type,
    event.description,
    extractCost_(event.description),  // tries to find $X.XX in the text
    new Date()
  ]);

  // Batch write
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, 8).setValues(rows);

  return { written: rows.length };
}
```

`extractCost_` uses a simple regex (`/\$(\d+(?:\.\d+)?)/`) to find a dollar value in the description. If no value, returns null.

Duplicate prevention is based on date + event type + description hash.

---

## 5. WASTAGE_COMPS Schema (6 Columns, A-F)

For wastage entries.

| Column | Header | Source |
|---|---|---|
| A | Date | `toDateOnly_(shiftData.date)` |
| B | Day | `shiftData.dayOfWeek` |
| C | Week Ending | computed |
| D | MOD | `shiftData.MOD` |
| E | Description | parsed from `shiftData.wastage` |
| F | Estimated Cost | parsed from description (regex) |

### Write pattern

Wastage descriptions often contain multiple items separated by newlines or commas. The write code splits the narrative and writes one row per item:

```javascript
function logToWastageComps_(shiftData) {
  if (!shiftData.wastage || shiftData.wastage === 'None') return { written: 0 };

  const items = shiftData.wastage
    .split(/[\n,]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const weekEnding = computeWeekEnding_(shiftData.date);
  const rows = items.map(item => [
    toDateOnly_(shiftData.date),
    shiftData.dayOfWeek,
    toDateOnly_(weekEnding),
    shiftData.MOD,
    item,
    extractCost_(item)
  ]);

  for (const row of rows) {
    if (isDuplicateInSheet_(sheet, [row[0], row[4]], 'WASTAGE_COMPS')) continue;
    sheet.appendRow(row);
  }

  return { written: rows.length };
}
```

---

## 6. QUALITATIVE_LOG Schema (11 Columns, A-K)

For the five narrative fields, one row per service day.

| Column | Header | Source |
|---|---|---|
| A | Date | `toDateOnly_(shiftData.date)` |
| B | Day | `shiftData.dayOfWeek` |
| C | Week Ending | computed |
| D | MOD | `shiftData.MOD` |
| E | Shift Report | `shiftData.generalShiftComments` |
| F | VIPs | `shiftData.vipsNotes` |
| G | Good | `shiftData.goodHighlights` |
| H | Bad | `shiftData.badHighlights` |
| I | Kitchen | `shiftData.kitchenNotes` |
| J | Task Count | `shiftData.todos.length` |
| K | Logged At | `new Date()` |

**Sheet name alias note:** historical code and docs sometimes call this sheet `QUALITATIVE_NOTES` rather than `QUALITATIVE_LOG`. The canonical name in current code is `QUALITATIVE_LOG`. If a deployment created the sheet under the alternative name, rename it before writes resume.

---

## 7. Duplicate Prevention

All four sheets use a shared helper for duplicate detection:

```javascript
function isDuplicateInSheet_(sheet, key, sheetName) {
  const allData = sheet.getDataRange().getValues();
  const composite = Array.isArray(key) ? key.join('|') : key;

  // Each sheet has its own duplicate key columns:
  const keyCols = {
    NIGHTLY_FINANCIAL: [0],            // Date only
    OPERATIONAL_EVENTS: [0, 4, 5],     // Date + Event Type + Description
    WASTAGE_COMPS: [0, 4],             // Date + Description
    QUALITATIVE_LOG: [0]               // Date only
  };

  const cols = keyCols[sheetName] || [0];
  for (let i = 1; i < allData.length; i++) {
    const row = allData[i];
    const rowKey = cols.map(c => row[c]).join('|');
    if (rowKey === composite) return true;
  }
  return false;
}
```

The composite key strategy lets us re-run a write idempotently without creating duplicates. This is what makes the Monday 2am backfill safe to re-run.

---

## 8. Date Handling, `toDateOnly_(d)` and `parseCellDate_(v)`

The Australia locale fix on April 2, 2026 set the spreadsheet to `Australia/Sydney` and dd/mm/yyyy parsing. Two helpers enforce this:

### `parseCellDate_(value)`

Used when reading raw cell values that might be Date objects, strings, or numbers:

```javascript
function parseCellDate_(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    // Excel/Sheets serial date
    return new Date((value - 25569) * 86400 * 1000);
  }
  if (typeof value === 'string') {
    // Try dd/mm/yyyy first
    const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
    }
    // Last resort, throw rather than use US default
    const fallback = new Date('');  // intentionally invalid
    Logger.log(`parseCellDate_: ambiguous date string ${value}, manual review needed`);
    return fallback;
  }
  throw new Error(`Cannot parse date: ${typeof value} ${value}`);
}
```

Note the deliberate `new Date('')` (invalid) fallback. Earlier code used `new Date(str)` which would parse US format and silently mis-interpret dd/mm dates. The new behaviour is to fail loud rather than write a wrong date.

### `toDateOnly_(d)`

Used immediately before any warehouse appendRow to strip time components:

```javascript
function toDateOnly_(d) {
  if (!d || isNaN(d.getTime())) {
    Logger.log('toDateOnly_: invalid date input');
    return null;
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
```

Without this, a Date object with a time component (`2026-04-01 19:00:00`) writes the time too, and downstream analytics sometimes interpret the date wrong (April 1 19:00 → "Sunday" because Sunday in some timezones starts at 21:00 the previous day).

**Every** `appendRow` in `logToDataWarehouse_` wraps date values with `toDateOnly_`. Forgetting this is the most common cause of off-by-one-day errors in the warehouse.

---

## 9. Backfill Flow

`runWeeklyBackfill_()` runs Monday at 2am. It re-pushes any night's data that did not land in the warehouse during the original send.

```javascript
function runWeeklyBackfill_() {
  const shiftReportId = getProp_('WARATAH_SHIFT_REPORT_CURRENT_ID');
  const shiftReport = SpreadsheetApp.openById(shiftReportId);

  const dayTabs = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  for (const tabName of dayTabs) {
    const sheet = shiftReport.getSheetByName(tabName);
    const shiftData = extractShiftData_(sheet);

    if (!shiftData.date || !shiftData.MOD) {
      Logger.log(`Skipping ${tabName}: no data`);
      continue;
    }

    try {
      logToDataWarehouse_(shiftData);
      Logger.log(`Backfilled ${tabName}: ${shiftData.date}`);
    } catch (e) {
      Logger.log(`Backfill error for ${tabName}: ${e.message}`);
    }
  }
}
```

The duplicate prevention in `logToDataWarehouse_` is what makes this safe to re-run. Nights already in the warehouse are skipped silently; only missing rows are written.

The Mon 2am timing is before the rollover (Mon 9pm) so the spreadsheet still contains last week's data when backfill runs.

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
