# Dashboard UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply a unified "modern dashboard" visual system (Roboto 4-size scale, botanical palette, hybrid filled-card + hairline framing) to all four dashboards (Waratah Executive + Analytics, Sakura Executive + Analytics) so they feel like one polished product with clear information hierarchy.

**Architecture:** Centralise all visual constants and reusable styling helpers in a single `DashboardStyle<Venue>.{js,gs}` file per venue. Refactor existing builders (`buildExecutiveDashboard`, `buildFinancialDashboard`, `buildExtendedTrends_*`, `buildAnalyticsExtensions_*`) to call helpers instead of inlining `setFontSize/setBackground/setBorder`. No data, schema, or formula logic changes — pure styling refactor. Waratah first; cross-merge to Sakura once helpers are proven.

**Tech Stack:** Google Apps Script (V8). No new dependencies. Roboto font (already available in Sheets). No tests — verification is `rebuildAllDashboards()` → visual eyeball → screenshot.

**Branch:** `waratah/dashboard-ui-redesign` (already checked out).

**Verification loop for every task:**
1. Edit the file
2. `clasp push` from the relevant venue directory (or instruct user to run it)
3. User runs `Waratah Tools → Admin Tools → Integrations & Analytics → Rebuild All Dashboards (Admin)` (or Sakura equivalent)
4. User confirms the change visually
5. Commit

**Rollback policy:** Every task is one commit. If any task produces a visual regression that can't be resolved in-place, `git revert <hash>` of that task and re-plan.

---

## Phase 0: Design tokens

### Task 0.1: Create `DashboardStyleWaratah.js` with the STYLE constant

**Files:**
- Create: `THE WARATAH/SHIFT REPORT SCRIPTS/DashboardStyleWaratah.js`

**Step 1: Create the file**

```javascript
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
    ink:            '#1A1A1A',  // Primary text
    inkMuted:       '#6B6B6B',  // Labels, secondary text
    good:           '#2F5D3A',  // Positive deltas, above-baseline, section titles
    bad:            '#B5533C',  // Negative deltas, below-baseline
    neutral:        '#8A8A7A',  // At-baseline, in-range
    cardFill:       '#F5F5F2',  // Hero card background
    cardFillHeader: '#EAE8DE',  // Hero card title bar
    rule:           '#D8D6CE',  // Hairlines, borders
    sand:           '#D6CFA8'   // Reserved accent (YTD, benchmarks — sparingly)
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
```

**Step 2: Save, then `clasp push` from `THE WARATAH/SHIFT REPORT SCRIPTS/`**

Expected: `Pushed N files.` — file count goes up by 1 to 24.

**Step 3: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/DashboardStyleWaratah.js"
git commit -m "feat(waratah): add DashboardStyleWaratah design tokens"
```

---

### Task 0.2: Add helper functions to `DashboardStyleWaratah.js`

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/DashboardStyleWaratah.js` (append after STYLE)

**Step 1: Append helpers**

```javascript
/**
 * Style a "hero card" — filled background with title bar at top, hero metric
 * below, optional sublabel underneath. Used for CURRENT MONTH, THIS WEEK,
 * REVENUE BY DAY, THIS WEEK vs 13W BASE.
 *
 * @param {Sheet} sheet
 * @param {string} titleCell e.g. 'B3'  (single cell — title bar)
 * @param {string} valueCell e.g. 'B5'  (single cell — hero number)
 * @param {string} sublabelCell e.g. 'B6'  (single cell — small caption, optional)
 * @param {string} cardRange e.g. 'B3:D7'  (full bounding range for border)
 * @param {string} title  e.g. 'CURRENT MONTH'
 */
function applyHeroCard_(sheet, titleCell, valueCell, sublabelCell, cardRange, title) {
  const card = sheet.getRange(cardRange);
  card.setBackground(STYLE.colour.cardFill)
      .setBorder(true, true, true, true, false, false,
                 STYLE.colour.rule, SpreadsheetApp.BorderStyle.SOLID);

  const titleR = sheet.getRange(titleCell);
  titleR.setValue(title)
        .setFontFamily(STYLE.font.family)
        .setFontSize(STYLE.font.section)
        .setFontWeight('bold')
        .setFontColor(STYLE.colour.good)
        .setBackground(STYLE.colour.cardFillHeader)
        .setHorizontalAlignment('left')
        .setVerticalAlignment('middle');

  const valueR = sheet.getRange(valueCell);
  valueR.setFontFamily(STYLE.font.family)
        .setFontSize(STYLE.font.hero)
        .setFontWeight('bold')
        .setFontColor(STYLE.colour.ink)
        .setHorizontalAlignment('left')
        .setVerticalAlignment('middle');

  if (sublabelCell) {
    const subR = sheet.getRange(sublabelCell);
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
  const titleR = sheet.getRange(titleCell);
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
  let colour = STYLE.colour.neutral;
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
  const map = STYLE.col;
  Object.keys(map).forEach(function (letter) {
    const colIndex = letter.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
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
```

**Step 2: `clasp push`, then in Apps Script editor run a sanity check** — paste this one-liner in the editor and run:

```javascript
function _styleSanityCheck() { Logger.log(STYLE.colour.good); }
```

Expected log: `#2F5D3A`. Confirms STYLE is in scope and helpers loaded.

**Step 3: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/DashboardStyleWaratah.js"
git commit -m "feat(waratah): add dashboard styling helpers (hero card, hairline, table, delta)"
```

---

## Phase 1: Waratah Executive Dashboard

### Task 1.1: Read current `buildExecutiveDashboard` and identify styling call sites

**Files:**
- Read: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js`

**Step 1: Open the file and locate `buildExecutiveDashboard()`. List every line that calls:**
- `setFontSize`, `setFontWeight`, `setFontColor`, `setFontFamily`
- `setBackground`, `setBorder`
- `setHorizontalAlignment`, `setVerticalAlignment`
- `setRowHeight`, `setColumnWidth`

**Step 2: Produce a short report (in chat, not committed) listing each call site with its line number. This is the map of what needs to be replaced with helper calls. No code change in this task.**

**Step 3: No commit.**

---

### Task 1.2: Refactor CURRENT MONTH section to `applyHeroCard_`

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js` (CURRENT MONTH block inside `buildExecutiveDashboard`)

**Step 1: Replace inline styling for CURRENT MONTH (rows 3–7, columns B–D) with a single `applyHeroCard_()` call.**

Current pattern (illustrative — exact lines from Task 1.1 report):
```javascript
sheet.getRange('B3').setValue('CURRENT MONTH').setFontWeight('bold')...
sheet.getRange('B5').setFontSize(20).setFontWeight('bold')...
```

Becomes:
```javascript
applyHeroCard_(sheet, 'B3', 'B5', 'B6', 'B3:D7', 'CURRENT MONTH');
sheet.getRange('B5').setNumberFormat('$#,##0');   // value/format stays
sheet.getRange('B6').setValue('XX shifts · $X,XXX/shift'); // sublabel content stays
applyRowHeight_(sheet, 5, 'hero');
```

**Step 2: `clasp push` and rebuild dashboards (`Waratah Tools → Admin Tools → Integrations & Analytics → Rebuild All Dashboards (Admin)`).**

**Step 3: Visual verify — CURRENT MONTH card should now have:**
- Light grey fill (`#F5F5F2`) across B3:D7
- Slightly darker title bar at B3 with "CURRENT MONTH" in 11pt bold green uppercase
- Revenue number in B5 at 28pt Roboto bold
- Sublabel in B6 at 9pt muted grey

**Step 4: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "refactor(waratah): apply hero card style to CURRENT MONTH section"
```

---

### Task 1.3: Refactor REVENUE BY DAY section to hero card style

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js`

**Step 1: REVENUE BY DAY sits in the right column (around F3:I7 — confirm exact range from Task 1.1 report). Apply `applyHeroCard_` for title + container, then `applyTableBody_` for the 5 day rows, and ensure the in-cell SPARKLINE bars use `STYLE.colour.good`.**

```javascript
applyHeroCard_(sheet, 'F3', null, null, 'F3:I8', 'REVENUE BY DAY');
applyTableBody_(sheet, 'F4:I8');  // 5 Waratah days (Wed-Sun)
// SPARKLINE formula already exists; if hardcoded colour, replace with STYLE.colour.good
```

**Note:** `applyHeroCard_` accepts `null` for valueCell/sublabelCell when the card is a table-style hero (no big single number).

**Step 2: Confirm `applyHeroCard_` handles null gracefully. If not, add null guards in Task 0.2's helper before this task.**

**Step 3: `clasp push` → rebuild → visual verify.**

**Step 4: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js" \
        "THE WARATAH/SHIFT REPORT SCRIPTS/DashboardStyleWaratah.js"
git commit -m "refactor(waratah): apply hero card style to REVENUE BY DAY"
```

---

### Task 1.4: Refactor MONTHLY TREND section to hairline style

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js`

**Step 1: MONTHLY TREND (around rows 9–22, columns A–D). Apply hairline + table header + table body:**

```javascript
applyHairlineSection_(sheet, 'A9', 'MONTHLY TREND');
applyTableHeader_(sheet, 'A10:D10');
applyTableBody_(sheet, 'A11:D22');
applyRowHeight_(sheet, 9, 'section');
```

**Step 2: Confirm the QUERY formula in the body cell is untouched (we only restyle, not rewrite formulas).**

**Step 3: `clasp push` → rebuild → visual verify:**
- No fill on MONTHLY TREND
- Thin grey rule above "MONTHLY TREND" title
- Title in 11pt bold green uppercase
- Header row underlined, 9pt muted
- Body rows in 10pt Roboto

**Step 4: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "refactor(waratah): apply hairline style to MONTHLY TREND"
```

---

### Task 1.5: Refactor THIS WEEK vs 13W BASE to hero card style

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js`

**Step 1: This block (added May 21) shows Net Rev / Card Tips / Cash Tips against 13W baseline with deltas. Apply hero card framing for the container, then `applyDeltaCell_` for each delta cell.**

```javascript
applyHeroCard_(sheet, 'F9', null, null, 'F9:I14', 'THIS WEEK vs 13W BASELINE');
applyTableBody_(sheet, 'F10:I14');
// For each delta cell (e.g. H11, H12, H13), read the value and apply delta colour:
const deltaCells = ['H11', 'H12', 'H13'];
deltaCells.forEach(function (c) {
  const v = sheet.getRange(c).getValue();
  applyDeltaCell_(sheet, c, typeof v === 'number' ? v : null);
});
```

**Step 2: `clasp push` → rebuild → visual verify:**
- Filled card around F9:I14
- Title bar at F9
- Delta cells coloured green for positive, terracotta for negative, neutral grey for ~zero
- Arrow glyphs (▲▼●) preserved from existing build code

**Step 3: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "refactor(waratah): apply hero card + delta cells to THIS WEEK vs 13W BASE"
```

---

### Task 1.6: Refactor ROLLING 4-WEEK section to hairline style

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js`

**Step 1: ROLLING 4-WEEK section (left column, around row 24+). Apply hairline + table styling. Confirm 4-Week Trend formula (`=TEXT(SLOPE(...))`) and Forecast formula (`=AVERAGE(B13:B15)`) stay untouched — these were fixed earlier today, must not regress.**

```javascript
applyHairlineSection_(sheet, 'A24', 'ROLLING 4-WEEK');
applyTableHeader_(sheet, 'A25:D25');
applyTableBody_(sheet, 'A26:D29');
applyRowHeight_(sheet, 24, 'section');
```

**Step 2: `clasp push` → rebuild → visual verify ROLLING 4-WEEK looks consistent with MONTHLY TREND.**

**Step 3: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "refactor(waratah): apply hairline style to ROLLING 4-WEEK"
```

---

### Task 1.7: Refactor INSIGHTS section to hairline style

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js`

**Step 1: INSIGHTS sits in the right column around F24+. Apply hairline + ensure the 3–4 generated insight rows use `applyTableBody_` styling. INSIGHTS lines may include emphasis words (good/bad) — leave any inline colour the builder already applies (the helper sets defaults, callers can override per-cell after).**

```javascript
applyHairlineSection_(sheet, 'F24', 'INSIGHTS');
applyTableBody_(sheet, 'F25:I28');
applyRowHeight_(sheet, 24, 'section');
```

**Step 2: `clasp push` → rebuild → visual verify INSIGHTS reads cleanly, no fills, hairline rule above.**

**Step 3: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "refactor(waratah): apply hairline style to INSIGHTS"
```

---

### Task 1.8: Apply column widths + page header for Waratah Executive

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js` (start of `buildExecutiveDashboard`)

**Step 1: At the very top of `buildExecutiveDashboard`, after `sheet` is obtained, add:**

```javascript
applyColumnWidths_(sheet);

// Page header
sheet.getRange('A1')
     .setValue('WARATAH · EXECUTIVE DASHBOARD')
     .setFontFamily(STYLE.font.family)
     .setFontSize(STYLE.font.metric)
     .setFontWeight('bold')
     .setFontColor(STYLE.colour.ink);
sheet.getRange('I1')
     .setValue('Last updated: ' + Utilities.formatDate(new Date(), 'Australia/Sydney', 'd MMM yyyy h:mm a'))
     .setFontFamily(STYLE.font.family)
     .setFontSize(STYLE.font.label)
     .setFontColor(STYLE.colour.inkMuted)
     .setHorizontalAlignment('right');
applyRowHeight_(sheet, 1, 'section');
applyRowHeight_(sheet, 2, 'spacer');
```

**Step 2: `clasp push` → rebuild → visual verify:**
- Column widths consistent (A=110, B=120, … I=120)
- Page header at row 1 reads "WARATAH · EXECUTIVE DASHBOARD" left, timestamp right
- Row 2 is a thin spacer

**Step 3: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "feat(waratah): add page header + standardised column widths to Executive Dashboard"
```

---

### Task 1.9: Full Waratah Executive visual review + screenshot

**Step 1: Rebuild dashboards. Open the EXECUTIVE_DASHBOARD tab in the Waratah shift report sheet.**

**Step 2: Verify against the design (Section 2 of the brainstorm):**
- ✅ Page header row 1
- ✅ CURRENT MONTH hero card (B3:D7) with 28pt revenue
- ✅ REVENUE BY DAY hero card (F3:I8) with 5 days + sparkline bars
- ✅ MONTHLY TREND hairline (rows 9–22)
- ✅ THIS WEEK vs 13W BASE hero card (F9:I14) with coloured deltas
- ✅ ROLLING 4-WEEK hairline (rows 24+)
- ✅ INSIGHTS hairline (F24+)
- ✅ Single font family throughout (Roboto)
- ✅ Only two fills used (card body + card title bar)
- ✅ Hairlines `#D8D6CE`, section titles `#2F5D3A`

**Step 3: Take a screenshot, save to `.full-review/waratah-executive-redesign-2026-05-21.png` (already in .gitignore).**

**Step 4: If anything off, fix in a follow-up commit before moving to Phase 2.**

**Step 5: Commit (only if fixes were made; otherwise skip)**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "fix(waratah): Executive Dashboard visual polish pass"
```

---

## Phase 2: Waratah Analytics Dashboard

### Task 2.1: Refactor THIS WEEK hero block

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js` (inside `buildFinancialDashboard`)

**Step 1: THIS WEEK (rows 3–7). Use `applyHeroCard_`:**

```javascript
applyHeroCard_(sheet, 'A3', 'B5', 'B6', 'A3:D7', 'THIS WEEK');
sheet.getRange('B5').setNumberFormat('$#,##0');
sheet.getRange('B6').setValue(/* existing 'vs last week ▲ +X%' formula */);
applyRowHeight_(sheet, 5, 'hero');
```

**Step 2: Apply `applyDeltaCell_` to the WoW delta cell using its current value.**

**Step 3: `clasp push` → rebuild → visual verify.**

**Step 4: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "refactor(waratah): apply hero card to Analytics THIS WEEK"
```

---

### Task 2.2: Refactor WEEK-ON-WEEK section (hairline + table)

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js`

**Step 1: WEEK-ON-WEEK (rows 9–13). Hairline style, table treatment:**

```javascript
applyHairlineSection_(sheet, 'A9', 'WEEK-ON-WEEK');
applyTableHeader_(sheet, 'A10:D10');
applyTableBody_(sheet, 'A11:D13');
applyRowHeight_(sheet, 9, 'section');
// Apply delta colours to D11:D13
['D11', 'D12', 'D13'].forEach(function (c) {
  const v = sheet.getRange(c).getValue();
  applyDeltaCell_(sheet, c, typeof v === 'number' ? v : null);
});
```

**Step 2: `clasp push` → rebuild → verify deltas colour correctly.**

**Step 3: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "refactor(waratah): apply hairline + deltas to WEEK-ON-WEEK"
```

---

### Task 2.3: Refactor DAY-OF-WEEK AVERAGES section + sparkline column

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js`

**Step 1: DoW table (rows 15–22 area, 5 Waratah days Wed-Sun + headers). Hairline + table, then ensure col I sparklines use `STYLE.colour.good`:**

```javascript
applyHairlineSection_(sheet, 'A15', 'DAY-OF-WEEK AVERAGES');
applyTableHeader_(sheet, 'A16:I16');
applyTableBody_(sheet, 'A17:I22');  // 5 days + 1 header = adjust to actual Waratah rows
applyRowHeight_(sheet, 15, 'section');
```

**Step 2: Inside the SPARKLINE formula generator (col I), replace any hardcoded colour with `STYLE.colour.good` (e.g. `"color1","#2F5D3A"`). If colour is currently inline, change to:**

```javascript
const sparkCol = '"color1","' + STYLE.colour.good + '"';
// formula = '=SPARKLINE(... , {"charttype","column";' + sparkCol + ';"empty","zero"})'
```

**Step 3: `clasp push` → rebuild → visual verify the DoW table aligns and sparklines render in green.**

**Step 4: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "refactor(waratah): apply hairline style + STYLE colour to DoW Averages"
```

---

### Task 2.4: Refactor EXTENDED TRENDS heatmap

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js` (inside `buildExtendedTrends_Waratah`)

**Step 1: Add hairline section title at the start of the Extended Trends block (current row ~27 in Waratah post-May 21 layout). Replace any hardcoded heatmap gradient endpoints (`#FFFFFF` → `#2F5D3A`) with STYLE colours.**

```javascript
applyHairlineSection_(sheet, 'A27', 'EXTENDED TRENDS');
applyRowHeight_(sheet, 27, 'section');
// In the conditional formatting builder for the heatmap, swap any hex literals:
// fromValue: STYLE.colour.cardFill   (was '#FFFFFF')
// toValue:   STYLE.colour.good       (was a brighter green)
```

**Step 2: Check `buildExtendedTrends_Waratah` for any `ConditionalFormatRuleBuilder().setGradient...` calls and update colours there.**

**Step 3: `clasp push` → rebuild → visual verify heatmap reads cool-to-warm using cardFill → good.**

**Step 4: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "refactor(waratah): apply STYLE colours to EXTENDED TRENDS heatmap"
```

---

### Task 2.5: Refactor AVERAGE WEEKLY + YTD section

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js`

**Step 1: AVERAGE WEEKLY (rows 32–34) and YTD (rows 36–38 — bumped May 21 from 39–41 fix). Hairline style. YTD label cells get `STYLE.colour.sand` background as the reserved accent.**

```javascript
applyHairlineSection_(sheet, 'A32', 'AVERAGE WEEKLY');
applyTableBody_(sheet, 'A33:D34');
applyHairlineSection_(sheet, 'A36', 'YEAR-TO-DATE');
applyTableBody_(sheet, 'A37:D38');
// Sand accent on YTD label cells
sheet.getRange('A37:A38').setBackground(STYLE.colour.sand);
```

**Step 2: `clasp push` → rebuild → visual verify sand-coloured YTD label cells stand out without being garish.**

**Step 3: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "refactor(waratah): apply hairline + sand accent to AVERAGE WEEKLY + YTD"
```

---

### Task 2.6: Refactor TOP 5 / BOTTOM 5 SHIFTS (M8 block)

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js` (inside `buildAnalyticsExtensions_Waratah`)

**Step 1: TOP 5 (left, ~row 45) and BOTTOM 5 (right, ~row 45). Mirrored hairline blocks. Rank numbers coloured `good` for top, `bad` for bottom. SORTN formulas untouched.**

```javascript
applyHairlineSection_(sheet, 'A45', 'TOP 5 SHIFTS');
applyTableHeader_(sheet, 'A46:D46');
applyTableBody_(sheet, 'A47:D51');
sheet.getRange('A47:A51')
     .setFontWeight('bold')
     .setFontColor(STYLE.colour.good);

applyHairlineSection_(sheet, 'F45', 'BOTTOM 5 SHIFTS');
applyTableHeader_(sheet, 'F46:I46');
applyTableBody_(sheet, 'F47:I51');
sheet.getRange('F47:F51')
     .setFontWeight('bold')
     .setFontColor(STYLE.colour.bad);
```

**Step 2: `clasp push` → rebuild → visual verify Top 5 ranks green, Bottom 5 ranks terracotta.**

**Step 3: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "refactor(waratah): apply hairline + ranked accents to TOP/BOTTOM 5 SHIFTS"
```

---

### Task 2.7: Refactor OUTLIERS vs DoW BASELINE + RECENT DoW PATTERN

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js` (inside `buildAnalyticsExtensions_Waratah`)

**Step 1: Two mirrored hairline blocks around row 53+. Outliers (left) uses delta colours on the deviation column. Recent DoW Pattern (right) uses arrows ↗ ↘ → with delta colours.**

```javascript
applyHairlineSection_(sheet, 'A53', 'OUTLIERS vs DoW BASELINE');
applyTableHeader_(sheet, 'A54:D54');
applyTableBody_(sheet, 'A55:D60');
// Apply delta colour to deviation column (D55:D60) — read values, apply per cell.

applyHairlineSection_(sheet, 'F53', 'RECENT DoW PATTERN');
applyTableHeader_(sheet, 'F54:I54');
applyTableBody_(sheet, 'F55:I60');
// Arrow column (e.g. H) — apply delta colour based on the underlying numeric value.
```

**Step 2: `clasp push` → rebuild → verify both blocks align, deltas colour correctly.**

**Step 3: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "refactor(waratah): apply hairline + deltas to OUTLIERS + RECENT DoW PATTERN"
```

---

### Task 2.8: Page header + column widths for Waratah Analytics

**Files:**
- Modify: `THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js` (start of `buildFinancialDashboard`)

**Step 1: Same pattern as Task 1.8 but for Analytics:**

```javascript
applyColumnWidths_(sheet);
sheet.getRange('A1')
     .setValue('WARATAH · ANALYTICS DASHBOARD')
     .setFontFamily(STYLE.font.family)
     .setFontSize(STYLE.font.metric)
     .setFontWeight('bold')
     .setFontColor(STYLE.colour.ink);
sheet.getRange('I1')
     .setValue('Last updated: ' + Utilities.formatDate(new Date(), 'Australia/Sydney', 'd MMM yyyy h:mm a'))
     .setFontFamily(STYLE.font.family)
     .setFontSize(STYLE.font.label)
     .setFontColor(STYLE.colour.inkMuted)
     .setHorizontalAlignment('right');
applyRowHeight_(sheet, 1, 'section');
applyRowHeight_(sheet, 2, 'spacer');
```

**Step 2: `clasp push` → rebuild → verify Analytics page header matches Executive.**

**Step 3: Commit**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "feat(waratah): add page header + column widths to Analytics Dashboard"
```

---

### Task 2.9: Full Waratah Analytics visual review

**Step 1: Rebuild dashboards. Open ANALYTICS tab.**

**Step 2: Verify against design Section 3 of the brainstorm. All 8 sections present, hierarchy clear, only THIS WEEK is filled, everything else hairline.**

**Step 3: Screenshot to `.full-review/waratah-analytics-redesign-2026-05-21.png`.**

**Step 4: Side-by-side compare Executive + Analytics. They should feel like one product: same fonts, same colours, same column widths, same row heights.**

**Step 5: Commit any final fixes:**

```bash
git add "THE WARATAH/SHIFT REPORT SCRIPTS/AnalyticsDashboardWaratah.js"
git commit -m "fix(waratah): Analytics Dashboard visual polish pass"
```

---

## Phase 3: Sakura — port the system

### Task 3.1: Create `DashboardStyleSakura.gs` as a sister file

**Files:**
- Create: `SAKURA HOUSE/SHIFT REPORT SCRIPTS/DashboardStyleSakura.gs`

**Step 1: Copy `DashboardStyleWaratah.js` content verbatim into `DashboardStyleSakura.gs`. Same STYLE values, same helper signatures. Update the header comment to point to the sister file.**

**Step 2: `clasp push` from `SAKURA HOUSE/SHIFT REPORT SCRIPTS/`.**

**Step 3: Run `_styleSanityCheck()` in Apps Script editor for Sakura. Expect `#2F5D3A`.**

**Step 4: Commit**

```bash
git add "SAKURA HOUSE/SHIFT REPORT SCRIPTS/DashboardStyleSakura.gs"
git commit -m "feat(sakura): port DashboardStyleSakura from Waratah"
```

---

### Task 3.2: Refactor `buildExecutiveDashboard` (Sakura)

**Files:**
- Modify: `SAKURA HOUSE/SHIFT REPORT SCRIPTS/AnalyticsDashboardSakura.gs`

**Step 1: Apply the same Phase 1 task pattern (1.1 → 1.8) compressed into one task — section order and helper calls mirror Waratah Executive exactly. Differences:**
- REVENUE BY DAY: 6 days (Mon-Sat) instead of 5 — adjust range from F3:I8 to F3:I9
- Sakura uses `MONTH+1` adjustment in QUERY for Monthly Trend (already in code)
- Page header: `'SAKURA · EXECUTIVE DASHBOARD'`

**Step 2: `clasp push` from Sakura → rebuild via Sakura admin menu → visual verify Sakura Executive matches Waratah Executive in every visual respect except the 6th row in REVENUE BY DAY.**

**Step 3: Commit**

```bash
git add "SAKURA HOUSE/SHIFT REPORT SCRIPTS/AnalyticsDashboardSakura.gs"
git commit -m "refactor(sakura): apply unified design system to Executive Dashboard"
```

---

### Task 3.3: Refactor `buildFinancialDashboard` (Sakura)

**Files:**
- Modify: `SAKURA HOUSE/SHIFT REPORT SCRIPTS/AnalyticsDashboardSakura.gs`

**Step 1: Apply the Phase 2 task pattern (2.1 → 2.8) compressed. Mirror Waratah Analytics exactly. Differences:**
- DoW table: 6 rows (Mon-Sat) instead of 5 — every section below the DoW table shifts down by 1 row
- M8 block start row: Sakura was ~46 (per memory entry 454)
- Page header: `'SAKURA · ANALYTICS DASHBOARD'`

**Step 2: `clasp push` Sakura → rebuild → visual verify.**

**Step 3: Commit**

```bash
git add "SAKURA HOUSE/SHIFT REPORT SCRIPTS/AnalyticsDashboardSakura.gs"
git commit -m "refactor(sakura): apply unified design system to Analytics Dashboard"
```

---

### Task 3.4: Full Sakura visual review + cross-venue comparison

**Step 1: Rebuild both Sakura dashboards. Screenshot both.**

**Step 2: Open all four screenshots side by side:**
- `.full-review/waratah-executive-redesign-2026-05-21.png`
- `.full-review/waratah-analytics-redesign-2026-05-21.png`
- `.full-review/sakura-executive-redesign-2026-05-21.png`
- `.full-review/sakura-analytics-redesign-2026-05-21.png`

**Step 3: Confirm:**
- Same typography across all four
- Same colour palette across all four
- Same framing rules across all four
- Same section order, with row positions flexed only for 5-day vs 6-day DoW

**Step 4: Commit any final fixes; otherwise this task has no commit.**

---

## Phase 4: Cross-merge + finalise

### Task 4.1: Merge feature branch into venue branches

**Step 1: Confirm branch is clean and all tasks committed:**

```bash
git status   # expect clean
git log --oneline waratah/develop..HEAD   # expect ~15 commits
```

**Step 2: Merge into both venue branches:**

```bash
git checkout waratah/develop
git merge waratah/dashboard-ui-redesign --no-edit
git checkout sakura/develop
git merge waratah/dashboard-ui-redesign --no-edit
```

**Step 3: Push both branches:**

```bash
git push origin waratah/develop
git push origin sakura/develop
```

**Step 4: Delete the feature branch:**

```bash
git branch -d waratah/dashboard-ui-redesign
```

---

### Task 4.2: Update documentation

**Files:**
- Modify: `CLAUDE_WARATAH.md` (add deployment entry under "Recent Updates")
- Modify: `CLAUDE_SAKURA.md` (add deployment entry)
- Modify: `CLAUDE.md` (add to top-level deployment history)

**Step 1: Write a single deployment entry (one paragraph each file) describing: "Unified dashboard design system applied across Sakura + Waratah Executive and Analytics dashboards — Roboto type scale, botanical palette, hybrid filled-card + hairline framing. New `DashboardStyle<Venue>` file centralises tokens and helpers."**

**Step 2: Commit on whichever venue branch you finished on, then cross-merge per the standing rule.**

**Step 3: Final push.**

---

## Risk register

| Risk | Mitigation |
|---|---|
| Roboto unavailable on some clients → falls back to Arial | Acceptable; Arial is visually close enough |
| Heatmap conditional formatting accumulates duplicate rules across rebuilds | Existing builders already clear rules on rebuild; confirm in Task 2.4 |
| `applyHeroCard_` with `null` valueCell breaks if helper doesn't null-guard | Caught in Task 1.3; fix in Task 0.2 if surfaced |
| Row position assumptions in plan drift from actual current code | Task 1.1 is the discovery step — verify ranges before writing |
| Sakura builders use slightly different patterns than Waratah | Address per-section in Phase 3; helpers are venue-agnostic |
| `clasp push` deploys mid-refactor and a manager rebuilds dashboards while half-styled | Coordinate with user before each push, or push only at end of each task |

---

## YAGNI exclusions (deliberately not in scope)

- No dark mode
- No printable variant (PDF pipeline handles this)
- No interactivity (sidebars/buttons)
- No animation/transitions
- No new metrics or data sources
- No formula rewrites
- No schema changes
