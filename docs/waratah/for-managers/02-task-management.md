# Task Management, A Manager's Guide

**Audience:** Venue managers who supervise the Task Management spreadsheet, assign work, monitor progress, and step in when tasks stall.

The Task Management system is the operational backbone for everything that needs doing at the venue: from nightly shift report TO-DOs, to ad-hoc maintenance, to recurring weekly checks. This guide walks through how it works, what each piece does, and what you need to know to keep it healthy.

---

## 1. What This System Does

In one sentence: it is the single canonical list of every open task at the venue, with status, priority, assignee, and due date for each.

https://docs.google.com/spreadsheets/d/1o5gYY4TTEUBkUIRJsJ1AgDVh8cwrPV1COphWzN6ASIU/edit?gid=0#gid=0

Tasks arrive in two ways:

1. **From shift reports.** The MOD types TO-DOs into the daily shift report; when they click Send, those tasks flow automatically into Task Management as new rows with Status = NEW and Source = "Shift Report".
2. **Ad-hoc.** Anything else; an idea, a follow-up, a one-off; with Source = "Ad-hoc".

Once in the system, a task moves through a 9-Status Workflow (Section 4) until it is DONE or CANCELLED. Recurring tasks regenerate themselves on a fixed cadence.

---

## 2. A Separate Spreadsheet

The Task Management spreadsheet is a different Google Sheet from the shift report spreadsheet. They are not the same file. 

https://docs.google.com/spreadsheets/d/1o5gYY4TTEUBkUIRJsJ1AgDVh8cwrPV1COphWzN6ASIU/edit?gid=0#gid=0

Each lives in its own Apps Script project with its own Script Properties.

| Aspect | Shift Report Spreadsheet | Task Management Spreadsheet |
|---|---|---|
| Purpose | Daily nightly reporting | Operational task tracking |
| Tabs | 5 day tabs (Wed to Sun) + Read Me + Analytics + Executive Dashboard | MASTER ACTIONABLES SHEET + Archive + AUDIT LOG + Dashboard |
| Updated by | MOD each night | Managers throughout the week |
| Linked? | Yes, one-way: shift report TO-DOs flow into Task Management |

You open them separately. Bookmark both.

---

## 3. Opening the Task Manager

In the Task Management spreadsheet, click **Task Management > Open Task Manager**. This opens the Task Management spreadsheet's task manager view. (The shift report spreadsheet's Waratah Tools menu does not contain this item; the Task Management menu lives only inside the Task Management spreadsheet.)

The Task Management spreadsheet has two views you will use daily:

- **The MASTER ACTIONABLES SHEET tab** is the raw spreadsheet view. Every row is one task, with columns for status, priority, area, source, description, assignee, dates, and notes.
- **The Dashboard tab** is a read-only summary view: counts by status, counts by assignee, top blockers, and trend charts.

You filter, sort, and edit on the MASTER ACTIONABLES SHEET tab. You glance at the Dashboard tab to see the state of play.

---

## 4. The 9-Status Workflow

A task moves through nine states. Status is a closed-list dropdown in the Status column.

### Active statuses (task is open)

| Status | Meaning | Colour |
|---|---|---|
| **NEW** | Just arrived, not yet triaged | Light blue |
| **TO DO** | Triaged, owner assigned, ready to start | Orange |
| **IN PROGRESS** | Actively being worked on | Yellow |
| **TO DISCUSS** | Needs a conversation with management before it can move | Light purple |
| **BLOCKED** | Cannot proceed; waiting on external dependency | Red |
| **DEFERRED** | Postponed to a future date (manual return to TO DO when ready) | Orange |
| **RECURRING** | A template task that regenerates itself on a cadence | Purple |

### Closed statuses (task is finished)

| Status | Meaning | Colour |
|---|---|---|
| **DONE** | Successfully completed | Green |
| **CANCELLED** | No longer relevant; abandoned | Grey |

A NEW task should move to TO DO within a day of arrival (someone needs to triage and assign it). A TO DO task should move to IN PROGRESS or DEFERRED within a week. Tasks that stay in NEW or TO DO past those thresholds appear on the weekly summary as overdue.

---

## 5. How Tasks Flow Through the System

The normal happy-path journey:

```
NEW → TO DO → IN PROGRESS → DONE
```

The variations:

```
NEW → TO DO → IN PROGRESS → BLOCKED → IN PROGRESS → DONE
NEW → TO DO → DEFERRED → TO DO → IN PROGRESS → DONE
NEW → TO DISCUSS → TO DO → ... 
NEW → CANCELLED (when triage decides not to action)
```

### Automatic transitions

The system makes a few state changes automatically so you do not have to:

| Trigger | Automatic action |
|---|---|
| A task has been BLOCKED for more than 14 days | An escalation email and Slack alert are sent to Evan; status does not change |
| A RECURRING task is marked DONE | A new instance is generated with the next due date |
| A task with no Status defaults to NEW on creation | Used when shift reports push TO-DOs in |

Everything else is manual. You change Status by selecting from the dropdown.

---

## 6. Priority Levels

Tasks have one of five priority levels, set in the Priority column:

| Priority | Use for |
|---|---|
| **URGENT** | Today, blocks service, customer-impact |
| **HIGH** | This week, important not urgent |
| **MEDIUM** | This month, default for most tasks |
| **LOW** | When time permits; nice-to-have |
| **ONE DAY** | Backlog; long-term ideas |

Default for a task arriving from a shift report is MEDIUM. Manager should review priority during weekly triage and adjust if needed.

URGENT tasks are visually highlighted (red background) and sorted to the top of the active list.

---

## 7. What Runs Automatically

Five automation routines keep the Task Management spreadsheet healthy without manual work:

| Routine | Cadence | What it does |
|---|---|---|
| **Bi-hourly cleanup** | Every 2 hours | Removes blank rows and re-sorts tasks by Active/Priority/Status/Staff |
| **Daily staff workload refresh** | Daily at 6am | Recalculates each staff member's open task count for the dashboard |
| **Daily task maintenance** | Daily 6am (Apps Script 6 to 7am window) | Due-date checks, BLOCKED escalation checks, recurring task generation |
| **Monday 6am weekly archive** | Weekly | Moves DONE and CANCELLED tasks older than 30 days to the Archive tab |
| **Monday 10am weekly summary** | Weekly | Sends each staff member a Slack DM with their open tasks for the week |

You do not need to start any of these. They run by themselves once triggers are installed. If they are not running and the Task Management spreadsheet is becoming cluttered, see [`05-troubleshooting.md`](05-troubleshooting.md) Section 3.

---

## 8. Recurring Tasks

Some tasks repeat: "Clean the espresso machine grinder", "Update the wine list", "Order produce from farm". Rather than create them manually each week, mark them RECURRING.

### Setting up a recurring task

1. Create the task as you would any other: description, assignee, priority, area.
2. Set Recurrence (column L) to one of: Weekly, Fortnightly, Monthly.
3. Set the next Due Date to when the next instance should occur.
4. When you mark the current instance DONE, the daily task maintenance run generates the next instance with Status = TO DO and the next due date.

Each generated instance is a separate row with its own Status, so a DONE instance and a TO DO instance can co-exist briefly (the DONE instance is archived after 30 days).

### Editing a recurring task

The original task row holds the cadence in column L. Edit it to change description, default assignee, or cadence. Existing generated instances are not retroactively updated; they keep their original wording.

To stop a recurring task, clear the Recurrence column on the active instance (or set its Status to CANCELLED). No new instances will be generated.

---

## 9. Slack Notifications

The Task Management system posts personal Slack DMs in two situations:

| Situation | Where it posts | Who sees it |
|---|---|---|
| A task is BLOCKED for more than 14 days | Escalation alert via `ESCALATION_SLACK_WEBHOOK` plus escalation email | Adam (escalation recipient) |
| Monday 10am weekly summary | DM to each staff with personal webhook | Six recipients (see [`04-staff-and-recipients.md`](04-staff-and-recipients.md)) |

The current recipient list lives in `WARATAH_EMAIL_RECIPIENTS` and `SLACK_DM_WEBHOOKS` Script Properties. See [`04-staff-and-recipients.md`](04-staff-and-recipients.md) for the canonical list.

The system does not currently send DMs on task creation, on assignee change, on priority change to URGENT, or on due-date arrival. Those are visual-only changes in the spreadsheet.

---

## 10. The Task Dashboard

The Dashboard tab in the Task Management spreadsheet is a one-screen overview. Staff workload data refreshes daily at 6am; the dashboard layout is rebuilt manually via the Task Management menu's admin tools.

### What it shows

- **Total open tasks**, broken down by status
- **Open tasks by assignee**, with name, count, and priority breakdown
- **Top blockers**: the staff or areas with the most BLOCKED tasks
- **Tasks aged over 30 days** by status (a long red flag)
- **Recent activity**: new tasks added in the last 7 days, tasks completed in the last 7 days
- **A simple trend chart** of open task count over the last 8 weeks

### Using the dashboard

Glance daily for two things:

1. **Anyone's open count growing too high?** A single staff member with 20+ open tasks needs help or reassignment.
2. **Anything ageing past 30 days?** Old tasks usually need triage: were they wrong to add, can they be CANCELLED, or do they need escalation?

The dashboard does not change task data, only summarises. To act on what you see, click into the MASTER ACTIONABLES SHEET tab and edit rows.

---

## 11. Common Manager Operations

These are the most common things you will do in Task Management:

### Create a new task

1. Open the Task Management spreadsheet, MASTER ACTIONABLES SHEET tab.
2. Click the first empty row at the bottom and start typing.
3. Fill in: Description, Assignee (from dropdown), Priority, Area, Source.
4. Status defaults to NEW. Leave it there for assignee to triage, or change to TO DO if you want it to start immediately.
5. Save (Cmd+S or just click out of the row).

### Reassign a task

1. Click the assignee cell.
2. Select the new name from the dropdown.
3. The change is recorded in the AUDIT LOG sheet. No DM is sent automatically; if the change is urgent, message the new assignee directly.

### Change priority

1. Click the Priority cell.
2. Select the new level.

URGENT priority changes the row's visual highlight (red background) and sort order. No DM is sent.

### Mark a task as blocked

1. Change Status to BLOCKED.
2. Add a note in the Notes column explaining the blocker.
3. Optionally add a Blocked-By column entry if the blocker is another task.

A BLOCKED task sits there for 14 days before escalation; do not let it sit longer.

### Mark a task as DONE

1. Change Status to DONE.
2. The task remains visible on the active list for 30 days, then moves to the Archive tab on the next Monday 6am archive run.
3. If the task has a Recurrence cadence set, the next instance is generated automatically on the next daily maintenance run.

### Defer a task to a future date

1. Change Status to DEFERRED.
2. Add a note in the Blocker Notes column to record the reason and the date you intend to revisit.
3. When the task is ready to resume, change Status back to TO DO manually. (DEFERRED tasks do not auto-return; the system has no hold-until automation.)

This is the right choice for tasks that need attention but not yet (waiting on a quote, holidays, end-of-month).

---

## 12. Audit Trail

Every task change is recorded in a separate AUDIT LOG sheet inside the Task Management spreadsheet. The MASTER ACTIONABLES SHEET row itself does not store a hidden history; it only carries Date Created, Date Completed, Last Updated, and Updated By alongside the visible task fields.

To inspect a task's history, open the AUDIT LOG tab and filter for the task description or row reference. Audit data is preserved across rollovers and archives.

---

## 13. When to Create a Task (Best Practices)

Not everything that comes up at the venue should be a task. Use Task Management for things that:

- Have a specific outcome and an owner
- Need to be done within a definable timeframe
- Will be visible to other managers and staff

Do NOT use Task Management for:

- General awareness items ("we should remember to..."). Use the manager meeting agenda.
- Permanent processes ("we always check this"). These belong in standard operating procedures, not the task list.
- Personal reminders ("call my supplier on Friday"). Use your own calendar.

The Task Management spreadsheet should hold approximately 50 to 150 open tasks at any time across the venue. If you have more, you have not been triaging fast enough; if you have fewer, you may not be capturing enough.

---

## 14. Integration with Shift Reports

This is the one-way data link. Tasks created in the nightly shift report flow into Task Management automatically. The reverse does not happen; changes you make in Task Management do not flow back to the shift report.

### What flows

When a MOD types a task in the TO-DOs section of a shift report and clicks Send:

- A new row is created in Task Management
- Description = exactly what the MOD typed
- Assignee = the staff name the MOD selected from the dropdown in the shift report
- Status = NEW (initial)
- Priority = MEDIUM (default)
- Area = "General" (default)
- Source = "Shift Report"
- Date Created = the date the report was sent
- Notes = "From shift report: [date]"

### What does not flow

- Marking a task as DONE in Task Management does NOT remove it from the shift report TO-DOs section. The shift report record is permanent.
- Editing the description in Task Management does NOT update the shift report.

This is by design. The shift report is a record of what was decided that night; Task Management is the live tracking system. They diverge intentionally.

### If tasks are missing

If tasks the MOD entered last night are not in Task Management this morning, the sync step failed during the Send. To recover:

1. Open the shift report spreadsheet, navigate to last night's tab.
2. Run **Waratah Tools > Admin Tools > Setup & Utilities > Backfill TO-DOs (All Days)** (requires admin password). This re-pushes the week's TO-DOs to Task Management. Existing rows are not duplicated.

---

## 15. Frequently Asked Questions

**Q: Can I delete a task?**
No, never delete a task row. Always mark it CANCELLED instead. Deletion breaks formulas, audit history, and the dashboard counts. The Archive tab handles long-term storage automatically.

**Q: What if a task fits multiple areas (FOH and Bar)?**
Pick the primary one. The Area column is single-select. Use the Description and Notes to mention the secondary area.

**Q: Can I assign a task to two people?**
No, Assignee is single-select. Either create two tasks (one per person), or assign to a team name (Bar Team, FOH Team) instead.

**Q: How do I make a task urgent overnight?**
Change its Priority to URGENT. The row is highlighted red and sorted to the top of the list. The system does not DM the assignee, so message them directly if it cannot wait until they next open the sheet.

**Q: A staff member is leaving in two weeks. What about their open tasks?**
Reassign each one before they leave. Filter the MASTER ACTIONABLES SHEET by Staff Allocated = their name, then update each row. Once they are reassigned, ask Evan to remove the departing person from the `STAFF_LIST` and from the email and Slack DM recipient lists.

**Q: Why does a DONE task still appear on the active list?**
DONE tasks stay on the active list for 30 days before the Monday 6am archive moves them. This lets managers see recent completions on the dashboard. After 30 days they move to the Archive tab.

**Q: Can I undo a status change?**
Just change it back. There is no undo button, but the AUDIT LOG sheet records every status change. If you change DONE to TO DO by accident, change it back to DONE; the audit log captures both changes.
