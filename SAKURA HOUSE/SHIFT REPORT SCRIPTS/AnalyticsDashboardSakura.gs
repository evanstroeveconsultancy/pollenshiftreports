/****************************************************
 * SAKURA HOUSE FINANCIAL ANALYTICS DASHBOARD
 *
 * Builds and refreshes the ANALYTICS tab in the
 * Data Warehouse spreadsheet using live formulas.
 *
 * Run buildFinancialDashboard() once to set up,
 * then the formulas auto-update as new data arrives.
 *
 * Data source: NIGHTLY_FINANCIAL sheet
 * Columns: A=Date, B=Day, C=WeekEnding, D=MOD,
 *   E=NetRevenue, F=CashTotal, G=CashTips, H=TipsTotal,
 *   I=LoggedAt, J=ProductionAmount, K=Discounts, L=Deposit,
 *   M=FOHStaff, N=BOHStaff, O=CardTips, P=SurchargeTips
 *
 * Sections:
 *   1. This Week snapshot
 *   2. Week-over-Week comparison
 *   3. Day-of-Week averages (Mon-Sat)
 *   4. Weekly Trend (QUERY, columns H+)
 *
 * @version 2.1.0
 ****************************************************/


const ANALYTICS_CONFIG = {
  sourceSheet: "NIGHTLY_FINANCIAL",
  dashboardSheet: "ANALYTICS",
  executiveSheet: "EXECUTIVE_DASHBOARD",
  timezone: "Australia/Sydney"
};


/**
 * Builds the financial analytics dashboard.
 * Sets up headers, formulas, and formatting on the ANALYTICS tab.
 * Safe to re-run — clears and rebuilds each time.
 *
 * Layout (unified design system):
 *   Row 1:   Header (SAKURA · ANALYTICS DASHBOARD) + timestamp
 *   Row 2:   Spacer
 *   Row 4:   THIS WEEK hero card (A4:F9)  |  WEEKLY TREND hero card (I4:N5)
 *   Rows 5-9: THIS WEEK data              |  Trend col headers (I5) + QUERY (I6)
 *   Row 11:  WEEK-OVER-WEEK hairline
 *   Row 12:  Previous Week Ending
 *   Row 13:  WoW column headers
 *   Rows 14-17: WoW data (4 metrics)
 *   Row 21:  DAY-OF-WEEK AVERAGES hairline
 *   Row 22:  DoW column headers
 *   Rows 23-28: DoW data (Mon-Sat, 6 days)
 *   Row 30:  AVERAGE WEEKLY (ALL WEEKS) hairline
 *   Rows 31-32: Avg Weekly data
 *   Row 34+: Extended Trends (M7) — buildExtendedTrends_Sakura
 *   Row ?+:  Analytics Extensions (M8) — buildAnalyticsExtensions_Sakura
 */
function buildFinancialDashboard() {
  const warehouseId = getDataWarehouseId_();

  if (!warehouseId) {
    try {
      SpreadsheetApp.getUi().alert(
        "Data Warehouse Not Configured",
        "Set SAKURA_DATA_WAREHOUSE_ID in Script Properties before building the dashboard.",
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } catch (e) {
      Logger.log('buildFinancialDashboard: warehouse not configured (UI skipped — trigger context)');
    }
    return;
  }

  const ss = SpreadsheetApp.openById(warehouseId);
  let sheet = ss.getSheetByName(ANALYTICS_CONFIG.dashboardSheet);

  if (!sheet) {
    sheet = ss.insertSheet(ANALYTICS_CONFIG.dashboardSheet);
  }

  sheet.getDataRange().clearContent();
  sheet.clearFormats();
  sheet.clearConditionalFormatRules();

  applyColumnWidths_(sheet);

  const src = ANALYTICS_CONFIG.sourceSheet;
  const tz = ANALYTICS_CONFIG.timezone;
  const now = Utilities.formatDate(new Date(), tz, 'd MMM yyyy h:mm a');

  // ─── SECTION 1: HEADER ─────────────────────────────────────────────
  let row = 1;
  sheet.getRange('A1').breakApart();
  sheet.getRange('A1')
       .setValue('SAKURA · ANALYTICS DASHBOARD')
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.metric)
       .setFontWeight('bold')
       .setFontColor(STYLE.colour.ink)
       .setHorizontalAlignment('left')
       .setVerticalAlignment('middle');
  sheet.getRange('I1')
       .setValue('Last updated: ' + now)
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.label)
       .setFontColor(STYLE.colour.inkMuted)
       .setHorizontalAlignment('right')
       .setVerticalAlignment('middle');
  applyRowHeight_(sheet, 1, 'section');

  row = 2;
  sheet.getRange('A2:I2').breakApart().clearContent();
  applyRowHeight_(sheet, 2, 'spacer');

  // ─── SECTION 2: THIS WEEK SNAPSHOT ──────────────────────────────────
  row = 4;
  applyHeroCard_(sheet, 'A4', null, null, 'A4:F9', 'THIS WEEK');
  sheet.getRange('A4:F4').merge();

  row = 5;
  // Find the most recent week-ending date
  sheet.getRange(row, 1).setValue("Week Ending");
  sheet.getRange(row, 2).setFormula(`=IFERROR(MAX(${src}!C:C),"")`);
  sheet.getRange(row, 2).setNumberFormat("dd/MM/yyyy");

  sheet.getRange(row, 4).setValue("Shifts Reported");
  sheet.getRange(row, 5).setFormula(`=IFERROR(COUNTIF(${src}!C:C,B5),0)`);

  row = 6;
  const weekRef = "B5"; // points to the current week-ending date
  sheet.getRange(row, 1).setValue("Total Revenue");
  sheet.getRange(row, 2).setFormula(`=IFERROR(SUMIFS(${src}!E:E,${src}!C:C,${weekRef}),0)`); // E=NetRevenue
  sheet.getRange(row, 2).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Avg Daily Revenue");
  sheet.getRange(row, 5).setFormula(`=IFERROR(AVERAGEIFS(${src}!E:E,${src}!C:C,${weekRef}),0)`); // E=NetRevenue
  sheet.getRange(row, 5).setNumberFormat("$#,##0");

  row = 7;
  sheet.getRange(row, 1).setValue("Total Tips");
  sheet.getRange(row, 2).setFormula(`=IFERROR(SUMIFS(${src}!H:H,${src}!C:C,${weekRef}),0)`); // H=TipsTotal
  sheet.getRange(row, 2).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Production Amount");
  sheet.getRange(row, 5).setFormula(`=IFERROR(SUMIFS(${src}!J:J,${src}!C:C,${weekRef}),0)`); // J=ProductionAmount
  sheet.getRange(row, 5).setNumberFormat("$#,##0");

  row = 8;
  sheet.getRange(row, 1).setValue("Total Discounts");
  sheet.getRange(row, 2).setFormula(`=IFERROR(SUMIFS(${src}!K:K,${src}!C:C,${weekRef}),0)`); // K=Discounts
  sheet.getRange(row, 2).setNumberFormat("$#,##0");

  row = 9;
  sheet.getRange(row, 1).setValue("Cash Takings");
  sheet.getRange(row, 2).setFormula(`=IFERROR(SUMIFS(${src}!F:F,${src}!C:C,${weekRef}),0)`); // F=CashTotal
  sheet.getRange(row, 2).setNumberFormat("$#,##0");

  // ─── SECTION 3: WEEK-OVER-WEEK COMPARISON ──────────────────────────
  row = 11;
  applyHairlineSection_(sheet, 'A11', 'WEEK-OVER-WEEK');
  applyRowHeight_(sheet, row, 'section');

  row = 12;
  sheet.getRange(row, 1).setValue("Previous Week Ending");
  // Second most recent week-ending date
  sheet.getRange(row, 2).setFormula(`=IFERROR(LARGE(UNIQUE(${src}!C2:C),2),"")`);
  sheet.getRange(row, 2).setNumberFormat("dd/MM/yyyy");

  const prevRef = "B12";

  row = 13;
  sheet.getRange(row, 1).setValue("");
  sheet.getRange(row, 2).setValue("This Week");
  sheet.getRange(row, 3).setValue("Last Week");
  sheet.getRange(row, 4).setValue("Change");
  sheet.getRange(row, 5).setValue("% Change");
  applyTableHeader_(sheet, 'A13:E13');

  const wowMetrics = [
    { label: "Revenue",    col: "E", fmt: "$#,##0" }, // E=NetRevenue
    { label: "Tips",       col: "H", fmt: "$#,##0" }, // H=TipsTotal
    { label: "Production", col: "J", fmt: "$#,##0" }, // J=ProductionAmount
    { label: "Discounts",  col: "K", fmt: "$#,##0" }, // K=Discounts
  ];

  wowMetrics.forEach((m, i) => {
    const r = 14 + i;
    sheet.getRange(r, 1).setValue(m.label);
    sheet.getRange(r, 2).setFormula(`=IFERROR(SUMIFS(${src}!${m.col}:${m.col},${src}!C:C,${weekRef}),0)`).setNumberFormat(m.fmt);
    sheet.getRange(r, 3).setFormula(`=IFERROR(SUMIFS(${src}!${m.col}:${m.col},${src}!C:C,${prevRef}),0)`).setNumberFormat(m.fmt);
    sheet.getRange(r, 4).setFormula(`=IFERROR(B${r}-C${r},0)`).setNumberFormat(m.fmt);
    sheet.getRange(r, 5).setFormula(`=IFERROR(D${r}/C${r},0)`).setNumberFormat("+0.0%;-0.0%");
  });
  applyTableBody_(sheet, 'A14:E17');

  // Force recalculation so getValue() returns current formula results, not stale values.
  SpreadsheetApp.flush();

  // Delta colours baked in at build time. D column = change $, E column = change %.
  // Conditional formatting on D14:D17 (from existing CF rules) handles red/green for $;
  // we apply applyDeltaCell_ to E14:E17 (% column) which has no CF rule.
  for (let i = 0; i < wowMetrics.length; i++) {
    const r = 14 + i;
    const pctVal = sheet.getRange(`E${r}`).getValue();
    applyDeltaCell_(sheet, `E${r}`, typeof pctVal === 'number' ? pctVal : null);
  }

  // ─── SECTION 4: DAY-OF-WEEK AVERAGES ───────────────────────────────
  row = 21;
  applyHairlineSection_(sheet, 'A21', 'DAY-OF-WEEK AVERAGES (ALL TIME)');
  applyRowHeight_(sheet, row, 'section');

  row = 22;
  const dowHeaders = ["Day", "Avg Revenue", "Avg Tips", "Avg Production", "Avg Discounts", "Count", "Std Dev", "13W Trend"];
  dowHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A22:H22');

  const sakuraDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  sakuraDays.forEach((day, i) => {
    const r = 23 + i;
    sheet.getRange(r, 1).setValue(day);
    sheet.getRange(r, 2).setFormula(`=IFERROR(AVERAGEIFS(${src}!E:E,${src}!B:B,"${day}"),0)`).setNumberFormat("$#,##0"); // E=NetRevenue
    sheet.getRange(r, 3).setFormula(`=IFERROR(AVERAGEIFS(${src}!H:H,${src}!B:B,"${day}"),0)`).setNumberFormat("$#,##0"); // H=TipsTotal
    sheet.getRange(r, 4).setFormula(`=IFERROR(AVERAGEIFS(${src}!J:J,${src}!B:B,"${day}"),0)`).setNumberFormat("$#,##0"); // J=ProductionAmount
    sheet.getRange(r, 5).setFormula(`=IFERROR(AVERAGEIFS(${src}!K:K,${src}!B:B,"${day}"),0)`).setNumberFormat("$#,##0"); // K=Discounts
    sheet.getRange(r, 6).setFormula(`=COUNTIF(${src}!B:B,"${day}")`).setNumberFormat("#,##0");
    // Std Dev (col G): population stddev of NetRevenue for this day
    sheet.getRange(r, 7).setFormula(
      `=IFERROR(STDEV(FILTER(${src}!E:E,${src}!B:B="${day}",${src}!E:E>0)),0)`
    ).setNumberFormat("$#,##0");
    // 13-week Sparkline (col H): trend of last 91 days for this day
    // Colour param replaced with STYLE.colour.good — only the colour changes, not chart type/linewidth/etc.
    sheet.getRange(r, 8).setFormula(
      `=IFERROR(SPARKLINE(FILTER(${src}!E:E,${src}!B:B="${day}",${src}!A:A>=TODAY()-91),{"charttype","line";"color","` + STYLE.colour.good + `";"linewidth",2}),"")`
    );
  });
  applyTableBody_(sheet, 'A23:H28');

  // ─── SECTION 5: AVERAGE WEEKLY (ALL WEEKS) ─────────────────────────
  // Average of per-week totals (not per-shift). Uses AVERAGE(QUERY(...GROUP BY C))
  // so each week contributes one value regardless of how many shifts it contains.
  row = 30;
  applyHairlineSection_(sheet, 'A30', 'AVERAGE WEEKLY (ALL WEEKS)');
  applyRowHeight_(sheet, row, 'section');

  row = 31;
  sheet.getRange(row, 1).setValue("Avg Weekly Net Revenue");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(AVERAGE(QUERY(${src}!A2:P,"SELECT SUM(E) WHERE C IS NOT NULL GROUP BY C LABEL SUM(E) ''")),0)`
  ).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Avg Weekly Production");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(AVERAGE(QUERY(${src}!A2:P,"SELECT SUM(J) WHERE C IS NOT NULL GROUP BY C LABEL SUM(J) ''")),0)`
  ).setNumberFormat("$#,##0");

  row = 32;
  sheet.getRange(row, 1).setValue("Avg Weekly Tips");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(AVERAGE(QUERY(${src}!A2:P,"SELECT SUM(H) WHERE C IS NOT NULL GROUP BY C LABEL SUM(H) ''")),0)`
  ).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Avg Weekly Discounts");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(AVERAGE(QUERY(${src}!A2:P,"SELECT SUM(K) WHERE C IS NOT NULL GROUP BY C LABEL SUM(K) ''")),0)`
  ).setNumberFormat("$#,##0");

  applyTableBody_(sheet, 'A31:E32');

  // ─── SECTION 6: WEEKLY TREND (right side) ──────────────────────────
  // Col I (was H) to make room for Sparkline column in DoW Averages.
  const trendCol = 9; // Column I

  row = 4;
  applyHeroCard_(sheet, 'I4', null, null, 'I4:N5', 'WEEKLY TREND');
  sheet.getRange(row, trendCol, 1, 6).merge();
  applyRowHeight_(sheet, row, 'section');

  row = 5;
  const trendHeaders = ["Week Ending", "Revenue", "Tips", "Production", "Shifts"];
  trendHeaders.forEach((h, i) => sheet.getRange(row, trendCol + i).setValue(h));
  applyTableHeader_(sheet, 'I5:N5');

  row = 6;
  sheet.getRange(row, trendCol).setFormula(
    `=IFERROR(QUERY(${src}!A2:P,` +
    `"SELECT C, SUM(E), SUM(H), SUM(J), COUNT(A) ` +
    `WHERE C IS NOT NULL ` +
    `GROUP BY C ` +
    `ORDER BY C DESC ` +
    `LABEL C 'Week Ending', SUM(E) 'Revenue', SUM(H) 'Tips', SUM(J) 'Production', COUNT(A) 'Shifts'"),"")`
  );
  applyTableBody_(sheet, 'I6:N56');
  // Format the Week Ending column as a date (QUERY returns serial numbers otherwise)
  sheet.getRange(7, trendCol, 50, 1).setNumberFormat("dd/MM/yyyy");

  // ─── FORMATTING ─────────────────────────────────────────────────────
  // Column widths applied via applyColumnWidths_() at top of function.

  // Bold labels in column A
  sheet.getRange("A5:A9").setFontWeight("bold");
  sheet.getRange("D5:D7").setFontWeight("bold");
  sheet.getRange("A31:A32").setFontWeight("bold");
  sheet.getRange("D31:D32").setFontWeight("bold");

  // Conditional formatting: negative WoW changes in red, positive in green
  const changeRange = sheet.getRange("D14:D17");
  sheet.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberLessThan(0)
      .setFontColor("#ea4335")
      .setRanges([changeRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThan(0)
      .setFontColor("#34a853")
      .setRanges([changeRange])
      .build()
  ]);

  // Freeze header
  sheet.setFrozenRows(2);

  // ─── M7: EXTENDED TRENDS ────────────────────────────────────────────
  buildExtendedTrends_Sakura(sheet, src);

  // ─── M8: ANALYTICS EXTENSIONS (4W MA, Consistency, Top/Bottom 5, Outliers, Recent DoW) ─
  buildAnalyticsExtensions_Sakura(sheet, src);

  Logger.log("Financial analytics dashboard built successfully.");
  try {
    SpreadsheetApp.getUi().alert("Financial Analytics dashboard has been built on the ANALYTICS tab.");
  } catch (e) {
    Logger.log('buildFinancialDashboard: complete (UI skipped — trigger context)');
  }
}


/**
 * Builds the Executive Dashboard on the EXECUTIVE_DASHBOARD tab.
 * Higher-level monthly/quarterly view for ownership review.
 * Safe to re-run — clears and rebuilds each time.
 *
 * Layout (compressed):
 *   Row 1:   Header
 *   Row 2:   Timestamp
 *   Row 3:   CURRENT MONTH header  |  REVENUE BY DAY header (col H)
 *   Row 4:   Month label/formula   |  DoW rank col headers (col H)
 *   Row 5:   Total Revenue + Shifts  |  DoW rank QUERY (col H)
 *   Row 6:   Avg Daily Revenue + Total Tips
 *   Row 7:   Total Production + Total Discounts
 *   Row 9:   MONTHLY TREND header
 *   Row 10:  Monthly trend column headers
 *   Row 11+: QUERY results (spills ~12 rows)
 *   Row 24:  ROLLING 4-WEEK header
 *   Row 25:  4-Week column headers
 *   Row 26:  Week Ending dates
 *   Rows 27-31: Revenue / Tips / Production / Discounts / Shifts
 *   Rows 32-33: WoW $ and % rows
 *
 * Sections:
 *   1. Header
 *   2. Current Month Snapshot (SUMPRODUCT with MONTH/YEAR)
 *   3. Monthly Trend (QUERY grouped by YEAR*100+MONTH)
 *   4. Rolling 4-Week Comparison (last 4 week-ending dates)
 *   5. Day-of-Week Revenue Ranking (right side, col H)
 */
function buildExecutiveDashboard() {
  const warehouseId = getDataWarehouseId_();

  if (!warehouseId) {
    try {
      SpreadsheetApp.getUi().alert(
        "Data Warehouse Not Configured",
        "Set SAKURA_DATA_WAREHOUSE_ID in Script Properties before building the dashboard.",
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } catch (e) {
      Logger.log('buildExecutiveDashboard: warehouse not configured (UI skipped — trigger context)');
    }
    return;
  }

  const ss = SpreadsheetApp.openById(warehouseId);
  let sheet = ss.getSheetByName(ANALYTICS_CONFIG.executiveSheet);

  if (!sheet) {
    sheet = ss.insertSheet(ANALYTICS_CONFIG.executiveSheet);
  }

  sheet.getDataRange().clearContent();
  sheet.clearFormats();
  sheet.clearConditionalFormatRules();

  applyColumnWidths_(sheet);

  const src = ANALYTICS_CONFIG.sourceSheet;
  const tz = ANALYTICS_CONFIG.timezone;

  // ─── SECTION 1: HEADER ─────────────────────────────────────────────
  let row = 1;
  sheet.getRange('A1').breakApart();
  sheet.getRange('A1')
       .setValue('SAKURA · EXECUTIVE DASHBOARD')
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.metric)
       .setFontWeight('bold')
       .setFontColor(STYLE.colour.ink)
       .setHorizontalAlignment('left')
       .setVerticalAlignment('middle');
  sheet.getRange('I1')
       .setValue('Last updated: ' + Utilities.formatDate(new Date(), tz, 'd MMM yyyy h:mm a'))
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.label)
       .setFontColor(STYLE.colour.inkMuted)
       .setHorizontalAlignment('right')
       .setVerticalAlignment('middle');
  applyRowHeight_(sheet, 1, 'section');
  sheet.getRange('A2:I2').breakApart().clearContent();
  applyRowHeight_(sheet, 2, 'spacer');

  // ─── SECTION 2: CURRENT MONTH SNAPSHOT ──────────────────────────────
  row = 4;
  applyHeroCard_(sheet, 'A4', null, null, 'A4:E8', 'CURRENT MONTH');
  sheet.getRange('A4:E4').merge();
  applyRowHeight_(sheet, row, 'section');

  row = 5;
  sheet.getRange(row, 1).setValue("Month");
  sheet.getRange(row, 1).setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.body)
       .setFontColor(STYLE.colour.inkMuted)
       .setFontWeight('normal');
  sheet.getRange(row, 2).setFormula('=TEXT(TODAY(),"MMMM YYYY")');
  sheet.getRange(row, 2).setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.body)
       .setFontColor(STYLE.colour.ink);

  row = 6;
  sheet.getRange(row, 1).setValue("Total Revenue");
  sheet.getRange(row, 1).setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.body)
       .setFontColor(STYLE.colour.inkMuted)
       .setFontWeight('normal');
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(SUMPRODUCT((MONTH(${src}!A2:A)=MONTH(TODAY()))*(YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!E2:E),0)` // E=NetRevenue
  );
  sheet.getRange(row, 2).setNumberFormat("$#,##0")
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.hero)
       .setFontWeight('bold')
       .setFontColor(STYLE.colour.ink);
  applyRowHeight_(sheet, row, 'hero');

  sheet.getRange(row, 4).setValue("Shifts");
  sheet.getRange(row, 4).setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.body)
       .setFontColor(STYLE.colour.inkMuted)
       .setFontWeight('normal');
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(SUMPRODUCT((MONTH(${src}!A2:A)=MONTH(TODAY()))*(YEAR(${src}!A2:A)=YEAR(TODAY()))*(${src}!A2:A<>"")*1),0)`
  );
  sheet.getRange(row, 5).setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.metric)
       .setFontWeight('bold')
       .setFontColor(STYLE.colour.ink);

  row = 7;
  sheet.getRange(row, 1).setValue("Avg Daily Revenue");
  sheet.getRange(row, 1).setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.body)
       .setFontColor(STYLE.colour.inkMuted)
       .setFontWeight('normal');
  sheet.getRange(row, 2).setFormula("=IFERROR(B6/E6,0)");
  sheet.getRange(row, 2).setNumberFormat("$#,##0")
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.metric)
       .setFontWeight('bold')
       .setFontColor(STYLE.colour.ink);

  sheet.getRange(row, 4).setValue("Total Tips");
  sheet.getRange(row, 4).setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.body)
       .setFontColor(STYLE.colour.inkMuted)
       .setFontWeight('normal');
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(SUMPRODUCT((MONTH(${src}!A2:A)=MONTH(TODAY()))*(YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!H2:H),0)` // H=TipsTotal
  );
  sheet.getRange(row, 5).setNumberFormat("$#,##0")
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.metric)
       .setFontWeight('bold')
       .setFontColor(STYLE.colour.ink);

  row = 8;
  sheet.getRange(row, 1).setValue("Total Discounts");
  sheet.getRange(row, 1).setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.body)
       .setFontColor(STYLE.colour.inkMuted)
       .setFontWeight('normal');
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(SUMPRODUCT((MONTH(${src}!A2:A)=MONTH(TODAY()))*(YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!K2:K),0)` // K=Discounts
  );
  sheet.getRange(row, 2).setNumberFormat("$#,##0")
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.metric)
       .setFontWeight('bold')
       .setFontColor(STYLE.colour.ink);

  sheet.getRange(row, 4).setValue("Total Production");
  sheet.getRange(row, 4).setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.body)
       .setFontColor(STYLE.colour.inkMuted)
       .setFontWeight('normal');
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(SUMPRODUCT((MONTH(${src}!A2:A)=MONTH(TODAY()))*(YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!J2:J),0)` // J=ProductionAmount
  );
  sheet.getRange(row, 5).setNumberFormat("$#,##0")
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.metric)
       .setFontWeight('bold')
       .setFontColor(STYLE.colour.ink);

  // ─── SECTION 3: MONTHLY TREND ──────────────────────────────────────
  row = 10;
  applyHairlineSection_(sheet, 'A10', 'MONTHLY TREND');
  applyRowHeight_(sheet, row, 'section');

  row = 11;
  const monthHeaders = ["Month", "Revenue", "Tips", "Production", "Discounts", "Cash Takings", "Shifts"];
  monthHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A11:G11');

  row = 12;
  // Monthly Trend QUERY: group by YEAR/MONTH using YEAR(A)*100+(MONTH(A)+1).
  // QUERY MONTH() is 0-indexed (Jan=0), so +1 corrects to human months.
  // SELECT must use the same expression as GROUP BY for reliable results.
  // YEAR(A) > 2020 guards against text/invalid dates. headers=0 since range starts at row 2.
  sheet.getRange(row, 1).setFormula(
    `=IFERROR(QUERY(${src}!A2:P, ` +
    `"SELECT YEAR(A)*100+(MONTH(A)+1), SUM(E), SUM(H), SUM(J), SUM(K), SUM(F), COUNT(A) ` +
    `WHERE A IS NOT NULL AND YEAR(A) > 2020 ` +
    `GROUP BY YEAR(A)*100+(MONTH(A)+1) ` +
    `ORDER BY YEAR(A)*100+(MONTH(A)+1) DESC ` +
    `LABEL YEAR(A)*100+(MONTH(A)+1) 'Month', SUM(E) 'Revenue', SUM(H) 'Tips', ` +
    `SUM(J) 'Production', SUM(K) 'Discounts', SUM(F) 'Cash Takings', COUNT(A) 'Shifts'", 0),"")`
  );
  applyTableBody_(sheet, 'A12:G24');
  // Format Month column as "0000/00" so 202604 renders as "2026/04"
  sheet.getRange('A12:A24').setNumberFormat('0000"/"00');

  // ─── SECTION 4: ROLLING 4-WEEK COMPARISON ──────────────────────────
  // MONTHLY TREND QUERY starts at row 12 and can spill up to ~12 rows (rows 12-23).
  // Row 26 gives a 1-row gap after the longest expected spill.
  row = 26;
  applyHairlineSection_(sheet, 'A26', 'ROLLING 4-WEEK COMPARISON');
  applyRowHeight_(sheet, row, 'section');

  row = 27;
  const weekCompHeaders = ["", "Week 1 (Latest)", "Week 2", "Week 3", "Week 4"];
  weekCompHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A27:E27');

  const weekEndingRow = 28;
  row = weekEndingRow;
  sheet.getRange(row, 1).setValue("Week Ending");
  for (let w = 1; w <= 4; w++) {
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(LARGE(UNIQUE(${src}!C2:C),${w}),"")`);
    sheet.getRange(row, w + 1).setNumberFormat("dd/MM/yyyy");
  }

  row = 29;
  sheet.getRange(row, 1).setValue("Revenue");
  for (let w = 1; w <= 4; w++) {
    const weekCell = String.fromCharCode(65 + w) + weekEndingRow;
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(SUMIFS(${src}!E:E,${src}!C:C,${weekCell}),0)`); // E=NetRevenue
    sheet.getRange(row, w + 1).setNumberFormat("$#,##0");
  }

  row = 30;
  sheet.getRange(row, 1).setValue("Tips");
  for (let w = 1; w <= 4; w++) {
    const weekCell = String.fromCharCode(65 + w) + weekEndingRow;
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(SUMIFS(${src}!H:H,${src}!C:C,${weekCell}),0)`); // H=TipsTotal
    sheet.getRange(row, w + 1).setNumberFormat("$#,##0");
  }

  row = 31;
  sheet.getRange(row, 1).setValue("Production");
  for (let w = 1; w <= 4; w++) {
    const weekCell = String.fromCharCode(65 + w) + weekEndingRow;
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(SUMIFS(${src}!J:J,${src}!C:C,${weekCell}),0)`); // J=ProductionAmount
    sheet.getRange(row, w + 1).setNumberFormat("$#,##0");
  }

  row = 32;
  sheet.getRange(row, 1).setValue("Discounts");
  for (let w = 1; w <= 4; w++) {
    const weekCell = String.fromCharCode(65 + w) + weekEndingRow;
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(SUMIFS(${src}!K:K,${src}!C:C,${weekCell}),0)`); // K=Discounts
    sheet.getRange(row, w + 1).setNumberFormat("$#,##0");
  }

  row = 33;
  sheet.getRange(row, 1).setValue("Shifts");
  for (let w = 1; w <= 4; w++) {
    const weekCell = String.fromCharCode(65 + w) + weekEndingRow;
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(COUNTIF(${src}!C:C,${weekCell}),0)`);
  }

  // WoW change rows — reference Revenue row (29) dynamically
  const revenueRow = 29;
  row = 34;
  sheet.getRange(row, 1).setValue("Revenue WoW $");
  sheet.getRange(row, 2).setFormula(`=IFERROR(B${revenueRow}-C${revenueRow},0)`).setNumberFormat("$#,##0");
  sheet.getRange(row, 3).setFormula(`=IFERROR(C${revenueRow}-D${revenueRow},0)`).setNumberFormat("$#,##0");
  sheet.getRange(row, 4).setFormula(`=IFERROR(D${revenueRow}-E${revenueRow},0)`).setNumberFormat("$#,##0");
  sheet.getRange(row, 5).setValue("—");

  row = 35;
  sheet.getRange(row, 1).setValue("Revenue WoW %");
  sheet.getRange(row, 2).setFormula(`=IFERROR((B${revenueRow}-C${revenueRow})/C${revenueRow},0)`).setNumberFormat("+0.0%;-0.0%");
  sheet.getRange(row, 3).setFormula(`=IFERROR((C${revenueRow}-D${revenueRow})/D${revenueRow},0)`).setNumberFormat("+0.0%;-0.0%");
  sheet.getRange(row, 4).setFormula(`=IFERROR((D${revenueRow}-E${revenueRow})/E${revenueRow},0)`).setNumberFormat("+0.0%;-0.0%");
  sheet.getRange(row, 5).setValue("—");

  applyTableBody_(sheet, 'A28:E35');

  // ─── SECTION 4b: THIS WEEK vs 13W BASELINE ─────────────────────────
  // Flags shifts performing above/below their day-of-week 13-week average.
  // Uses MAX(C:C) as "current week" and AVERAGEIFS with TODAY()-91 window.
  row = 37;
  applyHairlineSection_(sheet, 'A37', 'THIS WEEK vs 13W BASELINE');
  applyRowHeight_(sheet, row, 'section');

  row = 38;
  const baseHeaders = ["Day", "This Week", "13W DoW Avg", "Diff $", "Diff %"];
  baseHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A38:E38');

  const baselineDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  baselineDays.forEach((day, i) => {
    const r = 39 + i;
    sheet.getRange(r, 1).setValue(day);
    // This Week: SUMIFS where Day=this day AND WeekEnding=latest week
    sheet.getRange(r, 2).setFormula(
      `=IFERROR(SUMIFS(${src}!E:E,${src}!B:B,"${day}",${src}!C:C,MAX(${src}!C:C)),0)` // E=NetRevenue
    ).setNumberFormat("$#,##0");
    // 13W DoW Avg: AVERAGEIFS with 91-day window
    sheet.getRange(r, 3).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!E:E,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-91),0)` // E=NetRevenue
    ).setNumberFormat("$#,##0");
    // Delta $ and % — number formats without [red] prefix; delta colour applied below via applyDeltaCell_
    sheet.getRange(r, 4).setFormula(`=IFERROR(B${r}-C${r},0)`).setNumberFormat("$#,##0;-$#,##0");
    sheet.getRange(r, 5).setFormula(`=IFERROR(D${r}/C${r},0)`).setNumberFormat("+0.0%;-0.0%");
  });
  applyTableBody_(sheet, 'A39:E44');

  // Force formula recalculation before reading values for delta colouring.
  // Without flush(), getValue() after setFormula() in the same execution can
  // return stale (pre-formula) results, leading to incorrect neutral colour.
  SpreadsheetApp.flush();

  // Delta colours baked in at build time — reflect data at the moment of rebuild.
  baselineDays.forEach((day, i) => {
    const r = 39 + i;
    const diffDollar = sheet.getRange(r, 4).getValue();
    const diffPct    = sheet.getRange(r, 5).getValue();
    applyDeltaCell_(sheet, `D${r}`, typeof diffDollar === 'number' ? diffDollar : null);
    applyDeltaCell_(sheet, `E${r}`, typeof diffPct    === 'number' ? diffPct    : null);
  });

  // ─── SECTION 5: INSIGHTS (right side) ──────────────────────────────
  // Three sub-sections: TRAJECTORY, EXCEPTIONS, REPORTS
  const rightCol = 8; // Column H

  applyHairlineSection_(sheet, 'H4', 'INSIGHTS');
  sheet.getRange('H4:K4').merge();
  applyRowHeight_(sheet, 4, 'section');

  // Trajectory subheader
  sheet.getRange(5, rightCol).setValue("TRAJECTORY");
  sheet.getRange(5, rightCol)
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.label)
       .setFontWeight('bold')
       .setFontStyle('normal')
       .setFontColor(STYLE.colour.inkMuted);
  sheet.getRange(5, rightCol, 1, 4).merge();

  // 4-Week Trend: SLOPE of Sakura ROLLING 4-WEEK Revenue row (B29:E29, B=latest)
  sheet.getRange(6, rightCol).setValue("4-Week Trend");
  sheet.getRange(6, rightCol + 1).setFormula(
    `=IFERROR(TEXT(SLOPE(B29:E29,{4,3,2,1}),"$#,##0;-$#,##0")&" /wk","-")`
  );

  // Forecast Next Month: AVERAGE of last 3 months from MONTHLY TREND.
  // QUERY at row 12 outputs labels at row 12, data starts at row 12 (headers=0).
  sheet.getRange(7, rightCol).setValue("Forecast Next Month");
  sheet.getRange(7, rightCol + 1).setFormula(
    `=IFERROR(AVERAGE(B12:B14),0)`
  ).setNumberFormat("$#,##0");

  // Last 4 Weeks direction: count up-weeks among 3 transitions in B29:E29
  sheet.getRange(8, rightCol).setValue("Last 4 Weeks");
  sheet.getRange(8, rightCol + 1).setFormula(
    `="Up "&(IF(B29>C29,1,0)+IF(C29>D29,1,0)+IF(D29>E29,1,0))&" of 3"`
  );
  applyTableBody_(sheet, 'H6:K8');

  // Exceptions subheader
  sheet.getRange(9, rightCol).setValue("EXCEPTIONS");
  sheet.getRange(9, rightCol)
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.label)
       .setFontWeight('bold')
       .setFontStyle('normal')
       .setFontColor(STYLE.colour.inkMuted);
  sheet.getRange(9, rightCol, 1, 4).merge();

  const monthStart = `EOMONTH(TODAY(),-1)+1`;
  const monthEnd = `EOMONTH(TODAY(),0)`;

  // Best Shift This Month (Sakura: E=NetRevenue)
  sheet.getRange(10, rightCol).setValue("Best Shift");
  sheet.getRange(10, rightCol + 1).setFormula(
    `=IFERROR(MAXIFS(${src}!E:E,${src}!A:A,">="&${monthStart},${src}!A:A,"<="&${monthEnd}),0)`
  ).setNumberFormat("$#,##0");
  sheet.getRange(10, rightCol + 2).setFormula(
    `=IFERROR(TEXT(INDEX(${src}!A:A,MATCH(I10,${src}!E:E,0)),"ddd d MMM"),"-")`
  );

  // Worst Shift This Month
  sheet.getRange(11, rightCol).setValue("Worst Shift");
  sheet.getRange(11, rightCol + 1).setFormula(
    `=IFERROR(MINIFS(${src}!E:E,${src}!A:A,">="&${monthStart},${src}!A:A,"<="&${monthEnd},${src}!E:E,">0"),0)`
  ).setNumberFormat("$#,##0");
  sheet.getRange(11, rightCol + 2).setFormula(
    `=IFERROR(TEXT(INDEX(${src}!A:A,MATCH(I11,${src}!E:E,0)),"ddd d MMM"),"-")`
  );

  // Reports Filed: references E6 (Shifts) from CURRENT MONTH section
  sheet.getRange(12, rightCol).setValue("Reports Filed");
  sheet.getRange(12, rightCol + 1).setFormula(`=E6&" shifts logged"`);
  applyTableBody_(sheet, 'H10:K12');

  // ─── SECTION 6: REVENUE BY DAY (right side) ────────────────────────
  // Sakura: 6 days (Mon-Sat), data rows 19-24 from QUERY spill at row 18.
  let dowRow = 16;
  applyHeroCard_(sheet, 'H16', null, null, 'H16:L22', 'REVENUE BY DAY');
  sheet.getRange('H16:L16').merge();
  applyRowHeight_(sheet, dowRow, 'section');

  dowRow = 17;
  const dowRankHeaders = ["Day", "Avg Revenue", "Total Revenue", "Shifts", "Share"];
  dowRankHeaders.forEach((h, i) => sheet.getRange(dowRow, rightCol + i).setValue(h));
  applyTableHeader_(sheet, 'H17:L17');

  dowRow = 18;
  sheet.getRange(dowRow, rightCol).setFormula(
    `=IFERROR(QUERY(${src}!A2:P,` +
    `"SELECT B, AVG(E), SUM(E), COUNT(A) ` +
    `WHERE B IS NOT NULL ` +
    `GROUP BY B ` +
    `ORDER BY AVG(E) DESC ` +
    `LABEL B 'Day', AVG(E) 'Avg Revenue', SUM(E) 'Total Revenue', COUNT(A) 'Shifts'"),"")`
  );
  applyTableBody_(sheet, 'H18:L24');

  // Share % column (col L, rows 19-24 = Sakura's 6 operating days Mon-Sat).
  // J19:J24 holds Total Revenue per day from QUERY above. Bar uses REPT for visual.
  for (let r = 19; r <= 24; r++) {
    sheet.getRange(r, rightCol + 4).setFormula(
      `=IFERROR(IF(J${r}>0,REPT("▓",ROUND(J${r}/SUM($J$19:$J$24)*12,0))&" "&TEXT(J${r}/SUM($J$19:$J$24),"0%"),""),"")`
    );
  }

  // ─── FORMATTING ─────────────────────────────────────────────────────
  // Column widths applied via applyColumnWidths_() at top of function.

  // Bold labels
  sheet.getRange("A5:A8").setFontWeight("bold");
  sheet.getRange("D6:D8").setFontWeight("bold");
  sheet.getRange("A28:A35").setFontWeight("bold");
  sheet.getRange("A39:A44").setFontWeight("bold");
  sheet.getRange("H6:H8").setFontWeight("bold");
  sheet.getRange("H10:H12").setFontWeight("bold");

  // Conditional formatting: WoW changes red/green
  const wowChangeRange = sheet.getRange("B34:D35");
  sheet.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberLessThan(0)
      .setFontColor("#ea4335")
      .setRanges([wowChangeRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThan(0)
      .setFontColor("#34a853")
      .setRanges([wowChangeRange])
      .build()
  ]);

  sheet.setFrozenRows(2);

  Logger.log("Executive dashboard built successfully.");
  try {
    SpreadsheetApp.getUi().alert("Executive Dashboard has been built on the EXECUTIVE_DASHBOARD tab.");
  } catch (e) {
    Logger.log('buildExecutiveDashboard: complete (UI skipped — trigger context)');
  }
}


/**
 * Rebuilds BOTH the ANALYTICS and EXECUTIVE_DASHBOARD tabs.
 * Use for first-time setup, schema changes, or corruption recovery.
 * Not needed for daily data refresh — live formulas handle that.
 */
function rebuildAllDashboards() {
  buildFinancialDashboard();
  buildExecutiveDashboard();
  Logger.log('rebuildAllDashboards: both dashboards rebuilt successfully');
}


// ============================================================================
// M7 — EXTENDED TREND WINDOWS (Sakura)
// ============================================================================

/**
 * Appends the "Extended Trends" section to the ANALYTICS sheet.
 * Uses AVERAGEIFS/SUMIFS formulas so the section auto-updates.
 *
 * Layout (after AVERAGE WEEKLY ends at row 32):
 *   Row 34:    EXTENDED TRENDS hairline section header
 *   Row 35:    Column headers
 *   Rows 36-41: 6-day data (Mon-Sat)
 *   Row 43:    YEAR TO DATE hairline section header
 *   Rows 44-45: YTD data
 *
 * Sakura NIGHTLY_FINANCIAL columns:
 *   A=Date, B=Day, C=WeekEnding, D=MOD, E=NetRevenue, H=TotalTips
 *
 * @param {Sheet} sheet  - The ANALYTICS sheet object.
 * @param {string} src   - Source sheet name ("NIGHTLY_FINANCIAL").
 */
function buildExtendedTrends_Sakura(sheet, src) {
  // AVERAGE WEEKLY occupies rows 30-32; row 33 is implicit gap; section starts row 34.
  let row = 34;

  // ── Section header ───────────────────────────────────────────────────
  applyHairlineSection_(sheet, 'A34', 'EXTENDED TRENDS — DAY-OF-WEEK (13W / 26W)');
  applyRowHeight_(sheet, row, 'section');

  // ── Column headers ───────────────────────────────────────────────────
  row = 35;
  const etHeaders = ["Day", "13-Week Avg Rev", "26-Week Avg Rev", "13-Week Avg Tips", "26-Week Avg Tips", "Heatmap Rank"];
  etHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A35:F35');

  // ── Per-day rows (Mon-Sat = 6 days) ─────────────────────────────────
  const sakuraDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const etDataStartRow = 36;

  sakuraDays.forEach((day, i) => {
    const r = etDataStartRow + i;
    sheet.getRange(r, 1).setValue(day);

    // 13-week avg revenue (91 days) — E=NetRevenue
    sheet.getRange(r, 2).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!E:E,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-91),0)`
    ).setNumberFormat("$#,##0");

    // 26-week avg revenue (182 days)
    sheet.getRange(r, 3).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!E:E,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-182),0)`
    ).setNumberFormat("$#,##0");

    // 13-week avg tips — H=TipsTotal
    sheet.getRange(r, 4).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!H:H,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-91),0)`
    ).setNumberFormat("$#,##0");

    // 26-week avg tips
    sheet.getRange(r, 5).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!H:H,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-182),0)`
    ).setNumberFormat("$#,##0");

    // Rank by 13-week avg revenue (RANK: 1=highest)
    sheet.getRange(r, 6).setFormula(`=IFERROR(RANK(B${r},B${etDataStartRow}:B${etDataStartRow + 5},0),"")`);
  });

  applyTableBody_(sheet, 'A36:F41');

  // ── Day-of-week heatmap: colour B36:B41 best→worst using STYLE palette ──
  // Sakura has 6 days (Mon-Sat) vs Waratah's 5; a 6-step palette is defined here.
  // Rank 1 (best)  → STYLE.colour.good        (#2f5d3a)
  // Rank 2         → '#5a8c66'                 (mid-green, between good and cardFill)
  // Rank 3         → STYLE.colour.cardFill     (#f5f5f2)  — light neutral
  // Rank 4         → '#c8d4c8'                 (neutral green-grey, derived from palette)
  // Rank 5         → STYLE.colour.sand         (#d6cfa8)  — warm low
  // Rank 6 (worst) → STYLE.colour.bad          (#b5533c)
  const heatmapColors = [
    STYLE.colour.good,      // rank 1 — best
    '#5a8c66',              // rank 2
    STYLE.colour.cardFill,  // rank 3
    '#c8d4c8',              // rank 4
    STYLE.colour.sand,      // rank 5
    STYLE.colour.bad        // rank 6 — worst
  ];

  try {
    const revenueVals = sheet.getRange(etDataStartRow, 2, 6, 1).getValues().map(r => r[0]);
    if (revenueVals.some(v => v > 0)) {
      const sorted = revenueVals
        .map((v, i) => ({ v, i }))
        .sort((a, b) => b.v - a.v);
      sorted.forEach(({ i }, rank) => {
        sheet.getRange(etDataStartRow + i, 2).setBackground(heatmapColors[rank] || STYLE.colour.cardFill);
      });
    }
  } catch (e) {
    Logger.log(`Extended Trends heatmap skipped: ${e.message}`);
  }

  // ── Year to Date ─────────────────────────────────────────────────────
  row = 43;
  applyHairlineSection_(sheet, 'A43', 'YEAR TO DATE');
  applyRowHeight_(sheet, row, 'section');

  row = 44;
  sheet.getRange(row, 1).setValue("YTD Total Revenue");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(SUMPRODUCT((YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!E2:E),0)` // E=NetRevenue
  ).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("YTD Shifts");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(SUMPRODUCT((YEAR(${src}!A2:A)=YEAR(TODAY()))*(${src}!A2:A<>"")*1),0)`
  ).setNumberFormat("#,##0");

  row = 45;
  sheet.getRange(row, 1).setValue("YTD Avg Revenue / Shift");
  sheet.getRange(row, 2).setFormula(`=IFERROR(B44/E44,0)`).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("YTD Total Tips");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(SUMPRODUCT((YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!H2:H),0)` // H=TipsTotal
  ).setNumberFormat("$#,##0");

  applyTableBody_(sheet, 'A44:E45');
  // Sand accent on YTD label cells — reserved accent for benchmark/YTD context
  sheet.getRange("A44:A45").setBackground(STYLE.colour.sand).setFontWeight("bold");
  sheet.getRange("D44:D45").setFontWeight("bold");

  Logger.log("M7 Extended Trends section built for Sakura.");
}


// ============================================================================
// M8 — ANALYTICS EXTENSIONS (Sakura)
// ============================================================================

/**
 * Builds the lower-half analytics sections on the ANALYTICS sheet.
 * Adds: 4-Week Moving Average, Consistency, Top/Bottom 5 Shifts,
 *       Outliers vs DoW Baseline, Recent DoW Pattern.
 *
 * Layout (YTD ends at row 45):
 *   Row 47:    4-WEEK MOVING AVERAGE header
 *   Row 48:    Current 4W MA + Prior 4W MA + Change %
 *   Row 50:    CONSISTENCY header
 *   Rows 51-52: Most Consistent / Most Volatile day
 *   Row 54:    TOP 5 SHIFTS THIS MONTH header
 *   Rows 55-60: Header + 5 SORTN rows
 *   Row 62:    BOTTOM 5 SHIFTS THIS MONTH header
 *   Rows 63-68: Header + 5 SORTN rows
 *   Row 70:    OUTLIERS THIS MONTH header
 *   Rows 71-76: Header + 5 outlier rows
 *   Row 78:    RECENT DOW PATTERN header
 *   Rows 79-85: Header + 6 day rows (build-time arrows)
 *
 * Sakura NIGHTLY_FINANCIAL columns:
 *   A=Date, B=Day, C=WeekEnding, D=MOD, E=NetRevenue, H=TipsTotal
 *
 * CONSISTENCY formulas reference DoW Averages table at rows 23-28 (A23:A28,
 * B23:B28, G23:G28) — Mon-Sat data written by buildFinancialDashboard.
 * OUTLIERS VLOOKUP source is $A$23:$B$28 for the same reason.
 */
function buildAnalyticsExtensions_Sakura(sheet, src) {
  // ── 4-WEEK MOVING AVERAGE ─────────────────────────────────────────────
  let row = 47;
  applyHairlineSection_(sheet, 'A47', '4-WEEK MOVING AVERAGE');
  applyRowHeight_(sheet, row, 'section');

  row = 48;
  sheet.getRange(row, 1).setValue("Current 4W MA");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(AVERAGE(ARRAYFORMULA(SUMIF(${src}!C:C,QUERY(UNIQUE(${src}!C2:C),"SELECT Col1 WHERE Col1 IS NOT NULL ORDER BY Col1 DESC LIMIT 4",0),${src}!E:E))),0)`
  ).setNumberFormat("$#,##0");

  sheet.getRange(row, 3).setValue("Prior 4W MA");
  sheet.getRange(row, 4).setFormula(
    `=IFERROR(AVERAGE(ARRAYFORMULA(SUMIF(${src}!C:C,QUERY(UNIQUE(${src}!C2:C),"SELECT Col1 WHERE Col1 IS NOT NULL ORDER BY Col1 DESC LIMIT 4 OFFSET 4",0),${src}!E:E))),0)`
  ).setNumberFormat("$#,##0");

  sheet.getRange(row, 5).setValue("Change");
  sheet.getRange(row, 6).setFormula(`=IFERROR((B${row}-D${row})/D${row},0)`).setNumberFormat("+0.0%;[red]-0.0%");

  applyTableBody_(sheet, 'A48:F48');

  // ── CONSISTENCY ────────────────────────────────────────────────────────
  // Coefficient of Variation (CV) = StdDev / Mean; lower = more consistent.
  // DoW Avg in B23:B28, StdDev in G23:G28 (Phase 3 layout: Mon-Sat rows 23-28).
  row = 50;
  applyHairlineSection_(sheet, 'A50', 'CONSISTENCY');
  applyRowHeight_(sheet, row, 'section');

  row = 51;
  sheet.getRange(row, 1).setValue("Most Consistent Day");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(INDEX(A23:A28,MATCH(MIN(ARRAYFORMULA(IF(B23:B28>0,G23:G28/B23:B28,9))),ARRAYFORMULA(IF(B23:B28>0,G23:G28/B23:B28,9)),0))&" (±"&TEXT(MIN(ARRAYFORMULA(IF(B23:B28>0,G23:G28/B23:B28,9))),"0%")&")","-")`
  );

  row = 52;
  sheet.getRange(row, 1).setValue("Most Volatile Day");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(INDEX(A23:A28,MATCH(MAX(ARRAYFORMULA(IF(B23:B28>0,G23:G28/B23:B28,0))),ARRAYFORMULA(IF(B23:B28>0,G23:G28/B23:B28,0)),0))&" (±"&TEXT(MAX(ARRAYFORMULA(IF(B23:B28>0,G23:G28/B23:B28,0))),"0%")&")","-")`
  );
  applyTableBody_(sheet, 'A51:B52');

  // ── TOP 5 SHIFTS THIS MONTH ────────────────────────────────────────────
  row = 54;
  applyHairlineSection_(sheet, 'A54', 'TOP 5 SHIFTS THIS MONTH');
  applyRowHeight_(sheet, row, 'section');

  row = 55;
  const shiftHeaders = ["Date", "Day", "MOD", "Revenue"];
  shiftHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A55:D55');

  row = 56;
  sheet.getRange(row, 1).setFormula(
    `=IFERROR(SORTN(FILTER({${src}!A2:A,${src}!B2:B,${src}!D2:D,${src}!E2:E},MONTH(${src}!A2:A)=MONTH(TODAY()),YEAR(${src}!A2:A)=YEAR(TODAY()),${src}!E2:E>0),5,0,4,FALSE),"No shifts logged this month")`
  );
  sheet.getRange(row, 1, 5, 1).setNumberFormat("dd/MM/yyyy");
  sheet.getRange(row, 4, 5, 1).setNumberFormat("$#,##0");
  applyTableBody_(sheet, 'A56:D60');
  // Rank accent: date column gets good (green) colour to flag top shifts
  sheet.getRange('A56:A60').setFontWeight('bold').setFontColor(STYLE.colour.good);

  // ── BOTTOM 5 SHIFTS THIS MONTH ─────────────────────────────────────────
  row = 62;
  applyHairlineSection_(sheet, 'A62', 'BOTTOM 5 SHIFTS THIS MONTH');
  applyRowHeight_(sheet, row, 'section');

  row = 63;
  shiftHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A63:D63');

  row = 64;
  sheet.getRange(row, 1).setFormula(
    `=IFERROR(SORTN(FILTER({${src}!A2:A,${src}!B2:B,${src}!D2:D,${src}!E2:E},MONTH(${src}!A2:A)=MONTH(TODAY()),YEAR(${src}!A2:A)=YEAR(TODAY()),${src}!E2:E>0),5,0,4,TRUE),"No shifts logged this month")`
  );
  sheet.getRange(row, 1, 5, 1).setNumberFormat("dd/MM/yyyy");
  sheet.getRange(row, 4, 5, 1).setNumberFormat("$#,##0");
  applyTableBody_(sheet, 'A64:D68');
  // Rank accent: date column gets bad (terracotta) colour to flag bottom shifts
  sheet.getRange('A64:A68').setFontWeight('bold').setFontColor(STYLE.colour.bad);

  // ── OUTLIERS THIS MONTH (vs DoW 13W Baseline) ──────────────────────────
  // Lists top 5 shifts by absolute % variance from DoW average (A23:B28).
  row = 70;
  applyHairlineSection_(sheet, 'A70', 'OUTLIERS THIS MONTH (vs DoW Baseline)');
  applyRowHeight_(sheet, row, 'section');

  row = 71;
  const outlierHeaders = ["Date", "Day", "Revenue", "Variance %"];
  outlierHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A71:D71');

  row = 72;
  // Variance: (Revenue - DoW_Avg) / DoW_Avg. VLOOKUP source $A$23:$B$28 = Phase 3 DoW rows.
  // 5th column carries |variance| for sort key; hidden by white text on white background.
  const variance = `IFERROR((${src}!E2:E-VLOOKUP(${src}!B2:B,$A$23:$B$28,2,FALSE))/VLOOKUP(${src}!B2:B,$A$23:$B$28,2,FALSE),0)`;
  sheet.getRange(row, 1).setFormula(
    `=IFERROR(SORTN(FILTER({${src}!A2:A,${src}!B2:B,${src}!E2:E,${variance},ABS(${variance})},MONTH(${src}!A2:A)=MONTH(TODAY()),YEAR(${src}!A2:A)=YEAR(TODAY()),${src}!E2:E>0,ABS(${variance})>0.2),5,0,5,FALSE),"No outliers detected this month (>20% variance)")`
  );
  sheet.getRange(row, 1, 5, 1).setNumberFormat("dd/MM/yyyy");
  sheet.getRange(row, 3, 5, 1).setNumberFormat("$#,##0");
  sheet.getRange(row, 4, 5, 1).setNumberFormat("+0.0%;[red]-0.0%");
  // Hide the 5th column (|variance| sort key) — white text on white background
  sheet.getRange(row, 5, 5, 1).setFontColor("#ffffff");
  applyTableBody_(sheet, 'A72:D76');

  // Force recalculation so variance values are available for delta colouring.
  SpreadsheetApp.flush();

  // Apply delta colours to Variance % column (D72:D76).
  for (let i = 0; i < 5; i++) {
    const r = 72 + i;
    const v = sheet.getRange(`D${r}`).getValue();
    applyDeltaCell_(sheet, `D${r}`, typeof v === 'number' ? v : null);
  }

  // ── RECENT DOW PATTERN (build-time arrows) ─────────────────────────────
  row = 78;
  applyHairlineSection_(sheet, 'A78', 'RECENT DOW PATTERN (vs DoW Avg)');
  applyRowHeight_(sheet, row, 'section');

  row = 79;
  const recentDowHeaders = ["Day", "Last 4 Pattern", "Above Baseline"];
  recentDowHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A79:C79');

  try {
    const ss = sheet.getParent();
    const srcSheet = ss.getSheetByName(src);
    const lastRow = srcSheet.getLastRow();
    if (lastRow >= 2) {
      // Read A-E: Date, Day, WeekEnding, MOD, NetRevenue
      const data = srcSheet.getRange(2, 1, lastRow - 1, 5).getValues();
      const dowDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      dowDays.forEach((day, idx) => {
        const r = 80 + idx;
        sheet.getRange(r, 1).setValue(day);

        // For Sakura, NetRevenue is in col E (index 4)
        const dayRows = data.filter(row => row[1] === day && row[4] > 0);
        const dayShifts = dayRows
          .slice()
          .sort((a, b) => new Date(b[0]) - new Date(a[0]))
          .slice(0, 4);

        if (dayShifts.length === 0) {
          sheet.getRange(r, 2).setValue("—");
          sheet.getRange(r, 3).setValue("—");
          return;
        }

        const dayAvg = dayRows.reduce((sum, row) => sum + row[4], 0) / Math.max(1, dayRows.length);
        const arrows = dayShifts.reverse().map(row => row[4] >= dayAvg ? "↑" : "↓").join("");
        const aboveCount = dayShifts.filter(row => row[4] >= dayAvg).length;

        sheet.getRange(r, 2).setValue(arrows);
        sheet.getRange(r, 2).setFontSize(14);
        sheet.getRange(r, 3).setValue(`${aboveCount} of ${dayShifts.length}`);

        // Arrow colour: majority above avg → good, majority below → bad, split → neutral
        const arrowDelta = aboveCount > dayShifts.length / 2 ? 1
                         : aboveCount < dayShifts.length / 2 ? -1
                         : 0;
        applyDeltaCell_(sheet, `B${r}`, arrowDelta);
      });
    }
  } catch (e) {
    Logger.log(`Recent DoW pattern build skipped: ${e.message}`);
  }
  applyTableBody_(sheet, 'A80:C85');

  // Bold labels for MA and Consistency sections
  sheet.getRange("A48:A48").setFontWeight("bold");
  sheet.getRange("C48:C48").setFontWeight("bold");
  sheet.getRange("E48:E48").setFontWeight("bold");

  Logger.log("M8 Analytics Extensions section built for Sakura.");
}
