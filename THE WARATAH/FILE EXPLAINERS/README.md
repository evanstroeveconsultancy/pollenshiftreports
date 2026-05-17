# THE WARATAH, FILE EXPLAINERS

This directory historically contained five manager-facing handover documents. They are being consolidated into a single audience-tiered structure under [`/docs/waratah/`](../../docs/waratah/) as part of a documentation consolidation effort that began on 2026-05-17.

## Status as of 2026-05-17, Phase 3 complete

| Old file | New canonical location | Status |
|---|---|---|
| `1_DAILY_SHIFT_REPORT.md` | [`/docs/waratah/for-daily-users/shift-report-walkthrough.md`](../../docs/waratah/for-daily-users/shift-report-walkthrough.md) | **Archived** in `/docs/waratah/_archive/` |
| `2_TASK_MANAGEMENT.md` | Manager: [`02-task-management.md`](../../docs/waratah/for-managers/02-task-management.md), [`04-staff-and-recipients.md`](../../docs/waratah/for-managers/04-staff-and-recipients.md). Admin: [`01-configuration-reference.md`](../../docs/waratah/for-admins/01-configuration-reference.md), [`02-staff-and-access-management.md`](../../docs/waratah/for-admins/02-staff-and-access-management.md) | **Partially superseded (Phases 2 and 3)** (only developer audit trail internals remain here) |
| `3_WEEKLY_AUTOMATED_EVENTS.md` | Manager: [`03-weekly-automation.md`](../../docs/waratah/for-managers/03-weekly-automation.md). Admin: [`03-advanced-troubleshooting.md`](../../docs/waratah/for-admins/03-advanced-troubleshooting.md), [`04-deployment-and-clasp.md`](../../docs/waratah/for-admins/04-deployment-and-clasp.md) | **Partially superseded (Phases 2 and 3)** (only developer trigger internals remain here) |
| `4_TROUBLESHOOTING.md` | Manager: [`05-troubleshooting.md`](../../docs/waratah/for-managers/05-troubleshooting.md). Admin: [`03-advanced-troubleshooting.md`](../../docs/waratah/for-admins/03-advanced-troubleshooting.md), [`02-staff-and-access-management.md`](../../docs/waratah/for-admins/02-staff-and-access-management.md) | **Partially superseded (Phases 2 and 3)** (only developer named-range debugging remains here) |
| `5_CONFIGURATION_REFERENCE.md` | [`/docs/waratah/for-admins/01-configuration-reference.md`](../../docs/waratah/for-admins/01-configuration-reference.md) and [`02-staff-and-access-management.md`](../../docs/waratah/for-admins/02-staff-and-access-management.md) | **Archived** in `/docs/waratah/_archive/` |

Three files still in this directory hold only developer-tier content pending Phase 4. The "Partially superseded" banner at the top of each file lists the canonical destinations for everything that has moved.

## Where to go now

If you are looking for the daily shift report walkthrough, go to [`/docs/waratah/for-daily-users/shift-report-walkthrough.md`](../../docs/waratah/for-daily-users/shift-report-walkthrough.md).

If you are a venue manager looking for any of: shift reports, task management, weekly automation, staff and recipients, troubleshooting, go to [`/docs/waratah/for-managers/`](../../docs/waratah/for-managers/). These manager-tier docs are canonical as of Phase 2 (2026-05-17).

If you are an admin operator looking for: Script Properties reference, staff and access management, advanced troubleshooting, deployment procedures, go to [`/docs/waratah/for-admins/`](../../docs/waratah/for-admins/). These admin-tier docs are canonical as of Phase 3 (2026-05-17).

If you are an AI agent or developer, start at [`/CLAUDE_WARATAH.md`](../../CLAUDE_WARATAH.md) at the repository root.

The full design and migration plan lives at [`/docs/plans/2026-05-17-waratah-docs-consolidation-design.md`](../../docs/plans/2026-05-17-waratah-docs-consolidation-design.md).
