# Waratah Shift Report — Sakura Alignment Migration

**Design doc.** Captures the agreed approach for migrating the Waratah shift report sheet to a Sakura-aligned architecture, with embedded 2-till cash reconciliation.

- **Date:** 2026-05-17
- **Author:** Evan Stroeve + Claude (brainstorming session)
- **Status:** Design agreed; ready for implementation planning.
- **Target cutover:** Sunday May 24, 2026 (post-Sunday-shift flip).
- **New sheet (draft):** [`1rcfHTtey_HXC291FAmjpquYkRjWNGbFtClz2szKXfkA`](https://docs.google.com/spreadsheets/d/1rcfHTtey_HXC291FAmjpquYkRjWNGbFtClz2szKXfkA/edit)
- **Branch:** `waratah/develop`

---

## 1. Architecture Overview

Three layers change in lockstep.

### 1a. Sheet layer
- New spreadsheet (`1rcfHTt...XfkA`) replaces the current Waratah shift report.
- 7 day tabs with date suffix (e.g. `MONDAY 12/05/2026`); only Wed–Sun active.
- Cash reconciliation now embedded on each tab — 2-till layout (Public + Terrace) with totals + variance computed by sheet formulas.

### 1b. Code layer (all Waratah `.js` files that touch the shift report)
- Point at the new spreadsheet ID via `Script Property` (`WARATAH_SHEET_ID`).
- Read exclusively via named ranges. **Drop the hardcoded cell fallback** in `RunWaratah.js` (≈30–40% LOC reduction expected).
- Skip Mon/Tue tabs entirely — no warehouse writes, no email/Slack, no rollover clearing.
- Read the 3 new cash reconciliation fields (counted, expected, variance).

### 1c. Warehouse layer
- `NIGHTLY_FINANCIAL` extends from **22 → 25 columns**.
- Historical rows: `NULL` for the new columns; no backfill.
- Sakura warehouse unchanged.

---

## 2. Sheet Layout & Named Ranges

### 2a. Tab structure (already in place on the new sheet)

| Tab | State | Code behaviour |
|---|---|---|
| `MONDAY <date>` | Exists, unused | Skip — no reads, no triggers, no warehouse. Renamed by rollover for visual consistency. |
| `TUESDAY <date>` | Exists, unused | Skip — no reads, no triggers, no warehouse. Renamed by rollover for visual consistency. |
| `WEDNESDAY <date>` | Active | Full pipeline |
| `THURSDAY <date>` | Active | Full pipeline |
| `FRIDAY <date>` | Active | Full pipeline |
| `SATURDAY <date>` | Active | Full pipeline |
| `SUNDAY <date>` | Active | Full pipeline |

### 2b. Named range scheme

For each of the 5 active days, a complete Sakura-equivalent set is created. Approximate inventory:

- **Financial:** `<DAY>_SR_NetRevenue`, `_CardTips`, `_CashTips`, `_TotalTips`
- **New cash reconciliation:**
  - `<DAY>_SR_CashCounted` → `C18` (cash physically counted, sum of public + terrace)
  - `<DAY>_SR_ExpectedCash` → `C24` (system-expected cash)
  - `<DAY>_SR_CashVariance` → `C26` (variance — the "did the till balance?" signal)
- **Narrative:** `<DAY>_SR_ShiftReport`, `_VIP`, `_Good`, `_Bad`, `_Kitchen`
- **Todos:** `<DAY>_SR_Todos`, `<DAY>_SR_TodoStaff`
- **Wastage/RSA:** `<DAY>_SR_Wastage`, `<DAY>_SR_RSA`

**Total: ~15 ranges × 5 days = ~75 named ranges.**

### 2c. Cash reconciliation cell map (per active tab)

| Range | Purpose |
|---|---|
| `C10:C17` | Public Till Count |
| `D10:D17` | Public Till Refloat |
| `E10:E17` | Terrace Till Count |
| `F10:F17` | Terrace Till Refloat |
| `C18` | Cash Counted (formula: `SUM(C10:C17) + SUM(E10:E17)`) — **DO NOT CLEAR** |
| `C19` | Cash Take (formula: `C18 - (SUM(D10:D17) + SUM(F10:F17))`) — **DO NOT CLEAR** |
| `C24` | Expected Cash (system value) |
| `C26` | Cash Variance (formula: `C19 - C24`) — **DO NOT CLEAR** |

### 2d. Setup script (new file: `SetupWaratah.js`)

Two functions, wired to **Admin Tools** menu:

1. **`setupWaratahNamedRanges_()`** — idempotent. Deletes inherited Sakura ranges (`MONDAY_SR_*`, `TUESDAY_SR_*`, anything non-Waratah), then creates all ~75 Waratah ranges from a config map. Logs created / skipped / errors.
2. **`verifyWaratahNamedRanges_()`** — diagnostic. Lists missing ranges, mis-targeted ranges, unexpected leftover ranges. Output to Logger + UI alert.

**Open assumption:** non-cash cells (financials, narrative, todos, wastage/RSA) on the new sheet match Sakura's exact addresses. Verified cell-by-cell during implementation. Any drift fixed in the single config map.

---

## 3. Code Changes by File

### High-impact (rewrites / significant changes)

| File | Change |
|---|---|
| `RunWaratah.js` | Strip hardcoded cell fallback; read exclusively via named ranges; skip Mon/Tue tabs; read 3 new cash fields. ~30% LOC reduction expected. |
| `IntegrationHubWaratah.js` | Extend `NIGHTLY_FINANCIAL` schema from 22 → 25 cols. Update `logToDataWarehouse_()` to capture cash recon. Update header-row assertion. |
| `NightlyExportWaratah.js` | Point at new spreadsheet ID. Skip Mon/Tue from any iteration loop. Add `💰 Cash Variance: $X.XX (under/over)` line to Slack Block Kit output. |
| `WeeklyRolloverInPlaceWaratah.js` **(NEW — port from Sakura)** | Adapted for Wed–Sun rollover. Renames all 7 tabs (visual consistency). Clears content on Wed–Sun only. |
| `SetupWaratah.js` **(NEW)** | Named range setup + verify (see §2d). |

### Medium-impact (light touch-ups)

| File | Change |
|---|---|
| `AnalyticsDashboardWaratah.js` | Reads 25-col schema. Optionally add a cash variance dashboard tile. |
| `AIInsightsWaratah.js` | Read via named ranges (cell addresses change). Audit prompts for hardcoded cell refs (e.g. "check B15 for cash") — migrate to named-range references. |
| `MenuWaratah.js` | Add menu items: setup ranges, verify ranges, run rollover now, dry-run rollover. |
| Script Properties (Waratah project) | Update `WARATAH_SHEET_ID` to new spreadsheet ID. |
| Drive sync (Node.js, in `scripts/`) | Update spreadsheet ID if hardcoded. |

### Low-impact (verify only)

| File | Reason |
|---|---|
| Email templates | Render the sheet visually; layout is Sakura-aligned — likely no change. |
| PDF generation | Same — visual render. Spot-check on Wed evening. |
| Task management scripts | Separate project, separate spreadsheet — untouched. |
| `SlackBlockKitWaratah.js` (if present) | Block Kit library itself unchanged; only the message composer in `NightlyExportWaratah.js` changes. |

### Triggers (handled at deploy time, not file changes)

- Delete the current time-based triggers (Wed–Sat nightly + Sat email).
- Recreate against the new sheet ID (function names stable; `getActiveSpreadsheet()` or `Script Properties` does the rebind).
- Add new rollover trigger: **Monday 9pm** → `runWaratahWeeklyRollover()`.

---

## 4. `NIGHTLY_FINANCIAL` Schema Extension

### 4a. Current schema (22 cols, A–V) — unchanged

```
A Date | B Day | C WeekEnding | D MOD | E Staff | F NetRevenue
G ProductionAmount | H CashTakings | I GrossSalesIncCash | J CashReturns
K CDDiscount | L Refunds | M CDRedeem | N TotalDiscount | O DiscountsCompsExcCD
P GrossTaxableSales | Q Taxes | R NetSalesWTips | S CardTips | T CashTips
U TotalTips | V LoggedAt
```

### 4b. New schema (25 cols, A–Y)

```
A–V    (unchanged, but H=CashTakings now sourced from new C19)
W      CashCounted     ← new C18 (cash physically counted, before refloats removed)
X      ExpectedCash    ← new C24 (system-expected)
Y      CashVariance    ← new C26 (variance — H − X effectively)
```

**Rationale for 3 cols (not 4):** the user-requested `CashTake` (new `C19`) is conceptually identical to existing `H=CashTakings`. Adding it would create permanent duplication. Instead, `H` is repurposed to source from the new `C19` going forward — same definition, cleaner schema.

### 4c. Historical data treatment

- Rows pre-cutover: `W/X/Y = NULL`. No backfill (old sheet didn't capture refloats or expected cash; reconstruction would be fiction).
- Rows post-cutover: `W/X/Y` populated by `logToDataWarehouse_()`.
- `H=CashTakings` on pre-cutover rows preserved as-is. Post-cutover rows source from new `C19`. Definition is consistent; source differs.

### 4d. Header row migration

- Append `CashCounted`, `ExpectedCash`, `CashVariance` to column header row in `NIGHTLY_FINANCIAL` **before** the code deploy.
- `logToDataWarehouse_()` reads header row first and **fails loud** on column-count mismatch (defence against half-deployed state).

---

## 5. Rollover System Port

### 5a. Source & adaptations

**Source:** Sakura's `WeeklyRolloverInPlace.gs` — production-tested, already handles date-in-name tab renaming.

**Target:** new file `WeeklyRolloverInPlaceWaratah.js`.

| Aspect | Sakura | Waratah |
|---|---|---|
| Active days | Mon–Sat (6) | Wed–Sun (5) |
| Tabs renamed | Mon–Sat | All 7 (Mon–Sun) for visual consistency |
| Tabs cleared | Mon–Sat | Wed–Sun only (Mon/Tue stay blank, nothing to clear) |
| Trigger time | Sun ~9pm (venue closed) | **Mon 9pm** (after Weekly Revenue Digest at 4pm; Sunday operations + export complete) |

### 5b. Why Mon 9pm

- Waratah operates Sunday — rolling at Sun 9pm would clear the active shift.
- Weekly Revenue Digest runs Mon 4pm and reads the just-ended week. Rollover must run **after** the digest so the digest reads pre-rollover data.
- Mon 9pm sits cleanly after both — and gives the next week's sheet ready by Tue morning for any prep work.

### 5c. Safety features (cloned from Sakura's pattern)

- **Idempotent** — running twice in the same week is a no-op (detect by comparing tab dates to expected dates).
- **Dry-run mode** — `runWaratahWeeklyRollover({ dryRun: true })` logs intended changes, makes none.
- **Lock acquisition** — `LockService.getScriptLock()` prevents concurrent runs.
- **Day-prefix matching** — tabs found by case-insensitive day name (handles minor typos in tab names).
- **Cell-level clear whitelist** — only clears manager-input cells (counts, refloats, narrative, todos, financial inputs). Formula cells (`C18`, `C19`, `C26`) explicitly excluded.
- **Post-rollover verification** — calls `verifyWaratahNamedRanges_()` and fails loud if anything's missing.

### 5d. Menu items added to `MenuWaratah.js`

- `Admin Tools > Rollover > Run Weekly Rollover Now` (manual emergency trigger)
- `Admin Tools > Rollover > Dry-Run Rollover (no changes)` (testing)

---

## 6. Cutover Sequence (Day-by-Day)

### Phase 1 — Code & docs (Mon May 18 → Tue May 19)
- `/tah` pipeline kicks off: `waratah-gas-agent` implements code changes in parallel with `documentation-agent` updating `CLAUDE_WARATAH.md`, FILE EXPLAINERS, and `CELL_REFERENCE_MAP.md`.
- `gas-code-review-agent` reviews everything Tue evening. P0/P1 issues addressed.

### Phase 2 — Deploy (Wed May 20 afternoon → evening)
- `clasp push` Waratah project with new code. **Old triggers still pointing at old sheet — untouched.**
- Run `setupWaratahNamedRanges_()` on the new sheet → creates ~75 ranges. Run `verifyWaratahNamedRanges_()` → confirm.
- Update `NIGHTLY_FINANCIAL` warehouse header row from 22 → 25 cols (add `CashCounted`, `ExpectedCash`, `CashVariance`).
- Run one-time manual rollover on new sheet → sets tab dates to **May 18–24** (current dual-fill week).
- New triggers created but **disabled** (or named with `_pending` suffix).

### Phase 3 — Dual-fill testing (Wed May 20 night → Sat May 23 night)
- Managers fill **BOTH** sheets each night. Production exports / Slack / warehouse continue running from **OLD sheet only**.
- Each night: manually run `runWaratahShadow_()` (new function) → writes a shadow row to `STAGING_NIGHTLY_FINANCIAL` (separate tab; isolated from prod warehouse).
- Each morning: compare staging vs prod rows. Flag any discrepancies.

### Phase 4 — Cutover flip (Sun May 24)
- **Morning:** full dry-run pipeline against Saturday's new-sheet data.
- **Shift:** managers fill NEW sheet only.
- **~11:30pm (after the OLD sheet's final Sunday export fires for the last time):**
  - Manually delete OLD triggers.
  - Enable NEW triggers (remove `_pending` suffix).
  - Manually run new-pipeline Sunday export against the new sheet (Sunday's data lands in prod warehouse from the new pipeline).

### Phase 5 — Audit & first scheduled rollover (Mon May 25)
- **8am audit:** Sunday's `NIGHTLY_FINANCIAL` row — must come from new sheet, must have `W/X/Y` populated. Slack post showed cash variance.
- **4pm:** Weekly Revenue Digest runs (first read of new 25-col schema).
- **9pm:** First scheduled rollover fires — tabs roll from May 18–24 → May 25–31.
- **Mon onward:** Archive old sheet (rename `ARCHIVED YYYY-MM-DD`, set view-only). Update Drive sync script if old ID is hardcoded anywhere.

---

## 7. Risks, Mitigations & Rollback

### 7a. Top risks (impact × likelihood)

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Trigger collision at cutover** — old trigger fires after we think we disabled it; double-writes Sunday's row to warehouse | Screenshot triggers list before/after. `_pending` suffix on new triggers while disabled. Delete old → enable new → verify in UI. |
| 2 | **Rollover clears formulas** — `clearContent()` on `C18`/`C19`/`C26` would destroy sum/variance formulas | Whitelist of cells to clear; never tab-wide. Formula cells explicitly excluded. Sakura's pattern already handles this — port carefully. |
| 3 | **Named ranges mistargeted** — setup script points `WEDNESDAY_SR_NetRevenue` at wrong tab/cell | Setup script has dry-run mode. `verifyWaratahNamedRanges_()` runs immediately after and lists all ranges with `.getA1Notation()`. Visual spot-check Wed afternoon. |
| 4 | **Schema mismatch** — code writes 25 values but header row has 22 (or vice versa) | Header migration **before** code deploy. `logToDataWarehouse_()` reads header row first, asserts column count, fails loud on mismatch. |
| 5 | **Date computation bug** — rollover names tabs with wrong dates (timezone, off-by-one week) | Dry-run mode logs intended renames before applying. Timezone explicit (`Session.getScriptTimeZone()` → `Australia/Sydney`). First scheduled run audited Tue morning. |
| 6 | **Manager dual-fill fatigue** — they skip one or both sheets during the 4-night test | Communicate clearly *before* Wed May 20 — why + duration. Daily 8am check. Accept incomplete shadow data as testing-only risk; prod stays on old sheet. |
| 7 | **Stale hardcoded old-sheet ID lurking somewhere** | `grep -r "<old-spreadsheet-id>"` across codebase pre-deploy. Replace with `WARATAH_SHEET_ID` Script Property reads. |
| 8 | **AI insights prompts reference old cell addresses** | Audit `AIInsightsWaratah.js` prompts. Migrate cell references to named-range references in prompt text. |

### 7b. Rollback plan by phase

- **Phase 1–2 (pre-deploy):** Revert git commits, redeploy. **Zero production impact.**
- **Phase 3 (dual-fill):** No rollback needed — production still on old sheet, untouched.
- **Phase 4 (cutover flip, within ~2 hours):** Re-enable old triggers, disable new triggers, revert `WARATAH_SHEET_ID`. Managers resume old sheet from Monday. Investigate. Cost: ~2 hours dual-state.
- **Phase 5+ (post-cutover mid-week, worst case):** Old sheet is missing days. Must manually copy from new sheet back to old for affected days, then re-enable old triggers. Cost: 1–3 hours per missing day. **This is why Phase 3 testing matters.**

---

## 8. Open Items (TBD during implementation)

- Verify exact cell map of non-cash fields on new sheet vs Sakura (financial breakdown rows, narrative ranges, todos block, wastage/RSA rows). Single config map in `SetupWaratah.js` is the only place to adjust if drift found.
- Confirm Weekly Revenue Digest reads from the warehouse vs from the sheet — affects whether the rollover-after-digest ordering matters operationally or is just defensive.
- Decide whether `AnalyticsDashboardWaratah.js` adds a cash-variance tile or leaves dashboard untouched in this migration.
- Decide whether `MONDAY <date>` / `TUESDAY <date>` tabs should be **hidden** (cleaner sheet view) or visible.

---

## 9. References

- **New sheet (draft):** https://docs.google.com/spreadsheets/d/1rcfHTtey_HXC291FAmjpquYkRjWNGbFtClz2szKXfkA/edit
- **Sakura rollover (source):** `SAKURA HOUSE/SHIFT REPORT SCRIPTS/WeeklyRolloverInPlace.gs`
- **Waratah cell reference map (will need updating post-cutover):** `docs/waratah/CELL_REFERENCE_MAP.md`
- **Project navigation:** `CLAUDE.md`, `CLAUDE_WARATAH.md`, `CLAUDE_SHARED.md`

---

## 10. Decision Log (from the brainstorming session)

| # | Decision | Rationale |
|---|---|---|
| 1 | Hard cutover, no parallel run | Simpler than feature-flag dual-write. Risk contained to one Sunday window. |
| 2 | Named ranges only; strip hardcoded fallback | Symmetric with Sakura. Loud failures > silent wrong-cell reads. ~30% LOC saved in `RunWaratah.js`. |
| 3 | Extend NIGHTLY_FINANCIAL by 3 cols (not 4) | `CashTake` = existing `CashTakings`. Avoid permanent duplication. |
| 4 | No backfill of W/X/Y for historical rows | Old sheet didn't capture refloats or expected cash. Backfill would be fiction. |
| 5 | 7 tabs with Mon/Tue unused | Matches what's already built; keeps date alignment visually. Code skips Mon/Tue entirely. |
| 6 | Date-in-name tab format | User preference; clone Sakura's rename-aware rollover (already in production). |
| 7 | Rollover at Mon 9pm | After Weekly Revenue Digest (4pm). Sun 9pm conflicts with active Sunday operations. |
| 8 | Cutover Sun May 24, 2026 | Aggressive but achievable. 3 days code prep → 4 nights dual-fill → flip. |
| 9 | Slack shows cash variance | Closes the analytics loop. Why extend the schema if managers don't see it? |
| 10 | STAGING_NIGHTLY_FINANCIAL during dual-fill | Isolates test data from prod warehouse. Avoids contamination during validation. |
