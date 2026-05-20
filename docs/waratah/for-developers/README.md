# For Developers

**Audience:** Developers and Claude AI agents working on The Waratah codebase. You are modifying code, working with named ranges, reading or extending warehouse schemas, managing triggers, debugging integration failures, or deploying changes.

If you are an admin operator looking for Script Properties or staff change procedures, you want [`/docs/waratah/for-admins/`](../for-admins/). If you are a venue manager, you want [`/docs/waratah/for-managers/`](../for-managers/).

This directory holds the canonical technical reference. Each file is exhaustive within its scope. Cross-references are explicit.

---

## What's in This Directory

| File | What it covers | When to read |
|---|---|---|
| [`01-architecture-and-data-flow.md`](01-architecture-and-data-flow.md) | File structure, code module responsibilities, dependency graph, data flow diagrams, sequence diagrams, key technical rules (sheet.clear vs Range.clearContent, getUi in trigger context), error handling philosophy | Before any non-trivial code change; first read for new developers and AI agents |
| [`02-cell-reference-and-field-config.md`](02-cell-reference-and-field-config.md) | All 39 fields, 197 named ranges, FIELD_CONFIG structure, named range naming convention, setup-bug procedure, rollover clearables list | When touching sheet layout, named ranges, or FIELD_CONFIG |
| [`03-integration-pipeline.md`](03-integration-pipeline.md) | End-to-end nightly send pipeline: extraction, validation, Slack Block Kit, email, warehouse write, task sync; cash reconciliation flow; error handling per integration | When debugging integration failures or modifying the nightly send |
| [`04-warehouse-schemas.md`](04-warehouse-schemas.md) | NIGHTLY_FINANCIAL schema, OPERATIONAL_EVENTS, WASTAGE_COMPS, QUALITATIVE_NOTES; duplicate-prevention pattern; date-only helper; backfill flow | When changing warehouse schema, adding columns, or debugging data writes |
| [`05-rollover-and-triggers.md`](05-rollover-and-triggers.md) | Weekly rollover internals (in-place model), fresh template handling, trigger setup/teardown, formula preservation, archive folder structure, trigger destruction recovery | When changing rollover logic or trigger schedules |
| [`06-task-management-internals.md`](06-task-management-internals.md) | EnhancedTaskManagementWaratah internals: 9-status state machine, auto-escalation algorithm (BLOCKED for 14 days), recurring task generation, audit trail data structure, on-edit handler, daily maintenance loop | When modifying task management code |

---

## For Claude AI Agents Specifically

You are likely working on this codebase through a sub-agent dispatched from one of the project's slash commands (`/tah`, `/waratah`, `/review`, `/deploy`, `/rollover`, etc.). The master routing file is [`/CLAUDE_WARATAH.md`](../../../CLAUDE_WARATAH.md).

Before making any code change, read at least:

1. This directory's [`01-architecture-and-data-flow.md`](01-architecture-and-data-flow.md) for system shape and key rules.
2. The file in this directory most relevant to your task (see table above).
3. The project's [`CLAUDE.md`](../../../CLAUDE.md) for global rules (agent routing, git branching, cross-merge discipline).
4. The venue-specific [`CLAUDE_WARATAH.md`](../../../CLAUDE_WARATAH.md) for Waratah-specific patterns.

For shared patterns across both venues, see [`CLAUDE_SHARED.md`](../../../CLAUDE_SHARED.md).

---

## Critical Rules That Have Burned Us Before

These appear in detail throughout the developer files. The summary lives here for quick reference:

1. **`sheet.clear()` is forbidden.** It destroys formatting, validation, conditional formatting, notes. Use `Range.clearContent()` for ranges, `Sheet.clearContents()` (PLURAL) for sheets. `sheet.clearContent()` (singular) does NOT exist on Sheet objects, only on Range objects. This has burned the project twice (TaskDashboard in both venues). See [`01-architecture-and-data-flow.md`](01-architecture-and-data-flow.md) Section on Key Technical Rules.

2. **`SpreadsheetApp.getUi()` throws in trigger context.** Any function that may run from a time-based trigger must wrap `getUi().alert(...)` calls in try/catch. Pattern: `try { SpreadsheetApp.getUi().alert(...); } catch (e) { Logger.log('UI skipped'); }`. Trigger-eligible: `runWaratahWeeklyRollover()`, `runDailyTaskMaintenance()`, all `pw_*` wrappers if called from triggers.

3. **Named ranges are authoritative; cell addresses are fallback.** The code uses `WEDNESDAY_SR_NetRevenue` etc. via FIELD_CONFIG. Hard-coded cell addresses exist as fallback. Do not add new hard-coded cell references in new code; use the FIELD_CONFIG entry instead.

4. **Inserting or deleting rows breaks named ranges.** If a developer tool needs to add or remove rows on a day tab, the named range bindings must be re-applied afterwards via the setup script. See [`02-cell-reference-and-field-config.md`](02-cell-reference-and-field-config.md) Section on Setup Bug Procedure.

5. **`clasp push` may destroy time-based triggers.** Always reinstall triggers after deployment. See [`05-rollover-and-triggers.md`](05-rollover-and-triggers.md) and [`for-admins/04-deployment-and-clasp.md`](../for-admins/04-deployment-and-clasp.md).

6. **Dates must be `toDateOnly_(d)` before warehouse write.** Australia locale was set on April 2, 2026 to fix dd/mm/yyyy parsing. Time components on warehouse rows cause off-by-one-day errors in analytics. See [`04-warehouse-schemas.md`](04-warehouse-schemas.md) Section on Date Handling.

---

## Two Apps Script Projects

The codebase is split across two `clasp` projects:

| Project | Path | Owns |
|---|---|---|
| Shift Report | `THE WARATAH/SHIFT REPORT SCRIPTS/` | Nightly export, weekly rollover, dashboards, warehouse writes, AI insights |
| Task Management | `THE WARATAH/TASK MANAGEMENT SCRIPTS/` | Task spreadsheet, task dashboard, recurring task generation, escalation, daily maintenance |

Each project has its own `.clasp.json` and pushes independently. Each has its own Script Properties (some shared keys; see [`/docs/waratah/for-admins/01-configuration-reference.md`](../for-admins/01-configuration-reference.md) Section 8).

The two projects communicate through the Task Management spreadsheet itself (the Shift Report project writes task rows into the TM spreadsheet during nightly send).

---

## Style Standards

All content in this directory follows:

- UK English spelling
- No em-dashes
- Plain technical voice (less narrative than the manager/admin docs)
- Code blocks for code, tables for reference data, lists for procedures
- One topic per heading

When you edit these files, keep them in this style.

---

## Phase 4 Complete (2026-05-17)

This directory is the final phase of the Waratah documentation consolidation, complete as of 2026-05-17. State summary:

- 9 legacy files archived to `docs/waratah/_archive/`: `CELL_REFERENCE_MAP.md`, `DEEP_DIVE_ARCHITECTURE.md`, `INTEGRATION_FLOWS.md`, `WORKFLOW_WEEKLY.md`, `03-ADVANCED-Complete-Backend-Reference.md`, `02-INTERMEDIATE-How-The-System-Works.md`, `2_TASK_MANAGEMENT.md`, `3_WEEKLY_AUTOMATED_EVENTS.md`, `4_TROUBLESHOOTING.md`. Plus the 3 files from earlier phases (`01-BASIC-Daily-Shift-Report-Guide.md`, `1_DAILY_SHIFT_REPORT.md`, `5_CONFIGURATION_REFERENCE.md`). Total: 12 files in `_archive/`.
- `docs/waratah/explainers/` directory removed (was empty).
- `THE WARATAH/FILE EXPLAINERS/` retains only a `README.md` stub pointing at this hierarchy.

The full migration plan: [`/docs/plans/2026-05-17-waratah-docs-consolidation-design.md`](../../plans/2026-05-17-waratah-docs-consolidation-design.md).
