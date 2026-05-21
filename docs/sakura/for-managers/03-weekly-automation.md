# Weekly Automation, A Manager's Guide

**Audience:** Sakura House managers who want to understand what the system does on its own each week, so they recognise when the rhythm is broken.

The Sakura House system automates a cluster of weekly and daily routines so managers do not have to remember them. This guide tells you what runs, when, what each one does, and how to spot when one has failed.

Sakura operates six days, Monday to Saturday. The venue is closed Sunday, so the working week resets every Monday.

---

## 1. Weekly Schedule at a Glance

| Day | Time (Sydney) | Routine | What it does |
|---|---|---|---|
| Mon | 6am | **Weekly Active Task Summary** | Posts an open-task summary to the managers Slack channel |
| Mon | 8am | **Revenue Digest** | Posts the previous week's revenue summary to Slack |
| Mon | 10am | **Weekly Rollover** | Archives the week to Drive, resets the working file for the new week |
| Daily | 7am | **Daily Task Maintenance** | Due-date checks, BLOCKED escalation checks, recurring task generation, archive of old DONE tasks |

The six day tabs (Monday to Saturday) are reset in place by the Monday 10am rollover. You do not create new tabs each week.

The analytics dashboards (ANALYTICS and EXECUTIVE_DASHBOARD) are not on a schedule. They are rebuilt on demand from the menu when you want refreshed numbers. See Section 5 below.

---

## 2. The Weekly Rollover, Monday 10am

This is the most important automation. It runs Monday at 10am and resets the Sakura working file for the new week.

### What it does

1. **Archives last week's working file to Drive.** A full snapshot of the spreadsheet is saved into the configured archive folder. This is the permanent record. Once archived, the working file is safe to clear and reuse.
2. **Updates all six day tabs to the new week's dates.** Monday through Saturday tabs are renamed and their header dates are stamped with the new week.
3. **Clears the manager input cells across all six day tabs.** Cash counts, financials, tips, narratives, tasks, incidents, MOD and staff names: all reset to blank.
4. **Preserves formula cells.** Net Revenue and any other calculated cells are untouched. They continue to recalculate once new data is typed in.
5. **Repairs missing named ranges** if any have drifted out of alignment.

Success is silent. If the rollover fails, an alert is sent to the configured alert email and the failure is logged.

### Cells that get cleared

Manager input across all six day tabs. The rollover clears 22 of the 24 configured fields. The two preserved fields are `netRevenue` (a formula) and any field marked as formula-driven in the configuration.

### Cells that are preserved

Net Revenue and any cell containing a formula. When you start typing fresh data on the new Monday, the formulas continue to work without intervention.

### Verifying rollover ran successfully

On Tuesday morning, run through this short check:

1. Open the Sakura working file.
2. Check the tab dates: the Monday tab should carry this week's Monday date, Tuesday this week's Tuesday, and so on through Saturday.
3. Click into the Monday tab. The manager input cells should be empty. Net Revenue should show $0 or a formula result, not last week's number.
4. Check Google Drive for the archive folder. A spreadsheet snapshot for last week should be present under the current year and month folder.
5. Check the alert email inbox. If no rollover-error email arrived from Monday around 10am, the rollover completed.

If any of these checks fails, see the troubleshooting guide.

---

## 3. What Gets Archived to Drive

The archive folder is configured in Script Properties (`ARCHIVE_ROOT_FOLDER_ID`). Inside it, snapshots are filed by year and year-month.

```
Archive/
  2026/
    2026-05/
      Sakura Shift Report W.E. 18.05.2026
      Sakura Shift Report W.E. 25.05.2026
```

Each archive entry is a full Google Sheets snapshot of the working file at rollover time. That means every formula, every cell, every tab is preserved. You can open an archived week and read it exactly as it appeared on the Sunday night before rollover.

The archive is for audit and historical lookup. You browse it through Drive. If Drive permissions need changing, that is an admin task.

---

## 4. The Revenue Digest, Monday 8am

Two hours before rollover, the system posts a Slack summary of the previous week's revenue numbers.

### What it shows

- Total revenue for the week and percentage change vs the prior week
- Total tips (card plus cash)
- Number of shifts reported
- Best shift of the week
- Day-of-week averages: all-time average revenue per day, this week's actual, and the percentage delta
- Rolling 4-week comparison

Numbers are formatted to whole dollars for readability.

### Where it gets the data

From the central data warehouse, populated nightly by each shift report's send. If a night was not sent, that night's data is missing from the warehouse and the digest will show a gap or a zero for that day.

### What to do if the digest does not post

1. Check the managers Slack channel for a digest message anywhere around Monday 8am.
2. If missing, run it manually from **Shift Report > Admin Tools > Weekly Digest > Send Revenue Digest (LIVE)**. Admin password required.
3. If running manually fails, contact Evan. The digest depends on the warehouse spreadsheet being reachable.

If the digest posted but the numbers look wrong, check that nightly reports were sent for every operating day of the previous week. A missing send means a missing warehouse row, which means a hole in the digest.

---

## 5. Analytics Dashboards (Rebuild on Demand)

The data warehouse holds two dashboard tabs that summarise the venue's performance:

| Dashboard | What it shows |
|---|---|
| **ANALYTICS** | This week, week-over-week comparison, day-of-week averages with standard deviation and a 13-week sparkline, average weekly across all weeks, extended trends, consistency, top and bottom 5 shifts, outliers, recent day-of-week pattern |
| **EXECUTIVE_DASHBOARD** | Current month, monthly trend, rolling 4-week comparison, revenue by day with share bar, this week vs 13-week baseline, insights block (trend, forecast, best and worst shift) |

These dashboards are **not** on a scheduled trigger. They rebuild on demand. To refresh them:

1. Open the data warehouse spreadsheet.
2. Go to **Shift Report > Admin Tools > Integrations & Analytics > Rebuild All Dashboards (Admin)**.
3. Enter the admin password.
4. Wait for the completion message.

The rebuild is safe to run any time. It pulls from the warehouse `NIGHTLY_FINANCIAL` table and rewrites both tabs from scratch.

Do not type into dashboard cells. They are written by the rebuild and any manual input will be overwritten on the next rebuild.

If you want fresh numbers in the dashboards, rebuild. If you do not rebuild, the dashboards show whatever they showed last time they were built.

---

## 6. Daily Task Maintenance, 7am

Every morning at 7am, the task management system runs a daily maintenance pass. It is the routine that keeps the Sakura Actionables spreadsheet usable without anyone tidying it up by hand.

### What it does

- Recalculates `Days Open` for every active task
- Checks for BLOCKED tasks that have been blocked for more than 14 days and escalates them to Evan
- Generates the next occurrence of any task with a Recurrence value (Weekly, Fortnightly, Monthly) when the previous instance is marked DONE
- Archives DONE and CANCELLED tasks older than 8 days into the archive tab
- Posts daily reminders for tasks due today or overdue

### What you will see

If you have tasks due today or overdue, you may receive a Slack notification. The managers Slack channel may also receive escalation alerts for tasks that have been BLOCKED for more than 14 days.

The Sakura Actionables spreadsheet itself updates in place: the active list stays compact, the archive grows in the background, and the dashboard summary reflects current workload.

### If maintenance is not running

You will notice it indirectly: old DONE tasks accumulating at the top of the active list, no escalation alerts when something has been BLOCKED for weeks, recurring tasks not appearing on schedule. If you see any of these, the 7am trigger may not be installed. Ask Evan to verify or run **Task Management > Admin Tools > Setup Triggers > Create Daily Trigger (7am)** manually.

---

## 7. Weekly Active Task Summary, Monday 6am

Every Monday at 6am, the system posts a summary of all open tasks to the managers Slack channel.

### What it shows

- Tasks grouped by status (NEW, TO DO, IN PROGRESS, TO DISCUSS, BLOCKED, DEFERRED, RECURRING)
- Tasks grouped by assignee
- Counts and totals so you can see workload distribution at a glance

### Where it goes

The summary posts to the managers Slack channel only. Direct messages to individual staff were disabled in May 2026; the summary is no longer split into per-person DMs.

### Use it for planning

The Monday 6am summary is a planning tool for the week ahead. Use it to spot who is overloaded, what has been sitting in TO DISCUSS for too long, and which BLOCKED items need attention.

### If the summary does not post

1. Check the managers Slack channel any time after 6am Monday.
2. If missing, run it manually from the Sakura Actionables menu **Task Management > Slack > Send Weekly Active Tasks (LIVE)**. Admin password required.
3. If you want to test without posting to the live channel, use **Send Weekly Active Tasks (TEST to Evan)**.

---

## 8. Triggers and How They Get Lost

After any code deployment (a `clasp push`), Google Apps Script can reset the installed triggers. When this happens, the four automations above stop firing until the triggers are reinstalled.

### How you notice triggers are missing

- Monday 10am passes and rollover did not run
- Monday 8am passes and no digest posted
- Monday 6am passes and no task summary appeared
- The daily 7am task maintenance stops happening (BLOCKED items not escalating, DONE tasks accumulating)
- Someone mentions a recent deployment

### What to do

Reinstall the triggers. Each one has a setup menu item:

- **Rollover (Mon 10am):** Shift Report > Admin Tools > Weekly Rollover (In-Place) > Create Rollover Trigger (Mon 10am)
- **Revenue digest (Mon 8am):** Shift Report > Admin Tools > Weekly Digest > Setup Monday Digest Trigger
- **Daily task maintenance (7am):** Task Management > Admin Tools > Setup Triggers > Create Daily Trigger (7am)
- **Weekly task summary (Mon 6am):** Task Management > Admin Tools > Setup Triggers > Create Weekly Summary Trigger (Mon 6am)

All four require the admin password.

The list of currently installed triggers is visible in the Apps Script editor under **Triggers** in the left sidebar. If you are unsure of the current state, ask Evan to check.

---

## 9. When Automation Breaks

Most automation issues fall into one of three patterns:

1. **The trigger did not fire.** A scheduled run did not happen. Visible symptom: no Slack post, no archive in Drive. Cause: trigger not installed, or destroyed by a recent code deployment. Fix: reinstall the trigger from the menu (Section 8).
2. **The trigger fired but the script failed mid-way.** A partial outcome: rollover renamed tabs but did not clear cells, or the digest posted but with $0. Cause: a transient Google Sheets error, a permission issue, or a missing warehouse row. Fix: run the affected script manually from the menu and watch for the completion message.
3. **The trigger and script succeeded, but the output looks wrong.** Numbers are in the warehouse but the digest shows the wrong figure, or the dashboard looks stale. Cause: data error (a missing nightly send, a wrong cash variance) or a stale dashboard (not rebuilt since the data arrived). Fix: identify the bad row in the warehouse, correct it, then rebuild the dashboards.

For all three patterns, the first action is to tell Evan with the specific symptom (which trigger, what time, what is missing). Most failures are recoverable in under 30 minutes if caught early.

For step-by-step recovery procedures, see the troubleshooting guide.
