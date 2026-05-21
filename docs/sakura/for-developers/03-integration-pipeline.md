# Integration Pipeline

**Audience:** Developers tracing or modifying the Sakura nightly send pipeline. This file walks the data from menu click through pre-send checklist, warehouse writes, AI insights, Slack, email, and task push.

There are two entry points to be aware of:

- `runIntegrations(sheetName)` in `IntegrationHubSakura.gs`: the warehouse-only integration entry. Performs extract, validate, warehouse writes, and AI insights delivery.
- `continueExport(sheetName, isTest)` in `NightlyExportSakura.gs:119`: the full pipeline orchestrator. Called by the pre-export checklist HTML dialog after the manager confirms. Internally invokes `runIntegrations(sheetName)`, then runs TO-DO aggregation, Slack post, task push, PDF generation, and email.

See [`01-architecture-and-data-flow.md`](01-architecture-and-data-flow.md) for the high-level overview; this file goes code-deep with `file:line` citations.

---

## 1. Pipeline Overview

The nightly send begins when a manager clicks **Shift Report > Send Nightly Report**, which is wired to `exportAndEmailPDF()` at `NightlyExportSakura.gs:278`. The full LIVE sequence is:

```
Menu click "Send Nightly Report"
     │
     ▼
exportAndEmailPDF()                                   (NightlyExportSakura.gs:278)
     │
     ▼
ui.alert YES/NO confirmation                          (NightlyExportSakura.gs:291)
     │
     ▼
showPreExportChecklist_(sheetName, false)             (NightlyExportSakura.gs:96 template, :103 modal show)
     │  Opens checklist-dialog.html.
     │  User ticks "Deputy Timesheets Approved" + "Fruit Order Done".
     │  "Confirm & Send" button enables once both are ticked.
     │
     ▼
google.script.run.continueExport(sheetName, isTest)   (HTML dialog line 155)
     │
     ▼
continueExport(sheetName, isTest=false)               (NightlyExportSakura.gs:119)
     │
     ├─ 1. runIntegrations(sheetName)                 (NightlyExportSakura.gs:159)
     │      ├─ extractShiftData_(sheet)
     │      ├─ validateShiftData_(shiftData)
     │      └─ logToDataWarehouse_(shiftData) → 4 sheets
     │
     ├─ 2. AI Shift Insights for email                (NightlyExportSakura.gs:168 onwards)
     │      generateShiftSummary_Sakura(shiftData)
     │      deliverAIInsights_Sakura(insight)
     │
     ├─ 3. PDF generation
     │      generatePdfForSheet_NoUI_(spreadsheet, sheet, filename)
     │
     ├─ 4. buildTodoAggregationSheet_(spreadsheet)    (NightlyExportSakura.gs:214)
     │
     ├─ 5. postToSlackFromSheet_(...)                 (NightlyExportSakura.gs:220)
     │
     ├─ 6. pushTodosToActionables(sheet, sheetName)   (NightlyExportSakura.gs:229)
     │
     └─ 7. GmailApp.sendEmail(...) to SAKURA_EMAIL_RECIPIENTS
```

`continueExport` returns `{ success, message }` to the HTML dialog. The dialog shows a tick and closes after a `setTimeout` of 2000ms.

TEST path: skips warehouse writes, posts to the TEST Slack webhook, emails to `Session.getActiveUser().getEmail()`, and does not push TO-DOs to the Actionables sheet (`NightlyExportSakura.gs:124-153`).

---

## 2. Pre-Send Checklist Dialog

The checklist is a blocking HTML modal that prevents the export from running until the MOD confirms two operational items:

- `showPreExportChecklist_(sheetName, isTest)` builds the modal from the `checklist-dialog.html` template (`NightlyExportSakura.gs:96`) and shows it via `SpreadsheetApp.getUi().showModalDialog(...)` (`NightlyExportSakura.gs:103`).
- The dialog has two checkboxes: **Deputy Timesheets Approved** and **Fruit Order Done**. The `Confirm & Send` button is disabled until both are ticked.
- On confirm, the dialog invokes `google.script.run.continueExport(sheetName, isTest)` (HTML line 155), which routes to `continueExport` at `NightlyExportSakura.gs:119`.

**Design constraint:** `continueExport` is called via `google.script.run`. It must return `{ success, message }` and must not call `SpreadsheetApp.getUi()`, which throws inside the `google.script.run` execution context.

---

## 3. LIVE Path Inside `continueExport`

The LIVE branch runs the seven steps below in order. Each step (except validation) is wrapped in its own try/catch; failures are logged via `Logger.log()` and accumulated as warnings rather than aborting the export.

### Step 1: `runIntegrations(sheetName)` at line 159

Orchestrates extraction, validation, and the four warehouse writes. See Section 4 for the warehouse schemas and Section 5 for duplicate detection.

If `validateShiftData_` returns errors (invalid date or missing MOD), the warehouse writes are skipped and the pipeline continues with the remaining steps (Slack, email, task push). Non-blocking philosophy: a warehouse failure does not stop the email going out.

### Step 2: AI Shift Insights at line 168 onwards

Generates the AI summary for inclusion in the email body and Slack message. See Section 6 for the full AI flow.

### Step 3: PDF Generation

`generatePdfForSheet_NoUI_(spreadsheet, sheet, filename)` produces the PDF blob used by the email attachment. PDF generation uses `UrlFetchApp.fetch` against the spreadsheet's export URL with the active OAuth token, not `getAs(MimeType.PDF)`.

### Step 4: TO-DO Aggregation at line 214

`buildTodoAggregationSheet_(spreadsheet)` collects TO-DOs from all six day sheets into a single `TO-DOs` tab. Rows are built in memory and written in a single `setValues()` call.

### Step 5: Slack Post at line 220

`postToSlackFromSheet_(spreadsheet, sheet, sheetName, webhookUrl)` builds the Block Kit message and posts to Slack. See Section 7.

### Step 6: TO-DO Push to Actionables at line 229

`pushTodosToActionables(sheet, sheetName)` writes the night's TO-DOs into the Sakura Actionables spreadsheet. See Section 8.

### Step 7: Email Distribution

`GmailApp.sendEmail` is called with the recipient list joined from the `SAKURA_EMAIL_RECIPIENTS` Script Property (`NightlyExportSakura.gs:42`), the subject, an HTML body, and the PDF blob as an attachment.

---

## 4. Warehouse Writes

Inside `logToDataWarehouse_(shiftData)`, the system writes to four sheets in the warehouse spreadsheet (`SAKURA_DATA_WAREHOUSE_ID`, `IntegrationHubSakura.gs:25`). Each sheet has independent duplicate detection. All dates are wrapped with `toDateOnly_()` (added April 2, 2026) to strip time components.

### NIGHTLY_FINANCIAL: 16 columns A-P

`IntegrationHubSakura.gs:412-429`. One row per shift.

| Col | Field | Source |
|-----|-------|--------|
| A | Date | `toDateOnly_(shiftData.date)` |
| B | Day | `shiftData.dayOfWeek` |
| C | Week Ending | `toDateOnly_(shiftData.weekEnding)` |
| D | MOD | `shiftData.mod` |
| E | Net Revenue | `shiftData.netRevenue` |
| F | Cash Total | C19 (formula) |
| G | Cash Tips | C29 |
| H | Tips Total | C32 (formula) |
| I | Logged At | `new Date()` |
| J | Production Amount | B37 |
| K | Discounts | B50 |
| L | Deposit | B38 |
| M | FOH Staff | B6 |
| N | BOH Staff | B7 |
| O | Card Tips | C30 |
| P | Surcharge Tips | C31 |

**Duplicate key:** Date (col 0) + MOD (col 3).

### OPERATIONAL_EVENTS: 9 columns A-I

`IntegrationHubSakura.gs:448-458`. One row per TO-DO task created on the shift.

A=Date, B=Type, C=Item, D=Quantity, E=Value, F=Staff, G=Reason, H=Category, I=Source.

### WASTAGE_COMPS: 5 columns A-E

`IntegrationHubSakura.gs:473-479`. One row per shift, written only if the wastage/comps field is non-empty.

A=Date, B=Day, C=Week Ending, D=MOD, E=COMMENTS.

### QUALITATIVE_LOG: 11 columns A-K

`IntegrationHubSakura.gs:492-504`. One row per shift, capturing all narrative content.

A=Date, B=Day, C=MOD, D=Shift Summary, E=Guests of Note, F=The Good, G=The Bad / Issues, H=Kitchen Notes, I=Maintenance, J=RSA/Incidents, K=Logged At.

Some older docs refer to this sheet as `QUALITATIVE_NOTES`. The current code name is `QUALITATIVE_LOG`.

---

## 5. Duplicate Detection

Each warehouse write calls `isDuplicateInSheet_(...)` at `IntegrationHubSakura.gs:406` before appending. The check reads existing rows, builds a key from col 0 (Date) plus col 3 (MOD), and skips the append if a match is found.

Date keys are normalised via `normaliseDateKey_()`, which uses `parseCellDate_()` and falls back to `Invalid Date` (`new Date('')`) rather than `new Date(str)`. This avoids US-format misparse of Australian dd/mm/yyyy strings.

`toDateOnly_(d)` strips the time component from dates before they are written, guarding against the kind of off-by-one introduced when a date is stored as a mid-day timestamp and then compared against a midnight key.

---

## 6. AI Insights

The AI insights step runs inside `continueExport` after the warehouse writes. The generator and delivery code lives in `AIInsightsSakura.gs`.

**Generator:** `generateShiftSummary_Sakura(shiftData)` at `AIInsightsSakura.gs:151`.

**API call:**

- Endpoint: `https://api.anthropic.com/v1/messages` (`AIInsightsSakura.gs:94`)
- Model: `claude-haiku-4-5-20251001` (`AIInsightsSakura.gs:70`)
- Header: `anthropic-version: 2023-06-01` (`AIInsightsSakura.gs:87`)
- API key from Script Property `ANTHROPIC_API_KEY`

**Delivery routing:** `deliverAIInsights_Sakura()` checks the Script Property `AI_INSIGHTS_MODE` (`AIInsightsSakura.gs:969`). Values:

| Mode | Behaviour |
|------|-----------|
| `live` | Insights delivered with the LIVE shift report (email + Slack) |
| `evan_only` | Email to `AI_INSIGHTS_EVAN_EMAIL` (`AIInsightsSakura.gs:979`) or Slack to `SAKURA_SLACK_WEBHOOK_TEST` (`AIInsightsSakura.gs:997`); default mode |

**Logging:** Every generated insight is appended to the `AI_INSIGHTS_LOG` sheet in the warehouse spreadsheet (`AIInsightsSakura.gs:1037`). The sheet is auto-created on first write.

The feature is fully shipped. `AI_INSIGHTS_MODE` controls delivery routing, not enable/disable.

---

## 7. Slack Block Kit Construction and Delivery

The Block Kit message is built in `SlackBlockKitSakuraSR.gs` (216 lines) and posted from `postToSlackFromSheet_` inside `NightlyExportSakura.gs:220`.

**Webhook selection (LIVE vs TEST):**

| Mode | Resolver | Script Property |
|------|----------|-----------------|
| LIVE | `getSakuraSlackWebhookLive_()` | `SAKURA_SLACK_WEBHOOK_LIVE` |
| TEST | `getSakuraSlackWebhookTest_()` | `SAKURA_SLACK_WEBHOOK_TEST` |

The message structure (Block Kit blocks, in order):

```
bk_header   : "Sakura House - Nightly Shift Report"
bk_context  : day + date + MOD + FOH/BOH staff
bk_fields   : Net Revenue, Production, Tips (card/cash)
bk_section  : Shift Summary (always)
bk_section  : Guests of Note, The Good, Issues, Kitchen Notes (each conditional on non-empty)
bk_section  : To-Do list with assignee
bk_section  : Wastage/Comps, Maintenance, RSA/Incidents (each conditional)
bk_buttons  : View PDF, Email Staff
```

Currency formatting uses `fmtAUD()`, which strips currency symbols before `parseFloat` and re-formats with thousands separators. This prevents `parseFloat("$1,234.50")` returning NaN.

Delivery is via `bk_post(webhookUrl, blocks, fallbackText)` using `UrlFetchApp.fetch`. The post is wrapped in `continueExport`'s try/catch so a Slack failure does not block the email step.

---

## 8. TO-DO Push to Actionables

`pushTodosToActionables(sheet, sheetName)` at `TaskIntegrationSakura.gs:60` writes each TO-DO row into the Sakura Actionables spreadsheet identified by the `TASK_MANAGEMENT_SPREADSHEET_ID` Script Property (`TaskIntegrationSakura.gs:21`).

**Source data:** Reads from the named ranges `todoTasks` (A69:A84) and `todoAssignees` (D69:D84) at `TaskIntegrationSakura.gs:63-64`. The two arrays are zipped and empty rows are filtered out.

**Defaults written to each new task row:**

| Field | Default |
|-------|---------|
| Priority | `MEDIUM` |
| Status | `NEW` |
| Staff Allocated | `todo.assignee` (or empty) |
| Area | `General` |
| Description | `todo.description` |
| Source | `Shift Report` |
| Recurrence | `None` |
| Date Created | `new Date()` (today, not the shift date) |

**Duplicate prevention:** Before writing, the function checks whether a task with the same description was already created today. This prevents double-push if the MOD re-exports the shift after a typo fix.

**Batch write:** All rows are written in a single `setValues()` call. The `Days Open` formula is set in a second pass because GAS cannot mix formulas with literal values in one `setValues()`.

For the receiving side of this flow, see [`06-task-management-internals.md`](06-task-management-internals.md).

---

## 9. Email Distribution

Email is sent inline in `continueExport`, not through a wrapper function. The sequence:

1. PDF blob produced by `generatePdfForSheet_NoUI_(spreadsheet, sheet, filename)` (Step 3 of the LIVE path).
2. Recipients loaded from the `SAKURA_EMAIL_RECIPIENTS` JSON Script Property (`NightlyExportSakura.gs:42`). Format is `{ "email@domain": "Display Name", ... }`.
3. HTML body composed inline (including the AI insight from Step 2 when available).
4. `GmailApp.sendEmail(emailAddresses.join(','), subject, '', { htmlBody, attachments: [pdfBlob] })`.

The sender's display name is resolved from the recipients map; if the active user is in the map, their display name is used. Otherwise it falls back to the MOD name.

If PDF generation returns no blob, the email step is skipped and the pipeline returns `{ success: false, message }` to the HTML dialog (the email cannot send without the attachment).

---

## 10. Error Handling

The Sakura pipeline's error-handling philosophy:

- **Each integration step is independent and wrapped in its own try/catch.** A warehouse failure does not stop Slack; a Slack failure does not stop email.
- **Validation errors block warehouse writes only.** An invalid date or missing MOD skips `logToDataWarehouse_` but the rest of the pipeline runs.
- **PDF generation failure is the one place that aborts the email step.** No PDF means no attachment, so the email is skipped and `{ success: false }` is returned to the dialog.
- **All step failures are logged via `Logger.log()`** for inspection in the Apps Script Executions panel.

Sample pattern from `continueExport`:

```javascript
try {
  postToSlackFromSheet_(spreadsheet, sheet, sheetName, webhookUrl);
} catch (e) {
  Logger.log('Slack post failed: ' + e.message);
  warnings.push('Slack post failed: ' + e.message);
}
```

The integration log sheet (`INTEGRATION_LOG`, auto-created in the warehouse) captures one row per run with timestamp, sheet name, success flag, duration, error and warning counts, and per-sheet write counts. Inspect via **Admin Tools > Data Warehouse > Show Integration Log (Last 30 Days)**.

---

## 11. TEST Path

The TEST path (`NightlyExportSakura.gs:124-153`) is reachable via the menu item **Shift Report > Send Test Report**, which calls `exportAndEmailPDF_TestToSelf()` at `NightlyExportSakura.gs:333`. It differs from LIVE as follows:

| Step | LIVE | TEST |
|------|------|------|
| Warehouse writes | Yes | Skipped |
| Slack webhook | `SAKURA_SLACK_WEBHOOK_LIVE` | `SAKURA_SLACK_WEBHOOK_TEST` |
| Email recipients | `SAKURA_EMAIL_RECIPIENTS` map | `Session.getActiveUser().getEmail()` only |
| TO-DO push to Actionables | Yes | Skipped |
| AI insights delivery | Per `AI_INSIGHTS_MODE` | Per `AI_INSIGHTS_MODE` (typically `evan_only`) |

Use the TEST path to exercise PDF rendering, Slack Block Kit layout, and email formatting without touching production destinations.

---

## 12. Adding a New Integration

To add a new destination (for example a Discord webhook or a third-party analytics service):

1. Add the Script Property (webhook URL, API key, recipient list). Document it in [`for-admins/01-configuration-reference.md`](../for-admins/01-configuration-reference.md).
2. Add a new function `sendToNewDestination_(shiftData)` in `IntegrationHubSakura.gs` or a new sibling file.
3. Add the call into `continueExport` wrapped in its own try/catch, after the existing integration steps and before the email step.
4. Append result and warning information into the warnings array using the existing pattern.
5. Update Section 1 (pipeline overview) and the architecture doc to reflect the new step.

Each integration must succeed or fail independently of the others. Do not couple a new destination to the success of an existing one.
