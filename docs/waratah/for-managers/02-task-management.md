# Task Management, A Manager's Guide

**Audience:** Venue managers who supervise the Task Management spreadsheet, assign work, monitor progress, and step in when tasks stall.

The Task Management system is the operational backbone for everything that needs doing at the venue: from nightly shift report TO-DOs, to ad-hoc maintenance, to recurring weekly checks. This guide walks through how it works, what each piece does, and what you need to know to keep it healthy.

---

## 1. What This System Does

In one sentence: it is the single canonical list of every open task at the venue, with status, priority, assignee, and due date for each.

Tasks arrive in three ways:

1. **From shift reports.** The MOD types TO-DOs into the daily shift report; when they click Send, those tasks flow automatically into Task Management as new rows with Status = NEW and Source = "Shift Report".
2. **From meetings.** When a task comes out of a manager meeting, you add it directly to the spreadsheet with Source = "Meeting".
3. **Ad-hoc.** Anything else; an idea, a follow-up, a one-off; with Source = "Ad-hoc".

Once in the system, a task moves through a 9-state workflow (Section 4) until it is DONE or CANCELLED. Recurring tasks regenerate themselves on a fixed cadence.

---

## 2. A Separate Spreadsheet

The Task Management spreadsheet is a different Google Sheet from the shift report spreadsheet. They are not the same file. Each lives in its own Apps Script project with its own Script Properties.

| Aspect | Shift Report Spreadsheet | Task Management Spreadsheet |
|---|---|---|
| Purpose | Daily nightly reporting | Operational task tracking |
| Tabs | 5 day tabs (Wed to Sun) + Read Me + Task Management + Analytics + Executive Dashboard | Tasks + Archive + Staff Workload Summary + Dashboards |
| Updated by | MOD each night | Managers throughout the week |
| Linked? | Yes, one-way: shift report TO-DOs flow into Task Management |

You open them separately. Bookmark both.

---

## 3. Opening the Task Manager

From either spreadsheet, click **The Waratah Tools > Open Task Manager**. This opens the Task Management spreadsheet in a new browser tab.

The Task Management spreadsheet has two views you will use daily:

- **The Tasks tab** is the raw spreadsheet view. Every row is one task, with columns for status, priority, area, source, description, assignee, dates, and notes.
- **The Task Dashboard tab** is a read-only summary view: counts by status, counts by assignee, top blockers, and trend charts.

You filter, sort, and edit on the Tasks tab. You glance at the Dashboard tab to see the state of play.

---

## 4. The 9-Status Workflow

A task moves through nine states. Status is a closed-list dropdown in the Status column.

### Active statuses (task is open)

| Status | Meaning | Colour |
|---|---|---|
| **NEW** | Just arrived, not yet triaged | Light blue |
| **TO DO** | Triaged, owner assigned, ready to start | White |
| **IN PROGRESS** | Actively being worked on | Yellow |
| **TO DISCUSS** | Needs a conversation with management before it can move | Light purple |
| **BLOCKED** | Cannot proceed; waiting on external dependency | Red |
| **DEFERRED** | Postponed to a specific date; will auto-return to TO DO when that date arrives | Orange |
| **RECURRING** | A template task that regenerates itself on a cadence | Light green |

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
| A DEFERRED task's hold-until date arrives | Status auto-transitions back to TO DO |
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

URGENT tasks trigger an immediate Slack DM to the assignee, not just the weekly summary.

---

## 7. What Runs Automatically

Five automation routines keep the Task Management spreadsheet healthy without manual work:

| Routine | Cadence | What it does |
|---|---|---|
| **Bi-hourly status cleanup** | Every 2 hours during business hours | Validates Status column, advances DEFERRED tasks past their hold date, ensures dropdowns stay consistent |
| **Daily 6am staff workload refresh** | Daily at 6am | Recalculates each staff member's open task count for the dashboard |
| **Daily 7am task maintenance** | Daily at 7am | Due-date checks, BLOCKED escalation checks, recurring task generation |
| **Monday 6am weekly archive** | Weekly | Moves DONE and CANCELLED tasks older than 7 days to the Archive tab |
| **Monday 10am weekly summary** | Weekly | Sends each staff member a Slack DM with their open tasks for the week |

You do not need to start any of these. They run by themselves once triggers are installed. If they are not running and the Task Management spreadsheet is becoming cluttered, see [`05-troubleshooting.md`](05-troubleshooting.md) Section 3.

---

## 8. Recurring Tasks

Some tasks repeat: "Clean the espresso machine grinder", "Update the wine list", "Order produce from farm". Rather than create them manually each week, mark them RECURRING.

### Setting up a recurring task

1. Create the task as you would any other: description, assignee, priority, area.
2. Set Status = RECURRING.
3. Set Recurrence (column M) to one of: Weekly, Fortnightly, Monthly.
4. Set the next Due Date to when the next instance should occur.

The system generates the next instance automatically when the current one is marked DONE, or on a scheduled date. Each instance is a separate row with its own Status, so you can have a DONE instance and a TO DO instance simultaneously.

### Editing a recurring task

The RECURRING row is the template. Edit it to change description, default assignee, or cadence. Existing TO DO instances are not retroactively updated; they keep their original wording.

To stop a recurring task, change its Status from RECURRING to CANCELLED. No new instances will be generated.

---

## 9. Slack Notifications

The Task Management system posts to Slack in five situations:

| Situation | Where it posts | Who sees it |
|---|---|---|
| A new task is assigned to a person | DM to the assignee | Just the assignee |
| A task is marked URGENT | DM to the assignee | Just the assignee |
| A task is BLOCKED for more than 14 days | Channel post + DM to Evan | Managers channel + Evan |
| A task with a due date hits its due date | DM to the assignee | Just the assignee |
| Monday 10am weekly summary | DM to each staff with personal webhook | Six recipients (see [`04-staff-and-recipients.md`](04-staff-and-recipients.md)) |

Of the seven named staff (Evan, Cynthia, Adam, Jaiden, Joffy, Nick, Howie), six receive personal DMs. Howie does not have a personal DM webhook by choice; he monitors the `#waratah-tasks` channel instead. Tasks assigned to Howie therefore only show up in the channel, not as personal DMs.

For tasks assigned to team-level names (Bar Team, Kitchen Team, FOH Team, General Management), no DM is sent; instead a channel post goes to the relevant area channel.

---

## 10. The Task Dashboard

The Task Dashboard tab in the Task Management spreadsheet is a one-screen overview. It updates automatically every 2 hours (and you can force a refresh from the menu).

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

The dashboard does not change task data, only summarises. To act on what you see, click into the Tasks tab and edit rows.

---

## 11. Common Manager Operations

These are the most common things you will do in Task Management:

### Create a new task

1. Open the Task Management spreadsheet, Tasks tab.
2. Click the first empty row at the bottom (or use **Waratah Tools > New Task**).
3. Fill in: Description, Assignee (from dropdown), Priority, Area, Source.
4. Status defaults to NEW. Leave it there for assignee to triage, or change to TO DO if you want it to start immediately.
5. Save (Cmd+S or just click out of the row).

### Reassign a task

1. Click the assignee cell.
2. Select the new name from the dropdown.
3. The previous assignee receives an "unassigned from task X" DM; the new assignee receives an "assigned task X" DM.

### Change priority

1. Click the Priority cell.
2. Select the new level.

If you raise to URGENT, the assignee gets a fresh DM. Lowering does not generate a notification.

### Mark a task as blocked

1. Change Status to BLOCKED.
2. Add a note in the Notes column explaining the blocker.
3. Optionally add a Blocked-By column entry if the blocker is another task.

A BLOCKED task sits there for 14 days before escalation; do not let it sit longer.

### Mark a task as DONE

1. Change Status to DONE.
2. The task remains visible on the active list for 7 days, then moves to the Archive tab on Monday 6am.
3. If it was a RECURRING task instance, the next instance is generated automatically.

### Defer a task to a future date

1. Change Status to DEFERRED.
2. Set Hold-Until date (column N).
3. The system will auto-transition the task back to TO DO on that date.

This is the right choice for tasks that need attention but not yet (waiting on a quote, holidays, end-of-month).

---

## 12. Audit Trail

Every task change is logged. Each row has hidden columns capturing:

- Date Created
- Created By (user email)
- Date Last Modified
- Modified By (user email)
- Status History (last 5 status changes with timestamps)

You can unhide these columns from the View menu if you need to audit a task's history. Audit data is read-only and is preserved across rollovers and archives.

The full Change Log tab (separate from Tasks) records every status change across all tasks for historical analysis.

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
- Area = blank
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
2. Run **Waratah Tools > Re-sync Tasks** (requires admin password). This re-pushes that night's TO-DOs to Task Management. Existing rows are not duplicated.

---

## 15. Frequently Asked Questions

**Q: Can I delete a task?**
No, never delete a task row. Always mark it CANCELLED instead. Deletion breaks formulas, audit history, and the dashboard counts. The Archive tab handles long-term storage automatically.

**Q: What if a task fits multiple areas (FOH and Bar)?**
Pick the primary one. The Area column is single-select. Use the Description and Notes to mention the secondary area.

**Q: Can I assign a task to two people?**
No, Assignee is single-select. Either create two tasks (one per person), or assign to a team name (Bar Team, FOH Team) instead.

**Q: How do I make a task urgent overnight?**
Change its Priority to URGENT. The assignee receives a DM immediately. The next morning, follow up with them directly.

**Q: A staff member is leaving in two weeks. What about their open tasks?**
Reassign each one before they leave. Filter Tasks by Assignee = their name, then update each row. Reassigning generates DMs to the new assignee. Once they are reassigned, ask Evan to remove the departing person from the `STAFF_LIST` and from the email and Slack DM recipient lists.

**Q: Why does a DONE task still appear on the active list?**
DONE tasks stay on the active list for 7 days before the Monday 6am archive moves them. This lets managers see the recent week's completions on the dashboard. After 7 days they move to the Archive tab.

**Q: Can I undo a status change?**
Just change it back. There is no undo button per se, but the Status History column captures the change. If you change DONE to TO DO by accident, change it back to DONE; the audit log records both changes.
