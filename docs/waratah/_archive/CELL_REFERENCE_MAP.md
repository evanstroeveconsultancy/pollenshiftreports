<!-- ARCHIVED 2026-05-17 (Phase 4 of Waratah docs consolidation). Superseded by /docs/waratah/for-developers/02-cell-reference-and-field-config.md. This file is preserved for historical reference. Do not edit. Updates belong in the canonical replacement. -->

# THE WARATAH, Cell Reference Map

**Last Updated:** May 17, 2026 (Phase 1.2, cell map correction)
**Type:** Authoritative Reference — Cell Addresses & Named Ranges
**Purpose:** Complete mapping of 36-field system (180 named ranges) for all Waratah day sheets
**Sheet:** `1rcfHTtey_HXC291FAmjpquYkRjWNGbFtClz2szKXfkA`

---

## Overview

The Waratah uses a **named range system** mirroring Sakura House. Cell positions are defined in `FIELD_CONFIG` in `RunWaratah.js` — the single source of truth for all field-to-cell mappings.

**Named range convention:** `{DAY}_SR_{Suffix}` — e.g. `WEDNESDAY_SR_NetRevenue`, `WEDNESDAY_SR_CashTakings`, `WEDNESDAY_SR_GeneralShiftComments`

<!-- Added 2026-05-17 (FIELD_CONFIG rewrite): 36-field system with corrected cell references and field naming. Named range count: 180 (36 fields × 5 active days) -->

**Active as of May 17, 2026 (Phase 1.3):** ✅ All 197 named ranges created via `setupWaratahNamedRanges_()` (36 fields × 5 days = 180 base + 17 multi-row ranges for till entries, card expenses, TODO tasks). `getFieldRange()` THROWS if a range is missing (no silent fallback). Ranges verified with `verifyWaratahNamedRanges_()` — output: OK=197, MISSING=0, WRONG=0.

**Sheet Names (all 7 exist, but only Wed-Sun active for shift reporting):** 
- `MONDAY <date>` — unused, renamed by rollover
- `TUESDAY <date>` — unused, renamed by rollover
- `WEDNESDAY <date>` — ✅ active
- `THURSDAY <date>` — ✅ active
- `FRIDAY <date>` — ✅ active
- `SATURDAY <date>` — ✅ active
- `SUNDAY <date>` — ✅ active

**Layout Pattern:** Narrative section uses **odd rows for data**, even rows for labels.
- Row 42 = "SHIFT REPORT" label, Row 43 = shift report data
- Row 44 = "VIP/GUESTS OF NOTE" label, Row 45 = VIP data
- etc.

---

## Known Issue & Fix Procedure — Setup Script Misbound Named Ranges

<!-- Added 2026-05-17 (Phase 1.3): Setup script can misalign named ranges to wrong sheet if run AFTER tab duplication/rename -->

**Symptom:** After running `setupWaratahNamedRanges_()`, some ranges (e.g., all `SATURDAY_SR_*` ranges) are bound to the wrong day tab (e.g., SUNDAY instead of SATURDAY).

**Root cause:** The setup script creates named ranges based on **sheet position** (first sheet = MONDAY, second = TUESDAY, etc.) but if the sheet tabs have been renamed out of order or duplicated incorrectly, the name-to-sheet mapping breaks.

**Fix procedure:**
1. Open the shift report spreadsheet
2. Go to **Data → Named ranges** (Google Sheets menu)
3. Look for any ranges with mismatched sheet names (e.g., `SATURDAY_SR_NetRevenue` pointing to SUNDAY tab)
4. Delete all misbound ranges (select and remove)
5. Ensure all 7 day tabs are in the correct order: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
6. Re-run `Waratah Tools → Admin → Named Ranges → Setup All Named Ranges` to create them correctly
7. Verify: `Waratah Tools → Admin → Named Ranges → Verify Named Ranges` should show OK=197, MISSING=0, WRONG=0

---

## Complete Cell Reference Map (36 fields)

<!-- Added 2026-05-17: Authoritative cell layout matching new FIELD_CONFIG -->

### Header
```
B3:F3  Date (manager updated daily, not cleared)
B4     MOD (manager name, clearable)
B6     FOH Staff (clearable)
B7     BOH Staff (clearable)
```

### Cash Reconciliation (columns C–F, rows 10–26)

> Public and Terrace tills feed into a cash variance formula. Managers enter till counts and refloat amounts; formulas compute net and variance. The variance cell flags discrepancies between actual counted cash and POS expectation.

**Public Till (column C):**
```
C10:C17  Public Till Count (input) — rows 10–17, data only
D10:D17  Public Till Refloat (input) — rows 10–17, data only
C18      Cash Counted (FORMULA — DO NOT CLEAR) = sum of net tills
C19      Cash Take (FORMULA — DO NOT CLEAR) = Cash Counted − Refloats
C22      Cash Returns (input, clearable)
C23      CD Discount (input, clearable)
C24      Cash Recorded (FORMULA — DO NOT CLEAR) = expected amount [was "Expected Cash" in Phase 1]
C26      Cash Variance (FORMULA — DO NOT CLEAR) = 💰 Counted − Expected
```

### Tips (column C, rows 29–32)
```
C29  Cash Tips (input, clearable)
C30  Card Tips (input, clearable)
C31  Surcharge Tips (input, clearable)
C32  Total Tips (FORMULA — DO NOT CLEAR) = sum of tips
```

### Revenue & Expenses (column B, rows 37–54)

> Expenses (card payment processing fees) and adjustments flow into net revenue formula. Production amount and function deposits are separate line items.

```
B37  Production Amount (input, clearable)
B38  Function/Event Deposit (input, clearable)
B40:B45  Card Expenses (6-row range, input, clearable)
B47  Cash Take display (FORMULA — DO NOT CLEAR) = mirror of C19
B48  Gross Sales (FORMULA — DO NOT CLEAR) = derived from production + cash
B50  Total Adjustments/Discounts (input, clearable) — manager entry
B51  Discounts exc Cash Discount (FORMULA — DO NOT CLEAR) = derived
B52  Gross Sales less Discounts (FORMULA — DO NOT CLEAR) = derived
B53  Taxes (FORMULA — DO NOT CLEAR) = derived
B54  Net Revenue (FORMULA — DO NOT CLEAR) = final result
D37:D54  Running Totals column (FORMULA — DO NOT CLEAR) = week-to-date
```

### Narrative Fields (merged A:F, odd rows only)

> Managers write shift commentary in merged cells. Each field is a single merged range starting at column A. Always clear from column A, never B:F.

```
A59:F59  General Shift Comments (input, clearable) [was "Shift Report"]
A61:F61  Guests of Note (input, clearable) [was "VIP"]
A63:F63  The Good (input, clearable)
A65:F65  The Bad (input, clearable)
A67:F67  Kitchen Notes (input, clearable)
```

### To-Do Tasks (rows 69–84, 16-row range)

> Managers enter 16 task slots with assigned staff. Previous system supported 9 rows; new system supports 16.

```
A69:A84  To-Do Notes (16 rows, merged A:E per row, input, clearable)
D69:D84  To-Do Allocated Staff (column D, input, clearable) [was column F]
```

### Incidents (merged A:F)
```
A86:F86  Wastage/Comp Comments (input, clearable)
A88:F88  Maintenance Issues (input, clearable) [NEW field]
A90:F90  RSA / Injuries / Security Comments (input, clearable)
```

---

## RunWaratah.js FIELD_CONFIG (Authoritative, 36 fields)

**File:** `THE WARATAH/SHIFT REPORT SCRIPTS/RunWaratah.js`

<!-- Added 2026-05-17 (FIELD_CONFIG rewrite): 36-field system. All consumer code calls getFieldValue() using keys below. isFormula=true fields excluded from rollover clear. -->

This is the single source of truth. All consumer files call `getFieldValue()`, `getFieldDisplayValue()`, or `getFieldValues()` using these keys. `isFormula: true` entries are excluded from rollover clearing.

| Field Key | Suffix | Fallback Cell | isFormula | Named Range (WEDNESDAY example) |
|-----------|--------|---------------|-----------|--------------------------------|
| `date` | `SR_Date` | `B3:F3` | false | `WEDNESDAY_SR_Date` |
| `mod` | `SR_MOD` | `B4` | false | `WEDNESDAY_SR_MOD` |
| `fohStaff` | `SR_FohStaff` | `B6` | false | `WEDNESDAY_SR_FohStaff` |
| `bohStaff` | `SR_BohStaff` | `B7` | false | `WEDNESDAY_SR_BohStaff` |
| `publicTillCount` | `SR_PublicTillCount` | `C10:C17` | false | `WEDNESDAY_SR_PublicTillCount` |
| `publicTillRefloat` | `SR_PublicTillRefloat` | `D10:D17` | false | `WEDNESDAY_SR_PublicTillRefloat` |
| `terraceTillCount` | `SR_TerraceTillCount` | `E10:E17` | false | `WEDNESDAY_SR_TerraceTillCount` |
| `terraceTillRefloat` | `SR_TerraceTillRefloat` | `F10:F17` | false | `WEDNESDAY_SR_TerraceTillRefloat` |
| `cashCounted` | `SR_CashCounted` | `C18` | **true** | `WEDNESDAY_SR_CashCounted` |
| `cashTakings` | `SR_CashTakings` | `C19` | **true** | `WEDNESDAY_SR_CashTakings` |
| `cashReturns` | `SR_CashReturns` | `C22` | false | `WEDNESDAY_SR_CashReturns` |
| `cdDiscount` | `SR_CDDiscount` | `C23` | false | `WEDNESDAY_SR_CDDiscount` |
| `cashRecorded` | `SR_CashRecorded` | `C24` | **true** | `WEDNESDAY_SR_CashRecorded` |
| `cashVariance` | `SR_CashVariance` | `C26` | **true** | `WEDNESDAY_SR_CashVariance` |
| `cashTips` | `SR_CashTips` | `C29` | false | `WEDNESDAY_SR_CashTips` |
| `cardTips` | `SR_CardTips` | `C30` | false | `WEDNESDAY_SR_CardTips` |
| `surchargeTips` | `SR_SurchargeTips` | `C31` | false | `WEDNESDAY_SR_SurchargeTips` |
| `totalTips` | `SR_TotalTips` | `C32` | **true** | `WEDNESDAY_SR_TotalTips` |
| `productionAmount` | `SR_ProductionAmount` | `B37` | false | `WEDNESDAY_SR_ProductionAmount` |
| `functionDeposit` | `SR_FunctionDeposit` | `B38` | false | `WEDNESDAY_SR_FunctionDeposit` |
| `cardExpenses` | `SR_CardExpenses` | `B40:B45` | false | `WEDNESDAY_SR_CardExpenses` |
| `cashTakeDisplay` | `SR_CashTakeDisplay` | `B47` | **true** | `WEDNESDAY_SR_CashTakeDisplay` |
| `grossSales` | `SR_GrossSales` | `B48` | **true** | `WEDNESDAY_SR_GrossSales` |
| `totalAdjustments` | `SR_TotalAdjustments` | `B50` | false | `WEDNESDAY_SR_TotalAdjustments` |
| `discountsExcCash` | `SR_DiscountsExcCash` | `B51` | **true** | `WEDNESDAY_SR_DiscountsExcCash` |
| `grossSalesLessDisc` | `SR_GrossSalesLessDisc` | `B52` | **true** | `WEDNESDAY_SR_GrossSalesLessDisc` |
| `taxes` | `SR_Taxes` | `B53` | **true** | `WEDNESDAY_SR_Taxes` |
| `netRevenue` | `SR_NetRevenue` | `B54` | **true** | `WEDNESDAY_SR_NetRevenue` |
| `runningTotals` | `SR_RunningTotals` | `D37:D54` | **true** | `WEDNESDAY_SR_RunningTotals` |
| `generalShiftComments` | `SR_GeneralShiftComments` | `A59:F59` | false | `WEDNESDAY_SR_GeneralShiftComments` |
| `guestsOfNote` | `SR_GuestsOfNote` | `A61:F61` | false | `WEDNESDAY_SR_GuestsOfNote` |
| `theGood` | `SR_TheGood` | `A63:F63` | false | `WEDNESDAY_SR_TheGood` |
| `theBad` | `SR_TheBad` | `A65:F65` | false | `WEDNESDAY_SR_TheBad` |
| `kitchenNotes` | `SR_KitchenNotes` | `A67:F67` | false | `WEDNESDAY_SR_KitchenNotes` |
| `todoTasks` | `SR_TodoTasks` | `A69:A84` | false | `WEDNESDAY_SR_TodoTasks` |
| `todoAssignees` | `SR_TodoAssignees` | `D69:D84` | false | `WEDNESDAY_SR_TodoAssignees` |
| `wastageComps` | `SR_WastageComps` | `A86:F86` | false | `WEDNESDAY_SR_WastageComps` |
| `maintenanceIssues` | `SR_MaintenanceIssues` | `A88:F88` | false | `WEDNESDAY_SR_MaintenanceIssues` |
| `rsaIncidents` | `SR_RSAIncidents` | `A90:F90` | false | `WEDNESDAY_SR_RSAIncidents` |

**Clearable fields (isFormula: false, 27 fields):** date, mod, fohStaff, bohStaff, publicTillCount, publicTillRefloat, terraceTillCount, terraceTillRefloat, cashReturns, cdDiscount, cashTips, cardTips, surchargeTips, productionAmount, functionDeposit, cardExpenses, totalAdjustments, generalShiftComments, guestsOfNote, theGood, theBad, kitchenNotes, todoTasks, todoAssignees, wastageComps, maintenanceIssues, rsaIncidents

**Formula cells — never clear (9 fields):** cashCounted(C18), cashTakings(C19), cashRecorded(C24), cashVariance(C26), totalTips(C32), cashTakeDisplay(B47), grossSales(B48), discountsExcCash(B51), grossSalesLessDisc(B52), taxes(B53), netRevenue(B54), runningTotals(D37:D54)

## VenueConfig.js (Legacy)

**File:** `THE WARATAH/SHIFT REPORT SCRIPTS/VenueConfig.js`

`usesNamedRanges: true` — routes through `getFieldValue()` helpers from RunWaratah.js.

---

## Integration Hub Extraction (Batch Read Optimization)

**File:** `THE WARATAH/SHIFT REPORT SCRIPTS/IntegrationHubWaratah.js`

<!-- Added 2026-05-17: Updated batch read ranges to reflect new cell layout (cash recon, running totals, 16-row TODOs, maintenance field) -->

The `extractShiftData_()` function uses **batch reads** for performance, then maps values against FIELD_CONFIG fallback positions. Individual `getFieldValue()` calls per field would be ~20× more API calls.

```javascript
// BATCH READ 1: Header + cash recon B3:F26
const headerCashValues = sheet.getRange("B3:F26").getValues();

// BATCH READ 2: Tips + revenue + expenses B29:D54
const revenueValues = sheet.getRange("B29:D54").getValues();

// BATCH READ 3: Narrative fields A59:F90 (generalShiftComments, guestsOfNote, theGood, theBad, kitchenNotes, wastage, maintenance, RSA)
const narrativeValues = sheet.getRange("A59:F90").getValues();

// BATCH READ 4: TO-DOs A69:D84 (16-row task + assignee range, separate from narrative)
const todoValues = sheet.getRange("A69:D84").getValues();
```

**Warehoused:** All clearable fields + formula results (net revenue, cash variance, total tips, etc.)
**NOT warehoused:** Formula intermediate cells (cashTakeDisplay, grossSales, discountsExcCash, grossSalesLessDisc, taxes — these are derived, not primary inputs)

---

## Rollover Clearable Fields

**File:** `THE WARATAH/SHIFT REPORT SCRIPTS/WeeklyRolloverInPlaceWaratah.js`

<!-- Added 2026-05-17: Clearable field list auto-derived from FIELD_CONFIG (27 fields after Phase 1.2) -->

Clearable fields are derived programmatically from FIELD_CONFIG — no separate manual list:

```javascript
// In RunWaratah.js:
function getClearableFieldKeys_() {
  return Object.keys(FIELD_CONFIG).filter(key => !FIELD_CONFIG[key].isFormula);
}

// In WeeklyRolloverInPlaceWaratah.js:
const CLEARABLE_FIELD_KEYS = getClearableFieldKeys_();
// → 27 fields: date, mod, fohStaff, bohStaff, publicTillCount, publicTillRefloat,
//    terraceTillCount, terraceTillRefloat, cashReturns, cdDiscount, cashTips,
//    cardTips, surchargeTips, productionAmount, functionDeposit, cardExpenses,
//    totalAdjustments, generalShiftComments, guestsOfNote, theGood, theBad,
//    kitchenNotes, todoTasks, todoAssignees, wastageComps, maintenanceIssues, rsaIncidents
```

Formula cells (12) are automatically excluded from rollover: cashCounted, cashTakings, cashRecorded, cashVariance, totalTips, cashTakeDisplay, grossSales, discountsExcCash, grossSalesLessDisc, taxes, netRevenue, runningTotals.

### CRITICAL: Merged Cell Clearing

> Narrative cells and TODO rows are merged A:F or A:D. Always clear from column A — clearing B:F or B:D of a merged range does NOT clear the value.

**Wrong:** `sheet.getRange('B59:F59').clearContent()` — does nothing (merged A:F, value in column A)
**Right:** `sheet.getRange('A59:F59').clearContent()` — clears the value

Applies to: A59:F59 (generalShiftComments), A61:F61 (guestsOfNote), A63:F63 (theGood), A65:F65 (theBad), A67:F67 (kitchenNotes), A86:F86 (wastageComps), A88:F88 (maintenanceIssues), A90:F90 (rsaIncidents), A69:A84 (todoTasks merged A:E), D69:D84 (todoAssignees, not merged).

---

## Data Warehouse Schema (NIGHTLY_FINANCIAL)

> The warehouse stores all shift data for analytics. Each row is one shift. Columns map directly to FIELD_CONFIG, excluding formula intermediates and 6-row card expense range.

<!-- Added 2026-05-17 (Phase 1.3 — correction): The Phase 1.2 doc pass invented a 22-col schema. Reality: schema was extended from 22 to 25 cols when cash recon W/X/Y were added on May 17. Code assertion in IntegrationHubWaratah.js line 492 expects exactly 25 cols. -->

```
A=Date, B=Day, C=WeekEnding, D=MOD,
E=Staff (combined: "FOH: <names> | BOH: <names>"),
F=NetRevenue (from B54), G=ProductionAmount (from B37),
H=CashTakings (from C19), I=GrossSalesIncCash (from B48),
J=CashReturns (from C22), K=CDDiscount (from C23),
L=Refunds (NULL — source removed), M=CDRedeem (NULL — source removed),
N=TotalDiscount (from B50), O=DiscountsCompsExcCD (from B51),
P=GrossTaxableSales (from B52), Q=Taxes (from B53),
R=NetSalesWTips (NULL — no direct equivalent on new sheet),
S=CardTips (from C30), T=CashTips (from C29), U=TotalTips (from C32),
V=LoggedAt,
W=CashCounted (from C18, NEW May 17),
X=ExpectedCash (from C24, NEW May 17),
Y=CashVariance (from C26, NEW May 17)
```

**Schema changes (Phase 1.2 cutover):**
- Header row extended from 22 → 25 columns (W/X/Y added for cash recon)
- E=Staff repurposed to a combined string: `"FOH: " + fohStaff + " | BOH: " + bohStaff` (no schema position change; just the source changed)
- Source-cell remapping for almost every column (cutover moved most fields; same warehouse column header preserved for analytics compatibility)
- NULL going forward: L (Refunds), M (CDRedeem), R (NetSalesWTips) — source cells removed from new sheet layout; historical rows preserve their values
- Total: 25 columns (A–Y)

**Header assertion:** `logToDataWarehouse_()` expects exactly 25 columns after the header row (asserted at line 492). The user manually added W/X/Y to the warehouse sheet during the May 17 cutover.

---

## Quick Lookup Table (36 fields)

| Field | Cell | Type | isFormula | Warehoused |
|-------|------|------|-----------|------------|
| Date | B3:F3 | Date | false | Yes (A) |
| MOD | B4 | Text | false | Yes (D) |
| FOH Staff | B6 | Text | false | Yes (E) |
| BOH Staff | B7 | Text | false | Yes (F) |
| Public Till Count | C10:C17 | Number | false | Yes (multi) |
| Public Till Refloat | D10:D17 | Number | false | No |
| Terrace Till Count | E10:E17 | Number | false | Yes (multi) |
| Terrace Till Refloat | F10:F17 | Number | false | No |
| Cash Counted | C18 | Formula | **true** | Yes (G) |
| Cash Takings | C19 | Formula | **true** | Yes (H) |
| Cash Returns | C22 | Number | false | Yes (S) |
| CD Discount | C23 | Number | false | Yes (T) |
| Cash Recorded | C24 | Formula | **true** | No |
| Cash Variance | C26 | Formula | **true** | Yes (I) |
| Cash Tips | C29 | Number | false | Yes (J) |
| Card Tips | C30 | Number | false | Yes (K) |
| Surcharge Tips | C31 | Number | false | Yes (L) |
| Total Tips | C32 | Formula | **true** | Yes (M) |
| Production Amount | B37 | Number | false | Yes (N) |
| Function Deposit | B38 | Number | false | Yes (O) |
| Card Expenses | B40:B45 | Number | false | No (formula result in Q) |
| Cash Take Display | B47 | Formula | **true** | No |
| Gross Sales | B48 | Formula | **true** | No |
| Total Adjustments | B50 | Number | false | Yes (P) |
| Discounts Exc Cash | B51 | Formula | **true** | No |
| Gross Sales Less Disc | B52 | Formula | **true** | No |
| Taxes | B53 | Formula | **true** | Yes (R) |
| Net Revenue | B54 | Formula | **true** | Yes (Q) |
| Running Totals | D37:D54 | Formula | **true** | No |
| General Shift Comments | A59:F59 | Text | false | Yes (QUALITATIVE) |
| Guests of Note | A61:F61 | Text | false | Yes (QUALITATIVE) |
| The Good | A63:F63 | Text | false | Yes (QUALITATIVE) |
| The Bad | A65:F65 | Text | false | Yes (QUALITATIVE) |
| Kitchen Notes | A67:F67 | Text | false | Yes (QUALITATIVE) |
| TO-DO Tasks | A69:A84 | Text | false | Yes (OPERATIONAL_EVENTS) |
| TO-DO Assignees | D69:D84 | Text | false | Yes (OPERATIONAL_EVENTS) |
| Wastage/Comps | A86:F86 | Text | false | Yes (WASTAGE_COMPS) |
| Maintenance Issues | A88:F88 | Text | false | Yes (QUALITATIVE) |
| RSA/Injuries | A90:F90 | Text | false | Yes (QUALITATIVE) |

---

## Sheet Protection

Protects structural cells (headers, labels, formula cells) while keeping all input fields editable. Implemented in `RunWaratah.js`.

**Mode:** `setWarningOnly(true)` — staff see a warning if they accidentally edit protected cells but are not hard-blocked. GAS scripts (rollover, exports) always have full write access.

**Editable ranges:** All `FIELD_CONFIG` entries where `isFormula: false` (25 fields after Phase 1). The 10 formula cells are protected: cashTakings(C19), cashCounted(C18), cashVariance(C26), grossSalesIncCash(B16), discountsCompsExcCD(B26), grossTaxableSales(B27), taxes(B28), netSalesWTips(B29), netRevenue(B34), totalTips(B36).

**Menu:** `Waratah Tools → Admin Tools → Setup & Utilities → Sheet Protection`
- `Apply Protection (All Sheets)` — calls `setupAllSheetsProtection()`
- `Remove Protection (All Sheets)` — calls `removeAllSheetsProtection()`

**Functions in RunWaratah.js:**
```javascript
setupSheetProtection_(sheet)     // protect one sheet; carve out 24 input ranges
setupAllSheetsProtection()       // menu-callable; loops all 5 day sheets
removeAllSheetsProtection()      // menu-callable; removes all protections
getClearableFieldKeys_()         // returns non-formula field keys (used by both rollover + protection)
```

---

## Comparison with Sakura House

| Aspect | Waratah | Sakura House |
|--------|---------|--------------|
| **Cell Strategy** | Named ranges (`WEDNESDAY_SR_NetRevenue`) | Named ranges (`MONDAY_SR_NetRevenue`) |
| **Fallback** | Hardcoded cells (graceful degradation) | Hardcoded cells (graceful degradation) |
| **Infrastructure File** | `RunWaratah.js` (FIELD_CONFIG + helpers) | `RunSakura.gs` (FIELD_CONFIG + helpers) |
| **Day Prefixes** | WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY | MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY |
| **Formula protection** | `isFormula` flag (8 formula cells) + `getClearableFieldKeys_()` | `isFormula` flag (1 formula cell: B54) + `getAllFieldKeys_()` |
| **Self-healing** | `verifyAndFixNamedRanges_()` called during rollover | Same pattern |

---

---

**Last Updated:** May 17, 2026 (Phase 1.3 — setup script known issue documented)
**Total Fields:** 36 (27 clearable, 9 formula-only)
**Named Ranges:** 197 (36 fields × 5 days + multi-row ranges)
**Key Insight:** All narrative cells are merged A:F. Always clear from column A, never from B:F.
**Cash recon rule:** C18/C19/C24/C26 are all formulas or system-managed (never clear via manager action). Manager inputs: C22, C23, C29-C31 only.
