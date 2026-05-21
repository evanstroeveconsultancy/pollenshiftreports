# Phase A — Completion Record

**Status:** Complete. **Files modified:** 7. **Lines changed:** ~25.

## Decisions captured
- **Basic Report:** Remove menu wire-up. All doc references to be removed in Phase B.
- **Revenue Digest schedule:** Monday 4:00pm canonical (per session handoff intent). Both installers updated.

## Changes executed

### A1 — Production runtime bug fix
- `MenuWaratah.js:117` — removed `.addItem('Send Basic Report', 'sendShiftReportBasic')`. The undefined function reference no longer reachable from any menu. The `addSeparator()` at line 118 stays as the boundary between send items and `Open Export Dashboard`.

### A2 — Revenue Digest schedule alignment (Mon 4pm)
- `MenuWaratah.js` setupAllTriggers_Waratah:
  - JSDoc line 215: handler list now reads `sendWeeklyRevenueDigest_Waratah: Monday 4:00pm`
  - Inline comment line 249: `Weekly Digest: Monday 4:00pm (before the Monday 9:00pm rollover)`
  - Trigger code lines 250-256: `onWeekDay(MONDAY).atHour(16)`
  - Post-install alert: `Weekly Digest — Monday 4:00pm`
- `WeeklyDigestWaratah.js` setupWeeklyDigestTrigger_Waratah:
  - JSDoc: `Install a Monday 4pm trigger for the weekly digest`
  - Trigger code: `.atHour(16)` (was 9)
  - Alert text: `Weekly revenue digest will be sent every Monday at 4pm`

### A3 — Upstream stale-comment cleanup
Original 7 from the audit:
1. `RunWaratah.js:38` — "36 fields" → "39 fields"
2. `EnhancedTaskManagementWaratah.gs:5-6` — "8-status workflow system" → "9-status workflow system (with full enumeration appended)"
3. `WeeklyDigestWaratah.js:96, 98` — "new 22-col schema" → "25-col schema" (both instances)
4. `MenuWaratah.js:213-216` — JSDoc handler list: `performWeeklyRollover: Monday 10:00am` → `runWaratahWeeklyRollover: Monday 9:00pm`
5. `EnhancedTaskManagementWaratah.gs:1577` — "time-based trigger at 7am daily" → "time-based trigger at 6am daily (Apps Script 6–7am window)"
6-7. (Reduced from 7 to 6 because `WeeklyRolloverInPlaceWaratah.js:25-26`'s Mon 4pm comment was originally stale against code; the user's Mon 4pm choice now makes it correct — no fix needed)

5 additional surfaced during verification:
8. `AIInsightsWaratah.js:447-454` — full OLD schema column list replaced with 25-col A-Y schema, noting L/M/R NULL post-May 2026 and the V/W/X/Y cash-reconciliation cluster
9. `IntegrationHubWaratah.js:412-413` — JSDoc now says `NIGHTLY_FINANCIAL (25 cols A-Y)` and adds a 2026-05-17 schema-update note
10. `IntegrationHubWaratah.js:463` — inline comment "(22 columns A-V)" → "(25 columns A-Y)"
11. `SetupWaratah.js:44` — "36 fields" → "39 fields"
12. `EnhancedTaskManagementWaratah.gs:648` — user-facing migration alert string: "• 8-status workflow" → "• 9-status workflow"

## Regression sweep — all clean

Final greps across both `SHIFT REPORT SCRIPTS/` and `TASK MANAGEMENT SCRIPTS/`:

| Pattern | Result |
|---|---|
| `22-col`, `22 col`, `22 column` | 0 hits |
| `36 field`, `36-field` | 0 hits |
| `8-status`, `8 status`, `eight status` | 0 hits |
| `sendShiftReportBasic` | 0 hits |
| `Wednesday 8:00am` (digest pattern) | 0 hits |
| `time-based trigger at 7am`, `at 7am daily` | 0 hits |
| `performWeeklyRollover: Monday 10` | 0 hits |

The remaining `performWeeklyRollover` references (lines 48, 102, 220 of `MenuWaratah.js`) are intentional — they form the trigger-cleanup path that deletes legacy triggers during `setupAllTriggers_Waratah`.

## Side discoveries (originally flagged for follow-up; status updated 2026-05-20)

1. **`pw_performWeeklyRollover` wrapper at `MenuWaratah.js:48`** — **CORRECTION: this is NOT a dead wrapper.** My original Phase A claim was wrong. The function `performWeeklyRollover` IS defined at `WeeklyRolloverInPlaceWaratah.js:227-229` as an intentional backward-compatibility alias that calls `runWaratahWeeklyRollover()`. The JSDoc explicitly says "Backward-compatible alias — keeps existing trigger/menu references working. Old handler name was 'performWeeklyRollover'." The pw_ wrapper → alias → real function chain is valid. **No action needed.**

2. **`EnhancedTaskManagementWaratah.gs:16-22` "Triggers Required" header** — **FIXED 2026-05-20.** The header now lists `runDailyTaskMaintenance` as the daily 6am main maintenance handler, alongside `runScheduledStaffWorkload`. Both daily 6am triggers documented.

3. **Menu item label `Setup Monday Digest Trigger`** at `MenuWaratah.js:140` — **FIXED 2026-05-20.** Renamed to `Setup Monday 4pm Digest Trigger` to match the canonical Phase A schedule.

4. **`performWeeklyRollover` function existence** — confirmed defined at `WeeklyRolloverInPlaceWaratah.js:227-229`. The trigger-deletion path at `setupAllTriggers_Waratah` and the legacy wrapper at `MenuWaratah.js:48` are both valid. No action needed.

## Files modified — final list

```
THE WARATAH/SHIFT REPORT SCRIPTS/MenuWaratah.js
THE WARATAH/SHIFT REPORT SCRIPTS/WeeklyDigestWaratah.js
THE WARATAH/SHIFT REPORT SCRIPTS/RunWaratah.js
THE WARATAH/SHIFT REPORT SCRIPTS/SetupWaratah.js
THE WARATAH/SHIFT REPORT SCRIPTS/AIInsightsWaratah.js
THE WARATAH/SHIFT REPORT SCRIPTS/IntegrationHubWaratah.js
THE WARATAH/TASK MANAGEMENT SCRIPTS/EnhancedTaskManagementWaratah.gs
```

## Pre-deploy notes for Evan

These changes are **code-only**, no Script Property changes required. After `clasp push`:

1. **For the Shift Report project** — re-run `Waratah Tools → Admin Tools → Setup & Utilities → Setup All SR Triggers` to install the corrected Monday 4pm digest schedule. The function deletes the existing digest trigger (which currently does not exist if cutover left it uninstalled per session handoff) and creates the new one.

2. **For the Task Management project** — no triggers change. The `runDailyTaskMaintenance` JSDoc fix is documentation-only.

3. **`Send Basic Report`** disappears from the `Waratah Tools → Daily Reports` submenu. The four doc references to it (in `for-daily-users/shift-report-walkthrough.md` §4, §10, troubleshooting; `for-managers/05-troubleshooting.md`) will be removed during Phase B.

## What's not done

- **Phase B (user-facing doc fixes):** 80+ findings across daily/manager/admin docs.
- **Phase C (developer doc rewrites):** 90+ findings — largest scope.
- **Phase D (verify + fix the empty `.remember/remember.md`).**
- **Side discoveries** listed above.

Ready to proceed to Phase B when authorised.
