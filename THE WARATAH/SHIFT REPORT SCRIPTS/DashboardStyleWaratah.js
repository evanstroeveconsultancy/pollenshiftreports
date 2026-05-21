/**
 * DashboardStyleWaratah.js
 *
 * Centralised design tokens + reusable styling helpers for the Waratah
 * Executive and Analytics dashboards. Every dashboard builder MUST go
 * through these helpers — never inline setFontSize/setBackground/setBorder
 * for dashboard cells.
 *
 * Sister file: SAKURA HOUSE/SHIFT REPORT SCRIPTS/DashboardStyleSakura.gs
 * Both files MUST stay in sync — same STYLE values, same helper signatures.
 *
 * Design system: see docs/plans/2026-05-21-dashboard-ui-redesign.md
 */

const STYLE = {
  font: {
    family: 'Roboto',
    hero: 28,        // Single big metric (CURRENT MONTH revenue, THIS WEEK revenue)
    metric: 18,      // Sub-metrics inside hero cards
    section: 11,     // Section titles (UPPERCASE)
    body: 10,        // Table data, labels
    label: 9         // Caption labels (UPPERCASE)
  },
  colour: {
    ink:            '#1a1a1a',  // Primary text
    inkMuted:       '#6b6b6b',  // Labels, secondary text
    good:           '#2f5d3a',  // Positive deltas, above-baseline, section titles
    bad:            '#b5533c',  // Negative deltas, below-baseline
    neutral:        '#8a8a7a',  // At-baseline, in-range
    cardFill:       '#f5f5f2',  // Hero card background
    cardFillHeader: '#eae8de',  // Hero card title bar
    rule:           '#d8d6ce',  // Hairlines, borders
    sand:           '#d6cfa8'   // Reserved accent (YTD, benchmarks — sparingly)
  },
  row: {
    section: 24,     // Section title row height (px)
    body: 20,        // Standard body row
    hero: 48,        // Hero metric row — lets 28pt number breathe
    spacer: 8        // Spacer row between sections
  },
  col: {
    A: 110, B: 120, C: 100, D: 100, E: 140, F: 140, G: 80, H: 80, I: 120
  }
};

/**
 * Style a "hero card" — filled background with title bar at top, hero metric
 * below, optional sublabel underneath. Used for CURRENT MONTH, THIS WEEK,
 * REVENUE BY DAY, THIS WEEK vs 13W BASE.
 *
 * @param {Sheet} sheet
 * @param {string} titleCell e.g. 'B3'  (single cell — title bar)
 * @param {string|null} valueCell e.g. 'B5'  (single cell — hero number, or null for table-style cards)
 * @param {string|null} sublabelCell e.g. 'B6'  (single cell — small caption, optional)
 * @param {string} cardRange e.g. 'B3:D7'  (full bounding range for border)
 * @param {string} title  e.g. 'CURRENT MONTH'
 */
function applyHeroCard_(sheet, titleCell, valueCell, sublabelCell, cardRange, title) {
  var card = sheet.getRange(cardRange);
  card.setBackground(STYLE.colour.cardFill)
      .setBorder(true, true, true, true, false, false,
                 STYLE.colour.rule, SpreadsheetApp.BorderStyle.SOLID);

  var titleR = sheet.getRange(titleCell);
  titleR.setValue(title)
        .setFontFamily(STYLE.font.family)
        .setFontSize(STYLE.font.section)
        .setFontWeight('bold')
        .setFontColor(STYLE.colour.good)
        .setBackground(STYLE.colour.cardFillHeader)
        .setHorizontalAlignment('left')
        .setVerticalAlignment('middle');

  if (valueCell) {
    var valueR = sheet.getRange(valueCell);
    valueR.setFontFamily(STYLE.font.family)
          .setFontSize(STYLE.font.hero)
          .setFontWeight('bold')
          .setFontColor(STYLE.colour.ink)
          .setHorizontalAlignment('left')
          .setVerticalAlignment('middle');
  }

  if (sublabelCell) {
    var subR = sheet.getRange(sublabelCell);
    subR.setFontFamily(STYLE.font.family)
        .setFontSize(STYLE.font.label)
        .setFontColor(STYLE.colour.inkMuted)
        .setHorizontalAlignment('left');
  }
}

/**
 * Style a "hairline section" — no fill, just a thin top border + section title.
 * Used for MONTHLY TREND, ROLLING 4-WEEK, INSIGHTS, DAY-OF-WEEK AVERAGES,
 * EXTENDED TRENDS, AVERAGE WEEKLY, TOP/BOTTOM 5 SHIFTS, etc.
 *
 * @param {Sheet} sheet
 * @param {string} titleCell e.g. 'A9'
 * @param {string} title e.g. 'MONTHLY TREND'
 */
function applyHairlineSection_(sheet, titleCell, title) {
  var titleR = sheet.getRange(titleCell);
  titleR.setValue(title)
        .setFontFamily(STYLE.font.family)
        .setFontSize(STYLE.font.section)
        .setFontWeight('bold')
        .setFontColor(STYLE.colour.good)
        .setHorizontalAlignment('left')
        .setVerticalAlignment('middle')
        .setBorder(true, false, false, false, false, false,
                   STYLE.colour.rule, SpreadsheetApp.BorderStyle.SOLID);
}

/**
 * Style a table header row. Uppercase, 9pt, muted ink, bottom border only.
 *
 * @param {Sheet} sheet
 * @param {string} headerRange e.g. 'A11:D11'
 */
function applyTableHeader_(sheet, headerRange) {
  sheet.getRange(headerRange)
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.label)
       .setFontWeight('bold')
       .setFontColor(STYLE.colour.inkMuted)
       .setHorizontalAlignment('left')
       .setVerticalAlignment('middle')
       .setBorder(false, false, true, false, false, false,
                  STYLE.colour.rule, SpreadsheetApp.BorderStyle.SOLID);
}

/**
 * Style a table body range. 10pt regular, ink colour, vertically centred.
 *
 * @param {Sheet} sheet
 * @param {string} bodyRange e.g. 'A12:D22'
 */
function applyTableBody_(sheet, bodyRange) {
  sheet.getRange(bodyRange)
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.body)
       .setFontColor(STYLE.colour.ink)
       .setVerticalAlignment('middle');
}

/**
 * Apply delta colour to a single cell based on its numeric value.
 * Positive → good (green), negative → bad (terracotta), zero/null → neutral.
 * Caller is responsible for the value itself (formula or number).
 *
 * @param {Sheet} sheet
 * @param {string} cell e.g. 'D12'
 * @param {number} deltaValue
 */
function applyDeltaCell_(sheet, cell, deltaValue) {
  var colour = STYLE.colour.neutral;
  if (typeof deltaValue === 'number' && !isNaN(deltaValue)) {
    if (deltaValue > 0) colour = STYLE.colour.good;
    else if (deltaValue < 0) colour = STYLE.colour.bad;
  }
  sheet.getRange(cell)
       .setFontFamily(STYLE.font.family)
       .setFontSize(STYLE.font.body)
       .setFontWeight('bold')
       .setFontColor(colour);
}

/**
 * Apply the standardised column widths from STYLE.col to a sheet.
 * Call once per dashboard build, after sheet creation.
 *
 * @param {Sheet} sheet
 */
function applyColumnWidths_(sheet) {
  var map = STYLE.col;
  Object.keys(map).forEach(function (letter) {
    var colIndex = letter.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    sheet.setColumnWidth(colIndex, map[letter]);
  });
}

/**
 * Apply the standardised row height for a single row.
 *
 * @param {Sheet} sheet
 * @param {number} row 1-indexed
 * @param {string} kind 'section' | 'body' | 'hero' | 'spacer'
 */
function applyRowHeight_(sheet, row, kind) {
  sheet.setRowHeight(row, STYLE.row[kind]);
}
