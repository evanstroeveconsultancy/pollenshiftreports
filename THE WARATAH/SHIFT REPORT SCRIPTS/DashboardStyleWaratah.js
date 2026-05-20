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
