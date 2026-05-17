# Shift Reports, A Manager's Guide

**Audience:** Venue managers and assistant managers at The Waratah. You oversee the daily shift reports, watch for problems, and step in when a floor staff member needs help. You are not the person filling in tonight's report; that audience has the [`Daily User Walkthrough`](../for-daily-users/shift-report-walkthrough.md).

This guide explains how the system works, what happens after a report is sent, what you should monitor, and the menu items available to you for daily oversight.

---

## 1. The System at a Glance

The Waratah shift report system has four moving parts that interlock through the week:

| Component | Cadence | What it does |
|---|---|---|
| **Nightly Export** | Every service night (Wed to Sun), triggered by the MOD clicking Send | Reads the day's tab, posts to Slack, emails the PDF, writes to the data warehouse, flows tasks into the Task Management spreadsheet |
| **Weekly Rollover** | Monday 9pm | Archives the week's PDF and spreadsheet copy, renames day tabs for the new week, clears manager input cells |
| **Revenue Digest** | Monday 4pm (before rollover) | Posts a Slack summary of the week's revenue numbers |
| **Weekly Backfill** | Monday 2am | Re-pushes any missed nightly data into the warehouse as a safety net |

The shift report system lives in one Google Sheet. The Task Management system lives in a second, separate Google Sheet. They are linked by code but are independent files. Settings for each live in their own Apps Script project.

---

## 2. What Happens After the MOD Clicks "Send"

Once the MOD ticks the four-item checklist and clicks Send, the system runs an end-to-end pipeline in about ten seconds. As a manager, you do not need to do anything during this pipeline. You should know what to expect so you can spot a problem if one step fails.

The pipeline runs nine sequential steps:

1. **Read tonight's data.** The code reads every input field on the day's tab: cash counts, financial figures, narrative notes, tasks, wastage and incident fields.
2. **Validate the inputs.** If a required field is empty or a number looks impossible, the system logs a warning. Reports still send.
3. **Calculate derived figures.** Net revenue, total tips, total adjustments, cash variance all compute server-side from the inputs.
4. **Generate a PDF.** A formatted PDF of the night's report is produced.
5. **Build the Slack message.** A Block Kit message is assembled with the night's headline numbers, narrative notes, task summary, AI insights (when available), and action buttons (view PDF, email team).
6. **Post to Slack.** The message goes to the manager channels and as direct messages to the six staff with personal DM webhooks (Evan, Cynthia, Adam, Jaiden, Joffy, Nick). Howie does not have a personal DM webhook by choice.
7. **Email the PDF.** Sent to the six configured recipients (Evan, Cynthia, Nick, Chef, Howie, Adam).
8. **Write to the data warehouse.** Tonight's numbers append to the central warehouse spreadsheet for weekly analytics. Duplicate-prevention logic ensures the same night cannot be logged twice.
9. **Sync tasks to Task Management.** Any TO-DOs the MOD typed flow into the Task Management spreadsheet as new tasks, with assignees pre-populated.

If any single step fails (for example Slack outage, email queue back-up), the other steps still complete. The warehouse write is the critical step; if that succeeds, the night is considered captured even if Slack or email did not arrive.

If a failure does occur, run a backfill the next morning from **Waratah Tools > Admin Tools > Backfill Entire Week to Warehouse**. This re-pushes the week's data without resending Slack or email.

---

## 3. TEST vs LIVE Mode

The system has two send modes. As a manager you should know which is which because new MODs sometimes confuse them.

| Mode | Slack | Email | Warehouse | Tasks | When to use |
|---|---|---|---|---|---|
| **LIVE** (Send Shift Report) | Posts to manager channels and DMs | Sent to all six recipients | Written | Synced to Task Management | Every real shift |
| **TEST** (Send TEST Report) | Posts to test channel only | Not sent | Not written | Not synced | Training, dry runs, verifying changes |

TEST mode is safe to run as many times as you like. It does not consume any quotas or write any permanent records. Use it when:

- A new manager is being trained
- You want to preview what the Slack message will look like before going live
- The system has been updated and you want to confirm a typical send still works

If a MOD accidentally sent in TEST mode and meant LIVE, they can just send again in LIVE. There is no duplicate-blocking on TEST sends, so the LIVE send will work normally.

---

## 4. Your Daily Manager Checklist

The next morning, confirm three things to know the previous night's report landed correctly:

1. **Did the Slack message appear in the manager channels?** Check the channels you watch. If the message is missing, see [`05-troubleshooting.md`](05-troubleshooting.md) Section 4.
2. **Did the email arrive?** Check your inbox or spam folder. If the email is missing, see [`05-troubleshooting.md`](05-troubleshooting.md) Section 5.
3. **Did the tasks from last night's TO-DOs appear in the Task Management spreadsheet?** Open the Task Management spreadsheet, filter by Source = "Shift Report" and Date Created = today. You should see one row per task the MOD added. If tasks are missing, see [`02-task-management.md`](02-task-management.md) Section 14.

A weekly check is also worth doing: on Tuesday morning, confirm Monday's rollover ran. See [`03-weekly-automation.md`](03-weekly-automation.md) Section 2 for the verification routine.

---

## 5. The Waratah Tools Menu, Daily Use

Open the shift report spreadsheet, then click **The Waratah Tools** in the top menu bar. Daily managers see:

| Menu item | What it does | When to use |
|---|---|---|
| Send Shift Report | Run the nightly LIVE send for the active day tab | The MOD uses this at end of service. As a manager you rarely click this directly. |
| Send TEST Report | Same as above, but TEST mode | When training a new manager, or to preview changes |
| Send Basic Report | Stripped-down emergency send (no Slack, no warehouse, no task sync) | Only when the main Send fails repeatedly; alert Evan after using this |
| Open Task Manager | Opens the Task Management spreadsheet in a new tab | When you need to look at outstanding tasks |
| Refresh Dashboard | Re-runs the analytics dashboard calculations | When dashboard numbers look stale |
| View Current PDF Preview | Generates and previews the current day's PDF without sending | When you want to check formatting before send |

The **Admin Tools** submenu (Backfill, Rebuild Dashboards, Reapply Formatting) is for admin operators. See [`/docs/waratah/for-admins/`](../for-admins/) when that tier is published in Phase 3.

---

## 6. How Shift Reports Feed Task Management

The two systems are tightly linked. Every time a MOD types tasks into the TO-DOs section of a nightly shift report and clicks Send, those tasks flow automatically into the Task Management spreadsheet as new rows. Each row has:

- The task description as entered
- The assignee (the staff name the MOD chose)
- Date Created = today
- Source = "Shift Report"
- Status = NEW (initial state)
- Priority = MEDIUM (default; can be changed in Task Management)
- Area = blank initially (can be filled in Task Management)

This is the one-way arrow. Shift reports push to Task Management. Task Management does not push back to shift reports.

For everything else about Task Management (the 9-status workflow, recurring tasks, Slack DMs, the dashboard, common manager operations), see [`02-task-management.md`](02-task-management.md).

---

## 7. What's New in May 2026 (Phase 1.3 System State)

The Waratah codebase had a structural overhaul in Phase 1.3, completed 2026-05-17. As a manager, the things that affect your day-to-day are:

- **Sheet layout uses named ranges.** Previously the code referenced cells by hard-coded addresses (B34, B36, etc.). It now uses named ranges (`WEDNESDAY_SR_NetRevenue`, for example). For you this changes nothing visible; for developers it means changes to the sheet layout no longer break the code automatically.
- **36 field config, 197 named ranges.** The sheet is fully labelled. Any field on the sheet that flows into the report has a named range. This is invisible to you but matters if you ever need to spot a misbound cell (see [`05-troubleshooting.md`](05-troubleshooting.md) Section 7).
- **Triggers may not yet be installed.** As of Phase 1.3 the new system has not yet had its scheduled triggers re-installed. Until Evan finishes setup, the weekly rollover, digest, backfill, and daily refreshes need to be run manually from the menu. This is a transitional state, not a permanent one.
- **No system cutover impact on the daily send.** The Send Shift Report flow is unchanged from the manager's perspective.

If your nightly Slack messages are arriving and your email reports are appearing, the system is healthy. If they are not, see the troubleshooting guide.
