# Task Management, A Manager's Guide

**Audience:** Sakura House managers who supervise the Task Management spreadsheet, assign work, monitor progress, and step in when tasks stall.

The Task Management system is the operational backbone for everything that needs doing at Sakura House: from nightly shift report TO-DOs, to ad-hoc maintenance, to recurring weekly checks. This guide walks through how it works, what each piece does, and what you need to know to keep it healthy.

---

## 1. What This System Does

In one sentence: it is the single canonical list of every open task at the venue, with status, priority, assignee, and due date for each.

Tasks arrive in two ways:

1. **From shift reports.** The MOD types TO-DOs into the daily shift report; when they click Send, those tasks flow automatically into Task Management as new rows with Status = NEW and Source = "Shift Report".
2. **Ad-hoc.** Anything else: an idea, a follow-up, a one-off, created directly in the Task Management spreadsheet or via the Task Manager dialog.

Once in the system, a task moves through a nine-status workflow (Section 4) until it is DONE or CANCELLED. Recurring tasks regenerate themselves on a fixed cadence.

---

## 2. A Separate Spreadsheet

The Task Management spreadsheet (the "Sakura Actionables Sheet") is a different Google Sheet from the shift report spreadsheet. They are not the same file.

Each lives in its own Apps Script project with its own Script Properties and its own triggers.

| Aspect | Shift Report Spreadsheet | Task Management Spreadsheet |
|---|---|---|
| Purpose | Daily nightly reporting | Operational task tracking |
| Tabs | 6 day tabs (Mon to Sat) + Read Me + Analytics + Executive Dashboard | MASTER ACTIONABLES SHEET + ARCHIVE + AUDIT LOG + TASK DASHBOARD |
| Updated by | MOD each night | Managers throughout the week |
| Menu label | "Shift Report" | "Task Management" |
| Linked? | Yes, one-way: shift report TO-DOs flow into Task Management |

You open them separately. Bookmark both.

If you change a password or a webhook in the Shift Report's Script Properties, the Task Management sheet is not affected. They are completely independent.

---

## 3. Opening the Task Manager

In the Sakura Actionables Sheet, click **Task Management > Open Task Manager**. A dialog box opens.

The Task Management spreadsheet has two views you will use daily:

- **The MASTER ACTIONABLES SHEET tab** is the raw spreadsheet view. Every row is one task, with columns for status, priority, area, source, description, assignee, dates, and notes.
- **The TASK DASHBOARD tab** is a read-only summary view: counts by status, counts by assignee, top blockers, and trend charts.

You filter, sort, and edit on the MASTER ACTIONABLES SHEET tab. You glance at the TASK DASHBOARD tab to see the state of play.

The Task Manager dialog is optional. Many managers prefer the spreadsheet view directly for scanning many tasks at once.

---

## 4. The Nine-Status Workflow

A task moves through nine states. Status is a closed-list dropdown in the Status column.

### Active statuses (task is open)

| Status | Meaning |
|---|---|
| **NEW** | Just arrived, not yet triaged |
| **TO DO** | Triaged, owner assigned, ready to start |
| **IN PROGRESS** | Actively being worked on |
| **TO DISCUSS** | Needs a conversation with management before it can move |
| **BLOCKED** | Cannot proceed; waiting on external dependency (must include a blocker note) |
| **DEFERRED** | Postponed to a future date (manual return to TO DO when ready) |
| **RECURRING** | A template task that regenerates itself on a cadence |

### Closed statuses (task is finished)

| Status | Meaning |
|---|---|
| **DONE** | Successfully completed |
| **CANCELLED** | No longer relevant; abandoned |

**RECURRING is a status, not a flag.** A task whose Status = RECURRING is the template; when it is marked DONE, a fresh instance is generated using the Recurrence column setting (see Section 8 for how this interacts with the separate Recurrence column).

A NEW task should move to TO DO within a day of arrival. A TO DO task should move to IN PROGRESS or DEFERRED within a week. Tasks that stay in NEW or TO DO past those thresholds will appear on the weekly summary as ageing items.

---

## 5. How Tasks Flow Through the System

The normal happy-path journey:

```
NEW -> TO DO -> IN PROGRESS -> DONE
```

The variations:

```
NEW -> TO DO -> IN PROGRESS -> BLOCKED -> IN PROGRESS -> DONE
NEW -> TO DO -> DEFERRED -> TO DO -> IN PROGRESS -> DONE
NEW -> TO DISCUSS -> TO DO -> ...
NEW -> CANCELLED (when triage decides not to action)
```

### Automatic transitions

The system makes a few state changes automatically so you do not have to:

| Trigger | Automatic behaviour |
|---|---|
| A task has been BLOCKED for more than **14 days** | An escalation email and Slack DM are sent to Evan; status does not change |
| A RECURRING task is marked DONE | A new instance is generated with the next due date |
| A task with no Status defaults to NEW on creation | Used when shift reports push TO-DOs in |
| A task marked DONE or CANCELLED | "Date Completed" column fills in automatically with today's date |
| A task marked BLOCKED | The Blocker Notes cell is highlighted red to prompt a reason |

Everything else is manual. You change Status by selecting from the dropdown.

---

## 6. Priority Levels

Tasks have one of four priority levels, set in the Priority column:

| Priority | Row colour | Sort position | Use for |
|---|---|---|---|
| **URGENT** | Light red | Top | Today; blocks service or has customer impact |
| **HIGH** | Light orange | Second | This week; important but not urgent |
| **MEDIUM** | Light yellow | Third | This month; default for most tasks |
| **LOW** | Light blue | Bottom | When time permits; nice-to-have |

Default for any new task (whether arriving from a shift report or created manually) is MEDIUM. The manager should review priority during weekly triage and adjust if needed.

URGENT tasks are visually highlighted and sorted to the top of the active list.

---

## 7. What Runs Automatically

Two scheduled routines keep the Task Management spreadsheet healthy without manual work:

| Routine | Cadence | What it does |
|---|---|---|
| **Daily task maintenance** | Daily at 7am | Cleans empty rows and re-sorts; processes recurring task regeneration; archives DONE/CANCELLED tasks older than 8 days; checks BLOCKED tasks against the 14-day escalation threshold |
| **Weekly active tasks summary** | Monday at 6am | Posts a Block Kit summary of every open task to the Sakura managers Slack channel |

In addition, an installable **on-edit trigger** runs whenever you change a Status, Priority, or other key cell. It keeps the sheet auto-sorted by Active/Priority/Status/Staff.

You do not need to start any of these. They run by themselves once triggers are installed. If they are not running and the spreadsheet is becoming cluttered, see the troubleshooting guide.

---

## 8. Recurring Tasks

Some tasks repeat: "Check fridge temperatures", "Update the wine list", "Order produce from the farm". Rather than create them manually each week, use the Recurrence column.

### The Recurrence column vs the RECURRING status

These are two different things:

- **Recurrence column (column L)** holds the cadence value: `None`, `Weekly`, `Fortnightly`, or `Monthly`.
- **RECURRING status** marks a template row whose only job is to spawn fresh instances.

A normal task with Recurrence = `Weekly` and Status = `TO DO` will, when marked DONE, generate the next instance. A template-style task can also live at Status = `RECURRING` if you prefer to keep the source row visually distinct from active instances.

### Setting up a recurring task

1. Create the task as you would any other: description, assignee, priority, area.
2. Set the Recurrence column to one of: Weekly, Fortnightly, Monthly.
3. Set the next Due Date to when the next instance should occur.
4. When you mark the current instance DONE, the daily 7am maintenance run generates the next instance with Status = TO DO and the next due date.

### Recurrence cadence rules

- **Weekly** moves the due date forward by 7 days.
- **Fortnightly** moves the due date forward by 14 days.
- **Monthly** moves the due date forward by one calendar month. If that lands on a weekend, the system shifts it to the next Monday.

### Editing a recurring task

The template row holds the cadence in column L. Edit it to change the description, default assignee, or cadence. Existing generated instances are not retroactively updated; they keep their original wording.

To stop a recurring task, set its Recurrence column to `None` (or set Status to CANCELLED). No new instances will be generated.

---

## 9. Slack Notifications

The Task Management system posts to Slack in two situations:

| Situation | Where it posts | Who sees it |
|---|---|---|
| Monday 6am weekly active tasks summary | Sakura managers channel (via `SLACK_MANAGERS_CHANNEL_WEBHOOK`) | All managers in the channel |
| A task is BLOCKED for more than 14 days | Escalation email plus Slack DM to Evan (via `ESCALATION_SLACK_WEBHOOK`) | Evan |

**Individual staff DMs for the weekly summary were disabled in May 2026.** The weekly active tasks summary now posts to the managers channel only. If you used to receive a personal DM each Monday with your own task list, that has been replaced by the single channel post that all managers see.

The system does not currently send notifications on task creation, on assignee change, on priority change to URGENT, or on due-date arrival. Those are visual-only changes in the spreadsheet.

---

## 10. The Task Dashboard

The TASK DASHBOARD tab in the Sakura Actionables Sheet is a one-screen overview. Staff workload data refreshes as part of the daily maintenance; the dashboard layout is rebuilt manually via the Task Management admin tools.

### What it shows

- **Total open tasks**, broken down by status
- **Open tasks by assignee**, with name, count, and priority breakdown
- **Top blockers**: the staff or areas with the most BLOCKED tasks
- **Overdue count**: tasks past their due date
- **Recent activity**: tasks created and completed in the last 7 and 30 days
- **A weekly trend chart** of open task count over the last 8 weeks

### Using the dashboard

Glance daily for two things:

1. **Is anyone's open count growing too high?** A single staff member with 20+ open tasks needs help or reassignment.
2. **Anything ageing past 14 days in BLOCKED, or sitting too long in NEW?** Old tasks usually need triage: were they wrong to add, can they be CANCELLED, or do they need escalation?

The dashboard does not change task data, only summarises. To act on what you see, click into the MASTER ACTIONABLES SHEET tab and edit rows.

If the dashboard looks wrong or is missing, rebuild it via **Task Management > Admin Tools > Dashboard > Build / Rebuild Task Dashboard** (requires the admin password).

---

## 11. Common Manager Operations

These are the most common things you will do in Task Management:

### Create a new task

1. Open the Sakura Actionables Sheet, MASTER ACTIONABLES SHEET tab.
2. Either click **Task Management > Open Task Manager** and use the dialog form, or click the first empty row at the bottom and start typing.
3. Fill in: Description, Staff Allocated (from dropdown), Priority, Area, Due Date.
4. Status defaults to NEW. Leave it there for the assignee to triage, or change to TO DO if you want it to start immediately.
5. Save (Cmd+S or just click out of the row).

### Reassign a task

1. Click the Staff Allocated cell.
2. Select the new name from the dropdown.
3. The change is recorded in the AUDIT LOG sheet. No DM is sent automatically; if the change is urgent, message the new assignee directly.

### Change priority

1. Click the Priority cell.
2. Select the new level.

URGENT priority changes the row's visual highlight and sort order. No DM is sent.

### Mark a task as blocked

1. Change Status to BLOCKED.
2. The Blocker Notes cell turns red. Add a note explaining the blocker: "Waiting for supplier to deliver", "Needs Evan's approval", etc.
3. A BLOCKED task sits for 14 days before escalation. Do not let it sit longer.

### Mark a task as DONE

1. Change Status to DONE.
2. Date Completed fills in automatically.
3. The task remains visible on the active list for 8 days, then moves to the ARCHIVE tab on the next daily maintenance run.
4. If the task has a Recurrence cadence set, the next instance is generated automatically on the next 7am maintenance run.

### Defer a task to a future date

1. Change Status to DEFERRED.
2. Add a note in the Blocker Notes column to record the reason and the date you intend to revisit.
3. When the task is ready to resume, change Status back to TO DO manually. DEFERRED tasks do not auto-return; the system has no hold-until automation.

This is the right choice for tasks that need attention but not yet (waiting on a quote, holidays, end of month).

---

## 12. Staff List

The Staff Allocated dropdown is driven by a fixed list of 12 entries. Names must match exactly.

**Current entries:**

- Evan
- Nick
- Gooch
- Cynthia
- Adam
- Ian
- FOH Team
- Bar Team
- Kitchen Team
- All
- Contractor
- General Management

The team entries (FOH Team, Bar Team, Kitchen Team) and the catch-all entries (All, Contractor, General Management) exist so you can assign a task to a group rather than a specific person.

If a staff member joins or leaves, that change is an admin task: the dropdown list and the `SLACK_DM_WEBHOOKS` Script Property must both be updated. Contact Evan to organise this.

---

## 13. Audit Trail

Every task change is recorded in a separate AUDIT LOG sheet inside the Sakura Actionables Sheet. The MASTER ACTIONABLES SHEET row itself does not store a hidden history; it only carries Date Created, Date Completed, Last Updated, and Updated By alongside the visible task fields.

To inspect a task's history, open the AUDIT LOG tab and filter for the task description or row reference. Audit data is preserved across archives and is never cleared.

---

## 14. When to Create a Task (Best Practices)

Not everything that comes up at the venue should be a task. Use Task Management for things that:

- Have a specific outcome and an owner
- Need to be done within a definable timeframe
- Will be visible to other managers and staff

Do not use Task Management for:

- General awareness items ("we should remember to..."). Use the manager meeting agenda.
- Permanent processes ("we always check this"). These belong in standard operating procedures, not the task list.
- Personal reminders ("call my supplier on Friday"). Use your own calendar.

The Sakura Actionables Sheet should hold approximately 50 to 150 open tasks at any time. If you have more, you have not been triaging fast enough; if you have fewer, you may not be capturing enough.

---

## 15. Integration with Shift Reports

This is the one-way data link. Tasks created in the nightly shift report flow into Task Management automatically. The reverse does not happen; changes you make in Task Management do not flow back to the shift report.

### What flows

When a MOD types a task in the TO-DOs section of a shift report and clicks Send Nightly Report:

- A new row is created in the Sakura Actionables Sheet
- Description = exactly what the MOD typed
- Staff Allocated = the staff name the MOD selected from the dropdown in the shift report
- Status = NEW (initial)
- Priority = MEDIUM (default)
- Area = "General" (default)
- Source = "Shift Report"
- Date Created = the date the report was sent

### What does not flow

- Marking a task as DONE in Task Management does not remove it from the shift report TO-DOs section. The shift report record is permanent.
- Editing the description in Task Management does not update the shift report.

This is by design. The shift report is a record of what was decided that night; Task Management is the live tracking system. They diverge intentionally.

### If tasks are missing

If tasks the MOD entered last night are not in the Sakura Actionables Sheet this morning, the sync step failed during Send. Contact Evan to re-push the night's TO-DOs.

---

## 16. Frequently Asked Questions

**Q: Can I delete a task?**
No, never delete a task row. Always mark it CANCELLED instead. Deletion breaks formulas, audit history, and the dashboard counts. The ARCHIVE tab handles long-term storage automatically (8 days after a task is DONE or CANCELLED).

**Q: What if a task fits multiple areas (FOH and Bar)?**
Pick the primary one. The Area column is single-select. Use the Description and Notes to mention the secondary area.

**Q: Can I assign a task to two people?**
No, Staff Allocated is single-select. Either create two tasks (one per person), or assign to a team name (FOH Team, Bar Team, Kitchen Team) instead.

**Q: How do I make a task urgent overnight?**
Change its Priority to URGENT. The row is highlighted red and sorted to the top of the list. The system does not DM the assignee, so message them directly if it cannot wait until they next open the sheet.

**Q: A staff member is leaving. What about their open tasks?**
Reassign each one before they leave. Filter the MASTER ACTIONABLES SHEET by Staff Allocated = their name, then update each row. Once they are reassigned, ask Evan to update the `STAFF_LIST` and the `SLACK_DM_WEBHOOKS` Script Property.

**Q: Why does a DONE task still appear on the active list?**
DONE tasks stay on the active list for 8 days before the daily 7am maintenance moves them. This lets managers see recent completions on the dashboard. After 8 days they move to the ARCHIVE tab.

**Q: Can I undo a status change?**
Just change it back. There is no undo button, but the AUDIT LOG sheet records every status change. If you change DONE to TO DO by accident, change it back to DONE; the audit log captures both changes.

**Q: What happens if I am blocked on a task for more than 14 days?**
The system escalates it. Evan receives an email and a Slack DM with the task details, the blocker note, and how long it has been blocked. He will reach out to help resolve it. Do not ignore blocks.

**Q: What if a recurring task should stop repeating?**
Set the Recurrence column to `None`. The next time it is marked DONE, no new instance is generated. Or set the active instance's Status to CANCELLED.
