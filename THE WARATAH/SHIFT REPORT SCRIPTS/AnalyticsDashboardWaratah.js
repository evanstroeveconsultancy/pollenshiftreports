/****************************************************
 * WARATAH FINANCIAL ANALYTICS DASHBOARD
 *
 * Builds and refreshes the ANALYTICS tab in the
 * Data Warehouse spreadsheet using live formulas.
 *
 * Run buildFinancialDashboard() once to set up,
 * then the formulas auto-update as new data arrives.
 *
 * Source: NIGHTLY_FINANCIAL sheet
 * Columns (25-col schema as of May 2026):
 *   A=Date, B=Day, C=WeekEnding, D=MOD, E=Staff,
 *   F=NetRevenue, G=ProductionAmount, H=CashTakings,
 *   I=GrossSalesIncCash, J=CashReturns, K=CDDiscount,
 *   L=Refunds, M=CDRedeem, N=TotalDiscount,
 *   O=DiscountsCompsExcCD, P=GrossTaxableSales,
 *   Q=Taxes, R=NetSalesWTips, S=CardTips, T=CashTips,
 *   U=TotalTips, V=LoggedAt, W=CashCounted, X=ExpectedCash, Y=CashVariance
 *
 * @version 3.0.0
 ****************************************************/


function getAnalyticsConfig() {
  const config = getIntegrationConfig_();
  return {
    warehouseId: config.dataWarehouseId,
    sourceSheet: "NIGHTLY_FINANCIAL",
    dashboardSheet: "ANALYTICS",
    executiveSheet: "EXECUTIVE_DASHBOARD",
    timezone: "Australia/Sydney"
  };
}


/**
 * Builds the full financial analytics dashboard.
 * Sets up headers, formulas, and formatting on the ANALYTICS tab.
 * Safe to re-run — clears and rebuilds each time.
 */
function buildFinancialDashboard() {
  const config = getAnalyticsConfig();
  const ss = SpreadsheetApp.openById(config.warehouseId);
  let sheet = ss.getSheetByName(config.dashboardSheet);

  if (!sheet) {
    sheet = ss.insertSheet(config.dashboardSheet);
  }

  // Clear everything
  sheet.getDataRange().clearContent();
  sheet.clearFormats();
  sheet.clearConditionalFormatRules();

  applyColumnWidths_(sheet);

  const src = config.sourceSheet;
  const tz = config.timezone;
  const now = Utilities.formatDate(new Date(), tz, 'd MMM yyyy h:mm a');

  // ─── SECTION 1: HEADER ─────────────────────────────────────────────
  let row = 1;
  sheet.getRange('A1').breakApart();
  sheet.getRange('A1')
       .setValue('WARATAH · ANALYTICS DASHBOARD')
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
  sheet.getRange(row, 2).setFormula(`=IFERROR(SUMIFS(${src}!F:F,${src}!C:C,${weekRef}),0)`); // F=NetRevenue
  sheet.getRange(row, 2).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Avg Daily Revenue");
  sheet.getRange(row, 5).setFormula(`=IFERROR(AVERAGEIFS(${src}!F:F,${src}!C:C,${weekRef}),0)`); // F=NetRevenue
  sheet.getRange(row, 5).setNumberFormat("$#,##0");

  row = 7;
  sheet.getRange(row, 1).setValue("Total Cash Takings");
  sheet.getRange(row, 2).setFormula(`=IFERROR(SUMIFS(${src}!H:H,${src}!C:C,${weekRef}),0)`); // H=CashTakings
  sheet.getRange(row, 2).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Total Tips");
  sheet.getRange(row, 5).setFormula(`=IFERROR(SUMIFS(${src}!U:U,${src}!C:C,${weekRef}),0)`); // U=TotalTips
  sheet.getRange(row, 5).setNumberFormat("$#,##0");

  row = 8;
  sheet.getRange(row, 1).setValue("Total Discounts");
  sheet.getRange(row, 2).setFormula(`=IFERROR(SUMIFS(${src}!N:N,${src}!C:C,${weekRef}),0)`); // N=TotalDiscount
  sheet.getRange(row, 2).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Total Taxes");
  sheet.getRange(row, 5).setFormula(`=IFERROR(SUMIFS(${src}!Q:Q,${src}!C:C,${weekRef}),0)`); // Q=Taxes
  sheet.getRange(row, 5).setNumberFormat("$#,##0");

  row = 9;
  sheet.getRange(row, 1).setValue("Production Amount");
  sheet.getRange(row, 2).setFormula(`=IFERROR(SUMIFS(${src}!G:G,${src}!C:C,${weekRef}),0)`); // G=ProductionAmount
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
    { label: "Revenue",     col: "F", fmt: "$#,##0" },
    { label: "Cash Takings",col: "H", fmt: "$#,##0" },
    { label: "Tips",        col: "U", fmt: "$#,##0" },
    { label: "Discounts",   col: "N", fmt: "$#,##0" },
    { label: "Taxes",       col: "Q", fmt: "$#,##0" },
    { label: "Production",  col: "G", fmt: "$#,##0" },
  ];

  wowMetrics.forEach((m, i) => {
    const r = 14 + i;
    sheet.getRange(r, 1).setValue(m.label);
    sheet.getRange(r, 2).setFormula(`=IFERROR(SUMIFS(${src}!${m.col}:${m.col},${src}!C:C,${weekRef}),0)`).setNumberFormat(m.fmt);
    sheet.getRange(r, 3).setFormula(`=IFERROR(SUMIFS(${src}!${m.col}:${m.col},${src}!C:C,${prevRef}),0)`).setNumberFormat(m.fmt);
    sheet.getRange(r, 4).setFormula(`=IFERROR(B${r}-C${r},0)`).setNumberFormat(m.fmt);
    sheet.getRange(r, 5).setFormula(`=IFERROR(D${r}/C${r},0)`).setNumberFormat("+0.0%;-0.0%");
  });
  applyTableBody_(sheet, 'A14:E19');

  // Force recalculation so getValue() returns current formula results, not stale values.
  SpreadsheetApp.flush();

  // Delta colours baked in at build time. D column = change $, E column = change %.
  // Conditional formatting on D14:D19 (from existing CF rules) handles red/green for $;
  // we apply applyDeltaCell_ to E14:E19 (% column) which has no CF rule.
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
  const dowHeaders = ["Day", "Avg Revenue", "Avg Cash Takings", "Avg Tips", "Avg Discounts", "Avg Production", "Count", "Std Dev", "13W Trend"];
  dowHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, `A22:I22`);

  const days = ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  days.forEach((day, i) => {
    const r = 23 + i;
    sheet.getRange(r, 1).setValue(day);
    sheet.getRange(r, 2).setFormula(`=IFERROR(AVERAGEIFS(${src}!F:F,${src}!B:B,"${day}"),0)`).setNumberFormat("$#,##0");         // F=NetRevenue
    sheet.getRange(r, 3).setFormula(`=IFERROR(AVERAGEIFS(${src}!H:H,${src}!B:B,"${day}"),0)`).setNumberFormat("$#,##0");         // H=CashTakings
    sheet.getRange(r, 4).setFormula(`=IFERROR(AVERAGEIFS(${src}!U:U,${src}!B:B,"${day}"),0)`).setNumberFormat("$#,##0");         // U=TotalTips
    sheet.getRange(r, 5).setFormula(`=IFERROR(AVERAGEIFS(${src}!N:N,${src}!B:B,"${day}"),0)`).setNumberFormat("$#,##0");         // N=TotalDiscount
    sheet.getRange(r, 6).setFormula(`=IFERROR(AVERAGEIFS(${src}!G:G,${src}!B:B,"${day}"),0)`).setNumberFormat("$#,##0");         // G=ProductionAmount
    sheet.getRange(r, 7).setFormula(`=COUNTIF(${src}!B:B,"${day}")`).setNumberFormat("#,##0");
    // Std Dev (col H): population stddev of NetRevenue for this day
    sheet.getRange(r, 8).setFormula(
      `=IFERROR(STDEV(FILTER(${src}!F:F,${src}!B:B="${day}",${src}!F:F>0)),0)`
    ).setNumberFormat("$#,##0");
    // 13-week Sparkline (col I): trend of last 91 days for this day
    // Colour param replaced with STYLE.colour.good — only the colour changes, not chart type/linewidth/etc.
    sheet.getRange(r, 9).setFormula(
      `=IFERROR(SPARKLINE(FILTER(${src}!F:F,${src}!B:B="${day}",${src}!A:A>=TODAY()-91),{"charttype","line";"color","` + STYLE.colour.good + `";"linewidth",2}),"")`
    );
  });
  applyTableBody_(sheet, 'A23:I27');

  // MOD PERFORMANCE section removed — user deleted rows 31+ from the sheet (Feb 2026).
  // Do not add code here that writes to rows 31 or beyond on the ANALYTICS tab.

  // ─── SECTION 5: AVERAGE WEEKLY (ALL WEEKS) ─────────────────────────
  // Average of per-week totals (not per-shift). Uses AVERAGE(QUERY(...GROUP BY C))
  // so each week contributes one value regardless of how many shifts it contains.
  row = 28;
  applyHairlineSection_(sheet, 'A28', 'AVERAGE WEEKLY (ALL WEEKS)');
  applyRowHeight_(sheet, row, 'section');

  row = 29;
  sheet.getRange(row, 1).setValue("Avg Weekly Net Revenue");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(AVERAGE(QUERY(${src}!A2:V,"SELECT SUM(F) WHERE C IS NOT NULL GROUP BY C LABEL SUM(F) ''")),0)`
  ).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Avg Weekly Production");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(AVERAGE(QUERY(${src}!A2:V,"SELECT SUM(G) WHERE C IS NOT NULL GROUP BY C LABEL SUM(G) ''")),0)`
  ).setNumberFormat("$#,##0");

  row = 30;
  sheet.getRange(row, 1).setValue("Avg Weekly Tips");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(AVERAGE(QUERY(${src}!A2:V,"SELECT SUM(U) WHERE C IS NOT NULL GROUP BY C LABEL SUM(U) ''")),0)`
  ).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Avg Weekly Discounts");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(AVERAGE(QUERY(${src}!A2:V,"SELECT SUM(N) WHERE C IS NOT NULL GROUP BY C LABEL SUM(N) ''")),0)`
  ).setNumberFormat("$#,##0");

  applyTableBody_(sheet, 'A29:E30');

  // ─── SECTION 6: WEEKLY TREND ────────────────────────────────────────
  // Moved to col J (was I) to make room for Sparkline column in DoW Averages.
  const trendCol = 10; // Column J

  row = 4;
  applyHeroCard_(sheet, 'J4', null, null, 'J4:O5', 'WEEKLY TREND');
  sheet.getRange(row, trendCol, 1, 6).merge();
  applyRowHeight_(sheet, row, 'section');

  row = 5;
  const trendHeaders = ["Week Ending", "Revenue", "Cash Takings", "Tips", "Discounts", "Taxes"];
  trendHeaders.forEach((h, i) => sheet.getRange(row, trendCol + i).setValue(h));
  applyTableHeader_(sheet, 'J5:O5');

  row = 6;
  sheet.getRange(row, trendCol).setFormula(
    `=IFERROR(QUERY(${src}!A2:V,` +
    `"SELECT C, SUM(F), SUM(H), SUM(U), SUM(N), SUM(Q) ` +
    `WHERE C IS NOT NULL ` +
    `GROUP BY C ` +
    `ORDER BY C DESC ` +
    `LABEL C 'Week Ending', SUM(F) 'Revenue', SUM(H) 'Cash Takings', SUM(U) 'Tips', SUM(N) 'Discounts', SUM(Q) 'Taxes'"),"")`
  );
  applyTableBody_(sheet, 'J6:O56');
  // Format the Week Ending column as a date (QUERY returns serial numbers otherwise)
  sheet.getRange(7, trendCol, 50, 1).setNumberFormat("dd/MM/yyyy");

  // ─── FORMATTING ─────────────────────────────────────────────────────
  // Column widths applied via applyColumnWidths_() at top of function.

  // Bold labels in column A
  sheet.getRange("A5:A9").setFontWeight("bold");
  sheet.getRange("A13:A19").setFontWeight("bold");
  sheet.getRange("D5:D9").setFontWeight("bold");
  sheet.getRange("A29:A30").setFontWeight("bold");
  sheet.getRange("D29:D30").setFontWeight("bold");

  // Conditional formatting: negative WoW changes in red, positive in green
  const changeRange = sheet.getRange("D14:D19");
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
  buildExtendedTrends_Waratah(sheet, src);

  // ─── M8: ANALYTICS EXTENSIONS (4W MA, Consistency, Top/Bottom 5, Outliers, Recent DoW) ─
  buildAnalyticsExtensions_Waratah(sheet, src);

  Logger.log("Financial analytics dashboard built successfully.");
  try { SpreadsheetApp.getUi().alert("Financial Analytics dashboard has been built on the ANALYTICS tab."); }
  catch (e) { Logger.log('UI alert skipped — trigger context'); }
}


/**
 * Builds the Executive Dashboard on the EXECUTIVE_DASHBOARD tab.
 * Higher-level monthly/quarterly view for ownership review.
 * Safe to re-run — clears and rebuilds each time.
 *
 * Sections:
 *   1. Header
 *   2. Current Month Snapshot (SUMPRODUCT with MONTH/YEAR)
 *   3. Monthly Trend (QUERY grouped by YEAR*100+MONTH)
 *   4. Rolling 4-Week Comparison (last 4 week-ending dates)
 *   5. Top MOD Performance (right side, col H)
 *   6. Day-of-Week Revenue Ranking (right side, col H)
 */
function buildExecutiveDashboard() {
  const config = getAnalyticsConfig();
  const ss = SpreadsheetApp.openById(config.warehouseId);
  let sheet = ss.getSheetByName(config.executiveSheet);

  if (!sheet) {
    sheet = ss.insertSheet(config.executiveSheet);
  }

  sheet.getDataRange().clearContent();
  sheet.clearFormats();
  sheet.clearConditionalFormatRules();

  applyColumnWidths_(sheet);

  const src = config.sourceSheet;

  // ─── SECTION 1: HEADER ─────────────────────────────────────────────
  let row = 1;
  // Row 1: page title + timestamp
  sheet.getRange('A1').breakApart();
  sheet.getRange('A1')
       .setValue('WARATAH · EXECUTIVE DASHBOARD')
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.metric)
       .setFontWeight('bold')
       .setFontColor(STYLE.colour.ink)
       .setHorizontalAlignment('left')
       .setVerticalAlignment('middle');
  sheet.getRange('I1')
       .setValue('Last updated: ' + Utilities.formatDate(new Date(), 'Australia/Sydney', 'd MMM yyyy h:mm a'))
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.label)
       .setFontColor(STYLE.colour.inkMuted)
       .setHorizontalAlignment('right')
       .setVerticalAlignment('middle');
  applyRowHeight_(sheet, 1, 'section');
  // Row 2: spacer (timestamp moved to I1)
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
    `=IFERROR(SUMPRODUCT((MONTH(${src}!A2:A)=MONTH(TODAY()))*(YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!F2:F),0)` // F=NetRevenue
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
    `=IFERROR(SUMPRODUCT((MONTH(${src}!A2:A)=MONTH(TODAY()))*(YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!U2:U),0)` // U=TotalTips
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
    `=IFERROR(SUMPRODUCT((MONTH(${src}!A2:A)=MONTH(TODAY()))*(YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!N2:N),0)` // N=TotalDiscount
  );
  sheet.getRange(row, 2).setNumberFormat("$#,##0")
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.metric)
       .setFontWeight('bold')
       .setFontColor(STYLE.colour.ink);

  sheet.getRange(row, 4).setValue("Total Taxes");
  sheet.getRange(row, 4).setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.body)
       .setFontColor(STYLE.colour.inkMuted)
       .setFontWeight('normal');
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(SUMPRODUCT((MONTH(${src}!A2:A)=MONTH(TODAY()))*(YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!Q2:Q),0)` // Q=Taxes
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
  const monthHeaders = ["Month", "Revenue", "Tips", "Discounts", "Taxes", "Shifts"];
  monthHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A11:F11');

  row = 12;
  sheet.getRange(row, 1).setFormula(
    `=IFERROR(QUERY(${src}!A2:V,` +
    `"SELECT YEAR(A)*100+MONTH(A), SUM(F), SUM(U), SUM(N), SUM(Q), COUNT(A) ` +
    `WHERE A IS NOT NULL ` +
    `GROUP BY YEAR(A)*100+MONTH(A) ` +
    `ORDER BY YEAR(A)*100+MONTH(A) DESC ` +
    `LABEL YEAR(A)*100+MONTH(A) 'Month', SUM(F) 'Revenue', SUM(U) 'Tips', SUM(N) 'Discounts', ` +
    `SUM(Q) 'Taxes', COUNT(A) 'Shifts'"),"")`
  );
  applyTableBody_(sheet, 'A12:F24');

  // ─── SECTION 4: ROLLING 4-WEEK COMPARISON ──────────────────────────
  row = 26;
  applyHairlineSection_(sheet, 'A26', 'ROLLING 4-WEEK COMPARISON');
  applyRowHeight_(sheet, row, 'section');

  row = 27;
  const weekCompHeaders = ["", "Week 1 (Latest)", "Week 2", "Week 3", "Week 4"];
  weekCompHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A27:E27');

  row = 28;
  sheet.getRange(row, 1).setValue("Week Ending");
  for (let w = 1; w <= 4; w++) {
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(LARGE(UNIQUE(${src}!C2:C),${w}),"")`);
    sheet.getRange(row, w + 1).setNumberFormat("dd/MM/yyyy");
  }

  row = 29;
  sheet.getRange(row, 1).setValue("Revenue");
  for (let w = 1; w <= 4; w++) {
    const weekCell = String.fromCharCode(65 + w) + "28";
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(SUMIFS(${src}!F:F,${src}!C:C,${weekCell}),0)`); // F=NetRevenue
    sheet.getRange(row, w + 1).setNumberFormat("$#,##0");
  }

  row = 30;
  sheet.getRange(row, 1).setValue("Tips");
  for (let w = 1; w <= 4; w++) {
    const weekCell = String.fromCharCode(65 + w) + "28";
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(SUMIFS(${src}!U:U,${src}!C:C,${weekCell}),0)`); // U=TotalTips
    sheet.getRange(row, w + 1).setNumberFormat("$#,##0");
  }

  row = 31;
  sheet.getRange(row, 1).setValue("Discounts");
  for (let w = 1; w <= 4; w++) {
    const weekCell = String.fromCharCode(65 + w) + "28";
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(SUMIFS(${src}!N:N,${src}!C:C,${weekCell}),0)`); // N=TotalDiscount
    sheet.getRange(row, w + 1).setNumberFormat("$#,##0");
  }

  row = 32;
  sheet.getRange(row, 1).setValue("Shifts");
  for (let w = 1; w <= 4; w++) {
    const weekCell = String.fromCharCode(65 + w) + "28";
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(COUNTIF(${src}!C:C,${weekCell}),0)`);
  }

  // WoW change rows
  row = 33;
  sheet.getRange(row, 1).setValue("Revenue WoW $");
  sheet.getRange(row, 2).setFormula("=IFERROR(B29-C29,0)").setNumberFormat("$#,##0");
  sheet.getRange(row, 3).setFormula("=IFERROR(C29-D29,0)").setNumberFormat("$#,##0");
  sheet.getRange(row, 4).setFormula("=IFERROR(D29-E29,0)").setNumberFormat("$#,##0");
  sheet.getRange(row, 5).setValue("—");

  row = 34;
  sheet.getRange(row, 1).setValue("Revenue WoW %");
  sheet.getRange(row, 2).setFormula("=IFERROR((B29-C29)/C29,0)").setNumberFormat("+0.0%;-0.0%");
  sheet.getRange(row, 3).setFormula("=IFERROR((C29-D29)/D29,0)").setNumberFormat("+0.0%;-0.0%");
  sheet.getRange(row, 4).setFormula("=IFERROR((D29-E29)/E29,0)").setNumberFormat("+0.0%;-0.0%");
  sheet.getRange(row, 5).setValue("—");

  applyTableBody_(sheet, 'A28:E34');

  // ─── SECTION 4b: THIS WEEK vs 13W BASELINE ─────────────────────────
  // Flags shifts performing above/below their day-of-week 13-week average.
  // Uses MAX(C:C) as "current week" and AVERAGEIFS with TODAY()-91 window.
  row = 36;
  applyHairlineSection_(sheet, 'A36', 'THIS WEEK vs 13W BASELINE');
  applyRowHeight_(sheet, row, 'section');

  row = 37;
  const baseHeaders = ["Day", "This Week", "13W DoW Avg", "Diff $", "Diff %"];
  baseHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A37:E37');

  const baselineDays = ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  baselineDays.forEach((day, i) => {
    const r = 38 + i;
    sheet.getRange(r, 1).setValue(day);
    // This Week: SUMIFS where Day=this day AND WeekEnding=latest week
    sheet.getRange(r, 2).setFormula(
      `=IFERROR(SUMIFS(${src}!F:F,${src}!B:B,"${day}",${src}!C:C,MAX(${src}!C:C)),0)`
    ).setNumberFormat("$#,##0");
    // 13W DoW Avg: AVERAGEIFS with 91-day window
    sheet.getRange(r, 3).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!F:F,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-91),0)`
    ).setNumberFormat("$#,##0");
    // Delta $ and % — number formats without [red] prefix; delta colour applied below via applyDeltaCell_
    sheet.getRange(r, 4).setFormula(`=IFERROR(B${r}-C${r},0)`).setNumberFormat("$#,##0;-$#,##0");
    sheet.getRange(r, 5).setFormula(`=IFERROR(D${r}/C${r},0)`).setNumberFormat("+0.0%;-0.0%");
  });
  applyTableBody_(sheet, 'A38:E42');

  // Force formula recalculation before reading values for delta colouring.
  // Without flush(), getValue() after setFormula() in the same execution can
  // return stale (pre-formula) results, leading to incorrect neutral colour.
  SpreadsheetApp.flush();

  // Delta colours baked in at build time — reflect data at the moment of rebuild.
  // A dashboard rebuild refreshes them. applyDeltaCell_ reads current values.
  baselineDays.forEach((day, i) => {
    const r = 38 + i;
    const diffDollar = sheet.getRange(r, 4).getValue();
    const diffPct    = sheet.getRange(r, 5).getValue();
    applyDeltaCell_(sheet, `D${r}`, typeof diffDollar === 'number' ? diffDollar : null);
    applyDeltaCell_(sheet, `E${r}`, typeof diffPct    === 'number' ? diffPct    : null);
  });

  // ─── SECTION 5: INSIGHTS (right side) ──────────────────────────────
  // Replaces former TOP MOD block. Three sub-sections:
  //   - TRAJECTORY: 4-week slope, next-month forecast, recent direction
  //   - EXCEPTIONS: highest/lowest single shift this month
  //   - REPORTS:    shift count this month
  const modCol = 8; // Column H — kept name for downstream code

  // Section header — hairline style; then merge the row across H:K
  applyHairlineSection_(sheet, 'H4', 'INSIGHTS');
  sheet.getRange('H4:K4').merge();
  applyRowHeight_(sheet, 4, 'section');

  // ── Trajectory subheader ────────────────────────────────────────────
  sheet.getRange(5, modCol).setValue("TRAJECTORY");
  sheet.getRange(5, modCol)
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.label)
       .setFontWeight('bold')
       .setFontStyle('normal')
       .setFontColor(STYLE.colour.inkMuted);
  sheet.getRange(5, modCol, 1, 4).merge();

  // 4-Week Trend: SLOPE of last 4 weeks (B29=latest, E29=oldest of rolling 4)
  // TEXT() bakes in the $ format because we append " /wk" as a string.
  sheet.getRange(6, modCol).setValue("4-Week Trend");
  sheet.getRange(6, modCol + 1).setFormula(
    `=IFERROR(TEXT(SLOPE(B29:E29,{4,3,2,1}),"$#,##0;-$#,##0")&" /wk","-")`
  );

  // Forecast Next Month: AVERAGE of last 3 months from MONTHLY TREND.
  // QUERY at row 12 outputs labels at row 12, data starts at row 13.
  // ORDER BY ... DESC means row 13 = most recent month.
  sheet.getRange(7, modCol).setValue("Forecast Next Month");
  sheet.getRange(7, modCol + 1).setFormula(
    `=IFERROR(AVERAGE(B13:B15),0)`
  ).setNumberFormat("$#,##0");

  // Last 4 Weeks direction: count up-weeks among 3 transitions in B29:E29
  sheet.getRange(8, modCol).setValue("Last 4 Weeks");
  sheet.getRange(8, modCol + 1).setFormula(
    `="Up "&(IF(B29>C29,1,0)+IF(C29>D29,1,0)+IF(D29>E29,1,0))&" of 3"`
  );
  applyTableBody_(sheet, 'H6:K8');

  // ── Exceptions subheader ───────────────────────────────────────────
  sheet.getRange(9, modCol).setValue("EXCEPTIONS");
  sheet.getRange(9, modCol)
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.label)
       .setFontWeight('bold')
       .setFontStyle('normal')
       .setFontColor(STYLE.colour.inkMuted);
  sheet.getRange(9, modCol, 1, 4).merge();

  // Best Shift This Month: MAXIFS + INDEX/MATCH for date
  const monthStart = `EOMONTH(TODAY(),-1)+1`;
  const monthEnd = `EOMONTH(TODAY(),0)`;
  sheet.getRange(10, modCol).setValue("Best Shift");
  sheet.getRange(10, modCol + 1).setFormula(
    `=IFERROR(MAXIFS(${src}!F:F,${src}!A:A,">="&${monthStart},${src}!A:A,"<="&${monthEnd}),0)`
  ).setNumberFormat("$#,##0");
  sheet.getRange(10, modCol + 2).setFormula(
    `=IFERROR(TEXT(INDEX(${src}!A:A,MATCH(I10,${src}!F:F,0)),"ddd d MMM"),"-")`
  );

  // Worst Shift This Month: MINIFS + INDEX/MATCH (filter >0 to exclude blanks)
  sheet.getRange(11, modCol).setValue("Worst Shift");
  sheet.getRange(11, modCol + 1).setFormula(
    `=IFERROR(MINIFS(${src}!F:F,${src}!A:A,">="&${monthStart},${src}!A:A,"<="&${monthEnd},${src}!F:F,">0"),0)`
  ).setNumberFormat("$#,##0");
  sheet.getRange(11, modCol + 2).setFormula(
    `=IFERROR(TEXT(INDEX(${src}!A:A,MATCH(I11,${src}!F:F,0)),"ddd d MMM"),"-")`
  );

  // Reports Filed: references E6 (Shifts) from CURRENT MONTH section
  sheet.getRange(12, modCol).setValue("Reports Filed");
  sheet.getRange(12, modCol + 1).setFormula(`=E6&" shifts logged"`);
  applyTableBody_(sheet, 'H10:K12');

  // ─── SECTION 6: DAY-OF-WEEK REVENUE RANKING (right side) ──────────
  let dowRow = 16;
  applyHeroCard_(sheet, 'H16', null, null, 'H16:L22', 'REVENUE BY DAY');
  sheet.getRange('H16:L16').merge();
  applyRowHeight_(sheet, dowRow, 'section');

  dowRow = 17;
  const dowRankHeaders = ["Day", "Avg Revenue", "Total Revenue", "Shifts", "Share"];
  dowRankHeaders.forEach((h, i) => sheet.getRange(dowRow, modCol + i).setValue(h));
  applyTableHeader_(sheet, 'H17:L17');

  dowRow = 18;
  sheet.getRange(dowRow, modCol).setFormula(
    `=IFERROR(QUERY(${src}!A2:V,` +
    `"SELECT B, AVG(F), SUM(F), COUNT(A) ` +
    `WHERE B IS NOT NULL ` +
    `GROUP BY B ` +
    `ORDER BY AVG(F) DESC ` +
    `LABEL B 'Day', AVG(F) 'Avg Revenue', SUM(F) 'Total Revenue', COUNT(A) 'Shifts'"),"")`
  );
  applyTableBody_(sheet, 'H18:L22');

  // Share % column (col L, rows 19-23 = Waratah's 5 operating days).
  // J19:J23 holds Total Revenue per day from QUERY above. Bar uses REPT for visual.
  for (let r = 19; r <= 23; r++) {
    sheet.getRange(r, modCol + 4).setFormula(
      `=IFERROR(IF(J${r}>0,REPT("▓",ROUND(J${r}/SUM($J$19:$J$23)*12,0))&" "&TEXT(J${r}/SUM($J$19:$J$23),"0%"),""),"")`
    );
  }

  // ─── FORMATTING ─────────────────────────────────────────────────────
  // Column widths applied via applyColumnWidths_() at top of function.

  // Bold labels
  sheet.getRange("A5:A8").setFontWeight("bold");
  sheet.getRange("D6:D8").setFontWeight("bold");
  sheet.getRange("A28:A34").setFontWeight("bold");
  sheet.getRange("A38:A42").setFontWeight("bold");
  sheet.getRange("H6:H8").setFontWeight("bold");
  sheet.getRange("H10:H12").setFontWeight("bold");

  // Conditional formatting: WoW changes red/green
  const wowChangeRange = sheet.getRange("B33:D34");
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
  try { SpreadsheetApp.getUi().alert("Executive Dashboard has been built on the EXECUTIVE_DASHBOARD tab."); }
  catch (e) { Logger.log('UI alert skipped — trigger context'); }
}


// ============================================================================
// M7 — EXTENDED TREND WINDOWS (Waratah)
// ============================================================================

/**
 * Appends the "Extended Trends" section to the Waratah ANALYTICS sheet.
 * Uses AVERAGEIFS/SUMIFS formulas so the section auto-updates.
 *
 * Sections added (starting after row 28, after existing Day-of-Week):
 *   - 13-week & 26-week day-of-week average revenue table (Wed-Sun)
 *   - Day-of-week revenue heatmap (green=best, red=worst)
 *   - Year-to-Date summary (total revenue, shifts, avg per shift)
 *
 * Waratah NIGHTLY_FINANCIAL columns (25-col schema):
 *   A=Date, B=Day, F=NetRevenue, U=TotalTips, W=CashCounted, X=ExpectedCash, Y=CashVariance
 *
 * @param {Sheet} sheet  - The ANALYTICS sheet object.
 * @param {string} src   - Source sheet name ("NIGHTLY_FINANCIAL").
 */
function buildExtendedTrends_Waratah(sheet, src) {
  // DoW averages end row 27; AVERAGE WEEKLY occupies rows 28-30; row 31 is a spacer.
  let row = 32;

  // ── Section header ───────────────────────────────────────────────────
  applyHairlineSection_(sheet, 'A32', 'EXTENDED TRENDS — DAY-OF-WEEK (13W / 26W)');
  applyRowHeight_(sheet, row, 'section');

  // ── Column headers ───────────────────────────────────────────────────
  row = 33;
  const etHeaders = ["Day", "13-Week Avg Rev", "26-Week Avg Rev", "13-Week Avg Tips", "26-Week Avg Tips", "Heatmap Rank"];
  etHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A33:F33');

  // ── Per-day rows (Wed-Sun = 5 days) ─────────────────────────────────
  const waratahDays = ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  waratahDays.forEach((day, i) => {
    const r = 34 + i;
    sheet.getRange(r, 1).setValue(day);

    // 13-week avg revenue (91 days) — F=NetRevenue
    sheet.getRange(r, 2).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!F:F,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-91),0)`
    ).setNumberFormat("$#,##0");

    // 26-week avg revenue (182 days)
    sheet.getRange(r, 3).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!F:F,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-182),0)`
    ).setNumberFormat("$#,##0");

    // 13-week avg tips — U=TotalTips
    sheet.getRange(r, 4).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!U:U,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-91),0)`
    ).setNumberFormat("$#,##0");

    // 26-week avg tips
    sheet.getRange(r, 5).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!U:U,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-182),0)`
    ).setNumberFormat("$#,##0");

    // Rank by 13-week avg revenue (RANK: 1=highest)
    sheet.getRange(r, 6).setFormula(`=IFERROR(RANK(B${r},B34:B38,0),"")`);
  });

  applyTableBody_(sheet, 'A34:F38');

  // ── Day-of-week heatmap: colour B34:B38 best→worst using STYLE palette ──
  // Rank 1 (best)  → STYLE.colour.good      (#2f5d3a)
  // Rank 2         → STYLE.colour.cardFill   (#f5f5f2)  — light neutral
  // Rank 3 (mid)   → STYLE.colour.neutral    (#8a8a7a)  — implied mid
  // Rank 4         → STYLE.colour.sand       (#d6cfa8)  — warm low
  // Rank 5 (worst) → STYLE.colour.bad        (#b5533c)
  const heatmapColors = [
    STYLE.colour.good,        // rank 1 — best
    STYLE.colour.cardFill,    // rank 2
    '#c8d4c8',                // rank 3 — mid (neutral green-grey, derived from palette)
    STYLE.colour.sand,        // rank 4
    STYLE.colour.bad          // rank 5 — worst
  ];

  try {
    const revenueVals = sheet.getRange(34, 2, 5, 1).getValues().map(r => r[0]);
    if (revenueVals.some(v => v > 0)) {
      const sorted = revenueVals
        .map((v, i) => ({ v, i }))
        .sort((a, b) => b.v - a.v);
      sorted.forEach(({ i }, rank) => {
        sheet.getRange(34 + i, 2).setBackground(heatmapColors[rank] || STYLE.colour.cardFill);
      });
    }
  } catch (e) {
    Logger.log(`Extended Trends heatmap skipped: ${e.message}`);
  }

  // ── Year to Date ─────────────────────────────────────────────────────
  row = 41;
  applyHairlineSection_(sheet, 'A41', 'YEAR TO DATE');
  applyRowHeight_(sheet, row, 'section');

  row = 42;
  sheet.getRange(row, 1).setValue("YTD Total Revenue");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(SUMPRODUCT((YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!F2:F),0)` // F=NetRevenue
  ).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("YTD Shifts");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(SUMPRODUCT((YEAR(${src}!A2:A)=YEAR(TODAY()))*(${src}!A2:A<>"")*1),0)`
  ).setNumberFormat("#,##0");

  row = 43;
  sheet.getRange(row, 1).setValue("YTD Avg Revenue / Shift");
  sheet.getRange(row, 2).setFormula(`=IFERROR(B42/E42,0)`).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("YTD Total Tips");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(SUMPRODUCT((YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!U2:U),0)` // U=TotalTips
  ).setNumberFormat("$#,##0");

  applyTableBody_(sheet, 'A42:E43');
  // Sand accent on YTD label cells — reserved accent for benchmark/YTD context
  sheet.getRange("A42:A43").setBackground(STYLE.colour.sand).setFontWeight("bold");
  sheet.getRange("D42:D43").setFontWeight("bold");

  Logger.log("M7 Extended Trends section built for Waratah.");
}


// ============================================================================
// M8 — ANALYTICS EXTENSIONS (Waratah)
// ============================================================================

/**
 * Builds the lower-half analytics sections on the ANALYTICS sheet.
 * Adds: 4-Week Moving Average, Consistency, Top/Bottom 5 Shifts,
 *       Outliers vs DoW Baseline, Recent DoW Pattern.
 *
 * Layout (rows 45+ — YTD ends at row 43):
 *   Row 45:    4-WEEK MOVING AVERAGE header
 *   Row 46:    Current 4W MA + Prior 4W MA + Change %
 *   Row 48:    CONSISTENCY header
 *   Rows 49-50: Most Consistent / Most Volatile day
 *   Row 52:    TOP 5 SHIFTS THIS MONTH header
 *   Rows 53-58: Header + 5 SORTN rows
 *   Row 60:    BOTTOM 5 SHIFTS THIS MONTH header
 *   Rows 61-66: Header + 5 SORTN rows
 *   Row 68:    OUTLIERS THIS MONTH header
 *   Rows 69-74: Header + 5 outlier rows
 *   Row 76:    RECENT DOW PATTERN header
 *   Rows 77-82: Header + 5 day rows (build-time arrows)
 *
 * Waratah NIGHTLY_FINANCIAL columns (25-col schema):
 *   A=Date, B=Day, C=WeekEnding, D=MOD, F=NetRevenue, U=TotalTips
 */
function buildAnalyticsExtensions_Waratah(sheet, src) {
  // ── 4-WEEK MOVING AVERAGE ─────────────────────────────────────────────
  let row = 45;
  applyHairlineSection_(sheet, 'A45', '4-WEEK MOVING AVERAGE');
  applyRowHeight_(sheet, row, 'section');

  row = 46;
  sheet.getRange(row, 1).setValue("Current 4W MA");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(AVERAGE(ARRAYFORMULA(SUMIF(${src}!C:C,QUERY(UNIQUE(${src}!C2:C),"SELECT Col1 WHERE Col1 IS NOT NULL ORDER BY Col1 DESC LIMIT 4",0),${src}!F:F))),0)`
  ).setNumberFormat("$#,##0");

  sheet.getRange(row, 3).setValue("Prior 4W MA");
  sheet.getRange(row, 4).setFormula(
    `=IFERROR(AVERAGE(ARRAYFORMULA(SUMIF(${src}!C:C,QUERY(UNIQUE(${src}!C2:C),"SELECT Col1 WHERE Col1 IS NOT NULL ORDER BY Col1 DESC LIMIT 4 OFFSET 4",0),${src}!F:F))),0)`
  ).setNumberFormat("$#,##0");

  sheet.getRange(row, 5).setValue("Change");
  sheet.getRange(row, 6).setFormula(`=IFERROR((B${row}-D${row})/D${row},0)`).setNumberFormat("+0.0%;[red]-0.0%");

  applyTableBody_(sheet, 'A46:F46');

  // ── CONSISTENCY ────────────────────────────────────────────────────────
  // DoW Avg in B23:B27, StdDev in H23:H27. CV = StdDev/Avg.
  row = 48;
  applyHairlineSection_(sheet, 'A48', 'CONSISTENCY');
  applyRowHeight_(sheet, row, 'section');

  row = 49;
  sheet.getRange(row, 1).setValue("Most Consistent Day");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(INDEX(A23:A27,MATCH(MIN(ARRAYFORMULA(IF(B23:B27>0,H23:H27/B23:B27,9))),ARRAYFORMULA(IF(B23:B27>0,H23:H27/B23:B27,9)),0))&" (±"&TEXT(MIN(ARRAYFORMULA(IF(B23:B27>0,H23:H27/B23:B27,9))),"0%")&")","-")`
  );

  row = 50;
  sheet.getRange(row, 1).setValue("Most Volatile Day");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(INDEX(A23:A27,MATCH(MAX(ARRAYFORMULA(IF(B23:B27>0,H23:H27/B23:B27,0))),ARRAYFORMULA(IF(B23:B27>0,H23:H27/B23:B27,0)),0))&" (±"&TEXT(MAX(ARRAYFORMULA(IF(B23:B27>0,H23:H27/B23:B27,0))),"0%")&")","-")`
  );
  applyTableBody_(sheet, 'A49:B50');

  // ── TOP 5 SHIFTS THIS MONTH ────────────────────────────────────────────
  row = 52;
  applyHairlineSection_(sheet, 'A52', 'TOP 5 SHIFTS THIS MONTH');
  applyRowHeight_(sheet, row, 'section');

  row = 53;
  const shiftHeaders = ["Date", "Day", "MOD", "Revenue"];
  shiftHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A53:D53');

  row = 54;
  sheet.getRange(row, 1).setFormula(
    `=IFERROR(SORTN(FILTER({${src}!A2:A,${src}!B2:B,${src}!D2:D,${src}!F2:F},MONTH(${src}!A2:A)=MONTH(TODAY()),YEAR(${src}!A2:A)=YEAR(TODAY()),${src}!F2:F>0),5,0,4,FALSE),"No shifts logged this month")`
  );
  sheet.getRange(row, 1, 5, 1).setNumberFormat("dd/MM/yyyy");
  sheet.getRange(row, 4, 5, 1).setNumberFormat("$#,##0");
  applyTableBody_(sheet, 'A54:D58');
  // Rank accent: first date column gets good (green) colour to flag top shifts
  sheet.getRange('A54:A58').setFontWeight('bold').setFontColor(STYLE.colour.good);

  // ── BOTTOM 5 SHIFTS THIS MONTH ─────────────────────────────────────────
  row = 60;
  applyHairlineSection_(sheet, 'A60', 'BOTTOM 5 SHIFTS THIS MONTH');
  applyRowHeight_(sheet, row, 'section');

  row = 61;
  shiftHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A61:D61');

  row = 62;
  sheet.getRange(row, 1).setFormula(
    `=IFERROR(SORTN(FILTER({${src}!A2:A,${src}!B2:B,${src}!D2:D,${src}!F2:F},MONTH(${src}!A2:A)=MONTH(TODAY()),YEAR(${src}!A2:A)=YEAR(TODAY()),${src}!F2:F>0),5,0,4,TRUE),"No shifts logged this month")`
  );
  sheet.getRange(row, 1, 5, 1).setNumberFormat("dd/MM/yyyy");
  sheet.getRange(row, 4, 5, 1).setNumberFormat("$#,##0");
  applyTableBody_(sheet, 'A62:D66');
  // Rank accent: first date column gets bad (terracotta) colour to flag bottom shifts
  sheet.getRange('A62:A66').setFontWeight('bold').setFontColor(STYLE.colour.bad);

  // ── OUTLIERS THIS MONTH (vs DoW 13W Baseline) ──────────────────────────
  // Lists top 5 shifts by absolute % variance from DoW average (A23:B27).
  row = 68;
  applyHairlineSection_(sheet, 'A68', 'OUTLIERS THIS MONTH (vs DoW Baseline)');
  applyRowHeight_(sheet, row, 'section');

  row = 69;
  const outlierHeaders = ["Date", "Day", "Revenue", "Variance %"];
  outlierHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A69:D69');

  row = 70;
  const variance = `IFERROR((${src}!F2:F-VLOOKUP(${src}!B2:B,$A$23:$B$27,2,FALSE))/VLOOKUP(${src}!B2:B,$A$23:$B$27,2,FALSE),0)`;
  sheet.getRange(row, 1).setFormula(
    `=IFERROR(SORTN(FILTER({${src}!A2:A,${src}!B2:B,${src}!F2:F,${variance},ABS(${variance})},MONTH(${src}!A2:A)=MONTH(TODAY()),YEAR(${src}!A2:A)=YEAR(TODAY()),${src}!F2:F>0,ABS(${variance})>0.2),5,0,5,FALSE),"No outliers detected this month (>20% variance)")`
  );
  sheet.getRange(row, 1, 5, 1).setNumberFormat("dd/MM/yyyy");
  sheet.getRange(row, 3, 5, 1).setNumberFormat("$#,##0");
  sheet.getRange(row, 4, 5, 1).setNumberFormat("+0.0%;[red]-0.0%");
  // Hide the 5th column (|variance| sort key) — white text on white background
  sheet.getRange(row, 5, 5, 1).setFontColor("#ffffff");
  applyTableBody_(sheet, 'A70:D74');

  // Force recalculation so variance values are available for delta colouring.
  SpreadsheetApp.flush();

  // Apply delta colours to Variance % column (D70:D74).
  for (let i = 0; i < 5; i++) {
    const r = 70 + i;
    const v = sheet.getRange(`D${r}`).getValue();
    applyDeltaCell_(sheet, `D${r}`, typeof v === 'number' ? v : null);
  }

  // ── RECENT DOW PATTERN (build-time arrows) ─────────────────────────────
  row = 76;
  applyHairlineSection_(sheet, 'A76', 'RECENT DOW PATTERN (vs DoW Avg)');
  applyRowHeight_(sheet, row, 'section');

  row = 77;
  const recentDowHeaders = ["Day", "Last 4 Pattern", "Above Baseline"];
  recentDowHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  applyTableHeader_(sheet, 'A77:C77');

  try {
    const ss = sheet.getParent();
    const srcSheet = ss.getSheetByName(src);
    const lastRow = srcSheet.getLastRow();
    if (lastRow >= 2) {
      // Read A-F: Date, Day, WeekEnding, MOD, Staff, NetRevenue
      const data = srcSheet.getRange(2, 1, lastRow - 1, 6).getValues();
      const waratahDays = ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

      waratahDays.forEach((day, idx) => {
        const r = 78 + idx;
        sheet.getRange(r, 1).setValue(day);

        // For Waratah, NetRevenue is in col F (index 5)
        const dayRows = data.filter(row => row[1] === day && row[5] > 0);
        const dayShifts = dayRows
          .slice()
          .sort((a, b) => new Date(b[0]) - new Date(a[0]))
          .slice(0, 4);

        if (dayShifts.length === 0) {
          sheet.getRange(r, 2).setValue("—");
          sheet.getRange(r, 3).setValue("—");
          return;
        }

        const dayAvg = dayRows.reduce((sum, row) => sum + row[5], 0) / Math.max(1, dayRows.length);
        const arrows = dayShifts.reverse().map(row => row[5] >= dayAvg ? "↑" : "↓").join("");
        const aboveCount = dayShifts.filter(row => row[5] >= dayAvg).length;

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
  applyTableBody_(sheet, 'A78:C82');

  // Bold labels for new sections — label column
  sheet.getRange("A46:A46").setFontWeight("bold");
  sheet.getRange("C46:C46").setFontWeight("bold");
  sheet.getRange("E46:E46").setFontWeight("bold");

  Logger.log("M8 Analytics Extensions section built for Waratah.");
}
