# Task Management Internals

**Audience:** Developers modifying `EnhancedTaskManagement_Sakura.gs` or any of the sibling files in the Sakura Task Management project.

This file is the code-level reference for the Sakura Task Management system. For the manager view of the same system, see [`/docs/sakura/for-managers/02-task-management.md`](../for-managers/02-task-management.md).

---

## 1. File Layout

`SAKURA HOUSE/TASK MANAGEMENT SCRIPTS/`

| File | Responsibility |
|---|---|
| `EnhancedTaskManagement_Sakura.gs` | The system. State machine, escalation, recurring, maintenance, triggers. |
| `TaskDashboard_Sakura.gs` | Read-only dashboard builder (counts, breakdowns, trends). |
| `Menu_Updated_Sakura.gs` | Spreadsheet menu, password gating, admin tools. |
| `UIServer_Sakura.gs` | Backend for the task manager HTML dialog. |
| `SlackBlockKitSAKURA.gs` | Block Kit builders for task DMs and channel posts. |
| `VenueConfigSakura.gs` | Venue identifier and timezone (task-mgmt side copy). |

Plus `task-manager.html` (the modal task creation dialog) and `appsscript.json`.

The Sakura Actionables Sheet is a separate spreadsheet from the Sakura shift report. Its ID lives in the `TASK_MANAGEMENT_SPREADSHEET_ID` Script Property (`EnhancedTaskManagement_Sakura.gs:35`).

---

## 2. Configuration Constants

All in `EnhancedTaskManagement_Sakura.gs`.

### `TASK_CONFIG`

The configuration block carries:

- `escalation.blockedDaysBeforeEscalate: 14` (line 100)
- `escalation.escalateToName: "Evan"` (line 101)
- `archive.daysBeforeArchive: 8` (line 106)
- `timezone: "Australia/Sydney"`

Note: Sakura's archive threshold is **8 days**, not 30. Tasks with status DONE or CANCELLED for more than 8 days are moved from the active Tasks sheet to the archive sheet. This is archival, not escalation; the only automatic escalation is the BLOCKED-after-14-days rule.

### Column layout (`COLS`)

The Tasks sheet uses 15 columns A through O (constants at lines 115-153):

| Index | Col | Field |
|---|---|---|
| 0 | A | Priority |
| 1 | B | Status |
| 2 | C | Staff Allocated |
| 3 | D | Area |
| 4 | E | Description |
| 5 | F | Due Date |
| 6 | G | Date Created |
| 7 | H | Date Completed |
| 8 | I | Days Open |
| 9 | J | Blocker Notes |
| 10 | K | Source |
| 11 | L | Recurrence |
| 12 | M | Last Updated |
| 13 | N | Updated By |
| 14 | O | Notes |

Column A is Priority, column B is Status. The order matters; the code is the source of truth.

---

## 3. Domain Enums

### `STATUSES` (9 states)

The Sakura state machine has **nine statuses**. The `STATUSES` constant lives at `EnhancedTaskManagement_Sakura.gs:160-182`.

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
```

The status order in `STATUS_LIST` (lines 173-181), which populates the dropdown:

1. NEW
2. TO DO
3. IN PROGRESS
4. TO DISCUSS
5. BLOCKED
6. DEFERRED
7. DONE
8. CANCELLED
9. RECURRING

`ETM_ACTIVE_STATUSES` (line 217) treats RECURRING as an active status. `RECURRENCE_ELIGIBLE_STATUSES` (lines 221-226) lists TODO, IN_PROGRESS, DEFERRED, RECURRING. That constant is declared but is **not** consulted on the regeneration path; only DONE tasks with a non-"None" Recurrence value trigger regeneration (Section 6). The constant exists for future use or historical reasons.

**RECURRING is a status, not a flag.** Recurrence frequency lives in a separate Recurrence column (column L) populated from `RECURRENCE_OPTIONS`.

### `RECURRENCE_OPTIONS` (lines 268-273)

```javascript
const RECURRENCE_OPTIONS = ["None", "Weekly", "Fortnightly", "Monthly"];
```

These values are stored in column L of the Tasks sheet. The RECURRING status (column B) and the Recurrence column (L) are independent: a task can be DONE with Recurrence = "Weekly" (regenerates on next maintenance), or RECURRING with Recurrence = "None" (template that does nothing until edited).

### `STAFF_LIST` (lines 275-288)

The Sakura staff list contains **12 entries** populating the Staff Allocated dropdown:

1. Evan
2. Nick
3. Gooch
4. Cynthia
5. Adam
6. Ian
7. FOH Team
8. Bar Team
9. Kitchen Team
10. All
11. Contractor
12. General Management

The dropdown rule `setAllowInvalid(false)` enforces this list strictly. To add or remove a staff member, edit `STAFF_LIST` and re-run the Reapply Formatting and Validation menu item so the dropdown picks up the change.

---

## 4. The Status State Machine

The state machine is implicit in the spreadsheet (the Status column is a dropdown). No transition table is enforced by code; the on-edit handler only handles DONE / CANCELLED / BLOCKED side effects.

### Suggested transitions (not enforced by code)

```
NEW          -> TO DO | TO DISCUSS | CANCELLED
TO DO        -> IN PROGRESS | TO DISCUSS | BLOCKED | DEFERRED | DONE | CANCELLED
IN PROGRESS  -> BLOCKED | DEFERRED | DONE | CANCELLED | TO DISCUSS
TO DISCUSS   -> TO DO | IN PROGRESS | CANCELLED
BLOCKED      -> IN PROGRESS | DEFERRED | DONE | CANCELLED
DEFERRED     -> TO DO | IN PROGRESS | CANCELLED
DONE         -> (terminal; can be reactivated by changing to any active status)
CANCELLED    -> (terminal; can be reactivated)
RECURRING    -> (template; on DONE with non-None Recurrence, next instance is generated)
```

The dropdown accepts any STATUS_LIST value. The state machine is therefore advisory. Escalation and daily maintenance enforce hygiene over time.

DEFERRED tasks do not auto-return on any "hold-until" date. The system has no hold-until field and no auto-return automation.

### Automatic side effects on edit

| Trigger | Auto-action |
|---|---|
| Task marked DONE | Date Completed set to today; Days Open recomputed |
| Task transitions FROM DONE back to active | Date Completed cleared |
| Task marked CANCELLED | Date Completed set to today |
| Task marked BLOCKED | No DM, no email at the edit moment; Blocker Notes column flagged for the assignee to fill in |
| DONE task with non-"None" Recurrence | On next daily maintenance, a fresh TO DO is generated for the next occurrence (Section 6) |

---

## 5. Auto-Escalation Algorithm

`escalateBlockedTasks_()` (`EnhancedTaskManagement_Sakura.gs:848`) runs as part of `runDailyTaskMaintenance()` each morning at 7am Australia/Sydney.

The function reads the Tasks sheet, filters for rows where Status equals BLOCKED, computes days-blocked from the reference date (line 879), and compares against `TASK_CONFIG.escalation.blockedDaysBeforeEscalate` (14 days, threshold check at line 881). Tasks exceeding the threshold are batched into a single escalation alert.

```javascript
// Illustrative excerpt; see EnhancedTaskManagement_Sakura.gs:848-924
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
      tasksToEscalate.push({ /* row data */ });
    }
  }

  if (tasksToEscalate.length === 0) return;

  // Slack DM to Evan (ESCALATION_SLACK_WEBHOOK, line 53/916)
  bk_post(getEscalationSlackWebhook_(), blocks, 'Sakura: BLOCKED tasks escalation');

  // Email to ESCALATION_EMAIL (line 44/924)
  GmailApp.sendEmail(getEscalationEmail_(), 'Sakura: BLOCKED tasks escalation', '',
    { htmlBody: buildEscalationEmailHtml_(tasksToEscalate) });

  logAuditEntry_('ESCALATION', 'System',
                 'Escalated ' + tasksToEscalate.length + ' blocked tasks to ' + TASK_CONFIG.escalation.escalateToName);
}
```

The escalation does NOT change the task's status. It alerts; the assignee decides whether to unblock, defer, or cancel.

The threshold (14 days) and recipient name (Evan) live in `TASK_CONFIG` (lines 100-101) and are edited in code, not via Script Properties. Script Properties point at the webhook (`ESCALATION_SLACK_WEBHOOK`, line 53) and the email recipient (`ESCALATION_EMAIL`, line 44).

**There is no other status-based escalation timer.** TO DISCUSS, DEFERRED, and stale TO DO statuses do not trigger any automatic alert. Only BLOCKED tasks past 14 days are escalated.

---

## 6. Recurring Task Generation

`processRecurringTasks_()` (`EnhancedTaskManagement_Sakura.gs:985`) runs as part of daily maintenance. It scans for rows where Status equals DONE and Recurrence is not "None" (line 1006), generates a fresh instance, and writes it back to the Tasks sheet as a TO DO (line 1032).

### Next-due-date calculation

The recurrence switch is inline (lines 1014-1024):

- **Weekly** (lines 1014-1016): next Monday from the original due date + 1 week
- **Fortnightly** (lines 1017-1019): next Monday from the original due date + 2 weeks
- **Monthly** (lines 1020-1024): same calendar date next month, then snapped forward to the next Monday

Weekly and fortnightly anchor to a Monday cadence. Monthly preserves the calendar interval first, then snaps onto a Monday (it does not preserve the day-of-month exactly).

```javascript
// Illustrative excerpt; see EnhancedTaskManagement_Sakura.gs:985-1050
function processRecurringTasks_() {
  var sheet = SpreadsheetApp.openById(getTaskSpreadsheetId_())
    .getSheetByName(TASK_CONFIG.sheets.master);
  var data = sheet.getDataRange().getValues();

  data.forEach(function (row, i) {
    if (i === 0) return;
    if (row[COLS.STATUS] !== STATUSES.DONE) return;
    var recurrence = row[COLS.RECURRENCE];
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

    // Append the new instance with status TO DO
    sheet.appendRow([/* PRIORITY, "TO DO", staff, area, description, nextDueDate, ... */]);

    logAuditEntry_('RECURRING_REGENERATED', 'System',
                   'Generated instance for ' + row[COLS.DESCRIPTION]);
  });
}
```

The newly appended row starts at status TO DO (line 1032). The original DONE task remains as the completion record.

To stop a recurrence chain, set the task's Recurrence to `"None"` before marking DONE, or change the Status to CANCELLED.

---

## 7. Audit Trail

Sakura keeps audit data in two places:

1. **On the Tasks sheet itself.** Columns M (Last Updated) and N (Updated By) are written by the on-edit handler on every relevant change. These columns are never cleared by maintenance; they persist with the row through to archive.

2. **In a dedicated `AUDIT LOG` sheet.** Defined in `TASK_CONFIG.sheets.audit` (`EnhancedTaskManagement_Sakura.gs:91`). The sheet is auto-created by `ensureAuditLogSheet_(ss)` (line 672) on first write, with six headers in row 1: `Timestamp`, `Action`, `User`, `Task ID`, `Field Changed`, `Details`. Header row is frozen and styled (line 680-690).

Writes to the audit log go through `logAuditEntry_(action, user, details, [...])` (line 700+). The on-edit handler calls this for status changes, priority changes, and other significant transitions. The daily maintenance loop also writes entries when it cleans empty rows, escalates BLOCKED tasks, processes recurring tasks, or archives.

---

## 8. On-Edit Handler

`onTaskSheetEditWithAutoSort(e)` (`EnhancedTaskManagement_Sakura.gs:1135`) is installed as an **installable** onEdit trigger by `createOnEditTrigger()` (line 1553). It is not a simple trigger. Installable onEdit triggers have full permissions including UrlFetch and MailApp.

Responsibilities of the handler:

- Skip the header row.
- If the edited column is Status or Priority, log an audit entry (Section 7) and apply terminal-state side effects (Date Completed for DONE/CANCELLED; clear on reactivation).
- Update column M (Last Updated) with today's date.
- Update column N (Updated By) with `Session.getActiveUser().getEmail()`.
- Auto-sort the sheet by Priority and then Due Date so newly edited rows settle into the correct visual position.

The handler does not dispatch a Slack DM or email when status flips to BLOCKED. Slack DMs for BLOCKED tasks are sent later by the daily `escalateBlockedTasks_` step (Section 5), gated by the 14-day threshold.

---

## 9. Daily Maintenance Loop

`runDailyTaskMaintenance()` (`EnhancedTaskManagement_Sakura.gs:1250`) runs daily at 7am Australia/Sydney. The body sequences four steps under a script lock to prevent overlap with a manual invocation:

```javascript
// Illustrative excerpt; see EnhancedTaskManagement_Sakura.gs:1250
function runDailyTaskMaintenance() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log('Could not acquire lock for daily maintenance');
    return;
  }
  try {
    // 1. Sort and tidy the Tasks sheet; recompute Days Open
    cleanupAndSortMasterActionables();

    // 2. Process recurring tasks (regenerate from DONE templates with Recurrence != "None")
    processRecurringTasks_();

    // 3. Escalate BLOCKED tasks older than 14 days
    escalateBlockedTasks_();

    // 4. Archive DONE / CANCELLED tasks older than 8 days
    archiveOldCompletedTasks_();
  } catch (e) {
    Logger.log('Daily maintenance error: ' + e.message);
    logAuditEntry_('MAINTENANCE_ERROR', 'System', e.message);
  } finally {
    lock.releaseLock();
  }
}
```

The Sakura archive threshold is 8 days (line 106). After 8 days at DONE or CANCELLED, a task is moved off the active Tasks sheet to the archive sheet.

The previously-scheduled overdue-summary step was removed April 2026 and does not run from this loop.

---

## 10. Weekly Active Tasks Summary (Monday 6am)

`sendWeeklyActiveTasksSummary()` (`EnhancedTaskManagement_Sakura.gs:1296`) runs Monday at 6am. The top-level function delegates to a core implementation, posting only to the managers channel:

```javascript
// EnhancedTaskManagement_Sakura.gs:1296-1313 (illustrative)
function sendWeeklyActiveTasksSummary() {
  _sendWeeklyActiveTasksSummaryCore(getManagersChannelWebhook_(), /*isTest=*/false);
}
```

The core implementation `_sendWeeklyActiveTasksSummaryCore` posts the summary to the Slack managers channel via `bk_post(webhookUrl, weeklyBlocks, ...)`. The webhook is read from the `SLACK_MANAGERS_CHANNEL_WEBHOOK` Script Property (line 62).

Per-assignee DMs are **disabled** as of May 2026; the dispatching call to `_sendWeeklyActiveTasksDMs_` is commented out (inline comment at lines 1427-1428). The DM helper functions remain in place as dead code with a revert-friendly comment so the DM path can be reinstated by uncommenting a single line.

`getSlackDmWebhooks_()` (which reads the `SLACK_DM_WEBHOOKS` Script Property, line 71) is still active; used by the test variant below and reserved for future re-enablement of the DM path.

### Test variant

`sendWeeklyActiveTasksSummary_Test()` (line 1313) posts to Evan's DM only (intentional test isolation). It is invoked from the admin menu and is useful for verifying the message format before the live 6am cadence fires.

---

## 11. Trigger Installers (Reference)

The trigger creator functions in `EnhancedTaskManagement_Sakura.gs`:

| Installer function | Handler installed | Schedule | Code line |
|---|---|---|---|
| `createDailyMaintenanceTrigger()` | `runDailyTaskMaintenance` | Daily 07:00 | 1509 |
| `createWeeklySummaryTrigger()` | `sendWeeklyActiveTasksSummary` | Mon 06:00 | 1531 |
| `createOnEditTrigger()` | `onTaskSheetEditWithAutoSort` | On any cell edit (installable) | 1553 |

All installers follow the defensive-delete pattern: remove any existing trigger with the same handler function before creating the new one. This makes them safe to re-run idempotently.

---

## 12. Slack Webhooks Used

The Sakura Task Management system uses three Slack webhook Script Properties:

| Property | File:line | Purpose |
|---|---|---|
| `ESCALATION_SLACK_WEBHOOK` | `EnhancedTaskManagement_Sakura.gs:53` | Evan's DM. Fired by `escalateBlockedTasks_` when a BLOCKED task crosses the 14-day threshold |
| `SLACK_MANAGERS_CHANNEL_WEBHOOK` | `EnhancedTaskManagement_Sakura.gs:62` | Managers channel. Monday 6am weekly active tasks summary |
| `SLACK_DM_WEBHOOKS` | `EnhancedTaskManagement_Sakura.gs:71` | JSON map (`{"Evan": "https://...", "Nick": "https://...", ...}`). Per-staff DM webhooks; currently consumed only by the test variant and reserved for future re-enablement of per-assignee DMs |

The corresponding email property is `ESCALATION_EMAIL` (line 44), the recipient address for BLOCKED-task escalation HTML emails.

---

## 13. Integration Boundary with Shift Reports

The Sakura shift report pushes tasks into the Sakura Actionables Sheet via `pushTodosToActionables()` in `TaskIntegrationSakura.gs` (line 60). The function reads from two named ranges on the active shift report sheet:

- `todoTasks`: range A69:A84 (task descriptions; one per row)
- `todoAssignees`: range D69:D84 (assignee names matching the STAFF_LIST values)

The target spreadsheet ID is `TASK_MANAGEMENT_SPREADSHEET_ID` (`TaskIntegrationSakura.gs:21`), the same Script Property used by the Task Management project (line 35 there).

After the row is appended:

- The `onTaskSheetEditWithAutoSort` trigger may fire (depending on its installation state), updating Last Updated and Updated By.
- The next daily maintenance run recomputes Days Open and generates recurring instances.

The integration is fire-and-forget from the shift report side; the Task Management system processes the row through its normal lifecycle.

---

## 14. Common Issues

### "Recurring task didn't generate"

Check the source task: Status must be DONE and Recurrence must be set to Weekly, Fortnightly, or Monthly (not "None"). The RECURRING status by itself does not trigger generation; only DONE with a non-"None" Recurrence value does. Run `processRecurringTasks_()` manually from the editor to force.

### "Escalation didn't fire for a BLOCKED task"

Check the task's Last Updated column. The escalation algorithm reads `LAST_UPDATED` (falling back to `DATE_CREATED`) and requires it to be at least 14 days in the past. Recently-edited BLOCKED tasks reset the escalation clock. To override, manually edit Last Updated backwards.

### "Archive moved tasks that shouldn't have been"

The archive criterion is `Status IN (DONE, CANCELLED) AND DateCompleted < (today - 8 days)`. Confirm Date Completed is set; if not, the task is not archived even if old. Note: Sakura's archive threshold is 8 days, not 30.

### "Weekly summary didn't appear in my DM"

By design: the May 2026 change disabled per-staff DMs. The Monday 6am summary now posts to the managers channel only. If you need to re-enable DMs, uncomment the `_sendWeeklyActiveTasksDMs_` call in `_sendWeeklyActiveTasksSummaryCore` and ensure `SLACK_DM_WEBHOOKS` contains an entry for each staff member who should receive a DM.

---

## 15. Adding a New Status

If you ever need to add a new status (for example, "ON HOLD" distinct from DEFERRED):

1. Add to `STATUSES` enum (line 160).
2. Add to `STATUS_LIST` (lines 173-181).
3. Update `ETM_ACTIVE_STATUSES` (line 217) and `RECURRENCE_ELIGIBLE_STATUSES` (lines 221-226) if applicable.
4. Add to the status emoji and colour maps used by the dashboard.
5. Update the on-edit handler `handleStatusChange_` if special side effects are needed.
6. Update the dashboard builders in `TaskDashboard_Sakura.gs` to recognise the new status.
7. Update this document's state machine (Section 4).
8. Update [`for-managers/02-task-management.md`](../for-managers/02-task-management.md) if user-visible.
9. Deploy via `clasp push`, then re-run dropdowns via the Reapply Formatting and Validation menu item so the new status appears in the Status dropdown.

Be conservative about adding statuses. Each one increases the state machine complexity and the cognitive load on managers. The current set of nine is the result of several years of iteration and covers the realistic operational states.
