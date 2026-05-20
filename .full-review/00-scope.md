# Review Scope

## Target

Documentation accuracy audit of `docs/waratah/` — 20 active markdown files across 4 audience tiers, totalling ~6,800 lines. Audit verifies every factual claim against the actual GAS source code in `THE WARATAH/SHIFT REPORT SCRIPTS/` and `THE WARATAH/TASK MANAGEMENT SCRIPTS/`.

## Why this is a doc audit, not a code review

The user invoked `/comprehensive-review:full-review` on the new `docs/waratah/` documentation set. The skill is designed for code quality / security / performance review of source files. The target here is markdown docs that *describe* code, so the relevant question is **"does the doc match the code?"** — not "is the code well-architected?".

The skill's standard phases 1, 2, 4 (code quality, security, performance, framework best practices) are not applicable to markdown docs. Phase 3B (documentation review) is the closest match and has been expanded into the central audit. Phase 4 has been repurposed for writing-style compliance (em-dash policy, UK English).

## Files Under Review (20 docs, ~6,800 lines)

### Tier 1 — Top-level + Daily Users (2 docs, 468 lines)
- `docs/waratah/README.md` (84 lines)
- `docs/waratah/for-daily-users/shift-report-walkthrough.md` (384 lines)

### Tier 2 — Managers (6 docs, 1,065 lines)
- `docs/waratah/for-managers/README.md` (92 lines)
- `docs/waratah/for-managers/01-shift-reports.md` (121 lines)
- `docs/waratah/for-managers/02-task-management.md` (345 lines)
- `docs/waratah/for-managers/03-weekly-automation.md` (192 lines)
- `docs/waratah/for-managers/04-staff-and-recipients.md` (137 lines)
- `docs/waratah/for-managers/05-troubleshooting.md` (178 lines)

### Tier 3 — Admins (5 docs, 1,124 lines)
- `docs/waratah/for-admins/README.md` (84 lines)
- `docs/waratah/for-admins/01-configuration-reference.md` (267 lines)
- `docs/waratah/for-admins/02-staff-and-access-management.md` (299 lines)
- `docs/waratah/for-admins/03-advanced-troubleshooting.md` (260 lines)
- `docs/waratah/for-admins/04-deployment-and-clasp.md` (214 lines)

### Tier 4a — Developers part 1 (4 docs, 1,213 lines)
- `docs/waratah/for-developers/README.md` (94 lines)
- `docs/waratah/for-developers/01-architecture-and-data-flow.md` (349 lines)
- `docs/waratah/for-developers/02-cell-reference-and-field-config.md` (318 lines)
- `docs/waratah/for-developers/03-integration-pipeline.md` (452 lines)

### Tier 4b — Developers part 2 (3 docs, 1,372 lines)
- `docs/waratah/for-developers/04-warehouse-schemas.md` (407 lines)
- `docs/waratah/for-developers/05-rollover-and-triggers.md` (368 lines)
- `docs/waratah/for-developers/06-task-management-internals.md` (597 lines)

## Code Sources of Truth

### `THE WARATAH/SHIFT REPORT SCRIPTS/` (shift report sheet GAS project)
- `MenuWaratah.js` — menu structure for the shift report spreadsheet
- `RunWaratah.js` — FIELD_CONFIG, named-range bindings, send pipeline
- `IntegrationHubWaratah.js` — warehouse writes, duplicate detection, schema
- `NightlyExportWaratah.js` — Slack/email pipeline, AI insights
- `AnalyticsDashboardWaratah.js` — dashboard build
- `WeeklyRolloverInPlaceWaratah.js` — rollover logic
- `WeeklyDigestWaratah.js` — Monday digest
- `AIInsightsWaratah.js` — Claude API integration
- `SetupWaratah.js` — named range setup
- `UIServerWaratah.js`, `VenueConfig.js`, `SlackBlockKitWaratahSR.js`, `TaskIntegrationWaratah.js`

### `THE WARATAH/TASK MANAGEMENT SCRIPTS/` (task management sheet GAS project — separate file, separate menu)
- `Menu_Updated_Waratah.gs` — menu structure for the task management spreadsheet
- `EnhancedTaskManagementWaratah.gs` — 8-status workflow, escalation, staff list
- `TaskDashboardWaratah.gs` — dashboard build
- `SlackBlockKitWaratah.gs`, `UIServerWaratah.gs`

### Project context to consult (not under audit, but authoritative)
- `CLAUDE.md`, `CLAUDE_WARATAH.md`, `CLAUDE_SHARED.md`
- `.remember/remember.md` (current handoff state — Phase 1 cutover, 25-col schema)

## Audit Protocol (Strict)

Every agent reviewing a doc tier MUST:

1. **Read each assigned doc fully** before assessing.
2. **For every factual claim** (menu items, cell refs, schema columns, file names, function names, trigger times, staff lists, recipient lists, script properties, line counts), **cite the source-of-truth code file and line number** that confirms or refutes it.
3. Use **four severity levels**:
   - `CRITICAL` — fabricated content (item/feature does not exist), wrong sheet attribution, wrong action would result if user follows the doc
   - `HIGH` — wrong name, wrong number, wrong column, wrong cell ref, would mislead
   - `MEDIUM` — outdated but recognisable, missing detail, ambiguous wording
   - `LOW` — wording, formatting, style
4. **Never speculate.** If code does not confirm or refute, mark `UNVERIFIED` with reasoning.
5. **Watch for known hallucination patterns** flagged in `.remember/remember.md`:
   - 22-col warehouse schema (real: **25 cols A–Y**, IntegrationHubWaratah.js line 492; L/M/R NULL going forward)
   - "6 vs 9 recipients" contradictions (verify current count from code, not stale docs)
   - Fabricated menu items (already confirmed in for-managers/01 Section 5: "Refresh Dashboard", "View Current PDF Preview")
   - Sheet attribution errors (Task Management menu items mistakenly listed as Waratah Tools menu items)

## Output Files

- `.full-review/01-tier-1-readme-daily.md`
- `.full-review/02-tier-2-managers.md`
- `.full-review/03-tier-3-admins.md`
- `.full-review/04-tier-4a-developers-pt1.md`
- `.full-review/05-tier-4b-developers-pt2.md`
- `.full-review/06-style-sweep.md`
- `.full-review/07-final-report.md`

## Review Phases (Adapted)

- **Phase 0** ✅ Scope (this file)
- **Phase 1-2** SKIPPED (not applicable to markdown docs)
- **Phase 3** Five parallel tier-audit agents (doc-vs-code verification with citations)
- **Phase 4** Writing-style sweep (em-dash zero count, UK English, terminology)
- **Phase 5** Consolidated final report with prioritised remediation plan

## Known Concrete Evidence (pre-audit)

Section 5 of `for-managers/01-shift-reports.md` alone has these confirmed errors (from MenuWaratah.js lines 112–184 and Menu_Updated_Waratah.gs lines 165–205):

1. **FABRICATED:** "View Current PDF Preview" — does not exist in any menu.
2. **FABRICATED/MISATTRIBUTED:** "Refresh Dashboard" — does not exist; nearest is "Refresh Staff Workload Stats" in Task Management sheet, line 179.
3. **MISATTRIBUTED:** "Open Task Manager" — exists, but in the Task Management sheet menu (`Menu_Updated_Waratah.gs:170`), not the Waratah Tools menu.
4. **WRONG NAME:** "Send Shift Report" — actual is "Export & Email PDF (LIVE)" (line 115).
5. **WRONG NAME:** "Send TEST Report" — actual is "Export & Email (TEST to me)" (line 116).
6. **OMITTED:** "Open Export Dashboard" (line 119) is a real item, missing from the doc.
7. **WRONG HIERARCHY:** Items are listed flat; real menu wraps them in a `Daily Reports` submenu.
8. **WRONG NAME (minor):** Menu is "Waratah Tools" (line 112), doc says "The Waratah Tools".

That's eight errors in one table in one section — evidence justifying systematic audit of all 20 docs.
