# Rollover and Triggers

**Audience:** Developers maintaining the Sakura weekly rollover or modifying any time-based trigger in either Apps Script project (shift report side or task management side).

Sakura uses an **in-place rollover** model: one permanent working spreadsheet, archived weekly to Drive, with manager input cells cleared in place via the named range abstraction. This file covers the rollover's internal mechanics, the project's five triggers, and the operational patterns for keeping them healthy across deployments.

---

## 1. In-Place Rollover Model

On Monday at 10:00 AM Australia/Sydney the rollover does the following:

1. Archives a multi-page PDF of all six day sheets to Drive.
2. Saves a full spreadsheet copy (Sheets file) to Drive, named with the week-ending date.
3. Clears manager input cells across the six day tabs via named range lookup (formula cells preserved).
4. Updates dates on each day tab and renames the tab to include the new date (e.g. `MONDAY 10/03/2026`).
5. Verifies and self-heals named range bindings on all six day sheets.

After the clear, the spreadsheet is ready for the new week's Monday service. Formulas continue to work because the named ranges are rebound to the same cells; the cells are simply empty.

This contrasts with a "duplication" model where each week starts with a fresh template copy. The in-place model has these properties:

| Property | Pro | Con |
|---|---|---|
| One permanent spreadsheet | Bookmarks never break; URL stable | A single corrupted state affects multiple weeks |
| Named ranges preserved | No re-binding needed each week | Adds complexity to clear logic (formula field excluded) |
| Archive in Drive | Permanent record | Drive permissions must be maintained |
| Tabs renamed with date | Easy historical reference in tab strip | Sheet-name lookups must use day-prefix matching |

---

## 2. Trigger Inventory (Both Projects)

Sakura has five installed triggers across two Apps Script projects. All schedules are in Australia/Sydney.

| Function | Schedule | File:line | Installer |
|---|---|---|---|
| `performInPlaceRollover` | Mon 10:00 | `WeeklyRolloverInPlace.gs:1019` | `createRolloverTrigger_Sakura` (line 1025) |
| `sendWeeklyRevenueDigest_Sakura` | Mon 08:00 | `WeeklyDigestSakura.gs:18` | `setupWeeklyDigestTrigger_Sakura` (line 294) |
| `runDailyTaskMaintenance` | Daily 07:00 | `EnhancedTaskManagement_Sakura.gs:1250` | `createDailyMaintenanceTrigger` (line 1509) |
| `sendWeeklyActiveTasksSummary` | Mon 06:00 | `EnhancedTaskManagement_Sakura.gs:1296` | `createWeeklySummaryTrigger` (line 1531) |
| `onTaskSheetEditWithAutoSort` | onEdit (installable) | `EnhancedTaskManagement_Sakura.gs:1135` | `createOnEditTrigger` (line 1553) |

Three of the five live on the **shift report side** (`SAKURA HOUSE/SHIFT REPORT SCRIPTS/`) and two live on the **task management side** (`SAKURA HOUSE/TASK MANAGEMENT SCRIPTS/`). They run in separate Apps Script projects against separate spreadsheets.

There are no other automated time-based triggers. The previously documented Sunday 9am overdue summary trigger was removed on April 2, 2026 and no longer exists.

---

## 3. Trigger Setup, Shift Report Project

Two time-based triggers in `SAKURA HOUSE/SHIFT REPORT SCRIPTS/`:

**Weekly Rollover (`performInPlaceRollover`, Mon 10:00).** Created by `createRolloverTrigger_Sakura()` at `WeeklyRolloverInPlace.gs:1025`:

```javascript
ScriptApp.newTrigger('performInPlaceRollover')
  .timeBased()
  .onWeekDay(ScriptApp.WeekDay.MONDAY)
  .atHour(10)
  .nearMinute(0)
  .inTimezone('Australia/Sydney')
  .create();
```

The installer deletes any existing trigger for the same handler before creating a new one. Google Apps Script caps each project at 20 triggers; without the defensive delete, duplicates accumulate.

**Weekly Revenue Digest (`sendWeeklyRevenueDigest_Sakura`, Mon 08:00).** Created by `setupWeeklyDigestTrigger_Sakura()` at `WeeklyDigestSakura.gs:294`, with the schedule on lines 301-302 (`onWeekDay(MONDAY).atHour(8)`). Posts to Slack via `SAKURA_SLACK_WEBHOOK_LIVE`.

---

## 4. Trigger Setup, Task Management Project

Two time-based triggers plus one installable on-edit trigger in `SAKURA HOUSE/TASK MANAGEMENT SCRIPTS/EnhancedTaskManagement_Sakura.gs`:

| Function | Schedule | Installer line |
|---|---|---|
| `runDailyTaskMaintenance` | Daily 07:00 | `createDailyMaintenanceTrigger` (line 1509) |
| `sendWeeklyActiveTasksSummary` | Mon 06:00 | `createWeeklySummaryTrigger` (line 1531) |
| `onTaskSheetEditWithAutoSort` | onEdit | `createOnEditTrigger` (line 1553) |

`sendWeeklyActiveTasksSummary` posts to the **managers channel only** via `SLACK_MANAGERS_CHANNEL_WEBHOOK` (the DM path was disabled in May 2026 per the inline comment at `EnhancedTaskManagement_Sakura.gs:1427-1428`).

The on-edit trigger keeps the master Actionables sheet sorted whenever a row is edited. It is an **installable** trigger (not a simple `onEdit`), which is why an explicit installer is required.

---

## 5. The Rollover Execution Flow

`performInPlaceRollover()` (`WeeklyRolloverInPlace.gs:1019`) runs an 8-step sequence:

```
1. Validate preconditions (working file ID, venue name, week completion warning)
2. Generate week summary (iterate 6 day sheets, collect date / MOD / revenue)
3. Export multi-page PDF to Archive/YYYY/YYYY-MM/pdfs/
4. Create spreadsheet snapshot in Archive/YYYY/YYYY-MM/sheets/
5. Clear all sheet data via CLEARABLE_FIELDS (named range lookup)
6. Update dates to next week and rename tabs (e.g. "MONDAY 10/03/2026")
7. Verify and self-heal named ranges across all 6 day sheets    ← Sakura-only
8. Send notifications (email to Evan, Slack to test webhook)
```

The named range verification step (step 7) is unique to Sakura. It does not exist in Waratah because Waratah uses hardcoded cell references.

### Pre-conditions checked

- Script Property `SAKURA_WORKING_FILE_ID` is set and matches the active spreadsheet ID.
- Script Property `VENUE_NAME` equals `'SAKURA'`.
- Week completion check: counts day sheets with dates filled. Incomplete weeks log a warning but do NOT block the rollover.

### Idempotency

The rollover does not run an early-return idempotency check the way Waratah does. If invoked twice on the same Monday, it will archive twice and re-stamp dates. For this reason, manual re-runs after a partial failure should target the specific step that failed rather than re-invoking the top-level handler.

---

## 6. The Clear Step in Detail

Step 5, the data clear, is the most fragile step. It must clear input cells without touching formula cells, formatting, conditional formatting, data validation, cell notes, or named range bindings.

The implementation iterates `CLEARABLE_FIELDS` (lines 81-90), a list of **22 field keys**:

```
mod, date, fohStaff, bohStaff, cashCount, cashRecord,
pettyCashTransactions, shiftSummary, todoTasks, todoAssignees,
cashTips, cardTips, surchargeTips, productionAmount, deposit,
discounts, guestsOfNote, goodNotes, issues, kitchenNotes,
wastageComps, maintenance, rsaIncidents
```

This is **22 of the 24** `FIELD_CONFIG` keys (`RunSakura.gs:29-190`). The two excluded keys are:

- `netRevenue` (`isFormula: true`): the cell at `B54` holds a formula that aggregates the day's takings.
- (The 24th key is reserved; `CLEARABLE_FIELDS` enumerates 22 explicitly clearable inputs plus `netRevenue` formula-exclusion equals the full 24.)

Three rules enforced by the clear:

1. **Only `Range.clearContent()`**, never `sheet.clear()` (destroys formatting) or the non-existent `sheet.clearContent()` (throws TypeError).
2. **Only clearable fields**, derived from `CLEARABLE_FIELDS`. The formula field `netRevenue` is never cleared.
3. **Named range lookup via `getFieldRange(sheet, fieldKey)`**, never hard-coded cell addresses. This means adding or removing a clearable field is a one-line change in the array.

```javascript
// Illustrative pattern from WeeklyRolloverInPlace.gs
DAY_SHEETS.forEach(function (dayName) {
  var sheet = findSheetByDayPrefix_(spreadsheet, dayName);
  CLEARABLE_FIELDS.forEach(function (fieldKey) {
    try {
      var range = getFieldRange(sheet, fieldKey);  // named range lookup
      range.clearContent();                         // singular, on Range
    } catch (e) {
      Logger.log('Clear failed for ' + dayName + '.' + fieldKey + ': ' + e.message);
    }
  });
});
```

The TO-DOs tab (a separate sheet) is cleared from row 2 onwards in the same step; the header row is preserved.

---

## 7. The Date Update Step

Step 6 calculates next week's dates **from TODAY**, not from the spreadsheet's current dates. This is intentional: it prevents cascading date errors if the spreadsheet was left in a partial state and works correctly on a fresh template with no existing dates.

The anchor is **next Sunday** (week-ending). Six day offsets are applied to compute Monday through Saturday:

```
nextSunday = today + ((today.getDay() === 0) ? 7 : (7 - today.getDay()))
DAY_OFFSETS = [-6, -5, -4, -3, -2, -1]   // MONDAY..SATURDAY relative to Sunday
```

For each of the six day sheets:

1. Compute the target date as `nextSunday + DAY_OFFSETS[index]`.
2. Write the date via `getFieldRange(sheet, 'date')`.
3. Rename the tab to `DAYNAME DD/MM/YYYY` (e.g. `MONDAY 10/03/2026`).

Tabs ARE renamed every week. Named ranges remain bound because they target the sheet object, not the sheet name.

---

## 8. Named Range Verification (Step 7)

After clearing and date stamping, `verifyAndFixNamedRanges_()` iterates all six day sheets and calls `createNamedRangesOnSheet_()` for each. This walks the 24 `FIELD_CONFIG` entries and:

- Skips ranges that already exist and bind to the expected cell.
- Recreates any range that is missing or mis-bound, using the `fallback` cell from `FIELD_CONFIG`.

This self-healing step is Sakura-only. It exists because named ranges can become detached if a sheet is restructured, copied, or if a formula cell is overwritten in a way that breaks the binding. Without this step, the next nightly send would silently miss data on the affected sheet.

---

## 9. Archive Folder Structure

The Drive archive lives under the folder ID in `ARCHIVE_ROOT_FOLDER_ID` (`WeeklyRolloverInPlace.gs:52`). Layout is year / year-month / type:

```
[Archive Root Folder]
├── 2026/
│   ├── 2026-02/
│   │   ├── pdfs/
│   │   │   └── Sakura Shift Report W.E. 09.02.2026.pdf
│   │   └── sheets/
│   │       └── Sakura Shift Report W.E. 09.02.2026
│   └── 2026-03/
│       ├── pdfs/
│       └── sheets/
└── 2027/
    └── ...
```

`getOrCreateArchiveSubfolder_()` creates the YYYY then YYYY-MM then `{pdfs|sheets}` chain on demand, so no manual folder setup is required.

PDF filename: `Sakura Shift Report W.E. dd.mm.yyyy.pdf`.
Snapshot name: `Sakura Shift Report W.E. dd.mm.yyyy` (no extension; it is a Sheets file copy).

The PDF is a multi-page export of all six day sheets. Non-day sheets (warehouse tabs, TO-DOs, Instructions) are temporarily hidden via a try/finally so visibility is always restored even if the export throws.

---

## 10. Preview Rollover (Dry Run)

`previewInPlaceRollover()` performs a non-destructive simulation: it validates preconditions, reads the current week's summary, and reports what the destructive steps WOULD do. It does not archive, clear, or rename anything.

Run from menu: **Shift Report > Admin Tools > Weekly Rollover (In-Place) > Preview Rollover (Dry Run)**.

Also useful for inspection:

- `pw_openRolloverWizard`: opens the HTML rollover wizard sidebar (served from `UIServerSakura.gs:22`, template `rollover-wizard`).
- `pw_showRolloverConfig`: shows the rollover configuration (file IDs, archive root, timezone, email recipients). Read-only display, still password-gated (it is a `pw_*` wrapper).

Use Preview before any rollover where you have suspicion about state (e.g. a partial-failure re-run, or after a sheet restructure).

---

## 11. After Deployment, Reinstate Triggers

`clasp push` does not strictly destroy triggers, but practitioner experience is that renaming, moving, or significantly editing a handler function will cause Apps Script to silently delete the trigger that pointed at it. **Always verify triggers after every deployment.**

The reinstall procedure for the **shift report project** (2 triggers):

```
From the Sakura shift report spreadsheet menu:
  Shift Report > Admin Tools > Weekly Rollover (In-Place) > Create Rollover Trigger (Mon 10am)
  Shift Report > Admin Tools > Weekly Digest > (digest trigger setup menu item)
```

Or run the installers directly from the Apps Script editor:

- `createRolloverTrigger_Sakura()` for the Mon 10am rollover.
- `setupWeeklyDigestTrigger_Sakura()` for the Mon 8am revenue digest.

For the **task management project** (2 time-based + 1 on-edit), the installers must be run directly from the Apps Script editor's function picker (they are not exposed in the manager-facing menu):

- `createDailyMaintenanceTrigger()` for daily 7am task maintenance.
- `createWeeklySummaryTrigger()` for Mon 6am weekly active task summary.
- `createOnEditTrigger()` for the auto-sort on-edit trigger.

After running, open the Apps Script editor's **Triggers** panel (clock icon, left sidebar) and confirm all five triggers exist with the expected schedules.

---

## 12. Removing Triggers

For the rollover, use the menu: **Shift Report > Admin Tools > Weekly Rollover (In-Place) > Remove Rollover Trigger** (handler: `pw_removeRolloverTrigger_Sakura`).

For the other triggers, delete them via the Apps Script editor's Triggers panel. There are no dedicated "remove" wrapper functions for the digest or task management triggers; the installers do their own defensive delete-then-create, so removing them is an editor-side operation.

---

## 13. Manual Rollover

To run the rollover ad hoc (e.g. the Monday 10am trigger fired but failed mid-way), use the menu: **Shift Report > Admin Tools > Weekly Rollover (In-Place) > Run Rollover Now** (handler: `pw_performInPlaceRollover`).

The rollover does NOT have a built-in early-return idempotency check, so re-running after a partial failure requires care:

- If steps 1-4 completed (archive PDF, snapshot, but data was not cleared): re-running will create a second archive copy. Acceptable, but expect duplicates in Drive.
- If steps 5-6 partially completed (some sheets cleared, some not, or dates partially updated): re-run the specific helper that failed rather than the top-level handler.

Each helper is callable directly from the Apps Script editor:

```javascript
clearAllSheetData_(SpreadsheetApp.getActiveSpreadsheet());
updateDatesToNextWeek_(SpreadsheetApp.getActiveSpreadsheet());
verifyAndFixNamedRanges_(SpreadsheetApp.getActiveSpreadsheet());
```

---

## 14. Formula Preservation, in Detail

The CLEARABLE_FIELDS list is the only line of defense between the rollover and the formula at `B54` (`netRevenue`). Two important properties:

1. **`netRevenue` is excluded from CLEARABLE_FIELDS** because its `FIELD_CONFIG` entry has `isFormula: true` (`RunSakura.gs:29-190`).
2. **Other cells with downstream formulas are still clearable.** For example, the cash count grid (`C10:E17`) is an input grid; its contents feed a cash variance auto-calc elsewhere on the sheet. The variance cell is itself a formula, but it is not part of the day sheet's documented FIELD_CONFIG and so is never targeted by the clear loop. Clearing inputs and letting downstream formulas recompute against empty inputs is the intended behaviour.

If a future change adds a new formula cell to a day sheet, add it to `FIELD_CONFIG` with `isFormula: true` and ensure it is NOT in `CLEARABLE_FIELDS`. The verification step (step 7) will then rebind it correctly on next rollover.

---

## 15. Recovery from a Failed Rollover

The rollover does not auto-recover. From a developer perspective the recovery procedure is:

1. Open the Apps Script editor's **Executions** log and identify which step failed (the helper name appears in the stack trace).
2. Reverse any completed destructive steps if necessary (rare; most failures occur before the clear step).
3. Re-run the relevant helper directly, or invoke `performInPlaceRollover()` again from the Apps Script editor. Because each step is in its own helper and the destructive steps are append-only (archives) or idempotent at the cell level (clear, date stamp), re-runs are safe for the data even though they may create duplicate Drive archives.

Admin-facing troubleshooting steps (timezone, named-range repair, PDF visibility recovery) live in [`for-admins/03-advanced-troubleshooting.md`](../for-admins/03-advanced-troubleshooting.md).

---

## 16. Comparison with Waratah

The two venues use the same in-place model, with these implementation differences:

| Aspect | Sakura House | The Waratah |
|---|---|---|
| Cell system | Named ranges via `getFieldRange()` | Named ranges with hardcoded-cell fallback |
| Operating days | 6 (Mon-Sat) | 5 (Wed-Sun) |
| Rollover schedule | Mon 10:00 | Mon 21:00 |
| Date anchor | Next Sunday (week ending) | Next Wednesday (week start) |
| Tab renaming | Yes (`MONDAY 10/03/2026`) | Yes (`WEDNESDAY 21/05/2026`) |
| Clearable fields | 22 keys (excludes `netRevenue`) | derived from FIELD_CONFIG `isFormula` |
| Named range verify step | Yes (step 7) | No (different rollover structure) |
| Notifications | Email to Evan + Slack test webhook | Slack on failure only |

The duplication model (one fresh spreadsheet per week) is deprecated in both venues. Do not reintroduce it.

---

## 17. Summary

The rollover runs once a week and a bug in any step can take 30+ minutes to recover from. Defensive practices to maintain:

1. Always use `Range.clearContent()` for clearing; never `sheet.clear()` or the non-existent `sheet.clearContent()`.
2. Always derive clearable fields from the `CLEARABLE_FIELDS` array; never hard-code cell addresses.
3. Always include `isFormula: true` in `FIELD_CONFIG` for any new formula cell, and ensure it is excluded from `CLEARABLE_FIELDS`.
4. Always wrap each clear in try/catch with a diagnostic `Logger.log`.
5. Always verify all five triggers after every `clasp push`.
6. Always test changes via Preview Rollover (dry run) before scheduling.

For admin-facing rollover and trigger issues (recovery walkthroughs, timezone fixes, named range repair scripts), see [`for-admins/03-advanced-troubleshooting.md`](../for-admins/03-advanced-troubleshooting.md).
