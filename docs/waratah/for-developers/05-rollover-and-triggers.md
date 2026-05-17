# Rollover and Triggers

**Audience:** Developers maintaining the weekly rollover or modifying any time-based trigger in either Apps Script project.

The Waratah system uses an **in-place rollover** model: one shift report spreadsheet, archived weekly to Drive, with input cells cleared in place rather than the spreadsheet being duplicated. This file covers the rollover's internal mechanics and the project's trigger management patterns.

---

## 1. In-Place Rollover Model

The rollover does five things on Monday at 9pm:

1. Archives a PDF of the week's shift report to Drive.
2. Saves a full spreadsheet copy to Drive (named with the week-ending date).
3. Renames each day tab from this week's date to next week's date.
4. Clears manager input cells across all 5 day tabs (formula cells preserved).
5. Posts a Slack confirmation and emails the week summary.

After step 4, the spreadsheet is ready for the new week's Wednesday service. Formulas continue to work because the underlying named ranges still exist and still target the same cells; the cells are simply empty.

This contrasts with a "duplication" model where each week starts with a fresh copy of the template. The in-place model has these properties:

| Property | Pro | Con |
|---|---|---|
| One permanent spreadsheet | Bookmarks never break; URL stable | Risk that a single corrupted state affects multiple weeks |
| Formulas preserved | No re-binding needed each week | Adds complexity to clear logic (formula cells excluded) |
| Archive in Drive | Permanent record | Drive permissions must be maintained |

---

## 2. Trigger Setup, Shift Report Project

Three time-based triggers in `THE WARATAH/SHIFT REPORT SCRIPTS/`:

| Trigger | Function | Schedule | Installer |
|---|---|---|---|
| Weekly Rollover | `runWaratahWeeklyRollover` | Mon 21:00 | `createRolloverTrigger_Waratah()` in `WeeklyRolloverInPlaceWaratah.js` line 810 |
| Revenue Digest | `sendWeeklyRevenueDigest_Waratah` | Mon 16:00 | `setupWeeklyDigestTrigger_Waratah()` in `WeeklyDigestWaratah.js` |
| Weekly Backfill | `runWeeklyBackfill_` | Mon 02:00 | `setupWeeklyBackfillTrigger()` in `IntegrationHubWaratah.js` |

### Installer pattern

Each installer follows the same defensive pattern:

```javascript
function createRolloverTrigger_Waratah() {
  // Remove any existing triggers for this function before creating a new one.
  const existing = ScriptApp.getProjectTriggers();
  for (const t of existing) {
    if (t.getHandlerFunction() === 'runWaratahWeeklyRollover') {
      ScriptApp.deleteTrigger(t);
    }
  }

  // Create the new trigger
  ScriptApp.newTrigger('runWaratahWeeklyRollover')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(21)
    .inTimezone('Australia/Sydney')
    .create();

  Logger.log('Weekly rollover trigger installed: Monday 21:00 Australia/Sydney');
}
```

The defensive delete is essential. Google Apps Script caps each project at 20 triggers; if an installer is re-run without the delete, duplicates accumulate and eventually hit the cap.

---

## 3. Trigger Setup, Task Management Project

Five time-based triggers + one on-edit trigger in `THE WARATAH/TASK MANAGEMENT SCRIPTS/EnhancedTaskManagementWaratah.gs`:

| Trigger | Function | Schedule | Installer |
|---|---|---|---|
| Daily maintenance | `runDailyTaskMaintenance` | Daily 07:00 | `createDailyMaintenanceTrigger()` |
| Weekly summary | `sendWeeklyActiveTasksSummary` | Mon 10:00 | `createWeeklySummaryTrigger()` |
| Bi-hourly cleanup | `cleanupAndSortMasterActionables` | Every 2 hours | `createBiHourlyCleanupTrigger()` |
| Daily staff workload | `runScheduledStaffWorkload` | Daily 06:00 | `createDailyStaffWorkloadTrigger()` |
| Weekly archive | `runScheduledArchive` | Mon 06:00 | `createWeeklyArchiveTrigger()` |
| On-edit | `onTaskSheetEditWithAutoSort` | On any cell edit | `createOnEditTrigger()` |

There is also a seventh installer, `createWeeklyOverdueSummaryTrigger`, kept in code for backwards compatibility but the corresponding handler `sendOverdueTasksSummary_` was gutted to a no-op in April 2026. **Do not recreate this trigger**; it does nothing useful at runtime.

---

## 4. The Rollover Execution Flow

`performWeeklyRollover()` (also `runWaratahWeeklyRollover` for the trigger handler) runs a strict 11-step sequence:

```
1. Acquire script lock (60s timeout)
2. _warValidatePreconditions_(spreadsheet)
3. _warAlreadyRolledOver_(spreadsheet)  ← idempotency check
4. _warGenerateWeekSummary_(spreadsheet)  ← collect totals for the email
5. _warExportPdfToArchive_(spreadsheet, weekEndDate)
6. _warCreateArchiveSnapshot_(spreadsheet, weekEndDate)
7. _warClearAllSheetData_(spreadsheet)  ← clears manager inputs only
8. _warUpdateAllTabDates_(spreadsheet)
9. Email rollover summary
10. Post Slack confirmation
11. _warValidateRolloverResult_(spreadsheet)  ← post-condition check
12. Release lock
```

Each step is in its own helper function. The underscored names (`_war*_`) discourage external calls.

### Pre-conditions checked

```javascript
function _warValidatePreconditions_(spreadsheet) {
  // 1. Sheet exists and is the Waratah file (check by name and ARCHIVE_ROOT_FOLDER_ID property)
  // 2. All 5 day tabs (Wednesday-Sunday) present
  // 3. Each day tab has a valid date in the named range
  // 4. No in-progress nightly send (check script lock state)
}
```

If any precondition fails, throw early. The rollover does not proceed to destructive steps.

### Idempotency check

```javascript
function _warAlreadyRolledOver_(spreadsheet) {
  const wednesdayDate = getFieldValue('date', 'Wednesday');
  const today = new Date();

  // If Wednesday's date is in the future, rollover already ran (tab dates were updated to next week)
  if (wednesdayDate > today) return true;
  return false;
}
```

If a rollover ran earlier today (manual or scheduled), the dates point at next week. A second rollover would compound and shift dates two weeks forward, which is wrong. The idempotency check prevents this.

---

## 5. The Clear Step in Detail

Step 7, `_warClearAllSheetData_`, is the rollover's most fragile step. It must clear input cells without touching:

- Formula cells (would lose calculations)
- Label cells (would break the layout)
- Conditional formatting
- Data validation rules
- Cell notes
- Named range bindings

The implementation:

```javascript
function _warClearAllSheetData_(spreadsheet) {
  const dayTabs = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const clearableKeys = getClearableFieldKeys_();  // derived from FIELD_CONFIG isFormula

  for (const tabName of dayTabs) {
    for (const fieldKey of clearableKeys) {
      try {
        const range = getFieldRange(fieldKey, tabName);
        range.clearContent();  // singular, on Range, clears values only
      } catch (e) {
        Logger.log(`Clear failed for ${tabName}.${fieldKey}: ${e.message}`);
      }
    }
  }
}
```

Three rules enforced:

1. **Only `Range.clearContent()`**, never `sheet.clear()` (destroys formatting) or `sheet.clearContent()` (does not exist on Sheet, throws TypeError).
2. **Only clearable fields**, derived from `getClearableFieldKeys_()` filtering `isFormula === false`. Formula cells are never cleared.
3. **Wrap each clear in try/catch.** If one named range is mis-bound, the others should still clear. The `Logger.log` line surfaces the issue for post-rollover diagnostics.

After the clear, run `_warValidateRolloverResult_` to confirm formula cells still have their formulas and clearable cells are empty.

---

## 6. The Date Update Step

Step 8, `_warUpdateAllTabDates_`, renames each day tab to next week's date and updates the date in the date cell.

```javascript
function _warUpdateAllTabDates_(spreadsheet) {
  const today = new Date();
  const nextWednesday = _warCalculateNextSunday_(today); // Wed = Sun - 4 days

  const dayTabs = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const offsets = WAR_ROLLOVER_OFFSETS; // { Wednesday: 0, Thursday: 1, Friday: 2, Saturday: 3, Sunday: 4 }

  for (const tabName of dayTabs) {
    const offset = offsets[tabName];
    const dayDate = new Date(nextWednesday);
    dayDate.setDate(dayDate.getDate() + offset);

    const sheet = spreadsheet.getSheetByName(tabName);
    if (!sheet) continue;

    // Set the date cell
    setFieldValue('date', tabName, toDateOnly_(dayDate));

    // Update the header text cell that shows "Wednesday 17 May 2026" etc.
    const headerRange = sheet.getRange('B1');
    headerRange.setValue(`${tabName} ${formatDate(dayDate)}`);
  }
}
```

`_warCalculateNextSunday_` is the date-arithmetic helper used. It returns the next Sunday (the week-ending date), then offsets give Wed-Sun.

Note: the tab name itself stays the same (always "Wednesday"). Only the date cell and header text change. This is the in-place model in action.

---

## 7. Archive Folder Structure

The Drive archive lives under the folder ID in `ARCHIVE_ROOT_FOLDER_ID`. Layout:

```
[Archive Root Folder]
├── 2026-W17/
│   ├── Waratah_Week_2026-04-26.pdf       ← PDF export of all 5 day tabs
│   ├── Waratah_Shift_Report_2026-04-26.gsheet  ← Full spreadsheet snapshot
│   └── (cash recon weekly file linked from CASH_RECON_FOLDER_ID, not duplicated)
├── 2026-W18/
└── ...
```

Each week's folder name is `YYYY-Www` (ISO 8601 week format). The folder is auto-created if missing on rollover. The naming inside is fixed.

```javascript
function _warGetArchivePath_(weekEndDateStr) {
  const date = new Date(weekEndDateStr);
  const year = date.getFullYear();
  const week = getISOWeek_(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}
```

---

## 8. Preview Rollover (Dry Run)

`_warDryRun_()` performs a non-destructive simulation: it walks through the validation, generates the week summary, but does not archive, clear, or rename. Output is a JSON object showing what *would* happen.

```javascript
function _warDryRun_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return {
    preconditions: _warValidatePreconditions_(spreadsheet),
    summary: _warGenerateWeekSummary_(spreadsheet),
    cellsThatWouldClear: _warListClearableCells_(spreadsheet),
    nextDates: _warComputeNextDates_(spreadsheet),
    archivePath: _warGetArchivePath_(formatDate(new Date()))
  };
}
```

Run from menu: **Admin Tools > Preview Rollover (Dry Run)**. Use before any rollover where you have suspicion about state (e.g. a partial-failure rollover that you are re-running).

---

## 9. After Deployment, Reinstall Triggers

`clasp push` may destroy triggers because Apps Script ties them to handler function names; renaming or moving a function causes the trigger to be deleted silently.

The post-deployment reinstall procedure for the Shift Report project (3 triggers):

```
From the spreadsheet menu:
  Admin Tools > Reinstall Weekly Rollover Trigger
  Admin Tools > Reinstall Revenue Digest Trigger
  Admin Tools > Reinstall Weekly Backfill Trigger
```

Each calls the installer function with the defensive-delete pattern (Section 2). After all three, open the Apps Script editor's Triggers panel and confirm 3 triggers exist with the expected schedules.

For the Task Management project, equivalent menu items exist for the 5 time-based triggers plus the on-edit trigger.

---

## 10. Trigger Inspection

To audit installed triggers from code:

```javascript
function inspectTriggers_() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const t of triggers) {
    Logger.log(`${t.getHandlerFunction()} - ${t.getEventType()}`);
    if (t.getEventType() === ScriptApp.EventType.CLOCK) {
      Logger.log(`  Schedule: ${t.getTriggerSource()}`);
    }
  }
}
```

Or from the Apps Script editor: left sidebar > Triggers panel. Each project's triggers are listed there with handler function, event type, schedule, and last execution.

---

## 11. Common Rollover Issues

### "Rollover ran but data wasn't cleared"

Cause: the named ranges are mis-bound (wrong-sheet binding bug). The clear step iterated `getClearableFieldKeys_()` and tried to clear each, but the actual cells targeted were on the wrong day tab.

Fix: run `verifyWaratahNamedRanges_()` to identify mis-bound ranges, run `createNamedRangesOnActiveSheet()` to rebind. Then re-run the rollover (idempotency check will block, so first run `_warMarkUnrolledOver_()` if available, or manually clear the next-week dates that the rollover already set).

### "Rollover threw mid-way"

Cause: a single step failed (Drive permission revoked, network blip, lock contention).

Fix: the rollover does NOT auto-recover. Manual intervention:
1. Identify which step failed (Apps Script Executions log).
2. Reverse any completed destructive steps if necessary (rare).
3. Re-run `performWeeklyRollover()` from the menu. The idempotency check + per-step state will skip already-completed steps and resume.

### "Tab renamed but data still in cells"

Partial-failure state: step 8 ran, step 7 did not (or vice versa). Fix by running the unfinished step's helper directly:
```
SpreadsheetApp.getUi() lacks; from Apps Script editor:
  _warClearAllSheetData_(SpreadsheetApp.getActiveSpreadsheet());
```

Then verify with `_warValidateRolloverResult_`.

---

## 12. The Weekly Backfill (Mon 2am)

The backfill runs five hours before the rollover. It re-pushes any night's data that did not land in the warehouse during the original send.

This is detailed in [`04-warehouse-schemas.md`](04-warehouse-schemas.md) Section 9. The key for this file: the backfill needs the day tabs to still have the past week's data, which is why it runs Mon 2am (before the rollover at Mon 9pm clears them).

If the backfill were run AFTER rollover, the day tabs would have next week's empty cells and the backfill would write nothing useful. Order matters.

---

## 13. Comparison with Duplication Model (Sakura)

Sakura uses an in-place rollover system identical in structure (the WeeklyRolloverInPlaceSakura.js file is the sibling). Earlier versions of both venues used a duplication model (the rollover would create a fresh copy of a template each week and the old file would archive). The in-place model replaced it because:

- Bookmarks (the production spreadsheet's URL) stayed stable.
- Named range bindings did not need re-applying each week.
- Drive permissions were simpler (only the archive folder needs management).
- Formula cells across weeks could share calculation logic via week-to-week comparison formulas.

The duplication model is deprecated. Do not reintroduce it.

---

## 14. Summary

The rollover is the single most critical piece of automation in the Waratah codebase. It runs once a week, has 11 sequential steps, and a bug in any step can corrupt the state in a way that takes 30+ minutes to recover.

Defensive practices to maintain:

1. Always use `Range.clearContent()` for clearing; never `sheet.clear()`.
2. Always derive clearable lists from `getClearableFieldKeys_()`; never hard-code.
3. Always wrap each step in try/catch with diagnostic Logger.log.
4. Always run the idempotency check at the top.
5. Always reinstall triggers after deployment.
6. Test changes via Preview Rollover (dry run) before scheduling.

For trigger-side issues, see [`for-admins/03-advanced-troubleshooting.md`](../for-admins/03-advanced-troubleshooting.md) Section 6.
