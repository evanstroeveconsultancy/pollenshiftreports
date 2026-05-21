# For Admins

**Audience:** Evan, or an appointed IT-savvy operator with full admin access to Sakura House's Apps Script projects, Script Properties, and Google Workspace.

You are not a venue manager (that audience has its own guide at [`/docs/sakura/for-managers/`](../for-managers/)). You are the layer below that, with deeper access and authority. You can edit Script Properties, change recipient and webhook configuration, run deployments via clasp, inspect logs in the Apps Script editor, recover from rollover or trigger failures, and change the admin password.

This directory holds the admin-tier documentation in four files plus this one.

---

## What's in This Directory

| File | What it covers | When to read |
|---|---|---|
| [`01-configuration-reference.md`](01-configuration-reference.md) | The complete reference for every Script Property used by Sakura House: what each does, format, default, where it's read in code, when to change | Whenever you need to change configuration, or to understand what a given property controls |
| [`02-staff-and-access-management.md`](02-staff-and-access-management.md) | Full procedure for adding or removing staff (STAFF_LIST, webhooks, recipient lists), changing email recipients, changing Slack webhooks, password change, admin access policies | When staff change, when access policies change, or when a password reset is needed |
| [`03-advanced-troubleshooting.md`](03-advanced-troubleshooting.md) | Admin-level recovery procedures: log inspection in Apps Script editor, rollover recovery, trigger destruction and recreation after code deployments, webhook diagnostics, recipient diagnostics, named range rebuild | When something has broken and the manager-tier troubleshooting did not resolve it |
| [`04-deployment-and-clasp.md`](04-deployment-and-clasp.md) | The end-to-end deployment workflow: pre-deploy checklist, clasp push, post-deploy verification, trigger re-installation, rollback procedure, cross-merge with the Waratah branch | Before any deployment, or to verify a deployment landed correctly |

For the operational manager view (what the system does day to day from a manager's perspective), see [`/docs/sakura/for-managers/`](../for-managers/). For the deep technical view (architecture, cell maps, code internals), see [`/docs/sakura/for-developers/`](../for-developers/).

---

## What Admin Access Means

You have authority to do things that managers cannot. Specifically:

| Action | Manager can do | Admin can do |
|---|---|---|
| Open Apps Script editor for either project | No | Yes |
| Inspect Executions (logs) | No | Yes |
| Edit Script Properties | No | Yes |
| Edit STAFF_LIST in code | No | Yes |
| Change admin password | No | Yes |
| Run admin menu items (password-gated) | Some, with password | Yes, knows password |
| Push code via clasp | No | Yes |
| Install or remove triggers | No | Yes |
| Read or edit Drive permissions for the archive folder | No | Yes |
| Resolve a rollover that failed mid-way | No, must escalate | Yes |

This power comes with the obligation to keep things tidy. The configuration reference, the recipient lists, and the trigger setup should always reflect reality. When you change something, also tell the manager team if it affects them.

---

## Two Apps Script Projects, Two Sets of Configuration

The Sakura House system has two separate Apps Script projects with separate Script Properties:

| Project | Spreadsheet it owns | Folder | Script Properties stored in |
|---|---|---|---|
| Sakura Shift Report (Apps Script project bound to the shift report spreadsheet) | Shift report spreadsheet | `SAKURA HOUSE/SHIFT REPORT SCRIPTS/` | One set of properties (paths, recipients, webhooks for nightly send, AI insights config) |
| Sakura Task Management (separate Apps Script project bound to the Sakura Actionables spreadsheet) | Task Management spreadsheet (Sakura Actionables Sheet) | `SAKURA HOUSE/TASK MANAGEMENT SCRIPTS/` | Different set of properties (task webhooks, escalation, DM map) |

If you are editing a Script Property, **make sure you are in the correct Apps Script editor**. Both projects have a `Script Properties` panel under `Project Settings`. Selecting the wrong project and editing the wrong property is a common mistake.

A few properties intentionally exist in BOTH projects (`MENU_PASSWORD`, `VENUE_NAME`, `SAKURA_DATA_WAREHOUSE_ID`, `SAKURA_SLACK_WEBHOOK_TEST`, `TASK_MANAGEMENT_SPREADSHEET_ID`). When you rotate one of these, update BOTH projects, otherwise the projects fall out of sync.

The naming convention helps: shift report properties often start with `SAKURA_` (`SAKURA_SLACK_WEBHOOK_LIVE`, `SAKURA_EMAIL_RECIPIENTS`, `SAKURA_WORKING_FILE_ID`). Task management properties often start with `ESCALATION_`, `SLACK_DM_`, or `SLACK_MANAGERS_`. See [`01-configuration-reference.md`](01-configuration-reference.md) for the full list with file:line citations.

---

## Style Standards

All content in this directory follows:

- UK English spelling
- No em-dashes
- Plain instructional second-person voice
- Lists over paragraphs for procedures
- One topic per heading

When you edit these files, please keep them in this style.

---

## How These Docs Were Built

This directory is part of the four-phase Sakura documentation consolidation (May 22, 2026). Phase 3 (this tier) is built from three legacy sources:

- `SAKURA HOUSE/FILE EXPLAINERS/5_CONFIGURATION_REFERENCE.md` (will be archived after Phase 3)
- `SAKURA HOUSE/FILE EXPLAINERS/4_TROUBLESHOOTING.md` (admin portions extracted; manager portions already in `for-managers/05-troubleshooting.md`)
- `SAKURA HOUSE/FILE EXPLAINERS/2_TASK_MANAGEMENT.md` (admin portions extracted; manager portions already in `for-managers/02-task-management.md`)

The Sakura migration was grounded in a verified code fact sheet (`/docs/plans/2026-05-22-sakura-docs-FACT-SHEET.md`), produced by three forensic Explore agents reading the actual codebase. Every Script Property, trigger schedule, function name, and menu path in these docs traces back to a `file:line` citation in that fact sheet.

The full design: [`/docs/plans/2026-05-22-sakura-docs-system-mirror.md`](../../plans/2026-05-22-sakura-docs-system-mirror.md).
