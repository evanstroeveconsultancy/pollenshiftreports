# For Managers

**Audience:** Venue managers and assistant managers who supervise the shift reporting and task management systems at Sakura House.

You are not the floor staff filling in tonight's report (that audience has its own walkthrough at [`/docs/sakura/for-daily-users/shift-report-walkthrough.md`](../for-daily-users/shift-report-walkthrough.md)). You are the next layer up. You oversee multiple reports across the week, manage outstanding tasks, watch the weekly numbers, respond when something does not look right, and step in when a floor staff member needs help.

This directory holds the manager-tier documentation in five files plus this one. Read in order or jump to a topic.

---

## What's in This Directory

| File | What it covers | When to read |
|---|---|---|
| [`01-shift-reports.md`](01-shift-reports.md) | Your role in the daily shift report system, what to watch for in nightly Slack posts, how to spot incomplete or incorrect reports, follow-up actions | First time you supervise reports, or to refresh on management oversight expectations |
| [`02-task-management.md`](02-task-management.md) | The Task Management spreadsheet: the nine-status workflow, priority levels, assigning tasks, recurring tasks, the dashboard, Slack notifications, integration with shift reports | When tasks are not progressing, when you need to assign or reassign work, when setting up recurring maintenance |
| [`03-weekly-automation.md`](03-weekly-automation.md) | What the system does automatically each week: Monday 10am rollover, Monday 8am revenue digest, Monday 6am weekly task summary, daily 7am task maintenance | When automation does not seem to be running, or you want to understand the weekly rhythm |
| [`04-staff-and-recipients.md`](04-staff-and-recipients.md) | The current staff roster, who receives email reports, who receives Slack DMs, how to add or remove staff from the task assignee dropdown | When staff joins, leaves, or changes role |
| [`05-troubleshooting.md`](05-troubleshooting.md) | Manager-fixable problems and their quick resolutions. Things you can handle yourself without admin or developer access | When something goes wrong tonight or this morning |

For anything outside manager scope (changing Script Properties, log inspection, password changes, deploying code), see [`/docs/sakura/for-admins/`](../for-admins/) or escalate to Evan.

---

## What Each Tier Above and Below You Does

It helps to know where your responsibility starts and stops.

| Tier | Who | What they do | Where their docs live |
|---|---|---|---|
| Daily User | Floor staff and MODs on the night | Fill in tonight's report, count cash, write notes, click Send | [`/docs/sakura/for-daily-users/`](../for-daily-users/) |
| **Manager** (you) | **Venue managers and assistant managers** | **Oversee reports, manage tasks, follow up, fix manager-level issues** | **`/docs/sakura/for-managers/`** |
| Admin | Evan or appointed IT-savvy operator | Change Script Properties, manage recipients and webhooks, recover from system failures, deploy code | [`/docs/sakura/for-admins/`](../for-admins/) |
| Developer | Evan or developers and Claude AI sessions | Modify code, work with named ranges and schemas, manage triggers | [`/docs/sakura/for-developers/`](../for-developers/) |

Manager responsibility, in one sentence: **everything you can change through the spreadsheet UI or the non-password-gated menu items, without touching code or Script Properties**.

---

## Glossary of Terms You Will See

If a term in any of the manager docs is unfamiliar, check here first.

| Term | What it means |
|---|---|
| **MOD** | Manager on Duty. The person leading service that night. Filled in at the top of each day's tab. |
| **Shift Report** | The completed end-of-night summary for one service day. Lives on one tab per service day (Monday through Saturday) in the Sakura shift report spreadsheet. Sakura is closed Sunday. |
| **TEST mode** | A practice run that posts to a test Slack channel and emails the active user only. No live channel post, no group email, no warehouse write, no task sync. |
| **Weekly Rollover** | Automated Monday 10am process that archives the previous week's PDF and spreadsheet, renames tabs to the new week's dates, and clears manager input cells (preserving formulas). |
| **Revenue Digest** | A Monday 8am Slack post summarising the previous week's revenue numbers. |
| **Task Management spreadsheet** | A separate Google Sheet that holds all open and completed tasks across the venue. Distinct from the shift report spreadsheet. |
| **Task Dashboard** | A view inside the Task Management spreadsheet that shows tasks grouped by status, assignee, and priority. |
| **TO-DOs** | Tasks logged by the MOD on the night, in the day's shift report (cells A69:A84 with assignees at D69:D84). These flow into the Sakura Actionables Sheet automatically on send. |
| **Sakura Actionables Sheet** | The Sakura name for the Task Management spreadsheet, the destination for TO-DOs pushed from nightly shift reports. |
| **Nine-Status Workflow** | The nine task states a task can move through: NEW, TO DO, IN PROGRESS, TO DISCUSS, BLOCKED, DEFERRED, DONE, CANCELLED, RECURRING. DEFERRED is the "on hold" state; TO DISCUSS is the "needs management attention" state; RECURRING is a status used when a recurring task is regenerated. |
| **Recurrence column** | Column L on the Tasks sheet. Holds values "None", "Weekly", "Fortnightly", "Monthly". This is separate from the RECURRING status; it controls whether the system regenerates the task after DONE. |
| **Recurring Task** | A task with a Recurrence value other than "None". The system creates the next instance when the previous one is marked DONE. |
| **Auto-escalation** | The system automatically sends a Slack alert and email when a task has been BLOCKED for more than 14 days. The escalation recipient is configured in Script Properties (`ESCALATION_EMAIL` and `ESCALATION_SLACK_WEBHOOK`). |
| **Slack DM** | A Slack direct message sent privately to one staff member, used for personal task notifications. |
| **Slack Channel post** | A Slack message posted to a shared channel (managers channel, venue channel) that all members can see. |
| **Script Properties** | The configuration store inside the Apps Script project. Holds webhook URLs, recipient lists, the admin menu password. Admin-tier access only. |
| **Named Range** | A labelled cell or cell range in the spreadsheet that the code refers to by name (for example `MONDAY_SR_NetRevenue`). Sakura has 144 named ranges across the 6 day prefixes. |
| **Data Warehouse** | A separate Google Sheet that collects every shift report's numbers (financial, operational, wastage, qualitative) for cross-week analytics. Identified by the `SAKURA_DATA_WAREHOUSE_ID` Script Property. |
| **Trigger** | A scheduled job inside the Apps Script project that fires at a set time (for example, weekly rollover Monday 10am). |
| **AI Insights** | Claude-generated shift summary and anomaly detection that runs automatically after each LIVE send. Delivery routing is controlled by the `AI_INSIGHTS_MODE` Script Property. |

---

## Style Standards

All content in this directory follows:

- UK English spelling (organised, behaviour, recognise, centre, summarise, defence, licence/license)
- No em-dashes anywhere; sentences split with commas, full stops, colons, semicolons, or parentheses
- Plain, instructional second-person voice
- One topic per heading
- Lists over paragraphs where there is a clear sequence or set of options

If you spot a deviation, please flag it or correct it. Stylistic consistency keeps the docs scannable.
