# Weekly Automation, A Manager's Guide

**Audience:** Venue managers who want to understand what the system does on its own each week, so they recognise when the rhythm is broken.

The Waratah system automates a cluster of weekly and daily routines so managers do not have to remember them. This guide tells you what runs, when, what each one does, and how to spot when one has failed.

A note on the current state (May 2026, Phase 1.3): the codebase has been overhauled and the scheduled triggers may not yet be installed. Until Evan completes setup, the routines below need to be triggered manually from the menu. The cadence and behaviour described are what they will do once triggers are in place.

---

## 1. Weekly Schedule at a Glance

| Day | Time | Routine | What it does |
|---|---|---|---|
| Mon | 2am | **Weekly Backfill** | Re-pushes any missed nightly data into the warehouse |
| Mon | 6am | **Weekly Task Archive** | Moves completed and cancelled tasks older than 7 days into the archive tab |
| Mon | 10am | **Weekly Active Task Summary** | Sends a DM to each staff member with their open tasks for the week |
| Mon | 4pm | **Revenue Digest** | Posts the week's revenue summary to Slack |
| Mon | 9pm | **Weekly Rollover** | Archives the week, resets the spreadsheet for new week |
| Daily | 6am | **Daily Staff Workload Refresh** | Recalculates each staff member's open task count |
| Daily | 7am | **Daily Task Maintenance** | Bi-hourly status cleanup, due-date checks, escalation checks |
| Ongoing | every 2 hours | **Status Cleanup** | Ensures task statuses stay consistent across the spreadsheet |

The day tabs (Wednesday to Sunday) for each new week are created automatically by the Weekly Rollover. You do not need to add them.

---

## 2. The Weekly Rollover, Monday 9pm

This is the most important automation. It runs Monday at 9pm and does five things in sequence.

### What it does

1. **Generates a PDF of the full week.** The Wednesday-through-Sunday data is compiled into one PDF report and emailed to the six recipients (Evan, Cynthia, Nick, Chef, Howie, Adam).
2. **Saves a copy of the spreadsheet to Drive.** A snapshot of the entire shift report spreadsheet (all tabs, all data) is saved to the configured Drive folder. This is the permanent record. Once archived, the original sheet is free to be cleared and reused.
3. **Renames the day tabs for the new week.** The Wednesday tab is renamed to next Wednesday's date, and so on through Sunday. The dates in the headers of each tab are updated too.
4. **Clears the manager input cells.** All cells where the MOD types data each night (cash counts, financials, narratives, tasks, incidents) are emptied. Formula cells and label cells are untouched.
5. **Posts a Slack confirmation.** A short message is posted to the manager channels saying the rollover completed, and listing what was archived.

### Cells that get cleared

Manager input cells across all five day tabs. Specifically: cash counts and refloats (both tills), six card expense lines, production amount, function deposit, card tips, cash tips, the five narrative fields (Shift Report, VIPs, Good, Bad, Kitchen), 16 task rows, three incident fields (wastage, maintenance, RSA), MOD name, staff name.

### Cells that are preserved

Anything starting with `=` is a formula and is not touched. This means net revenue, total tips, gross sales, total adjustments, total discounts, all of the auto-calculated totals remain as formulas pointing at their input cells. When you start typing fresh data on the new Wednesday, the formulas continue to work.

### Verifying rollover ran successfully

On Tuesday morning, run through this short check:

1. Open the shift report spreadsheet.
2. Check the tab names: the leftmost tab should say "Wednesday" and the date should be this week's Wednesday.
3. Click on the Wednesday tab. The manager input cells should be empty.
4. Check the Slack manager channels: a rollover confirmation should be visible from Monday around 9pm.
5. Check Google Drive (the archive folder): a PDF and spreadsheet copy for last week should be present.

If any of these five checks fails, see [`05-troubleshooting.md`](05-troubleshooting.md) Section 6.

---

## 3. What Gets Archived to Drive

The Drive archive folder contains one subfolder per week, named with the year and ISO week number (`2026-W17`, `2026-W18`, and so on). Inside each weekly folder:

- **`Waratah_Week_YYYY-MM-DD.pdf`**: the full-week PDF report
- **`Waratah_Shift_Report_YYYY-MM-DD.gsheet`**: a Google Sheets copy of the entire shift report spreadsheet, snapshot at rollover time
- **`Waratah_Tasks_YYYY-MM-DD.gsheet`** (if the task archive ran that week): a copy of completed tasks archived that week

The PDF is the primary archive. The full spreadsheet copy is for audit purposes; you may need it if a discrepancy is questioned weeks later.

The Drive folder ID is stored in a Script Property. As a manager you can browse the folder but you cannot reconfigure it. If Drive permissions need changing, that is an admin task.

---

## 4. The Revenue Digest, Monday 4pm

Five hours before rollover, the system posts a Slack summary of the just-finished week's revenue numbers.

### What it shows

- Total net revenue for the week (Wed to Sun, summed)
- Each day's net revenue with day-of-week label
- Card tips total, cash tips total, total tips
- Number of services that night (cover counts if recorded)
- Comparison to the previous week (delta in dollars and percentage)

### Where it gets the data

From the central data warehouse, which is populated nightly by each shift report's send. If a night was not sent, that night's data is missing and the digest will show a gap or a zero. This is one reason the Monday 2am backfill exists.

### What to do if the digest does not post

1. Check the manager Slack channels for a digest message anywhere around Monday 4pm.
2. If missing, run it manually from **Waratah Tools > Admin Tools > Run Revenue Digest Now** (requires admin password).
3. If running manually fails, contact Evan. The digest depends on the warehouse spreadsheet being reachable.

---

## 5. Analytics Dashboards (Real-Time)

Two dashboard tabs in the shift report spreadsheet update automatically as data flows in:

| Dashboard | What it shows |
|---|---|
| **ANALYTICS** | This week's numbers, week-on-week trends, day-of-week heatmap, extended 4-week trends |
| **EXECUTIVE_DASHBOARD** | Current month rolling, monthly trend, rolling 4-week, revenue by day |

The dashboards are read-only views. Do not type into the cells; they recompute from the warehouse. If the dashboards look stale or numbers seem wrong, run **Waratah Tools > Admin Tools > Rebuild All Dashboards** which forces a refresh.

The dashboards are the primary tool managers use to spot trends. A drop in same-day-of-week revenue, an unusual tip-share, a discount spike are all visible at a glance on these tabs.

---

## 6. Daily 6am Staff Workload Refresh

Every morning at 6am, the system recalculates each staff member's open task count and updates a summary tab in the Task Management spreadsheet. This is used by:

- The Task Dashboard summary (shows tasks per staff member)
- The Monday 10am weekly active task summary DMs
- Internal weight-balancing of new tasks

You do not interact with this directly. It runs in the background. If a staff member's task count looks visibly wrong on the dashboard, run **Waratah Tools > Refresh Dashboard** to force a manual recalculation.

---

## 7. Weekly Task Maintenance

Three task-related routines run weekly to keep the Task Management spreadsheet tidy.

### Monday 6am, Weekly Task Archive

Completed and cancelled tasks older than 7 days are moved from the active task list into the Archive tab. The archive is permanent; you can search it. The active list stays under a few hundred rows, which keeps the dashboard fast.

### Monday 10am, Weekly Active Task Summary DM

Each staff member with open tasks receives a Slack DM listing their open tasks for the upcoming week. The DM goes only to staff with a personal Slack DM webhook (six people, see [`04-staff-and-recipients.md`](04-staff-and-recipients.md) Section 3). Howie does not receive this; he monitors the managers channel instead.

The summary is DM-only as of April 2026. It no longer posts to the managers channel; it goes only as private DMs.

### Bi-hourly Status Cleanup (running constantly)

Every two hours during business hours, the system runs a light cleanup pass: ensures status columns are consistent, auto-progresses DEFERRED tasks past their hold dates to TO DO, marks RECURRING task instances as DONE when the next instance is generated.

You will not see this routine running, but it is the reason the Task Management spreadsheet stays clean without manual intervention.

---

## 8. Monday 2am Weekly Backfill

The safety net. At 2am Monday, before the digest and rollover, the system re-scans the previous week's shift report spreadsheet and re-pushes any night's data that did not land in the warehouse.

### Why this exists

If the warehouse write step failed on a particular night (Slack outage, network blip, Google Sheets temporarily unreachable), tonight's numbers might be missing from the warehouse even though Slack and email succeeded. Without backfill, the weekly digest would show a hole. Backfill catches this automatically.

### What it does

For each day tab Wed to Sun, the script reads the entered values, checks the warehouse, and appends the row if it is missing. Duplicate-prevention ensures it does not double-write a night that is already there.

### What to do if backfill is needed mid-week

If a single night's data did not write (you noticed Wednesday's row missing on Thursday morning), do not wait for Monday. Run **Waratah Tools > Admin Tools > Backfill Tonight to Warehouse** for the specific night, or **Backfill Entire Week** for everything. Both require admin password.

---

## 9. Trigger Installation Status (May 2026)

Phase 1.3 of the Waratah codebase, completed 2026-05-17, refactored the system to use named ranges and reorganised the trigger functions. As of that date, the scheduled triggers themselves had not yet been re-installed on the new code.

This means:

- The weekly rollover, Monday digest, Monday backfill, Monday task archive and summary, daily refreshes: none of these run automatically until Evan installs the triggers.
- Until then, run each manually from the **Waratah Tools > Admin Tools** submenu (requires admin password).

This is a transitional state. Once Evan installs the triggers, the cadence in this document is what runs without intervention.

If you are unsure of the current trigger status, ask Evan. The list of triggers is visible in the Apps Script editor under **Triggers** in the left sidebar.

---

## 10. When Automation Breaks

Most automation issues fall into one of three patterns:

1. **The trigger did not fire.** A scheduled run did not happen. Visible symptom: no Slack confirmation, no archive in Drive. Cause: trigger not installed, or destroyed by a recent code deployment. Fix: re-install triggers (admin task).
2. **The trigger fired but the script failed mid-way.** A partial outcome: rollover renamed tabs but did not clear cells. Cause: a transient Google Sheets error, or a permission issue. Fix: re-run the affected script manually.
3. **The trigger and script succeeded, but the output is wrong.** Data is in the warehouse but the digest shows the wrong number. Cause: data error (a wrong cash variance, a missing field). Fix: identify the bad row, correct the warehouse value, re-run the digest.

For all three patterns, the first action is to alert Evan with the specific symptom. Most failures are recoverable in under 30 minutes if caught early.

For step-by-step recovery procedures, see [`05-troubleshooting.md`](05-troubleshooting.md).
