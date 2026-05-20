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

7 named individuals + 7 team/group entries (including `All` and `Contractor` as catch-alls). The dropdown rule `setAllowInvalid(false)` enforces this list strictly.

---

## 4. The Status State Machine

The state machine is implicit in the spreadsheet (the Status column is a dropdown). No transition table is enforced by code; `handleStatusChange_` (lines 1537-1568) only handles DONE/CANCELLED/BLOCKED side-effects.

### Suggested transitions (not enforced by code)

```
NEW → TO DO | TO DISCUSS | CANCELLED
TO DO → IN PROGRESS | TO DISCUSS | BLOCKED | DEFERRED | DONE | CANCELLED
IN PROGRESS → BLOCKED | DEFERRED | DONE | CANCELLED | TO DISCUSS
TO DISCUSS → TO DO | IN PROGRESS | CANCELLED
BLOCKED → IN PROGRESS | DEFERRED | DONE | CANCELLED
DEFERRED → TO DO | IN PROGRESS | CANCELLED
DONE → (terminal; can be reactivated by changing to any active status)
CANCELLED → (terminal; can be reactivated)
RECURRING → (template; on DONE it regenerates the next instance and the original's Recurrence is reset to "None")
```

The dropdown accepts any STATUS_LIST value. The state machine is therefore advisory. Escalation logic and daily maintenance enforce hygiene over time.

DEFERRED tasks do not auto-return on any "hold-until" date. The system has no hold-until field and no auto-return automation.

### Automatic side-effects on edit

| Trigger | Auto-action |
|---|---|
| Task marked DONE | Date Completed set to today; Days Open recomputed |
| Task transitions FROM DONE back to active | Date Completed cleared |
| Task marked CANCELLED | Date Completed set to today |
| Task marked BLOCKED | Blocker Notes cell is highlighted (no DM, no email at the edit moment) |
| DONE task with Recurrence set | On next daily maintenance, a fresh instance is generated; the original's Recurrence is reset to "None" (Section 6) |

---

## 5. Auto-Escalation Algorithm

`escalateBlockedTasks_()` (lines 1074-1162) runs as part of `runDailyTaskMaintenance` each morning at 6am (Apps Script 6-7am window, not 7am).

Real implementation opens the sheet via `SpreadsheetApp.openById(getTaskSpreadsheetId_())`, computes days-blocked inline (no `daysBetween_` helper exists), builds Block Kit blocks inline using the `bk_*` builders, posts via `bk_post(webhook, blocks, fallbackText)`, and builds HTML via `buildEscalationEmailHtml_(tasks)`:

```javascript
// Illustrative excerpt; see EnhancedTaskManagementWaratah.gs:1074-1162
function escalateBlockedTasks_() {
  var sheet = SpreadsheetApp.openById(getTaskSpreadsheetId_())
    .getSheetByName(TASK_CONFIG.sheets.master);
  var data = sheet.getDataRange().getValues();
  var today = new Date();
  var threshold = TASK_CONFIG.escalation.blockedDaysBeforeEscalate; // 14

  var tasksToEscalate = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[COLS.STATUS] !== STATUSES.BLOCKED) continue;

    var referenceDate = row[COLS.LAST_UPDATED] || row[COLS.DATE_CREATED];
    var daysBlocked = Math.floor((today - referenceDate) / (24 * 60 * 60 * 1000));

    if (daysBlocked >= threshold) {
      tasksToEscalate.push({ /* ... */ });
    }
  }

  if (tasksToEscalate.length === 0) return;

  // Build blocks inline using bk_header / bk_section / bk_divider / bk_buttons
  var blocks = [/* bk_header(...), bk_section(...), ... */];
  bk_post(getEscalationSlackWebhook_(), blocks, 'Waratah: BLOCKED tasks escalation');

  // HTML email
  var htmlBody = buildEscalationEmailHtml_(tasksToEscalate);
  GmailApp.sendEmail(getEscalationEmail_(), 'Waratah: BLOCKED tasks escalation', '', { htmlBody: htmlBody });

  logAuditEntry_('ESCALATION', 'System',
                 'Escalated ' + tasksToEscalate.length + ' blocked tasks to ' + TASK_CONFIG.escalation.escalateToName);
}
```

The escalation does NOT change the task's status. It alerts; the assignee decides whether to unblock, defer, or cancel.

The threshold (14 days) and recipient (Evan) come from `TASK_CONFIG`. Editable in code, not via Script Properties (Script Properties point at webhook and email; the threshold and recipient name are config).

---

## 6. Recurring Task Generation

`processRecurringTasks_()` (lines 1207-1312) runs as part of daily maintenance. It processes tasks that have just been completed (`STATUSES.DONE`) and have a non-`"None"` Recurrence value, then generates the next instance and resets the original's Recurrence to `"None"`.

The model is: **mark a recurring task DONE → on the next daily maintenance run, a fresh TO DO is generated for the next occurrence, and the original task's Recurrence column is cleared to "None"**. The original DONE task remains in place as the completion record. Templates are not held at RECURRING permanently.

```javascript
// Illustrative excerpt; see EnhancedTaskManagementWaratah.gs:1207-1312
function processRecurringTasks_() {
  var sheet = SpreadsheetApp.openById(getTaskSpreadsheetId_())
    .getSheetByName(TASK_CONFIG.sheets.master);
  var data = sheet.getDataRange().getValues();

  data.forEach(function (row, i) {
    if (i === 0) return;
    var status = row[COLS.STATUS];
    var recurrence = row[COLS.RECURRENCE];
    if (status !== STATUSES.DONE) return;
    if (!recurrence || recurrence === "None") return;

    var lastDueDate = row[COLS.DUE_DATE] || row[COLS.DATE_CREATED];
    var nextDueDate;
    switch (recurrence) {
      case 'Weekly':      nextDueDate = getNextMonday_(lastDueDate, 1); break;
      case 'Fortnightly': nextDueDate = getNextMonday_(lastDueDate, 2); break;
      case 'Monthly':
        nextDueDate = new Date(lastDueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        nextDueDate = getNextMonday_(nextDueDate, 0);
        break;
    }

    // Append the new TO DO instance with the same Description, Staff, Area, Priority...
    sheet.appendRow([/* ... */]);

    // Reset the original task's Recurrence to "None" so it does not regenerate again
    sheet.getRange(i + 1, COLS.RECURRENCE + 1).setValue('None');

    logAuditEntry_('RECURRING_REGENERATED', 'System',
                   'Generated instance for ' + row[COLS.DESCRIPTION]);
  });
}
```

### `getNextMonday_` helper

There is no `computeNextOccurrence_` function. The recurrence switch is inline (lines 1235-1249). `getNextMonday_(fromDate, weeksAhead)` (lines 1318-1336):

```javascript
function getNextMonday_(fromDate, weeksAhead) {
  var result = new Date(fromDate);
  var dayOfWeek = result.getDay(); // 0=Sun, 1=Mon
  if (dayOfWeek === 0) {
    result.setDate(result.getDate() + 1);
  } else if (dayOfWeek === 1) {
    if (weeksAhead === 0) result.setDate(result.getDate() + 7);
  } else {
    var daysUntilMonday = 8 - dayOfWeek;
    result.setDate(result.getDate() + daysUntilMonday);
  }
  if (weeksAhead > 1) result.setDate(result.getDate() + (weeksAhead - 1) * 7);
  return result;
}
```

Weekly and fortnightly anchor to the next Monday. Monthly adds one calendar month then snaps to the next Monday (it does not preserve the day-of-month).

To stop a recurrence chain, set the task's Recurrence to `"None"` before marking DONE, or change the Status to CANCELLED.

---

## 7. Audit Trail

The AUDIT LOG sheet records every status change and significant event. Schema:

| Column | Header | Purpose |
|---|---|---|
| A | Timestamp | `new Date()` at log time |
| B | Action | Enum (real values observed in code): EDIT, STATUS_CHANGE, CLEANUP, MIGRATION, ESCALATION, RECURRING_REGENERATED, ARCHIVE, CREATED, WEEKLY_SUMMARY, MAINTENANCE_ERROR, REFORMAT, TEST |
| C | User | Email of the user who triggered the action (or "System") |
| D | Task ID | Row index in MASTER ACTIONABLES SHEET |
| E | Field | Which column changed (for STATUS_CHANGE only) |
| F | Details | Free-text description |

### `logAuditEntry_` helper

```javascript
// EnhancedTaskManagementWaratah.gs:934-957. There is no getAuditLogSheet_ helper;
// the sheet is opened inline by ID + name.
function logAuditEntry_(action, user, details, taskId, fieldChanged) {
  var sheet = SpreadsheetApp.openById(getTaskSpreadsheetId_())
    .getSheetByName(TASK_CONFIG.sheets.audit);
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

`onTaskSheetEditWithAutoSort(e)` is installed as an **installable** onEdit trigger by `createOnEditTrigger()` (`ScriptApp.newTrigger(...).forSpreadsheet(...).onEdit().create()`, lines 1915-1929). It is not a simple trigger. Installable onEdit triggers have full permissions including UrlFetch and MailApp.

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

  // BLOCKED edit: highlight the Blocker Notes cell. No DM, no email at the edit moment.
  if (newStatus === STATUSES.BLOCKED) {
    sheet.getRange(rowIndex, COLS.BLOCKER_NOTES + 1)
      .setBackground('#FFF2CC');
  }

  // Audit
  logAuditEntry_('STATUS_CHANGE', Session.getActiveUser().getEmail(),
                 oldStatus + ' -> ' + newStatus, rowIndex, 'Status');
}
```

There is no `notifyAssigneeOfBlock_` helper. The handler does not dispatch a Slack DM or email when status flips to BLOCKED; it only highlights the Blocker Notes cell so the assignee can fill in context. Slack DMs for BLOCKED tasks are sent later by the daily `escalateBlockedTasks_` step (Section 5), gated by the 14-day threshold. The bi-hourly cleanup does not dispatch DMs either; it only sorts and removes empty rows.

---

## 9. Daily Maintenance Loop

`runDailyTaskMaintenance()` is the daily 6am workhorse (Apps Script 6-7am window). Real body at lines 1588-1607 has four steps; there is no step 5 and no success-path audit log. Helpers `returnDeferredTasksWhenDue_` and `notifyAdminOfMaintenanceFailure_` do not exist.

```javascript
// Illustrative excerpt; see EnhancedTaskManagementWaratah.gs:1579-1630
function runDailyTaskMaintenance() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log('Could not acquire lock for daily maintenance');
    return;
  }

  try {
    // 1. Bi-hourly cleanup (run inline)
    cleanupAndSortMasterActionables();

    // 2. Process recurring tasks (regenerate from DONE templates)
    processRecurringTasks_();

    // 3. Archive completed/cancelled tasks older than 30 days
    archiveOldCompletedTasks_();

    // 4. Escalate BLOCKED tasks older than 14 days
    escalateBlockedTasks_();

    // (No step 5; overdue summary removed April 2026; no MAINTENANCE_COMPLETE audit entry)
  } catch (e) {
    Logger.log('Daily maintenance error: ' + e.message);
    logAuditEntry_('MAINTENANCE_ERROR', 'System', e.message);
  } finally {
    lock.releaseLock();
  }
}
```

Function name precision: step 3 is `archiveOldCompletedTasks_`, not `archiveCompletedTasks_`. The lock prevents overlap if a manual run happens to coincide with the scheduled trigger. Each step is independent (failure of one does not block the next).

The previously-scheduled `runScheduledOverdueSummary()` is no longer called from this loop (removed April 2026). The wrapper function remains as a no-op stub. The internal handler `sendOverdueTasksSummary_` (lines 1347-1424) is still fully implemented but is unreachable from any installed trigger.

---

## 10. Weekly Active Tasks Summary (Monday 10am)

`sendWeeklyActiveTasksSummary()` runs Monday at 10am. The top-level function delegates to a two-stage core: a managers-channel post (now commented out as of April 2026) followed by per-assignee DMs.

```javascript
// EnhancedTaskManagementWaratah.gs:1642-1786 (illustrative)
function sendWeeklyActiveTasksSummary() {
  _sendWeeklyActiveTasksSummaryCore(getManagersChannelWebhook_(), /*isTest=*/false);
}

function _sendWeeklyActiveTasksSummaryCore(channelWebhook, isTest) {
  // Build staffMap from MASTER ACTIONABLES SHEET
  var staffMap = /* group ACTIVE_STATUSES rows by assignee */;
  var today = new Date();
  var tz = TASK_CONFIG.timezone;

  // Channel post commented out April 2026; DMs only now.
  // bk_post(channelWebhook, buildChannelBlocks_(staffMap), 'Weekly active tasks');

  _sendWeeklyActiveTasksDMs_(staffMap, today, tz, isTest);
}

function _sendWeeklyActiveTasksDMs_(staffMap, today, tz, isTest) {
  var dmWebhooks = getSlackDmWebhooks_(); // reads SLACK_DM_WEBHOOKS Script Property
  Object.keys(staffMap).forEach(function (name) {
    var webhook = dmWebhooks[name];
    if (!webhook) return;
    var blocks = /* build per-assignee blocks via bk_* builders */;
    bk_post(webhook, blocks, 'Your active Waratah tasks');
  });
}
```

The summary is DM-only as of April 2026; the channel-post path is commented out. The function reads Slack DM webhooks through the `getSlackDmWebhooks_()` helper (line 71), not by reading the Script Property directly.

Test variant `sendWeeklyActiveTasksSummary_Test` (admin menu) sends only to Evan, useful for verifying the message format before the live 10am cadence.

---

## 11. Trigger Installers (Reference)

All seven trigger installers in `EnhancedTaskManagementWaratah.gs`, with their target functions:

| Installer function | Handler installed | Schedule |
|---|---|---|
| `createDailyMaintenanceTrigger()` | `runDailyTaskMaintenance` | Daily 06:00 (Apps Script 6-7am window) |
| `createWeeklySummaryTrigger()` | `sendWeeklyActiveTasksSummary` | Mon 10:00 |
| `createOnEditTrigger()` | `onTaskSheetEditWithAutoSort` | On any cell edit (installable trigger) |
| `createBiHourlyCleanupTrigger()` | `cleanupAndSortMasterActionables` | Every 2 hours |
| `createDailyStaffWorkloadTrigger()` | `runScheduledStaffWorkload` | Daily 06:00 |
| `createWeeklyArchiveTrigger()` | `runScheduledArchive` | Mon 06:00 |
| `createWeeklyOverdueSummaryTrigger()` | (gutted; no trigger created) | n/a |

The seventh installer is gutted. Its entire body is a single log line; it does not call `ScriptApp.newTrigger(...)` and therefore consumes no trigger slot. The corresponding trigger-bound wrapper `runScheduledOverdueSummary` is also a no-op. The internal handler `sendOverdueTasksSummary_` (lines 1347-1424) is still fully implemented but is unreachable from any installed trigger; it can only be invoked manually from the editor.

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
