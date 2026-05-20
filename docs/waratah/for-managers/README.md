# For Managers

**Audience:** Venue managers and assistant managers who supervise the shift reporting and task management systems at The Waratah.

You are not the floor staff filling in tonight's report (that audience has its own walkthrough at [`/docs/waratah/for-daily-users/shift-report-walkthrough.md`](../for-daily-users/shift-report-walkthrough.md)). You are the next layer up. You oversee multiple reports across the week, manage outstanding tasks, watch the weekly numbers, respond when something does not look right, and step in when a floor staff member needs help.

This directory holds the manager-tier documentation in five files plus this one. Read in order or jump to a topic.

---

## What's in This Directory

| File | What it covers | When to read |
|---|---|---|
| [`01-shift-reports.md`](01-shift-reports.md) | Your role in the daily shift report system, what to watch for in nightly Slack posts, how to spot incomplete or incorrect reports, follow-up actions | First time you supervise reports, or to refresh on management oversight expectations |
| [`02-task-management.md`](02-task-management.md) | The Task Management spreadsheet: the 9-Status Workflow, priority levels, assigning tasks, recurring tasks, the dashboard, Slack DM notifications, integration with shift reports | When tasks are not progressing, when you need to assign or reassign work, when setting up recurring maintenance |
| [`03-weekly-automation.md`](03-weekly-automation.md) | What the system does automatically each week: Monday 9pm rollover, Monday 4pm revenue digest, daily staff workload refresh, Monday 8am backfill | When automation does not seem to be running, or you want to understand the weekly rhythm |
| [`04-staff-and-recipients.md`](04-staff-and-recipients.md) | The current staff roster, who receives email reports, who receives Slack DMs, how to add or remove staff from the task assignee dropdown | When staff joins, leaves, or changes role |
| [`05-troubleshooting.md`](05-troubleshooting.md) | Manager-fixable problems and their quick resolutions. Things you can handle yourself without admin or developer access | When something goes wrong tonight or this morning |

For anything outside manager scope (changing Script Properties, log inspection, password changes, deploying code), see [`/docs/waratah/for-admins/`](../for-admins/) or escalate to Evan.

---

## What Each Tier Above and Below You Does

It helps to know where your responsibility starts and stops.

| Tier | Who | What they do | Where their docs live |
|---|---|---|---|
| Daily User | Floor staff and MODs on the night | Fill in tonight's report, count cash, write notes, click Send | [`/docs/waratah/for-daily-users/`](../for-daily-users/) |
| **Manager** (you) | **Venue managers and assistant managers** | **Oversee reports, manage tasks, follow up, fix manager-level issues** | **`/docs/waratah/for-managers/`** |
| Admin | Evan or appointed IT-savvy operator | Change Script Properties, manage recipients and webhooks, recover from system failures, deploy code | [`/docs/waratah/for-admins/`](../for-admins/) (Phase 3, pending) |
| Developer | Evan or developers and Claude AI sessions | Modify code, work with named ranges and schemas, manage triggers | [`/docs/waratah/for-developers/`](../for-developers/) (Phase 4, pending) |

Manager responsibility, in one sentence: **everything you can change through the spreadsheet UI or the Waratah Tools menu, without touching code or Script Properties**.

---

## Glossary of Terms You Will See

If a term in any of the manager docs is unfamiliar, check here first.

| Term | What it means |
|---|---|
| **MOD** | Manager on Duty. The person leading service that night. Filled in at the top of each day's tab. |
| **Shift Report** | The completed end-of-night summary for one service day. Lives on one tab per service day in the Waratah shift report spreadsheet. |
| **TEST mode** | A practice run that posts to a test Slack channel only. No email, no data warehouse write, no task sync. |
| **Weekly Rollover** | Automated Monday 9pm process that archives the week's data and resets the sheet for the new week. |
| **Revenue Digest** | A Monday 4pm Slack post summarising the week's revenue numbers. Posted before rollover. |
| **Task Management spreadsheet** | A separate Google Sheet that holds all open and completed tasks across the venue. Different from the shift report spreadsheet. |
| **Task Dashboard** | A view inside the Task Management spreadsheet that shows tasks grouped by status, assignee, priority. |
| **TO-DOs** | Tasks logged by the MOD on the night, in the day's shift report. These flow into the Task Management spreadsheet automatically on send. |
| **9-Status Workflow** | The nine task states a task can move through: NEW, TO DO, IN PROGRESS, TO DISCUSS, BLOCKED, DEFERRED, DONE, CANCELLED, RECURRING. DEFERRED is the "on hold" state; TO DISCUSS is the "needs management attention" state. |
| **Recurring Task** | A task that regenerates itself on a fixed cadence (weekly, fortnightly, monthly). The system creates the next instance when the previous one is marked DONE or its due date arrives. |
| **Auto-escalation** | The system automatically sends a Slack alert and email when a task has been BLOCKED for more than 14 days. The escalation recipient is configured in Script Properties (`ESCALATION_EMAIL` and `ESCALATION_SLACK_WEBHOOK`). |
| **Slack DM** | A Slack direct message sent privately to one staff member, used for personal task notifications and high-priority alerts. |
| **Slack Channel post** | A Slack message posted to a shared channel (manager channel, FOH channel) that all members can see. |
| **Script Properties** | The configuration store inside the Apps Script project. Holds webhook URLs, recipient lists, passwords. Admin-tier access only. |
| **Named Range** | A labelled cell or cell range in the spreadsheet that the code refers to by name (for example `WEDNESDAY_SR_NetRevenue`). |
| **Data Warehouse** | A separate Google Sheet that collects every shift report's numbers for cross-week analytics. |
| **Trigger** | A scheduled job inside the Apps Script project that fires at a set time (for example, weekly rollover Monday 9pm). |

---

## How These Docs Were Built

This directory is part of a four-phase documentation consolidation of The Waratah's manager-facing content. Phase 2 (this tier) is built from four older legacy files that previously held a mix of manager, admin, and developer content:

- `docs/waratah/_archive/02-INTERMEDIATE-How-The-System-Works.md`
- `docs/waratah/_archive/2_TASK_MANAGEMENT.md`
- `docs/waratah/_archive/3_WEEKLY_AUTOMATED_EVENTS.md`
- `docs/waratah/_archive/4_TROUBLESHOOTING.md`

Each of those files contained manager-tier content that has been moved here, plus admin-tier and developer-tier content that remains in the source files until Phase 3 and Phase 4 of the consolidation complete. Until then, the legacy files carry a "PARTIALLY SUPERSEDED" banner pointing here for manager content.

The full migration plan is documented at [`/docs/plans/2026-05-17-waratah-docs-consolidation-design.md`](../../plans/2026-05-17-waratah-docs-consolidation-design.md).

---

## Style Standards

All content in this directory follows:

- UK English spelling (organised, behaviour, recognise, centre, summarise, defence, licence/license)
- No em-dashes anywhere; sentences split with commas, full stops, colons, semicolons, or parentheses
- Plain, instructional second-person voice
- One topic per heading
- Lists over paragraphs where there is a clear sequence or set of options

If you spot a deviation, please flag it or correct it. Stylistic consistency keeps the docs scannable.
