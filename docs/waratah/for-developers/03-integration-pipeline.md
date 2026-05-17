# Integration Pipeline

**Audience:** Developers tracing or modifying the nightly send pipeline. This file walks the data from cell read to its five destinations: data warehouse, cash reconciliation file, Slack, email, Task Management spreadsheet.

The entry point is `runIntegrations(sheetName)` in `IntegrationHubWaratah.js`. The wrapper that calls it on user-initiated send is `sendShiftReport()` in `NightlyExportWaratah.js`. See [`01-architecture-and-data-flow.md`](01-architecture-and-data-flow.md) Section 6 for the high-level pipeline overview; this file goes code-deep.

---

## 1. Pipeline Overview

Five destinations, run in this order:

```
Sheet (input)
     │
     ▼
1. extractShiftData_()        →   shiftData object
2. validateShiftData_()       →   {blocking, warnings}
3. logToDataWarehouse_()      →   4 warehouse sheets (NIGHTLY_FINANCIAL, OPERATIONAL_EVENTS, WASTAGE_COMPS, QUALITATIVE_LOG)
4. syncToCashReconciliation_()→   weekly cash recon file (Drive)
5. buildSlackBlockKit_()      →   Block Kit message
6. postToSlackChannels_()     →   3 webhooks (managers, secondary, tasks)
7. postToSlackDMs_()          →   6 staff DM webhooks
8. generatePdfAndEmail_()     →   6 email recipients
9. pushTodosToMaster_()       →   Task Management spreadsheet
```

Steps 3-9 are wrapped in try/catch. Step 3 (warehouse) is the one blocking integration. Steps 4-9 are non-blocking; if Slack is down the email still sends.

---

## 2. The Orchestration Entry

```javascript
function runIntegrations(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);

  const shiftData = extractShiftData_(sheet);
  const validation = validateShiftData_(shiftData);

  if (validation.blocking.length > 0) {
    return { success: false, blocking: validation.blocking };
  }

  // Non-blocking integrations
  const results = {
    warehouse: null,
    cashRecon: null,
    slack: null,
    email: null,
    tasks: null
  };

  try { results.warehouse = logToDataWarehouse_(shiftData); }
    catch (e) { results.warehouse = { error: e.message }; }

  try { results.cashRecon = syncToCashReconciliation_(shiftData); }
    catch (e) { results.cashRecon = { error: e.message }; }

  try { results.slack = sendSlackMessages_(shiftData); }
    catch (e) { results.slack = { error: e.message }; }

  try { results.email = sendEmailReport_(shiftData); }
    catch (e) { results.email = { error: e.message }; }

  try { results.tasks = pushTodosToMaster_(shiftData); }
    catch (e) { results.tasks = { error: e.message }; }

  return { success: true, results, warnings: validation.warnings };
}
```

Note the try/catch isolation: each integration can fail without preventing the others.

---

## 3. Data Extraction

`extractShiftData_(sheet)` builds a structured `shiftData` object by calling `getFieldValue` for each FIELD_CONFIG entry. Roughly:

```javascript
function extractShiftData_(sheet) {
  const name = sheet.getName(); // 'Wednesday' etc.

  return {
    // Header
    date: getFieldValue('date', name),
    dayOfWeek: getFieldValue('dayOfWeek', name),
    MOD: getFieldValue('MOD', name),
    staff: getFieldValue('staff', name),

    // Cash
    publicTillCounts: getFieldValues('publicTillCounts', name),
    terraceTillCounts: getFieldValues('terraceTillCounts', name),
    publicRefloat: getFieldValue('publicRefloat', name),
    terraceRefloat: getFieldValue('terraceRefloat', name),
    cashCounted: getFieldValue('cashCounted', name),
    cashTakings: getFieldValue('cashTakings', name),
    cashVariance: getFieldValue('cashVariance', name),

    // Financial
    production: getFieldValue('production', name),
    functionDeposit: getFieldValue('functionDeposit', name),
    cardExpenses: getFieldValues('cardExpenses', name),
    cardTips: getFieldValue('cardTips', name),
    cashTips: getFieldValue('cashTips', name),
    totalTips: getFieldValue('totalTips', name),
    netRevenue: getFieldValue('netRevenue', name),
    grossSales: getFieldValue('grossSales', name),
    taxes: getFieldValue('taxes', name),
    cashReturns: getFieldValue('cashReturns', name),
    cdDiscount: getFieldValue('cdDiscount', name),

    // Narratives
    generalShiftComments: getFieldValue('generalShiftComments', name),
    vipsNotes: getFieldValue('vipsNotes', name),
    goodHighlights: getFieldValue('goodHighlights', name),
    badHighlights: getFieldValue('badHighlights', name),
    kitchenNotes: getFieldValue('kitchenNotes', name),

    // Tasks
    todos: extractTodos_(name),

    // Incidents
    wastage: getFieldValue('wastageNotes', name),
    maintenance: getFieldValue('maintenanceNotes', name),
    rsaIncidents: getFieldValue('rsaIncidents', name)
  };
}
```

Each `getFieldValue` call may throw (named range missing). Higher-level code wraps the whole extraction in a try and surfaces missing-range errors clearly.

### `extractTodos_(sheetName)`

The TO-DO section has 16 rows of description + assignee. `extractTodos_` reads both multi-row ranges and returns a structured array, filtering out empty rows:

```javascript
function extractTodos_(sheetName) {
  const descriptions = getFieldValues('todoDescriptions', sheetName); // [[desc], [desc], ...]
  const assignees = getFieldValues('todoAssignees', sheetName);

  const todos = [];
  for (let i = 0; i < descriptions.length; i++) {
    const desc = (descriptions[i][0] || '').toString().trim();
    if (desc.length === 0) continue;
    todos.push({
      description: desc,
      assignee: (assignees[i][0] || '').toString().trim() || 'Unassigned'
    });
  }
  return todos;
}
```

---

## 4. Validation

`validateShiftData_(shiftData)` runs rules and returns `{blocking, warnings}`. Blocking errors halt the pipeline; warnings flow through to the report.

### Rules currently enforced

| Rule | Type | Trigger |
|---|---|---|
| MOD field non-empty | Blocking | `shiftData.MOD` is empty or whitespace |
| Date is a valid Date | Blocking | `parseCellDate_(shiftData.date)` fails |
| Net revenue parseable | Blocking | `Number.isNaN(parseFloat(shiftData.netRevenue))` |
| Cash variance over ±$50 | Warning | `Math.abs(shiftData.cashVariance) > 50` |
| At least one narrative field has content | Warning | All five narrative fields are empty or "None" |
| No tasks added | Warning | `shiftData.todos.length === 0` |
| Card tips and cash tips both zero | Warning | Suspicious for a service night |

Validation is conservative. Even with warnings, the report sends. The MOD sees warnings in the success dialog.

---

## 5. Cash Reconciliation Sync

`syncToCashReconciliation_(shiftData)` writes a copy of cash data to a separate Drive-based reconciliation workbook. The workbook is keyed by week and has one tab per service day.

```javascript
function syncToCashReconciliation_(shiftData) {
  const folderId = PropertiesService.getScriptProperties().getProperty('WARATAH_CASH_RECON_FOLDER_ID');
  const weekEnding = computeWeekEnding_(shiftData.date);
  const fileName = `Waratah_Cash_Recon_${formatWeek(weekEnding)}.gsheet`;

  const folder = DriveApp.getFolderById(folderId);
  let file = findFileInFolder_(folder, fileName);
  if (!file) file = createCashReconFile_(folder, fileName, weekEnding);

  const workbook = SpreadsheetApp.open(file);
  const dayTab = workbook.getSheetByName(shiftData.dayOfWeek);
  if (!dayTab) throw new Error(`Cash recon tab not found for ${shiftData.dayOfWeek}`);

  // Write till counts, refloats, variance to specific cells in the recon tab
  dayTab.getRange('B2').setValue(shiftData.date);
  dayTab.getRange('B4:F8').setValues(shiftData.publicTillCounts);
  dayTab.getRange('B10:F14').setValues(shiftData.terraceTillCounts);
  dayTab.getRange('B16').setValue(shiftData.publicRefloat);
  dayTab.getRange('B17').setValue(shiftData.terraceRefloat);
  dayTab.getRange('B18').setValue(shiftData.cashCounted);
  dayTab.getRange('B19').setValue(shiftData.cashVariance);

  return { fileName, written: true };
}
```

The recon workbook is a separate file from the main shift report and warehouse. It exists for cash audit purposes.

---

## 6. Slack Block Kit Construction

`buildSlackBlockKit_(shiftData, insights)` constructs the Block Kit JSON. The structure:

```javascript
{
  blocks: [
    // 1. Header: emoji + date + MOD
    { type: 'header', text: { type: 'plain_text', text: `🌸 Waratah Shift Report: ${formatDate(date)}` } },

    // 2. Always-shown context: net revenue, production, cash, tips, variance
    { type: 'section', fields: [
      { type: 'mrkdwn', text: `*Net Revenue*\n$${shiftData.netRevenue}` },
      { type: 'mrkdwn', text: `*Production*\n$${shiftData.production}` },
      { type: 'mrkdwn', text: `*Cash Take*\n$${shiftData.cashTakings}` },
      { type: 'mrkdwn', text: `*Variance*\n${formatVariance(shiftData.cashVariance)}` },
      { type: 'mrkdwn', text: `*Card Tips*\n$${shiftData.cardTips}` },
      { type: 'mrkdwn', text: `*Cash Tips*\n$${shiftData.cashTips}` }
    ]},

    { type: 'divider' },

    // 3. Narrative: shift report
    { type: 'section', text: { type: 'mrkdwn', text: `*Shift Report*\n${shiftData.generalShiftComments}` } },

    // 4. Conditional: VIPs (only if present)
    ...(shiftData.vipsNotes && shiftData.vipsNotes !== 'None' ? [
      { type: 'section', text: { type: 'mrkdwn', text: `*VIPs*\n${shiftData.vipsNotes}` } }
    ] : []),

    // 5-7. Good / Bad / Kitchen narratives (conditional)
    // 8. Wastage / Maintenance / RSA (conditional)
    // 9. Tasks summary (if any)
    // 10. AI Insights section (always shown; falls back to generic if AI unavailable)

    { type: 'divider' },

    // 11. Action buttons: view PDF, email team
    { type: 'actions', elements: [
      { type: 'button', text: { type: 'plain_text', text: 'View PDF' }, url: pdfUrl },
      { type: 'button', text: { type: 'plain_text', text: 'Email Team' }, url: emailLink }
    ]}
  ]
}
```

Constructed in `SlackBlockKitWaratahSR.js`. The truncation guard at the end (2900-char cap) prevents Slack's HTTP 400 silent failure on long narratives. Test coverage in `TEST_SlackBlockKitLibrary.js`.

---

## 7. Slack Delivery

Three webhook destinations plus per-staff DMs:

| Destination | Webhook source |
|---|---|
| `#waratah-shift-reports` | `WARATAH_SLACK_WEBHOOK_LIVE` Script Property |
| Test channel | `WARATAH_SLACK_WEBHOOK_TEST` Script Property (TEST mode only) |
| Managers channel (rollover, escalations) | `SLACK_MANAGERS_CHANNEL_WEBHOOK` (shared with Task Management project) |
| Per-staff DMs | `SLACK_DM_WEBHOOKS` Script Property (JSON object, name → webhook) |

The delivery code:

```javascript
function sendSlackMessages_(shiftData) {
  const blockKit = buildSlackBlockKit_(shiftData, insights);
  const liveWebhook = getProp_('WARATAH_SLACK_WEBHOOK_LIVE');
  const dmWebhooks = JSON.parse(getProp_('SLACK_DM_WEBHOOKS') || '{}');

  // Live channel (or test channel in TEST mode)
  postToSlack_(liveWebhook, blockKit);

  // Each DM
  for (const [name, webhook] of Object.entries(dmWebhooks)) {
    if (!webhook) continue;
    try { postToSlack_(webhook, blockKit); }
    catch (e) { Logger.log(`Slack DM to ${name} failed: ${e.message}`); }
  }
}

function postToSlack_(webhook, blockKit) {
  const response = UrlFetchApp.fetch(webhook, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(blockKit),
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) {
    throw new Error(`Slack post failed: ${response.getResponseCode()} ${response.getContentText()}`);
  }
}
```

Each DM is wrapped in try/catch independently so a single bad webhook does not break the others.

---

## 8. Email Distribution

`generatePdfAndEmail_(shiftData)` does three things:

1. Generates a PDF of the shift report tab (using the spreadsheet's built-in export).
2. Composes an HTML email summary.
3. Sends to all addresses in `WARATAH_EMAIL_RECIPIENTS` (parsed as a JSON object: email → name).

```javascript
function generatePdfAndEmail_(shiftData) {
  const sheetName = shiftData.dayOfWeek;
  const pdfBlob = exportTabAsPdf_(sheetName);
  const htmlBody = composeShiftReportEmail_(shiftData);

  const recipients = JSON.parse(getProp_('WARATAH_EMAIL_RECIPIENTS') || '{}');
  const toAddresses = Object.keys(recipients);

  if (toAddresses.length === 0) {
    Logger.log('No email recipients configured');
    return { sent: 0 };
  }

  MailApp.sendEmail({
    to: toAddresses.join(','),
    subject: `Waratah Shift Report: ${formatDate(shiftData.date)} (${sheetName})`,
    htmlBody: htmlBody,
    attachments: [pdfBlob]
  });

  return { sent: toAddresses.length };
}
```

The PDF is generated via the spreadsheet's built-in `getAs(MimeType.PDF)` exporter. It captures only the active day's tab.

`composeShiftReportEmail_` builds the HTML body with the same data sections as the Slack message but formatted for email (tables, no Block Kit syntax).

---

## 9. Task Management Push

`pushTodosToMaster_(shiftData)` writes each TO-DO row into the Task Management spreadsheet as a new row in the MASTER ACTIONABLES SHEET tab.

```javascript
function pushTodosToMaster_(shiftData) {
  if (shiftData.todos.length === 0) return { pushed: 0 };

  const taskMgmtId = getProp_('WARATAH_TASK_MANAGEMENT_ID') || getProp_('TASK_MANAGEMENT_SPREADSHEET_ID');
  if (!taskMgmtId) throw new Error('Task management spreadsheet ID not configured');

  const tmBook = SpreadsheetApp.openById(taskMgmtId);
  const master = tmBook.getSheetByName('MASTER ACTIONABLES SHEET');

  let pushed = 0;
  for (const todo of shiftData.todos) {
    // Duplicate check: same description + same Date Created (today)
    if (isDuplicateTask_(master, todo.description, shiftData.date)) continue;

    // Column order (matches COLS in EnhancedTaskManagementWaratah.gs):
    // A=Priority, B=Status, C=Staff, D=Area, E=Description,
    // F=Due Date, G=Date Created, H=Date Completed, I=Days Open,
    // J=Blocker Notes, K=Source, L=Recurrence, M=Last Updated, N=Updated By
    master.appendRow([
      'MEDIUM',                              // A Priority (default)
      'NEW',                                 // B Status
      todo.assignee,                         // C Staff
      '',                                    // D Area (blank, manager fills)
      todo.description,                      // E Description
      '',                                    // F Due Date
      toDateOnly_(shiftData.date),           // G Date Created
      '',                                    // H Date Completed
      '',                                    // I Days Open (auto-calculated)
      '',                                    // J Blocker Notes
      'Shift Report',                        // K Source
      'None',                                // L Recurrence
      toDateOnly_(shiftData.date),           // M Last Updated
      shiftData.MOD                          // N Updated By
    ]);
    pushed++;
  }

  return { pushed };
}
```

The column order matches the `COLS` constant in `EnhancedTaskManagementWaratah.gs`. Some legacy documentation has the column order inverted (Status A, Priority B); the code is the SSOT.

For the receiving system internals, see [`06-task-management-internals.md`](06-task-management-internals.md).

---

## 10. Error Handling

The pipeline's error handling philosophy:

- **Each integration is independent.** A Slack failure does not block email or warehouse.
- **The warehouse write is the only blocking integration.** If the warehouse fails, the night is not officially captured, so we surface the failure to the MOD.
- **Per-step results are logged to `Logger.log()`** for Apps Script Executions panel inspection.
- **Failed steps trigger an alert email** to `INTEGRATION_ALERT_EMAIL_PRIMARY` (and secondary on fallback).

Sample failure pattern:

```javascript
try {
  results.slack = sendSlackMessages_(shiftData);
} catch (e) {
  Logger.log(`Slack integration failed: ${e.message}`);
  results.slack = { error: e.message };
  sendAlertEmail_('Slack integration failed', e);
}
```

The alert email body contains the stack trace and a link to the relevant execution in the Apps Script editor.

---

## 11. Testing

The integration pipeline has two test harnesses:

- `TEST_DataExtractionVerification.js` exercises `extractShiftData_` and `validateShiftData_` against a fixture sheet and verifies field-by-field correctness.
- `TEST_SlackBlockKitLibrary.js` exercises `buildSlackBlockKit_` against representative shiftData objects and verifies Block Kit JSON validity plus truncation guard behaviour.

Both are runnable from the Apps Script editor's Run menu. They use only test sheets and test webhooks; no production data is touched.

To test the full pipeline end-to-end without going live, use **Waratah Tools > Send TEST Report** which routes Slack to the test channel and skips warehouse / task / email steps.

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
