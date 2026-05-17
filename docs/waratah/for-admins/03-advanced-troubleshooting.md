# Advanced Troubleshooting

**Audience:** Admin operators diagnosing problems that require Apps Script editor access, Script Properties access, or log inspection. If the issue is something a manager can resolve from the spreadsheet UI, it belongs in [`/docs/waratah/for-managers/05-troubleshooting.md`](../for-managers/05-troubleshooting.md), not here.

This file holds the diagnostic procedures and recovery paths that go deeper than the manager troubleshooting guide.

---

## 1. Where to Start

When a problem reaches you, work through this decision tree before diving into specific sections:

1. **What is the user-visible symptom?** (Slack message missing, email missing, rollover didn't run, task DM not received, dashboard showing stale numbers.)
2. **When did it last work?** (Yesterday, last week, this morning?)
3. **Has anything changed recently?** (A clasp push, a Script Properties edit, a new staff member added, a Slack workspace change?)
4. **Is the issue affecting one user, one feature, or the whole system?**

The combination usually points at the right section below. If not, start with the logs (Section 2).

---

## 2. How to View Logs

Apps Script has two logging surfaces. Both are essential.

### Executions panel

Open the relevant Apps Script project (Shift Report or Task Management) > left sidebar > **Executions**. This shows every script execution in the last 30 days with: function name, trigger type (manual, time-based, on edit), start time, duration, status (succeeded, failed, timed out).

Filter by status = Failed to see only failures. Click any execution to see its full log output.

### Logger output (within an execution)

Inside an execution's detail view, the **Logs** tab shows everything the script wrote via `Logger.log(...)`. This is the primary debugging output.

### What to look for

- **`Cannot call SpreadsheetApp.getUi() from this context`**: a UI call ran in a trigger context (where there is no UI). Code bug; report to developer (Phase 4).
- **`Exception: You do not have permission to call ...`**: the script lost permission to a resource (Drive folder, sheet). Re-authorise the script (Run any function from the Apps Script editor; you will be prompted to re-grant permissions).
- **`Service Spreadsheets failed`**: a transient Google Sheets API error. Usually a one-off. Re-run the function.
- **`Quota exceeded`**: the script hit a Google quota (daily email send, daily UrlFetch, etc.). Wait until midnight Pacific time and retry, or contact Google Workspace admin.
- **Silent failures with no log**: the function did not run at all. Check the Triggers panel (Section 8).

---

## 3. Slack Webhook Diagnostics

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

### Symptom: One person's DM not arriving

The personal webhooks live inside `SLACK_DM_WEBHOOKS` (JSON object). Check:

1. Is their name spelled exactly as in `STAFF_LIST` (case-sensitive)? "Joffy" not "joffy".
2. Is the JSON syntactically valid? A missing comma breaks the whole object. Paste it into a JSON validator to confirm.
3. Is the webhook URL still valid? Test with curl as above.
4. Is the property updated in BOTH Apps Script projects? See [`02-staff-and-access-management.md`](02-staff-and-access-management.md) Section 8 for the dual-update rule.

---

## 4. Email Recipient Diagnostics

### Symptom: One recipient is not receiving emails

In order:

1. **Check their spam folder.** Search "Waratah shift report".
2. **Send a TEST email manually.** Run `verifyScriptProperties()` to confirm the recipient is in the list. Then send a TEST shift report and check the Executions panel for `MailApp.sendEmail` calls and their addressee.
3. **Check the JSON object validity.** `WARATAH_EMAIL_RECIPIENTS` must be a valid JSON object mapping email to display name. Stray commas, mismatched quotes, or duplicate keys break the parse.
4. **Check Gmail daily send quota.** If the script has sent more than 100 emails in 24 hours (Workspace) or 20 emails (free Gmail), MailApp will fail. Wait 24 hours or upgrade the account.
5. **Check whether their mailbox is full.** Ask the recipient.

### Symptom: All recipients are missing emails

If no recipient received the email, the failure is at the script level, not per-recipient:

1. Check Executions panel for the relevant nightly send. Look at the log output for `MailApp.sendEmail` calls.
2. If `MailApp.sendEmail` did not appear in logs, the email step did not run. The send pipeline failed before reaching email; check the warehouse and Slack steps.
3. If `MailApp.sendEmail` appeared but logged an error: read the error. Common: quota exceeded, sender address not authorised.

---

## 5. Rollover Recovery

The weekly rollover (Monday 9pm) has the most moving parts. When it fails partway, the spreadsheet can be in an inconsistent state: tabs renamed but cells not cleared, or PDF saved but data not cleared, and so on.

### Symptom: Tuesday morning, the tabs still show last week's dates

The rollover did not run, or ran and failed before the rename step.

**Recovery:**

1. Check Executions panel of the Shift Report project for Monday around 9pm. Look for `performWeeklyRollover` (or `pw_performWeeklyRollover`).
2. If no execution exists, the trigger did not fire. Check the Triggers panel: is the trigger installed? (Phase 1.3 may not have installed triggers yet.)
3. If the execution failed, read the log to see where it failed.
4. Recovery: from the spreadsheet menu, run **Waratah Tools > Admin Tools > Run Weekly Rollover Now** (password gated). This re-runs the rollover idempotently. If the previous run had partial success, this one should complete the unfinished steps.

### Symptom: Tabs are renamed for new week, but old data is still in cells

The rollover archived and renamed but the clear step did not complete.

**Recovery:**

1. Do not let anyone type fresh data into the cells.
2. Confirm with the Executions panel: did `performWeeklyRollover` complete fully or fail at the clear step?
3. From the menu, run **Waratah Tools > Admin Tools > Clear Manager Inputs (Day)** for each affected tab.
4. Verify the cells are now empty.

### Symptom: PDF or spreadsheet copy missing from Drive archive

Drive permission failure, or the `ARCHIVE_ROOT_FOLDER_ID` is pointing at the wrong folder.

**Recovery:**

1. Check the Drive folder ID in `ARCHIVE_ROOT_FOLDER_ID` Script Property. Open that ID in Drive and confirm it is the expected archive folder.
2. Confirm the script owner has Edit access to the folder.
3. Re-run **Run Weekly Rollover Now** which re-archives the week.

### Symptom: Rollover ran but Slack confirmation did not post

The rollover succeeded; the confirmation post failed. This is a Slack webhook issue. See Section 3.

---

## 6. Trigger Destruction After Deployment

When you push code via `clasp push`, **Google Apps Script may destroy all installed time-based triggers** for the project. This is by design (the new code may have renamed or removed the trigger handler functions, so old triggers would orphan).

After every clasp push, **assume triggers need re-installation**. See [`04-deployment-and-clasp.md`](04-deployment-and-clasp.md) for the full post-deploy checklist.

### How to detect trigger destruction

1. Open Apps Script project > left sidebar > **Triggers**.
2. Count the triggers. The expected count:
   - Shift Report project: 3 time-based triggers (rollover Mon 9pm, digest Mon 4pm, backfill Mon 2am).
   - Task Management project: 6 time-based triggers (bi-hourly cleanup, daily 6am workload, daily 7am maintenance, Mon 6am archive, Mon 10am summary, on-edit handler).
3. If a count is short, re-install the missing triggers from the relevant menu items.

### Recovery procedure

For the Shift Report project, from the spreadsheet menu:

- **Admin Tools > Reinstall Weekly Rollover Trigger** (creates Mon 9pm trigger)
- **Admin Tools > Reinstall Revenue Digest Trigger** (creates Mon 4pm)
- **Admin Tools > Reinstall Weekly Backfill Trigger** (creates Mon 2am)

For the Task Management project, equivalent menu items exist. Open that spreadsheet's Waratah Tools menu.

After reinstalling, verify each trigger appears in the Triggers panel with the correct function name and schedule.

---

## 7. Revenue Digest Diagnostics

### Symptom: No digest posted Monday at 4pm

1. Executions panel: did the digest function (`sendWeeklyDigest_Waratah` or similar) run Monday at 4pm? If not, trigger not installed; see Section 6.
2. If it ran and failed: read the log. Common: warehouse spreadsheet not reachable (`WARATAH_DATA_WAREHOUSE_ID` Script Property is wrong or revoked), or no data rows found for the week (warehouse never received the week's nightly data; check the backfill).
3. Recovery: run **Waratah Tools > Admin Tools > Run Revenue Digest Now** to manually post the digest.

### Symptom: Digest posted but shows zero or negative revenue

The data is in the warehouse but malformed:

1. Open the warehouse spreadsheet (`WARATAH_DATA_WAREHOUSE_ID`).
2. Filter NIGHTLY_FINANCIAL by date range = last week.
3. Inspect each row's Net Revenue column. Look for negatives, blanks, or extreme outliers.
4. If a row has a typo (e.g. cash variance accidentally typed as negative net revenue), correct it manually in the warehouse.
5. Re-run the digest with **Run Revenue Digest Now** to repost with the corrected number.

---

## 8. Dashboard Rebuild

The Analytics and Executive Dashboard tabs in the shift report spreadsheet rebuild automatically on a schedule, but you can force a rebuild.

### When to force rebuild

- After a manual warehouse correction (Section 7 above) to refresh the dashboards.
- After deploying new code that changed the dashboard formulas.
- When you spot stale or wrong numbers and want to ensure the dashboard is computing fresh.

### Procedure

1. Open the shift report spreadsheet.
2. **Waratah Tools > Admin Tools > Rebuild All Dashboards** (password gated).
3. Wait for the success message; can take 30 to 60 seconds.
4. Verify the dashboards show the expected current values.

If rebuild fails, check the Executions panel for the function `pw_buildFinancialDashboard` or `pw_buildExecutiveDashboard` and read the error.

---

## 9. Task Management Diagnostics

### Symptom: Tasks from last night's shift report did not appear in Task Management

1. Check Executions panel of the Shift Report project for the relevant nightly send. Look for the task-sync step (usually `pushTasksToManagement_` or similar). Did it run?
2. If it ran and failed: read the error. Common: `TASK_MANAGEMENT_SPREADSHEET_ID` Script Property is wrong, or the Task Management spreadsheet is unreachable.
3. Recovery: from the shift report spreadsheet menu, **Waratah Tools > Admin Tools > Re-sync Tasks** for that day's tab.

### Symptom: Task DMs not arriving for assignments

See Section 3 above (Slack webhook diagnostics). Apply the dual-update rule: confirm `SLACK_DM_WEBHOOKS` is set in BOTH projects.

### Symptom: BLOCKED task did not escalate after 14 days

The escalation runs as part of the daily 7am task maintenance trigger.

1. Check Executions panel of the Task Management project for `runDailyTaskMaintenance` (or similar) on a recent morning. Did it run?
2. If yes: read its log for the escalation step. The log should list any tasks that triggered escalation.
3. Confirm `ESCALATION_EMAIL` and `ESCALATION_SLACK_WEBHOOK` Script Properties point at correct targets.
4. Recovery: from the Task Management spreadsheet menu, **Waratah Tools > Admin Tools > Run Escalation Now**.

---

## 10. Quick-Reference Table

| Symptom | First check | Section |
|---|---|---|
| Slack message missing | Slack workspace status, then webhook curl test | 3 |
| Email missing for one person | Spam folder, then JSON validity | 4 |
| Email missing for all | Executions panel, MailApp.sendEmail log | 4 |
| Rollover didn't run | Executions panel for `performWeeklyRollover` | 5 |
| Tabs renamed but data not cleared | Confirm rollover partial-fail state, then clear menu item | 5 |
| Trigger missing after deploy | Triggers panel count vs expected (3 SR + 6 TM) | 6 |
| No digest Monday afternoon | Trigger installed? Then warehouse reachable? | 7 |
| Dashboard showing wrong numbers | Force rebuild | 8 |
| Tasks from last night missing in Task Management | Task-sync step in execution log | 9 |
| Task DM not arriving | SLACK_DM_WEBHOOKS in both projects | 9 |
| BLOCKED task not escalating | Daily task maintenance execution log | 9 |

---

## 11. Escalating Beyond Yourself

If you have worked through this guide and the issue is unresolved, you need developer help. Compose a report including:

1. **Symptom in one sentence.** "Friday night's Slack message did not post."
2. **The execution log entry** (copy-paste the failing Executions panel entry, redacting any webhook URLs).
3. **What you tried.** "Tested webhook with curl, returned ok. Resent the report manually, also failed."
4. **What you suspect.** "Possibly a script-side issue, not webhook."

Send to Evan, or if Evan is offline, send to the integration alert email (`INTEGRATION_ALERT_EMAIL_PRIMARY` in Script Properties).

For after-hours weekend service-night failures, call rather than email. The on-call response window is tight.
