# Shift Reports, A Manager's Guide

**Audience:** Venue managers and assistant managers at Sakura House. You oversee the daily shift reports, watch for problems, and step in when a floor staff member needs help. You are not the person filling in tonight's report; that audience has the [`Daily User Walkthrough`](../for-daily-users/shift-report-walkthrough.md).

This guide explains how the system works, what happens after a report is sent, what you should monitor, and the menu items available to you for daily oversight.

---

## 1. The System at a Glance

Sakura House operates six service days (Monday to Saturday, closed Sunday). The shift report system has four moving parts:

| Component | Cadence | What it does |
|---|---|---|
| **Nightly Export** | Every service night (Mon to Sat), triggered by the MOD clicking Send | Reads the day's tab, posts to Slack, emails the PDF, writes to the data warehouse, flows TO-DOs into the Sakura Actionables Sheet |
| **Weekly Rollover** | Monday 10am | Archives the week's PDF and spreadsheet copy, renames day tabs for the new week, clears manager input cells |
| **Weekly Revenue Digest** | Monday 8am | Posts a Slack summary of the prior week's revenue numbers |
| **Weekly Active Tasks Summary** | Monday 6am | Posts a managers-channel summary of currently open tasks from Task Management |

The shift report system lives in one Google Sheet. The Task Management system lives in a second, separate Google Sheet (the Sakura Actionables Sheet). They are linked by code but are independent files, with settings in their own Apps Script projects.

---

## 2. What Happens After the MOD Clicks "Send"

Once the MOD ticks the pre-send checklist and clicks Confirm & Send, the system runs an end-to-end pipeline that typically completes within tens of seconds. You do not need to do anything during the pipeline. You should know what to expect so you can spot a problem if a step fails.

The LIVE pipeline runs four sequential steps:

1. **Run integrations.** Tonight's numbers append to the central data warehouse spreadsheet (NIGHTLY_FINANCIAL plus the operational, wastage and qualitative logs). Duplicate-prevention checks that the same Date and MOD combination is not logged twice. AI Insights are generated in this step.
2. **Rebuild the TO-DOs sheet.** Tasks typed into tonight's report (named ranges `todoTasks` and `todoAssignees`) are collated into a single TO-DOs sheet used by the email and the Actionables push.
3. **Post the nightly summary to Slack.** A Block Kit message is assembled with the night's headline numbers, narrative notes, task summary, and action buttons, then posted to the LIVE webhook.
4. **Push TO-DOs to the Sakura Actionables Sheet.** Any TO-DOs the MOD typed flow into the Task Management spreadsheet as new tasks, with assignees pre-populated.

The PDF is generated and emailed as part of the same export call. If any single step fails (a Slack outage, an email queue back-up), the other steps still complete. The warehouse write is the critical step; if that succeeds, the night is considered captured even if Slack or email did not arrive.

Recipients and webhook routing live in Script Properties (`SAKURA_EMAIL_RECIPIENTS`, `SAKURA_SLACK_WEBHOOK_LIVE`). For the canonical recipient list, see [`../for-admins/02-staff-and-access-management.md`](../for-admins/02-staff-and-access-management.md) once published.

If a failure occurs, run a backfill the next morning from **Shift Report > Admin Tools > Data Warehouse** (admin-gated; see [`05-troubleshooting.md`](05-troubleshooting.md)).

---

## 3. TEST vs LIVE Mode

The system has two send modes. New MODs sometimes confuse them, so it helps to recognise the difference at a glance.

| Mode | Slack | Email | Warehouse | Tasks | When to use |
|---|---|---|---|---|---|
| **LIVE** (Send Nightly Report) | Posts to manager channels and DMs | Sent to all recipients | Written | Synced to Actionables | Every real shift |
| **TEST** (Send Test Report) | Posts to test channel only | Sent only to the running user | Not written | Not synced | Training, dry runs, previewing the formatted output |

TEST mode is safe to run as many times as you like. It does not consume any quotas or write any permanent records. Use it when:

- A new manager is being trained
- You want to preview what the Slack message will look like before going live
- The system has been updated and you want to confirm a typical send still works

**Send Test Report does not require the admin password.** Any manager can run it directly from the menu.

If a MOD accidentally sent in TEST mode and meant LIVE, they can just send again in LIVE. There is no duplicate-blocking on TEST sends, so the LIVE send will work normally.

---

## 4. Your Daily Manager Checklist

The next morning, confirm three things to know the previous night's report landed correctly:

1. **Did the Slack message appear in the manager channels?** If the message is missing, see [`05-troubleshooting.md`](05-troubleshooting.md).
2. **Did the email arrive?** Check your inbox and spam folder.
3. **Did the tasks from last night's TO-DOs appear in the Sakura Actionables Sheet?** Open it and look for one row per task the MOD added. If tasks are missing, see [`02-task-management.md`](02-task-management.md).

A weekly check is also worth doing: on Tuesday morning, confirm Monday's 10am rollover ran (new day tabs for the current week, last week's PDF archived). See [`03-weekly-automation.md`](03-weekly-automation.md) for the verification routine.

---

## 5. Shift Report Menu, Daily Use

Open the shift report spreadsheet, then click **Shift Report** in the top menu bar. The two top-level items are what you use day-to-day:

| Menu item | What it does | When to use |
|---|---|---|
| Send Nightly Report | Runs the nightly LIVE pipeline for the active day tab (Slack, email, warehouse, task sync) | The MOD uses this at end of service. As a manager you rarely click this directly. |
| Send Test Report | Same pipeline in TEST mode (posts only to the test channel, emails only the running user, no warehouse write, no task sync) | When training a new manager, or to preview changes |

The **Admin Tools** submenu (Weekly Digest, Weekly Rollover, Integrations & Analytics, Data Warehouse, Set Up & Diagnostics) is password-gated and reserved for admin operators. See [`../for-admins/`](../for-admins/) when that tier is published.

The Sakura Actionables Sheet has its own separate menu. To reach the task manager UI, open the Actionables spreadsheet and use its own menu.

---

## 6. How Shift Reports Feed Task Management

The two systems are tightly linked. Every time a MOD types tasks into the TO-DOs section of a nightly shift report and clicks Send, those tasks flow automatically into the Sakura Actionables Sheet as new rows. Each row carries:

- The task description as entered
- The assignee (the staff name the MOD chose)
- Date Created set to today
- Source recorded as "Shift Report"
- Status set to NEW (initial state)

This is a one-way arrow. Shift reports push to Task Management. Task Management does not push back to shift reports.

Sakura's task system uses a nine-status workflow (NEW, TO DO, IN PROGRESS, TO DISCUSS, BLOCKED, DEFERRED, DONE, CANCELLED, RECURRING). For the full workflow, recurring tasks, Slack DMs, escalation, and common manager operations, see [`02-task-management.md`](02-task-management.md).

---

## 7. AI Insights, Anomaly Detection, and What You'll See

The system generates an AI-written shift summary and runs an anomaly check on revenue against the prior four weeks. Delivery of the upgraded insights is controlled by an admin setting (`AI_INSIGHTS_MODE`), which routes either to all managers or to Evan only. From a manager's perspective:

- When delivery is set to all managers, the nightly Slack post and email both include an AI Insights section with performance metrics, a four-week trend read, and recommended actions.
- When delivery is restricted, the standard summary still appears for the team; the upgraded insights are routed to a single recipient for review.
- Anomaly alerts post separately to the management channel if a night's net revenue is statistically far from the four-week average. They do not block the send and do not require action from you; they prompt a quick sanity check of the entry.

For configuration of `AI_INSIGHTS_MODE`, see the admin tier.

---

## 8. What NOT to Do

A few actions can break the system in ways that are hard to recover from. Avoid these:

- **Don't rename or delete day tabs** (MONDAY, TUESDAY, etc.). The code finds tabs by their day prefix.
- **Don't type into the Net Revenue cell.** It is a formula. Typing over it breaks the warehouse write and the rollover clear-list.
- **Don't paste-over the named-range input cells** (cash count, tips, production amount, deposit, narrative blocks). If a named range is overwritten with a value of a different shape, the export will read the wrong cells next time. If you suspect this has happened, run **Force Update Named Ranges** from the admin menu.
- **Don't manually edit the data warehouse spreadsheet.** All writes go through the nightly pipeline. Manual edits will be overwritten or will confuse the duplicate-prevention check.
- **Don't send from the Read Me, Instructions or TO-DOs tabs.** The pre-flight check blocks this, but it's worth knowing why.

If anything visible looks wrong on a day tab (a missing field, a strange total, a layout that has shifted), stop and check with the admin operator before sending. A bad send is harder to undo than a delayed one.

---

## 9. Quick Reference

- **Operating days:** Monday to Saturday (closed Sunday)
- **Rollover:** Monday 10am, Australia/Sydney
- **Weekly Revenue Digest:** Monday 8am
- **Weekly Active Tasks Summary:** Monday 6am, managers channel
- **Daily task maintenance:** Daily 7am (BLOCKED-to-escalation check, archive sweep)

If your nightly Slack messages are arriving, your email reports are appearing, and Monday rollover produces a fresh week of day tabs, the system is healthy. If they are not, see [`05-troubleshooting.md`](05-troubleshooting.md).
