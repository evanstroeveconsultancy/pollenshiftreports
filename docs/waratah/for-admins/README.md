# For Admins

**Audience:** Evan, or an appointed IT-savvy operator with full admin access to The Waratah's Apps Script projects, Script Properties, and Google Workspace.

You are not a venue manager (that audience has its own guide at [`/docs/waratah/for-managers/`](../for-managers/)). You are the layer below that, with deeper access and authority. You can edit Script Properties, change recipient and webhook configuration, run deployments via clasp, inspect logs in the Apps Script editor, recover from rollover or trigger failures, and change the admin password.

This directory holds the admin-tier documentation in four files plus this one.

---

## What's in This Directory

| File | What it covers | When to read |
|---|---|---|
| [`01-configuration-reference.md`](01-configuration-reference.md) | The complete reference for every Script Property used by the system: what each does, format, default, where it's read in code, when to change | Whenever you need to change configuration, or to understand what a given property controls |
| [`02-staff-and-access-management.md`](02-staff-and-access-management.md) | Full procedure for adding or removing staff (STAFF_LIST, webhooks, recipient lists), changing email recipients, changing Slack webhooks, password change, admin access policies | When staff change, when access policies change, or when a password reset is needed |
| [`03-advanced-troubleshooting.md`](03-advanced-troubleshooting.md) | Admin-level recovery procedures: log inspection in Apps Script editor, rollover recovery, trigger destruction and recreation after code deployments, webhook diagnostics, recipient diagnostics | When something has broken and the manager-tier troubleshooting did not resolve it |
| [`04-deployment-and-clasp.md`](04-deployment-and-clasp.md) | The end-to-end deployment workflow: pre-deploy checklist, clasp push, post-deploy verification, trigger re-installation, rollback procedure | Before any deployment, or to verify a deployment landed correctly |

For the operational manager view (what the system does day to day from a manager's perspective), see [`/docs/waratah/for-managers/`](../for-managers/). For the deep technical view (architecture, cell maps, code internals), see [`/docs/waratah/for-developers/`](../for-developers/) once Phase 4 is published.

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
| Run admin menu items (require password) | Some, with password | Yes, knows password |
| Push code via clasp | No | Yes |
| Install or remove triggers | No | Yes |
| Read or edit Drive permissions for the archive folder | No | Yes |
| Resolve a rollover that failed mid-way | No, must escalate | Yes |

This power comes with the obligation to keep things tidy. The configuration reference, the recipient lists, and the trigger setup should always reflect reality. When you change something, also tell the manager team if it affects them.

---

## Two Apps Script Projects, Two Sets of Configuration

The Waratah system has two separate Apps Script projects with separate Script Properties:

| Project | Spreadsheet it owns | Script Properties stored in |
|---|---|---|
| Waratah Shift Report (`waratah/develop` clasp project) | Shift report spreadsheet | One set of properties (paths, recipients, webhooks for nightly send) |
| Waratah Task Management (`waratah/develop` clasp project, separate folder) | Task Management spreadsheet | Different set of properties (escalation, task webhooks, task config) |

If you are editing a Script Property, **make sure you are in the correct Apps Script editor**. Both projects have a `Script Properties` panel under `Project Settings`. Selecting the wrong project and editing the wrong property is a common Phase 1.3 mistake.

The naming convention helps: shift report properties usually have prefixes like `WARATAH_SLACK_WEBHOOK_*`, `WARATAH_EMAIL_*`. Task management properties have prefixes like `TASK_*`, `ESCALATION_*`. See [`01-configuration-reference.md`](01-configuration-reference.md) for the full list.

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

## Phase 3 Status (2026-05-17)

This directory is in active build. Phase 3 of the four-phase Waratah documentation consolidation extracts admin-tier content from five legacy files:

- `THE WARATAH/FILE EXPLAINERS/5_CONFIGURATION_REFERENCE.md` (will be archived after Phase 3)
- `THE WARATAH/FILE EXPLAINERS/4_TROUBLESHOOTING.md` (already partially superseded in Phase 2; admin portions extracted now)
- `THE WARATAH/FILE EXPLAINERS/2_TASK_MANAGEMENT.md` (already partially superseded in Phase 2; admin portions extracted now)
- `THE WARATAH/FILE EXPLAINERS/3_WEEKLY_AUTOMATED_EVENTS.md` (already partially superseded in Phase 2; admin trigger recovery extracted now)
- `docs/waratah/DEEP_DIVE_ARCHITECTURE.md` (extract Script Properties section and Common Operations section only; developer content remains for Phase 4)

The full design and plan: [`/docs/plans/2026-05-17-waratah-docs-consolidation-design.md`](../../plans/2026-05-17-waratah-docs-consolidation-design.md).
