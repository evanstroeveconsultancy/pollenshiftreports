# Warehouse Schemas

**Audience:** Developers writing, backfilling, or schema-evolving the central data warehouse spreadsheet for Sakura House.

The warehouse is a separate Google Sheets spreadsheet identified by the `SAKURA_DATA_WAREHOUSE_ID` Script Property (`IntegrationHubSakura.gs:25`). It has four primary tabs plus one auto-created AI log: `NIGHTLY_FINANCIAL`, `OPERATIONAL_EVENTS`, `WASTAGE_COMPS`, `QUALITATIVE_LOG`, and `AI_INSIGHTS_LOG`. Each tab has a fixed schema enforced at write time inside `logToDataWarehouse_` in `IntegrationHubSakura.gs`.

---

## 1. Spreadsheet Layout

| Tab | Purpose | Write cadence |
|---|---|---|
| `NIGHTLY_FINANCIAL` | One row per service day with all financial numbers | Once per nightly send |
| `OPERATIONAL_EVENTS` | One row per TO-DO captured on the shift report | Per-todo batch on send |
| `WASTAGE_COMPS` | One row per service day holding the wastage/comps narrative | Once per nightly send |
| `QUALITATIVE_LOG` | One row per service day with the narrative fields | Once per nightly send |
| `AI_INSIGHTS_LOG` | Auto-created on first AI insight write; holds shift summaries and anomaly output | Once per AI insight delivery |

The warehouse is opened by ID, not by name. The script owner must have edit access. If permissions are revoked, the entire write step fails with a `You do not have permission` error.

**Sheet name note:** the qualitative sheet is named `QUALITATIVE_LOG` in code. Some older docs called it `QUALITATIVE_NOTES`. That is incorrect. Use `QUALITATIVE_LOG`.

---

## 2. NIGHTLY_FINANCIAL Schema (16 Columns, A-P)

Unlike the Waratah equivalent, the Sakura write block does **not** assert a header row size before writing. There is no `actualCols !== 16` check. The schema below is the contract enforced by the `appendRow` call at `IntegrationHubSakura.gs:412-429`.

| Column | Header (per code comment) | Source field | Notes |
|---|---|---|---|
| A | Date | `toDateOnly_(shiftData.date)` | Date at midnight Sydney, no time component |
| B | Day | `shiftData.dayOfWeek` | String, e.g. "MONDAY" |
| C | Week Ending | `toDateOnly_(shiftData.weekEnding)` | Date at midnight Sydney |
| D | MOD | `shiftData.mod` | Manager on Duty name |
| E | Net Revenue | `shiftData.netRevenue` | B54 formula value |
| F | Cash Total | `shiftData.cashTotal` | from C19 |
| G | Cash Tips | `shiftData.cashTips` | C29 |
| H | Tips Total | `shiftData.tipsTotal` | C32 (formula) |
| I | Logged At | `new Date()` | Server timestamp |
| J | Production Amount | `shiftData.productionAmount` | B37 |
| K | Discounts | `shiftData.discounts` | B50 |
| L | Deposit | `shiftData.deposit` | B38 |
| M | FOH Staff | `shiftData.fohStaff` | B6 |
| N | BOH Staff | `shiftData.bohStaff` | B7 |
| O | Card Tips | `shiftData.cardTips` | C30 |
| P | Surcharge Tips | `shiftData.surchargeTips` | C31 |

The Sakura schema is **16 columns**. There is no `staff` concatenation column (FOH and BOH are separate cols M and N). There are no cash reconciliation columns (CashCounted, ExpectedCash, CashVariance) that the Waratah schema gained on May 17, 2026.

### Comparison with Waratah

Sakura `NIGHTLY_FINANCIAL` is 16 columns A-P. Waratah `NIGHTLY_FINANCIAL` is 25 columns A-Y, asserted at `IntegrationHubWaratah.js:484-498`. The two schemas differ structurally:

- Waratah has a combined `Staff` column (E) holding both FOH and BOH as one string. Sakura splits them into separate columns M and N.
- Waratah carries three deprecated `null` literal columns (L, M, R) retained for backward column-position compatibility. Sakura has no deprecated columns.
- Waratah added cash reconciliation columns (V CashCounted, W ExpectedCash, X CashVariance) on May 17, 2026. Sakura does not have these. The Sakura cash recon flow has not been wired into the warehouse at the time of writing.
- Waratah moved `LoggedAt` from V to Y at the May 17 cutover. Sakura keeps `Logged At` at column I and has not moved.

When writing cross-venue analytics, treat the two schemas as separate inputs. A query that joins on column letter alone will produce wrong results.

---

## 3. NIGHTLY_FINANCIAL Write Code

The write is in `IntegrationHubSakura.gs` inside `logToDataWarehouse_(shiftData, config, skipLock)`. The exact `appendRow` block (`IntegrationHubSakura.gs:412-429`):

```javascript
financialSheet.appendRow([
  toDateOnly_(shiftData.date),       // A: Date
  shiftData.dayOfWeek,               // B: Day
  toDateOnly_(shiftData.weekEnding), // C: Week Ending
  shiftData.mod,                     // D: MOD
  shiftData.netRevenue,              // E: Net Revenue
  shiftData.cashTotal,               // F: Cash Total (C19)
  shiftData.cashTips,                // G: Cash Tips (C29)
  shiftData.tipsTotal,               // H: Tips Total (C32)
  new Date(),                        // I: Logged At
  shiftData.productionAmount,        // J: Production Amount
  shiftData.discounts,               // K: Discounts
  shiftData.deposit,                 // L: Deposit
  shiftData.fohStaff,                // M: FOH Staff
  shiftData.bohStaff,                // N: BOH Staff
  shiftData.cardTips,                // O: Card Tips
  shiftData.surchargeTips            // P: Surcharge Tips
]);
```

There is no header column-count assertion before this write. If the warehouse header row drifts from the code, writes silently land in the wrong columns. Reviewers should verify the header row matches this schema before any warehouse maintenance.

---

## 4. OPERATIONAL_EVENTS Schema (9 Columns, A-I)

OPERATIONAL_EVENTS is the **TO-DOs log**. Rows come from `shiftData.todos` (the TO-DOs list captured on the shift report). One row per TO-DO.

| Column | Header | Source |
|---|---|---|
| A | Date | `toDateOnly_(shiftData.date)` |
| B | Type | literal `"New"` |
| C | Item | `todo.description` |
| D | Quantity | literal `""` (unknown) |
| E | Value | literal `"MEDIUM"` (default priority) |
| F | Staff | `todo.assignee` |
| G | Reason | literal `""` (unknown) |
| H | Category | literal `"TO-DO"` |
| I | Source | literal `"Shift Report"` |

### Write code

Inline inside `logToDataWarehouse_` (`IntegrationHubSakura.gs:448-458`), iterating `shiftData.todos`:

```javascript
eventsSheet.appendRow([
  toDateOnly_(shiftData.date),     // A: Date
  "New",                           // B: Type
  todo.description,                // C: Item
  "",                              // D: Quantity (unknown)
  "MEDIUM",                        // E: Value (default priority)
  todo.assignee,                   // F: Staff
  "",                              // G: Reason (unknown)
  "TO-DO",                         // H: Category
  "Shift Report"                   // I: Source
]);
```

The Sakura schema differs from Waratah here too: Sakura has 9 columns including `Type`, `Quantity`, `Reason`, `Category`, and `Source` literals. Waratah has 8 columns and lacks the `Type`/`Quantity`/`Reason`/`Category` structure.

Duplicate prevention iterates per-todo and skips identical Date + Item rows.

---

## 5. WASTAGE_COMPS Schema (5 Columns, A-E)

One row per service day. The full wastage/comps narrative is written as a single string in column E. No per-item splitting, no cost regex.

| Column | Header | Source |
|---|---|---|
| A | Date | `toDateOnly_(shiftData.date)` |
| B | Day | `shiftData.dayOfWeek` |
| C | Week Ending | `toDateOnly_(shiftData.weekEnding)` |
| D | MOD | `shiftData.mod` |
| E | COMMENTS | `shiftData.wastageComps` (full narrative as one string) |

### Write pattern

Single-row append per shift (`IntegrationHubSakura.gs:473-479`):

```javascript
wastageSheet.appendRow([
  toDateOnly_(shiftData.date),       // A: Date
  shiftData.dayOfWeek,               // B: Day
  toDateOnly_(shiftData.weekEnding), // C: Week Ending
  shiftData.mod,                     // D: MOD
  shiftData.wastageComps             // E: COMMENTS
]);
```

The Sakura WASTAGE_COMPS schema has **no `Logged At` column**, unlike the Waratah equivalent which has 6 columns A-F with `Logged At` at F.

---

## 6. QUALITATIVE_LOG Schema (11 Columns, A-K)

One row per service day. There is no Week Ending column in this sheet (unlike NIGHTLY_FINANCIAL and WASTAGE_COMPS). MOD lives at col C; narrative fields run D-J; Logged At at K.

| Column | Header | Source |
|---|---|---|
| A | Date | `toDateOnly_(shiftData.date)` |
| B | Day | `shiftData.dayOfWeek` |
| C | MOD | `shiftData.mod` |
| D | Shift Summary | `shiftData.shiftSummary` |
| E | Guests of Note | `shiftData.guestsOfNote` |
| F | The Good | `shiftData.theGood` |
| G | The Bad / Issues | `shiftData.theBad` |
| H | Kitchen Notes | `shiftData.kitchenNotes` |
| I | Maintenance | `shiftData.maintenance` |
| J | RSA/Incidents | `shiftData.rsaIncidents` |
| K | Logged At | `new Date()` |

**Sheet name note:** the canonical name in current code is `QUALITATIVE_LOG`. Older docs may use `QUALITATIVE_NOTES`. That alias is incorrect. If a deployment created the sheet under the alternative name, rename it before writes resume.

---

## 7. AI_INSIGHTS_LOG

`AI_INSIGHTS_LOG` is auto-created in the warehouse spreadsheet on first write by `logInsightToWarehouse_Sakura()` (`AIInsightsSakura.gs:1037, 1041`). Holds AI-generated shift summaries and anomaly detection output produced by the entry-points in `AIInsightsSakura.gs`.

Because the sheet is created on demand, its schema is set by the first write and should be treated as managed by `AIInsightsSakura.gs` rather than `IntegrationHubSakura.gs`. Consult that file for the current column layout before doing analytics across AI insight rows.

---

## 8. Duplicate Prevention via `isDuplicateInSheet_`

Sakura uses a single deduplicated helper for duplicate detection across all four warehouse writes. It was introduced on April 2, 2026 (F8 cleanup) to replace four separate inline duplicate-check blocks. Signature:

```javascript
isDuplicateInSheet_(sheet, dateKey, modName, dateColIndex, modColIndex)
```

Cited at `IntegrationHubSakura.gs:406` for the NIGHTLY_FINANCIAL check (col 0 Date, col 3 MOD). The same helper is reused for the other three sheets.

Per-sheet duplicate keys:

| Sheet | Key columns | Cited line |
|---|---|---|
| `NIGHTLY_FINANCIAL` | Date (col 0) + MOD (col 3) | `IntegrationHubSakura.gs:406` |
| `OPERATIONAL_EVENTS` | Date (col 0) + Item / description (col 2) | `IntegrationHubSakura.gs:443` |
| `WASTAGE_COMPS` | Date (col 0) + MOD (col 3) | `IntegrationHubSakura.gs:471` |
| `QUALITATIVE_LOG` | Date (col 0) + MOD (col 2) | `IntegrationHubSakura.gs:490` |

Note the column-index shift for `QUALITATIVE_LOG`: MOD is at col 2 (not 3) because there is no Week Ending column in that sheet.

The composite-key strategy lets writes re-run idempotently. Existing rows are detected on each call before any append, so the warehouse never accumulates duplicates from a re-send.

---

## 9. Date Handling via `toDateOnly_(d)`

`toDateOnly_(date)` is the helper that strips the time component from Date objects before warehouse writes. Introduced on April 2, 2026 alongside the Australia locale fix to prevent US-format misparse of AU dd/mm/yyyy dates.

The fix was prompted by an incident where a row landed in the warehouse with date `1/4/2026 19:00:00` (April 1, 2026, 7pm), and analytics then interpreted the timestamp as Sunday because Sunday in some timezone arithmetic starts at 21:00 the previous day. After the fix, all dates are normalised to midnight Sydney before write.

Every `appendRow` in `logToDataWarehouse_` wraps `shiftData.date` and `shiftData.weekEnding` with `toDateOnly_()`. Forgetting this wrap is the most common cause of off-by-one-day errors in the warehouse. Reviewers should flag any new warehouse write that does not wrap its date values.

The companion `parseCellDate_(value)` helper hardens reads of raw cell values: on parse exception it returns `new Date('')` (invalid) rather than `new Date(str)`, which would silently parse US format and corrupt AU-format dates. The intent is to fail loud rather than write a wrong date.

---

## 10. Adding a Column to NIGHTLY_FINANCIAL

To extend the schema (for example, adding a 17th column for a new financial metric):

1. Update the header row in the warehouse spreadsheet first. Add the new column name in column Q.
2. Add the new field to the shift-data extraction so `shiftData` carries the value.
3. Add the new field to the `appendRow` block at `IntegrationHubSakura.gs:412-429` after `shiftData.surchargeTips`.
4. Document the new column in this file's Section 2 table.
5. Consider adding a header column-count assertion (Sakura currently lacks one) to catch future drift.
6. Deploy via `clasp push` from `SAKURA HOUSE/SHIFT REPORT SCRIPTS/`, then verify with a TEST report.

Order matters: header update first, then code. If the warehouse header drifts from the code without an assertion, writes will land in the wrong columns and analytics queries will produce wrong results.

To remove a column, the reverse but more cautious: set future writes to write `null` for that column position (deprecate), keep the column in place, communicate the schema change widely. Never delete a column from a warehouse with historical data.

---

## 11. Operational Notes

- All four warehouse writes are wrapped in a single `LockService` call inside `logToDataWarehouse_`. The lock can be skipped via `skipLock=true` for the backfill path.
- The warehouse writes happen serially. Each `appendRow` is one API call. For high-volume backfill, consider batching via `setValues` over a range.
- The duplicate check via `isDuplicateInSheet_` reads the entire sheet via `getDataRange().getValues()`. For warehouses approaching 10,000+ rows this becomes slow. Cache the date set or maintain a separate index if performance degrades.
- Sakura has no header column-count assertion. This is a known divergence from Waratah. If you add one, ensure it matches the current 16-column NIGHTLY_FINANCIAL schema and the 9/5/11-column schemas for the other three sheets.
