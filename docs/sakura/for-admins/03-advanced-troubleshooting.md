# Advanced Troubleshooting

**Audience:** Admin operators diagnosing problems that require Apps Script editor access, Script Properties access, or log inspection. If the issue is something a manager can resolve from the spreadsheet UI, it belongs in the manager-tier troubleshooting guide, not here.

This file holds the diagnostic procedures and recovery paths that go deeper than the manager troubleshooting guide.

---

## 1. Two-Spreadsheet Note (Read First)

Sakura House runs on two independent Google Sheets, each with its own Apps Script project:

- **Shift Report project** (the "Sakura House - Current Week" spreadsheet)
- **Task Management project** (the "Sakura Actionables Sheet" spreadsheet)

Each project has its own Script Properties store, its own Triggers panel, and its own Executions log. Admin actions in one do **not** affect the other. When you are told to set a Script Property, you must confirm in which project. When a trigger needs reinstalling, you must reinstall it in the project that owns it. `MENU_PASSWORD` and `TASK_MANAGEMENT_SPREADSHEET_ID` are the two keys that exist in both projects and must be kept in sync.

---

## 2. Where to Start

When a problem reaches you, work through this decision tree before diving into specific sections:

1. **What is the user-visible symptom?** (Slack message missing, email missing, rollover did not run, task DM not received, dashboard showing stale numbers.)
2. **When did it last work?** (Yesterday, last week, this morning?)
3. **Has anything changed recently?** (A clasp push, a Script Properties edit, a new staff member added, a Slack workspace change?)
4. **Is the issue affecting one user, one feature, or the whole system?**

The combination usually points at the right section below. If not, start with the logs.

---

## 3. How to View Logs

Apps Script has two logging surfaces. Both are essential.

### Executions panel

Open the relevant Apps Script project (Shift Report or Task Management) at script.google.com, then in the left sidebar click **Executions**. This shows every script execution in the last 30 days with: function name, trigger type (manual, time-based, on edit), start time, duration, status (succeeded, failed, timed out).

Filter by **Status = Failed** to see only failures. Click any execution to see its full log output.

### Logger output (within an execution)

Inside an execution's detail view, the **Logs** tab shows everything the script wrote via `Logger.log(...)`. This is the primary debugging output.

### What to look for

- **`Cannot call SpreadsheetApp.getUi() from this context`**: a UI call ran in a trigger context (where there is no UI). Code bug; report to developer.
- **`Exception: You do not have permission to call ...`**: the script lost permission to a resource (Drive folder, sheet). Re-authorise the script by running any function from the Apps Script editor; you will be prompted to re-grant permissions.
- **`Service Spreadsheets failed`**: a transient Google Sheets API error. Usually a one-off. Re-run the function.
- **`Quota exceeded`**: the script hit a Google quota (daily email send, daily UrlFetch, etc.). Wait until midnight Pacific time and retry, or contact the Google Workspace admin.
- **Silent failures with no log**: the function did not run at all. Check the Triggers panel (Section 7).

---

## 4. Slack Webhook Diagnostics

### Symptom: Slack message did not post

Check in this order:

1. **Did the rest of the send succeed?** Email and warehouse should still have worked. If yes, the failure is isolated to Slack.
2. **Is Slack itself working?** Check the Slack workspace status; check whether other messages are appearing in the manager channels.
3. **Is the webhook URL valid?** Test it with a curl command from the terminal:
   ```bash
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"Webhook test"}' \
     'https://hooks.slack.com/services/...'
   ```
   - HTTP 200 with body `ok`: the webhook works. The problem is in the script.
   - HTTP 404 or body `no_service` / `invalid_token`: the webhook is expired or revoked. Regenerate in Slack.
   - HTTP 410 `channel_not_found`: the target channel was renamed or archived. Regenerate.

### Regenerating a webhook

Ask the Slack workspace admin to create a new Incoming Webhook for the target channel. Copy the full URL (starts with `https://hooks.slack.com/services/...`) and paste it into the relevant Script Property:

- `SAKURA_SLACK_WEBHOOK_LIVE` (Shift Report project) for nightly LIVE posts and the weekly revenue digest.
- `SAKURA_SLACK_WEBHOOK_TEST` (Shift Report project, also referenced from Task Management project) for test posts and AI-insights `evan_only` routing.
- `SLACK_MANAGERS_CHANNEL_WEBHOOK` (Task Management project) for the Monday 6am weekly active tasks summary.
- `ESCALATION_SLACK_WEBHOOK` (Task Management project) for BLOCKED-task escalations to Evan.

### Symptom: One person's DM not arriving

The personal webhooks live inside `SLACK_DM_WEBHOOKS` (JSON object, Task Management project). Check:

1. Is their name spelled exactly as in `STAFF_LIST` (case-sensitive)? "Gooch" not "gooch".
2. Is the JSON syntactically valid? A missing comma breaks the whole object. Paste it into a JSON validator to confirm.
3. Is the webhook URL still valid? Test with curl as above.

---

## 5. Email Recipient Diagnostics

### Symptom: One recipient is not receiving emails

In order:

1. **Check their spam folder.** Search "Sakura shift report".
2. **Send a TEST email manually.** Run **Shift Report > Send Test Report** and confirm in the Executions panel that `MailApp.sendEmail` was called for that addressee.
3. **Check the JSON object validity.** `SAKURA_EMAIL_RECIPIENTS` (Shift Report project) must be a valid JSON map of email to display name. Stray commas, mismatched quotes, or duplicate keys break the parse.
4. **Check Gmail daily send quota.** If the script has sent more than 100 emails in 24 hours (Workspace) or 20 emails (free Gmail), MailApp will fail. Wait 24 hours.
5. **Check whether their mailbox is full.** Ask the recipient.

### Symptom: All recipients are missing emails

If no recipient received the email, the failure is at the script level, not per-recipient:

1. Check Executions panel for the relevant nightly send (`exportAndEmailPDF`). Look at the log output for `MailApp.sendEmail` calls.
2. If `MailApp.sendEmail` did not appear in logs, the email step did not run. The send pipeline failed before reaching email; check the warehouse and Slack steps in the same execution.
3. If `MailApp.sendEmail` appeared but logged an error: read the error. Common: quota exceeded, sender address not authorised.

---

## 6. Rollover Recovery

The weekly rollover (Monday 10am) has the most moving parts. When it fails partway, the spreadsheet can be in an inconsistent state: tabs renamed but cells not cleared, or PDF archived but data not cleared, and so on.

### Symptom: Tuesday morning, the tabs still show last week's dates

The rollover did not run, or ran and failed before the rename step.

**Recovery:**

1. Check the Executions panel of the Shift Report project for Monday around 10am. Look for `performInPlaceRollover`.
2. If no execution exists, the trigger did not fire. Check the Triggers panel: is the trigger installed?
3. If the execution failed, read the log to see where it failed.
4. Recovery: run **Shift Report > Admin Tools > Weekly Rollover > Preview Rollover (Dry Run)** first to see what the next run will do. The handler is `pw_previewInPlaceRollover`.
5. If the preview looks correct, run **Shift Report > Admin Tools > Weekly Rollover > Run Rollover Now** (handler `pw_performInPlaceRollover`, password gated). The rollover is idempotent; re-running will complete any unfinished steps.

### Symptom: Tabs are renamed for the new week, but old data is still in cells

The rollover renamed and archived but the clear step did not complete.

**Recovery:**

1. Do not let anyone type fresh data into the cells.
2. Confirm with the Executions panel: did `performInPlaceRollover` complete fully or fail at the clear step?
3. Re-run from **Shift Report > Admin Tools > Weekly Rollover > Run Rollover Now**. The clearable-fields list excludes the `netRevenue` formula cell, so do not be alarmed if that one cell still shows a value after a fresh clear; that is by design.

### Symptom: Trigger missing after a code deployment

After every `clasp push`, assume time-based triggers may have been destroyed. Recreate from menu:

- **Shift Report > Admin Tools > Weekly Rollover > Create Rollover Trigger (Mon 10am)** reinstalls the rollover trigger (handler `pw_createRolloverTrigger_Sakura`).
- **Shift Report > Admin Tools > Weekly Rollover > Remove Rollover Trigger** destroys it (handler `pw_removeRolloverTrigger_Sakura`).

### Symptom: PDF or spreadsheet copy missing from the Drive archive

Drive permission failure, or the `ARCHIVE_ROOT_FOLDER_ID` Script Property is pointing at the wrong folder.

1. Open the folder ID from `ARCHIVE_ROOT_FOLDER_ID` in Drive and confirm it is the expected archive folder.
2. Confirm the script owner has Edit access to the folder.
3. Re-run **Shift Report > Admin Tools > Weekly Rollover > Run Rollover Now** to re-archive.

---

## 7. Trigger Inspection and Reinstallation

Open Apps Script project > left sidebar > **Triggers**. Expected schedule per project:

### Shift Report project

| Handler | Schedule | Menu path to install |
|---|---|---|
| `performInPlaceRollover` | Mon 10am | Shift Report > Admin Tools > Weekly Rollover > Create Rollover Trigger (Mon 10am) |
| `sendWeeklyRevenueDigest_Sakura` | Mon 8am | Shift Report > Admin Tools > Weekly Digest |
| Weekly warehouse backfill | Weekly | Shift Report > Admin Tools > Data Warehouse |

The weekly digest setup function is `setupWeeklyDigestTrigger_Sakura` (Monday 8am). The warehouse backfill setup function is `pw_setupWeeklyBackfillTrigger`.

### Task Management project

| Handler | Schedule | Notes |
|---|---|---|
| `runDailyTaskMaintenance` | Daily 7am | Creator: `createDailyMaintenanceTrigger()` |
| `sendWeeklyActiveTasksSummary` | Mon 6am | Creator: `createWeeklySummaryTrigger()`; posts to `SLACK_MANAGERS_CHANNEL_WEBHOOK` only |
| `onTaskSheetEditWithAutoSort` | onEdit (installable) | Creator: `createOnEditTrigger()` |

There is **no** "Send Overdue Summary Now" or "Create Overdue Summary Trigger" menu item. Those were removed on 2 April 2026. Do not look for them.

After installing, verify each trigger appears in the Triggers panel with the correct function name and schedule.

### Removing and recreating the onEdit trigger

If sheet edits are no longer auto-sorting, the installable onEdit trigger may have been destroyed (this is separate from the simple `onEdit` function, which is not used here). Open the Triggers panel, delete any existing `onTaskSheetEditWithAutoSort` rows, then run `createOnEditTrigger()` from the Apps Script editor (Run menu, select the function, press Run). Confirm a new entry appears in the Triggers panel.

---

## 8. Named Range Diagnosis and Rebuild

The shift report relies on 144 named ranges (24 FIELD_CONFIG keys × 6 day prefixes). If a manager has manually inserted or deleted rows, or named ranges have gone missing after edits, the export and rollover will start citing fallback cells and may log warnings.

### Diagnose

From the spreadsheet menu: **Shift Report > Admin Tools > Set Up & Diagnostics > Check Named Ranges (ALL Sheets)** (handler `pw_diagnoseAllSheets`, password gated). The output lists, per day sheet, which named ranges are present and which are missing.

### Rebuild

If the diagnosis shows missing ranges: **Shift Report > Admin Tools > Set Up & Diagnostics > Force Update Named Ranges (ALL Sheets)** (handler `pw_forceUpdateNamedRangesOnAllSheets`, password gated). This recreates all 144 named ranges based on the current cell layout. Re-run the diagnosis to confirm.

If a named range cannot be placed because the underlying cell layout has drifted (a manager inserted rows that pushed the target cell), the rebuild will log a warning. In that case the day sheet template itself needs repair before the named ranges can be rebuilt cleanly.

---

## 9. Warehouse Backfill

When a nightly export missed the warehouse write (network blip, quota, malformed cell), or when several days are missing from the warehouse, run the backfill.

- **Manual backfill of one day:** `pw_backfillShiftToWarehouse` (Shift Report project; exposed via Shift Report > Admin Tools > Data Warehouse). Prompts for the day sheet to backfill.
- **Scheduled weekly backfill:** `pw_setupWeeklyBackfillTrigger` installs a weekly trigger that re-walks the prior week and inserts any rows missing from NIGHTLY_FINANCIAL, OPERATIONAL_EVENTS, WASTAGE_COMPS, and QUALITATIVE_LOG. Duplicate detection (date plus MOD) prevents double-writes.

The warehouse spreadsheet ID lives in `SAKURA_DATA_WAREHOUSE_ID` (Shift Report project; the same key also lives in the Task Management project for read access by `SlackBlockKitSAKURA.gs`). Both copies must point at the same spreadsheet ID.

---

## 10. Reapplying Task Sheet Validation

After staff roster changes, the dropdowns in the Tasks sheet (Staff Allocated column, Status column, Priority column, Recurrence column) can fall out of sync with `STATUS_LIST` and `STAFF_LIST` defined in code. To reseed all dropdowns and conditional formatting:

**Task Management > Admin Tools > Reapply Dropdowns & Formatting** (handler `protected_reapplyFormattingAndValidation`, password gated; calls `reapplyFormattingAndValidation()` at `EnhancedTaskManagement_Sakura.gs:1675`).

Run this after any edit to `STAFF_LIST` or `STATUS_LIST` in code. Do not run it during the day shift; it briefly locks the Tasks sheet.

---

## 11. Dashboard Rebuild

The ANALYTICS and EXECUTIVE_DASHBOARD tabs in the shift report spreadsheet rebuild automatically when the underlying warehouse data refreshes, but you can force a full rebuild after a manual warehouse correction or after deploying code that changed dashboard formulas.

**Shift Report > Admin Tools > Integrations & Analytics > Rebuild All Dashboards (Admin)** (handler `pw_rebuildAllDashboards`, password gated). This invokes both `buildFinancialDashboard()` and `buildExecutiveDashboard()` sequentially. Allow 30 to 60 seconds.

If rebuild fails, check the Executions panel for the function name and read the error.

---

## 12. AI Insights Routing

The AI insights feature is shipped and gated by the `AI_INSIGHTS_MODE` Script Property (Shift Report project):

- `evan_only` (default): summaries route to `AI_INSIGHTS_EVAN_EMAIL` and Slack `SAKURA_SLACK_WEBHOOK_TEST` only.
- `live`: summaries route to the standard managers distribution.

To change routing, edit `AI_INSIGHTS_MODE` in Script Properties. To diagnose silent failures, check the Executions panel for `generateShiftInsight_Sakura` or `deliverAIInsights_Sakura`. The Anthropic API key lives in `ANTHROPIC_API_KEY`; a 401 in the log indicates the key has been rotated or revoked.

---

## 13. Password Reset

The admin password is held in `MENU_PASSWORD` in **both** projects' Script Properties. Both must hold the same value.

1. Open the Shift Report project > Project Settings (gear) > Script Properties. Edit `MENU_PASSWORD`. Save.
2. Open the Task Management project > Project Settings > Script Properties. Edit `MENU_PASSWORD` to the same new value. Save.
3. Test by invoking any password-gated menu item in each spreadsheet.

If the two copies fall out of sync, one project's admin menus will reject the password.

---

## 14. Quick-Reference Table

| Symptom | First check | Section |
|---|---|---|
| Slack message missing | Slack workspace status, then webhook curl test | 4 |
| One person's DM missing | SLACK_DM_WEBHOOKS JSON validity | 4 |
| Email missing for one person | Spam folder, then JSON validity | 5 |
| Email missing for all | Executions panel, MailApp.sendEmail log | 5 |
| Rollover did not run | Executions panel for `performInPlaceRollover` | 6 |
| Tabs renamed but data not cleared | Re-run rollover idempotently | 6 |
| Trigger missing after deploy | Triggers panel count vs expected | 7 |
| Named range errors | Run `pw_diagnoseAllSheets` then `pw_forceUpdateNamedRangesOnAllSheets` | 8 |
| Warehouse rows missing | `pw_backfillShiftToWarehouse` | 9 |
| Task dropdowns stale after roster change | Reapply Dropdowns & Formatting | 10 |
| Dashboard showing wrong numbers | Rebuild All Dashboards (Admin) | 11 |
| AI insights silent | Check `AI_INSIGHTS_MODE` and `ANTHROPIC_API_KEY` | 12 |
| Password not accepted in one project | Sync `MENU_PASSWORD` across both projects | 13 |

---

## 15. Escalating Beyond Yourself

If you have worked through this guide and the issue is unresolved, you need developer help. Compose a report including:

1. **Symptom in one sentence.** "Friday night's Slack message did not post."
2. **The execution log entry** (copy-paste the failing Executions panel entry, redacting any webhook URLs).
3. **What you tried.** "Tested webhook with curl, returned ok. Resent the report manually, also failed."
4. **What you suspect.** "Possibly a script-side issue, not webhook."

Send to Evan, or if Evan is offline, send to the integration alert email (`INTEGRATION_ALERT_EMAIL_PRIMARY` in the Shift Report project's Script Properties).

For after-hours weekend service-night failures, call rather than email. The on-call response window is tight.
