# Task Management Internals

**Audience:** Developers modifying `EnhancedTaskManagementWaratah.gs` or any of the sibling files in the Task Management project.

This file is the code-level reference for the Task Management system. For the manager view of the same system, see [`/docs/waratah/for-managers/02-task-management.md`](../for-managers/02-task-management.md).

---

## 1. File Layout

`THE WARATAH/TASK MANAGEMENT SCRIPTS/`

| File | Lines (approx) | Responsibility |
|---|---|---|
| `EnhancedTaskManagementWaratah.gs` | ~2,200 | The system. State machine, escalation, recurring, maintenance, triggers. |
| `TaskDashboardWaratah.gs` | ~800 | Read-only dashboard builder (counts, breakdowns, trends). |
| `Menu_Updated_Waratah.gs` | ~600 | Spreadsheet menu, password gating, admin tools. |
| `UIServerWaratah.gs` | ~400 | Backend for the task manager HTML dialog. |
| `SlackBlockKitWaratah.gs` | ~500 | Block Kit builders for task DMs and channel posts. |
| `_SETUP_ScriptProperties.gs` | ~200 | One-shot setup for Task Management Script Properties (6 props). |

Plus `task-manager.html` (the modal task creation dialog) and `appsscript.json`.

---

## 2. Configuration Constants

All in `EnhancedTaskManagementWaratah.gs`, lines 84-300.

### `TASK_CONFIG`

```javascript
const TASK_CONFIG = {
  sheets: {
    master: "MASTER ACTIONABLES SHEET",
    audit: "AUDIT LOG",
    archive: "ARCHIVE"
  },
  timezone: "Australia/Sydney",
  escalation: {
    blockedDaysBeforeEscalate: 14,
    escalateToName: "Evan"
  },
  archive: {
    daysBeforeArchive: 30
  }
};
```

Note: `daysBeforeArchive` is **30 days**, not 7 or 8 as some legacy documentation states. Tasks that are DONE or CANCELLED for 30 days are moved from MASTER ACTIONABLES SHEET to ARCHIVE.

### Column layout (`COLS`)

```javascript
const COLS = {
  PRIORITY: 0,         // A
  STATUS: 1,           // B
  STAFF: 2,            // C
  AREA: 3,             // D
  DESCRIPTION: 4,      // E
  DUE_DATE: 5,         // F
  DATE_CREATED: 6,     // G
  DATE_COMPLETED: 7,   // H
  DAYS_OPEN: 8,        // I (formula)
  BLOCKER_NOTES: 9,    // J
  SOURCE: 10,          // K
  RECURRENCE: 11,      // L
  LAST_UPDATED: 12,    // M
  UPDATED_BY: 13       // N
};
const TOTAL_COLS = 14;
```

The order matters. Some legacy documentation lists Status as column A and Priority as column B; **the code is the source of truth**. Column A is Priority, column B is Status.

---

## 3. Domain Enums

### `STATUSES` (9 states)

```javascript
const STATUSES = {
  NEW: "NEW",
  TODO: "TO DO",
  IN_PROGRESS: "IN PROGRESS",
  TO_DISCUSS: "TO DISCUSS",
  BLOCKED: "BLOCKED",
  DEFERRED: "DEFERRED",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
  RECURRING: "RECURRING"
};

const STATUS_LIST = [
  STATUSES.NEW,
  STATUSES.TODO,
  STATUSES.IN_PROGRESS,
  STATUSES.TO_DISCUSS,
  STATUSES.BLOCKED,
  STATUSES.DEFERRED,
  STATUSES.DONE,
  STATUSES.CANCELLED,
  STATUSES.RECURRING
];

const ACTIVE_STATUSES = [
  STATUSES.NEW, STATUSES.TODO, STATUSES.IN_PROGRESS,
  STATUSES.TO_DISCUSS, STATUSES.BLOCKED, STATUSES.DEFERRED
];

const RECURRENCE_ELIGIBLE_STATUSES = [
  STATUSES.TODO, STATUSES.IN_PROGRESS,
  STATUSES.TO_DISCUSS, STATUSES.DEFERRED, STATUSES.RECURRING
];
```

**Important:** `TO_DISCUSS` is in the code. Some legacy documentation omits it. The state machine has 9 states.

Each status has an emoji and a colour mapped via `STATUS_EMOJI` and `STATUS_COLORS` for the dashboard.

### `PRIORITIES` (5 levels)

```javascript
const PRIORITIES = {
  URGENT: "URGENT",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  ONE_DAY: "ONE DAY"
};

const PRIORITY_LIST = [
  PRIORITIES.URGENT,
  PRIORITIES.HIGH,
  PRIORITIES.MEDIUM,
  PRIORITIES.LOW,
  PRIORITIES.ONE_DAY
];
```

**Important:** `ONE_DAY` is in the code. Some legacy documentation omits it. The dropdown has 5 priorities.

### `AREAS` (10 categories)

```javascript
const AREAS = [
  "FOH", "BOH", "Bar", "Kitchen",
  "Admin", "Maintenance", "Marketing",
  "Events", "Training", "General"
];
```

### `SOURCES` (3 origins)

```javascript
const SOURCES = ["Shift Report", "Meeting", "Ad-hoc"];
```

### `RECURRENCE_OPTIONS`

```javascript
const RECURRENCE_OPTIONS = ["None", "Weekly", "Fortnightly", "Monthly"];
```

### `STAFF_LIST` (14 assignees)

```javascript
const STAFF_LIST = [
  "Evan", "Cynthia", "Adam", "Jaiden", "Joffy",
  "Bar Team", "Nick", "Howie",
  "Kitchen Team", "All", "Contractor",
  "FOH Team", "General Management", "Marketing Explicit"
];
```

7 named individuals + 5 team-level + 2 catch-all. The dropdown rule `setAllowInvalid(false)` enforces this list strictly.

---

## 4. The Status State Machine

The state machine is implicit in the spreadsheet (the Status column is a dropdown) but the transition rules are enforced by the `onTaskSheetEditWithAutoSort` handler.

### Allowed transitions

```
NEW → TO DO | TO DISCUSS | CANCELLED
TO DO → IN PROGRESS | TO DISCUSS | BLOCKED | DEFERRED | DONE | CANCELLED
IN PROGRESS → BLOCKED | DEFERRED | DONE | CANCELLED | TO DISCUSS
TO DISCUSS → TO DO | IN PROGRESS | CANCELLED
BLOCKED → IN PROGRESS | DEFERRED | DONE | CANCELLED
DEFERRED → TO DO | IN PROGRESS | CANCELLED (auto-returns to TO DO on hold-until date)
DONE → (terminal; can be reactivated by changing to any active status)
CANCELLED → (terminal; can be reactivated)
RECURRING → (this is a template; generates instances; cannot transition)
```

In practice the system does not block any transition; it allows the dropdown to accept any value. The state machine is therefore advisory rather than enforced. The escalation logic and daily maintenance check are what enforce hygiene over time.

### Automatic transitions

| Trigger | Auto-action |
|---|---|
| Task marked DONE | Date Completed set to today; Days Open recomputed |
| Task transitions FROM DONE back to active | Date Completed cleared |
| Task marked CANCELLED | Date Completed set to today |
| DEFERRED task's hold-until date passes | Status auto-transitions to TO DO (daily maintenance) |
| RECURRING task marked DONE | New instance generated (Section 6) |

---

## 5. Auto-Escalation Algorithm

`escalateBlockedTasks_()` runs as part of `runDailyTaskMaintenance` each morning at 7am.

```javascript
function escalateBlockedTasks_() {
  const sheet = getMasterActionablesSheet_();
  const data = sheet.getDataRange().getValues();
  const today = new Date();
  const threshold = TASK_CONFIG.escalation.blockedDaysBeforeEscalate; // 14

  const tasksToEscalate = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[COLS.STATUS] !== STATUSES.BLOCKED) continue;

    const lastUpdated = row[COLS.LAST_UPDATED] || row[COLS.DATE_CREATED];
    const daysBlocked = daysBetween_(lastUpdated, today);

    if (daysBlocked >= threshold) {
      tasksToEscalate.push({
        rowIndex: i + 1,
        priority: row[COLS.PRIORITY],
        assignee: row[COLS.STAFF],
        description: row[COLS.DESCRIPTION],
        blockerNotes: row[COLS.BLOCKER_NOTES],
        daysBlocked: daysBlocked
      });
    }
  }

  if (tasksToEscalate.length === 0) {
    Logger.log("No blocked tasks require escalation.");
    return;
  }

  // Build Block Kit message
  const blockKit = buildEscalationBlockKit_(tasksToEscalate);
  postToSlack_(getEscalationSlackWebhook_(), blockKit);

  // Send HTML email
  const htmlBody = composeEscalationEmail_(tasksToEscalate);
  GmailApp.sendEmail(getEscalationEmail_(), 'Waratah: BLOCKED tasks escalation', '', { htmlBody });

  // Audit
  logAuditEntry_('ESCALATION', 'System', `Escalated ${tasksToEscalate.length} blocked tasks to Evan`);
}
```

The escalation does NOT change the task's status. It alerts; the assignee decides whether to unblock, defer, or cancel.

The threshold (14 days) and recipient (Evan) come from `TASK_CONFIG`. Editable in code, not via Script Properties (Script Properties point at webhook and email; the threshold and recipient name are config).

---

## 6. Recurring Task Generation

`processRecurringTasks_()` runs as part of daily maintenance. It looks for RECURRING-status template tasks and generates instances on schedule.

```javascript
function processRecurringTasks_() {
  const sheet = getMasterActionablesSheet_();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[COLS.STATUS] !== STATUSES.RECURRING) continue;

    const recurrence = row[COLS.RECURRENCE];
    if (!recurrence || recurrence === 'None') continue;

    const lastGenerated = row[COLS.LAST_UPDATED] || row[COLS.DATE_CREATED];
    const nextDueDate = computeNextOccurrence_(lastGenerated, recurrence);

    if (nextDueDate > new Date()) continue; // Not yet due

    // Generate the new instance
    sheet.appendRow([
      row[COLS.PRIORITY],
      STATUSES.TODO,                       // Instance starts as TO DO
      row[COLS.STAFF],
      row[COLS.AREA],
      row[COLS.DESCRIPTION],
      toDateOnly_(nextDueDate),            // Due Date
      toDateOnly_(new Date()),             // Date Created
      '',                                  // Date Completed (blank)
      '',                                  // Days Open (formula)
      '',                                  // Blocker Notes
      row[COLS.SOURCE],
      row[COLS.RECURRENCE],
      toDateOnly_(new Date()),             // Last Updated
      'System (recurring generator)'
    ]);

    // Update template's Last Updated
    sheet.getRange(i + 1, COLS.LAST_UPDATED + 1).setValue(toDateOnly_(new Date()));

    logAuditEntry_('RECURRING_GENERATED', 'System', `Generated instance for ${row[COLS.DESCRIPTION]}`);
  }
}
```

### `computeNextOccurrence_` helper

```javascript
function computeNextOccurrence_(lastDate, recurrence) {
  const base = new Date(lastDate);
  switch (recurrence) {
    case 'Weekly':      return getNextMonday_(base, 1);
    case 'Fortnightly': return getNextMonday_(base, 2);
    case 'Monthly':     return new Date(base.getFullYear(), base.getMonth() + 1, base.getDate());
    default:            return null;
  }
}

function getNextMonday_(fromDate, weeksAhead) {
  const d = new Date(fromDate);
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon
  const daysToNextMonday = (1 - dayOfWeek + 7) % 7 || 7;
  d.setDate(d.getDate() + daysToNextMonday + (weeksAhead - 1) * 7);
  return d;
}
```

Weekly and fortnightly recurrences anchor to Monday; monthly anchors to the same day-of-month as the previous instance.

The RECURRING template task itself is never marked DONE; it stays at RECURRING permanently, regenerating instances. To stop a recurrence, change the template's Status to CANCELLED.

---

## 7. Audit Trail

The AUDIT LOG sheet records every status change and significant event. Schema:

| Column | Header | Purpose |
|---|---|---|
| A | Timestamp | `new Date()` at log time |
| B | Action | Enum: STATUS_CHANGE, ESCALATION, RECURRING_GENERATED, ARCHIVE, CREATED, DELETED, ERROR |
| C | User | Email of the user who triggered the action (or "System") |
| D | Task ID | Row index in MASTER ACTIONABLES SHEET |
| E | Field | Which column changed (for STATUS_CHANGE only) |
| F | Details | Free-text description |

### `logAuditEntry_` helper

```javascript
function logAuditEntry_(action, user, details, taskId, fieldChanged) {
  const sheet = getAuditLogSheet_();
  sheet.appendRow([
    new Date(),
    action,
    user || 'System',
    taskId || '',
    fieldChanged || '',
    details || ''
  ]);
}
```

The audit log is never cleared. Even after a task is archived, its audit entries remain. This is the operational record for compliance and debugging.

---

## 8. On-Edit Handler

`onTaskSheetEditWithAutoSort(e)` is installed as a simple `onEdit` trigger by `createOnEditTrigger()`. It fires on every cell edit in the Task Management spreadsheet.

```javascript
function onTaskSheetEditWithAutoSort(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== TASK_CONFIG.sheets.master) return;

  const editedCol = e.range.getColumn() - 1; // 0-indexed
  const editedRow = e.range.getRow();

  // Skip header row
  if (editedRow === 1) return;

  // Handle status column edits
  if (editedCol === COLS.STATUS) {
    handleStatusChange_(sheet, editedRow, e.value, e.oldValue);
  }

  // Update Last Updated and Updated By columns
  sheet.getRange(editedRow, COLS.LAST_UPDATED + 1).setValue(toDateOnly_(new Date()));
  sheet.getRange(editedRow, COLS.UPDATED_BY + 1).setValue(Session.getActiveUser().getEmail());
}
```

### `handleStatusChange_` detail

```javascript
function handleStatusChange_(sheet, rowIndex, newStatus, oldStatus) {
  // Auto-set Date Completed for terminal states
  if (newStatus === STATUSES.DONE || newStatus === STATUSES.CANCELLED) {
    sheet.getRange(rowIndex, COLS.DATE_COMPLETED + 1).setValue(toDateOnly_(new Date()));
  } else if (oldStatus === STATUSES.DONE || oldStatus === STATUSES.CANCELLED) {
    // Reactivating: clear Date Completed
    sheet.getRange(rowIndex, COLS.DATE_COMPLETED + 1).setValue('');
  }

  // Notify assignee if status changed to BLOCKED (immediate, before 14-day escalation)
  if (newStatus === STATUSES.BLOCKED) {
    const taskData = sheet.getRange(rowIndex, 1, 1, TOTAL_COLS).getValues()[0];
    notifyAssigneeOfBlock_(taskData);
  }

  // Audit
  logAuditEntry_('STATUS_CHANGE', Session.getActiveUser().getEmail(),
                 `${oldStatus} -> ${newStatus}`, rowIndex, 'Status');
}
```

Simple onEdit triggers run with restricted permissions (no UrlFetch, no MailApp). For Slack DMs and email, the bi-hourly cleanup trigger picks up the state change and dispatches notifications.

---

## 9. Daily Maintenance Loop

`runDailyTaskMaintenance()` is the daily 7am workhorse:

```javascript
function runDailyTaskMaintenance() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log('Could not acquire lock for daily maintenance');
    return;
  }

  try {
    // 1. Bi-hourly cleanup (run inline)
    cleanupAndSortMasterActionables();

    // 2. Process recurring tasks (generate new instances)
    processRecurringTasks_();

    // 3. Archive completed/cancelled tasks older than 30 days
    archiveCompletedTasks_();

    // 4. Escalate BLOCKED tasks older than 14 days
    escalateBlockedTasks_();

    // 5. Auto-return DEFERRED tasks past their hold-until date
    returnDeferredTasksWhenDue_();

    logAuditEntry_('MAINTENANCE_COMPLETE', 'System', 'Daily maintenance succeeded');
  } catch (e) {
    Logger.log(`Daily maintenance error: ${e.message}`);
    notifyAdminOfMaintenanceFailure_(e);
    logAuditEntry_('ERROR', 'System', `Daily maintenance error: ${e.message}`);
  } finally {
    lock.releaseLock();
  }
}
```

The lock prevents overlap if a manual run happens to coincide with the scheduled trigger. Each step is independent (failure of one does not block the next).

The previously-scheduled `runScheduledOverdueSummary()` is no longer called from this loop (removed April 2026). The function remains as a no-op stub for backwards compatibility with the trigger installer.

---

## 10. Weekly Active Tasks Summary (Monday 10am)

`sendWeeklyActiveTasksSummary()` runs Monday at 10am, builds a per-staff summary of open tasks, and sends each staff member a Slack DM with their list.

```javascript
function sendWeeklyActiveTasksSummary() {
  const sheet = getMasterActionablesSheet_();
  const data = sheet.getDataRange().getValues();
  const dmWebhooks = JSON.parse(getProp_('SLACK_DM_WEBHOOKS') || '{}');

  // Group tasks by assignee
  const byAssignee = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!ACTIVE_STATUSES.includes(row[COLS.STATUS])) continue;
    const assignee = row[COLS.STAFF];
    if (!assignee) continue;
    if (!byAssignee[assignee]) byAssignee[assignee] = [];
    byAssignee[assignee].push(row);
  }

  // DM each assignee with personal webhook
  for (const [name, tasks] of Object.entries(byAssignee)) {
    const webhook = dmWebhooks[name];
    if (!webhook) {
      Logger.log(`No DM webhook for ${name}, skipping`);
      continue;
    }
    const blockKit = buildWeeklySummaryBlockKit_(name, tasks);
    try {
      postToSlack_(webhook, blockKit);
    } catch (e) {
      Logger.log(`Weekly summary DM to ${name} failed: ${e.message}`);
    }
  }
}
```

The summary is DM-only as of April 2026; it no longer posts to the managers channel.

Test variant `sendWeeklyActiveTasksSummary_Test` (admin menu) sends only to Evan, useful for verifying the message format before the live 10am cadence.

---

## 11. Trigger Installers (Reference)

All seven trigger installers in `EnhancedTaskManagementWaratah.gs`, with their target functions:

| Installer function | Handler installed | Schedule |
|---|---|---|
| `createDailyMaintenanceTrigger()` | `runDailyTaskMaintenance` | Daily 07:00 |
| `createWeeklySummaryTrigger()` | `sendWeeklyActiveTasksSummary` | Mon 10:00 |
| `createOnEditTrigger()` | `onTaskSheetEditWithAutoSort` | On any cell edit (simple trigger) |
| `createBiHourlyCleanupTrigger()` | `cleanupAndSortMasterActionables` | Every 2 hours |
| `createDailyStaffWorkloadTrigger()` | `runScheduledStaffWorkload` | Daily 06:00 |
| `createWeeklyArchiveTrigger()` | `runScheduledArchive` | Mon 06:00 |
| `createWeeklyOverdueSummaryTrigger()` | `sendOverdueTasksSummary_` (deprecated) | Sun 09:00 |

The seventh installer is kept for backwards compatibility but **do not call it**. The corresponding handler is a no-op as of April 2026, so installing the trigger only consumes a trigger slot in the project's 20-trigger quota without doing useful work.

All installers follow the defensive-delete pattern: remove any existing trigger with the same handler function before creating the new one. This makes them safe to re-run idempotently.

---

## 12. Integration Boundary with Shift Reports

The Shift Report project pushes tasks into this system. The receiving end is the `appendRow` in `pushTodosToMaster_` from `TaskIntegrationWaratah.js` (Shift Report side). The pushed row uses the column order documented in Section 2 (Priority A, Status B, etc.).

After the row is appended:

- The `onTaskSheetEditWithAutoSort` trigger may fire (depending on the spreadsheet's onEdit installation), updating Last Updated / Updated By.
- The next bi-hourly cleanup recomputes Days Open.
- The next daily maintenance generates any recurring instances.

No special handling at the receiving end. The integration is "fire and forget" from the Shift Report side; the Task Management system processes the row through its normal lifecycle.

---

## 13. Performance Notes

- The MASTER ACTIONABLES SHEET grows ~50 rows per week. The bi-hourly cleanup keeps it sorted and tidy.
- After 30 days, completed/cancelled tasks are archived. This caps the active sheet size around 200-300 rows.
- The full-sheet read in `escalateBlockedTasks_` etc. is `getDataRange().getValues()`. For sheets approaching 1,000 active rows, this becomes noticeable but is still well within Apps Script's quotas.
- The AUDIT LOG never archives. It grows unboundedly. Currently around 8,000 rows after ~6 months of operation. Performance is fine; if it grows past 50,000 rows, consider an annual roll-to-archive routine.

---

## 14. Common Issues

### "A task DM didn't reach me"

Section 8 of [`/docs/waratah/for-admins/03-advanced-troubleshooting.md`](../for-admins/03-advanced-troubleshooting.md). Most often `SLACK_DM_WEBHOOKS` is configured in one project but not the other.

### "Recurring task didn't generate"

Check: the template's Status is `RECURRING`, `Recurrence` column is set (not None), `Last Updated` column is older than the recurrence cadence. Run `processRecurringTasks_()` manually from the editor to force.

### "Escalation didn't fire for a BLOCKED task"

Check: the task's `Last Updated` is older than 14 days (not just `Date Created`). Recently-edited BLOCKED tasks reset the escalation clock. To override, manually edit `Last Updated` backwards.

### "Archive moved tasks that shouldn't have been"

The archive criterion is `Status IN (DONE, CANCELLED) AND DateCompleted < (today - 30 days)`. Confirm DateCompleted is set; if not, the task is not archived even if old.

---

## 15. Adding a New Status

If you ever need to add a new status (for example, "ON HOLD" distinct from DEFERRED):

1. Add to `STATUSES` enum.
2. Add to `STATUS_LIST`, `ACTIVE_STATUSES`, and `RECURRENCE_ELIGIBLE_STATUSES` if applicable.
3. Add to `STATUS_EMOJI` and `STATUS_COLORS`.
4. Update `handleStatusChange_` if special handling needed.
5. Update the dashboard builders in `TaskDashboardWaratah.gs` to recognise the new status.
6. Update this document's state machine (Section 4).
7. Update [`for-managers/02-task-management.md`](../for-managers/02-task-management.md) Section 4 if user-visible.
8. Deploy via clasp push, re-run dropdowns (Reapply Formatting and Validation menu item).

Be conservative about adding statuses. Each one increases the state machine complexity and the cognitive load on managers.
