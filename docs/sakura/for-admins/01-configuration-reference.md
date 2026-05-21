# Configuration Reference

**Audience:** Admin operators with full access to both Sakura House Apps Script projects.

This file is the canonical, single source of truth for every Script Property used by Sakura House's two Apps Script projects. If you are changing settings, this is where you look.

The Sakura House system runs across two Apps Script projects, each with its own `appsscript.json` and its own Script Properties store:

| Project | Folder | What it powers |
|---|---|---|
| **Shift Report** | `SAKURA HOUSE/SHIFT REPORT SCRIPTS/` | Shift report spreadsheet (nightly send, weekly rollover, dashboards, warehouse writes, AI insights, weekly digest) |
| **Task Management** | `SAKURA HOUSE/TASK MANAGEMENT SCRIPTS/` | Task tracking spreadsheet (9-status workflow, escalations, weekly summary, dashboard) |

The Shift Report project stores **14 keys**. The Task Management project stores **9 keys**, of which five overlap with the Shift Report project (`MENU_PASSWORD`, `VENUE_NAME`, `SAKURA_SLACK_WEBHOOK_TEST`, `SAKURA_DATA_WAREHOUSE_ID`, `TASK_MANAGEMENT_SPREADSHEET_ID`) and must be kept in sync.

---

## 1. How to View or Change Script Properties

1. Open the relevant spreadsheet (Shift Report spreadsheet for shift-report properties; Task Management spreadsheet for task properties).
2. Go to **Extensions > Apps Script**. This opens the Apps Script editor for that spreadsheet's bound project.
3. In the left sidebar, click the gear icon (**Project Settings**).
4. Scroll down to the **Script Properties** section.
5. Click **Edit script properties** to add, edit, or delete a property.
6. After changes, click **Save script properties** at the bottom.

After saving, the new value takes effect immediately on the next code execution. You do not need to redeploy or restart anything.

**Two-project caution:** if you are editing a key that exists in both projects (see Section 4), edit both copies in the same session. The two stores are independent; saving one does not propagate to the other.

---

## 2. Shift Report Project Properties (14 keys)

### Venue and Access

| Property | Format | Required | What it controls | Read at |
|---|---|---|---|---|
| `VENUE_NAME` | String, always `"SAKURA"` | Yes | Venue identifier; the shared codebase branches on this value. Never change. | `VenueConfigSakura.gs:23` |
| `MENU_PASSWORD` | Plain string | Yes | Admin password for password-gated menu items. Also stored in Task Management project; the two must match. | `MenuSakura.gs:18` |
| `SHEET_PROTECTION_OWNER_EMAIL` | Email address | Optional | If set, only this email can edit protected ranges set up by the sheet-protection routines. If unset, falls back to the script owner. | `RunSakura.gs:681` |

### Slack Webhooks

| Property | Format | Required | What it controls | Read at |
|---|---|---|---|---|
| `SAKURA_SLACK_WEBHOOK_LIVE` | Slack incoming webhook URL | Yes | Where LIVE nightly shift report Slack messages and the Monday weekly revenue digest go. | `NightlyExportSakura.gs:24` |
| `SAKURA_SLACK_WEBHOOK_TEST` | Slack incoming webhook URL | Yes | Where TEST shift report messages go. Also used as the routing target for AI insights in `evan_only` mode. Cross-project: also read by the Task Management project. | `NightlyExportSakura.gs:33` |

### Email Recipients and Alerts

| Property | Format | Required | What it controls | Read at |
|---|---|---|---|---|
| `SAKURA_EMAIL_RECIPIENTS` | JSON object, `{"email": "Name", ...}` | Yes | Recipients of the nightly PDF email. JSON object format, not array. | `NightlyExportSakura.gs:42` |
| `INTEGRATION_ALERT_EMAIL_PRIMARY` | Email address | Yes | Primary email for warehouse-write and integration-hub failure alerts. Usually Evan. | `WeeklyRolloverInPlace.gs:69` |

### Spreadsheet and Folder IDs

| Property | Format | Required | What it controls | Read at |
|---|---|---|---|---|
| `SAKURA_WORKING_FILE_ID` | Google Sheets file ID | Yes | The Sakura shift report spreadsheet itself. Used by the weekly rollover as a safety guard comparing against the active spreadsheet ID. | `WeeklyRolloverInPlace.gs:48` |
| `ARCHIVE_ROOT_FOLDER_ID` | Google Drive folder ID | Yes | Root of the weekly rollover archive structure (subfolders per week). | `WeeklyRolloverInPlace.gs:52` |
| `SAKURA_DATA_WAREHOUSE_ID` | Google Sheets file ID | Yes | Central data warehouse spreadsheet for nightly numbers, operational events, wastage/comps, qualitative log, and AI insights. Cross-project: also read by the Task Management project. | `IntegrationHubSakura.gs:25` |
| `TASK_MANAGEMENT_SPREADSHEET_ID` | Google Sheets file ID | Yes | Sakura Actionables Sheet. Used by the shift report's task push step. Cross-project: also read by the Task Management project. | `TaskIntegrationSakura.gs:21` |

### AI Insights

AI insights are shipped and live. `AI_INSIGHTS_MODE` is the live routing toggle, not an on/off switch.

| Property | Format | Required | What it controls | Read at |
|---|---|---|---|---|
| `ANTHROPIC_API_KEY` | API key string, starts with `sk-ant-` | Yes (for AI insights) | Claude API key used by `AIInsightsSakura.gs`. The Claude model is `claude-haiku-4-5-20251001`; endpoint `https://api.anthropic.com/v1/messages`; API version header `2023-06-01`. | `AIInsightsSakura.gs:153` |
| `AI_INSIGHTS_MODE` | String, `"live"` or `"evan_only"` | Optional (defaults to `evan_only`) | Routing toggle. `evan_only` delivers AI insight output to Evan only (email + test Slack webhook). `live` delivers insights through normal channels. | `AIInsightsSakura.gs:969` |
| `AI_INSIGHTS_EVAN_EMAIL` | Email address | Yes (when `AI_INSIGHTS_MODE=evan_only`) | The email recognised as Evan for `evan_only` routing. | `AIInsightsSakura.gs:979` |

---

## 3. Task Management Project Properties (9 keys)

The Task Management project has its own Script Properties store. Five of its keys overlap with the Shift Report project and must hold identical values.

### Task Management core

| Property | Format | Required | What it controls | Read at |
|---|---|---|---|---|
| `TASK_MANAGEMENT_SPREADSHEET_ID` | Google Sheets file ID | Yes | The Tasks spreadsheet. Cross-project: also set in the Shift Report project. | `EnhancedTaskManagement_Sakura.gs:35` |
| `ESCALATION_EMAIL` | Email address | Yes | Where BLOCKED-for-14-days task escalations are emailed. Usually Evan. | `EnhancedTaskManagement_Sakura.gs:44` |
| `ESCALATION_SLACK_WEBHOOK` | Slack incoming webhook URL | Yes | Slack DM (Evan) used for escalation alerts. | `EnhancedTaskManagement_Sakura.gs:53` |
| `SLACK_MANAGERS_CHANNEL_WEBHOOK` | Slack incoming webhook URL | Yes | Managers channel. Receives the Monday 6am weekly active task summary and other manager-facing notifications. | `EnhancedTaskManagement_Sakura.gs:62` |
| `SLACK_DM_WEBHOOKS` | JSON object, `{"StaffName": "webhook_url", ...}` | Optional | Personal Slack DMs per staff member. Keys must exactly match entries in the `STAFF_LIST` constant. | `EnhancedTaskManagement_Sakura.gs:71` |
| `MENU_PASSWORD` | Plain string | Yes | Admin password for password-gated menu items. Cross-project: must match Shift Report copy. | `Menu_Updated_Sakura.gs:17` |

### Cross-project copies (also stored in Shift Report)

| Property | Format | Required | What it controls | Read at |
|---|---|---|---|---|
| `VENUE_NAME` | String, always `"SAKURA"` | Yes | Venue identifier; mirrors the Shift Report copy. | `VenueConfigSakura.gs:23` (task-management side) |
| `SAKURA_DATA_WAREHOUSE_ID` | Google Sheets file ID | Yes | Warehouse spreadsheet ID, used by Slack Block Kit task-management messages that link to warehouse rows. | `SlackBlockKitSAKURA.gs:164` |
| `SAKURA_SLACK_WEBHOOK_TEST` | Slack incoming webhook URL | Yes | TEST webhook used by task management Slack test paths and the test variant of `sendWeeklyActiveTasksSummary`. | `SlackBlockKitSAKURA.gs:137`, `TaskDashboard_Sakura.gs:584` |

---

## 4. Properties That Exist in Both Projects

Five keys are written into both projects' Script Properties stores. All five are functionally read in at least one runtime path in each project and must stay in sync.

| Property | SR project | TM project | Notes |
|---|---|---|---|
| `MENU_PASSWORD` | Yes | Yes | Both projects gate admin menu items with this. Divergence breaks one menu's password. |
| `VENUE_NAME` | Yes | Yes | Branching value for the shared codebase. Must equal `"SAKURA"` in both. |
| `SAKURA_SLACK_WEBHOOK_TEST` | Yes | Yes | SR uses it for TEST nightly send and AI insights routing in `evan_only` mode; TM uses it for test variants of weekly task summary and Block Kit. |
| `SAKURA_DATA_WAREHOUSE_ID` | Yes | Yes | SR writes nightly rows; TM reads it to build links and dashboard data. |
| `TASK_MANAGEMENT_SPREADSHEET_ID` | Yes | Yes | SR pushes the nightly TO-DO list; TM is bound to the same spreadsheet. |

**Procedure when changing one:**

1. Open the Shift Report spreadsheet, Extensions > Apps Script > Project Settings > Script Properties. Update the value.
2. Open the Task Management spreadsheet, Extensions > Apps Script > Project Settings > Script Properties. Update the same value.
3. Save in both. Run a TEST send from the shift report menu to confirm the update.

---

## 5. Trigger Reference

Sakura House runs four scheduled time-driven triggers across the two projects. All times are in Australia/Sydney.

| Function | Project | Schedule | Purpose | Code line |
|---|---|---|---|---|
| `runDailyTaskMaintenance` | Task Management | Daily 7am | Updates Days Open, archives DONE/CANCELLED older than 8 days, escalates BLOCKED tasks past the 14-day threshold to Evan. | `EnhancedTaskManagement_Sakura.gs:1250` |
| `sendWeeklyActiveTasksSummary` | Task Management | Monday 6am | Posts the active-task summary to the managers channel only (DMs disabled May 2026). | `EnhancedTaskManagement_Sakura.gs:1296` |
| `performInPlaceRollover` | Shift Report | Monday 10am | Weekly in-place rollover: archives the prior week's spreadsheet and PDF, clears 22 of 24 FIELD_CONFIG fields (excludes the `netRevenue` formula cell), renames tabs. | `WeeklyRolloverInPlace.gs:1019` |
| `sendWeeklyRevenueDigest_Sakura` | Shift Report | Monday 8am | Posts a weekly revenue digest to the LIVE Slack webhook. | `WeeklyDigestSakura.gs:18` |

There is also an installable on-edit trigger, `onTaskSheetEditWithAutoSort`, in the Task Management project (`EnhancedTaskManagement_Sakura.gs:1135`). It is not scheduled; it fires on Tasks sheet edits.

Trigger creator menu items live under **Shift Report > Admin Tools > Set Up & Diagnostics** (rollover, digest) and under the equivalent Task Management menu (`createDailyMaintenanceTrigger`, `createWeeklySummaryTrigger`, `createOnEditTrigger`).

The previously-existing menu items **Send Overdue Summary Now** and **Create Overdue Summary Trigger** were removed on 2 April 2026. They no longer exist in the menu and no overdue-summary trigger should be running. If you find one in **Triggers** in the Apps Script editor, delete it.

---

## 6. Property Value Formats

A few formats are easy to get wrong. Use these examples as templates.

### `SAKURA_EMAIL_RECIPIENTS` (JSON object)

```json
{
  "evan@pollenhospitality.com": "Evan",
  "nick@sakurahousesydney.com": "Nick",
  "adam@pollenhospitality.com": "Adam"
}
```

Paste the whole JSON as a single string. Apps Script `JSON.parse()` reads it at runtime. Common mistakes: trailing commas (invalid JSON), unescaped quotes inside names, or using a JSON array form (`["email1", "email2"]`). The value must be a JSON object mapping email to display name.

### `SLACK_DM_WEBHOOKS` (JSON object)

```json
{
  "Evan": "https://hooks.slack.com/services/T.../B.../...",
  "Nick": "https://hooks.slack.com/services/T.../B.../...",
  "Adam": "https://hooks.slack.com/services/T.../B.../..."
}
```

Keys must exactly match the staff names in the `STAFF_LIST` constant (case-sensitive). `STAFF_LIST` has 12 entries: Evan, Nick, Gooch, Cynthia, Adam, Ian, FOH Team, Bar Team, Kitchen Team, All, Contractor, General Management. Only entries with real people need DM webhooks; team-shaped values (`FOH Team`, `All`, etc.) do not.

### Spreadsheet IDs

The 44-character string between `/d/` and `/edit` in a Google Sheets URL:

```
https://docs.google.com/spreadsheets/d/1AbC...XyZ/edit
                                       ^----- ID -----^
```

### Drive Folder IDs

Open the folder in Drive, copy the ID from the URL after `/folders/`:

```
https://drive.google.com/drive/folders/1ABC123XYZ.../
                                       ^- ID -^
```

### Webhook URLs

Slack incoming webhooks have the form `https://hooks.slack.com/services/T.../B.../...`. Treat them as secrets; do not check them into git.

---

## 7. Things You Should Never Change Without a Code Review

Some values are load-bearing for the entire system. Changing them breaks things downstream.

- **`VENUE_NAME`**: must be exactly `"SAKURA"`. The shared codebase branches on this value.
- **Named ranges (`<DAY>_SR_<Field>`)**: 24 fields times 6 day prefixes equals 144 named ranges (for example, `MONDAY_SR_NetRevenue`). The code uses these as the primary cell reference; hardcoded cells are fallbacks only. Do not rename or delete named ranges manually.
- **`FIELD_CONFIG` order (`RunSakura.gs:29-190`)**: the 24-field FIELD_CONFIG defines field key, suffix, fallback cell, and formula flag. Reordering or renaming entries breaks the warehouse pipeline and the rollover clear list.
- **Warehouse column order**: the NIGHTLY_FINANCIAL warehouse sheet is 16 columns A through P (`IntegrationHubSakura.gs:412-429`). The `OPERATIONAL_EVENTS` sheet is 9 columns A-I, `WASTAGE_COMPS` is 5 columns A-E, `QUALITATIVE_LOG` is 11 columns A-K. Adding columns to these sheets manually will break duplicate detection (which uses Date + MOD) and downstream dashboard queries.
- **Task statuses**: there are 9 statuses (`NEW`, `TO DO`, `IN PROGRESS`, `TO DISCUSS`, `BLOCKED`, `DEFERRED`, `DONE`, `CANCELLED`, `RECURRING`). `RECURRING` is a status, not a flag; recurrence frequency lives in the separate Recurrence column (L) with values `None`, `Weekly`, `Fortnightly`, `Monthly`. Do not edit the statuses or the column layout (15 columns A-O) without a code review.
- **Operating days**: Sakura runs Monday to Saturday (`VenueConfigSakura.gs:38`); closed Sunday. The `VALID_DAY_PREFIXES` list in `RunSakura.gs:23` mirrors this. Changing operating days requires named range generation, FIELD_CONFIG, and rollover updates.
- **Formula cells**: cells starting with `=` are calculations. The `netRevenue` field (B54) is a formula and is excluded from the rollover clear list. Editing it blanks the formula.
- **Tab names**: the rollover script renames day tabs each Monday. Do not rename tabs manually. Adding new tabs is fine; renaming the day tabs is not.
- **`STAFF_LIST` in code (`EnhancedTaskManagement_Sakura.gs:275-288`)**: hard-coded, not stored in Script Properties. Changes require a clasp push.

---

## 8. Verifying Configuration Health

After any property change, run a verification sequence:

1. From the shift report spreadsheet menu, **Shift Report > Send Test Report**. A TEST report posts to the TEST Slack channel (`SAKURA_SLACK_WEBHOOK_TEST`) and emails Evan; it does not write to the warehouse or push tasks. If it succeeds end-to-end, the SR configuration is healthy.
2. From the task management spreadsheet menu, **Send Weekly Active Tasks (TEST to Evan)**. This posts the weekly summary to Evan's DM via the test webhook without touching the managers channel.
3. If anything failed, see `03-advanced-troubleshooting.md` for diagnosis.

---

## 9. Property Change Log

Whenever you change a Script Property in production, leave a one-line note in `docs/sakura/_archive/CONFIG_CHANGE_LOG.md` (create the file the first time):

```
2026-05-22: Rotated SAKURA_SLACK_WEBHOOK_LIVE after channel rename. Verified TEST send.
```

This is not enforced by the system; it is a discipline. Future debugging of "the message went to the wrong channel" depends on having this trail.
