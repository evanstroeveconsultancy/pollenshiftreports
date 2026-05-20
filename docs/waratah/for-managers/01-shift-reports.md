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
| **Weekly Backfill** | Monday 8am | Re-pushes any missed nightly data into the warehouse as a safety net |

The shift report system lives in one Google Sheet. The Task Management system lives in a second, separate Google Sheet. They are linked by code but are independent files. Settings for each live in their own Apps Script project.

---

## 2. What Happens After the MOD Clicks "Send"

Once the MOD ticks the two-item checklist and clicks Send, the system runs an end-to-end pipeline that typically completes within tens of seconds. As a manager, you do not need to do anything during this pipeline. You should know what to expect so you can spot a problem if one step fails.

The pipeline runs six sequential steps (as documented in the `exportAndEmailPDF` header):

1. **Block export on instruction tabs.** A pre-flight check confirms the active sheet is a service-day tab, not the Read Me or another instruction tab.
2. **Rebuild the TO-DOs sheet from the WED to SUN tabs.** Tasks typed into the night's report are collated into a single TO-DOs sheet used by the email and the Master Actionables push.
3. **Write to the data warehouse and run integrations.** Tonight's numbers append to the central warehouse spreadsheet for cross-week analytics. Duplicate-prevention logic ensures the same night cannot be logged twice.
4. **Post the nightly summary to Slack.** A Block Kit message is assembled with the night's headline numbers, narrative notes, task summary, and action buttons, then posted to the LIVE webhook.
5. **Push TO-DOs to the Master Actionables sheet.** Any TO-DOs the MOD typed flow into the Task Management spreadsheet as new tasks, with assignees pre-populated.
6. **Generate the PDF and email it.** A formatted PDF of the night's report is produced and emailed to the configured recipients.

If any single step fails (for example a Slack outage or an email queue back-up), the other steps still complete. The warehouse write is the critical step; if that succeeds, the night is considered captured even if Slack or email did not arrive.

The current recipient list lives in `WARATAH_EMAIL_RECIPIENTS` and `SLACK_DM_WEBHOOKS` Script Properties. See [`04-staff-and-recipients.md`](04-staff-and-recipients.md) for the canonical list.

If a failure does occur, run a backfill the next morning from **Waratah Tools > Admin Tools > Data Warehouse > Backfill This Sheet to Warehouse**. This re-pushes the active sheet's data without resending Slack or email.

---

## 3. TEST vs LIVE Mode

The system has two send modes. As a manager you should know which is which because new MODs sometimes confuse them.

| Mode | Slack | Email | Warehouse | Tasks | When to use |
|---|---|---|---|---|---|
| **LIVE** (Export & Email PDF (LIVE)) | Posts to manager channels and DMs | Sent to all recipients | Written | Synced to Task Management | Every real shift |
| **TEST** (Export & Email (TEST to me)) | Posts to test channel only | Not sent | Not written | Not synced | Training, dry runs, verifying changes |

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
3. **Did the tasks from last night's TO-DOs appear in the Task Management spreadsheet?** Open the Task Management spreadsheet. You should see one row per task the MOD added. If tasks are missing, see [`02-task-management.md`](02-task-management.md) Section 14.

A weekly check is also worth doing: on Tuesday morning, confirm Monday's rollover ran. See [`03-weekly-automation.md`](03-weekly-automation.md) Section 2 for the verification routine.

---

## 5. Waratah Tools Menu Structure, Daily Use

Open the shift report spreadsheet, then click **Waratah Tools** in the top menu bar. The menu is organised into two submenus. Daily managers use the **Daily Reports** submenu.

### Waratah Tools > Daily Reports

| Menu item | What it does | When to use |
|---|---|---|
| Export & Email PDF (LIVE) | Runs the nightly LIVE pipeline for the active day tab (Slack, email, warehouse, task sync) | The MOD uses this at end of service. As a manager you rarely click this directly. |
| Export & Email (TEST to me) | Same pipeline in TEST mode (posts only to the test channel, emails only the running user, no warehouse write, no task sync) | When training a new manager, or to preview changes |
| Open Export Dashboard | Opens an HTML side panel with export controls and status | When you want to review the current send state from a single panel |

The **Admin Tools** submenu (Weekly Reports, Weekly Digest, Data Warehouse, Setup & Utilities, Analytics) is password-gated and reserved for admin operators. See [`/docs/waratah/for-admins/`](../for-admins/) when that tier is published in Phase 3.

The Task Management spreadsheet has its own separate menu called **Task Management**. The **Open Task Manager** item lives there, not in Waratah Tools. To reach it, open the Task Management spreadsheet and use its own menu.

---

## 6. How Shift Reports Feed Task Management

The two systems are tightly linked. Every time a MOD types tasks into the TO-DOs section of a nightly shift report and clicks Send, those tasks flow automatically into the Task Management spreadsheet as new rows. Each row has:

- The task description as entered
- The assignee (the staff name the MOD chose)
- Date Created = today
- Source = "Shift Report"
- Status = NEW (initial state)
- Priority = MEDIUM (default; can be changed in Task Management)
- Area = "General" (default; can be changed in Task Management)

This is the one-way arrow. Shift reports push to Task Management. Task Management does not push back to shift reports.

For everything else about Task Management (the 9-Status Workflow, recurring tasks, Slack DMs, the dashboard, common manager operations), see [`02-task-management.md`](02-task-management.md).

---

## 7. What's New in May 2026

The Waratah codebase had a structural overhaul completed 2026-05-17. As a manager, the things that affect your day-to-day are:

- **Sheet layout uses named ranges.** Previously the code referenced cells by hard-coded addresses (B34, B36, etc.). It now uses named ranges (`WEDNESDAY_SR_NetRevenue`, for example). For you this changes nothing visible; for developers it means changes to the sheet layout no longer break the code automatically.
- **Named-range field coverage.** Every input field that flows into the report has a named range. The exact field and range count is reported by the `namedRangeHealthCheck_Waratah` diagnostic. This is invisible to you but matters if you ever need to spot a misbound cell (see [`05-troubleshooting.md`](05-troubleshooting.md) Section 7).
- **Triggers may not yet be installed.** As of the May 2026 cutover the new system has not yet had its scheduled triggers re-installed. Until Evan finishes setup, the weekly rollover, digest, backfill, and daily refreshes need to be run manually from the menu. This is a transitional state, not a permanent one.
- **No system cutover impact on the daily send.** The Export & Email PDF (LIVE) flow is unchanged from the manager's perspective.

If your nightly Slack messages are arriving and your email reports are appearing, the system is healthy. If they are not, see the troubleshooting guide.
