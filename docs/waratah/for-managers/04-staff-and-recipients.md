# Staff and Recipients, A Manager's Guide

**Audience:** Venue managers who need to know the current staff roster, who receives what notifications, and how to handle simple staff changes safely.

For deeper administrative changes (editing Script Properties, regenerating webhooks, password resets), see [`/docs/waratah/for-admins/`](../for-admins/) when that tier is published in Phase 3.

---

## 1. Current Staff Roster (May 2026)

The Waratah's active staff allocated in the system right now is 7 named individuals plus 7 non-individual options (5 team-level plus 2 catch-all):

| Name | Role |
|---|---|
| Evan | Owner, system admin |
| Cynthia | Owner |
| Adam | Owner |
| Jaiden | Bar Manager |
| Joffy | Bar Supervisor Staff (added May 2026) |
| Nick | Exec Chef |

Plus role-based assignees for team-level tasks:

- Bar Team
- Kitchen Team
- FOH Team
- General Management
- Marketing Explicit
- Contractor (for outside parties)
- All (broadcast)

These names and roles populate the **Staff Allocated** dropdown in the Task Management spreadsheet. The dropdown is a closed list: only items above can be selected.

---

## 2. Email Recipients for Nightly PDF Reports

Six people receive the nightly shift report PDF by email after each LIVE send:

| Recipient | Role |
|---|---|
| Evan | Owner |
| Cynthia | Operations |
| Nick | Exec Chef |
| Chef | Sous Chef |
| Jaiden | Bar Manager |
| Adam | Owner |

The list is stored in a Script Property called `WARATAH_EMAIL_RECIPIENTS`. As a manager you cannot edit this directly; if the list needs to change (a new manager joining, an old one departing), tell Evan and the change happens through the admin interface.

If a recipient says they are not receiving emails, first check their spam folder. If that fails, see [`05-troubleshooting.md`](05-troubleshooting.md) Section 5.

---

## 3. Slack DM Recipients

Personal Slack DM webhooks are used for task-related notifications (the Monday 10am weekly active task summary and BLOCKED-over-14-day escalations). They are not used for the nightly shift report send, which posts to a single channel webhook (`WARATAH_SLACK_WEBHOOK_LIVE`). Six people have a personal DM webhook configured:

| Recipient | Has personal DM? |
|---|---|
| Evan | Yes |
| Cynthia | Yes |
| Adam | Yes |
| Jaiden | Yes |
| Joffy | Yes (added May 2026) |
| Nick | Yes |

The DM webhooks are stored in a Script Property called `SLACK_DM_WEBHOOKS`. Each person's webhook is generated individually in Slack by the recipient (via Slack > Settings > Configure Apps > Incoming Webhooks > Add Configuration). Once the recipient generates the webhook, Evan adds it to Script Properties.

If a recipient stops receiving DMs, the most common cause is a revoked or expired webhook. The recipient needs to regenerate it in Slack.

---

## 4. Slack Channel Posts

The nightly shift report Slack message is posted to a single channel webhook (the LIVE webhook). There is no mirror post to a second channel. Channel-level webhooks used by the system live in Script Properties:

| Script Property | Used for |
|---|---|
| `WARATAH_SLACK_WEBHOOK_LIVE` | Nightly shift report Block Kit message (LIVE mode) |
| `WARATAH_SLACK_WEBHOOK_TEST` | Nightly shift report Block Kit message (TEST mode) |
| `SLACK_MANAGERS_CHANNEL_WEBHOOK` | Managers channel posts (where used by the task system) |
| `ESCALATION_SLACK_WEBHOOK` | BLOCKED-over-14-day task escalation alerts |

The specific Slack channel each webhook points at is configured in the Slack workspace, not in code. If you need to know which workspace channel a webhook targets, ask Evan. Changing the webhooks themselves requires admin access.

---

## 5. Adding or Removing Staff Safely (Manager Overview)

When a new staff member joins, or an existing one leaves, several places need to update. Some are manager-safe; others require admin access.

### What you can do as a manager

1. **Reassign their open tasks before they depart.** Open Task Management, filter by Staff Allocated = the departing person, change each to a different name or set to RECURRING/Blocked for follow-up. Do this before their last day. Do not leave tasks orphaned on a name that will be removed.
2. **Note any recurring tasks they own.** Recurring tasks regenerate themselves and will re-assign to the same name unless you change the master template. Edit each recurring template before the staff member leaves.

### What needs admin (Evan)

1. **Adding or removing names from the `STAFF_LIST`.** The dropdown is hard-coded in `EnhancedTaskManagementWaratah.gs`. Evan updates the list and re-runs the Reapply Formatting and Validation menu item to refresh the dropdown in the sheet.
2. **Adding or removing a personal Slack DM webhook.** The new staff member generates their webhook in Slack and gives it to Evan, who adds it to the `SLACK_DM_WEBHOOKS` Script Property.
3. **Adding or removing from the email recipient list.** Evan updates `WARATAH_EMAIL_RECIPIENTS` in Script Properties.
4. **Updating Slack channel access.** Slack workspace admin (separate from this system).

Tell Evan as soon as you know about a staff change, and follow up the day before their last day to confirm tasks are reassigned and dropdowns are clean.

---

## 6. The Staff Allocated Dropdown

The Staff Allocated column in the Task Management spreadsheet uses a closed-list dropdown. When you click a cell in that column, you see only the names and roles from Section 1 above.

If the dropdown disappears, looks broken, or has the wrong names, open the Task Management spreadsheet and run **Task Management > Admin Tools > Cleanup > Reapply Dropdowns & Formatting** (requires admin password). This reasserts every dropdown rule from code. It is non-destructive: it does not change task data, only the validation rules.

If running Reapply Dropdowns & Formatting does not fix the issue, the underlying `STAFF_LIST` code likely changed without a refresh. Tell Evan.

---

## 7. Quick Lookup Card

For a printable quick reference, here is the summary:

**6 active staff (May 2026):** Evan, Cynthia, Adam, Jaiden, Joffy, Nick.

**5 email recipients:** Evan, Cynthia, Nick, Chef, Adam.

**6 Slack DM recipients:** Evan, Cynthia, Adam, Jaiden, Joffy, Nick.

**Channel webhooks (Script Properties):** `WARATAH_SLACK_WEBHOOK_LIVE`, `WARATAH_SLACK_WEBHOOK_TEST`, `SLACK_MANAGERS_CHANNEL_WEBHOOK`, `ESCALATION_SLACK_WEBHOOK`.

**5 team-level assignees:** Bar Team, Kitchen Team, FOH Team, General Management, Marketing Explicit.

**2 catch-all assignees:** Contractor, All.

**Total non-individual assignees:** 7 (5 team-level plus 2 catch-all), matching Section 1.

If you spot anything in this list that is wrong or out of date, tell Evan.
