/**
 * ============================================================================
 * NAMED RANGE SETUP & VERIFICATION — THE WARATAH (NEW SHEET)
 * ============================================================================
 *
 * Two public functions for initial setup and ongoing diagnostics of the
 * named range system on the new Sakura-aligned Waratah shift report sheet.
 *
 * Sheet layout (new sheet, ID stored in Script Property WARATAH_SHEET_ID):
 *   7 day tabs (MONDAY–SUNDAY with date suffix)
 *   Active days: WEDNESDAY–SUNDAY (full pipeline)
 *   Inactive days: MONDAY, TUESDAY (renamed by rollover only — date named range only)
 *
 * Named range convention: {DAY}_SR_{Suffix}
 *   e.g. WEDNESDAY_SR_NetRevenue, FRIDAY_SR_CashCounted
 *
 * Functions:
 *   setupWaratahNamedRanges_()  — idempotent setup (creates/updates ~75 ranges)
 *   verifyWaratahNamedRanges_() — diagnostic (lists missing/wrong/unexpected ranges)
 *
 * @version 1.0.0
 * @date 2026-05-17
 * @phase Phase 1 — Sakura Alignment Migration
 ============================================================================
 */


// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * All 5 active day prefixes (full pipeline: clearing, warehouse, export).
 */
const ACTIVE_DAY_PREFIXES_SETUP = ['WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/**
 * All 7 day prefixes on the new sheet (Mon/Tue tabs exist for visual consistency).
 * Only 'date' named range is created for Mon/Tue — nothing else.
 */
const ALL_DAY_PREFIXES_SETUP = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/**
 * Field definitions for the new sheet layout (live May 2026, 36 fields).
 *
 * suffix:      Named range suffix (full name = {DAY}_SR_{suffix})
 * cell:        A1 notation on each day sheet
 * isFormula:   true = formula cell — never clear during rollover
 * activeOnly:  true = only created on WEDNESDAY–SUNDAY (not Mon/Tue)
 * description: Human-readable description
 *
 * IMPORTANT: Keep in sync with FIELD_CONFIG in RunWaratah.js.
 * The two configs serve different purposes:
 *   RunWaratah.js FIELD_CONFIG  — runtime read/clear helpers (uses 'fallback' key)
 *   SetupWaratah.js SETUP_FIELD_CONFIG — named range creation (uses 'cell' key)
 * Both must reflect the same authoritative cell addresses.
 */
const SETUP_FIELD_CONFIG = {

  // --- HEADER (all 7 days get 'date' for rollover tab renaming) ---
  date: {
    suffix: 'SR_Date',
    cell: 'B3:F3',
    isFormula: false,
    activeOnly: false,
    description: 'Report date (merged B3:F3)'
  },

  // --- HEADER (active days only) ---
  mod: {
    suffix: 'SR_MOD',
    cell: 'B4:F4',
    isFormula: false,
    activeOnly: true,
    description: 'Manager on Duty (merged B4:F4)'
  },
  fohStaff: {
    suffix: 'SR_FohStaff',
    cell: 'B6',
    isFormula: false,
    activeOnly: true,
    description: 'FOH staff on shift (B6)'
  },
  bohStaff: {
    suffix: 'SR_BohStaff',
    cell: 'B7',
    isFormula: false,
    activeOnly: true,
    description: 'BOH staff on shift (B7)'
  },

  // --- TILL COUNTS (new 2-till system) ---
  publicTillCount: {
    suffix: 'SR_PublicTillCount',
    cell: 'C10:C17',
    isFormula: false,
    activeOnly: true,
    description: 'Public till count entries (C10:C17)'
  },
  publicTillRefloat: {
    suffix: 'SR_PublicTillRefloat',
    cell: 'D10:D17',
    isFormula: false,
    activeOnly: true,
    description: 'Public till refloat entries (D10:D17)'
  },
  terraceTillCount: {
    suffix: 'SR_TerraceTillCount',
    cell: 'E10:E17',
    isFormula: false,
    activeOnly: true,
    description: 'Terrace till count entries (E10:E17)'
  },
  terraceTillRefloat: {
    suffix: 'SR_TerraceTillRefloat',
    cell: 'F10:F17',
    isFormula: false,
    activeOnly: true,
    description: 'Terrace till refloat entries (F10:F17)'
  },

  // --- CASH RECONCILIATION (formula cells — do NOT clear) ---
  cashCounted: {
    suffix: 'SR_CashCounted',
    cell: 'C18',
    isFormula: true,
    activeOnly: true,
    description: 'Cash counted — sum of public + terrace tills (formula C18 — do not clear)'
  },
  cashTake: {
    suffix: 'SR_CashTake',
    cell: 'C19',
    isFormula: true,
    activeOnly: true,
    description: 'Cash take = counted minus refloats (formula C19 — do not clear)'
  },
  cashReturns: {
    suffix: 'SR_CashReturns',
    cell: 'C22',
    isFormula: false,
    activeOnly: true,
    description: 'Cash returns (C22)'
  },
  cdDiscount: {
    suffix: 'SR_CDDiscount',
    cell: 'C23',
    isFormula: false,
    activeOnly: true,
    description: 'CD discount (C23)'
  },
  totalCashRecorded: {
    suffix: 'SR_TotalCashRecorded',
    cell: 'C24',
    isFormula: true,
    activeOnly: true,
    description: 'Total cash recorded (formula C24 — do not clear)'
  },
  cashVariance: {
    suffix: 'SR_CashVariance',
    cell: 'C26',
    isFormula: true,
    activeOnly: true,
    description: 'Cash variance = counted minus expected (formula C26 — do not clear)'
  },

  // --- TIPS ---
  cashTips: {
    suffix: 'SR_CashTips',
    cell: 'C29',
    isFormula: false,
    activeOnly: true,
    description: 'Cash tips (C29)'
  },
  cardTips: {
    suffix: 'SR_CardTips',
    cell: 'C30',
    isFormula: false,
    activeOnly: true,
    description: 'Card tips (C30)'
  },
  surchargeTips: {
    suffix: 'SR_SurchargeTips',
    cell: 'C31',
    isFormula: false,
    activeOnly: true,
    description: 'Surcharge tips (C31)'
  },
  totalTips: {
    suffix: 'SR_TotalTips',
    cell: 'C32',
    isFormula: true,
    activeOnly: true,
    description: 'Total tips (formula C32 — do not clear)'
  },

  // --- REVENUE & PRODUCTION ---
  productionAmount: {
    suffix: 'SR_ProductionAmount',
    cell: 'B37',
    isFormula: false,
    activeOnly: true,
    description: 'Production amount from Lightspeed (B37)'
  },
  deposit: {
    suffix: 'SR_Deposit',
    cell: 'B38',
    isFormula: false,
    activeOnly: true,
    description: 'Function/Event Deposit (B38)'
  },
  cardExpenses: {
    suffix: 'SR_CardExpenses',
    cell: 'B40:B45',
    isFormula: false,
    activeOnly: true,
    description: 'Card expenses (B40:B45)'
  },

  // --- FINANCIAL CALCULATIONS (formula cells — do NOT clear) ---
  cashTakeDisplay: {
    suffix: 'SR_CashTakeDisplay',
    cell: 'B47',
    isFormula: true,
    activeOnly: true,
    description: 'Cash take display — mirror of C19 (formula B47 — do not clear)'
  },
  grossSales: {
    suffix: 'SR_GrossSales',
    cell: 'B48',
    isFormula: true,
    activeOnly: true,
    description: 'Gross sales (formula B48 — do not clear)'
  },
  totalAdjustmentsDiscounts: {
    suffix: 'SR_TotalAdjustmentsDiscounts',
    cell: 'B50',
    isFormula: false,
    activeOnly: true,
    description: 'Total adjustments / discounts (B50)'
  },
  discountsExcCashDiscount: {
    suffix: 'SR_DiscountsExcCashDiscount',
    cell: 'B51',
    isFormula: true,
    activeOnly: true,
    description: 'Discounts exc cash discount (formula B51 — do not clear)'
  },
  grossSalesLessDiscounts: {
    suffix: 'SR_GrossSalesLessDiscounts',
    cell: 'B52',
    isFormula: true,
    activeOnly: true,
    description: 'Gross sales less discounts (formula B52 — do not clear)'
  },
  taxes: {
    suffix: 'SR_Taxes',
    cell: 'B53',
    isFormula: true,
    activeOnly: true,
    description: 'Taxes (formula B53 — do not clear)'
  },
  netRevenue: {
    suffix: 'SR_NetRevenue',
    cell: 'B54',
    isFormula: true,
    activeOnly: true,
    description: 'Net revenue (formula B54 — do not clear)'
  },
  runningTotals: {
    suffix: 'SR_RunningTotals',
    cell: 'D37:D54',
    isFormula: true,
    activeOnly: true,
    description: 'Running totals column (formula D37:D54 — do not clear)'
  },

  // --- NARRATIVE ---
  generalShiftComments: {
    suffix: 'SR_GeneralShiftComments',
    cell: 'A59',
    isFormula: false,
    activeOnly: true,
    description: 'General shift comments (A59)'
  },
  guestsOfNote: {
    suffix: 'SR_GuestsOfNote',
    cell: 'A61',
    isFormula: false,
    activeOnly: true,
    description: 'Guests of note / VIPs (A61)'
  },
  theGood: {
    suffix: 'SR_TheGood',
    cell: 'A63',
    isFormula: false,
    activeOnly: true,
    description: 'The good (A63)'
  },
  theBad: {
    suffix: 'SR_TheBad',
    cell: 'A65',
    isFormula: false,
    activeOnly: true,
    description: 'The bad (A65)'
  },
  kitchenNotes: {
    suffix: 'SR_KitchenNotes',
    cell: 'A67',
    isFormula: false,
    activeOnly: true,
    description: 'Kitchen notes (A67)'
  },

  // --- TASKS (16 rows: 69-84) ---
  todoTasks: {
    suffix: 'SR_TodoTasks',
    cell: 'A69:A84',
    isFormula: false,
    activeOnly: true,
    description: 'To-do task descriptions (A69:A84 — 16 rows)'
  },
  todoAssignees: {
    suffix: 'SR_TodoAssignees',
    cell: 'D69:D84',
    isFormula: false,
    activeOnly: true,
    description: 'To-do assignees (D69:D84 — 16 rows, col D)'
  },

  // --- INCIDENTS & WASTAGE ---
  wastageComps: {
    suffix: 'SR_WastageComps',
    cell: 'A86',
    isFormula: false,
    activeOnly: true,
    description: 'Wastage / comps (A86)'
  },
  maintenanceIssues: {
    suffix: 'SR_MaintenanceIssues',
    cell: 'A88',
    isFormula: false,
    activeOnly: true,
    description: 'Maintenance issues (A88)'
  },
  rsaIncidents: {
    suffix: 'SR_RSAIncidents',
    cell: 'A90',
    isFormula: false,
    activeOnly: true,
    description: 'RSA incidents (A90)'
  }
};


// ============================================================================
// SETUP: setupWaratahNamedRanges_()
// ============================================================================

/**
 * Creates all expected Named Ranges on the new Waratah shift report spreadsheet.
 *
 * Idempotent — safe to run multiple times:
 *   - Skips ranges that already exist and point to the correct sheet + cell
 *   - Creates/updates ranges that are missing or mispointed
 *   - Deletes stale ranges (Waratah-prefixed ranges not in the expected set)
 *
 * Expected: ~33 active-day fields × 5 days + 2 inactive-day 'date' fields = ~167 ranges
 * (actual count = 32 active fields × 5 + 2 = 162, plus 'date' on all 7 = 7, minus
 *  5 already counted = 2 extra Mon/Tue date ranges → 32×5 + 2 = 162)
 *
 * Run this AFTER the new sheet is live and tabs exist (Phase 2, Wed May 20).
 * Password-gated via pw_setupWaratahNamedRanges_() in MenuWaratah.js.
 *
 * @returns {{ created: number, skipped: number, errors: number, deleted: number }}
 */
function setupWaratahNamedRanges_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allSheets = ss.getSheets();

  let created = 0;
  let skipped = 0;
  let errors = 0;
  let deleted = 0;
  const details = [];

  // Build the complete set of expected named range names
  const expectedRangeNames = new Set();

  ALL_DAY_PREFIXES_SETUP.forEach(function(dayPrefix) {
    const isActive = ACTIVE_DAY_PREFIXES_SETUP.indexOf(dayPrefix) !== -1;

    Object.keys(SETUP_FIELD_CONFIG).forEach(function(fieldKey) {
      const fieldDef = SETUP_FIELD_CONFIG[fieldKey];
      if (fieldDef.activeOnly && !isActive) return; // Skip non-active fields for Mon/Tue
      const rangeName = dayPrefix + '_' + fieldDef.suffix;
      expectedRangeNames.add(rangeName);
    });
  });

  // Step 1: Delete stale Waratah-prefixed ranges not in expected set
  const allNamedRanges = ss.getNamedRanges();
  const watarDayPrefixes = ALL_DAY_PREFIXES_SETUP; // check if range starts with any of these
  allNamedRanges.forEach(function(nr) {
    const name = nr.getName();
    // Only clean up ranges that look like ours ({DAY}_SR_{anything})
    const isOurs = watarDayPrefixes.some(function(day) {
      return name.startsWith(day + '_SR_');
    });
    if (isOurs && !expectedRangeNames.has(name)) {
      try {
        ss.removeNamedRange(name);
        deleted++;
        details.push('DELETED ' + name + ' (stale/unexpected)');
      } catch (e) {
        details.push('FAILED to delete ' + name + ': ' + e.message);
        errors++;
      }
    }
  });

  // Step 2: Create/update expected ranges on each day sheet
  ALL_DAY_PREFIXES_SETUP.forEach(function(dayPrefix) {
    const isActive = ACTIVE_DAY_PREFIXES_SETUP.indexOf(dayPrefix) !== -1;

    // Find the sheet for this day (tab may have date suffix, e.g. "MONDAY 19/05/2026")
    const sheet = allSheets.find(function(s) {
      return s.getName().toUpperCase().startsWith(dayPrefix);
    });

    if (!sheet) {
      details.push('SKIP ' + dayPrefix + ': sheet not found in spreadsheet');
      return;
    }

    Object.keys(SETUP_FIELD_CONFIG).forEach(function(fieldKey) {
      const fieldDef = SETUP_FIELD_CONFIG[fieldKey];
      if (fieldDef.activeOnly && !isActive) return;

      const rangeName = dayPrefix + '_' + fieldDef.suffix;

      try {
        // Check if range already exists and is correct
        const existing = ss.getRangeByName(rangeName);
        if (existing) {
          const existingSheet = existing.getSheet();
          const existingA1 = existing.getA1Notation();
          if (existingSheet.getSheetId() === sheet.getSheetId() &&
              existingA1 === fieldDef.cell) {
            skipped++;
            return; // Already correct — skip silently
          }
          // Wrong sheet or wrong cell — update it
          details.push('UPDATE ' + rangeName + ': was ' + existingA1 + ' on "' + existingSheet.getName() + '"');
        }

        // Create or update the named range
        const targetRange = sheet.getRange(fieldDef.cell);
        ss.setNamedRange(rangeName, targetRange);
        created++;
        details.push('CREATED ' + rangeName + ' → ' + sheet.getName() + '!' + fieldDef.cell);

      } catch (e) {
        errors++;
        details.push('ERROR ' + rangeName + ': ' + e.message);
        Logger.log('setupWaratahNamedRanges_: ERROR ' + rangeName + ' — ' + e.message);
      }
    });
  });

  // Log summary
  const summary = 'setupWaratahNamedRanges_ complete: ' +
    'created=' + created + ', skipped=' + skipped +
    ', deleted=' + deleted + ', errors=' + errors;
  Logger.log(summary);
  Logger.log(details.join('\n'));

  // UI alert (skipped silently in trigger context)
  try {
    const ui = SpreadsheetApp.getUi();
    const alertMsg =
      'Named Range Setup Complete\n\n' +
      'Created/Updated: ' + created + '\n' +
      'Already correct (skipped): ' + skipped + '\n' +
      'Stale ranges deleted: ' + deleted + '\n' +
      'Errors: ' + errors + '\n\n' +
      (errors > 0 ? 'Check Apps Script logs for error details.\n\n' : '') +
      'Next step: run "Verify Named Ranges" to confirm setup.';
    ui.alert('Named Range Setup', alertMsg, ui.ButtonSet.OK);
  } catch (uiErr) {
    Logger.log('setupWaratahNamedRanges_: UI alert skipped — trigger context');
  }

  return { created: created, skipped: skipped, errors: errors, deleted: deleted };
}


// ============================================================================
// VERIFY: verifyWaratahNamedRanges_()
// ============================================================================

/**
 * Diagnostic: verifies all expected Named Ranges exist, point to the correct
 * sheet, and target the correct cell address.
 *
 * Reports each range as one of:
 *   OK            — exists, correct sheet, correct cell
 *   MISSING       — not found in spreadsheet at all
 *   WRONG_SHEET   — exists but points to a different tab
 *   WRONG_CELL    — exists on correct tab but wrong A1 address
 *   UNEXPECTED    — exists with Waratah prefix but not in expected set
 *
 * Output: Logger.log (always) + UI alert (skipped in trigger context).
 * Non-blocking: never throws.
 *
 * Password-gated via pw_verifyWaratahNamedRanges_() in MenuWaratah.js.
 *
 * @returns {{ ok: number, missing: number, wrong: number, unexpected: number }}
 */
function verifyWaratahNamedRanges_() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const allSheets = ss.getSheets();

    let okCount = 0;
    let missingCount = 0;
    let wrongCount = 0;
    let unexpectedCount = 0;
    const issues = [];

    // Build expected set for unexpected detection
    const expectedRangeNames = new Set();
    ALL_DAY_PREFIXES_SETUP.forEach(function(dayPrefix) {
      const isActive = ACTIVE_DAY_PREFIXES_SETUP.indexOf(dayPrefix) !== -1;
      Object.keys(SETUP_FIELD_CONFIG).forEach(function(fieldKey) {
        const fieldDef = SETUP_FIELD_CONFIG[fieldKey];
        if (fieldDef.activeOnly && !isActive) return;
        expectedRangeNames.add(dayPrefix + '_' + fieldDef.suffix);
      });
    });

    // Check each expected range
    ALL_DAY_PREFIXES_SETUP.forEach(function(dayPrefix) {
      const isActive = ACTIVE_DAY_PREFIXES_SETUP.indexOf(dayPrefix) !== -1;

      const sheet = allSheets.find(function(s) {
        return s.getName().toUpperCase().startsWith(dayPrefix);
      });

      Object.keys(SETUP_FIELD_CONFIG).forEach(function(fieldKey) {
        const fieldDef = SETUP_FIELD_CONFIG[fieldKey];
        if (fieldDef.activeOnly && !isActive) return;

        const rangeName = dayPrefix + '_' + fieldDef.suffix;

        if (!sheet) {
          missingCount++;
          issues.push('MISSING ' + rangeName + ' (sheet "' + dayPrefix + '..." not found)');
          return;
        }

        try {
          const namedRange = ss.getRangeByName(rangeName);
          if (!namedRange) {
            missingCount++;
            issues.push('MISSING ' + rangeName);
            return;
          }

          const rangeSheet = namedRange.getSheet();
          const rangeA1 = namedRange.getA1Notation();

          if (rangeSheet.getSheetId() !== sheet.getSheetId()) {
            wrongCount++;
            issues.push('WRONG_SHEET ' + rangeName + ' → "' + rangeSheet.getName() + '" (expected "' + sheet.getName() + '")');
          } else if (rangeA1 !== fieldDef.cell) {
            wrongCount++;
            issues.push('WRONG_CELL ' + rangeName + ' → ' + rangeA1 + ' (expected ' + fieldDef.cell + ')');
          } else {
            okCount++;
          }
        } catch (e) {
          missingCount++;
          issues.push('ERROR checking ' + rangeName + ': ' + e.message);
        }
      });
    });

    // Check for unexpected Waratah-prefixed ranges
    const allNamedRanges = ss.getNamedRanges();
    allNamedRanges.forEach(function(nr) {
      const name = nr.getName();
      const isOurs = ALL_DAY_PREFIXES_SETUP.some(function(day) {
        return name.startsWith(day + '_SR_');
      });
      if (isOurs && !expectedRangeNames.has(name)) {
        unexpectedCount++;
        issues.push('UNEXPECTED ' + name + ' → ' + nr.getRange().getA1Notation());
      }
    });

    // Build output
    const total = okCount + missingCount + wrongCount;
    const summaryLine =
      'Named Range Verification: OK=' + okCount + ' MISSING=' + missingCount +
      ' WRONG=' + wrongCount + ' UNEXPECTED=' + unexpectedCount +
      ' (of ' + total + ' expected)';
    Logger.log(summaryLine);

    const allClear = missingCount === 0 && wrongCount === 0 && unexpectedCount === 0;
    let alertMsg = summaryLine + '\n\n';

    if (allClear) {
      alertMsg += 'All ' + okCount + ' named ranges are correctly configured.';
    } else {
      alertMsg += 'Issues found (' + issues.length + '):\n';
      // Show first 30 issues in alert (full list in Logger)
      const displayIssues = issues.slice(0, 30);
      alertMsg += displayIssues.join('\n');
      if (issues.length > 30) {
        alertMsg += '\n... and ' + (issues.length - 30) + ' more (see Apps Script logs)';
      }
      Logger.log('Full issue list:\n' + issues.join('\n'));
      if (missingCount > 0 || wrongCount > 0) {
        alertMsg += '\n\nRun "Setup All Named Ranges (New Sheet)" to fix.';
      }
    }

    try {
      SpreadsheetApp.getUi().alert('Named Range Verification', alertMsg, SpreadsheetApp.getUi().ButtonSet.OK);
    } catch (uiErr) {
      Logger.log('verifyWaratahNamedRanges_: UI alert skipped — trigger context');
    }

    return { ok: okCount, missing: missingCount, wrong: wrongCount, unexpected: unexpectedCount };

  } catch (e) {
    Logger.log('verifyWaratahNamedRanges_: unexpected error — ' + e.message);
    return { ok: 0, missing: 0, wrong: 0, unexpected: 0 };
  }
}
