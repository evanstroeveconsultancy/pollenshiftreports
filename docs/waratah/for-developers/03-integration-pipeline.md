# Integration Pipeline

**Audience:** Developers tracing or modifying the nightly send pipeline. This file walks the data from cell read to its destinations: data warehouse, Slack, email, Task Management spreadsheet.

There are two entry points to be aware of:

- `runIntegrations(sheetName)` in `IntegrationHubWaratah.js`: the warehouse-only integration entry. Performs extract, validate, warehouse.
- `continueExport(sheetName, isTest)` in `NightlyExportWaratah.js`: the full pipeline orchestrator. Called by `exportAndEmailPDF()` after the pre-export checklist dialog confirms. Internally invokes `runIntegrations(sheetName)` for the warehouse step, then handles AI insights, Slack, task push, PDF, email, and warning DM.

See [`01-architecture-and-data-flow.md`](01-architecture-and-data-flow.md) Section 6 for the high-level pipeline overview; this file goes code-deep.

---

## 1. Pipeline Overview

`continueExport` runs 8 sequential steps after the user confirms the checklist dialog:

```
Sheet (input)
     │
     ▼
1. runIntegrations(sheetName): extract, validate, warehouse:
   1a. extractShiftData_(sheet)      → shiftData object
   1b. validateShiftData_(shiftData) → { errors, warnings }
   1c. logToDataWarehouse_(shiftData) → 4 warehouse sheets
       (NIGHTLY_FINANCIAL, OPERATIONAL_EVENTS, WASTAGE_COMPS, QUALITATIVE_LOG)
2. AI Insights (M1 summary, M2 anomaly, M3 classification, M5 delivery)
3. buildTodoAggregationSheet_       → TO-DO aggregation tab
4. postToSlackFromSheet             → single webhook
5. pushTodosToMasterActionables     → Task Management spreadsheet
6. generatePdfForSheet_NoUI_        → PDF blob via UrlFetchApp (blocking)
7. GmailApp.sendEmail               → recipients from WARATAH_EMAIL_RECIPIENTS
8. _notifyExportWarnings_           → DMs Evan if warnings collected
```

Pre-export validation runs in `exportAndEmailPDF` before the dialog opens and blocks on validation errors. PDF generation in step 6 is the second blocking point: if the PDF blob is missing the pipeline aborts and returns `{ success: false, message }` to the dialog. All other steps collect warnings into the warnings array; one Slack failure does not stop the email step.

---

## 2. The Orchestration Entry

`runIntegrations` is warehouse-only. Pseudocode shape (see `IntegrationHubWaratah.js:73-151` for the real body):

```javascript
function runIntegrations(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);

  const shiftData = extractShiftData_(sheet);
  const validation = validateShiftData_(shiftData);

  if (validation.errors.length > 0) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
      integrations: { dataExtraction: 'ok', validation: 'failed', warehouse: 'skipped' }
    };
  }

  const warehouseResult = logToDataWarehouse_(shiftData);
  return {
    success: true,
    errors: [],
    warnings: validation.warnings,
    integrations: { dataExtraction: 'ok', validation: 'ok', warehouse: warehouseResult }
  };
}
```

Slack, AI insights, PDF, email, and task push are orchestrated by `continueExport` in `NightlyExportWaratah.js:172-351`, each wrapped in its own try/catch. A failure in one of those non-blocking steps appends to a warnings array and the pipeline continues. `runIntegrations` only owns the warehouse integration.

---

## 3. Data Extraction

`extractShiftData_(sheet)` (`IntegrationHubWaratah.js:228-389`) does not call `getFieldValue` per field. It performs a small number of direct batch reads and then uses inline accessor helpers (`fin`, `finNum`, `finC`, `finC_Num`, `narr`) to pull individual values from the cached arrays.

The batch reads are:

- `sheet.getRange("B3:F54").getValues()`: financial block
- `sheet.getRange("B3:B7").getDisplayValues()`: header display values
- `sheet.getRange("A59:A90").getValues()`: narrative and incident column A
- `sheet.getRange("A69:D84").getValues()`. TO-DO descriptions (col A) and assignees (col D)

The returned `shiftData` object includes (see code for the full list):

```
date, dayOfWeek (computed from date), weekEnding (computed),
mod, fohStaff, bohStaff, staff (concatenated "FOH: ... | BOH: ..."),
netRevenue, productionAmount, cashTake, cashCounted, cashReturns, cdDiscount,
totalCashRecorded, cashVariance, cashTips, cardTips, surchargeTips, totalTips,
tipsTotal (alias of totalTips), grossSales, totalAdjustmentsDiscounts,
discountsExcCashDiscount, grossSalesLessDiscounts, taxes,
refunds: null, cdRedeem: null, netSalesWTips: null,
todos: [...], generalShiftComments, guestsOfNote, theGood, theBad, kitchenNotes,
wastageComps, maintenanceIssues, rsaIncidents, sheetName
```

`dayOfWeek` and `weekEnding` are computed at runtime via `Utilities.formatDate` and a Sunday-of-week calculation; they are not read from the sheet.

### TO-DO extraction

TO-DO extraction is inlined inside `extractShiftData_` (around `IntegrationHubWaratah.js:304-319`): the `A69:D84` batch is iterated, rows where column A is non-empty are kept, and each kept row produces `{ description: row[0], assignee: row[3] || 'Unassigned' }`.

---

## 4. Validation

`validateShiftData_(shiftData)` at `IntegrationHubWaratah.js:671-720` enforces three rules:

| Rule | Type | Trigger |
|---|---|---|
| Date is a valid Date | Error | `parseCellDate_(shiftData.date)` returns Invalid Date |
| MOD non-empty | Error | `shiftData.mod` is empty or whitespace |
| `netRevenue <= 0` | Warning | Net revenue is $0 or negative (cell B54); MOD confirms before exporting |

Returns `{ errors, warnings }`. Errors halt the pipeline; warnings flow through to the dialog and the warning DM step. The cash-variance discrepancy rule that existed historically was disabled on 2026-02-15 (see the comment block at `IntegrationHubWaratah.js:691-712`).

---

## 5. Cash Reconciliation Storage

There is no separate cash reconciliation workbook. Cash reconciliation values are stored in the NIGHTLY_FINANCIAL warehouse sheet:

- Column V: CashCounted (sourced from sheet cell C18)
- Column W: ExpectedCash, written from `shiftData.totalCashRecorded` (cell C24)
- Column X: CashVariance (cell C26)

The mapping is performed inside `logToDataWarehouse_` at `IntegrationHubWaratah.js:500-526`. No standalone Drive file is created; the `WARATAH_CASH_RECON_FOLDER_ID` Script Property is not referenced by any code in the Shift Report project.

---

## 6. Slack Block Kit Construction

There is no standalone `buildSlackBlockKit_` function. The Block Kit blocks are built inline inside `postToSlackFromSheet` at `NightlyExportWaratah.js:888-982`, using the `bk_*` helpers exported from `SlackBlockKitWaratahSR.js`:

- `bk_header(title)`. Slack `header` block
- `bk_section(text)`: markdown section block
- `bk_fields([...])`: two-column key/value pairs
- `bk_divider()`: visual divider
- `bk_context([...])`: small grey context line
- `bk_buttons([...])`: action button row
- `bk_list([...])`: formatted bulleted list
- `bk_post(webhookUrl, blocks, fallbackText)`. `UrlFetchApp.fetch` POST

The constructed message starts with `bk_header("The Waratah - Nightly Shift Report")` (no themed emoji), followed by financial summary fields, the five narrative sections (each conditional on non-empty content), wastage / maintenance / RSA incident sections, the TO-DO list, the AI insights section if available, and action buttons. Test coverage is in `TEST_SlackBlockKitLibrary.js`.

---

## 7. Slack Delivery

`postToSlackFromSheet(spreadsheet, sheet, sheetName, webhookUrl)` posts to a single webhook URL passed by the caller. `continueExport` selects the webhook based on TEST vs LIVE mode:

| Mode | Webhook Script Property |
|---|---|
| LIVE | `SLACK_WEBHOOK_URL_LIVE` |
| TEST | `SLACK_WEBHOOK_URL_TEST` |

There is no fan-out to a managers channel and no per-staff DM loop from the nightly export. `SLACK_DM_WEBHOOKS` and `SLACK_MANAGERS_CHANNEL_WEBHOOK` (when present) are consumed by the Task Management project, not by `postToSlackFromSheet`. The only DM the nightly pipeline sends is to Evan via `_notifyExportWarnings_` when the warnings array is non-empty.

Delivery is via `bk_post` (`SlackBlockKitWaratahSR.js:188-214`):

```javascript
function bk_post(webhookUrl, blocks, fallbackText) {
  const payload = { blocks: blocks, text: fallbackText };
  const response = UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('Slack post failed: ' + response.getResponseCode() + ' ' + response.getContentText());
  }
}
```

The post is wrapped in `continueExport`'s try/catch so a Slack failure does not block the email step.

---

## 8. Email Distribution

Email is sent inline in `continueExport`, not through a wrapper. The sequence:

1. `generatePdfForSheet_NoUI_(spreadsheet, sheet, filename)` at `NightlyExportWaratah.js:1002-1030` generates the PDF blob. It uses `UrlFetchApp.fetch` against the spreadsheet's export URL (`https://docs.google.com/spreadsheets/d/{id}/export?format=pdf...&gid=...`), not `getAs(MimeType.PDF)`. The Apps Script `OAuth` token is attached for authentication.
2. The HTML body is composed inline as a template literal at `NightlyExportWaratah.js:321-331`. There is no `composeShiftReportEmail_` function.
3. Recipients are loaded from the `WARATAH_EMAIL_RECIPIENTS` JSON Script Property (currently 6 managers as of May 2026).
4. `GmailApp.sendEmail` is called inline at `NightlyExportWaratah.js:333` with the joined `to` addresses, subject, body, and the PDF attached via `attachments: [pdfBlob]`.

If PDF generation returns no blob the pipeline aborts at this step (the email cannot send without the attachment) and returns `{ success: false, message }` to the dialog.

---

## 9. Task Management Push

`pushTodosToMasterActionables(sheet, sheetName, preloadedConfig)` at `NightlyExportWaratah.js:448-529` writes each TO-DO row into the Task Management spreadsheet's MASTER ACTIONABLES SHEET tab. The function reads TO-DOs directly from the sheet (via `TODO_TASK_RANGE` / `TODO_ASSIGNEE_RANGE`), so it does not need a pre-extracted `shiftData.todos` array passed in.

Duplicate detection uses an `openDescriptions` Set built from the master sheet that excludes rows with status DONE or CANCELLED; an incoming TO-DO whose description matches an open one is skipped.

The fallback path `pushTodosDirectToMasterActionables_` at `NightlyExportWaratah.js:538-594` batches writes via `setValues` (not `appendRow` per row) and writes 14 columns matching the `TASK_COLS` constant in `TaskIntegrationWaratah.js:24-39`:

- A=Priority, B=Status, C=Staff, D=Area, E=Description,
- F=Due Date, G=Date Created, H=Date Completed, I=Days Open,
- J=Blocker Notes, K=Source, L=Recurrence, M=Last Updated, N=Updated By

Real defaults at write time:

| Col | Default |
|---|---|
| A Priority | `MEDIUM` |
| B Status | `NEW` |
| C Staff | `todo.assignee` (or empty) |
| D Area | `General` |
| E Description | `todo.description` |
| F Due Date | empty |
| G Date Created | `new Date()` (today, not the shift date) |
| H Date Completed | empty |
| I Days Open | empty (formula sheet computes) |
| J Blocker Notes | empty |
| K Source | `Shift Report` |
| L Recurrence | `None` |
| M Last Updated | `new Date()` |
| N Updated By | `Session.getActiveUser().getEmail() || 'System'` |

For the receiving system internals, see [`06-task-management-internals.md`](06-task-management-internals.md).

---

## 10. Error Handling

The pipeline's error handling philosophy:

- **Each non-blocking step is independent.** A Slack failure does not block email; an email failure does not undo the warehouse write.
- **Two blocking points exist.** Pre-export validation (errors from `validateShiftData_`) blocks the dialog from opening. PDF generation failure blocks the email step and returns `{ success: false, message }` to the dialog.
- **Per-step results are logged to `Logger.log()`** for Apps Script Executions panel inspection.
- **Warnings accumulate and are DM'd to Evan** at step 8 via `_notifyExportWarnings_` when the warnings array is non-empty. Optional alert email to `INTEGRATION_ALERT_EMAIL_PRIMARY` can be configured for additional channels.

Sample failure pattern from `continueExport`:

```javascript
try {
  postToSlackFromSheet(spreadsheet, sheet, sheetName, webhookUrl);
} catch (e) {
  Logger.log('Slack post failed: ' + e.message);
  warnings.push('Slack post failed: ' + e.message);
}
```

Warnings are aggregated into a single message and DM'd to Evan after the email step.

---

## 11. Testing

The integration pipeline has two test harnesses:

- `TEST_DataExtractionVerification.js` exercises `extractShiftData_` and `validateShiftData_` against a fixture sheet and verifies field-by-field correctness.
- `TEST_SlackBlockKitLibrary.js` exercises the `bk_*` Block Kit helpers and inline-construction patterns used by `postToSlackFromSheet` against representative shiftData objects, verifying Block Kit JSON validity.

Both are runnable from the Apps Script editor's Run menu. They use only test sheets and test webhooks; no production data is touched.

To test the full pipeline end-to-end without sending to LIVE channels, use the menu item **Shift Report > Export & Email (TEST to me)** (`exportAndEmailPDF_TestToSelf` in `MenuWaratah.js:115-117`). This routes Slack to `SLACK_WEBHOOK_URL_TEST` and emails only the active user.

---

## 12. Adding a New Integration

To add a new destination (for example, a Discord webhook or a third-party analytics service), follow this pattern:

1. Add the Script Property (webhook URL, API key, recipient list). Document in [`for-admins/01-configuration-reference.md`](../for-admins/01-configuration-reference.md).
2. Add a new function `sendToNewDestination_(shiftData)` in `IntegrationHubWaratah.js`.
3. Add the call to `runIntegrations` wrapped in try/catch.
4. Add an entry to the results object.
5. Add a test in a new `TEST_NewDestination.js` if non-trivial.
6. Update [`01-architecture-and-data-flow.md`](01-architecture-and-data-flow.md) Section 6 (nightly export pipeline) to reflect the new step.
7. Update this file's Section 1 (pipeline overview).

Do not couple the new integration to existing ones. Each integration must succeed or fail independently of the others.
