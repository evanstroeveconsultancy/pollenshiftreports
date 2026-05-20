# Rollover and Triggers

**Audience:** Developers maintaining the weekly rollover or modifying any time-based trigger in either Apps Script project.

The Waratah system uses an **in-place rollover** model: one shift report spreadsheet, archived weekly to Drive, with input cells cleared in place rather than the spreadsheet being duplicated. This file covers the rollover's internal mechanics and the project's trigger management patterns.

---

## 1. In-Place Rollover Model

The rollover does the following on Monday at 9pm:

1. Archives a PDF of the week's shift report to Drive.
2. Saves a full spreadsheet copy to Drive (named with the week-ending date).
3. Clears manager input cells across the active day tabs (formula cells preserved).
4. Renames all 7 day tabs (Mon-Sun) and updates the B3:F3 date row with next week's date.

There is no email-summary step and no Slack-on-success step. Slack only fires from `_warValidateRolloverResult_` on failure; the success path shows a `SpreadsheetApp.getUi().alert` when run interactively.

After the clear, the spreadsheet is ready for the new week's Wednesday service. Formulas continue to work because the underlying named ranges still exist and still target the same cells; the cells are simply empty.

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
| Revenue Digest | `sendWeeklyRevenueDigest_Waratah` | Mon 16:00 | `setupAllTriggers_Waratah()` in `MenuWaratah.js` (canonical) |
| Weekly Backfill | `runWeeklyBackfill_` | Mon 08:00 | `setupWeeklyBackfillTrigger()` in `IntegrationHubWaratah.js` |

**Note on Revenue Digest installers:** two installers exist. `setupAllTriggers_Waratah` in `MenuWaratah.js` is the canonical one used at deploy time. A lone-installer `setupWeeklyDigestTrigger_Waratah` in `WeeklyDigestWaratah.js` historically scheduled a different time; treat `setupAllTriggers_Waratah` as the source of truth.

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
| Daily maintenance | `runDailyTaskMaintenance` | Daily 06:00 (Apps Script 6-7am window) | `createDailyMaintenanceTrigger()` |
| Weekly summary | `sendWeeklyActiveTasksSummary` | Mon 10:00 | `createWeeklySummaryTrigger()` |
| Bi-hourly cleanup | `cleanupAndSortMasterActionables` | Every 2 hours | `createBiHourlyCleanupTrigger()` |
| Daily staff workload | `runScheduledStaffWorkload` | Daily 06:00 | `createDailyStaffWorkloadTrigger()` |
| Weekly archive | `runScheduledArchive` | Mon 06:00 | `createWeeklyArchiveTrigger()` |
| On-edit | `onTaskSheetEditWithAutoSort` | On any cell edit | `createOnEditTrigger()` |

There is also a seventh installer, `createWeeklyOverdueSummaryTrigger`. Calling it does nothing. Its entire body is a single log line; it does not create any trigger. The public trigger-bound wrapper `runScheduledOverdueSummary` is also gutted to a no-op. The internal handler `sendOverdueTasksSummary_` (lines 1347-1424) is still fully implemented but is unreachable from any installed trigger.

---

## 4. The Rollover Execution Flow

`runWaratahWeeklyRollover` runs an 11-step internal sequence (WeeklyRolloverInPlaceWaratah.js:92-220):

```
1. Acquire script lock (30s timeout)
2. _warValidatePreconditions_(spreadsheet)
3. _warAlreadyRolledOver_(spreadsheet)  ← idempotency check; early return if true
4. _warGenerateWeekSummary_(spreadsheet)
5. _warExportPdfToArchive_(spreadsheet, weekEndDate)
6. _warCreateArchiveSnapshot_(spreadsheet, weekEndDate)
7. _warClearAllSheetData_(spreadsheet)  ← clears manager inputs only
8. _warUpdateAllTabDates_(spreadsheet)
9. Verify named ranges (non-blocking)
10. _warValidateRolloverResult_(spreadsheet)  ← post-condition check
11. Named range health check (non-blocking)
```

There is no email-summary step and no Slack-on-success step. Slack only fires from `_warValidateRolloverResult_` on failure. Each step is in its own helper function; the underscored names (`_war*_`) discourage external calls.

### Pre-conditions checked

Real checks at lines 242-280:

1. Script Property `WARATAH_WORKING_FILE_ID` is set.
2. The active spreadsheet's ID matches `WARATAH_WORKING_FILE_ID`.
3. Script Property `VENUE_NAME` equals `'WARATAH'`.
4. Script Property `ARCHIVE_ROOT_FOLDER_ID` is set and the folder is accessible.
5. The `WEDNESDAY` sheet exists.

There is no check for "valid date in named range" and no check for "no in-progress nightly send". If any precondition fails, the rollover throws early before any destructive step.

### Idempotency check

Real logic (lines 290-311) compares the formatted date string in the current Wednesday tab's B3 cell against the expected next-Wednesday date string and returns true only when they match:

```javascript
function _warAlreadyRolledOver_(spreadsheet) {
  var wedSheet = spreadsheet.getSheetByName('WEDNESDAY'); // or current-renamed match
  var currentDateStr = Utilities.formatDate(parseCellDate_(wedSheet.getRange('B3').getValue()),
                                            'Australia/Sydney', 'dd/MM/yyyy');
  var expectedNextWedDate = _warComputeNextWednesday_(new Date());
  var expectedStr = Utilities.formatDate(expectedNextWedDate, 'Australia/Sydney', 'dd/MM/yyyy');
  return currentDateStr === expectedStr;
}
```

If a rollover ran earlier today, B3 already holds next week's date string and the check returns true, short-circuiting before any destructive step.

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

Step 8, `_warUpdateAllTabDates_` (WeeklyRolloverInPlaceWaratah.js:628-664), iterates **all 7 day names** (`WAR_ROLLOVER_ALL_DAYS = ['MONDAY', ..., 'SUNDAY']`, not just Wed-Sun) and updates each day's date row.

Each tab IS renamed by the rollover. The new tab name format is `'WEDNESDAY 21/05/2026'` (uppercase day, space, then `dd/MM/yyyy` date). The underlying sheet object stays the same, so named ranges still target the same cells.

The date row written is `B3:F3` (cleared first, then col B3 set):

```javascript
// Illustrative excerpt; see WeeklyRolloverInPlaceWaratah.js:628-664
WAR_ROLLOVER_ALL_DAYS.forEach(function (dayName) {
  var sheet = findSheetByDayPrefix_(spreadsheet, dayName);
  if (!sheet) return;

  var dayDate = computeDateForDay_(nextWeekWednesday, dayName);
  var formattedDate = Utilities.formatDate(dayDate, 'Australia/Sydney', 'dd/MM/yyyy');

  // Update the B3:F3 date row
  var dateRange = sheet.getRange('B3:F3');
  dateRange.clearContent();
  dateRange.getCell(1, 1).setValue(formattedDate);

  // Rename the tab to include the new date
  var newTabName = dayName + ' ' + formattedDate;
  sheet.setName(newTabName);
});
```

Tabs ARE renamed every week. Named ranges remain bound because they target the sheet object, not the sheet name.

---

## 7. Archive Folder Structure

The Drive archive lives under the folder ID in `ARCHIVE_ROOT_FOLDER_ID`. Layout is year / year-month / type, not ISO weeks. There is no `getISOWeek_` helper anywhere in the codebase.

```
[Archive Root Folder]
├── 2026/
│   ├── 2026-04/
│   │   ├── pdfs/
│   │   │   └── Waratah Shift Report W.E. 26.04.2026.pdf
│   │   └── sheets/
│   │       └── Waratah Shift Report W.E. 26.04.2026
│   └── 2026-05/
│       ├── pdfs/
│       └── sheets/
└── ...
```

`_warGetOrCreateArchiveSubfolder_` and `_warGetArchivePath_` (WeeklyRolloverInPlaceWaratah.js:528-553) build the YYYY → YYYY-MM → {pdfs|sheets} chain, creating each folder if missing.

PDF filename: `Waratah Shift Report W.E. dd.mm.yyyy.pdf`.
Snapshot name: `Waratah Shift Report W.E. dd.mm.yyyy` (no extension; it is a Sheets file copy).

---

## 8. Preview Rollover (Dry Run)

`_warDryRun_()` (WeeklyRolloverInPlaceWaratah.js:675-722) performs a non-destructive simulation: it walks the validation steps, builds a plain-text report under section headers ("Preconditions", "Idempotency", "Next week tab renames", "Fields to clear per active day"), logs the report, and shows it in a `SpreadsheetApp.getUi().alert`. It does not return a JSON object. Helpers `_warListClearableCells_` and `_warComputeNextDates_` do not exist; the section content is built inline.

Run from menu: **Admin Tools > Preview Rollover (Dry Run)**. Use before any rollover where you have suspicion about state (e.g. a partial-failure rollover that you are re-running).

---

## 9. After Deployment, Reinstate Triggers

`clasp push` may destroy triggers because Apps Script ties them to handler function names; renaming or moving a function causes the trigger to be deleted silently.

The post-deployment reinstall procedure for the Shift Report project (3 triggers, installed via one menu action):

```
From the spreadsheet menu:
  Waratah Tools > Admin Tools > Setup & Utilities > Setup All SR Triggers
```

`setupAllTriggers_Waratah()` (MenuWaratah.js:218) deletes any existing triggers for the three handlers (`runWaratahWeeklyRollover`, `runWeeklyBackfill_`, `sendWeeklyRevenueDigest_Waratah`, plus legacy `performWeeklyRollover`) and creates fresh ones at Mon 9pm, Mon 8am, and Mon 4pm respectively. Alternatively, install individually via:

```
  Waratah Tools > Admin Tools > Weekly Reports > Weekly Rollover (In-Place) > Create Rollover Trigger (Mon 9pm)
  Waratah Tools > Admin Tools > Weekly Digest > Setup Monday 4pm Digest Trigger
  Waratah Tools > Admin Tools > Data Warehouse > Setup Weekly Backfill Trigger
```

After running, open the Apps Script editor's Triggers panel and confirm 3 triggers exist with the expected schedules.

For the Task Management project, the equivalent menu lives under `Task Management > 🔐 Admin Tools > 🔧 Setup Triggers`. Items are `Create Edit Trigger (Auto-sort)`, `Create Weekly Summary Trigger (Mon 10am)`, `Create Bi-Hourly Cleanup Trigger (Every 2hrs)`, `Create Daily Staff Workload Trigger (6am)`, `Create Weekly Archive Trigger (Mon 6am)`. The daily maintenance trigger (`runDailyTaskMaintenance` at 6am) is not exposed in the menu and must be installed via the Apps Script editor.

---

## 10. Trigger Inspection

There is no standalone `inspectTriggers_` helper in the codebase. To audit installed triggers, use the Apps Script editor's left sidebar > Triggers panel, or run a one-off snippet against `ScriptApp.getProjectTriggers()` from the editor. Each project's triggers are listed there with handler function, event type, schedule, and last execution.

---

## 11. Common Rollover Issues

### "Rollover ran but data wasn't cleared"

Cause: the named ranges are mis-bound (wrong-sheet binding bug). The clear step iterated `getClearableFieldKeys_()` and tried to clear each, but the actual cells targeted were on the wrong day tab.

Fix: run `verifyWaratahNamedRanges_()` to identify mis-bound ranges, run `createNamedRangesOnActiveSheet()` to rebind. Then re-run the rollover. The idempotency check compares B3 to the expected next-Wednesday date, so if dates were already advanced you need to manually revert B3 across the day tabs before re-running (there is no `_warMarkUnrolledOver_` helper).

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

## 12. The Weekly Backfill (Mon 8am)

The backfill runs 13 hours before the rollover. It re-pushes any night's data that did not land in the warehouse during the original send.

This is detailed in [`04-warehouse-schemas.md`](04-warehouse-schemas.md) Section 9. The key for this file: the backfill needs the day tabs to still have the past week's data, which is why it runs Mon 8am (before the rollover at Mon 9pm clears them).

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
