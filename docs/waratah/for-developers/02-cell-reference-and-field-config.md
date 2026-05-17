# Cell Reference and FIELD_CONFIG

**Audience:** Developers and Claude AI agents modifying sheet layout, named ranges, FIELD_CONFIG, or any code that reads or writes shift report fields.

This file is the canonical cell reference. The source of truth is `FIELD_CONFIG` in `RunWaratah.js` plus the named ranges defined on each day tab. Documentation always defers to code.

---

## 1. Phase 1.3 Status (May 17, 2026)

- **36 fields** in FIELD_CONFIG
- **197 named ranges** active across the 5 day tabs (Wed-Sun)
- **Named ranges are authoritative**; the `fallbackCell` column in FIELD_CONFIG exists for documentation only. Helpers throw if a named range is missing.
- The named range naming convention is `{DAY}_SR_{Suffix}` (for example `WEDNESDAY_SR_NetRevenue`, `SUNDAY_SR_CashTips`).
- Each day tab has 36 fields; 36 × 5 = 180 base ranges, plus 17 multi-row ranges for till entries, card expense lines, and TO-DO rows = 197 total.

## 2. The Sheet Layout

The Waratah shift report spreadsheet has these tabs:

| Tab | Purpose |
|---|---|
| Read Me | Manager instructions, static |
| Monday | Empty placeholder (closed day) |
| Tuesday | Empty placeholder (closed day) |
| Wednesday | Service day, manager input + formula |
| Thursday | Service day |
| Friday | Service day |
| Saturday | Service day |
| Sunday | Service day |
| Task Management | Cross-tab navigation to TM spreadsheet |
| Analytics | ANALYTICS dashboard (read-only) |
| Executive Dashboard | Executive view (read-only) |

The active service days are **Wednesday through Sunday**. Monday and Tuesday tabs exist for symmetry with Sakura but receive no input.

Within each day tab the layout is row-based with the following row groups (approximate):

- Rows 1-3: Date and MOD/Staff header
- Rows 5-15: Cash till counts (Public and Terrace, two columns each)
- Rows 16-32: Financial fields (production, expenses, tips, calculated revenue)
- Rows 41-52: Five narrative fields (merged A:F, odd rows hold values)
- Rows 53-68: 16 TO-DO rows (column A description, column D assignee)
- Rows 63-67: Three incident fields (wastage, maintenance, RSA)

Specific cell addresses are intentionally omitted from this file. The named ranges (`WEDNESDAY_SR_NetRevenue` etc.) abstract them. Anyone reading code who needs an exact cell can derive it via `getFieldRange('netRevenue', 'Wednesday').getA1Notation()`.

---

## 3. Named Range Convention and Helpers

### Convention

Every field has a named range per day, formatted `{DAY_UPPERCASE}_SR_{FieldName}`:

```
WEDNESDAY_SR_Date
WEDNESDAY_SR_MOD
WEDNESDAY_SR_NetRevenue
THURSDAY_SR_NetRevenue
...
SUNDAY_SR_KitchenNotes
```

Multi-row ranges (till entries, card expense lines, TO-DO rows) have the day prefix and a base name:

```
WEDNESDAY_SR_PublicTillCounts (range covers all rows for that till)
WEDNESDAY_SR_CardExpenses (range covers all 6 expense rows)
WEDNESDAY_SR_TodoDescriptions (range covers 16 rows)
WEDNESDAY_SR_TodoAssignees (range covers 16 rows)
```

### Helpers in `RunWaratah.js`

| Helper | Returns | Behaviour on missing range |
|---|---|---|
| `getFieldRange(fieldKey, sheetName)` | Google Apps Script `Range` object | Throws `Error("Named range not found...")` |
| `getFieldValue(fieldKey, sheetName)` | Cell value (string, number, Date) | Throws if range missing |
| `getFieldValues(fieldKey, sheetName)` | `Object[][]` (for multi-row ranges) | Throws if range missing |
| `setFieldValue(fieldKey, sheetName, value)` | void | Throws if range missing or value type mismatch |
| `getClearableFieldKeys_()` | `string[]` | Returns all `fieldKey` where `isFormula === false` |
| `verifyWaratahNamedRanges_()` | `{OK: N, MISSING: M, WRONG: W}` | Walks FIELD_CONFIG, reports binding health |

### Why throw on missing

In Phase 1.3 the codebase moved away from silent fallback to hardcoded cells. The rationale: if a named range goes missing or is bound to the wrong sheet, downstream code would silently read from the wrong cell. Throwing immediately surfaces the configuration drift.

The `fallbackCell` column in FIELD_CONFIG documents what the cell *was* in the pre-named-range era; it is not consulted at runtime.

---

## 4. Setup Bug, Wrong-Sheet Binding (Known Issue)

When `SetupWaratah.js` runs to create all 197 named ranges, there is a known issue where a recently-renamed sheet can cause the bind step to attach the range to the wrong sheet. Symptoms:

- `getFieldValue('netRevenue', 'Wednesday')` returns Thursday's value.
- `verifyWaratahNamedRanges_()` reports `WRONG: N` for several fields.

**Procedure to fix:**

1. Confirm all day tabs have the expected names (Wednesday, Thursday, Friday, Saturday, Sunday). No trailing spaces. No renames.
2. Run **Admin Tools > Diagnose Named Ranges** to see exactly which ranges are mis-bound.
3. For each affected day tab, run **Admin Tools > Recreate Named Ranges on Active Sheet** (after navigating to that day).
4. Re-run `verifyWaratahNamedRanges_()` and confirm `OK: 197, MISSING: 0, WRONG: 0`.

Do not manually edit named range bindings via Data > Named ranges. The setup script handles all 197 in one pass; manual edits are easy to get wrong and very hard to audit.

---

## 5. FIELD_CONFIG Structure

`FIELD_CONFIG` in `RunWaratah.js` is a plain object keyed by camelCase field name. Each entry has:

```javascript
const FIELD_CONFIG = {
  date: {
    namedRangeSuffix: 'Date',
    fallbackCell: 'B2',
    isFormula: false,
    description: 'The service date for this tab (auto-set by rollover)'
  },
  netRevenue: {
    namedRangeSuffix: 'NetRevenue',
    fallbackCell: 'B54',
    isFormula: true,
    description: 'Calculated net revenue after deductions'
  },
  // ... 34 more entries
};
```

The named range for the active day's field is computed as: `<UPPER_DAY>_SR_<namedRangeSuffix>`.

### isFormula flag

Roughly 12 of the 36 fields are formula cells (calculated, not entered):

- `cashCounted` (sum of till counts)
- `cashTakings` (computed cash result)
- `cashRecorded` (POS expected cash)
- `cashVariance` (difference)
- `totalTips` (card + cash tips)
- `cashTakeDisplay`, `grossSales`, `discountsExcCash`, `grossSalesLessDisc`, `taxes`, `netRevenue`, `runningTotals`

These are **never cleared** by the rollover. `getClearableFieldKeys_()` derives the safe clear list by filtering `isFormula === false`.

The remaining 24 fields are manager input cells (cash counts, expense lines, narratives, TO-DOs, incidents) and are cleared on rollover.

### Field categories

| Category | Field keys (examples) | Count |
|---|---|---|
| Header | `date`, `dayOfWeek`, `MOD`, `staff` | 4 |
| Cash tills | `publicTillCounts`, `terraceTillCounts`, `publicRefloat`, `terraceRefloat`, `cashCounted`, `cashTakings`, `cashRecorded`, `cashVariance`, `cashTakeDisplay` | 9 |
| Financial inputs | `production`, `functionDeposit`, `cardExpenses`, `cashReturns`, `cdDiscount`, `cardTips`, `cashTips` | 7 |
| Calculated fields | `totalTips`, `grossSales`, `discountsExcCash`, `grossSalesLessDisc`, `taxes`, `netRevenue`, `runningTotals` | 7 |
| Narratives | `generalShiftComments`, `vipsNotes`, `goodHighlights`, `badHighlights`, `kitchenNotes` | 5 |
| Tasks | `todoDescriptions`, `todoAssignees` (multi-row) | 2 |
| Incidents | `wastageNotes`, `maintenanceNotes`, `rsaIncidents` | 3 |
| **Total** | | **37 entries listed; the canonical count is 36 (one entry is a multi-row alias not counted separately)** |

For the exact authoritative list, the source is the in-code FIELD_CONFIG object. Run:

```bash
grep -A 1 "FIELD_CONFIG = {" "THE WARATAH/SHIFT REPORT SCRIPTS/RunWaratah.js" | head -200
```

---

## 6. Rollover Clearable Fields

The rollover clears manager input cells without touching formulas. The mechanism:

```javascript
function getClearableFieldKeys_() {
  return Object.keys(FIELD_CONFIG).filter(
    key => FIELD_CONFIG[key].isFormula === false
  );
}
```

The rollover iterates this list for each day tab, calling `Range.clearContent()` on each named range. Formula cells, label cells, and the Read Me / Task Management / Analytics tabs are untouched.

**Critical:** never hard-code a clearable list. The FIELD_CONFIG entry is the single source of truth. If a new field is added with `isFormula: false`, it joins the clearable list automatically. If a field is changed to `isFormula: true`, it leaves the list automatically.

---

## 7. Merged Cell Reading Rule

The five narrative fields are merged across columns A:F. The merge body is one cell visually; the underlying spreadsheet model holds the value in column A.

When reading:

```javascript
// Correct
const value = getFieldValue('generalShiftComments', 'Wednesday');
// Returns the A-column value of the merge.

// Incorrect (would return undefined for the other 5 cells)
const range = sheet.getRange('A43:F43');
const allValues = range.getValues(); // [ [text, '', '', '', '', ''] ]
```

When clearing:

```javascript
// Correct
const range = getFieldRange('generalShiftComments', 'Wednesday');
range.clearContent();
// Clears the A-column value; the merge stays intact.

// Also correct (gets the same range)
sheet.getRangeByName('WEDNESDAY_SR_GeneralShiftComments').clearContent();
```

The merged cells survive clear operations because we use `clearContent()` (singular, on Range), which clears values only and leaves merge structure intact.

---

## 8. Sheet Protection Model

The shift report spreadsheet uses Google Sheets' built-in protection to prevent accidental edits to formula cells. The setup is:

1. **Protected ranges:** all formula cells (12 fields per day × 5 days = 60 ranges) plus label cells and the Read Me tab.
2. **Editable carve-outs:** all manager input cells, narratives, tasks, incidents.
3. **Warning mode:** the protection raises a "you are editing a protected range" warning but does not block the edit. Set to warning rather than restrict so admin operators (with the script owner email) can override.
4. **Owner override:** the optional Script Property `SHEET_PROTECTION_OWNER_EMAIL` names the only email that bypasses warnings. If unset, the script owner is used.

Setup is via `RunWaratah.js` `setupSheetProtections_()`, callable from the admin menu.

If protections become out of sync after a sheet edit, run **Admin Tools > Reset Sheet Protections** to rebuild from FIELD_CONFIG.

---

## 9. Integration Hub Batch Read Pattern

When reading every field on a day tab (during nightly send), the system uses batch ranges rather than 36 separate `getValue()` calls. The batch ranges are defined in `IntegrationHubWaratah.js`:

```javascript
const BATCH_RANGES_BY_SHEET = {
  // For sheet 'Wednesday':
  Wednesday: {
    header: 'WEDNESDAY_SR_HeaderBlock',          // A1:F3
    financial: 'WEDNESDAY_SR_FinancialBlock',    // B5:D32
    narrative: 'WEDNESDAY_SR_NarrativeBlock',    // A41:F52
    todos: 'WEDNESDAY_SR_TodoBlock'              // A53:D68
  },
  // ... same shape for Thursday through Sunday
};
```

This reduces the network calls from ~36 to 4 per day tab, dramatically improving send latency. Code that needs a single field still uses `getFieldValue(fieldKey, sheetName)`; the batch pattern is only for the integration hub's extraction step.

---

## 10. Quick Lookup Table (Field-by-Cell)

For a printable reference: every field, the named range suffix it uses, whether it is a formula, and whether it is warehoused.

| Field key | Named range suffix | isFormula | Warehoused? |
|---|---|---|---|
| `date` | Date | No | Yes (NIGHTLY_FINANCIAL A) |
| `dayOfWeek` | DayOfWeek | No | Yes (NIGHTLY_FINANCIAL B) |
| `MOD` | MOD | No | Yes (NIGHTLY_FINANCIAL D) |
| `staff` | Staff | No | Yes (NIGHTLY_FINANCIAL E) |
| `publicTillCounts` | PublicTillCounts | No | No (cash recon only) |
| `terraceTillCounts` | TerraceTillCounts | No | No (cash recon only) |
| `publicRefloat` | PublicRefloat | No | No |
| `terraceRefloat` | TerraceRefloat | No | No |
| `cashCounted` | CashCounted | Yes | Yes (NIGHTLY_FINANCIAL H) |
| `cashTakings` | CashTakings | Yes | Yes (NIGHTLY_FINANCIAL X) |
| `cashRecorded` | CashRecorded | Yes | No |
| `cashVariance` | CashVariance | Yes | Yes (NIGHTLY_FINANCIAL Y) |
| `production` | Production | No | Yes (NIGHTLY_FINANCIAL G) |
| `functionDeposit` | FunctionDeposit | No | No |
| `cardExpenses` | CardExpenses (multi-row) | No | No (aggregated) |
| `cashReturns` | CashReturns | No | Yes (NIGHTLY_FINANCIAL J) |
| `cdDiscount` | CDDiscount | No | Yes (NIGHTLY_FINANCIAL K) |
| `cardTips` | CardTips | No | Yes (NIGHTLY_FINANCIAL S) |
| `cashTips` | CashTips | No | Yes (NIGHTLY_FINANCIAL T) |
| `totalTips` | TotalTips | Yes | Yes (NIGHTLY_FINANCIAL U) |
| `grossSales` | GrossSales | Yes | Yes (NIGHTLY_FINANCIAL I) |
| `discountsExcCash` | DiscountsExcCash | Yes | Yes (NIGHTLY_FINANCIAL N) |
| `grossSalesLessDisc` | GrossSalesLessDisc | Yes | Yes (NIGHTLY_FINANCIAL P) |
| `taxes` | Taxes | Yes | Yes (NIGHTLY_FINANCIAL Q) |
| `netRevenue` | NetRevenue | Yes | Yes (NIGHTLY_FINANCIAL F) |
| `runningTotals` | RunningTotals (multi-row) | Yes | No |
| `generalShiftComments` | GeneralShiftComments | No | Yes (QUALITATIVE_LOG) |
| `vipsNotes` | VipsNotes | No | Yes (QUALITATIVE_LOG) |
| `goodHighlights` | GoodHighlights | No | Yes (QUALITATIVE_LOG) |
| `badHighlights` | BadHighlights | No | Yes (QUALITATIVE_LOG) |
| `kitchenNotes` | KitchenNotes | No | Yes (QUALITATIVE_LOG) |
| `todoDescriptions` | TodoDescriptions (multi-row) | No | Task Management only |
| `todoAssignees` | TodoAssignees (multi-row) | No | Task Management only |
| `wastageNotes` | WastageNotes | No | Yes (WASTAGE_COMPS) |
| `maintenanceNotes` | MaintenanceNotes | No | Yes (OPERATIONAL_EVENTS) |
| `rsaIncidents` | RsaIncidents | No | Yes (OPERATIONAL_EVENTS) |

See [`04-warehouse-schemas.md`](04-warehouse-schemas.md) for the exact NIGHTLY_FINANCIAL column letters (A-Y) and the schemas for other warehouse sheets.

---

## 11. Comparison with Sakura

Sakura's cell map at [`/docs/sakura/CELL_REFERENCE_MAP_SAKURA.md`](../../sakura/CELL_REFERENCE_MAP_SAKURA.md) uses the same `{DAY}_SR_{Suffix}` convention. The differences are:

| Difference | Sakura | Waratah |
|---|---|---|
| Service days | 6 (Mon-Sat) | 5 (Wed-Sun) |
| Number of fields | ~32 | 36 |
| Cash recon columns | Not in warehouse | W, X, Y (added May 17) |
| Named range hard-fail | Yes (helpers throw) | Yes (helpers throw) |
| Fallback cells | Documentation only | Documentation only |
| Multi-row ranges | 12 | 17 |
| Total named ranges | ~210 | 197 |

Waratah's 36 fields exceed Sakura's because Waratah captures more cash reconciliation detail. The two systems share the `FIELD_CONFIG` pattern but each maintains its own constant object in its own `RunVenue.js` file.
