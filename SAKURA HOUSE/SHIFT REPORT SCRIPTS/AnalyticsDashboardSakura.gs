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
 * Layout (compressed):
 *   Row 1:   Header
 *   Row 2:   Timestamp
 *   Row 3:   THIS WEEK header  |  WEEKLY TREND header (col H)
 *   Row 4:   Week Ending + Shifts  |  Trend column headers (col H)
 *   Row 5:   Total Revenue + Avg Daily  |  Trend QUERY (col H)
 *   Row 6:   Total Tips + Production
 *   Row 7:   Total Discounts
 *   Row 8:   WEEK-OVER-WEEK header
 *   Row 9:   Previous Week Ending
 *   Row 10:  WoW column headers
 *   Rows 11-14: WoW data rows
 *   Row 15:  DAY-OF-WEEK AVERAGES header
 *   Row 16:  DoW column headers
 *   Rows 17-22: DoW data (Mon-Sat)
 *   Row 23:  AVERAGE WEEKLY (ALL WEEKS) header
 *   Row 24:  Avg Weekly Net Revenue + Avg Weekly Production
 *   Row 25:  Avg Weekly Tips + Avg Weekly Discounts
 *   Row 27+: Extended Trends (M7) — header 27, data 29-34, YTD 36-38
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

  const src = ANALYTICS_CONFIG.sourceSheet;
  const tz = ANALYTICS_CONFIG.timezone;
  const now = Utilities.formatDate(new Date(), tz, "dd/MM/yyyy HH:mm");

  // ─── SECTION 1: HEADER ─────────────────────────────────────────────
  let row = 1;
  sheet.getRange(row, 1).setValue("SAKURA HOUSE — FINANCIAL ANALYTICS");
  sheet.getRange(row, 1).setFontSize(16).setFontWeight("bold");
  sheet.getRange(row, 1, 1, 6).merge();

  row = 2;
  sheet.getRange(row, 1).setValue(`Dashboard built: ${now}  •  Data refreshes automatically`);
  sheet.getRange(row, 1).setFontSize(9).setFontColor("#666666").setFontStyle("italic");
  sheet.getRange(row, 1, 1, 6).merge();

  // ─── SECTION 2: THIS WEEK SNAPSHOT ──────────────────────────────────
  row = 3;
  _sectionHeader_(sheet, row, "THIS WEEK");

  row = 4;
  sheet.getRange(row, 1).setValue("Week Ending");
  sheet.getRange(row, 2).setFormula(`=IFERROR(MAX(${src}!C:C),"")`);
  sheet.getRange(row, 2).setNumberFormat("dd/MM/yyyy");

  sheet.getRange(row, 4).setValue("Shifts Reported");
  sheet.getRange(row, 5).setFormula(`=IFERROR(COUNTIF(${src}!C:C,B${row}),0)`);

  const weekRef = `B${row}`; // dynamic: "B4"

  row = 5;
  sheet.getRange(row, 1).setValue("Total Revenue");
  sheet.getRange(row, 2).setFormula(`=IFERROR(SUMIFS(${src}!E:E,${src}!C:C,${weekRef}),0)`);
  sheet.getRange(row, 2).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Avg Daily Revenue");
  sheet.getRange(row, 5).setFormula(`=IFERROR(AVERAGEIFS(${src}!E:E,${src}!C:C,${weekRef}),0)`);
  sheet.getRange(row, 5).setNumberFormat("$#,##0");

  row = 6;
  sheet.getRange(row, 1).setValue("Total Tips");
  sheet.getRange(row, 2).setFormula(`=IFERROR(SUMIFS(${src}!H:H,${src}!C:C,${weekRef}),0)`);
  sheet.getRange(row, 2).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Production Amount");
  sheet.getRange(row, 5).setFormula(`=IFERROR(SUMIFS(${src}!J:J,${src}!C:C,${weekRef}),0)`);
  sheet.getRange(row, 5).setNumberFormat("$#,##0");

  row = 7;
  sheet.getRange(row, 1).setValue("Total Discounts");
  sheet.getRange(row, 2).setFormula(`=IFERROR(SUMIFS(${src}!K:K,${src}!C:C,${weekRef}),0)`);
  sheet.getRange(row, 2).setNumberFormat("$#,##0");

  // ─── SECTION 3: WEEK-OVER-WEEK COMPARISON ──────────────────────────
  row = 8;
  _sectionHeader_(sheet, row, "WEEK-OVER-WEEK");

  row = 9;
  sheet.getRange(row, 1).setValue("Previous Week Ending");
  sheet.getRange(row, 2).setFormula(`=IFERROR(LARGE(UNIQUE(${src}!C2:C),2),"")`);
  sheet.getRange(row, 2).setNumberFormat("dd/MM/yyyy");

  const prevRef = `B${row}`; // dynamic: "B9"

  row = 10;
  sheet.getRange(row, 1).setValue("");
  sheet.getRange(row, 2).setValue("This Week");
  sheet.getRange(row, 3).setValue("Last Week");
  sheet.getRange(row, 4).setValue("Change");
  sheet.getRange(row, 5).setValue("% Change");
  sheet.getRange(row, 1, 1, 5).setFontWeight("bold").setBackground("#f3f3f3");

  const wowMetrics = [
    { label: "Revenue",    thisFormula: `=IFERROR(SUMIFS(${src}!E:E,${src}!C:C,${weekRef}),0)`, lastFormula: `=IFERROR(SUMIFS(${src}!E:E,${src}!C:C,${prevRef}),0)`, fmt: "$#,##0" },
    { label: "Tips",       thisFormula: `=IFERROR(SUMIFS(${src}!H:H,${src}!C:C,${weekRef}),0)`, lastFormula: `=IFERROR(SUMIFS(${src}!H:H,${src}!C:C,${prevRef}),0)`, fmt: "$#,##0" },
    { label: "Production", thisFormula: `=IFERROR(SUMIFS(${src}!J:J,${src}!C:C,${weekRef}),0)`, lastFormula: `=IFERROR(SUMIFS(${src}!J:J,${src}!C:C,${prevRef}),0)`, fmt: "$#,##0" },
    { label: "Discounts",  thisFormula: `=IFERROR(SUMIFS(${src}!K:K,${src}!C:C,${weekRef}),0)`, lastFormula: `=IFERROR(SUMIFS(${src}!K:K,${src}!C:C,${prevRef}),0)`, fmt: "$#,##0" },
  ];

  const wowStartRow = 11;
  wowMetrics.forEach((m, i) => {
    const r = wowStartRow + i;
    sheet.getRange(r, 1).setValue(m.label);
    sheet.getRange(r, 2).setFormula(m.thisFormula).setNumberFormat(m.fmt);
    sheet.getRange(r, 3).setFormula(m.lastFormula).setNumberFormat(m.fmt);
    sheet.getRange(r, 4).setFormula(`=IFERROR(B${r}-C${r},0)`).setNumberFormat(m.fmt);
    sheet.getRange(r, 5).setFormula(`=IFERROR(D${r}/C${r},0)`).setNumberFormat("+0.0%;-0.0%");
  });

  // ─── SECTION 4: DAY-OF-WEEK AVERAGES ───────────────────────────────
  row = 15;
  _sectionHeader_(sheet, row, "DAY-OF-WEEK AVERAGES (ALL TIME)");

  row = 16;
  const dowHeaders = ["Day", "Avg Revenue", "Avg Tips", "Avg Production", "Avg Discounts", "Count", "Std Dev", "13W Trend"];
  dowHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  sheet.getRange(row, 1, 1, dowHeaders.length).setFontWeight("bold").setBackground("#f3f3f3");

  const sakuraDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  sakuraDays.forEach((day, i) => {
    const r = 17 + i;
    sheet.getRange(r, 1).setValue(day);
    sheet.getRange(r, 2).setFormula(`=IFERROR(AVERAGEIFS(${src}!E:E,${src}!B:B,"${day}"),0)`).setNumberFormat("$#,##0");
    sheet.getRange(r, 3).setFormula(`=IFERROR(AVERAGEIFS(${src}!H:H,${src}!B:B,"${day}"),0)`).setNumberFormat("$#,##0");
    sheet.getRange(r, 4).setFormula(`=IFERROR(AVERAGEIFS(${src}!J:J,${src}!B:B,"${day}"),0)`).setNumberFormat("$#,##0");
    sheet.getRange(r, 5).setFormula(`=IFERROR(AVERAGEIFS(${src}!K:K,${src}!B:B,"${day}"),0)`).setNumberFormat("$#,##0");
    sheet.getRange(r, 6).setFormula(`=COUNTIF(${src}!B:B,"${day}")`).setNumberFormat("#,##0");
    // Std Dev (col G): population stddev of all revenue for this day
    sheet.getRange(r, 7).setFormula(
      `=IFERROR(STDEV(FILTER(${src}!E:E,${src}!B:B="${day}",${src}!E:E>0)),0)`
    ).setNumberFormat("$#,##0");
    // 13-week Sparkline (col H): trend of last 91 days' revenue for this day
    sheet.getRange(r, 8).setFormula(
      `=IFERROR(SPARKLINE(FILTER(${src}!E:E,${src}!B:B="${day}",${src}!A:A>=TODAY()-91),{"charttype","line";"color","#1a73e8";"linewidth",2}),"")`
    );
  });

  // ─── SECTION 5: AVERAGE WEEKLY (ALL WEEKS) ─────────────────────────
  // Average of per-week totals (not per-shift). Uses AVERAGE(QUERY(...GROUP BY C))
  // so each week contributes one value regardless of how many shifts it contains.
  row = 23;
  _sectionHeader_(sheet, row, "AVERAGE WEEKLY (ALL WEEKS)");

  row = 24;
  sheet.getRange(row, 1).setValue("Avg Weekly Net Revenue");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(AVERAGE(QUERY(${src}!A2:P,"SELECT SUM(E) WHERE C IS NOT NULL GROUP BY C LABEL SUM(E) ''")),0)`
  ).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Avg Weekly Production");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(AVERAGE(QUERY(${src}!A2:P,"SELECT SUM(J) WHERE C IS NOT NULL GROUP BY C LABEL SUM(J) ''")),0)`
  ).setNumberFormat("$#,##0");

  row = 25;
  sheet.getRange(row, 1).setValue("Avg Weekly Tips");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(AVERAGE(QUERY(${src}!A2:P,"SELECT SUM(H) WHERE C IS NOT NULL GROUP BY C LABEL SUM(H) ''")),0)`
  ).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Avg Weekly Discounts");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(AVERAGE(QUERY(${src}!A2:P,"SELECT SUM(K) WHERE C IS NOT NULL GROUP BY C LABEL SUM(K) ''")),0)`
  ).setNumberFormat("$#,##0");

  // ─── SECTION 6: WEEKLY TREND (right side) ──────────────────────────
  // Moved to col I (was H) to make room for Sparkline column in DoW Averages.
  const trendCol = 9; // Column I

  sheet.getRange(3, trendCol).setValue("WEEKLY TREND");
  sheet.getRange(3, trendCol).setFontSize(11).setFontWeight("bold").setFontColor("#1a73e8");
  sheet.getRange(3, trendCol, 1, 5).merge();

  const trendHeaders = ["Week Ending", "Revenue", "Tips", "Production", "Shifts"];
  trendHeaders.forEach((h, i) => sheet.getRange(4, trendCol + i).setValue(h));
  sheet.getRange(4, trendCol, 1, trendHeaders.length).setFontWeight("bold").setBackground("#f3f3f3");

  sheet.getRange(5, trendCol).setFormula(
    `=IFERROR(QUERY(${src}!A2:P,` +
    `"SELECT C, SUM(E), SUM(H), SUM(J), COUNT(A) ` +
    `WHERE C IS NOT NULL ` +
    `GROUP BY C ` +
    `ORDER BY C DESC ` +
    `LABEL C 'Week Ending', SUM(E) 'Revenue', SUM(H) 'Tips', SUM(J) 'Production', COUNT(A) 'Shifts'"),"")`
  );

  // Format the Week Ending column (first column of the query result) as a date
  sheet.getRange(5, trendCol, 50, 1).setNumberFormat("dd/MM/yyyy");

  // ─── FORMATTING ─────────────────────────────────────────────────────
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 120);
  sheet.setColumnWidth(6, 100);
  sheet.setColumnWidth(7, 110); // Std Dev column
  sheet.setColumnWidth(8, 140); // Sparkline column — wider for visual chart
  for (let c = trendCol; c <= trendCol + 4; c++) {
    sheet.setColumnWidth(c, 120);
  }

  // Bold labels — updated to compressed row positions
  sheet.getRange("A4:A7").setFontWeight("bold");
  sheet.getRange("D4:D7").setFontWeight("bold");
  sheet.getRange("A9:A14").setFontWeight("bold");
  sheet.getRange("A24:A25").setFontWeight("bold");
  sheet.getRange("D24:D25").setFontWeight("bold");

  // Conditional formatting: negative WoW changes in red, positive in green
  const changeRange = sheet.getRange(`D${wowStartRow}:D${wowStartRow + wowMetrics.length - 1}`);
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

  const src = ANALYTICS_CONFIG.sourceSheet;
  const tz = ANALYTICS_CONFIG.timezone;
  const now = Utilities.formatDate(new Date(), tz, "dd/MM/yyyy HH:mm");

  // ─── SECTION 1: HEADER ─────────────────────────────────────────────
  let row = 1;
  sheet.getRange(row, 1).setValue("SAKURA HOUSE — EXECUTIVE DASHBOARD");
  sheet.getRange(row, 1).setFontSize(16).setFontWeight("bold");
  sheet.getRange(row, 1, 1, 7).merge();

  row = 2;
  sheet.getRange(row, 1).setValue(`Dashboard built: ${now}  •  Data refreshes automatically`);
  sheet.getRange(row, 1).setFontSize(9).setFontColor("#666666").setFontStyle("italic");
  sheet.getRange(row, 1, 1, 7).merge();

  // ─── SECTION 2: CURRENT MONTH SNAPSHOT ──────────────────────────────
  row = 3;
  _sectionHeader_(sheet, row, "CURRENT MONTH");

  row = 4;
  sheet.getRange(row, 1).setValue("Month");
  sheet.getRange(row, 2).setFormula('=TEXT(TODAY(),"MMMM YYYY")');
  sheet.getRange(row, 2).setFontWeight("bold");

  row = 5;
  sheet.getRange(row, 1).setValue("Total Revenue");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(SUMPRODUCT((MONTH(${src}!A2:A)=MONTH(TODAY()))*(YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!E2:E),0)`
  );
  sheet.getRange(row, 2).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Shifts");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(SUMPRODUCT((MONTH(${src}!A2:A)=MONTH(TODAY()))*(YEAR(${src}!A2:A)=YEAR(TODAY()))*(${src}!A2:A<>"")*1),0)`
  );

  row = 6;
  sheet.getRange(row, 1).setValue("Avg Daily Revenue");
  sheet.getRange(row, 2).setFormula("=IFERROR(B5/E5,0)");
  sheet.getRange(row, 2).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Total Tips");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(SUMPRODUCT((MONTH(${src}!A2:A)=MONTH(TODAY()))*(YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!H2:H),0)`
  );
  sheet.getRange(row, 5).setNumberFormat("$#,##0");

  row = 7;
  sheet.getRange(row, 1).setValue("Total Production");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(SUMPRODUCT((MONTH(${src}!A2:A)=MONTH(TODAY()))*(YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!J2:J),0)`
  );
  sheet.getRange(row, 2).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("Total Discounts");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(SUMPRODUCT((MONTH(${src}!A2:A)=MONTH(TODAY()))*(YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!K2:K),0)`
  );
  sheet.getRange(row, 5).setNumberFormat("$#,##0");

  // ─── SECTION 3: MONTHLY TREND ──────────────────────────────────────
  row = 9;
  _sectionHeader_(sheet, row, "MONTHLY TREND");

  row = 10;
  const monthHeaders = ["Month", "Revenue", "Tips", "Production", "Discounts", "Cash Takings", "Shifts"];
  monthHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  sheet.getRange(row, 1, 1, monthHeaders.length).setFontWeight("bold").setBackground("#f3f3f3");

  row = 11;
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
  // Format Month column as "0000/00" so 202604 renders as "2026/04"
  sheet.getRange(11, 1, 50, 1).setNumberFormat('0000"/"00');

  // ─── SECTION 4: ROLLING 4-WEEK COMPARISON ──────────────────────────
  // MONTHLY TREND QUERY starts at row 11 and can spill up to ~12 rows (rows 11-22).
  // Row 24 gives a 1-row gap after the longest expected spill.
  row = 24;
  _sectionHeader_(sheet, row, "ROLLING 4-WEEK COMPARISON");

  row = 25;
  const weekCompHeaders = ["", "Week 1 (Latest)", "Week 2", "Week 3", "Week 4"];
  weekCompHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  sheet.getRange(row, 1, 1, weekCompHeaders.length).setFontWeight("bold").setBackground("#f3f3f3");

  const weekEndingRow = 26;
  row = weekEndingRow;
  sheet.getRange(row, 1).setValue("Week Ending");
  for (let w = 1; w <= 4; w++) {
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(LARGE(UNIQUE(${src}!C2:C),${w}),"")`);
    sheet.getRange(row, w + 1).setNumberFormat("dd/MM/yyyy");
  }

  row = 27;
  sheet.getRange(row, 1).setValue("Revenue");
  for (let w = 1; w <= 4; w++) {
    const weekCell = String.fromCharCode(65 + w) + weekEndingRow;
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(SUMIFS(${src}!E:E,${src}!C:C,${weekCell}),0)`);
    sheet.getRange(row, w + 1).setNumberFormat("$#,##0");
  }

  row = 28;
  sheet.getRange(row, 1).setValue("Tips");
  for (let w = 1; w <= 4; w++) {
    const weekCell = String.fromCharCode(65 + w) + weekEndingRow;
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(SUMIFS(${src}!H:H,${src}!C:C,${weekCell}),0)`);
    sheet.getRange(row, w + 1).setNumberFormat("$#,##0");
  }

  row = 29;
  sheet.getRange(row, 1).setValue("Production");
  for (let w = 1; w <= 4; w++) {
    const weekCell = String.fromCharCode(65 + w) + weekEndingRow;
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(SUMIFS(${src}!J:J,${src}!C:C,${weekCell}),0)`);
    sheet.getRange(row, w + 1).setNumberFormat("$#,##0");
  }

  row = 30;
  sheet.getRange(row, 1).setValue("Discounts");
  for (let w = 1; w <= 4; w++) {
    const weekCell = String.fromCharCode(65 + w) + weekEndingRow;
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(SUMIFS(${src}!K:K,${src}!C:C,${weekCell}),0)`);
    sheet.getRange(row, w + 1).setNumberFormat("$#,##0");
  }

  row = 31;
  sheet.getRange(row, 1).setValue("Shifts");
  for (let w = 1; w <= 4; w++) {
    const weekCell = String.fromCharCode(65 + w) + weekEndingRow;
    sheet.getRange(row, w + 1).setFormula(`=IFERROR(COUNTIF(${src}!C:C,${weekCell}),0)`);
  }

  // WoW change rows — reference Revenue row (27) dynamically
  const revenueRow = 27;
  row = 32;
  sheet.getRange(row, 1).setValue("Revenue WoW $");
  sheet.getRange(row, 2).setFormula(`=IFERROR(B${revenueRow}-C${revenueRow},0)`).setNumberFormat("$#,##0");
  sheet.getRange(row, 3).setFormula(`=IFERROR(C${revenueRow}-D${revenueRow},0)`).setNumberFormat("$#,##0");
  sheet.getRange(row, 4).setFormula(`=IFERROR(D${revenueRow}-E${revenueRow},0)`).setNumberFormat("$#,##0");
  sheet.getRange(row, 5).setValue("—");

  row = 33;
  sheet.getRange(row, 1).setValue("Revenue WoW %");
  sheet.getRange(row, 2).setFormula(`=IFERROR((B${revenueRow}-C${revenueRow})/C${revenueRow},0)`).setNumberFormat("+0.0%;-0.0%");
  sheet.getRange(row, 3).setFormula(`=IFERROR((C${revenueRow}-D${revenueRow})/D${revenueRow},0)`).setNumberFormat("+0.0%;-0.0%");
  sheet.getRange(row, 4).setFormula(`=IFERROR((D${revenueRow}-E${revenueRow})/E${revenueRow},0)`).setNumberFormat("+0.0%;-0.0%");
  sheet.getRange(row, 5).setValue("—");

  // ─── SECTION 4b: THIS WEEK vs 13W BASELINE ─────────────────────────
  // Flags shifts performing above/below their day-of-week 13-week average.
  // Uses MAX(C:C) as "current week" and AVERAGEIFS with TODAY()-91 window.
  row = 35;
  _sectionHeader_(sheet, row, "THIS WEEK vs 13W BASELINE");

  row = 36;
  const baseHeaders = ["Day", "This Week", "13W DoW Avg", "Diff $", "Diff %"];
  baseHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  sheet.getRange(row, 1, 1, baseHeaders.length).setFontWeight("bold").setBackground("#f3f3f3");

  const baselineDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  baselineDays.forEach((day, i) => {
    const r = 37 + i;
    sheet.getRange(r, 1).setValue(day);
    sheet.getRange(r, 2).setFormula(
      `=IFERROR(SUMIFS(${src}!E:E,${src}!B:B,"${day}",${src}!C:C,MAX(${src}!C:C)),0)`
    ).setNumberFormat("$#,##0");
    sheet.getRange(r, 3).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!E:E,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-91),0)`
    ).setNumberFormat("$#,##0");
    sheet.getRange(r, 4).setFormula(`=IFERROR(B${r}-C${r},0)`).setNumberFormat("$#,##0;[red]-$#,##0");
    sheet.getRange(r, 5).setFormula(`=IFERROR(D${r}/C${r},0)`).setNumberFormat("+0.0%;[red]-0.0%");
  });

  // ─── SECTION 5: DAY-OF-WEEK REVENUE RANKING (right side) ───────────
  const rightCol = 8; // Column H

  sheet.getRange(3, rightCol).setValue("REVENUE BY DAY (RANKED)");
  sheet.getRange(3, rightCol).setFontSize(11).setFontWeight("bold").setFontColor("#1a73e8");
  sheet.getRange(3, rightCol, 1, 5).merge();

  const dowRankHeaders = ["Day", "Avg Revenue", "Total Revenue", "Shifts", "Share"];
  dowRankHeaders.forEach((h, i) => sheet.getRange(4, rightCol + i).setValue(h));
  sheet.getRange(4, rightCol, 1, dowRankHeaders.length).setFontWeight("bold").setBackground("#f3f3f3");

  sheet.getRange(5, rightCol).setFormula(
    `=IFERROR(QUERY(${src}!A2:P,` +
    `"SELECT B, AVG(E), SUM(E), COUNT(A) ` +
    `WHERE B IS NOT NULL ` +
    `GROUP BY B ` +
    `ORDER BY AVG(E) DESC ` +
    `LABEL B 'Day', AVG(E) 'Avg Revenue', SUM(E) 'Total Revenue', COUNT(A) 'Shifts'"),"")`
  );

  // Share % column (col L, rows 6-11 = Sakura's 6 operating days).
  // J6:J11 holds Total Revenue per day from QUERY above.
  for (let r = 6; r <= 11; r++) {
    sheet.getRange(r, rightCol + 4).setFormula(
      `=IFERROR(IF(J${r}>0,REPT("▓",ROUND(J${r}/SUM($J$6:$J$11)*12,0))&" "&TEXT(J${r}/SUM($J$6:$J$11),"0%"),""),"")`
    );
  }

  // ─── SECTION 6: INSIGHTS (right side, below REVENUE BY DAY) ────────
  // Three sub-sections:
  //   - TRAJECTORY: 4-week slope, next-month forecast, recent direction
  //   - EXCEPTIONS: highest/lowest single shift this month
  //   - REPORTS:    shift count this month
  sheet.getRange(13, rightCol).setValue("═══ INSIGHTS ═══");
  sheet.getRange(13, rightCol).setFontSize(11).setFontWeight("bold").setFontColor("#1a73e8");
  sheet.getRange(13, rightCol, 1, 5).merge();

  sheet.getRange(14, rightCol).setValue("TRAJECTORY");
  sheet.getRange(14, rightCol).setFontSize(9).setFontStyle("italic").setFontColor("#666666");
  sheet.getRange(14, rightCol, 1, 5).merge();

  // 4-Week Trend: SLOPE of Sakura ROLLING 4-WEEK Revenue row (B27:E27, B=latest)
  sheet.getRange(15, rightCol).setValue("4-Week Trend");
  sheet.getRange(15, rightCol + 1).setFormula(
    `=IFERROR(TEXT(SLOPE(B27:E27,{4,3,2,1}),"$#,##0;-$#,##0")&" /wk","-")`
  );

  // Forecast Next Month: AVERAGE of last 3 months from MONTHLY TREND.
  // QUERY at row 11 uses headers=0 → label row suppressed, row 11 = most recent month.
  sheet.getRange(16, rightCol).setValue("Forecast Next Month");
  sheet.getRange(16, rightCol + 1).setFormula(
    `=IFERROR(AVERAGE(B11:B13),0)`
  ).setNumberFormat("$#,##0");

  // Last 4 Weeks direction: count up-weeks among 3 transitions
  sheet.getRange(17, rightCol).setValue("Last 4 Weeks");
  sheet.getRange(17, rightCol + 1).setFormula(
    `="Up "&(IF(B27>C27,1,0)+IF(C27>D27,1,0)+IF(D27>E27,1,0))&" of 3"`
  );

  // Exceptions subheader
  sheet.getRange(18, rightCol).setValue("EXCEPTIONS");
  sheet.getRange(18, rightCol).setFontSize(9).setFontStyle("italic").setFontColor("#666666");
  sheet.getRange(18, rightCol, 1, 5).merge();

  const monthStart = `EOMONTH(TODAY(),-1)+1`;
  const monthEnd = `EOMONTH(TODAY(),0)`;

  // Best Shift This Month (Sakura: E=NetRevenue)
  sheet.getRange(19, rightCol).setValue("Best Shift");
  sheet.getRange(19, rightCol + 1).setFormula(
    `=IFERROR(MAXIFS(${src}!E:E,${src}!A:A,">="&${monthStart},${src}!A:A,"<="&${monthEnd}),0)`
  ).setNumberFormat("$#,##0");
  sheet.getRange(19, rightCol + 2).setFormula(
    `=IFERROR(TEXT(INDEX(${src}!A:A,MATCH(I19,${src}!E:E,0)),"ddd d MMM"),"-")`
  );

  // Worst Shift This Month
  sheet.getRange(20, rightCol).setValue("Worst Shift");
  sheet.getRange(20, rightCol + 1).setFormula(
    `=IFERROR(MINIFS(${src}!E:E,${src}!A:A,">="&${monthStart},${src}!A:A,"<="&${monthEnd},${src}!E:E,">0"),0)`
  ).setNumberFormat("$#,##0");
  sheet.getRange(20, rightCol + 2).setFormula(
    `=IFERROR(TEXT(INDEX(${src}!A:A,MATCH(I20,${src}!E:E,0)),"ddd d MMM"),"-")`
  );

  // Reports Filed: references E5 (Shifts) from CURRENT MONTH section
  sheet.getRange(21, rightCol).setValue("Reports Filed");
  sheet.getRange(21, rightCol + 1).setFormula(`=E5&" shifts logged"`);

  // ─── FORMATTING ─────────────────────────────────────────────────────
  for (let c = 1; c <= 7; c++) sheet.setColumnWidth(c, c === 1 ? 160 : 130);
  for (let c = rightCol; c <= rightCol + 3; c++) sheet.setColumnWidth(c, 130);
  sheet.setColumnWidth(rightCol + 4, 170); // Share column wider for bar+%

  // Bold labels — updated to compressed row positions
  sheet.getRange("A5:A7").setFontWeight("bold");
  sheet.getRange("D5:D7").setFontWeight("bold");
  sheet.getRange("A26:A33").setFontWeight("bold");
  sheet.getRange("A37:A42").setFontWeight("bold");
  sheet.getRange("H15:H17").setFontWeight("bold");
  sheet.getRange("H19:H21").setFontWeight("bold");

  // Conditional formatting: WoW changes red/green
  const wowChangeRange = sheet.getRange("B32:D33");
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


/**
 * Helper: writes a section header row.
 */
function _sectionHeader_(sheet, row, title) {
  sheet.getRange(row, 1).setValue(title);
  sheet.getRange(row, 1).setFontSize(11).setFontWeight("bold").setFontColor("#1a73e8");
  sheet.getRange(row, 1, 1, 6).merge();
}


// ============================================================================
// M7 — EXTENDED TREND WINDOWS (Sakura)
// ============================================================================

/**
 * Appends the "Extended Trends" section to the ANALYTICS sheet.
 * Uses AVERAGEIFS/SUMIFS formulas so the section auto-updates.
 *
 * Starts at row 25, immediately after the DoW Averages section ends at row 22
 * (rows 17-22 for Mon-Sat data), with a 2-row gap.
 *
 * Sections added:
 *   - 13-week & 26-week day-of-week average revenue table (Mon-Sat)
 *   - Day-of-week revenue heatmap (green=best, red=worst)
 *   - Year-to-Date summary (total revenue, shifts, avg per shift)
 *
 * Sakura NIGHTLY_FINANCIAL columns:
 *   A=Date, B=Day, C=WeekEnding, D=MOD, E=NetRevenue, H=TotalTips
 *
 * @param {Sheet} sheet  - The ANALYTICS sheet object.
 * @param {string} src   - Source sheet name ("NIGHTLY_FINANCIAL").
 */
function buildExtendedTrends_Sakura(sheet, src) {
  // DoW averages end row 22; AVERAGE WEEKLY occupies rows 23-25; row 26 is a spacer.
  let row = 27;

  // ── Section header ───────────────────────────────────────────────────
  _sectionHeader_(sheet, row, "EXTENDED TRENDS — DAY-OF-WEEK (13W / 26W)");

  // ── Column headers ───────────────────────────────────────────────────
  row = 28;
  const etHeaders = ["Day", "13-Week Avg Rev", "26-Week Avg Rev", "13-Week Avg Tips", "26-Week Avg Tips", "Heatmap Rank"];
  etHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  sheet.getRange(row, 1, 1, etHeaders.length).setFontWeight("bold").setBackground("#f3f3f3");

  // ── Per-day rows ─────────────────────────────────────────────────────
  const sakuraDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const etDataStartRow = 29;

  sakuraDays.forEach((day, i) => {
    const r = etDataStartRow + i;
    sheet.getRange(r, 1).setValue(day);

    // 13-week avg revenue (91 days)
    sheet.getRange(r, 2).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!E:E,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-91),0)`
    ).setNumberFormat("$#,##0");

    // 26-week avg revenue (182 days)
    sheet.getRange(r, 3).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!E:E,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-182),0)`
    ).setNumberFormat("$#,##0");

    // 13-week avg tips
    sheet.getRange(r, 4).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!H:H,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-91),0)`
    ).setNumberFormat("$#,##0");

    // 26-week avg tips
    sheet.getRange(r, 5).setFormula(
      `=IFERROR(AVERAGEIFS(${src}!H:H,${src}!B:B,"${day}",${src}!A:A,">="&TODAY()-182),0)`
    ).setNumberFormat("$#,##0");

    // Rank by 13-week avg revenue (RANK: 1=highest)
    sheet.getRange(r, 6).setFormula(
      `=IFERROR(RANK(B${r},B${etDataStartRow}:B${etDataStartRow + 5},0),"")`
    );
  });

  // ── Day-of-week heatmap: colour the 13W avg revenue column green→red ──
  // Colours applied at build time from server-side AVERAGEIFS evaluation.
  // Green (#b7e1cd) = highest, Red (#c5221f) = lowest; 6 steps.
  const heatmapColors = ["#34a853", "#81c995", "#b7e1cd", "#f6aea9", "#ea4335", "#c5221f"];

  try {
    const revenueVals = sheet.getRange(etDataStartRow, 2, 6, 1).getValues().map(r => r[0]);
    if (revenueVals.some(v => v > 0)) {
      const sorted = revenueVals
        .map((v, i) => ({ v, i }))
        .sort((a, b) => b.v - a.v);
      sorted.forEach(({ i }, rank) => {
        sheet.getRange(etDataStartRow + i, 2).setBackground(heatmapColors[rank] || "#ffffff");
      });
    }
  } catch (e) {
    // Heatmap colouring is best-effort; formulas still present
    Logger.log(`Extended Trends heatmap skipped: ${e.message}`);
  }

  // ── Year to Date ─────────────────────────────────────────────────────
  row = 36;
  _sectionHeader_(sheet, row, "YEAR TO DATE");

  row = 37;
  sheet.getRange(row, 1).setValue("YTD Total Revenue");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(SUMPRODUCT((YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!E2:E),0)`
  ).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("YTD Shifts");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(SUMPRODUCT((YEAR(${src}!A2:A)=YEAR(TODAY()))*(${src}!A2:A<>"")*1),0)`
  ).setNumberFormat("#,##0");

  row = 38;
  sheet.getRange(row, 1).setValue("YTD Avg Revenue / Shift");
  sheet.getRange(row, 2).setFormula(`=IFERROR(B37/E37,0)`).setNumberFormat("$#,##0");

  sheet.getRange(row, 4).setValue("YTD Total Tips");
  sheet.getRange(row, 5).setFormula(
    `=IFERROR(SUMPRODUCT((YEAR(${src}!A2:A)=YEAR(TODAY()))*${src}!H2:H),0)`
  ).setNumberFormat("$#,##0");

  // Bold labels
  sheet.getRange("A37:A38").setFontWeight("bold");
  sheet.getRange("D37:D38").setFontWeight("bold");

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
 * Layout (rows 40+):
 *   Row 40:    4-WEEK MOVING AVERAGE header
 *   Row 41:    Current 4W MA + Prior 4W MA + Change %
 *   Row 43:    CONSISTENCY header
 *   Row 44-45: Most Consistent / Most Volatile day
 *   Row 47:    TOP 5 SHIFTS THIS MONTH header
 *   Rows 48-53: Header + 5 SORTN rows
 *   Row 55:    BOTTOM 5 SHIFTS THIS MONTH header
 *   Rows 56-61: Header + 5 SORTN rows
 *   Row 63:    OUTLIERS THIS MONTH header
 *   Rows 64-69: Header + 5 outlier rows
 *   Row 71:    RECENT DOW PATTERN header
 *   Rows 72-78: Header + 6 day rows (build-time arrows)
 *
 * Sakura NIGHTLY_FINANCIAL columns:
 *   A=Date, B=Day, C=WeekEnding, D=MOD, E=NetRevenue, H=TotalTips
 */
function buildAnalyticsExtensions_Sakura(sheet, src) {
  // ── 4-WEEK MOVING AVERAGE ─────────────────────────────────────────────
  let row = 40;
  _sectionHeader_(sheet, row, "4-WEEK MOVING AVERAGE");

  row = 41;
  // Current 4W MA: avg of latest 4 week-ending revenue totals
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

  // ── CONSISTENCY ────────────────────────────────────────────────────────
  row = 43;
  _sectionHeader_(sheet, row, "CONSISTENCY");

  // Coefficient of Variation (CV) = StdDev / Mean; lower = more consistent.
  // DoW Avg is in B17:B22, StdDev in G17:G22.
  // Use ARRAYFORMULA to compute CV vector, then INDEX/MATCH for label.
  row = 44;
  sheet.getRange(row, 1).setValue("Most Consistent Day");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(INDEX(A17:A22,MATCH(MIN(ARRAYFORMULA(IF(B17:B22>0,G17:G22/B17:B22,9))),ARRAYFORMULA(IF(B17:B22>0,G17:G22/B17:B22,9)),0))&" (±"&TEXT(MIN(ARRAYFORMULA(IF(B17:B22>0,G17:G22/B17:B22,9))),"0%")&")","-")`
  );

  row = 45;
  sheet.getRange(row, 1).setValue("Most Volatile Day");
  sheet.getRange(row, 2).setFormula(
    `=IFERROR(INDEX(A17:A22,MATCH(MAX(ARRAYFORMULA(IF(B17:B22>0,G17:G22/B17:B22,0))),ARRAYFORMULA(IF(B17:B22>0,G17:G22/B17:B22,0)),0))&" (±"&TEXT(MAX(ARRAYFORMULA(IF(B17:B22>0,G17:G22/B17:B22,0))),"0%")&")","-")`
  );

  // ── TOP 5 SHIFTS THIS MONTH ────────────────────────────────────────────
  row = 47;
  _sectionHeader_(sheet, row, "TOP 5 SHIFTS THIS MONTH");

  row = 48;
  const shiftHeaders = ["Date", "Day", "MOD", "Revenue"];
  shiftHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  sheet.getRange(row, 1, 1, shiftHeaders.length).setFontWeight("bold").setBackground("#f3f3f3");

  row = 49;
  sheet.getRange(row, 1).setFormula(
    `=IFERROR(SORTN(FILTER({${src}!A2:A,${src}!B2:B,${src}!D2:D,${src}!E2:E},MONTH(${src}!A2:A)=MONTH(TODAY()),YEAR(${src}!A2:A)=YEAR(TODAY()),${src}!E2:E>0),5,0,4,FALSE),"No shifts logged this month")`
  );
  sheet.getRange(row, 1, 5, 1).setNumberFormat("dd/MM/yyyy");
  sheet.getRange(row, 4, 5, 1).setNumberFormat("$#,##0");

  // ── BOTTOM 5 SHIFTS THIS MONTH ─────────────────────────────────────────
  row = 55;
  _sectionHeader_(sheet, row, "BOTTOM 5 SHIFTS THIS MONTH");

  row = 56;
  shiftHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  sheet.getRange(row, 1, 1, shiftHeaders.length).setFontWeight("bold").setBackground("#f3f3f3");

  row = 57;
  sheet.getRange(row, 1).setFormula(
    `=IFERROR(SORTN(FILTER({${src}!A2:A,${src}!B2:B,${src}!D2:D,${src}!E2:E},MONTH(${src}!A2:A)=MONTH(TODAY()),YEAR(${src}!A2:A)=YEAR(TODAY()),${src}!E2:E>0),5,0,4,TRUE),"No shifts logged this month")`
  );
  sheet.getRange(row, 1, 5, 1).setNumberFormat("dd/MM/yyyy");
  sheet.getRange(row, 4, 5, 1).setNumberFormat("$#,##0");

  // ── OUTLIERS THIS MONTH (vs DoW 13W Baseline) ──────────────────────────
  // Lists top 5 shifts by absolute % variance from their day-of-week average.
  // Uses A17:B22 (Day → Avg Revenue) as VLOOKUP source.
  row = 63;
  _sectionHeader_(sheet, row, "OUTLIERS THIS MONTH (vs DoW Baseline)");

  row = 64;
  const outlierHeaders = ["Date", "Day", "Revenue", "Variance %"];
  outlierHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  sheet.getRange(row, 1, 1, outlierHeaders.length).setFontWeight("bold").setBackground("#f3f3f3");

  row = 65;
  // Variance formula: (Revenue - DoW_Avg) / DoW_Avg. Filter where |variance| > 0.2.
  // 5th column carries |variance| for sorting; only 4 cols displayed (the 5th overflows
  // into col E but is hidden by formatting).
  const variance = `IFERROR((${src}!E2:E-VLOOKUP(${src}!B2:B,$A$17:$B$22,2,FALSE))/VLOOKUP(${src}!B2:B,$A$17:$B$22,2,FALSE),0)`;
  sheet.getRange(row, 1).setFormula(
    `=IFERROR(SORTN(FILTER({${src}!A2:A,${src}!B2:B,${src}!E2:E,${variance},ABS(${variance})},MONTH(${src}!A2:A)=MONTH(TODAY()),YEAR(${src}!A2:A)=YEAR(TODAY()),${src}!E2:E>0,ABS(${variance})>0.2),5,0,5,FALSE),"No outliers detected this month (>20% variance)")`
  );
  sheet.getRange(row, 1, 5, 1).setNumberFormat("dd/MM/yyyy");
  sheet.getRange(row, 3, 5, 1).setNumberFormat("$#,##0");
  sheet.getRange(row, 4, 5, 1).setNumberFormat("+0.0%;[red]-0.0%");
  // Hide the 5th column (|variance| sort key) by clearing its values' display
  sheet.getRange(row, 5, 5, 1).setFontColor("#ffffff");

  // ── RECENT DOW PATTERN (build-time arrows) ─────────────────────────────
  // For each day, show the last 4 occurrences as ↑/↓ vs DoW average.
  row = 71;
  _sectionHeader_(sheet, row, "RECENT DOW PATTERN (vs DoW Avg)");

  row = 72;
  const recentDowHeaders = ["Day", "Last 4 Pattern", "Above Baseline"];
  recentDowHeaders.forEach((h, i) => sheet.getRange(row, i + 1).setValue(h));
  sheet.getRange(row, 1, 1, recentDowHeaders.length).setFontWeight("bold").setBackground("#f3f3f3");

  // Read warehouse data for build-time computation
  try {
    const ss = sheet.getParent();
    const srcSheet = ss.getSheetByName(src);
    const lastRow = srcSheet.getLastRow();
    if (lastRow >= 2) {
      const data = srcSheet.getRange(2, 1, lastRow - 1, 5).getValues(); // A=Date, B=Day, E=NetRev
      const dowDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      dowDays.forEach((day, idx) => {
        const r = 73 + idx;
        sheet.getRange(r, 1).setValue(day);

        // Get all shifts for this day, sorted by date desc; take last 4
        const dayShifts = data
          .filter(row => row[1] === day && row[4] > 0)
          .sort((a, b) => new Date(b[0]) - new Date(a[0]))
          .slice(0, 4);

        if (dayShifts.length === 0) {
          sheet.getRange(r, 2).setValue("—");
          sheet.getRange(r, 3).setValue("—");
          return;
        }

        const dayAvg = data
          .filter(row => row[1] === day && row[4] > 0)
          .reduce((sum, row) => sum + row[4], 0) / Math.max(1, data.filter(row => row[1] === day && row[4] > 0).length);

        // Build arrow pattern (oldest → newest, left to right)
        const arrows = dayShifts.reverse().map(row => row[4] >= dayAvg ? "↑" : "↓").join("");
        const aboveCount = dayShifts.filter(row => row[4] >= dayAvg).length;

        sheet.getRange(r, 2).setValue(arrows);
        sheet.getRange(r, 2).setFontSize(14);
        sheet.getRange(r, 3).setValue(`${aboveCount} of ${dayShifts.length}`);
      });
    }
  } catch (e) {
    Logger.log(`Recent DoW pattern build skipped: ${e.message}`);
  }

  // Bold labels for new sections
  sheet.getRange("A41:A41").setFontWeight("bold");
  sheet.getRange("C41:C41").setFontWeight("bold");
  sheet.getRange("E41:E41").setFontWeight("bold");
  sheet.getRange("A44:A45").setFontWeight("bold");
  sheet.getRange("A73:A78").setFontWeight("bold");

  Logger.log("M8 Analytics Extensions section built for Sakura.");
}
