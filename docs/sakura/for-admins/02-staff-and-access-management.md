# Staff and Access Management

**Audience:** Admin operators handling people-level changes at Sakura House: joiners, leavers, recipient list updates, webhook changes, and the admin password.

This file covers the full procedures. The manager-tier equivalent ([`/docs/sakura/for-managers/04-staff-and-recipients.md`](../for-managers/04-staff-and-recipients.md)) covers only the safe parts (knowing who is on the list and asking you for changes). This file is the canonical procedure for everything that requires Script Properties or code access.

---

## 1. Overview of What Changes When a Person Changes

When a staff member joins, leaves, or changes role at Sakura House, the following touch points may all need updating depending on their access pattern:

| Touch point | Lives in | Required for |
|---|---|---|
| `STAFF_LIST` constant in `EnhancedTaskManagement_Sakura.gs` | Code (hard-coded) | Showing in the Task Management Staff Allocated dropdown |
| `SAKURA_EMAIL_RECIPIENTS` Script Property | Shift Report project | Receiving nightly PDF email |
| `SLACK_DM_WEBHOOKS` Script Property | Task Management project | Receiving personal Slack DMs for task assignments |
| Slack workspace access | Slack admin (separate) | Reading any channel or DM |
| Google Drive folder permissions | Drive admin (separate) | Reading archived reports |
| `ESCALATION_EMAIL` / `ESCALATION_SLACK_WEBHOOK` Script Property | Task Management project | Receiving BLOCKED-task escalations (typically Evan only) |

Not every change needs every touch point. A new floor staff member who never sees the nightly report probably needs only `STAFF_LIST`. A new manager joining probably needs all six.

---

## 2. The Current STAFF_LIST (Code, Hard-Coded)

The Task Management Staff Allocated dropdown is driven by a hard-coded constant in `SAKURA HOUSE/TASK MANAGEMENT SCRIPTS/EnhancedTaskManagement_Sakura.gs` (lines 275-288). As of the latest deploy it contains exactly 12 entries:

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

Entries 7-12 are role-bucket aliases, not real people. Tasks assigned to a role bucket (e.g. "FOH Team") will not trigger a personal DM because no individual webhook resolves; that is by design.

---

## 3. The Current Email Recipients and DM Webhook Map (Not Listed Here)

The current contents of `SAKURA_EMAIL_RECIPIENTS` and `SLACK_DM_WEBHOOKS` live in Script Properties and are intentionally not duplicated into this doc to avoid drift.

To view the current state, open the relevant Apps Script project (Extensions > Apps Script > Project Settings > Script Properties) or run from the Apps Script editor:

```javascript
PropertiesService.getScriptProperties().getProperty('SAKURA_EMAIL_RECIPIENTS');
PropertiesService.getScriptProperties().getProperty('SLACK_DM_WEBHOOKS');
```

Both values are JSON strings.

---

## 4. Adding a New Staff Member (Full Procedure)

Walk through the steps below in order. Skip any step that does not apply.

### Step 1: Decide their access level

Before touching any code or Script Properties, decide:

- Do they need to appear in the task assignee dropdown? (Almost always yes for staff who work at the venue.)
- Will they receive the nightly PDF email? (Yes for managers and Evan; no for floor staff.)
- Will they receive personal Slack DMs for task assignments? (Yes if they will be assigned tasks; no otherwise.)
- Will they receive escalations? (Almost always no. Escalations stay with Evan unless deputised.)

### Step 2: Add to `STAFF_LIST` in code

Edit `SAKURA HOUSE/TASK MANAGEMENT SCRIPTS/EnhancedTaskManagement_Sakura.gs` (the `STAFF_LIST` constant starts at line 275).

```javascript
const STAFF_LIST = [
  "Evan",
  "Nick",
  "Gooch",
  "Cynthia",
  "Adam",
  "Ian",
  "NewPerson",
  "FOH Team",
  "Bar Team",
  "Kitchen Team",
  "All",
  "Contractor",
  "General Management"
];
```

Place the new name in the named-person section (above `"FOH Team"`). Save.

Deploy via `clasp push` from `SAKURA HOUSE/TASK MANAGEMENT SCRIPTS/` (see [`04-deployment-and-clasp.md`](04-deployment-and-clasp.md)).

After deployment, in the Task Management spreadsheet run **Task Management > Admin Tools > Cleanup > Reapply Dropdowns & Formatting**. This calls `reapplyFormattingAndValidation()` (defined at `EnhancedTaskManagement_Sakura.gs:1675`, password-gated wrapper `protected_reapplyFormattingAndValidation()` at `Menu_Updated_Sakura.gs:131`). It refreshes the dropdown so the new name appears. Verify by clicking any Staff Allocated cell.

### Step 3: Get their personal Slack DM webhook (if applicable)

If the new person will receive personal DMs for task assignments, they need to generate their own Slack incoming webhook:

1. The new person opens Slack > Settings & administration > Manage apps > Incoming Webhooks > Add to Slack.
2. They choose to post messages "To a specific channel" and select **their own DM (Slackbot or themselves)**.
3. They click Add Incoming Webhooks Integration. Slack generates a webhook URL.
4. They send the URL to you (the admin).

Treat the URL as a secret. Do not share it beyond the admin role.

### Step 4: Add to `SLACK_DM_WEBHOOKS` Script Property (Task Management project)

The `SLACK_DM_WEBHOOKS` property is read by the Task Management project (`EnhancedTaskManagement_Sakura.gs:71`).

1. Open the Task Management spreadsheet, Extensions > Apps Script > Project Settings > Script Properties.
2. Find `SLACK_DM_WEBHOOKS`. Click edit.
3. The value is a JSON object mapping staff name to webhook URL. Add the new entry:

```json
{
  "Evan": "https://hooks.slack.com/services/.../existing-evan",
  "NewPerson": "https://hooks.slack.com/services/.../new-webhook"
}
```

4. Save.

The staff-name key must match exactly the spelling used in `STAFF_LIST`. A mismatch (e.g. "newperson" vs "NewPerson") silently breaks DM delivery for that person.

### Step 5: Add to `SAKURA_EMAIL_RECIPIENTS` (Shift Report project, if applicable)

The `SAKURA_EMAIL_RECIPIENTS` property is read by the Shift Report project (`NightlyExportSakura.gs:42`).

1. Open the Shift Report spreadsheet, Extensions > Apps Script > Project Settings > Script Properties.
2. Find `SAKURA_EMAIL_RECIPIENTS`. Click edit.
3. The value is a JSON object mapping email address to display name:

```json
{
  "manager1@example.com": "Manager1",
  "newperson@example.com": "NewPerson"
}
```

4. Save.

This property is only in the Shift Report project. The Task Management project does not have an equivalent (task notifications go via Slack DM, not email).

### Step 6: Verify

The Send TEST shift report flow does not exercise `SLACK_DM_WEBHOOKS`. To verify the new person's personal DM, trigger a Task Management assignment instead:

1. Open the Task Management spreadsheet.
2. Create or assign a test task to the new person (set Staff Allocated to their name and Status to TO DO).
3. Confirm the new person receives a Slack DM about the assignment.
4. To verify the email recipient list separately, send a TEST shift report from the shift report spreadsheet via **Shift Report > Send Test Report**. Note: the TEST send delivers to the configured test recipient (Evan by default), not to the full `SAKURA_EMAIL_RECIPIENTS` distribution. To verify a new addition to the LIVE distribution, perform a controlled LIVE send and confirm receipt.

If anything fails, see [`03-advanced-troubleshooting.md`](03-advanced-troubleshooting.md).

### Step 7: Tell managers

Once technical setup is complete, message the manager team: "X is now in the dropdown and on the recipient lists. Tasks assigned to X will DM them in Slack."

---

## 5. Removing a Departing Staff Member (Full Procedure)

Inverse of adding, but with one extra critical step: reassign their open tasks before removal.

### Step 1: Reassign open tasks

In the Task Management spreadsheet, filter by Staff Allocated = the departing person. Reassign each open task (NEW, TO DO, IN PROGRESS, TO DISCUSS, BLOCKED, DEFERRED, RECURRING) to another person or CANCEL it. Recurring tasks owned by the departing person need their template re-pointed.

This step must complete BEFORE removing them from `STAFF_LIST`. Otherwise the Reapply Dropdowns step in Step 4 will leave orphaned tasks pointing at a name that no longer exists in the dropdown.

### Step 2: Remove from `SAKURA_EMAIL_RECIPIENTS`

Shift Report project Script Properties. Find `SAKURA_EMAIL_RECIPIENTS`, remove their email entry, save.

### Step 3: Remove from `SLACK_DM_WEBHOOKS`

Task Management project Script Properties. Find the entry, delete it from the JSON, save.

### Step 4: Remove from `STAFF_LIST` in code

Edit `EnhancedTaskManagement_Sakura.gs`. Remove the name from the list. Save and clasp push.

### Step 5: Reapply dropdowns

Run **Task Management > Admin Tools > Cleanup > Reapply Dropdowns & Formatting**. This refreshes the Task Management dropdown so the removed name disappears from new task entry.

### Step 6: Slack workspace and Drive cleanup

These are separate admin tasks (Slack workspace settings, Drive sharing) and live outside this system.

### Step 7: Verify

Send a TEST shift report. Confirm the removed person:

- Does not appear in the email Bcc/To list (check the TEST email or Logger output).
- Does not receive a Slack DM (they should not see anything in Slack).

---

## 6. Changing Email Recipients

If you are not adding or removing a staff member but want to change who receives the nightly PDF (for example, adding the bookkeeper temporarily):

1. Shift Report project Script Properties > `SAKURA_EMAIL_RECIPIENTS`.
2. Edit the JSON object. Add or remove entries.
3. Save.
4. Send a TEST report to verify the new recipient list.

Email recipients are independent of `STAFF_LIST`. Someone can receive emails without being in the task assignee dropdown (and vice versa).

---

## 7. Changing Slack Webhooks

Slack webhooks may need to change in three situations:

1. **The Slack channel is renamed or archived.** Webhooks become invalid. Regenerate the webhook in Slack and update the property.
2. **A person's personal webhook expires or is regenerated.** They give you the new URL.
3. **The Slack workspace itself changes.** All webhooks need regeneration.

### Channel and routing webhooks (Sakura)

| Property | Lives in | Purpose |
|---|---|---|
| `SAKURA_SLACK_WEBHOOK_LIVE` | Shift Report project (`NightlyExportSakura.gs:24`) | Nightly LIVE post to the Sakura channel |
| `SAKURA_SLACK_WEBHOOK_TEST` | Shift Report + Task Management (`NightlyExportSakura.gs:33`, `SlackBlockKitSAKURA.gs:137`) | TEST post (Evan's DM) |
| `SLACK_MANAGERS_CHANNEL_WEBHOOK` | Task Management project (`EnhancedTaskManagement_Sakura.gs:62`) | Weekly active tasks summary |
| `ESCALATION_SLACK_WEBHOOK` | Task Management project (`EnhancedTaskManagement_Sakura.gs:53`) | BLOCKED-task escalation DM to Evan |

### Procedure (one webhook at a time)

For each webhook that needs changing:

1. Get the new webhook URL (from Slack admin or the recipient).
2. Open the relevant project's Script Properties.
3. Find the property (one of the four above, or the right key inside `SLACK_DM_WEBHOOKS`).
4. Paste the new URL. Save.
5. Send a TEST shift report (or trigger a test task assignment for DM webhooks). Confirm the new webhook posts to the expected destination.

If multiple webhooks need updating at once (workspace move), do them all in one session and run a single TEST send at the end.

---

## 8. Changing the Admin Password

The `MENU_PASSWORD` property gates the admin menu items in both the Shift Report spreadsheet and the Task Management spreadsheet. Both projects use a `MENU_PASSWORD` Script Property:

- Shift Report project: `MenuSakura.gs:18`
- Task Management project: `Menu_Updated_Sakura.gs:17`

Both projects should hold the same value.

### When to change

- After a staff member who knew the password leaves.
- On a scheduled rotation (every 6 months is a reasonable cadence).
- If you suspect the password has leaked.

### Procedure

1. Pick a new password. Write it down somewhere outside the system (password manager).
2. Shift Report project Script Properties > `MENU_PASSWORD`. Set the new value. Save.
3. Task Management project Script Properties > `MENU_PASSWORD`. Set the same new value. Save.
4. From either spreadsheet, try a password-gated menu action. Enter the new password. Confirm it accepts.
5. Try the same action with the OLD password. Confirm it rejects.

If the two projects' passwords drift, you will get the confusing situation where the password works in one spreadsheet's menus but not the other.

### Password recovery

The password is stored only in Script Properties. If the admin forgets it, recovery requires direct edit access to Script Properties, which is available to anyone with edit access to the Apps Script project. There is no separate reset-password flow.

If you have lost edit access to the Apps Script project entirely, contact Google Workspace admin.

---

## 9. Owner Email for Sheet Protection

`SHEET_PROTECTION_OWNER_EMAIL` (Shift Report project, `RunSakura.gs:681`) names the email account that owns sheet-level protections applied by the system. If the named owner loses access to the spreadsheet, protections may become unmanageable. Update only when the previous owner is genuinely being decommissioned; the new value takes effect on the next run of any protection-applying admin function.

---

## 10. Escalation Routing

Two properties govern where BLOCKED-task escalations land. Both live in the Task Management project:

| Property | File:line | Purpose |
|---|---|---|
| `ESCALATION_EMAIL` | `EnhancedTaskManagement_Sakura.gs:44` | Email address that receives the escalation summary |
| `ESCALATION_SLACK_WEBHOOK` | `EnhancedTaskManagement_Sakura.gs:53` | Slack webhook (typically Evan's DM) that receives the escalation message |

The escalation threshold is 14 days BLOCKED, hard-coded (`EnhancedTaskManagement_Sakura.gs:100`). Target name is hard-coded as "Evan" (line 101). If you change who receives escalations, update both the two properties above and the hard-coded `escalateToName` constant in code (then clasp push).

---

## 11. AI Insights Routing

The AI Insights feature has a delivery mode toggle in the Shift Report project:

| Property | File:line | Values |
|---|---|---|
| `AI_INSIGHTS_MODE` | `AIInsightsSakura.gs:969` | `live` or `evan_only` (default `evan_only`) |
| `AI_INSIGHTS_EVAN_EMAIL` | `AIInsightsSakura.gs:979` | Email used when mode is `evan_only` |

The feature itself is always running. The mode controls routing only:

- `evan_only`: insight email goes to `AI_INSIGHTS_EVAN_EMAIL`, or Slack post goes to `SAKURA_SLACK_WEBHOOK_TEST`.
- `live`: insight is delivered through the normal channel paths used by the nightly report.

To promote AI Insights from quiet mode to live, change `AI_INSIGHTS_MODE` to `live`. To roll back, change to `evan_only`.

---

## 12. Cross-Project Considerations

Sakura House runs as two separate Apps Script projects (Shift Report and Task Management):

- `STAFF_LIST` lives only in the Task Management project. The Shift Report nightly PDF flow does not consult `STAFF_LIST`; it uses FOH/BOH names typed into the named ranges `fohStaff` (B6:D6) and `bohStaff` (B7:D7) for that shift.
- `SAKURA_EMAIL_RECIPIENTS` is Shift Report only. `SLACK_DM_WEBHOOKS` is Task Management only. They do not need to be kept in sync.
- `MENU_PASSWORD` and `TASK_MANAGEMENT_SPREADSHEET_ID` are the two properties that genuinely need to match across both projects. When you change one, switch tabs to the other and apply the same change immediately.

---

## 13. Admin Access Policies

Currently only Evan has admin access: editing Script Properties on either project, clasp push, trigger management, knowing the admin password, and Drive ownership of the archive folder (`ARCHIVE_ROOT_FOLDER_ID`).

To grant a second admin (holiday cover, succession): share both Apps Script projects (Edit), share the archive folder (Edit), share the current password, point them at this docs directory.

To revoke: remove from both Apps Script projects' sharing, remove from Drive folder sharing, rotate the password (Section 8), remove from `SLACK_DM_WEBHOOKS` if present, and reassign `ESCALATION_EMAIL` / `ESCALATION_SLACK_WEBHOOK` if they were the target.

---

## 14. Logging Changes

After any people-level change (add, remove, recipient list edit, password rotation), add a one-line note to a change log:

```
2026-05-22: Added X to STAFF_LIST. Added X to SLACK_DM_WEBHOOKS (Task Management project). Reapplied dropdowns. TEST send verified.
```

This is a discipline, not enforced by the system. Future debugging depends on it.
