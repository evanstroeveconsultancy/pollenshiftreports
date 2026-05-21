# Phase 4: Writing-Style Sweep

Mechanical check of the 20-doc set against the project's documented style rules from `MEMORY.md` (`feedback_writing_style.md`):

- Zero em-dashes (project preference)
- UK English spelling throughout
- Consistent terminology

## Em-dash count

**Result: 0 across 20 active docs.** Style rule fully honoured.

Verified by `grep -c "—" docs/waratah/**/*.md` returning 0 total matches.

## US-spelling violations

**Result: 0 substantive violations.**

Naive regex flagged 18 matches across 9 files, but on review all are false positives:

| Hit | Verdict |
|---|---|
| "dialog" (15 hits) | Correct usage. `dialog` is the canonical Apps Script API term for a modal window (e.g. `SpreadsheetApp.getUi().alert()` dialogs, `HtmlService` dialogs). Apps Script itself uses the spelling. Keep. |
| "behaviour" (12 hits caught) | UK spelling. The regex's UK branch matched it. Keep. |
| "licence/license" (1 hit, README:78) | Intentional parenthetical noting both spellings. Keep. |

No instances of `color`, `organize`, `optimize`, `customize`, `recognize`, `analyze`, `labor`, `favor`, `honor`, `defense`, `practiced`, `practicing`, `center` (US) found.

The two `README.md` files explicitly state UK English spelling expectations (`README.md:78`, `for-managers/README.md:86`).

## Terminology hallucinations (systematic, propagate across tiers)

The audit found the same wrong terms repeated dozens of times across the doc set. These are the textual fingerprints of the doc-generation hallucinations — fixing each requires consistent find-and-replace across multiple files.

### 1. "The Waratah Tools" — wrong menu name

Real menu is `Waratah Tools` (no "The"). Per `MenuWaratah.js:112`: `ui.createMenu('Waratah Tools')`.

**8 instances across 5 files:**

| File | Line |
|---|---|
| `for-daily-users/shift-report-walkthrough.md` | 149, 182, 194, 352 |
| `for-managers/01-shift-reports.md` | 77, 79 |
| `for-managers/02-task-management.md` | 40 |
| `for-managers/05-troubleshooting.md` | 27 |

### 2. "Send Shift Report" / "Send TEST Report" — wrong menu item names

Real items are `Export & Email PDF (LIVE)` and `Export & Email (TEST to me)`, both under the `Daily Reports` submenu. Per `MenuWaratah.js:115-116`.

**19 instances across 9 files:**

| File | Line |
|---|---|
| `for-daily-users/shift-report-walkthrough.md` | 149, 182, 190, 288, 352 |
| `for-managers/01-shift-reports.md` | 52, 53, 83, 84, 119 |
| `for-managers/05-troubleshooting.md` | 73, 93, 155, 169 |
| `for-admins/01-configuration-reference.md` | 254 |
| `for-admins/02-staff-and-access-management.md` | 128 |
| `for-admins/04-deployment-and-clasp.md` | 127 |
| `for-developers/01-architecture-and-data-flow.md` | 125 |
| `for-developers/03-integration-pipeline.md` | 436 |

### 3. "36 fields" — wrong FIELD_CONFIG count

Real count is **39 fields** (per Tier 4a audit, `RunWaratah.js:42-295`). The `RunWaratah.js:38` header comment also says 36 and is itself stale. The `MEMORY.md` handoff state I was given at session start ("FIELD_CONFIG rewritten with 36 fields, 197 named ranges") is also wrong on this number. The doc agents propagated the bad number from the stale code comment / stale handoff.

The named-range count `197` is correct: `1×7 (all-days field) + 38×5 (active-only fields × 5 days) = 197`.

**7 instances across 4 files:**

| File | Line | Context |
|---|---|---|
| `for-developers/02-cell-reference-and-field-config.md` | 11, 15, 137, 318 | header claim + math + formula-cell tally |
| `for-developers/01-architecture-and-data-flow.md` | 14, 104 | overview claim |
| `for-developers/README.md` | 16 | tier intro |
| `for-managers/01-shift-reports.md` | 117 | manager-facing summary |

### 4. "8-status workflow" — wrong status count

Real count is **9 statuses** (NEW, TO DO, IN PROGRESS, TO DISCUSS, BLOCKED, DEFERRED, DONE, CANCELLED, RECURRING) per `EnhancedTaskManagementWaratah.gs:155-189`. The file's own JSDoc at line 5 still says "8-status" and is stale.

**2 instances flagged in user-facing docs:**

| File | Line |
|---|---|
| `for-daily-users/shift-report-walkthrough.md` | 370 |
| `for-managers/README.md` | 16 |

Also propagates through `CLAUDE.md` (`CLAUDE_SHARED.md` etc.) and the audit prompts. Note that `for-developers/06-task-management-internals.md` actually has it right (says "(9 states)") — only the lower-tier docs and project memos are wrong.

### 5. "22-col" schema reference

Stale. Real schema is 25 cols. One legitimate historical reference in the version-history table of `for-developers/04-warehouse-schemas.md:393` — keep but verify the date and column-letter range from git log.

The same "22-col" comment lives in `WeeklyDigestWaratah.js:96` and is stale there too (the digest extraction still uses cols F=index5 and U=index20, which match the 25-col schema correctly).

### 6. "Phase 1.3" — undefined narrative phase

Appears 4 times across the doc set (`for-managers/01-shift-reports.md:112,117`, `for-managers/03-weekly-automation.md:7`, `for-admins/README.md:54,80-82`) but is never defined. Tier 3 flagged this (A0-1). Either define what Phase 1.3 means (presumably the May 17 cutover) or drop the phrase.

## Recommended action

Style violations (em-dash, US spelling) are clean. The terminology hallucinations listed above account for ~36 of the audit findings on their own and can be fixed by structured find-and-replace once the code-of-truth strings are agreed:

```
"The Waratah Tools"     → "Waratah Tools"
"Send Shift Report"     → "Waratah Tools → Daily Reports → Export & Email PDF (LIVE)"
"Send TEST Report"      → "Waratah Tools → Daily Reports → Export & Email (TEST to me)"
"36 fields"             → "39 fields"
"8-status workflow"     → "9-status workflow"
"Phase 1.3"             → [delete or define]
```

The `RunWaratah.js:38` and `EnhancedTaskManagementWaratah.gs:5` and `WeeklyDigestWaratah.js:96` JSDoc/comment lines should be corrected as part of the same fix sweep — otherwise the next doc-regeneration cycle will reintroduce the same wrong numbers from the code's own comments.
