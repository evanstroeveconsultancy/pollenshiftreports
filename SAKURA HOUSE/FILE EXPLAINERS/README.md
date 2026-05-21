# SAKURA HOUSE, FILE EXPLAINERS

This directory historically contained five manager-facing handover documents. They have been consolidated into a single audience-tiered structure under [`/docs/sakura/`](../../docs/sakura/) as part of a documentation consolidation effort completed on 2026-05-22.

## Status as of 2026-05-22, all phases complete

All five legacy files have been moved to [`/docs/sakura/_archive/`](../../docs/sakura/_archive/) for historical reference. Do not edit the archived files; canonical updates belong in the new locations below.

| Old file | Canonical destination(s) |
|---|---|
| `1_DAILY_SHIFT_REPORT.md` | Daily user: [`for-daily-users/shift-report-walkthrough.md`](../../docs/sakura/for-daily-users/shift-report-walkthrough.md). Manager: [`01-shift-reports.md`](../../docs/sakura/for-managers/01-shift-reports.md) |
| `2_TASK_MANAGEMENT.md` | Manager: [`02-task-management.md`](../../docs/sakura/for-managers/02-task-management.md), [`04-staff-and-recipients.md`](../../docs/sakura/for-managers/04-staff-and-recipients.md). Admin: [`02-staff-and-access-management.md`](../../docs/sakura/for-admins/02-staff-and-access-management.md). Developer: [`06-task-management-internals.md`](../../docs/sakura/for-developers/06-task-management-internals.md) |
| `3_WEEKLY_AUTOMATED_EVENTS.md` | Manager: [`03-weekly-automation.md`](../../docs/sakura/for-managers/03-weekly-automation.md). Admin: [`03-advanced-troubleshooting.md`](../../docs/sakura/for-admins/03-advanced-troubleshooting.md). Developer: [`05-rollover-and-triggers.md`](../../docs/sakura/for-developers/05-rollover-and-triggers.md) |
| `4_TROUBLESHOOTING.md` | Manager: [`05-troubleshooting.md`](../../docs/sakura/for-managers/05-troubleshooting.md). Admin: [`03-advanced-troubleshooting.md`](../../docs/sakura/for-admins/03-advanced-troubleshooting.md). Developer: [`02-cell-reference-and-field-config.md`](../../docs/sakura/for-developers/02-cell-reference-and-field-config.md) |
| `5_CONFIGURATION_REFERENCE.md` | Admin: [`01-configuration-reference.md`](../../docs/sakura/for-admins/01-configuration-reference.md), [`02-staff-and-access-management.md`](../../docs/sakura/for-admins/02-staff-and-access-management.md) |

In addition, the four legacy technical reference files that lived directly under `docs/sakura/` (CELL_REFERENCE_MAP, DEEP_DIVE_ARCHITECTURE, INTEGRATION_FLOWS, WORKFLOW_WEEKLY) have also been archived to `docs/sakura/_archive/`. Their canonical destinations are the `for-developers/` directory.

## Where to go now

All documentation is now organised by audience under [`/docs/sakura/`](../../docs/sakura/):

- Floor staff: [`for-daily-users/shift-report-walkthrough.md`](../../docs/sakura/for-daily-users/shift-report-walkthrough.md)
- Venue managers: [`for-managers/`](../../docs/sakura/for-managers/) (5 files plus README)
- Admin operators: [`for-admins/`](../../docs/sakura/for-admins/) (4 files plus README)
- Developers and Claude AI agents: [`for-developers/`](../../docs/sakura/for-developers/) (6 files plus README)

Start at the [root README](../../docs/sakura/README.md) for the audience router.

If you are an AI agent or developer, start at [`/CLAUDE_SAKURA.md`](../../CLAUDE_SAKURA.md) at the repository root.

The full design and migration plan lives at [`/docs/plans/2026-05-22-sakura-docs-system-mirror.md`](../../docs/plans/2026-05-22-sakura-docs-system-mirror.md). The verified code fact sheet that grounded the migration is at [`/docs/plans/2026-05-22-sakura-docs-FACT-SHEET.md`](../../docs/plans/2026-05-22-sakura-docs-FACT-SHEET.md).
