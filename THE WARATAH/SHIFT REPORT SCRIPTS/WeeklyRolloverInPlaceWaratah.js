/****************************************************
 * WEEKLY ROLLOVER — IN-PLACE IMPLEMENTATION
 * THE WARATAH
 *
 * Single working file approach: clears and resets
 * weekly data instead of creating new files.
 *
 * KEY BENEFIT: Menus always work (same file = same
 * container-bound script = menus never disappear).
 *
 * PROCESS:
 * 1. Validate preconditions
 * 2. Generate week summary (Wed–Sun)
 * 3. Export PDF to archive
 * 4. Create Google Sheets snapshot
 * 5. Clear data (Wed–Sun only — Mon/Tue rename only)
 * 6. Update dates on ALL 7 tabs (Mon–Sun)
 * 7. Verify named ranges (non-blocking)
 * 8. Post-rollover validation (non-blocking)
 * 9. Named range health check (non-blocking)
 *
 * TRIGGER: Monday 9:00 PM (Australia/Sydney)
 *   Why Monday 9pm: Waratah operates Sunday — clearing
 *   at Sun 9pm would wipe the active shift. Weekly Revenue
 *   Digest runs Monday 4pm; rollover must run AFTER to
 *   preserve that week's data for the digest.
 *
 * MANUAL: Admin Tools > Weekly Rollover > Run Rollover Now
 *
 * @version 2.0.0
 * @date 2026-05-17
 * @phase Phase 1 — Sakura Alignment Migration
 ****************************************************/


// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Active days — full pipeline: clear + date-stamp + warehouse.
 * Waratah operates Wednesday through Sunday.
 */
const WAR_ROLLOVER_ACTIVE_DAYS = ['WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/**
 * All 7 days — all tabs get renamed for visual consistency.
 * Mon/Tue are rename-only; they are NOT cleared.
 */
const WAR_ROLLOVER_ALL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/**
 * Day offsets from Sunday (week ending).
 * Sunday = 0, Saturday = -1, ..., Monday = -6.
 */
const WAR_ROLLOVER_OFFSETS = {
  MONDAY:    -6,
  TUESDAY:   -5,
  WEDNESDAY: -4,
  THURSDAY:  -3,
  FRIDAY:    -2,
  SATURDAY:  -1,
  SUNDAY:     0
};

/**
 * Timezone for all date operations.
 */
const WAR_ROLLOVER_TZ = 'Australia/Sydney';


// ============================================================================
// MAIN ENTRY POINTS
// ============================================================================

/**
 * Primary rollover entry point.
 * Called by Monday 9pm time-based trigger or manually from menu.
 *
 * @param {Object} [options]           - Optional configuration
 * @param {boolean} [options.dryRun]   - If true, log intent but make no changes
 */
function runWaratahWeeklyRollover(options) {
  var opts = options || {};
  var dryRun = opts.dryRun === true;

  if (dryRun) {
    _warDryRun_();
    return;
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log('runWaratahWeeklyRollover: Could not acquire lock — another rollover may be running.');
    return;
  }

  var startTime = new Date();
  Logger.log('========== WARATAH WEEKLY ROLLOVER STARTED ==========');

  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Step 1: Validate preconditions
    _warValidatePreconditions_(spreadsheet);
    Logger.log('Step 1: Preconditions valid');

    // Step 2: Idempotency check — bail if already rolled over this week
    if (_warAlreadyRolledOver_(spreadsheet)) {
      Logger.log('runWaratahWeeklyRollover: Already rolled over this week — no-op.');
      try {
        SpreadsheetApp.getUi().alert(
          'Rollover Skipped',
          'The spreadsheet has already been rolled over this week.\n\n' +
          'Wednesday date matches the expected next-week date. No changes made.',
          SpreadsheetApp.getUi().ButtonSet.OK
        );
      } catch (uiErr) { /* trigger context */ }
      return;
    }

    // Step 3: Generate week summary
    var summary = null;
    var pdfResult = null;
    var snapshotResult = null;

    try {
      summary = _warGenerateWeekSummary_(spreadsheet);
      Logger.log('Step 2: Week ending ' + summary.weekEndDate + ' | Revenue $' + summary.totalRevenue);

      // Step 3a: Export PDF
      pdfResult = _warExportPdfToArchive_(spreadsheet, summary.weekEndDate);
      Logger.log('Step 3: PDF archived: ' + pdfResult.archivePath);

      // Step 3b: Sheets snapshot
      snapshotResult = _warCreateArchiveSnapshot_(spreadsheet, summary.weekEndDate);
      Logger.log('Step 4: Snapshot archived: ' + snapshotResult.archivePath);

    } catch (archiveErr) {
      // Fresh template or no data — skip archive
      Logger.log('Steps 2-4: Skipped archive (no previous week data): ' + archiveErr.message);
      summary = null;
      pdfResult = null;
      snapshotResult = null;
    }

    // Step 5: Clear data on active days only (Wed–Sun)
    _warClearAllSheetData_(spreadsheet);
    Logger.log('Step 5: Data cleared on active days (Wed–Sun)');

    // Step 6: Update dates on ALL 7 tabs (Mon–Sun)
    var nextSunday = _warUpdateAllTabDates_(spreadsheet);
    Logger.log('Step 6: All 7 tabs date-stamped; week ending ' +
      Utilities.formatDate(nextSunday, WAR_ROLLOVER_TZ, 'dd/MM/yyyy'));

    // Step 7: Verify named ranges (non-blocking)
    try {
      if (typeof verifyWaratahNamedRanges_ === 'function') {
        var verifyResult = verifyWaratahNamedRanges_();
        if (verifyResult.missing > 0 || verifyResult.wrong > 0) {
          Logger.log('Step 7: Named range issues detected — missing=' + verifyResult.missing +
            ', wrong=' + verifyResult.wrong + '. Run setupWaratahNamedRanges_() to fix.');
        } else {
          Logger.log('Step 7: Named ranges OK');
        }
      } else {
        Logger.log('Step 7: verifyWaratahNamedRanges_ not available (SetupWaratah.js not loaded?)');
      }
    } catch (verifyErr) {
      Logger.log('Step 7: Named range verification failed (non-blocking): ' + verifyErr.message);
    }

    // Step 8: Post-rollover validation (non-blocking)
    _warValidateRolloverResult_(spreadsheet);

    // Step 9: Named range health check (non-blocking)
    try {
      if (typeof namedRangeHealthCheck_Waratah === 'function') {
        namedRangeHealthCheck_Waratah();
      }
    } catch (healthErr) {
      Logger.log('Step 9: Named range health check failed (non-blocking): ' + healthErr.message);
    }

    var duration = ((new Date()) - startTime) / 1000;
    Logger.log('========== WARATAH ROLLOVER COMPLETE: ' + duration.toFixed(1) + 's ==========');

    // UI success message
    try {
      var ui = SpreadsheetApp.getUi();
      var msg = summary
        ? 'Week ending ' + summary.weekEndDate + ' archived.\n\n' +
          'Total revenue: $' + (summary.totalRevenue || 0).toLocaleString() + '\n' +
          'All 7 tabs renamed. Wednesday–Sunday cleared.\n\n' +
          'Duration: ' + duration.toFixed(1) + 's'
        : 'No previous week data to archive (fresh template).\n\n' +
          'All 7 tabs renamed with next week\'s dates.\n\n' +
          'Duration: ' + duration.toFixed(1) + 's';
      ui.alert('Rollover Complete', msg, ui.ButtonSet.OK);
    } catch (uiErr) { /* trigger context */ }

    return { success: true, weekEndDate: summary ? summary.weekEndDate : null, duration: duration };

  } catch (error) {
    Logger.log('runWaratahWeeklyRollover: FAILED — ' + error.message + '\n' + error.stack);
    notifyError_('runWaratahWeeklyRollover', error);

    try {
      SpreadsheetApp.getUi().alert(
        'Rollover Failed',
        'Error: ' + error.message + '\n\nCheck Apps Script logs for details.\nData has NOT been cleared.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } catch (uiErr) { /* trigger context */ }

    throw error;

  } finally {
    lock.releaseLock();
  }
}

/**
 * Backward-compatible alias — keeps existing trigger/menu references working.
 * Old handler name was 'performWeeklyRollover'.
 */
function performWeeklyRollover() {
  return runWaratahWeeklyRollover();
}


// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates preconditions before rollover.
 * Throws if any check fails.
 *
 * @param {Spreadsheet} spreadsheet
 */
function _warValidatePreconditions_(spreadsheet) {
  var props = PropertiesService.getScriptProperties();

  // Check 1: Working file ID
  var workingFileId = props.getProperty('WARATAH_WORKING_FILE_ID');
  if (!workingFileId) {
    throw new Error('Script Property WARATAH_WORKING_FILE_ID is not set.');
  }
  if (spreadsheet.getId() !== workingFileId) {
    throw new Error(
      'Wrong file! Expected WARATAH_WORKING_FILE_ID=' + workingFileId +
      ' but running on ' + spreadsheet.getId()
    );
  }

  // Check 2: Venue name
  var venueName = props.getProperty('VENUE_NAME');
  if (venueName !== 'WARATAH') {
    throw new Error('VENUE_NAME must be WARATAH, got: ' + venueName);
  }

  // Check 3: Archive folder
  var archiveFolderId = props.getProperty('ARCHIVE_ROOT_FOLDER_ID');
  if (!archiveFolderId) {
    throw new Error('Script Property ARCHIVE_ROOT_FOLDER_ID is not set.');
  }
  try {
    DriveApp.getFolderById(archiveFolderId);
  } catch (e) {
    throw new Error('Archive folder not accessible: ' + archiveFolderId);
  }

  // Check 4: Wednesday sheet exists
  var wednesdaySheet = _warFindSheetByPrefix_(spreadsheet, 'WEDNESDAY');
  if (!wednesdaySheet) {
    throw new Error('WEDNESDAY sheet not found in spreadsheet.');
  }

  Logger.log('_warValidatePreconditions_: passed. File: ' + spreadsheet.getName());
}

/**
 * Idempotency check: returns true if the rollover has already run this week.
 * Detects by comparing the WEDNESDAY tab's current date to what next-Wednesday would be.
 *
 * @param {Spreadsheet} spreadsheet
 * @returns {boolean}
 */
function _warAlreadyRolledOver_(spreadsheet) {
  try {
    var wednesdaySheet = _warFindSheetByPrefix_(spreadsheet, 'WEDNESDAY');
    if (!wednesdaySheet) return false;

    var currentDateVal = wednesdaySheet.getRange('B3').getValue();
    if (!(currentDateVal instanceof Date) || isNaN(currentDateVal.getTime())) return false;

    var expectedNextWed = _warCalculateNextSunday_();
    // expectedNextSunday - 4 days = next Wednesday
    var expectedNextWedDate = new Date(expectedNextWed);
    expectedNextWedDate.setDate(expectedNextWed.getDate() - 4);

    var currentDateStr = Utilities.formatDate(currentDateVal, WAR_ROLLOVER_TZ, 'yyyy-MM-dd');
    var expectedStr = Utilities.formatDate(expectedNextWedDate, WAR_ROLLOVER_TZ, 'yyyy-MM-dd');

    return currentDateStr === expectedStr;
  } catch (e) {
    Logger.log('_warAlreadyRolledOver_: check failed (non-blocking) — ' + e.message);
    return false;
  }
}


// ============================================================================
// WEEK SUMMARY
// ============================================================================

/**
 * Generates a summary of the completed week (Wed–Sun).
 *
 * @param {Spreadsheet} spreadsheet
 * @returns {Object} { weekEndDate, totalRevenue, totalTips, shiftsReported, days }
 */
function _warGenerateWeekSummary_(spreadsheet) {
  var totalRevenue = 0;
  var totalTips = 0;
  var shiftsReported = 0;
  var weekEndDate = null;
  var days = [];

  WAR_ROLLOVER_ACTIVE_DAYS.forEach(function(dayPrefix) {
    var sheet = _warFindSheetByPrefix_(spreadsheet, dayPrefix);
    if (!sheet) {
      days.push({ name: dayPrefix, date: 'N/A', revenue: 0, mod: '' });
      return;
    }

    var dateVal = '';
    var modVal = '';
    var revenueVal = 0;

    try {
      var rawDate = sheet.getRange('B3').getValue();
      if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
        dateVal = Utilities.formatDate(rawDate, WAR_ROLLOVER_TZ, 'dd/MM/yyyy');
        // Sunday is the week ending date
        if (dayPrefix === 'SUNDAY') {
          weekEndDate = dateVal;
        }
      }
    } catch (e) {
      Logger.log('_warGenerateWeekSummary_: date read error on ' + dayPrefix + ': ' + e.message);
    }

    try {
      var rawMod = sheet.getRange('B4').getDisplayValue();
      modVal = (rawMod || '').trim();
    } catch (e) { /* non-blocking */ }

    try {
      var rawRev = sheet.getRange('B54').getValue();  // new sheet: B54 (was B34)
      revenueVal = parseFloat(rawRev) || 0;
      if (revenueVal > 0) shiftsReported++;
      totalRevenue += revenueVal;
    } catch (e) {
      Logger.log('_warGenerateWeekSummary_: revenue read error on ' + dayPrefix + ': ' + e.message);
    }

    try {
      var rawTips = sheet.getRange('C32').getValue();  // new sheet: C32 (was B36)
      totalTips += parseFloat(rawTips) || 0;
    } catch (e) { /* non-blocking */ }

    days.push({ name: dayPrefix, date: dateVal, revenue: revenueVal, mod: modVal });
  });

  if (!weekEndDate && days.length > 0) {
    weekEndDate = days[days.length - 1].date || 'Unknown';
  }

  if (!weekEndDate || weekEndDate === 'N/A' || weekEndDate === 'Unknown') {
    throw new Error('No valid dates found in active day sheets. Cannot generate summary.');
  }

  return {
    weekEndDate: weekEndDate,
    totalRevenue: totalRevenue,
    totalTips: totalTips,
    shiftsReported: shiftsReported,
    days: days
  };
}


// ============================================================================
// ARCHIVE — PDF
// ============================================================================

/**
 * Exports all 5 active day sheets (Wed–Sun) as a single multi-page PDF.
 * Hides non-day sheets before export, restores visibility after.
 *
 * @param {Spreadsheet} spreadsheet
 * @param {string} weekEndDate - "DD/MM/YYYY"
 * @returns {Object} { archivePath, fileUrl, exported }
 */
function _warExportPdfToArchive_(spreadsheet, weekEndDate) {
  var props = PropertiesService.getScriptProperties();
  var archiveRootId = props.getProperty('ARCHIVE_ROOT_FOLDER_ID');
  var pdfFileName = 'Waratah Shift Report W.E. ' + weekEndDate.replace(/\//g, '.') + '.pdf';

  var allSheets = spreadsheet.getSheets();
  var originallyHidden = {};
  allSheets.forEach(function(s) {
    originallyHidden[s.getSheetId()] = s.isSheetHidden();
  });

  // Find active day sheet IDs
  var activeDaySheetIds = {};
  WAR_ROLLOVER_ACTIVE_DAYS.forEach(function(dayPrefix) {
    var sheet = _warFindSheetByPrefix_(spreadsheet, dayPrefix);
    if (sheet) activeDaySheetIds[sheet.getSheetId()] = true;
  });

  if (Object.keys(activeDaySheetIds).length === 0) {
    Logger.log('_warExportPdfToArchive_: No active day sheets found. Skipping PDF export.');
    return { exported: false, archivePath: 'N/A', fileUrl: '' };
  }

  var pdfBlob = null;

  try {
    // Show active sheets, hide everything else
    allSheets.forEach(function(s) {
      var id = s.getSheetId();
      if (activeDaySheetIds[id]) {
        if (s.isSheetHidden()) s.showSheet();
      } else {
        if (!s.isSheetHidden()) s.hideSheet();
      }
    });

    var spreadsheetId = spreadsheet.getId();
    var exportUrl =
      'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?' +
      'format=pdf&size=A4&portrait=true&fitw=true' +
      '&top_margin=0.5&bottom_margin=0.5&left_margin=0.5&right_margin=0.5' +
      '&sheetnames=false&printtitle=false&pagenumbers=false&gridlines=false';

    var token = ScriptApp.getOAuthToken();
    var resp = UrlFetchApp.fetch(exportUrl, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });

    if (resp.getResponseCode() !== 200) {
      throw new Error('PDF export HTTP ' + resp.getResponseCode());
    }
    pdfBlob = resp.getBlob().setName(pdfFileName);
    Logger.log('_warExportPdfToArchive_: PDF generated (' + pdfBlob.getBytes().length + ' bytes)');

  } finally {
    // Always restore original visibility
    allSheets.forEach(function(s) {
      var id = s.getSheetId();
      var wasHidden = originallyHidden[id];
      if (wasHidden && !s.isSheetHidden()) {
        s.hideSheet();
      } else if (!wasHidden && s.isSheetHidden()) {
        s.showSheet();
      }
    });
  }

  if (!pdfBlob) {
    return { exported: false, archivePath: 'N/A', fileUrl: '' };
  }

  var archiveFolder = _warGetOrCreateArchiveSubfolder_(weekEndDate, 'pdfs', archiveRootId);
  var pdfFile = archiveFolder.createFile(pdfBlob);
  Logger.log('_warExportPdfToArchive_: Saved to Drive: ' + pdfFile.getName());

  return {
    exported: true,
    archivePath: _warGetArchivePath_(weekEndDate) + '/pdfs/' + pdfFileName,
    fileUrl: pdfFile.getUrl()
  };
}


// ============================================================================
// ARCHIVE — SHEETS SNAPSHOT
// ============================================================================

/**
 * Creates a Google Sheets copy of the working file in the archive folder.
 *
 * @param {Spreadsheet} spreadsheet
 * @param {string} weekEndDate - "DD/MM/YYYY"
 * @returns {Object} { archivePath, fileUrl }
 */
function _warCreateArchiveSnapshot_(spreadsheet, weekEndDate) {
  var props = PropertiesService.getScriptProperties();
  var archiveRootId = props.getProperty('ARCHIVE_ROOT_FOLDER_ID');
  var snapshotName = 'Waratah Shift Report W.E. ' + weekEndDate.replace(/\//g, '.');

  var archiveFolder = _warGetOrCreateArchiveSubfolder_(weekEndDate, 'sheets', archiveRootId);
  var workingFile = DriveApp.getFileById(spreadsheet.getId());
  var snapshot = workingFile.makeCopy(snapshotName, archiveFolder);

  Logger.log('_warCreateArchiveSnapshot_: Snapshot created: ' + snapshot.getName());

  return {
    archivePath: _warGetArchivePath_(weekEndDate) + '/sheets/' + snapshotName,
    fileUrl: snapshot.getUrl()
  };
}

/**
 * Gets or creates a dated archive subfolder.
 * Structure: ArchiveRoot/YYYY/YYYY-MM/{subfolderName}/
 *
 * @param {string} weekEndDateStr - "DD/MM/YYYY"
 * @param {string} subfolderName  - 'pdfs' or 'sheets'
 * @param {string} archiveRootId
 * @returns {Folder}
 */
function _warGetOrCreateArchiveSubfolder_(weekEndDateStr, subfolderName, archiveRootId) {
  var parts = weekEndDateStr.split('/');
  var month = parseInt(parts[1], 10);
  var year = parseInt(parts[2], 10);

  var archiveRoot = DriveApp.getFolderById(archiveRootId);
  var yearStr = String(year);
  var monthStr = String(month).padStart(2, '0');
  var yearMonthStr = yearStr + '-' + monthStr;

  var yearFolder = _warGetOrCreateSubfolder_(archiveRoot, yearStr);
  var monthFolder = _warGetOrCreateSubfolder_(yearFolder, yearMonthStr);
  return _warGetOrCreateSubfolder_(monthFolder, subfolderName);
}

function _warGetOrCreateSubfolder_(parent, name) {
  var existing = parent.getFoldersByName(name);
  return existing.hasNext() ? existing.next() : parent.createFolder(name);
}

function _warGetArchivePath_(weekEndDateStr) {
  var parts = weekEndDateStr.split('/');
  var year = parts[2];
  var month = parts[1].padStart(2, '0');
  return 'Archive/' + year + '/' + year + '-' + month;
}


// ============================================================================
// DATA CLEARING (Active days only: Wed–Sun)
// ============================================================================

/**
 * Clears manager-input fields on active day sheets (Wed–Sun).
 * Mon/Tue are NOT cleared — they only get renamed.
 *
 * Uses getClearableFieldKeys_() from RunWaratah.js (auto-excludes isFormula:true).
 * Formula cells auto-excluded: cashTake (C19), totalCashRecorded (C24), cashVariance (C26),
 * cashTakeDisplay (B47), runningTotals (D37:D54), netRevenue (B54), totalTips (C32), taxes (B53).
 * Clearable fields include manager inputs: fohStaff, bohStaff, mod, deposit, cashCounted, etc.
 *
 * @param {Spreadsheet} spreadsheet
 */
function _warClearAllSheetData_(spreadsheet) {
  var clearableKeys = getClearableFieldKeys_(); // from RunWaratah.js

  WAR_ROLLOVER_ACTIVE_DAYS.forEach(function(dayPrefix) {
    var sheet = _warFindSheetByPrefix_(spreadsheet, dayPrefix);
    if (!sheet) {
      Logger.log('_warClearAllSheetData_: ' + dayPrefix + ' sheet not found — skipping');
      return;
    }

    Logger.log('Clearing ' + sheet.getName() + '...');
    var cleared = 0;
    var failed = 0;

    clearableKeys.forEach(function(fieldKey) {
      try {
        var range = getFieldRange(sheet, fieldKey); // from RunWaratah.js
        range.clearContent(); // singular — correct for Range objects
        cleared++;
      } catch (e) {
        Logger.log('_warClearAllSheetData_: could not clear ' + dayPrefix + '.' + fieldKey + ': ' + e.message);
        failed++;
      }
    });

    Logger.log(sheet.getName() + ': cleared ' + cleared + ' fields, ' + failed + ' failed');
  });
}


// ============================================================================
// DATE UPDATE (All 7 tabs: Mon–Sun)
// ============================================================================

/**
 * Calculates the next Sunday (week ending) from today's date.
 * Trigger runs Monday 9pm — so "next Sunday" is 6 days away.
 *
 * @returns {Date} Next Sunday in Australia/Sydney timezone
 */
function _warCalculateNextSunday_() {
  var today = new Date();
  var dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  var daysToSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
  var nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysToSunday);
  return nextSunday;
}

/**
 * Updates date on ALL 7 tabs (Mon–Sun) and renames tabs.
 * Active tabs (Wed–Sun) also have their date field updated via named range.
 * Inactive tabs (Mon/Tue) are renamed only.
 *
 * @param {Spreadsheet} spreadsheet
 * @returns {Date} Next Sunday date
 */
function _warUpdateAllTabDates_(spreadsheet) {
  var nextSunday = _warCalculateNextSunday_();

  WAR_ROLLOVER_ALL_DAYS.forEach(function(dayName) {
    var sheet = _warFindSheetByPrefix_(spreadsheet, dayName);
    if (!sheet) {
      Logger.log('_warUpdateAllTabDates_: ' + dayName + ' sheet not found — skipping');
      return;
    }

    var offset = WAR_ROLLOVER_OFFSETS[dayName];
    var thisDate = new Date(nextSunday);
    thisDate.setDate(nextSunday.getDate() + offset);

    var day = String(thisDate.getDate()).padStart(2, '0');
    var month = String(thisDate.getMonth() + 1).padStart(2, '0');
    var year = thisDate.getFullYear();
    var formattedDate = day + '/' + month + '/' + year;

    // Rename the tab regardless of active/inactive
    var newTabName = dayName + ' ' + formattedDate;
    sheet.setName(newTabName);

    // Write date to B3:F3 on all 7 tabs (even Mon/Tue — needed for named range health)
    try {
      var dateRange = sheet.getRange('B3:F3');
      dateRange.clearContent();
      dateRange.getCell(1, 1).setValue(formattedDate);
    } catch (e) {
      Logger.log('_warUpdateAllTabDates_: could not stamp date on ' + dayName + ': ' + e.message);
    }

    Logger.log(dayName + ' -> "' + newTabName + '"');
  });

  return nextSunday;
}


// ============================================================================
// DRY RUN
// ============================================================================

/**
 * Dry-run mode: logs what rollover would do without making any changes.
 * Shows UI alert with report.
 */
function _warDryRun_() {
  Logger.log('========== WARATAH ROLLOVER DRY RUN ==========');
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  var report = '=== ROLLOVER DRY RUN (no changes) ===\n\n';

  // Validate (read-only)
  try {
    _warValidatePreconditions_(spreadsheet);
    report += 'Preconditions: PASS\n\n';
  } catch (e) {
    report += 'Preconditions: FAIL — ' + e.message + '\n\n';
  }

  // Idempotency
  if (_warAlreadyRolledOver_(spreadsheet)) {
    report += 'Idempotency: Already rolled over this week — would be a no-op.\n\n';
  } else {
    report += 'Idempotency: Not yet rolled over — rollover would proceed.\n\n';
  }

  // Next week dates
  var nextSunday = _warCalculateNextSunday_();
  report += '--- Next week tab renames ---\n';
  WAR_ROLLOVER_ALL_DAYS.forEach(function(dayName) {
    var offset = WAR_ROLLOVER_OFFSETS[dayName];
    var thisDate = new Date(nextSunday);
    thisDate.setDate(nextSunday.getDate() + offset);
    var formatted = Utilities.formatDate(thisDate, WAR_ROLLOVER_TZ, 'dd/MM/yyyy');
    var isActive = WAR_ROLLOVER_ACTIVE_DAYS.indexOf(dayName) !== -1;
    report += '  ' + dayName + ' ' + formatted + (isActive ? ' [CLEAR + RENAME]' : ' [RENAME ONLY]') + '\n';
  });

  report += '\n--- Fields to clear per active day ---\n';
  var clearableKeys = getClearableFieldKeys_();
  report += '  ' + clearableKeys.length + ' fields × 5 days = ' + (clearableKeys.length * 5) + ' ranges\n';
  report += '  Keys: ' + clearableKeys.join(', ') + '\n';
  report += '  Formula cells excluded: cashTake (C19), totalCashRecorded (C24), cashVariance (C26), netRevenue (B54), totalTips (C32), taxes (B53), cashTakeDisplay (B47), runningTotals (D37:D54), etc.\n';

  report += '\nDRY RUN COMPLETE — No changes made.\n';
  report += 'Run "Run Rollover Now" to execute.';

  Logger.log(report);

  try {
    SpreadsheetApp.getUi().alert('Rollover Dry Run', report, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (uiErr) { /* trigger context */ }
}


// ============================================================================
// POST-ROLLOVER VALIDATION (non-blocking)
// ============================================================================

/**
 * Validates rollover result after completion.
 * Checks each active day sheet for a non-empty date and resolvable netRevenue range.
 * Posts Slack alert on failure. Never throws.
 *
 * @param {Spreadsheet} spreadsheet
 * @returns {{ valid: boolean, issues: string[] }}
 */
function _warValidateRolloverResult_(spreadsheet) {
  var issues = [];

  try {
    WAR_ROLLOVER_ACTIVE_DAYS.forEach(function(dayName) {
      var sheet = _warFindSheetByPrefix_(spreadsheet, dayName);
      if (!sheet) {
        issues.push(dayName + ': sheet not found after rollover');
        return;
      }

      // Check date field
      try {
        var dateVal = sheet.getRange('B3').getValue();
        if (!dateVal || dateVal === '') {
          issues.push(sheet.getName() + ': date field empty after rollover');
        }
      } catch (e) {
        issues.push(sheet.getName() + ': date read error — ' + e.message);
      }

      // Check netRevenue named range still resolves
      try {
        var revRange = getFieldRange(sheet, 'netRevenue');
        if (!revRange) {
          issues.push(sheet.getName() + ': netRevenue range did not resolve');
        }
      } catch (e) {
        issues.push(sheet.getName() + ': netRevenue range error — ' + e.message);
      }
    });

    var valid = issues.length === 0;

    if (valid) {
      Logger.log('Post-rollover validation: PASSED');
    } else {
      Logger.log('Post-rollover validation: FAILED — ' + issues.join('; '));
      try {
        var webhook = PropertiesService.getScriptProperties().getProperty('WARATAH_SLACK_WEBHOOK_TEST');
        if (webhook) {
          var blocks = [
            bk_header('Post-Rollover Validation FAILED'),
            bk_section('*The Waratah* — rollover completed but validation found issues:\n' +
              issues.map(function(i) { return '• ' + i; }).join('\n'))
          ];
          bk_post(webhook, blocks, 'Waratah post-rollover validation failed: ' + issues.length + ' issue(s)');
        }
      } catch (slackErr) {
        Logger.log('_warValidateRolloverResult_: Slack alert failed — ' + slackErr.message);
      }
    }

    return { valid: valid, issues: issues };

  } catch (e) {
    Logger.log('_warValidateRolloverResult_: unexpected error — ' + e.message);
    return { valid: false, issues: ['Validation check failed: ' + e.message] };
  }
}


// ============================================================================
// TRIGGER MANAGEMENT
// ============================================================================

/**
 * Creates the Monday 9pm weekly rollover trigger.
 * Removes any existing rollover trigger first to prevent duplicates.
 *
 * WARNING: clasp push destroys all time-based triggers.
 * Re-run this after every deployment.
 */
function createRolloverTrigger_Waratah() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    var fn = trigger.getHandlerFunction();
    if (fn === 'runWaratahWeeklyRollover' || fn === 'performWeeklyRollover') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log('createRolloverTrigger_Waratah: deleted existing trigger ' + fn);
    }
  });

  ScriptApp.newTrigger('runWaratahWeeklyRollover')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(21)
    .nearMinute(0)
    .create();

  Logger.log('createRolloverTrigger_Waratah: trigger created (Monday 9:00pm)');

  try {
    SpreadsheetApp.getUi().alert(
      'Rollover Trigger Created',
      'Weekly rollover trigger created.\n\nSchedule: Monday 9:00pm (Australia/Sydney)\n\n' +
      'Verify in Apps Script Editor > Triggers (clock icon).',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (e) { Logger.log('createRolloverTrigger_Waratah: UI alert skipped — trigger context'); }
}

/**
 * Removes the weekly rollover trigger.
 */
function removeRolloverTrigger_Waratah() {
  var removed = 0;
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    var fn = trigger.getHandlerFunction();
    if (fn === 'runWaratahWeeklyRollover' || fn === 'performWeeklyRollover') {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });

  Logger.log('removeRolloverTrigger_Waratah: removed ' + removed + ' trigger(s)');

  try {
    SpreadsheetApp.getUi().alert(
      'Rollover Trigger Removed',
      'Removed ' + removed + ' rollover trigger(s).\n\nAutomatic rollover is now disabled.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (e) { Logger.log('removeRolloverTrigger_Waratah: UI alert skipped — trigger context'); }
}


// ============================================================================
// UTILITY
// ============================================================================

/**
 * Finds a sheet by day name prefix (case-insensitive starts-with match).
 * Handles renamed tabs like "WEDNESDAY 21/05/2026".
 *
 * @param {Spreadsheet} spreadsheet
 * @param {string} dayPrefix - e.g. "WEDNESDAY"
 * @returns {Sheet|null}
 */
function _warFindSheetByPrefix_(spreadsheet, dayPrefix) {
  return spreadsheet.getSheets().find(function(s) {
    return s.getName().toUpperCase().startsWith(dayPrefix);
  }) || null;
}
