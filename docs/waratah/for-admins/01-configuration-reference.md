# Configuration Reference

**Audience:** Admin operators with full access to both Waratah Apps Script projects.

This file is the **canonical, single source of truth** for every Script Property used by The Waratah's two Apps Script projects. If you are changing settings, this is where you look.

The Waratah system runs across two Apps Script projects:

| Project | What it powers | Properties stored |
|---|---|---|
| **Shift Report project** | The shift report spreadsheet (nightly send, weekly rollover, dashboards, warehouse writes) | 20 written by `setupScriptProperties()` (18 required + 2 default AI Insights); plus 3 optional manually-set properties = up to 23 total |
| **Task Management project** | The Task Management spreadsheet (task tracking, dashboard, escalations) | 6 properties (overlapping with Shift Report project; see Section 8 for which are functionally dual-read) |

The two projects are separate Apps Script bundles with their own Script Properties stores. Some properties exist in both projects and must be kept in sync.

---

## 1. How to View or Change Script Properties

1. Open the relevant spreadsheet (Shift Report spreadsheet for shift-report properties; Task Management spreadsheet for task properties).
2. Go to **Extensions > Apps Script**. This opens the Apps Script editor for that spreadsheet's bound project.
3. In the left sidebar, click the gear icon (**Project Settings**).
4. Scroll down to the **Script Properties** section.
5. Click **Edit script properties** to add, edit, or delete a property.
6. After changes, click **Save script properties** at the bottom.

After saving, the new value takes effect immediately on the next code execution. You do not need to redeploy or restart anything.

**Two-project caution:** if you are editing a property that exists in BOTH projects (see Section 8), edit BOTH copies in the same session for hygiene. Note that only `MENU_PASSWORD` and `TASK_MANAGEMENT_SPREADSHEET_ID` are functionally read by both projects at runtime; the others are stored in the Shift Report project for symmetry only.

---

## 2. Shift Report Project Properties (20 written by setup, plus optional)

### Venue and Access

| Property | Format | Required | What it does |
|---|---|---|---|
| `VENUE_NAME` | String, always `"WARATAH"` | Yes | Controls which code path runs (shared codebase between venues). Must be exactly `WARATAH`. Never change. |
| `MENU_PASSWORD` | Plain string | Yes | Admin password for password-gated menu items. Also stored in Task Management project; the two must match. See [`02-staff-and-access-management.md`](02-staff-and-access-management.md) Section 6 for rotation procedure. |

### Slack Webhooks

| Property | Format | Required | What it does |
|---|---|---|---|
| `WARATAH_SLACK_WEBHOOK_LIVE` | Slack incoming webhook URL | Yes | Where LIVE shift report Slack messages go. Test by sending a LIVE report. Note: read dynamically as `${VENUE_NAME}_SLACK_WEBHOOK_LIVE` (`NightlyExportWaratah.js:32-53`); changing `VENUE_NAME` would change the expected key name. |
| `WARATAH_SLACK_WEBHOOK_TEST` | Slack incoming webhook URL | Yes | Where TEST shift report messages go. A separate channel for safe testing. Read dynamically (see note above). |
| `SLACK_MANAGERS_CHANNEL_WEBHOOK` | Slack incoming webhook URL | Yes | Managers channel for task escalations and related alerts. Stored in the Shift Report project for symmetry, but read only by the Task Management project at runtime. |
| `SLACK_DM_WEBHOOKS` | JSON object, `{"StaffName": "webhook_url", ...}` | Yes | Personal Slack DMs per staff member, used by the Task Management project. Six recipients currently configured (see [`02-staff-and-access-management.md`](02-staff-and-access-management.md) Section 4). Stored in the Shift Report project for symmetry only; the Shift Report nightly pipeline does not read this property. |

### Email Recipients

| Property | Format | Required | What it does |
|---|---|---|---|
| `WARATAH_EMAIL_RECIPIENTS` | JSON object, `{"email1": "Name1", "email2": "Name2", ...}` | Yes | Six recipients of the nightly PDF. JSON object format, not JSON array. |
| `INTEGRATION_ALERT_EMAIL_PRIMARY` | Email address (string) | Yes | Primary email for warehouse-write and integration-hub failure alerts. |
| `INTEGRATION_ALERT_EMAIL_SECONDARY` | Email address (string) | Yes | Backup email for failures, used if primary cannot be reached. |

### Spreadsheet and Folder IDs

| Property | Format | Required | What it does |
|---|---|---|---|
| `WARATAH_SHIFT_REPORT_CURRENT_ID` | Google Sheets file ID | Yes | The shift report spreadsheet itself. Used by setup and verification routines. |
| `WARATAH_WORKING_FILE_ID` | Google Sheets file ID | Yes | Used by the weekly rollover as a safety guard comparing against the active spreadsheet ID. Usually identical to `WARATAH_SHIFT_REPORT_CURRENT_ID`. |
| `WARATAH_SHEET_ID` | Google Sheets file ID | Optional fallback | Recognised by `IntegrationHubWaratah.js:31` as a fallback for `WARATAH_SHIFT_REPORT_CURRENT_ID`. Keep in sync if set. |
| `WARATAH_TASK_MANAGEMENT_ID` | Google Sheets file ID | Yes | The Task Management spreadsheet. Read by `IntegrationHubWaratah.js`. |
| `TASK_MANAGEMENT_SPREADSHEET_ID` | Google Sheets file ID | Yes | Read by `TaskIntegrationWaratah.js` and the EnhancedTaskManagement code path. These are independent properties read by different files; admins must set them to identical values. |
| `WARATAH_DATA_WAREHOUSE_ID` | Google Sheets file ID | Yes | Central data warehouse spreadsheet for nightly numbers. |
| `WARATAH_CASH_RECON_FOLDER_ID` | Google Drive folder ID | Yes | Drive folder holding cash reconciliation copies. |
| `ARCHIVE_ROOT_FOLDER_ID` | Google Drive folder ID | Yes | Root of weekly rollover archive structure (subfolders per week). |

### Task Management Escalation

| Property | Format | Required | What it does |
|---|---|---|---|
| `ESCALATION_EMAIL` | Email address (string) | Yes | Where BLOCKED-for-14-days task escalations are emailed. Usually Evan. Read by the Task Management project; the Shift Report project stores it for symmetry only. |
| `ESCALATION_SLACK_WEBHOOK` | Slack incoming webhook URL | Yes | Where escalations post to Slack. Usually the manager channel or Evan's DM. Read by the Task Management project; the Shift Report project stores it for symmetry only. |

### AI Insights (optional but recommended)

| Property | Format | Required | What it does |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | API key string, starts with `sk-ant-` | Optional | Enables Claude-powered shift summaries in the Slack message. If unset, a simpler generic summary is used. Set via `setAnthropicApiKey_Waratah()` menu item, never hard-coded. |
| `AI_INSIGHTS_MODE` | String, `"evan_only"` or `"live"` | Optional (defaulted by setup to `evan_only`) | Soft-launch routing. `evan_only` sends upgraded AI insights to Evan only; everyone else gets generic summary. `live` sends upgraded insights to everyone. |
| `AI_INSIGHTS_EVAN_EMAIL` | Email address (string) | Optional (defaulted by setup) | The email address recognised as Evan for the `evan_only` routing mode. |

### Sheet Protection (optional, manual)

| Property | Format | Required | What it does |
|---|---|---|---|
| `SHEET_PROTECTION_OWNER_EMAIL` | Email address (string) | Optional | If set, only this email can edit protected ranges. If unset, falls back to the script owner. Used by `RunWaratah.js` setup of sheet protections. Not in the standard `_SETUP_ScriptProperties.js`; set manually only if sheet protection is wanted. |

---

## 3. Task Management Project Properties (6, with overlap into Shift Report)

The Task Management project has its own Script Properties store. Six of its properties are also written into the Shift Report project's setup. Of these, only `MENU_PASSWORD` and `TASK_MANAGEMENT_SPREADSHEET_ID` are functionally read by both projects at runtime. The remaining four are stored in the Shift Report project for hygiene and symmetry only; the Shift Report runtime does not read them.

| Property | Format | Required | Read by Shift Report runtime? |
|---|---|---|---|
| `MENU_PASSWORD` | Plain string | Yes | Yes (must match) |
| `TASK_MANAGEMENT_SPREADSHEET_ID` | Google Sheets file ID | Yes | Yes (must match) |
| `SLACK_MANAGERS_CHANNEL_WEBHOOK` | Slack webhook URL | Yes | No (SR copy is hygiene only) |
| `SLACK_DM_WEBHOOKS` | JSON object | Yes | No (SR copy is hygiene only) |
| `ESCALATION_EMAIL` | Email address | Yes | No (SR copy is hygiene only) |
| `ESCALATION_SLACK_WEBHOOK` | Slack webhook URL | Yes | No (SR copy is hygiene only) |

Keeping the two copies in sync is still recommended discipline, but a drift on the four hygiene-only properties will not affect Shift Report behaviour. Drift on `MENU_PASSWORD` or `TASK_MANAGEMENT_SPREADSHEET_ID` will: the password may work in one spreadsheet's menus but not the other, and task sync may target the wrong file.

---

## 4. Setup, Verify, and Reset Functions

The Shift Report project contains three helper functions for managing Script Properties as a batch:

### `setupScriptProperties()`

Sets all 20 standard properties to their initial values. Most values are `<SET_IN_SCRIPT_EDITOR>` placeholders that you must replace by hand after running. Run once after a fresh clasp push of new code. Located in `_SETUP_ScriptProperties.js`.

### `verifyScriptProperties()`

Reads all properties and logs which are set vs missing. Identifies the 18 required properties and the 3 AI Insights properties (optional). Useful sanity check after a deployment or when troubleshooting. Located in `_SETUP_ScriptProperties.js`.

### `resetScriptProperties()`

**Destructive.** Deletes every Script Property in the project. Use only if rebuilding from scratch. Prompts a YES/NO confirmation in the UI before deleting. Located in `_SETUP_ScriptProperties.js`.

The Task Management project has its own equivalent setup file (`_SETUP_ScriptProperties.gs`) that handles its 6 properties.

---

## 5. Google Drive Folder Structure

The weekly rollover archives copies of the spreadsheet and PDF to Google Drive. The configured structure:

```
[Archive Root Folder, set via ARCHIVE_ROOT_FOLDER_ID]
├── 2026-W17/
│   ├── Waratah_Week_YYYY-MM-DD.pdf
│   ├── Waratah_Shift_Report_YYYY-MM-DD.gsheet
│   └── Waratah_Tasks_YYYY-MM-DD.gsheet (if task archive ran)
├── 2026-W18/
└── ...
```

Each week's folder is auto-created on Monday at 9pm by the rollover script. The naming convention is `YYYY-Www` (ISO week).

The cash reconciliation copies live in a separate folder set by `WARATAH_CASH_RECON_FOLDER_ID`.

If Drive permissions or folder paths change, update the relevant ID in Script Properties. The script owner must have write access to both folders.

---

## 6. Property Value Formats

A few formats are easy to get wrong. Use these examples as templates.

### `WARATAH_EMAIL_RECIPIENTS` (JSON object)

```json
{
  "evan@pollenhospitality.com": "Evan",
  "cynthia@pollenhospitality.com": "Cynthia",
  "nick@sakurahousesydney.com": "Nick",
  "properties.litster@gmail.com": "Ian",
  "chef@pollenhospitality.com": "Chef",
  "bar@thewaratahsydney.com": "Jaiden",
  "adam@pollenhospitality.com": "Adam"
}
```

When you store this in Script Properties, paste the whole JSON as a single string. Apps Script's `JSON.parse()` reads it at run time. Common mistakes: stray trailing commas (invalid JSON), unescaped quotes inside names, or accidentally using a JSON array form (`["email1", "email2"]`). Must be a JSON object mapping email to display-name, not an array.

### `SLACK_DM_WEBHOOKS` (JSON object)

```json
{
  "Evan": "https://hooks.slack.com/services/T.../B.../...",
  "Cynthia": "https://hooks.slack.com/services/T.../B.../...",
  "Adam": "https://hooks.slack.com/services/T.../B.../...",
  "Jaiden": "https://hooks.slack.com/services/T.../B.../...",
  "Joffy": "https://hooks.slack.com/services/T.../B.../...",
  "Nick": "https://hooks.slack.com/services/T.../B.../..."
}
```

Keys must exactly match the staff names in the `STAFF_LIST` constant (case-sensitive). Howie has no DM webhook by choice; he is omitted.

### Spreadsheet IDs

The 44-character string between `/d/` and `/edit` in a Google Sheets URL. For example:

```
https://docs.google.com/spreadsheets/d/1rcfHTtey_HXC291FAmjpquYkRjWNGbFtClz2szKXfkA/edit
                                       ^---------------- this part ----------------^
```

Store the ID without the URL prefix or `/edit` suffix.

### Drive Folder IDs

Open the folder in Drive, copy the ID from the URL after `/folders/`:

```
https://drive.google.com/drive/folders/1ABC123XYZ.../
                                       ^- ID -^
```

### Webhook URLs

Slack incoming webhooks have the form `https://hooks.slack.com/services/T.../B.../...`. Treat them as secrets; do not check them into git.

---

## 7. Things You Should Never Change

Some values are load-bearing for the entire system. Changing them breaks things downstream. Avoid unless you understand the full implication.

- **`VENUE_NAME`**: must be exactly `"WARATAH"`. The shared codebase branches on this value.
- **Sheet layout**: do not insert or delete rows or columns on day tabs (Wednesday through Sunday) or on the Read Me, Task Management, Analytics, or Executive Dashboard tabs of the shift report spreadsheet. The code refers to named ranges; insertions and deletions shift them or break them.
- **Formula cells**: cells starting with `=` are calculations. Editing them blanks out the formula and silently breaks downstream calculations. To restore, run the appropriate Reapply menu item.
- **Tab names**: the rollover script renames tabs each Monday. Do not rename tabs manually. Adding new tabs is fine; renaming the day tabs is not.
- **`STAFF_LIST` in code (`EnhancedTaskManagementWaratah.gs`)**: this is hard-coded, not stored in Script Properties. Changes require a clasp push. See [`02-staff-and-access-management.md`](02-staff-and-access-management.md) Section 4.

---

## 8. Properties That Exist in Both Projects

Six properties are written into both projects' Script Properties stores. Only two are functionally read by both projects at runtime; the other four are stored in the Shift Report project for symmetry only.

| Property | Read by SR runtime? | Read by TM runtime? | Notes |
|---|---|---|---|
| `MENU_PASSWORD` | Yes | Yes | Both projects gate admin menu items with this. If they diverge, the password works in one project's menu but not the other. Functionally dual-read. |
| `TASK_MANAGEMENT_SPREADSHEET_ID` | Yes | Yes | Both projects need to know where the task spreadsheet is. Functionally dual-read. |
| `SLACK_MANAGERS_CHANNEL_WEBHOOK` | No | Yes | Stored in SR setup for symmetry; only the Task Management project reads it at runtime. |
| `SLACK_DM_WEBHOOKS` | No | Yes | Stored in SR setup for symmetry; only the Task Management project reads it at runtime. The Shift Report nightly pipeline does not send personal DMs. |
| `ESCALATION_EMAIL` | No | Yes | Stored in SR setup for symmetry; only the Task Management project reads it at runtime. |
| `ESCALATION_SLACK_WEBHOOK` | No | Yes | Stored in SR setup for symmetry; only the Task Management project reads it at runtime. |

**Procedure when changing one:**

1. Open Shift Report spreadsheet, Extensions > Apps Script > Project Settings > Script Properties. Update the value.
2. Open Task Management spreadsheet, Extensions > Apps Script > Project Settings > Script Properties. Update the same value.
3. Save in both. Verify by running `verifyScriptProperties()` in each project.

For `MENU_PASSWORD` and `TASK_MANAGEMENT_SPREADSHEET_ID`, dual update is required for correct behaviour. For the other four, dual update is hygiene only; drift will not affect Shift Report behaviour, only Task Management.

---

## 9. Verifying Configuration Health

After any property change, run a verification sequence:

1. In the Shift Report project, run `verifyScriptProperties()`. Logger output lists all required and optional properties with their values (or `NOT SET`).
2. In the Task Management project, run the equivalent verify function (located in the TM project's setup file).
3. From the spreadsheet menu, **Waratah Tools > Daily Reports > Export & Email (TEST to me)**. A TEST report posts to the test Slack channel and emails the test recipient (Evan by default); it does not write to the warehouse or push tasks. If it succeeds end-to-end, the configuration is healthy.
4. If anything failed, see [`03-advanced-troubleshooting.md`](03-advanced-troubleshooting.md) for diagnosis.

---

## 10. Property Change Log

Whenever you change a Script Property in production, leave a one-line note in `docs/waratah/_archive/CONFIG_CHANGE_LOG.md` (create the file the first time):

```
2026-05-17: Updated WARATAH_EMAIL_RECIPIENTS to drop Dipti, add Joffy. Updated SLACK_DM_WEBHOOKS to match. Verified TEST report send.
```

This is not enforced by the system; it is a discipline. Future debugging of "the email went to the wrong people" depends on having this trail.
