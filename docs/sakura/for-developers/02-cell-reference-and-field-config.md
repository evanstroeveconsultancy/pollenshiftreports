# Cell Reference and FIELD_CONFIG (Sakura House)

**Audience:** Developers and Claude AI agents modifying sheet layout, named ranges, FIELD_CONFIG, or any code that reads or writes Sakura shift report fields.

This file is the canonical cell reference for Sakura House. The source of truth is the `FIELD_CONFIG` constant in `RunSakura.gs` plus the named ranges defined on each day tab. Documentation always defers to code.

---

## 1. Status (May 2026)

- **24 fields** in FIELD_CONFIG (`RunSakura.gs:29-190`)
- **24 fields x 6 days = 144 named ranges** active across the operating day tabs
- Day prefixes are restricted by `VALID_DAY_PREFIXES` at `RunSakura.gs:23`:
  `["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"]`
- Sakura House operates **6 days a week and is closed on Sunday**. No Sunday day tab is bound.
- Named range naming convention: `{DAY}_{SUFFIX}` where `{DAY}` is one of the six uppercase day names above and `{SUFFIX}` is the field's `suffix` attribute (each Sakura suffix already begins with `SR_`, for example `SR_NetRevenue`). Final form: `MONDAY_SR_NetRevenue`, `SATURDAY_SR_CashTips`, and so on.
- If a named range is missing for a given day, `RunSakura.gs` falls back to the hardcoded A1 reference recorded in the field's `fallback` attribute and logs a warning. This is a soft fallback, not a hard throw.

---

## 2. The Sheet Layout

The Sakura shift report spreadsheet has these tabs:

| Tab | Purpose |
|---|---|
| Read Me | Manager instructions, static |
| Monday | Service day, manager input + formula |
| Tuesday | Service day |
| Wednesday | Service day |
| Thursday | Service day |
| Friday | Service day |
| Saturday | Service day |
| Task Management | Cross-tab navigation to TM spreadsheet |
| ANALYTICS | Financial dashboard (read-only) |
| EXECUTIVE_DASHBOARD | Executive view (read-only) |

The active service days are **Monday through Saturday**. No Sunday tab exists. Each operating day tab uses the same 24-field layout, with the values of those fields entered or formula-computed at the cells listed in section 5.

---

## 3. Named Range Convention and Helpers

### Convention

Every field has a named range per operating day, formatted `{UPPER_DAY}_{suffix}`:

```
MONDAY_SR_Date
MONDAY_SR_MOD
MONDAY_SR_NetRevenue
TUESDAY_SR_NetRevenue
...
SATURDAY_SR_RSAIncidents
```

Multi-row ranges (cash count breakdown, petty cash, TO-DO rows) share the same `{DAY}_{SUFFIX}` form and bind to the multi-row range as a single named range:

```
MONDAY_SR_CashCount             (C10:E17, the cash count grid)
MONDAY_SR_CashRecord            (C22:D23)
MONDAY_SR_PettyCashTransactions (B40:B45)
MONDAY_SR_TodoTasks             (A69:A84, 16 rows)
MONDAY_SR_TodoAssignees         (D69:D84, 16 rows)
```

### Helpers in `RunSakura.gs`

The Sakura helpers consult the named range first and fall back to the `fallback` A1 reference if the named range is missing on the active day sheet. A warning is logged when the fallback path fires; this surfaces drift without blocking nightly send.

| Helper | Purpose |
|---|---|
| `getFieldRange(sheet, fieldKey)` | Returns the `Range` for a field on a given sheet. Tries `{DAY}_{SUFFIX}`; falls back to the hardcoded `fallback` A1 reference. |
| `getFieldValue(sheet, fieldKey)` | Returns the cell value via `getFieldRange`. |
| `getFieldDisplayValue(sheet, fieldKey)` | Returns the display string via `getFieldRange`. |
| `getFieldValues(sheet, fieldKey)` | Returns a 2-D array for multi-row ranges. |
| `getClearableFieldKeys_()` | Returns all `fieldKey` where `isFormula === false`. Used by the rollover. |

### Diagnostics and binding (menu handlers)

Five menu items live under **Shift Report > Admin Tools > Set Up & Diagnostics** (`MenuSakura.gs` lines 155-166). Each is a thin wrapper around the corresponding `pw_*` function:

| Menu item | Function | Purpose |
|---|---|---|
| Diagnose Named Ranges (Active Sheet) | `pw_diagnoseNamedRanges` | Lists which of the 24 ranges are bound on the active day tab |
| Diagnose Named Ranges (All Sheets) | `pw_diagnoseAllSheets` | Same as above but walks every operating day tab |
| Create Named Ranges (Active Sheet) | `pw_createNamedRangesOnActiveSheet` | Binds all 24 ranges on the active day tab (idempotent) |
| Create Named Ranges (All Sheets) | `pw_createNamedRangesOnAllSheets` | Walks every operating day tab and binds 24 ranges per tab |
| Force Update Named Ranges (All Sheets) | `pw_forceUpdateNamedRangesOnAllSheets` | Rebinds all 144 ranges, overwriting any pre-existing range with the same name |

Use the **Diagnose** options before any setup intervention. Use **Force Update** only after a sheet rename or a known wrong-binding situation; it is destructive to existing bindings (it replaces them).

---

## 4. FIELD_CONFIG Structure

`FIELD_CONFIG` in `RunSakura.gs` is a plain object keyed by camelCase field name. Each entry has the shape:

```javascript
const FIELD_CONFIG = {
  date: {
    suffix: 'SR_Date',
    fallback: 'B3:D3',
    isFormula: false,
    description: 'Report date'
  },
  netRevenue: {
    suffix: 'SR_NetRevenue',
    fallback: 'B54',
    isFormula: true,
    description: 'Net revenue (formula at B54)'
  },
  // ... 22 more entries (24 total)
};
```

The named range for a day's field is `${UPPER_DAY}_${suffix}`. The `SR_` prefix is part of the `suffix` value itself; the final form is, for example, `MONDAY_SR_NetRevenue`.

### isFormula

Sakura has exactly **one** formula field: `netRevenue` at B54. It is `isFormula: true` and is **never cleared** by the rollover and **never written** by manager input. All other 23 fields are manager-entered values.

`getClearableFieldKeys_()` derives the rollover clear list by filtering `isFormula === false`, giving **22 of 24 fields**. The 22-field list excludes `netRevenue` (formula) plus one additional field that the rollover treats as preserve-only; see section 6.

---

## 5. FIELD_CONFIG (Complete List)

The full 24-field FIELD_CONFIG as defined in `RunSakura.gs:29-190`:

| Field key | Suffix | Fallback cell | isFormula | Description |
|---|---|---|---|---|
| `date` | SR_Date | B3:D3 | false | Report date |
| `mod` | SR_MOD | B4:D4 | false | Manager on Duty |
| `fohStaff` | SR_FOHStaff | B6:D6 | false | FOH staff on shift |
| `bohStaff` | SR_BOHStaff | B7:D7 | false | BOH staff on shift |
| `cashCount` | SR_CashCount | C10:E17 | false | Cash count breakdown |
| `cashRecord` | SR_CashRecord | C22:D23 | false | Cash record totals |
| `pettyCashTransactions` | SR_PettyCashTransactions | B40:B45 | false | Petty cash transactions |
| `netRevenue` | SR_NetRevenue | B54 | **true** | Net revenue (formula, never cleared) |
| `shiftSummary` | SR_ShiftSummary | A59:D59 | false | General overview |
| `todoTasks` | SR_TodoTasks | A69:A84 | false | TO-DO task descriptions |
| `todoAssignees` | SR_TodoAssignees | D69:D84 | false | TO-DO assignees |
| `cashTips` | SR_CashTips | C29 | false | Tips, cash |
| `cardTips` | SR_CardTips | C30 | false | Tips, card |
| `surchargeTips` | SR_SurchargeTips | C31 | false | Tips, surcharge |
| `productionAmount` | SR_ProductionAmount | B37 | false | Production amount (Lightspeed) |
| `deposit` | SR_Deposit | B38 | false | Deposit / non-Lightspeed revenue |
| `discounts` | SR_Discounts | B50 | false | Total discounts (Lightspeed) |
| `guestsOfNote` | SR_GuestsOfNote | A61:D61 | false | VIPs / regulars |
| `goodNotes` | SR_GoodNotes | A63:D63 | false | Positive feedback |
| `issues` | SR_Issues | A65:D65 | false | Issues / improvements |
| `kitchenNotes` | SR_KitchenNotes | A67:D67 | false | Kitchen notes |
| `wastageComps` | SR_WastageComps | A86:D86 | false | Wastage / comps / discounts |
| `maintenance` | SR_Maintenance | A88:D88 | false | Maintenance items |
| `rsaIncidents` | SR_RSAIncidents | A90:D90 | false | RSA / intoxication / refusals |

**24 fields total.** Exactly one is `isFormula: true` (`netRevenue`).

**24 fields x 6 days = 144 named ranges.**

For the authoritative list, the source is the in-code FIELD_CONFIG object. Run:

```bash
grep -A 5 "FIELD_CONFIG = {" "SAKURA HOUSE/SHIFT REPORT SCRIPTS/RunSakura.gs" | head -200
```

---

## 6. Rollover Clearable Fields

The weekly in-place rollover (`WeeklyRolloverInPlace.gs`, handler `performInPlaceRollover()` around line 1019) clears manager input cells without touching formulas. The mechanism:

```javascript
function getClearableFieldKeys_() {
  return Object.keys(FIELD_CONFIG).filter(
    key => FIELD_CONFIG[key].isFormula === false
  );
}
```

This filter gives 23 of 24 fields (excludes `netRevenue`). The `CLEARABLE_FIELDS` list compiled in `WeeklyRolloverInPlace.gs:81-90` further narrows to **22 fields** in the rollover loop; `netRevenue` is excluded as the formula field. The rollover iterates the 22-key list for each operating day tab, calling `Range.clearContent()` on each named range.

The full set of cleared fields (`isFormula === false`, used by the rollover):

`date`, `mod`, `fohStaff`, `bohStaff`, `cashCount`, `cashRecord`, `pettyCashTransactions`, `shiftSummary`, `todoTasks`, `todoAssignees`, `cashTips`, `cardTips`, `surchargeTips`, `productionAmount`, `deposit`, `discounts`, `guestsOfNote`, `goodNotes`, `issues`, `kitchenNotes`, `wastageComps`, `maintenance`, `rsaIncidents`.

**Critical rules:**

- Never hard-code a clearable list. The FIELD_CONFIG `isFormula` flag is the single source of truth.
- If a new field is added to FIELD_CONFIG with `isFormula: false`, it joins the clearable list automatically.
- If a field is changed to `isFormula: true`, it leaves the clearable list automatically.
- Formula cells, label cells, and the Read Me / Task Management / ANALYTICS / EXECUTIVE_DASHBOARD tabs are untouched by rollover.
- The rollover trigger fires Monday 10:00 AM Australia/Sydney; create it via `createRolloverTrigger_Sakura()` (`WeeklyRolloverInPlace.gs:1025`).

---

## 7. Merged Cell Reading Rule

Several narrative fields are visually merged across columns A:D (for example `shiftSummary` at `A59:D59`, `kitchenNotes` at `A67:D67`). The named range itself binds to the full merged range; the underlying spreadsheet model holds the value in column A.

When reading:

```javascript
// Correct
const value = getFieldValue('shiftSummary', sheet);
// Returns the A-column value of the merge.

// Avoid
const range = sheet.getRange('A59:D59');
const allValues = range.getValues(); // [ [text, '', '', ''] ]
```

When clearing:

```javascript
// Correct
const range = getFieldRange('shiftSummary', sheet);
range.clearContent();
// Clears the value; the visual merge stays intact.

// Also correct
sheet.getRangeByName('MONDAY_SR_ShiftSummary').clearContent();
```

The merged cells survive clear operations because we use `clearContent()` (singular, on Range), which clears values only and leaves merge structure intact. **Never use `sheet.clear()`** (destroys formatting and merges). The non-existent `sheet.clearContent()` (singular on Sheet) throws TypeError; use `sheet.clearContents()` (plural) when clearing an entire sheet.

---

## 8. Sheet Protection Model

The Sakura shift report spreadsheet uses Google Sheets' built-in protection to prevent accidental edits on day tabs. Protection setup (handled in `RunSakura.gs`, owner email Script Property `SHEET_PROTECTION_OWNER_EMAIL` at line 681):

1. **Whole-sheet protection** is applied to each Monday-Saturday tab.
2. **Editable carve-outs** are derived from the clearable input fields (23 manager-input fields, that is, all 24 minus `netRevenue`).
3. **Restricted editing**, not warning mode: the protection adds an editor and removes all other editors. The active editor is the value of `SHEET_PROTECTION_OWNER_EMAIL`, falling back to the effective user.

Protection management lives under **Shift Report > Admin Tools > Set Up & Diagnostics > Sheet Protection** (`MenuSakura.gs:155-166`). If protections become out of sync, remove and reapply.

---

## 9. Integration Hub Batch Read Pattern

When reading every field on a day tab during nightly send, `IntegrationHubSakura.gs` uses A1 batch ranges rather than 24 separate `getValue()` calls. Field-level extractors read values from the cached arrays.

Code that needs a single field outside of the integration pipeline still uses `getFieldValue(sheet, fieldKey)`, which goes via the named range with fallback to the A1 reference.

See [`04-warehouse-schemas.md`](04-warehouse-schemas.md) for the NIGHTLY_FINANCIAL column mapping (16 columns A-P, `IntegrationHubSakura.gs:412-429`) and the other warehouse sheet schemas (OPERATIONAL_EVENTS 9 cols, WASTAGE_COMPS 5 cols, QUALITATIVE_LOG 11 cols).

---

## 10. Quick Lookup Table (Field-by-Cell)

Every Sakura field, its named range suffix, the A1 cell on a day sheet, and whether it is a formula. Warehouse routing is documented in `04-warehouse-schemas.md`.

| Field key | Suffix | A1 (fallback) | isFormula |
|---|---|---|---|
| `date` | SR_Date | B3:D3 | No |
| `mod` | SR_MOD | B4:D4 | No |
| `fohStaff` | SR_FOHStaff | B6:D6 | No |
| `bohStaff` | SR_BOHStaff | B7:D7 | No |
| `cashCount` | SR_CashCount | C10:E17 | No |
| `cashRecord` | SR_CashRecord | C22:D23 | No |
| `pettyCashTransactions` | SR_PettyCashTransactions | B40:B45 | No |
| `netRevenue` | SR_NetRevenue | B54 | **Yes** |
| `shiftSummary` | SR_ShiftSummary | A59:D59 | No |
| `todoTasks` | SR_TodoTasks | A69:A84 | No |
| `todoAssignees` | SR_TodoAssignees | D69:D84 | No |
| `cashTips` | SR_CashTips | C29 | No |
| `cardTips` | SR_CardTips | C30 | No |
| `surchargeTips` | SR_SurchargeTips | C31 | No |
| `productionAmount` | SR_ProductionAmount | B37 | No |
| `deposit` | SR_Deposit | B38 | No |
| `discounts` | SR_Discounts | B50 | No |
| `guestsOfNote` | SR_GuestsOfNote | A61:D61 | No |
| `goodNotes` | SR_GoodNotes | A63:D63 | No |
| `issues` | SR_Issues | A65:D65 | No |
| `kitchenNotes` | SR_KitchenNotes | A67:D67 | No |
| `wastageComps` | SR_WastageComps | A86:D86 | No |
| `maintenance` | SR_Maintenance | A88:D88 | No |
| `rsaIncidents` | SR_RSAIncidents | A90:D90 | No |

`shiftData.dayOfWeek` (NIGHTLY_FINANCIAL col B) and `shiftData.weekEnding` (NIGHTLY_FINANCIAL col C) are computed at runtime from `shiftData.date`; they are not FIELD_CONFIG entries on the sheet.

---

## 11. Comparison with The Waratah

Both venues use the same `{DAY}_{SUFFIX}` named range convention and the same FIELD_CONFIG pattern. The differences:

| Difference | Sakura | The Waratah |
|---|---|---|
| Service days | 6 (Mon-Sat, closed Sunday) | 5 (Wed-Sun, closed Mon-Tue) |
| Day prefixes | MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY | WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY |
| Number of fields | 24 | 39 |
| Total named ranges | **144** (24 x 6) | **197** (1 all-days field x 7 + 38 service-day fields x 5) |
| Formula fields | 1 (`netRevenue`) | 12 (full cash reconciliation + financial calculations) |
| Cash recon detail | Minimal (`cashCount`, `cashRecord`) | Full ledger (CashCounted, CashTake, Returns, CDDiscount, TotalCashRecorded, CashVariance) |
| Named range hard-fail on day sheets | No, soft fallback with warning | Yes, helpers throw |

Waratah's 39 fields exceed Sakura's because Waratah captures more cash reconciliation detail and breaks out the till counts (Public + Terrace) into separate multi-row ranges. The two systems share the `FIELD_CONFIG` pattern but each maintains its own constant object in its own venue-specific `Run*.{gs,js}` file. Sakura uses `.gs` and runs in the Sakura Apps Script project; Waratah uses `.js` and runs in the Waratah project.

The Waratah equivalent of this document is at [`../../waratah/for-developers/02-cell-reference-and-field-config.md`](../../waratah/for-developers/02-cell-reference-and-field-config.md).
