/**
 * ============================================================================
 * WARATAH INTEGRATION HUB
 * ============================================================================
 *
 * Central orchestration for all Waratah automation systems
 *
 * Connects:
 * - Shift Reports → Data Warehouse
 * - Shift Reports → Task Management
 * - Task Management → Weekly Agenda (live sync)
 *
 * @version 3.0.0
 * @updated 2026-03-06
 */


/* ==========================================================================
   MASTER CONFIGURATION
   ========================================================================== */

/**
 * Lazy-load getter for integration configuration.
 * Reads Script Properties on demand (not at module load) to prevent
 * onOpen() failures when Script Properties are not yet configured.
 */
function getIntegrationConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    // Core spreadsheets (loaded from Script Properties — see _SETUP_ScriptProperties.js)
    shiftReportCurrentId: props.getProperty('WARATAH_SHEET_ID') || props.getProperty('WARATAH_SHIFT_REPORT_CURRENT_ID'),
    taskManagementId: props.getProperty('WARATAH_TASK_MANAGEMENT_ID'),
    dataWarehouseId: props.getProperty('WARATAH_DATA_WAREHOUSE_ID'),

    // Sheet names
    sheets: {
      todos: "TO-DOs",
      tasks: "MASTER ACTIONABLES SHEET",
      financialLog: "NIGHTLY_FINANCIAL",
      operationalLog: "OPERATIONAL_EVENTS",
      wastageLog: "WASTAGE_COMPS",
      qualitativeLog: "QUALITATIVE_LOG"
    },

    // Settings
    timezone: "Australia/Sydney",
    validationThresholds: {
      maxDiscrepancy: 10.00,       // Max $ difference for warnings
      criticalDiscrepancy: 50.00   // Max $ difference for errors (blocks send)
    },

    // Alert recipients (loaded from Script Properties)
    alerts: {
      integrationErrors: props.getProperty('INTEGRATION_ALERT_EMAIL_PRIMARY'),
      validationWarnings: props.getProperty('INTEGRATION_ALERT_EMAIL_PRIMARY')
    }
  };
}


/* ==========================================================================
   MAIN INTEGRATION ORCHESTRATOR
   Called from shift report "Export & Email PDF" button
   ========================================================================== */

/**
 * Master integration function - coordinates all systems
 * Returns validation results to calling function
 *
 * @param {string} sheetName - Name of shift report sheet (e.g., "FRIDAY 31/01/2025")
 * @returns {Object} {success: boolean, errors: [], warnings: []}
 */
function runIntegrations(sheetName) {
  const startTime = new Date();
  const INTEGRATION_CONFIG = getIntegrationConfig_(); // Read once, pass down
  const results = {
    success: true,
    errors: [],
    warnings: [],
    integrations: {}
  };

  try {
    Logger.log(`═══ Starting integrations for: ${sheetName} ═══`);

    // 1. Extract data from shift report
    Logger.log("Step 1/3: Extracting shift data...");
    const shiftData = extractShiftData_(sheetName, INTEGRATION_CONFIG);
    results.integrations.dataExtraction = {success: true};
    Logger.log(`  ✓ Extracted: ${shiftData.mod} | ${shiftData.dayOfWeek} | Revenue $${shiftData.netRevenue} | FOH: ${shiftData.fohStaff} | BOH: ${shiftData.bohStaff}`);

    // 2. Validate data integrity FIRST (before any writes)
    Logger.log("Step 2/3: Validating data...");
    const validation = validateShiftData_(shiftData);
    results.integrations.validation = validation;

    if (validation.errors.length > 0) {
      results.errors.push(...validation.errors);
      results.success = false;
      Logger.log(`  ✗ Validation FAILED: ${validation.errors.length} error(s)`);
      // Don't continue if validation fails
      return results;
    }
    if (validation.warnings.length > 0) {
      results.warnings.push(...validation.warnings);
      Logger.log(`  ⚠ Validation warnings: ${validation.warnings.length}`);
    } else {
      Logger.log(`  ✓ Validation passed`);
    }

    // 3. Log to data warehouse (non-blocking - don't fail entire process if this fails)
    Logger.log("Step 3/3: Logging to data warehouse...");
    try {
      const warehouseResult = logToDataWarehouse_(shiftData, INTEGRATION_CONFIG);
      results.integrations.warehouse = { success: true, ...warehouseResult };
      if (warehouseResult.financialSkipped) {
        results.warnings.push(
          `Warehouse: financial record for ${shiftData.date.toDateString()} / ${shiftData.mod} already exists. ` +
          `Duplicate skipped — re-export will not overwrite. Use backfillShiftToWarehouse() to force-update.`
        );
      }
      Logger.log(`  ✓ Warehouse logging complete`);
    } catch (e) {
      results.warnings.push(`Warehouse logging failed: ${e.message}`);
      results.integrations.warehouse = {success: false, error: e.message};
      Logger.log(`  ⚠ Warehouse logging failed: ${e.message}`);
    }

    // Append run record to INTEGRATION_LOG sheet in data warehouse
    appendToIntegrationLog_(sheetName, results, startTime, INTEGRATION_CONFIG);

    // Log integration run summary to Apps Script logs
    logIntegrationRun_(sheetName, results, startTime);

    const duration = ((new Date() - startTime) / 1000).toFixed(1);
    Logger.log(`═══ Integrations complete: ${duration}s ═══`);

  } catch (error) {
    results.success = false;
    results.errors.push(`Integration system error: ${error.message}`);
    Logger.log(`═══ INTEGRATION ERROR: ${error.message} ═══`);

    // Send alert
    sendIntegrationAlert_("Integration System Failure", error.message, sheetName, INTEGRATION_CONFIG);

    // Log to pipeline learnings
    logPipelineLearning_('runIntegrations', error.message, 'Check integration log for details');
  }

  return results;
}


/* ==========================================================================
   DATA EXTRACTION
   ========================================================================== */

/**
 * Parse a cell date value to a JavaScript Date.
 *
 * Two cases:
 *   1. Cell is date-formatted — Google Sheets returns a Date object directly.
 *   2. Cell is unformatted text — staff enter dates as "dd/mm/yyyy".
 *      `new Date("03/02/2025")` parses as MM/DD/YYYY (March 2), not Feb 3.
 *      We use Utilities.parseDate with the correct locale format instead.
 *
 * @param {*} value - Raw cell value from getValue()
 * @returns {Date} Parsed Date, or Invalid Date if unparseable
 */
function parseCellDate_(value) {
  if (value instanceof Date) return value;
  if (!value) return new Date('');
  const str = value.toString().trim();
  if (!str) return new Date('');
  try {
    return Utilities.parseDate(str, 'Australia/Sydney', 'dd/MM/yyyy');
  } catch (e) {
    Logger.log('parseCellDate_: could not parse "' + str + '" as dd/MM/yyyy — returning Invalid Date');
    return new Date(''); // Force invalid rather than US-format misparse via new Date(str)
  }
}


/**
 * Strip time component from a Date, returning midnight Australia/Sydney.
 * Prevents timezone-induced time leakage into warehouse date columns.
 *
 * @param {Date} d - Date object (may include time component)
 * @returns {Date} Date at midnight Australia/Sydney
 */
function toDateOnly_(d) {
  if (!d || isNaN(d.getTime())) return d;
  const str = Utilities.formatDate(d, 'Australia/Sydney', 'yyyy-MM-dd');
  return Utilities.parseDate(str, 'Australia/Sydney', 'yyyy-MM-dd');
}


/**
 * Extract all relevant data from shift report
 * Returns standardized data object
 *
 * Uses batched reads (3 API calls) instead of individual cell reads (~40 calls)
 * for significantly better performance in GAS.
 *
 * New sheet layout (live May 2026):
 *   FOH staff: B6, BOH staff: B7
 *   Till counts/refloats: C10:F17
 *   Cash recon: C18 (cashCounted, formula), C19 (cashTake, formula),
 *               C22 (cashReturns), C23 (cdDiscount), C24 (totalCashRecorded, formula),
 *               C26 (cashVariance, formula)
 *   Tips: C29 (cashTips), C30 (cardTips), C31 (surchargeTips), C32 (totalTips, formula)
 *   Revenue: B37 (productionAmount), B38 (deposit)
 *   Financial calcs: B48 (grossSales, formula), B50 (totalAdjustmentsDiscounts),
 *                    B51 (discountsExcCashDiscount, formula), B52 (grossSalesLessDiscounts, formula),
 *                    B53 (taxes, formula), B54 (netRevenue, formula)
 *   Narrative: A59, A61, A63, A65, A67
 *   Tasks: A69:A84 (descriptions), D69:D84 (assignees)
 *   Incidents: A86 (wastage), A88 (maintenance), A90 (RSA)
 *
 * Intentionally bypasses getFieldRange() helpers for performance — GAS charges
 * per API call, so batch reads are significantly faster than per-field named range lookups.
 * Cell mapping: FIELD_CONFIG fallback cells in RunWaratah.js are authoritative.
 *
 * @param {string} sheetName - Name of the shift report sheet
 * @param {Object} [config]  - Optional pre-loaded INTEGRATION_CONFIG
 * @returns {Object} Standardized shift data
 */
function extractShiftData_(sheetName, config) {
  const INTEGRATION_CONFIG = config || getIntegrationConfig_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in this spreadsheet`);
  }

  // --- BATCH READ 1: Financial data B3:F54 (52 rows × 5 cols) ---
  // Reads columns B–F to capture the full new sheet layout in one API call.
  // Col B: date (B3), mod (B4), fohStaff (B6), bohStaff (B7), revenue/production rows.
  // Col C: cash recon (C18/C19/C22/C23/C24/C26/C29/C30/C31/C32).
  // Col D–F: till refloat/count rows (D10:F17) — captured but not individually mapped.
  // Single API call replaces ~25 individual getRange().getValue() calls.
  let finValues;
  try {
    finValues = sheet.getRange("B3:F54").getValues(); // 52 rows × 5 cols → [[colB,colC,colD,colE,colF], ...]
  } catch (e) {
    Logger.log('extractShiftData_: could not read B3:F54 — ' + e.message);
    return null;
  }

  // Helper: extract column-B value by row number (1-indexed cell ref → 0-indexed array)
  const fin = (row) => finValues[row - 3] ? finValues[row - 3][0] : null;
  const finNum = (row) => parseFloat(fin(row)) || 0;
  // Helper: extract column-C value by row number
  const finC = (row) => finValues[row - 3] ? finValues[row - 3][1] : null;
  const finC_Num = (row) => parseFloat(finC(row)) || 0;

  // Also need display values for text fields (date, MOD, staff)
  let finDisplay;
  try {
    finDisplay = sheet.getRange("B3:B7").getDisplayValues(); // rows 3-7: date, mod, (blank), fohStaff, bohStaff
  } catch (e) {
    Logger.log('extractShiftData_: could not read B3:B7 display — ' + e.message);
    finDisplay = [[""], [""], [""], [""], [""]];
  }

  const dateValue = fin(3);
  if (!dateValue) {
    Logger.log('extractShiftData_: B3 (date) is empty');
    return null;
  }
  const date = parseCellDate_(dateValue);

  const mod = (finDisplay[1][0] || "").trim();      // B4 display
  if (!mod) {
    Logger.log('extractShiftData_: B4 (MOD) is empty');
    // Don't return null — MOD can be empty for partial data
  }
  const fohStaff = (finDisplay[3][0] || "").trim(); // B6 display
  const bohStaff = (finDisplay[4][0] || "").trim(); // B7 display
  // Concatenated staff string for warehouse col E (schema-compat with existing E=Staff header)
  const staffCombined = (fohStaff || bohStaff)
    ? ('FOH: ' + (fohStaff || '') + ' | BOH: ' + (bohStaff || ''))
    : '';

  // --- BATCH READ 2: Narrative + incident cells (A59:A90) ---
  // Single API call replaces 8 individual getDisplayValue() calls.
  // Narrative fields: A59 (generalShiftComments), A61 (guestsOfNote), A63 (theGood),
  //                   A65 (theBad), A67 (kitchenNotes)
  // Incident fields:  A86 (wastageComps), A88 (maintenanceIssues), A90 (rsaIncidents)
  let narrativeValues;
  try {
    narrativeValues = sheet.getRange("A59:A90").getDisplayValues(); // 32 rows
  } catch (e) {
    Logger.log('extractShiftData_: could not read A59:A90 — ' + e.message);
    narrativeValues = [];
  }
  // Helper: extract by row number (A59 = index 0, A61 = index 2, etc.)
  const narr = (row) => {
    const idx = row - 59;
    return (narrativeValues[idx] && narrativeValues[idx][0]) ? narrativeValues[idx][0].trim() : "";
  };

  // --- BATCH READ 3: TO-DOs A69:D84 (16 rows × 4 cols) ---
  // New layout: task description in col A, assignee in col D (was col F).
  // 16 rows (was 9). Single batch read captures both in one API call.
  let todoRange = [];
  try { todoRange = sheet.getRange("A69:D84").getValues(); } catch(e) { Logger.log("extractShiftData_: could not read A69:D84 — " + e.message); }
  const todos = [];
  todoRange.forEach(row => {
    const description = row[0]; // Column A (task description)
    const assignee = row[3];    // Column D (assignee — was col F)
    if (description && description.toString().trim() !== "") {
      todos.push({
        description: description.toString().trim(),
        assignee: assignee ? assignee.toString().trim() : ""
      });
    }
  });

  // Calculate week ending (next Sunday from this date)
  const weekEnding = new Date(date);
  const daysUntilSunday = (7 - weekEnding.getDay()) % 7;
  weekEnding.setDate(weekEnding.getDate() + daysUntilSunday);

  return {
    // Core identifiers
    date: date,
    dayOfWeek: Utilities.formatDate(date, INTEGRATION_CONFIG.timezone, "EEEE"),
    weekEnding: weekEnding,
    mod: mod,

    // Staff (split fields — new layout)
    fohStaff: fohStaff,
    bohStaff: bohStaff,
    // Combined staff string for display and warehouse (kept as 'staff' for M1/M5 AI prompt compat)
    staff: staffCombined,

    // Revenue & production
    netRevenue: finNum(54),             // B54 (formula)
    productionAmount: finNum(37),       // B37

    // Cash reconciliation (C-column)
    cashTake: finC_Num(19),             // C19 (formula — cash take = counted minus refloats)
    cashCounted: finC_Num(18),          // C18 (formula — physical count)
    cashReturns: finC_Num(22),          // C22
    cdDiscount: finC_Num(23),           // C23
    totalCashRecorded: finC_Num(24),    // C24 (formula)
    cashVariance: finC_Num(26),         // C26 (formula)

    // Tips (C-column)
    cashTips: finC_Num(29),             // C29
    cardTips: finC_Num(30),             // C30
    surchargeTips: finC_Num(31),        // C31
    totalTips: finC_Num(32),            // C32 (formula)
    // Legacy alias used by M4 analytics (shiftData.tipsTotal)
    tipsTotal: finC_Num(32),            // C32 (formula) — same as totalTips

    // Financial calculations (B-column formulas)
    grossSales: finNum(48),                  // B48 (formula — was grossSalesIncCash B16)
    totalAdjustmentsDiscounts: finNum(50),   // B50 (was totalDiscount B25)
    discountsExcCashDiscount: finNum(51),    // B51 (formula — was discountsCompsExcCD B26)
    grossSalesLessDiscounts: finNum(52),     // B52 (formula — was grossTaxableSales B27)
    taxes: finNum(53),                       // B53 (formula — was B28)

    // Removed fields — kept as null for warehouse schema compatibility
    refunds: null,        // No longer on new sheet (warehouse col L = NULL)
    cdRedeem: null,       // No longer on new sheet (warehouse col M = NULL)
    netSalesWTips: null,  // No longer on new sheet (warehouse col R = NULL)

    // Operational events
    todos: todos,

    // Qualitative / narrative fields
    generalShiftComments: narr(59),   // A59 (was shiftReport/shiftSummary at A43)
    guestsOfNote: narr(61),           // A61 (was A45)
    theGood: narr(63),                // A63 (was A47)
    theBad: narr(65),                 // A65 (was A49)
    kitchenNotes: narr(67),           // A67 (was A51)

    // Incidents & wastage (narr() offset is row - 59; A59:A90 = 32 rows)
    wastageComps: narr(86),        // A86 (index 27 within A59:A90)
    maintenanceIssues: narr(88),   // A88 (index 29)
    rsaIncidents: narr(90),        // A90 (index 31)

    // Metadata
    sheetName: sheetName
  };
}


/* ==========================================================================
   INTEGRATION 1: DATA WAREHOUSE LOGGING
   ========================================================================== */

/**
 * Normalise a date value (Date object or string) to a canonical
 * "Weekday Mon DD YYYY" string for duplicate-detection comparisons.
 * Returns null if the value cannot be parsed as a valid date.
 *
 * @param {*} v - Date object or date string
 * @returns {string|null}
 */
function normaliseDateKey_(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : parseCellDate_(v.toString());
  return (!d || isNaN(d.getTime())) ? null : d.toDateString();
}

/**
 * Log shift data to centralized analytics warehouse.
 * Populates: NIGHTLY_FINANCIAL (22 cols), OPERATIONAL_EVENTS (8 cols),
 *            WASTAGE_COMPS (6 cols), QUALITATIVE_LOG (11 cols).
 *
 * Schema updated 2026-03-06: removed Covers/Labor/derived metrics,
 * added full financial breakdown (B8, B15-B29).
 *
 * @param {Object}  shiftData  - Standardized shift data from extractShiftData_()
 * @param {Object}  [config]   - Optional pre-loaded INTEGRATION_CONFIG
 * @param {boolean} [skipLock] - Pass true when the caller already holds the script lock
 *                               (e.g. runWeeklyBackfill_). GAS locks are not re-entrant;
 *                               acquiring the same lock twice will always time out.
 * @returns {Object} {financialLogged, financialSkipped, eventsLogged, wastageLogged, qualLogged}
 */
function logToDataWarehouse_(shiftData, config, skipLock) {
  const INTEGRATION_CONFIG = config || getIntegrationConfig_();
  if (!INTEGRATION_CONFIG.dataWarehouseId) {
    throw new Error("Data warehouse ID not configured. Update INTEGRATION_CONFIG.dataWarehouseId");
  }

  // Concurrency guard — prevents duplicate writes if triggered simultaneously.
  // Skipped when caller (e.g. runWeeklyBackfill_) already holds the lock.
  let lock = null;
  if (!skipLock) {
    lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) {
      Logger.log('logToDataWarehouse_: Could not acquire lock — skipping concurrent write');
      return {
        success: false,
        financialLogged: false,
        financialSkipped: false,
        eventsLogged: 0,
        wastageLogged: false,
        qualLogged: false,
        errors: ['Lock timeout — concurrent write in progress'],
        warnings: []
      };
    }
  }

  const logResult = {
    financialLogged: false,
    financialSkipped: false,
    eventsLogged: 0,
    wastageLogged: false,
    qualLogged: false
  };

  try {

  const warehouse = SpreadsheetApp.openById(INTEGRATION_CONFIG.dataWarehouseId);

  // 1. Log financial data to NIGHTLY_FINANCIAL sheet (22 columns A-V)
  const financialSheet = warehouse.getSheetByName(INTEGRATION_CONFIG.sheets.financialLog);
  if (!financialSheet) {
    throw new Error(`Sheet "${INTEGRATION_CONFIG.sheets.financialLog}" not found in warehouse`);
  }

  // Check for duplicates (same date + same MOD = duplicate)
  const lastFinRow = financialSheet.getLastRow();
  const existingData = lastFinRow > 1
    ? financialSheet.getRange(2, 1, lastFinRow - 1, 4).getValues()
    : [];
  const shiftDateKey = normaliseDateKey_(shiftData.date);
  const isDuplicate = existingData.some(row => {
    const rowKey = normaliseDateKey_(row[0]);
    return rowKey !== null && rowKey === shiftDateKey && row[3] === shiftData.mod;
  });

  if (isDuplicate) {
    Logger.log(`  ⚠ Duplicate prevented: ${shiftData.date.toDateString()} (${shiftData.mod}) already logged`);
    logResult.financialSkipped = true;
  } else {
    // Header assertion: enforce 25-column schema before writing.
    // Guards against half-deployed state where header row hasn't been migrated yet.
    // New schema (new-sheet cutover): V=CashCounted, W=ExpectedCash, X=CashVariance, Y=LoggedAt
    // (LoggedAt moved from V to Y vs the old-sheet schema).
    const headerRow = financialSheet.getLastRow() >= 1
      ? financialSheet.getRange(1, 1, 1, financialSheet.getLastColumn()).getValues()[0]
      : [];
    const actualCols = headerRow.length;
    if (actualCols > 0 && actualCols !== 25) {
      throw new Error(
        'NIGHTLY_FINANCIAL has ' + actualCols + ' columns but expected 25. ' +
        'Add CashCounted, ExpectedCash, CashVariance headers to columns W/X/Y before deploying. ' +
        'See Phase 2 pre-deploy checklist.'
      );
    }

    financialSheet.appendRow([
      toDateOnly_(shiftData.date),                // A: Date (midnight, no time component)
      shiftData.dayOfWeek,                        // B: Day
      toDateOnly_(shiftData.weekEnding),          // C: Week Ending (midnight, no time component)
      shiftData.mod,                              // D: MOD
      shiftData.staff,                            // E: Staff (concat "FOH: … | BOH: …")
      shiftData.netRevenue,                       // F: Net Revenue (B54, formula)
      shiftData.productionAmount,                 // G: Production Amount (B37)
      shiftData.cashTake,                         // H: CashTakings — schema header kept; sources C19
      shiftData.grossSales,                       // I: GrossSalesIncCash — schema header kept; sources B48
      shiftData.cashReturns,                      // J: Cash Returns (C22)
      shiftData.cdDiscount,                       // K: CD Discount (C23)
      null,                                       // L: Refunds — field removed from new sheet; preserve col
      null,                                       // M: CDRedeem — field removed from new sheet; preserve col
      shiftData.totalAdjustmentsDiscounts,        // N: TotalDiscount — schema header kept; sources B50
      shiftData.discountsExcCashDiscount,         // O: DiscountsCompsExcCD — schema header kept; sources B51
      shiftData.grossSalesLessDiscounts,          // P: GrossTaxableSales — schema header kept; sources B52
      shiftData.taxes,                            // Q: Taxes (B53, formula)
      null,                                       // R: NetSalesWTips — no direct equivalent; preserve col
      shiftData.cardTips,                         // S: Card Tips (C30)
      shiftData.cashTips,                         // T: Cash Tips (C29)
      shiftData.totalTips,                        // U: Total Tips (C32, formula)
      shiftData.cashCounted  || null,             // V: CashCounted (C18, formula)
      shiftData.totalCashRecorded || null,        // W: ExpectedCash — schema header kept; sources C24
      shiftData.cashVariance || null,             // X: CashVariance (C26, formula)
      new Date()                                  // Y: LoggedAt (moved from V to Y)
    ]);
    Logger.log(`  → Logged financial data to warehouse (25 cols)`);
    logResult.financialLogged = true;
  }

  // 2. Log operational events (TO-DOs) to OPERATIONAL_EVENTS sheet (8 columns A-H)
  const eventsSheet = warehouse.getSheetByName(INTEGRATION_CONFIG.sheets.operationalLog);
  if (eventsSheet && shiftData.todos && shiftData.todos.length > 0) {
    // Duplicate detection: Date (col A, index 0) + Description (col D, index 3)
    const lastEvtRow = eventsSheet.getLastRow();
    const existingEvents = lastEvtRow > 1
      ? eventsSheet.getRange(2, 1, lastEvtRow - 1, 4).getValues()
      : [];
    const shiftDateKeyEvt = normaliseDateKey_(shiftData.date);

    const newEventRows = [];
    shiftData.todos.forEach(todo => {
      const isDupeRow = existingEvents.some(row => {
        const rowKey = normaliseDateKey_(row[0]);
        return rowKey !== null && rowKey === shiftDateKeyEvt && row[3] === todo.description;
      });
      if (isDupeRow) {
        Logger.log(`  → Skipped OPERATIONAL_EVENTS duplicate: ${shiftData.date.toDateString()} / "${todo.description}"`);
        return;
      }
      newEventRows.push([
        toDateOnly_(shiftData.date),       // A: Date
        shiftData.dayOfWeek,  // B: Day
        shiftData.mod,        // C: MOD
        todo.description,     // D: Description
        todo.assignee,        // E: Assignee
        "MEDIUM",             // F: Priority
        "Shift Report",       // G: Source
        new Date()            // H: Logged At
      ]);
      logResult.eventsLogged++;
    });
    if (newEventRows.length > 0) {
      eventsSheet.getRange(eventsSheet.getLastRow() + 1, 1, newEventRows.length, 8).setValues(newEventRows);
      Logger.log(`  → Logged ${logResult.eventsLogged} TO-DO(s) to warehouse`);
    }
  }

  // 3. Log wastage/comp notes to WASTAGE_COMPS sheet (6 columns A-F)
  if (shiftData.wastageComps) {
    const wastageSheet = warehouse.getSheetByName(INTEGRATION_CONFIG.sheets.wastageLog);
    if (wastageSheet) {
      const shiftDateKeyWast = normaliseDateKey_(shiftData.date);
      const lastWastRow = wastageSheet.getLastRow();
      const wastDup = (lastWastRow > 1
        ? wastageSheet.getRange(2, 1, lastWastRow - 1, 4).getValues()
        : []
      ).some(row => {
        const rowKey = normaliseDateKey_(row[0]);
        return rowKey !== null && rowKey === shiftDateKeyWast && row[3] === shiftData.mod;
      });
      if (!wastDup) {
        wastageSheet.appendRow([
          toDateOnly_(shiftData.date),           // A: Date
          shiftData.dayOfWeek,                   // B: Day
          toDateOnly_(shiftData.weekEnding),     // C: Week Ending
          shiftData.mod,            // D: MOD
          shiftData.wastageComps,   // E: Notes
          new Date()                // F: Logged At
        ]);
        Logger.log(`  → Logged wastage/comp notes to warehouse`);
        logResult.wastageLogged = true;
      }
    }
  }

  // 4. Log qualitative/narrative data to QUALITATIVE_LOG sheet (11 columns A-K)
  const qualSheet = warehouse.getSheetByName(INTEGRATION_CONFIG.sheets.qualitativeLog);
  if (qualSheet) {
    const shiftDateKeyQual = normaliseDateKey_(shiftData.date);
    const lastQualRow = qualSheet.getLastRow();
    const qualDup = (lastQualRow > 1
      ? qualSheet.getRange(2, 1, lastQualRow - 1, 3).getValues()
      : []
    ).some(row => {
      const rowKey = normaliseDateKey_(row[0]);
      return rowKey !== null && rowKey === shiftDateKeyQual && row[2] === shiftData.mod;
    });
    if (!qualDup) {
      qualSheet.appendRow([
        toDateOnly_(shiftData.date),           // A: Date
        shiftData.dayOfWeek,      // B: Day
        shiftData.mod,            // C: MOD
        shiftData.generalShiftComments,   // D: Shift Summary (field renamed in new sheet layout)
        shiftData.guestsOfNote,   // E: Guests of Note
        shiftData.theGood,        // F: The Good
        shiftData.theBad,         // G: The Bad
        shiftData.kitchenNotes,   // H: Kitchen Notes
        shiftData.maintenanceIssues, // I: Maintenance Issues
        shiftData.rsaIncidents,   // J: RSA/Incidents
        new Date()                // K: Logged At
      ]);
      Logger.log(`  → Logged qualitative data to warehouse`);
      logResult.qualLogged = true;
    }
  }

  // Auto-build analytics dashboard if ANALYTICS tab is missing or empty
  if (logResult.financialLogged) {
    try {
      const warehouseId = PropertiesService.getScriptProperties().getProperty('WARATAH_DATA_WAREHOUSE_ID');
      if (warehouseId) {
        const wss = SpreadsheetApp.openById(warehouseId);
        const analyticsSheet = wss.getSheetByName('ANALYTICS');
        if (!analyticsSheet || analyticsSheet.getLastRow() <= 1) {
          buildFinancialDashboard(); // defined in AnalyticsDashboard.js
          Logger.log('logToDataWarehouse_: auto-built financial dashboard (ANALYTICS tab was missing/empty)');
        }
      }
    } catch (e) {
      Logger.log('logToDataWarehouse_: auto-build analytics failed (non-blocking): ' + e.message);
    }

    // M2 — Revenue Anomaly Detection (non-blocking)
    try {
      const warehouseId = PropertiesService.getScriptProperties().getProperty('WARATAH_DATA_WAREHOUSE_ID');
      if (warehouseId) detectRevenueAnomalies_Waratah(shiftData, warehouseId);
    } catch (e) {
      Logger.log('M2 anomaly check error: ' + e.message);
    }
  }

  return logResult;

  } finally {
    if (lock) lock.releaseLock();
  }
}


/* ==========================================================================
   VALIDATION ENGINE
   ========================================================================== */

/**
 * Validate shift data for errors and warnings
 *
 * @param {Object} shiftData - Standardized shift data object
 * @returns {Object} {errors: [], warnings: [], passed: boolean}
 */
function validateShiftData_(shiftData) {
  const validation = {
    errors: [],
    warnings: [],
    passed: true
  };

  // 1. Required fields validation
  if (!shiftData.date || !(shiftData.date instanceof Date) || isNaN(shiftData.date.getTime())) {
    validation.errors.push("Invalid or missing date (cell B3)");
  }
  if (!shiftData.mod || shiftData.mod === "") {
    validation.errors.push("MOD name is required (cell B4)");
  }
  if (shiftData.netRevenue <= 0) {
    validation.warnings.push("Net revenue is $0 or negative (cell B54) — verify before exporting. Continuing.");
  }

  // 2. Financial logic checks
  // DISABLED 2026-02-15: This validation was comparing Cash Tips + Card Tips to Net Revenue,
  // which will always fail since tips are only ~5-15% of revenue. The template doesn't
  // capture cash/card revenue breakdown, only cash/card tips breakdown.
  // Validation removed to allow staff to send shift reports without being blocked.
  //
  // const calculatedTotal = shiftData.cashTotal + shiftData.cardTotal;
  // const discrepancy = Math.abs(calculatedTotal - shiftData.netRevenue);
  //
  // // Critical error - blocks send
  // if (discrepancy > INTEGRATION_CONFIG.validationThresholds.criticalDiscrepancy) {
  //   validation.errors.push(
  //     `CRITICAL: Cash + Cards ($${calculatedTotal.toFixed(2)}) differs from Net Revenue ` +
  //     `($${shiftData.netRevenue.toFixed(2)}) by $${discrepancy.toFixed(2)}. ` +
  //     `Maximum allowed discrepancy is $${INTEGRATION_CONFIG.validationThresholds.criticalDiscrepancy}.`
  //   );
  // }
  // // Warning - allows send but flags issue
  // else if (discrepancy > INTEGRATION_CONFIG.validationThresholds.maxDiscrepancy) {
  //   validation.warnings.push(
  //     `Cash + Cards ($${calculatedTotal.toFixed(2)}) differs from Net Revenue ` +
  //     `($${shiftData.netRevenue.toFixed(2)}) by $${discrepancy.toFixed(2)}. Please verify.`
  //   );
  // }

  // 3. Set overall status
  if (validation.errors.length > 0) {
    validation.passed = false;
  }

  return validation;
}


/* ==========================================================================
   LOGGING & ALERTS
   ========================================================================== */

/**
 * Log integration run to execution log
 *
 * @param {string} sheetName - Name of the shift report sheet
 * @param {Object} results - Integration results object
 * @param {Date} startTime - When integration started
 */
function logIntegrationRun_(sheetName, results, startTime) {
  const duration = ((new Date() - startTime) / 1000).toFixed(2);

  Logger.log(`
═══════════════════════════════════════════════════════
Integration Summary for ${sheetName}
═══════════════════════════════════════════════════════
Duration:        ${duration}s
Overall Success: ${results.success ? '✓' : '✗'}
Errors:          ${results.errors.length}
Warnings:        ${results.warnings.length}

Component Status:
- Data Extraction: ${results.integrations.dataExtraction?.success ? '✓' : '✗'}
- Validation:      ${results.integrations.validation?.passed ? '✓' : '✗'}
- Warehouse:       ${results.integrations.warehouse?.success ? '✓' : '⚠'}

${results.errors.length > 0 ? 'ERRORS:\n' + results.errors.map(e => '  • ' + e).join('\n') : ''}
${results.warnings.length > 0 ? 'WARNINGS:\n' + results.warnings.map(w => '  • ' + w).join('\n') : ''}
═══════════════════════════════════════════════════════
  `);

  // Send alert email if there were errors
  if (results.errors.length > 0) {
    sendIntegrationAlert_(
      "Integration Errors Detected",
      results.errors.join("\n\n"),
      sheetName
    );
  }
}

/**
 * Send integration alert email
 *
 * @param {string} subject - Email subject
 * @param {string} message - Alert message
 * @param {string} sheetName - Name of the shift report sheet
 * @param {Object} [config]  - Optional pre-loaded INTEGRATION_CONFIG
 */
function sendIntegrationAlert_(subject, message, sheetName, config) {
  const INTEGRATION_CONFIG = config || getIntegrationConfig_();
  const fullSubject = `[Waratah Integrations] ${subject}`;
  const body = `
Shift Report: ${sheetName}
Time: ${Utilities.formatDate(new Date(), INTEGRATION_CONFIG.timezone, "dd/MM/yyyy HH:mm:ss")}

${message}

═══════════════════════════════════════════════════════
This is an automated alert from the Waratah Integration Hub.
Check the Apps Script execution logs for full details.
═══════════════════════════════════════════════════════
  `;

  try {
    GmailApp.sendEmail(
      INTEGRATION_CONFIG.alerts.integrationErrors,
      fullSubject,
      body
    );
    Logger.log(`📧 Alert email sent to ${INTEGRATION_CONFIG.alerts.integrationErrors}`);
  } catch (e) {
    Logger.log(`❌ Failed to send alert email: ${e.message}`);
  }
}

/**
 * Append a run record to the INTEGRATION_LOG sheet in the data warehouse.
 * Creates the sheet with headers if it doesn't exist.
 * Non-blocking — if this fails, it is silently swallowed.
 *
 * @param {string} sheetName - Shift report sheet name
 * @param {Object} results   - runIntegrations results object
 * @param {Date}   startTime - When the run started
 * @param {Object} [config]  - Optional pre-loaded INTEGRATION_CONFIG
 */
function appendToIntegrationLog_(sheetName, results, startTime, config) {
  try {
    const INTEGRATION_CONFIG = config || getIntegrationConfig_();
    if (!INTEGRATION_CONFIG.dataWarehouseId) return;

    const warehouse = SpreadsheetApp.openById(INTEGRATION_CONFIG.dataWarehouseId);
    let logSheet = warehouse.getSheetByName('INTEGRATION_LOG');

    if (!logSheet) {
      logSheet = warehouse.insertSheet('INTEGRATION_LOG');
      logSheet.appendRow([
        'Timestamp', 'SheetName', 'Success', 'Duration_s',
        'Errors', 'Warnings', 'Financial_Logged', 'Financial_Skipped', 'Events_Logged'
      ]);
      logSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#f3f3f3');
      logSheet.setFrozenRows(1);
    }

    const duration = ((new Date() - startTime) / 1000).toFixed(2);
    const wh = results.integrations.warehouse || {};

    logSheet.appendRow([
      new Date(),
      sheetName,
      results.success ? 'TRUE' : 'FALSE',
      duration,
      results.errors.join(' | ') || '',
      results.warnings.join(' | ') || '',
      wh.financialLogged ? 'TRUE' : 'FALSE',
      wh.financialSkipped ? 'TRUE' : 'FALSE',
      wh.eventsLogged || 0
    ]);
  } catch (e) {
    Logger.log(`appendToIntegrationLog_ failed (non-blocking): ${e.message}`);
  }
}


/* ==========================================================================
   MANUAL TESTING & UTILITIES
   ========================================================================== */

/**
 * Show a summary of the last 30 days of integration runs from INTEGRATION_LOG.
 * Run from menu: Admin Tools → Data Warehouse → Show Integration Log
 */
function showIntegrationLogStats() {
  const ui = SpreadsheetApp.getUi();
  const INTEGRATION_CONFIG = getIntegrationConfig_();
  if (!INTEGRATION_CONFIG.dataWarehouseId) {
    ui.alert('Not configured', 'WARATAH_DATA_WAREHOUSE_ID not set in Script Properties.', ui.ButtonSet.OK);
    return;
  }

  try {
    const warehouse = SpreadsheetApp.openById(INTEGRATION_CONFIG.dataWarehouseId);
    const logSheet = warehouse.getSheetByName('INTEGRATION_LOG');
    if (!logSheet || logSheet.getLastRow() < 2) {
      ui.alert('No Data', 'INTEGRATION_LOG is empty or does not exist yet.\n\nRun a shift export first to create it.', ui.ButtonSet.OK);
      return;
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const rows = logSheet.getDataRange().getValues().slice(1); // skip header
    const recent = rows.filter(r => r[0] instanceof Date && r[0] >= cutoff);

    const total = recent.length;
    const successes = recent.filter(r => r[2] === 'TRUE').length;
    const failures = total - successes;
    const financialLogged = recent.filter(r => r[6] === 'TRUE').length;
    const financialSkipped = recent.filter(r => r[7] === 'TRUE').length;
    const backfills = recent.filter(r => r[1] && r[1].includes('[BACKFILL]')).length;

    const lastEntry = total > 0 ? recent[recent.length - 1] : null;
    const lastSheet = lastEntry ? lastEntry[1] : 'N/A';
    const lastTime = lastEntry && lastEntry[0] instanceof Date
      ? Utilities.formatDate(lastEntry[0], INTEGRATION_CONFIG.timezone, 'dd/MM/yyyy HH:mm')
      : 'N/A';

    const msg =
      `Integration Log — Last 30 Days\n` +
      `${'─'.repeat(36)}\n` +
      `Total runs:          ${total}\n` +
      `Successful:          ${successes}\n` +
      `Failed/partial:      ${failures}\n\n` +
      `Financial logged:    ${financialLogged}\n` +
      `Duplicate skipped:   ${financialSkipped}\n` +
      `Manual backfills:    ${backfills}\n\n` +
      `Last run: ${lastTime}\n` +
      `Last sheet: ${lastSheet}`;

    ui.alert('Integration Log Stats', msg, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Error', `Could not read INTEGRATION_LOG: ${e.message}`, ui.ButtonSet.OK);
  }
}

/**
 * Test integrations on the currently active sheet
 * Run this manually from the script editor to test
 */
function testIntegrations() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const sheetName = sheet.getName();

  Logger.log(`\n\n${'═'.repeat(60)}`);
  Logger.log(`MANUAL TEST RUN`);
  Logger.log(`${'═'.repeat(60)}\n`);

  const results = runIntegrations(sheetName);

  // Build UI message
  const ui = SpreadsheetApp.getUi();
  let message = `Integration Test Results:\n\n`;
  message += `Overall: ${results.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
  message += `Errors: ${results.errors.length}\n`;
  message += `Warnings: ${results.warnings.length}\n\n`;

  if (results.errors.length > 0) {
    message += `ERRORS:\n${results.errors.join('\n\n')}\n\n`;
  }
  if (results.warnings.length > 0) {
    message += `WARNINGS:\n${results.warnings.join('\n\n')}`;
  }

  if (results.success && results.errors.length === 0 && results.warnings.length === 0) {
    message += `✅ All systems operational!\n`;
    message += `✅ Data logged to warehouse\n`;
  }

  ui.alert("Integration Test Complete", message, ui.ButtonSet.OK);
}

/**
 * Validate all integration connections (health check)
 * Run this to verify all systems are accessible
 */
function runValidationReport() {
  const INTEGRATION_CONFIG = getIntegrationConfig_();
  const ui = SpreadsheetApp.getUi();

  let report = "INTEGRATION HEALTH CHECK\n";
  report += "═".repeat(40) + "\n\n";

  // Check warehouse connection
  try {
    if (!INTEGRATION_CONFIG.dataWarehouseId) {
      report += "❌ Data Warehouse: NOT CONFIGURED\n";
      report += "   → Update INTEGRATION_CONFIG.dataWarehouseId\n\n";
    } else {
      const warehouse = SpreadsheetApp.openById(INTEGRATION_CONFIG.dataWarehouseId);
      const financialSheet = warehouse.getSheetByName(INTEGRATION_CONFIG.sheets.financialLog);
      const eventsSheet = warehouse.getSheetByName(INTEGRATION_CONFIG.sheets.operationalLog);

      const wastageSheet = warehouse.getSheetByName(INTEGRATION_CONFIG.sheets.wastageLog);
      const qualSheet = warehouse.getSheetByName(INTEGRATION_CONFIG.sheets.qualitativeLog);

      if (!financialSheet) {
        report += "⚠️  Data Warehouse: Connected but missing NIGHTLY_FINANCIAL sheet\n\n";
      } else if (!eventsSheet) {
        report += "⚠️  Data Warehouse: Connected but missing OPERATIONAL_EVENTS sheet\n\n";
      } else {
        report += "✅ Data Warehouse: Connected\n";
        report += `   → ${warehouse.getName()}\n`;
        const finCols = financialSheet.getLastColumn();
        const evtCols = eventsSheet.getLastColumn();
        report += `   → NIGHTLY_FINANCIAL: ${financialSheet.getLastRow() - 1} rows, ${finCols} cols (expected 25 after Phase 1 migration)\n`;
        report += `   → OPERATIONAL_EVENTS: ${eventsSheet.getLastRow() - 1} rows, ${evtCols} cols (expected 8)\n`;
        if (wastageSheet) {
          const wstCols = wastageSheet.getLastColumn();
          report += `   → WASTAGE_COMPS: ${wastageSheet.getLastRow() - 1} rows, ${wstCols} cols (expected 6)\n`;
        } else {
          report += "   ⚠️  WASTAGE_COMPS tab missing\n";
        }
        if (qualSheet) {
          const qualCols = qualSheet.getLastColumn();
          report += `   → QUALITATIVE_LOG: ${qualSheet.getLastRow() - 1} rows, ${qualCols} cols (expected 11)\n\n`;
        } else {
          report += "   ⚠️  QUALITATIVE_LOG tab missing\n\n";
        }
      }
    }
  } catch (e) {
    report += "❌ Data Warehouse: NOT ACCESSIBLE\n";
    report += `   → Error: ${e.message}\n\n`;
  }

  // Check task management
  try {
    const taskSheet = SpreadsheetApp.openById(INTEGRATION_CONFIG.taskManagementId);
    report += "✅ Task Management: Connected\n";
    report += `   → ${taskSheet.getName()}\n\n`;
  } catch (e) {
    report += "❌ Task Management: NOT ACCESSIBLE\n";
    report += `   → Error: ${e.message}\n\n`;
  }

  // Check current shift report
  try {
    const currentSheet = SpreadsheetApp.getActiveSheet();
    report += "✅ Current Sheet: Ready\n";
    report += `   → ${currentSheet.getName()}\n\n`;
  } catch (e) {
    report += "❌ Current Sheet: ERROR\n";
    report += `   → Error: ${e.message}\n\n`;
  }

  report += "═".repeat(40) + "\n";
  report += "Run this check after initial setup to verify\n";
  report += "all systems are properly connected.";

  ui.alert("System Validation Report", report, ui.ButtonSet.OK);
}

/**
 * Manually push a single shift report sheet to the data warehouse.
 * Bypasses export-blocking validation — useful for historical shifts or corrections.
 *
 * HOW TO USE: Navigate to the target shift report sheet, then run this function
 * from the Apps Script editor (or add to menu).
 */
function backfillShiftToWarehouse() {
  const ui = SpreadsheetApp.getUi();
  const INTEGRATION_CONFIG = getIntegrationConfig_();
  const sheet = SpreadsheetApp.getActiveSheet();
  const sheetName = sheet.getName();

  const DAYS = ['WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const isShiftSheet = DAYS.some(day => sheetName.toUpperCase().startsWith(day));
  if (!isShiftSheet) {
    ui.alert(
      'Not a Shift Report Sheet',
      `"${sheetName}" does not look like a shift report sheet.\n\n` +
      'Navigate to the correct day sheet and run again.',
      ui.ButtonSet.OK
    );
    return;
  }

  const confirmResponse = ui.alert(
    'Backfill Shift to Warehouse',
    `Push "${sheetName}" to the data warehouse?\n\n` +
    '• Duplicate records will be skipped\n' +
    '• This does NOT send email or Slack\n' +
    '• Check Apps Script logs for details',
    ui.ButtonSet.YES_NO
  );
  if (confirmResponse !== ui.Button.YES) return;

  const startTime = new Date();
  try {
    const shiftData = extractShiftData_(sheetName, INTEGRATION_CONFIG);
    const warehouseResult = logToDataWarehouse_(shiftData, INTEGRATION_CONFIG);

    const duration = ((new Date() - startTime) / 1000).toFixed(1);
    let msg = `Backfill complete (${duration}s)\n\n`;

    if (warehouseResult.financialSkipped) {
      msg += '⚠ Financial record already existed — skipped (duplicate).\n';
    } else if (warehouseResult.financialLogged) {
      msg += '✓ Financial data logged.\n';
    }
    if (warehouseResult.eventsLogged > 0) {
      msg += `✓ ${warehouseResult.eventsLogged} TO-DO(s) logged.\n`;
    }
    if (warehouseResult.wastageLogged) {
      msg += '✓ Wastage/comp notes logged.\n';
    }
    if (warehouseResult.qualLogged) {
      msg += '✓ Qualitative data logged.\n';
    }

    const results = {
      success: true,
      errors: [],
      warnings: warehouseResult.financialSkipped
        ? ['Financial record already existed — duplicate skipped']
        : [],
      integrations: { warehouse: warehouseResult }
    };
    appendToIntegrationLog_(sheetName + ' [BACKFILL]', results, startTime, INTEGRATION_CONFIG);

    ui.alert('Backfill Complete', msg, ui.ButtonSet.OK);

  } catch (e) {
    ui.alert(
      'Backfill Failed',
      `Error: ${e.message}\n\nCheck Apps Script logs for details.`,
      ui.ButtonSet.OK
    );
    Logger.log(`backfillShiftToWarehouse failed for "${sheetName}": ${e.message}`);
  }
}

/**
 * Iterate all shift report sheets and backfill any not yet in the data warehouse.
 * Designed to be called by a weekly time-based trigger (Monday 8am).
 */
function runWeeklyBackfill_() {
  const INTEGRATION_CONFIG = getIntegrationConfig_();
  if (!INTEGRATION_CONFIG.dataWarehouseId) {
    Logger.log('runWeeklyBackfill_: WARATAH_DATA_WAREHOUSE_ID not configured. Skipping.');
    return;
  }

  // Concurrency guard — prevents duplicate runs if trigger fires while a prior instance is still running
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log('runWeeklyBackfill_: could not acquire lock — another instance is running');
    return;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const warehouse = SpreadsheetApp.openById(INTEGRATION_CONFIG.dataWarehouseId);
    const financialSheet = warehouse.getSheetByName(INTEGRATION_CONFIG.sheets.financialLog);

    if (!financialSheet) {
      Logger.log('runWeeklyBackfill_: NIGHTLY_FINANCIAL sheet not found in warehouse. Skipping.');
      return;
    }

    const lastFinRowBF = financialSheet.getLastRow();
    const existingData = lastFinRowBF > 1
      ? financialSheet.getRange(2, 1, lastFinRowBF - 1, 4).getValues()
      : [];
    const loggedKeys = new Set(
      existingData
        .filter(row => row[0] instanceof Date)
        .map(row => `${row[0].toDateString()}|${row[3]}`)
    );

    const DAYS = ['WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    let processed = 0, logged = 0, skipped = 0, failed = 0;

    sheets.forEach(sheet => {
      const name = sheet.getName();
      if (!DAYS.some(day => name.toUpperCase().startsWith(day))) return;

      processed++;
      try {
        const shiftData = extractShiftData_(name, INTEGRATION_CONFIG);
        if (!shiftData.date || isNaN(shiftData.date.getTime())) {
          Logger.log(`  runWeeklyBackfill_: skipping "${name}" — invalid date`);
          skipped++;
          return;
        }

        const key = `${shiftData.date.toDateString()}|${shiftData.mod}`;
        if (loggedKeys.has(key)) {
          skipped++;
          return;
        }

        logToDataWarehouse_(shiftData, INTEGRATION_CONFIG, true); // skipLock: caller holds the lock
        loggedKeys.add(key);
        Logger.log(`  runWeeklyBackfill_: logged "${name}" to warehouse`);
        logged++;

      } catch (e) {
        Logger.log(`  runWeeklyBackfill_: failed for "${name}": ${e.message}`);
        failed++;
      }
    });

    Logger.log(
      `runWeeklyBackfill_ complete: ${processed} sheets checked, ` +
      `${logged} logged, ${skipped} already existed, ${failed} failed`
    );
  } catch (e) {
    notifyError_('runWeeklyBackfill_', e);
    throw e;
  } finally {
    lock.releaseLock();
  }
}


/**
 * Install a weekly time-based trigger for runWeeklyBackfill_().
 * Safe to re-run — removes any existing trigger first.
 */
function setupWeeklyBackfillTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'runWeeklyBackfill_')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('runWeeklyBackfill_')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .create();

  Logger.log('Weekly backfill trigger installed: runs every Monday at 8am.');
  try {
    SpreadsheetApp.getUi().alert(
      'Trigger Installed',
      'runWeeklyBackfill_() will run every Monday at 8am.\n\n' +
      'To remove: Apps Script editor → Triggers (clock icon) → delete the trigger.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (e) { Logger.log('UI alert skipped — trigger context'); }
}
