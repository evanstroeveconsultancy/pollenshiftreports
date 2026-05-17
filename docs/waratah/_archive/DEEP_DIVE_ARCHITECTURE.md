<!-- ARCHIVED 2026-05-17 (Phase 4 of Waratah docs consolidation). Script Properties section superseded by /docs/waratah/for-admins/01-configuration-reference.md (Phase 3). Architecture content superseded by /docs/waratah/for-developers/01-architecture-and-data-flow.md (Phase 4). This file is preserved for historical reference. Do not edit. -->

# THE WARATAH, Deep Dive Architecture

**Last Updated:** March 6, 2026 (NOTE: Architecture now uses NEW Sakura-aligned sheet as of May 17, 2026. See CLAUDE_WARATAH.md for current sheet IDs and configuration)
**Type:** Detailed Technical Documentation (partially stale — use CLAUDE_WARATAH.md for script ID, sheet ID, and trigger status)
**Load:** On-demand only (reference material)

---

## File Structure (Detailed)

```
THE WARATAH/
├── SHIFT REPORT SCRIPTS/         # 13 code files (.js), ~4,700 LOC
│   ├── VenueConfig.js           # Venue configuration (hardcoded cells)
│   ├── IntegrationHubWaratah.js        # Data integration orchestrator
│   ├── NightlyExportWaratah.js         # PDF export, email, Slack
│   ├── WeeklyRolloverInPlaceWaratah.js # In-place rollover ✅
│   ├── MenuWaratah.js                  # Custom menu system
│   ├── AnalyticsDashboardWaratah.js    # Financial dashboards
│   ├── TaskIntegrationWaratah.js       # Task management constants
│   ├── DiagnoseSlack.js         # Slack webhook diagnostics
│   ├── Run.js                   # Test runner utilities
│   ├── UIServerWaratah.js              # HTML UI server
│   ├── TEST_SlackBlockKitLibrary.js  # Slack library test
│   ├── TEST_VenueConfig.js      # Config validation test
│   ├── _SETUP_ScriptProperties.js    # One-time setup
│   ├── analytics-viewer.html    # Analytics dashboard UI
│   ├── export-dashboard.html    # Export management UI
│   ├── rollover-wizard.html     # Rollover management UI
│   ├── appsscript.json          # Apps Script manifest
│   └── _ARCHIVED/               # Legacy files (archived Feb 15, 2026)
│       ├── WeeklyDuplication.js
│       ├── WeeklyRollover.js
│       ├── WeeklyRolloverInPlaceWaratah.js.backup
│       └── AnalyticsDashboardWaratah
└── TASK MANAGEMENT SCRIPTS/      # 6 code files (.gs), ~3,258 LOC
    ├── EnhancedTaskManagementWaratah.gs  # Main task system (2,103 LOC)
    ├── TaskDashboardWaratah.gs   # Task analytics (409 LOC)
    ├── Menu_Updated_Waratah.gs   # Custom menu (244 LOC)
    ├── SlackBlockKitWaratah.gs   # Slack integration (161 LOC)
    ├── UIServerWaratah.gs        # HTML UI server (115 LOC)
    ├── _SETUP_ScriptProperties.gs # Script properties setup (226 LOC)
    ├── task-manager.html         # Task management UI (React/HTML)
    ├── appsscript.json           # Apps Script manifest
    └── .clasp.json               # Clasp deployment config
```

**Total:** ~7,800 lines of code across 19 code files (.js + .gs) + 4 HTML + 3 config + 4 archived files

---

## Venue Configuration

**File:** [`VenueConfig.js`](../../THE%20WARATAH/SHIFT%20REPORT%20SCRIPTS/VenueConfig.js)

**Updated May 17, 2026 (Phase 1):** Now uses **named range system** (same pattern as Sakura). Routes through `RunWaratah.js` `FIELD_CONFIG`.

```javascript
const WARATAH_CONFIG = {
  name: 'THE WARATAH',
  days: ['WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
  dayCount: 5,  // Open 5 days (Wed-Sun)
  timezone: 'Australia/Sydney',
  usesNamedRanges: true,  // ✅ NOW USES NAMED RANGES (May 17, 2026)
  features: {
    taskManagement: true,
    nightlyExport: true,
    analytics: true,
    weeklyRollover: true  // In-place rollover system
  }
}
```

**Field Mapping via RunWaratah.js FIELD_CONFIG (32 fields):**
- Named ranges: `WEDNESDAY_SR_NetRevenue`, `THURSDAY_SR_NetRevenue`, etc.
- Fallback cells: defined in FIELD_CONFIG (e.g., netRevenue → `B34`)
- Cash reconciliation (NEW): `cashCounted` → C18, `expectedCash` → C24, `cashVariance` → C26

**Critical Pattern (May 17, 2026):**
```javascript
// Waratah now uses named ranges (same as Sakura)
const value = getFieldValue(sheet, 'netRevenue');        // Named range + fallback
const displayVal = getFieldDisplayValue(sheet, 'mod');   // Display format
const rangeObj = getFieldRange(sheet, 'netRevenue');     // Range object
```

---

## Script Properties Configuration (Updated May 17, 2026)

**Current Properties (NEW Project):**

```javascript
// Venue
VENUE_NAME: "WARATAH"
MENU_PASSWORD: "chocolateteapot"

// Slack Webhooks
WARATAH_SLACK_WEBHOOK_LIVE: "https://hooks.slack.com/services/..."
WARATAH_SLACK_WEBHOOK_TEST: "https://hooks.slack.com/services/..."

// Email
WARATAH_EMAIL_RECIPIENTS: '["email1@...", "email2@..."]'  // JSON array format

// Spreadsheet IDs (Updated May 17, 2026)
WARATAH_SHEET_ID: "1rcfHTtey_HXC291FAmjpquYkRjWNGbFtClz2szKXfkA"  // ✅ NEW sheet
WARATAH_SHIFT_REPORT_CURRENT_ID: "1rcfHTtey_HXC291FAmjpquYkRjWNGbFtClz2szKXfkA"  // Same as above
WARATAH_WORKING_FILE_ID: "1rcfHTtey_HXC291FAmjpquYkRjWNGbFtClz2szKXfkA"  // Same as above
WARATAH_DATA_WAREHOUSE_ID: "[warehouse_spreadsheet_id]"
WARATAH_TASK_MANAGEMENT_ID: "[task_spreadsheet_id]"

// Rollover & Alerts
ARCHIVE_ROOT_FOLDER_ID: "[archive_folder_id]"
SLACK_MANAGERS_CHANNEL_WEBHOOK: "https://hooks.slack.com/services/..."
ESCALATION_EMAIL: "manager@thewaratah.com"
ESCALATION_SLACK_WEBHOOK: "https://hooks.slack.com/services/..."
INTEGRATION_ALERT_EMAIL_PRIMARY: "tech@thewaratah.com"
INTEGRATION_ALERT_EMAIL_SECONDARY: "manager@thewaratah.com"

// AI Insights (optional)
ANTHROPIC_API_KEY: "sk-ant-..."
AI_INSIGHTS_MODE: "evan_only"
AI_INSIGHTS_EVAN_EMAIL: "evan@pollenhospitality.com"
```

**Setup Function:**
```javascript
// Run once in Apps Script Editor to configure all properties
setupScriptProperties()

// Verify all properties are set correctly
verifyScriptProperties()

// Reset if needed (CAUTION: deletes all properties)
resetScriptProperties()
```

**File:** [`_SETUP_ScriptProperties.js`](../../THE%20WARATAH/SHIFT%20REPORT%20SCRIPTS/_SETUP_ScriptProperties.js)

---

## Enhanced Task Management System

**File:** [`EnhancedTaskManagementWaratah.gs`](../../THE%20WARATAH/TASK%20MANAGEMENT%20SCRIPTS/EnhancedTaskManagementWaratah.gs)

**Staff List (with Slack DM integration):**
- Evan, Cynthia, Adam, Jaiden, Joffy, Nick (individual DM webhooks configured)
- Bar Team, Kitchen Team, FOH Team, General Management, Marketing Explicit (group assignments)
- All, Contractor (special categories)

**Data Structure (14 columns):**
1. Status (A) - 9 possible states
2. Priority (B) - 5 levels
3. Staff Allocated (C) - from staff list above
4. Area (D) - FOH, BOH, Bar, Kitchen, Admin, Maintenance, Marketing, Events, Training, General
5. Description (E) - task details
6. Due Date (F) - date tracking
7. Date Created (G) - auto-populated
8. Date Completed (H) - auto-set on DONE/CANCELLED
9. Days Open (I) - calculated formula
10. Blocker Notes (J) - required for BLOCKED status
11. Source (K) - Shift Report, Meeting, Ad-hoc
12. Recurrence (L) - None, Weekly, Fortnightly, Monthly
13. Last Updated (M) - auto-populated
14. Updated By (N) - tracks who made changes

**9-Status Workflow:**
```
NEW → TO DO → IN PROGRESS → TO DISCUSS → DONE
              ↓
          BLOCKED (escalates after 14 days)
              ↓
          DEFERRED
              ↓
          CANCELLED
              ↓
          RECURRING (auto-regenerates)
```

**Automation:**
- Bi-hourly: Cleanup and sort
- Daily 6am: Staff workload refresh
- Sunday 9am: Overdue summary
- Monday 6am: Archive old tasks
- Monday 10am: Weekly active tasks summary to Slack
- On Edit: Audit log, auto-sort

**Setup:**
```javascript
createDailyMaintenanceTrigger()
createWeeklySummaryTrigger()
createOnEditTrigger()
```

---

## Menu System

**File:** [`MenuWaratah.js`](../../THE%20WARATAH/SHIFT%20REPORT%20SCRIPTS/MenuWaratah.js)

```
Waratah Tools
├── Daily Reports ▸
│   ├── Export & Email PDF (LIVE)
│   ├── Export & Email (TEST to me)
│   ├── ────────────────
│   └── Open Export Dashboard
├── ────────────────
├── Weekly Reports ▸
│   ├── Weekly To-Do Summary (LIVE)              [Password Protected]
│   ├── Weekly To-Do Summary (TEST to me)        [Password Protected]
│   ├── ────────────────
│   └── Weekly Rollover (In-Place) ▸
│       ├── Run Rollover Now
│       ├── Preview Rollover (Dry Run)
│       ├── ────────────────
│       ├── Create Rollover Trigger
│       └── Remove Rollover Trigger
├── ────────────────
├── Build Financial Dashboard                     [Password Protected]
├── Build Executive Dashboard                     [Password Protected]
├── Open Analytics Viewer
├── ────────────────
└── Setup & Utilities ▸
    ├── Fix Named Ranges on This File            [Password Protected]
    └── List All Named Ranges                    [Password Protected]
```

**Password:** `chocolateteapot` (stored in Script Properties as `MENU_PASSWORD`)

---

## Development Guidelines

### When Working on Waratah Code

**1. Use Hardcoded Cell References Directly:**
```javascript
// ✅ CORRECT for Waratah
const value = sheet.getRange('B54').getValue();

// OR use abstraction (works for both venues)
const value = getRangeValue_(sheet, 'netRevenue');
```

**2. Never Use `clear()` on Data Ranges:**
```javascript
// ✅ CORRECT - Preserves formatting
range.clearContent();

// ❌ WRONG - Destroys formatting, validation
range.clear();
```

**3. Use Venue Configuration:**
```javascript
const config = getVenueConfig_();
if (config.name === 'THE WARATAH') {
  // Waratah-specific logic
}
```

---

## Testing Checklist

- [ ] Test on COPY of working file
- [ ] Check Apps Script logs for errors
- [ ] Test menu functionality
- [ ] Confirm Slack notifications send
- [ ] Validate data warehouse writes
- [ ] Verify email delivery

---

## Common Operations

### Test Integrations
```javascript
testIntegrations()       // Test on active sheet
runValidationReport()    // Full system validation
```

### Update Email Recipients
```javascript
// Script Properties → WARATAH_EMAIL_RECIPIENTS
// JSON array format:
'["email1@thewaratah.com", "email2@thewaratah.com"]'
```

### Add New Staff to Task Management
```javascript
// Edit data validation in column C (Staff Allocated)
// Add new name to dropdown list
```

---

**Last Updated:** March 6, 2026
**File Count:** 22 code files (16 .js + 6 .gs)
**Total LOC:** ~9,371 lines of code
