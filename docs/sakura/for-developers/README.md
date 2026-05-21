# For Developers

**Audience:** Developers and Claude AI agents working on the Sakura House codebase. You are modifying code, working with named ranges, reading or extending warehouse schemas, managing triggers, debugging integration failures, or deploying changes.

If you are an admin operator looking for Script Properties or staff change procedures, you want [`/docs/sakura/for-admins/`](../for-admins/). If you are a venue manager, you want [`/docs/sakura/for-managers/`](../for-managers/).

This directory holds the canonical technical reference. Each file is exhaustive within its scope. Cross-references are explicit.

---

## What's in This Directory

| File | What it covers | When to read |
|---|---|---|
| [`01-architecture-and-data-flow.md`](01-architecture-and-data-flow.md) | File structure, code module responsibilities, dependency graph, trigger inventory, key technical rules, error handling philosophy | Before any non-trivial code change; first read for new developers and AI agents |
| [`02-cell-reference-and-field-config.md`](02-cell-reference-and-field-config.md) | All 24 fields, 144 named ranges (24 × 6 days), FIELD_CONFIG structure, named range naming convention, rollover clearables list, named-range diagnostic menu items | When touching sheet layout, named ranges, or FIELD_CONFIG |
| [`03-integration-pipeline.md`](03-integration-pipeline.md) | End-to-end nightly send pipeline: pre-send checklist, extraction, validation, warehouse writes, AI insights, Slack Block Kit, email, TO-DO push; error handling per integration | When debugging integration failures or modifying the nightly send |
| [`04-warehouse-schemas.md`](04-warehouse-schemas.md) | NIGHTLY_FINANCIAL (16 cols), OPERATIONAL_EVENTS (9), WASTAGE_COMPS (5), QUALITATIVE_LOG (11), AI_INSIGHTS_LOG; duplicate-prevention pattern; date-only helper; backfill flow | When changing warehouse schema, adding columns, or debugging data writes |
| [`05-rollover-and-triggers.md`](05-rollover-and-triggers.md) | Weekly rollover internals (in-place model, Monday 10am), CLEARABLE_FIELDS list (22 of 24, netRevenue excluded), all five triggers, archive folder structure, recovery procedure | When changing rollover logic or trigger schedules |
| [`06-task-management-internals.md`](06-task-management-internals.md) | EnhancedTaskManagement_Sakura internals: nine-status state machine, auto-escalation algorithm (BLOCKED for 14 days), 8-day archive, recurring task generation, on-edit handler, daily maintenance loop | When modifying task management code |

---

## For Claude AI Agents Specifically

You are likely working on this codebase through a sub-agent dispatched from one of the project's slash commands (`/saks`, `/sakura`, `/review`, `/deploy`, `/rollover`, etc.). The master routing file is [`/CLAUDE_SAKURA.md`](../../../CLAUDE_SAKURA.md).

Before making any code change, read at least:

1. This directory's [`01-architecture-and-data-flow.md`](01-architecture-and-data-flow.md) for system shape and key rules.
2. The file in this directory most relevant to your task (see table above).
3. The project's [`CLAUDE.md`](../../../CLAUDE.md) for global rules (agent routing, git branching, cross-merge discipline).
4. The venue-specific [`CLAUDE_SAKURA.md`](../../../CLAUDE_SAKURA.md) for Sakura-specific patterns.

For shared patterns across both venues, see [`CLAUDE_SHARED.md`](../../../CLAUDE_SHARED.md).

The verified code fact sheet used to ground this documentation set is at [`/docs/plans/2026-05-22-sakura-docs-FACT-SHEET.md`](../../plans/2026-05-22-sakura-docs-FACT-SHEET.md). If a fact in one of these developer docs conflicts with what you find by reading the code today, the code wins and the doc needs updating.

---

## Critical Rules That Have Burned Us Before

These appear in detail throughout the developer files. The summary lives here for quick reference:

1. **`sheet.clear()` is forbidden.** It destroys formatting, validation, conditional formatting, notes. Use `Range.clearContent()` for ranges, `Sheet.clearContents()` (PLURAL) for sheets. `sheet.clearContent()` (singular) does NOT exist on Sheet objects, only on Range objects. See [`01-architecture-and-data-flow.md`](01-architecture-and-data-flow.md) Section on Key Technical Rules.

2. **`SpreadsheetApp.getUi()` throws in trigger context.** Any function that may run from a time-based trigger (`performInPlaceRollover`, `runDailyTaskMaintenance`, `sendWeeklyActiveTasksSummary`, `sendWeeklyRevenueDigest_Sakura`, the `onTaskSheetEditWithAutoSort` onEdit handler) must avoid `getUi().alert(...)` or wrap it in try/catch. The `pw_*` admin menu wrappers in `MenuSakura.gs` are not safe to call from triggers; only the bare function names are.

3. **Named ranges are authoritative; fallback cells are a safety net.** The 24 fields in FIELD_CONFIG (`RunSakura.gs:29-190`) each have a named range pattern (`{DAY}_{SUFFIX}`) and a `fallback` cell A1 reference. The code uses the named range when present and falls back to the cell with a warning logged. Do not add new hard-coded cell references in new code; use the FIELD_CONFIG entry instead.

4. **Inserting or deleting rows breaks named ranges.** If a tool needs to add or remove rows on a day tab, run `pw_forceUpdateNamedRangesOnAllSheets` afterwards. See [`02-cell-reference-and-field-config.md`](02-cell-reference-and-field-config.md).

5. **`clasp push` may not destroy triggers in Sakura's setup, but verify post-deploy.** The Sakura Apps Script projects in practice retain triggers across pushes, but always verify in the Triggers panel after deployment. See [`05-rollover-and-triggers.md`](05-rollover-and-triggers.md) and [`for-admins/04-deployment-and-clasp.md`](../for-admins/04-deployment-and-clasp.md).

6. **Dates must be `toDateOnly_(d)` before warehouse write.** Sakura's working spreadsheet locale was corrected to Australia on April 2, 2026 to fix dd/mm/yyyy parsing. Time components on warehouse rows cause off-by-one-day errors in analytics. See [`04-warehouse-schemas.md`](04-warehouse-schemas.md).

7. **`netRevenue` is a formula field.** It is the only `isFormula: true` field in FIELD_CONFIG. It lives at fallback `B54`. The rollover's `CLEARABLE_FIELDS` list (`WeeklyRolloverInPlace.gs:81-90`) excludes it. Do not type into B54; do not add it to CLEARABLE_FIELDS.

8. **The qualitative warehouse sheet is `QUALITATIVE_LOG`, not `QUALITATIVE_NOTES`.** Some older docs used the wrong name. Code uses `QUALITATIVE_LOG` (`IntegrationHubSakura.gs:492-504`).

9. **9 task statuses, not 8.** `STATUSES` constant at `EnhancedTaskManagement_Sakura.gs:160-182` defines NEW, TO DO, IN PROGRESS, TO DISCUSS, BLOCKED, DEFERRED, DONE, CANCELLED, RECURRING. RECURRING is a status; the Recurrence column L is separate.

---

## Two Apps Script Projects

The codebase is split across two `clasp` projects:

| Project | Path | Owns |
|---|---|---|
| Shift Report | `SAKURA HOUSE/SHIFT REPORT SCRIPTS/` | Nightly export, weekly rollover, dashboards, warehouse writes, AI insights, weekly digest |
| Task Management | `SAKURA HOUSE/TASK MANAGEMENT SCRIPTS/` | Task spreadsheet (Sakura Actionables Sheet), task dashboard, recurring task generation, escalation, daily maintenance |

Each project has its own `.clasp.json` and pushes independently. Each has its own Script Properties (some shared keys; see [`/docs/sakura/for-admins/01-configuration-reference.md`](../for-admins/01-configuration-reference.md)).

The two projects communicate through the Task Management spreadsheet itself: the Shift Report project writes task rows into it during nightly send via `TaskIntegrationSakura.gs:60` `pushTodosToActionables()`. The spreadsheet ID is held in the `TASK_MANAGEMENT_SPREADSHEET_ID` Script Property on the Shift Report project.

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

## Phase 4 Complete (2026-05-22)

This directory is the final phase of the Sakura documentation consolidation. State summary:

- Four legacy flat docs archived to `docs/sakura/_archive/`: `CELL_REFERENCE_MAP_SAKURA.md`, `DEEP_DIVE_ARCHITECTURE_SAKURA.md`, `INTEGRATION_FLOWS_SAKURA.md`, `WORKFLOW_WEEKLY_SAKURA.md`
- `SAKURA HOUSE/FILE EXPLAINERS/` reduced to a stub pointing at this hierarchy (Phase 5)
- All technical claims grounded in `/docs/plans/2026-05-22-sakura-docs-FACT-SHEET.md`, which was produced by three forensic Explore agents reading the actual codebase with strict "cite or say NOT FOUND" instructions

The full migration plan: [`/docs/plans/2026-05-22-sakura-docs-system-mirror.md`](../../plans/2026-05-22-sakura-docs-system-mirror.md).
