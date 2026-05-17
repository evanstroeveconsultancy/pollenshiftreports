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
 * Field definitions for the new Sakura-aligned sheet layout.
 *
 * suffix:      Named range suffix (full name = {DAY}_SR_{suffix})
 * cell:        A1 notation on each day sheet
 * isFormula:   true = formula cell — never clear during rollover
 * activeOnly:  true = only created on WEDNESDAY–SUNDAY (not Mon/Tue)
 * description: Human-readable description
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
  staff: {
    suffix: 'SR_Staff',
    cell: 'B5:F5',
    isFormula: false,
    activeOnly: true,
    description: 'Staff on shift (merged B5:F5)'
  },

  // --- REVENUE & PRODUCTION ---
  productionAmount: {
    suffix: 'SR_ProductionAmount',
    cell: 'B8',
    isFormula: false,
    activeOnly: true,
    description: 'Production amount from Lightspeed (input)'
  },
  deposit: {
    suffix: 'SR_Deposit',
    cell: 'B9:B10',
    isFormula: false,
    activeOnly: true,
    description: 'Deposit'
  },
  airbnbCovers: {
    suffix: 'SR_AirbnbCovers',
    cell: 'B11',
    isFormula: false,
    activeOnly: true,
    description: 'Airbnb covers'
  },
  cancellations: {
    suffix: 'SR_Cancellations',
    cell: 'B13:B14',
    isFormula: false,
    activeOnly: true,
    description: 'Cancellations'
  },

  // --- CASH RECONCILIATION (new 2-till system) ---
  cashCounted: {
    suffix: 'SR_CashCounted',
    cell: 'C18',
    isFormula: true,
    activeOnly: true,
    description: 'Cash counted — sum of public + terrace tills (formula C18 — do not clear)'
  },
  cashTakings: {
    suffix: 'SR_CashTakings',
    cell: 'C19',
    isFormula: true,
    activeOnly: true,
    description: 'Cash take = counted minus refloats (formula C19 — do not clear)'
  },
  expectedCash: {
    suffix: 'SR_ExpectedCash',
    cell: 'C24',
    isFormula: false,
    activeOnly: true,
    description: 'Expected cash from POS system (manager input)'
  },
  cashVariance: {
    suffix: 'SR_CashVariance',
    cell: 'C26',
    isFormula: true,
    activeOnly: true,
    description: 'Cash variance = counted minus expected (formula C26 — do not clear)'
  },

  // --- FINANCIAL BREAKDOWN ---
  grossSalesIncCash: {
    suffix: 'SR_GrossSalesIncCash',
    cell: 'B16',
    isFormula: true,
    activeOnly: true,
    description: 'Gross sales inc cash (formula — do not clear)'
  },
  cashReturns: {
    suffix: 'SR_CashReturns',
    cell: 'B17:B18',
    isFormula: false,
    activeOnly: true,
    description: 'Cash returns (merged B17:B18 — value in B17)'
  },
  cdDiscount: {
    suffix: 'SR_CDDiscount',
    cell: 'B19:B20',
    isFormula: false,
    activeOnly: true,
    description: 'CD discount (merged B19:B20 — value in B19)'
  },
  refunds: {
    suffix: 'SR_Refunds',
    cell: 'B21:B22',
    isFormula: false,
    activeOnly: true,
    description: 'Refunds (merged B21:B22 — value in B21)'
  },
  cdRedeem: {
    suffix: 'SR_CDRedeem',
    cell: 'B23:B24',
    isFormula: false,
    activeOnly: true,
    description: 'CD redeem (merged B23:B24 — value in B23)'
  },
  totalDiscount: {
    suffix: 'SR_TotalDiscount',
    cell: 'B25',
    isFormula: false,
    activeOnly: true,
    description: 'Total discount (input)'
  },
  discountsCompsExcCD: {
    suffix: 'SR_DiscountsCompsExcCD',
    cell: 'B26',
    isFormula: true,
    activeOnly: true,
    description: 'Discounts comps exc CD (formula — do not clear)'
  },
  grossTaxableSales: {
    suffix: 'SR_GrossTaxableSales',
    cell: 'B27',
    isFormula: true,
    activeOnly: true,
    description: 'Gross taxable sales (formula — do not clear)'
  },
  taxes: {
    suffix: 'SR_Taxes',
    cell: 'B28',
    isFormula: true,
    activeOnly: true,
    description: 'Taxes (formula — do not clear)'
  },
  netSalesWTips: {
    suffix: 'SR_NetSalesWTips',
    cell: 'B29',
    isFormula: true,
    activeOnly: true,
    description: 'Net sales with tips (formula — do not clear)'
  },

  // --- TIPS & CASH ---
  pettyCash: {
    suffix: 'SR_PettyCash',
    cell: 'B30',
    isFormula: false,
    activeOnly: true,
    description: 'Petty cash (input)'
  },
  cardTips: {
    suffix: 'SR_CardTips',
    cell: 'B32',
    isFormula: false,
    activeOnly: true,
    description: 'Card tips (input)'
  },
  cashTips: {
    suffix: 'SR_CashTips',
    cell: 'B33',
    isFormula: false,
    activeOnly: true,
    description: 'Cash tips (input)'
  },

  // --- NET REVENUE ---
  netRevenue: {
    suffix: 'SR_NetRevenue',
    cell: 'B34',
    isFormula: true,
    activeOnly: true,
    description: 'Net revenue (formula — do not clear)'
  },

  // --- TOTAL TIPS ---
  totalTips: {
    suffix: 'SR_TotalTips',
    cell: 'B36',
    isFormula: true,
    activeOnly: true,
    description: 'Total tips (formula — do not clear)'
  },

  // --- NARRATIVE ---
  shiftSummary: {
    suffix: 'SR_ShiftSummary',
    cell: 'A43:F43',
    isFormula: false,
    activeOnly: true,
    description: 'Shift summary (merged A43:F43)'
  },
  guestsOfNote: {
    suffix: 'SR_GuestsOfNote',
    cell: 'A45:F45',
    isFormula: false,
    activeOnly: true,
    description: 'Guests of note / VIPs (merged A45:F45)'
  },
  theGood: {
    suffix: 'SR_TheGood',
    cell: 'A47:F47',
    isFormula: false,
    activeOnly: true,
    description: 'The good (merged A47:F47)'
  },
  theBad: {
    suffix: 'SR_TheBad',
    cell: 'A49:F49',
    isFormula: false,
    activeOnly: true,
    description: 'The bad (merged A49:F49)'
  },
  kitchenNotes: {
    suffix: 'SR_KitchenNotes',
    cell: 'A51:F51',
    isFormula: false,
    activeOnly: true,
    description: 'Kitchen notes (merged A51:F51)'
  },

  // --- TASKS ---
  todoTasks: {
    suffix: 'SR_TodoTasks',
    cell: 'A53:E61',
    isFormula: false,
    activeOnly: true,
    description: 'To-do task descriptions (merged A:E per row — value in col A)'
  },
  todoAssignees: {
    suffix: 'SR_TodoAssignees',
    cell: 'F53:F61',
    isFormula: false,
    activeOnly: true,
    description: 'To-do assignees (col F)'
  },

  // --- INCIDENTS & WASTAGE ---
  wastageComps: {
    suffix: 'SR_WastageComps',
    cell: 'A63:F63',
    isFormula: false,
    activeOnly: true,
    description: 'Wastage / comps (merged A63:F63)'
  },
  rsaIncidents: {
    suffix: 'SR_RSAIncidents',
    cell: 'A65:F65',
    isFormula: false,
    activeOnly: true,
    description: 'RSA incidents (merged A65:F65)'
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
