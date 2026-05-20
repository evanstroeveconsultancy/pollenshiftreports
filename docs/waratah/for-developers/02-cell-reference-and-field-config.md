# Cell Reference and FIELD_CONFIG

**Audience:** Developers and Claude AI agents modifying sheet layout, named ranges, FIELD_CONFIG, or any code that reads or writes shift report fields.

This file is the canonical cell reference. The source of truth is `FIELD_CONFIG` in `RunWaratah.js` plus the named ranges defined on each day tab. Documentation always defers to code.

---

## 1. Cutover Status (May 17, 2026)

- **39 fields** in FIELD_CONFIG
- **197 named ranges** active across the day tabs
- **Named ranges are authoritative on day sheets**; the `fallback` attribute on each FIELD_CONFIG entry holds the legacy A1 cell address. Day-sheet helpers throw if a named range is missing; non-day-sheet calls still fall back to the A1 reference.
- The named range naming convention is `{DAY}_SR_{Suffix}` (for example `WEDNESDAY_SR_NetRevenue`, `SUNDAY_SR_CashTips`).
- Ranges by source: 1 all-days field (`date`) bound on all 7 day tabs (MON-SUN) = 7 ranges; 38 service-day-only fields bound on the 5 active day tabs (WED-SUN) = 190 ranges. Total = 197. Multi-row ranges (till blocks, card expense block, TO-DO block, running totals) are each a single named range spanning the row block, already counted within the 38 active-day fields.

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

The active service days are **Wednesday through Sunday**. Monday and Tuesday tabs exist for visual consistency in the spreadsheet UI; only the date named range is created for those tabs (rollover renames them). LIVE export is explicitly blocked from running on Mon or Tue.

Within each day tab the actual cell ranges (per FIELD_CONFIG and SETUP_FIELD_CONFIG) are:

- B3 date (merged B3:F3); B4 MOD; B6 fohStaff; B7 bohStaff
- C10:C17 publicTillCount; D10:D17 publicTillRefloat; E10:E17 terraceTillCount; F10:F17 terraceTillRefloat
- C18 cashCounted; C19 cashTake; C22 cashReturns; C23 cdDiscount; C24 totalCashRecorded; C26 cashVariance
- C29 cashTips; C30 cardTips; C31 surchargeTips; C32 totalTips
- B37 productionAmount; B38 deposit; B40:B45 cardExpenses
- B47 cashTakeDisplay; B48 grossSales; B49 totalAdjustmentsDiscounts; B51 discountsExcCashDiscount; B52 grossSalesLessDiscounts; B53 taxes; B54 netRevenue; D37:D54 runningTotals
- Narratives (merged column A): A59 generalShiftComments; A61 guestsOfNote; A63 theGood; A65 theBad; A67 kitchenNotes
- A69:A84 todoTasks; D69:D84 todoAssignees (16 rows)
- A86 wastageComps; A88 maintenanceIssues; A90 rsaIncidents

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
WEDNESDAY_SR_PublicTillCount (range covers all rows for that till)
WEDNESDAY_SR_PublicTillRefloat
WEDNESDAY_SR_TerraceTillCount
WEDNESDAY_SR_TerraceTillRefloat
WEDNESDAY_SR_CardExpenses (range covers all 6 expense rows)
WEDNESDAY_SR_TodoTasks (range covers 16 rows)
WEDNESDAY_SR_TodoAssignees (range covers 16 rows)
```

### Helpers in `RunWaratah.js`

| Helper | Returns | Behaviour on missing range |
|---|---|---|
| `getFieldRange(sheet, fieldKey)` | Google Apps Script `Range` object | Throws on day sheets; falls back to A1 reference on non-day sheets |
| `getFieldValue(sheet, fieldKey)` | Cell value (string, number, Date) | Same fallback semantics as `getFieldRange` |
| `getFieldDisplayValue(sheet, fieldKey)` | Display string | Same fallback semantics |
| `getFieldValues(sheet, fieldKey)` | `Object[][]` (for multi-row ranges) | Same fallback semantics |
| `getClearableFieldKeys_()` | `string[]` | Returns all `fieldKey` where `isFormula === false` |
| `verifyWaratahNamedRanges_()` | `{ ok, missing, wrong, unexpected }` | Walks FIELD_CONFIG, reports binding health |

There is no `setFieldValue` helper. Code that writes to a cell does so directly against a `Range` returned by `getFieldRange`, or uses `sheet.getRange(a1)` for non-FIELD_CONFIG cells.

### Why throw on missing (day sheets)

The codebase moved away from silent fallback to hardcoded cells for day-sheet access. The rationale: if a named range goes missing or is bound to the wrong sheet, downstream code would silently read from the wrong cell. Throwing immediately surfaces the configuration drift.

The `fallback` attribute on each FIELD_CONFIG entry is still consulted when a helper is called against a non-day sheet (no day prefix to apply); this lets non-day utilities reuse the same FIELD_CONFIG without erroring.

---

## 4. Setup Bug, Wrong-Sheet Binding (Known Issue)

When `SetupWaratah.js` runs to create all 197 named ranges, there is a known issue where a recently-renamed sheet can cause the bind step to attach the range to the wrong sheet. Symptoms:

- `getFieldValue('netRevenue', 'Wednesday')` returns Thursday's value.
- `verifyWaratahNamedRanges_()` reports `WRONG: N` for several fields.

**Procedure to fix:**

1. Confirm all day tabs have the expected names (Wednesday, Thursday, Friday, Saturday, Sunday). No trailing spaces. No renames.
2. Run **Admin Tools > Setup & Utilities > Named Ranges > Diagnose Active Sheet** to see exactly which ranges are mis-bound.
3. For each affected day tab, run **Admin Tools > Setup & Utilities > Named Ranges > Create on Active Sheet** (after navigating to that day).
4. Re-run `verifyWaratahNamedRanges_()` and confirm `{ ok: 197, missing: 0, wrong: 0, unexpected: 0 }`.

Do not manually edit named range bindings via Data > Named ranges. The setup script handles all 197 in one pass; manual edits are easy to get wrong and very hard to audit.

---

## 5. FIELD_CONFIG Structure

`FIELD_CONFIG` in `RunWaratah.js` is a plain object keyed by camelCase field name. Each entry has:

```javascript
const FIELD_CONFIG = {
  date: {
    suffix: 'SR_Date',
    fallback: 'B3:F3',
    isFormula: false,
    description: 'Report date (merged B3:F3)'
  },
  netRevenue: {
    suffix: 'SR_NetRevenue',
    fallback: 'B54',
    isFormula: true,
    description: 'Net revenue (formula at B54)'
  },
  // ... 37 more entries
};
```

The named range for a day's field is `${UPPER_DAY}_${suffix}` (the `SR_` prefix is part of the suffix value itself, so the final form is `WEDNESDAY_SR_NetRevenue`).

### isFormula flag

12 of the 39 fields are formula cells (calculated, not entered):

- `cashCounted` (C18)
- `cashTake` (C19)
- `totalCashRecorded` (C24)
- `cashVariance` (C26)
- `totalTips` (C32)
- `cashTakeDisplay` (B47)
- `grossSales` (B48)
- `discountsExcCashDiscount` (B51)
- `grossSalesLessDiscounts` (B52)
- `taxes` (B53)
- `netRevenue` (B54)
- `runningTotals` (D37:D54)

These are **never cleared** by the rollover. `getClearableFieldKeys_()` derives the safe clear list by filtering `isFormula === false`.

The remaining 27 fields are manager input cells (cash counts, expense lines, narratives, TO-DOs, incidents) and are cleared on rollover.

### Field categories

| Category | Field keys | Count |
|---|---|---|
| Header | `date`, `mod`, `fohStaff`, `bohStaff` | 4 |
| Cash tills | `publicTillCount`, `publicTillRefloat`, `terraceTillCount`, `terraceTillRefloat` | 4 |
| Cash reconciliation | `cashCounted`, `cashTake`, `cashReturns`, `cdDiscount`, `totalCashRecorded`, `cashVariance` | 6 |
| Tips | `cashTips`, `cardTips`, `surchargeTips`, `totalTips` | 4 |
| Revenue / Production | `productionAmount`, `deposit`, `cardExpenses` | 3 |
| Financial calculations | `cashTakeDisplay`, `grossSales`, `totalAdjustmentsDiscounts`, `discountsExcCashDiscount`, `grossSalesLessDiscounts`, `taxes`, `netRevenue`, `runningTotals` | 8 |
| Narratives | `generalShiftComments`, `guestsOfNote`, `theGood`, `theBad`, `kitchenNotes` | 5 |
| Tasks | `todoTasks`, `todoAssignees` (multi-row) | 2 |
| Incidents | `wastageComps`, `maintenanceIssues`, `rsaIncidents` | 3 |
| **Total** | | **39** |

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

The five narrative fields are visually merged across columns A:F. The named range itself binds to column A only (e.g. `A59`, `A61`, `A63`, `A65`, `A67`); the visual merge is sheet formatting, not part of the named range. The underlying spreadsheet model holds the value in column A.

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

The shift report spreadsheet uses Google Sheets' built-in protection to prevent accidental edits. The setup (`setupSheetProtection_` in `RunWaratah.js`) is:

1. **Whole-sheet protection** is applied to each WED-SUN tab.
2. **Editable carve-outs** are derived from `getClearableFieldKeys_()` (the 27 input fields).
3. **Restricted editing**, not warning mode: the protection adds an editor and removes all other editors. The active editor is the value of the optional `SHEET_PROTECTION_OWNER_EMAIL` Script Property, falling back to the effective user.

If protections become out of sync, run **Admin Tools > Setup & Utilities > Sheet Protection > Remove Protection (All Sheets)**, then **Apply Protection (All Sheets)** to rebuild.

---

## 9. Integration Hub Batch Read Pattern

When reading every field on a day tab during nightly send, `extractShiftData_` in `IntegrationHubWaratah.js` uses direct A1 batch ranges rather than 39 separate `getValue()` calls. The actual batches are:

- `sheet.getRange("B3:F54").getValues()`: financial block
- `sheet.getRange("B3:B7").getDisplayValues()`: header display values
- `sheet.getRange("A59:A90").getValues()`: narrative and incident fields
- `sheet.getRange("A69:D84").getValues()`. TO-DO descriptions and assignees

These batches are read once per call; field-level accessors `fin`, `finNum`, `finC`, `finC_Num`, and `narr` extract individual values from the cached arrays. Code that needs a single field outside of the integration pipeline still uses `getFieldValue(sheet, fieldKey)`.

---

## 10. Quick Lookup Table (Field-by-Cell)

Every field, its named range suffix, the A1 cell on a day sheet, whether it is a formula, and which warehouse sheet (if any) receives the value.

| Field key | Suffix | A1 | isFormula | Warehouse |
|---|---|---|---|---|
| `date` | SR_Date | B3:F3 | No | NIGHTLY_FINANCIAL A |
| `mod` | SR_MOD | B4 | No | NIGHTLY_FINANCIAL D |
| `fohStaff` | SR_FohStaff | B6 | No | NIGHTLY_FINANCIAL E (concatenated with bohStaff) |
| `bohStaff` | SR_BohStaff | B7 | No | NIGHTLY_FINANCIAL E (concatenated with fohStaff) |
| `publicTillCount` | SR_PublicTillCount | C10:C17 | No | Not warehoused |
| `publicTillRefloat` | SR_PublicTillRefloat | D10:D17 | No | Not warehoused |
| `terraceTillCount` | SR_TerraceTillCount | E10:E17 | No | Not warehoused |
| `terraceTillRefloat` | SR_TerraceTillRefloat | F10:F17 | No | Not warehoused |
| `cashCounted` | SR_CashCounted | C18 | Yes | NIGHTLY_FINANCIAL V |
| `cashTake` | SR_CashTake | C19 | Yes | NIGHTLY_FINANCIAL H |
| `cashReturns` | SR_CashReturns | C22 | No | NIGHTLY_FINANCIAL J |
| `cdDiscount` | SR_CDDiscount | C23 | No | NIGHTLY_FINANCIAL K |
| `totalCashRecorded` | SR_TotalCashRecorded | C24 | Yes | NIGHTLY_FINANCIAL W |
| `cashVariance` | SR_CashVariance | C26 | Yes | NIGHTLY_FINANCIAL X |
| `cashTips` | SR_CashTips | C29 | No | NIGHTLY_FINANCIAL T |
| `cardTips` | SR_CardTips | C30 | No | NIGHTLY_FINANCIAL S |
| `surchargeTips` | SR_SurchargeTips | C31 | No | Not warehoused |
| `totalTips` | SR_TotalTips | C32 | Yes | NIGHTLY_FINANCIAL U |
| `productionAmount` | SR_ProductionAmount | B37 | No | NIGHTLY_FINANCIAL G |
| `deposit` | SR_Deposit | B38 | No | Not warehoused |
| `cardExpenses` | SR_CardExpenses | B40:B45 | No | Not warehoused |
| `cashTakeDisplay` | SR_CashTakeDisplay | B47 | Yes | Not warehoused |
| `grossSales` | SR_GrossSales | B48 | Yes | NIGHTLY_FINANCIAL I |
| `totalAdjustmentsDiscounts` | SR_TotalAdjustmentsDiscounts | B49 | No | NIGHTLY_FINANCIAL N |
| `discountsExcCashDiscount` | SR_DiscountsExcCashDiscount | B51 | Yes | NIGHTLY_FINANCIAL O |
| `grossSalesLessDiscounts` | SR_GrossSalesLessDiscounts | B52 | Yes | NIGHTLY_FINANCIAL P |
| `taxes` | SR_Taxes | B53 | Yes | NIGHTLY_FINANCIAL Q |
| `netRevenue` | SR_NetRevenue | B54 | Yes | NIGHTLY_FINANCIAL F |
| `runningTotals` | SR_RunningTotals | D37:D54 | Yes | Not warehoused |
| `generalShiftComments` | SR_GeneralShiftComments | A59 | No | QUALITATIVE_LOG |
| `guestsOfNote` | SR_GuestsOfNote | A61 | No | QUALITATIVE_LOG |
| `theGood` | SR_TheGood | A63 | No | QUALITATIVE_LOG |
| `theBad` | SR_TheBad | A65 | No | QUALITATIVE_LOG |
| `kitchenNotes` | SR_KitchenNotes | A67 | No | QUALITATIVE_LOG |
| `todoTasks` | SR_TodoTasks | A69:A84 | No | Task Management only |
| `todoAssignees` | SR_TodoAssignees | D69:D84 | No | Task Management only |
| `wastageComps` | SR_WastageComps | A86 | No | WASTAGE_COMPS |
| `maintenanceIssues` | SR_MaintenanceIssues | A88 | No | OPERATIONAL_EVENTS |
| `rsaIncidents` | SR_RsaIncidents | A90 | No | OPERATIONAL_EVENTS |

`shiftData.dayOfWeek` (NIGHTLY_FINANCIAL col B) and `shiftData.weekEnding` (col C) are computed at runtime from `shiftData.date`; they are not stored on the sheet as FIELD_CONFIG entries.

See [`04-warehouse-schemas.md`](04-warehouse-schemas.md) for the exact NIGHTLY_FINANCIAL column letters (A-Y) and the schemas for other warehouse sheets.

---

## 11. Comparison with Sakura

Sakura's cell map at [`/docs/sakura/CELL_REFERENCE_MAP_SAKURA.md`](../../sakura/CELL_REFERENCE_MAP_SAKURA.md) uses the same `{DAY}_SR_{Suffix}` convention. The differences are:

| Difference | Sakura | Waratah |
|---|---|---|
| Service days | 6 (Mon-Sat) | 5 (Wed-Sun) |
| Number of fields | ~32 (Sakura side unverified by this audit) | 39 |
| Cash recon columns | Not in warehouse | V (CashCounted), W (ExpectedCash), X (CashVariance) |
| Named range hard-fail on day sheets | Yes (helpers throw) | Yes (helpers throw) |
| Fallback A1 for non-day sheets | Yes | Yes |
| Total named ranges | Unverified | 197 |

Waratah's 39 fields exceed Sakura's because Waratah captures more cash reconciliation detail. The two systems share the `FIELD_CONFIG` pattern but each maintains its own constant object in its own venue-specific `Run*.js` file.
