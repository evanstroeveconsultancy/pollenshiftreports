# Staff and Recipients, A Manager's Guide

**Audience:** Sakura House managers who need to know the current staff roster, who receives what notifications, and how to handle simple staff changes safely.

For deeper administrative changes (editing Script Properties, regenerating webhooks, password resets), see [`/docs/sakura/for-admins/02-staff-and-access-management.md`](../for-admins/02-staff-and-access-management.md).

---

## 1. Current Staff Roster

The active assignees configured in Sakura's Task Management system are 6 named individuals plus 6 non-individual options (3 team-level plus 3 catch-all):

**Named individuals:**

- Evan
- Nick
- Gooch
- Cynthia
- Adam
- Ian

**Team-level assignees:**

- FOH Team
- Bar Team
- Kitchen Team

**Catch-all assignees:**

- All (broadcast)
- Contractor (for outside parties)
- General Management

These names populate the **Staff Allocated** dropdown in the Task Management spreadsheet. The dropdown is a closed list: only items above can be selected. The list is defined in code as the `STAFF_LIST` constant in `EnhancedTaskManagement_Sakura.gs`. As a manager you cannot edit the list directly; if it is out of date, tell Evan.

Specific roles and current contact details are maintained in the admin guide rather than here, because they change more often than the dropdown roster does.

---

## 2. Email Recipients for Nightly PDF Reports

A list of managers receives the nightly shift report PDF by email after each LIVE send. The list is stored in a Script Property called `SAKURA_EMAIL_RECIPIENTS` (JSON map of email addresses to display names).

As a manager you cannot edit this list directly. If the list needs to change (a new manager joining, an old one departing), tell Evan and the change happens through the admin interface.

The current canonical recipient list lives in [`/docs/sakura/for-admins/02-staff-and-access-management.md`](../for-admins/02-staff-and-access-management.md). It is not duplicated here so the two docs do not drift out of sync.

If a recipient says they are not receiving emails, first check their spam folder. If that fails, see [`05-troubleshooting.md`](05-troubleshooting.md).

---

## 3. Slack DM Recipients

Personal Slack DM webhooks are used by the Task Management system for:

- BLOCKED-over-14-day task escalation alerts (sent to Evan via the `ESCALATION_SLACK_WEBHOOK` property, separate from the staff DM map)
- Direct task notifications to individual staff when a task is assigned to them

The DMs are not used for the nightly shift report itself. The shift report posts to a single venue channel webhook (`SAKURA_SLACK_WEBHOOK_LIVE`) and emails the management distribution list.

DM webhooks are stored in a Script Property called `SLACK_DM_WEBHOOKS` (JSON map of staff name to webhook URL). Each person's webhook is generated individually in Slack by the recipient (Slack > Settings > Configure Apps > Incoming Webhooks > Add Configuration). Once the recipient generates the webhook, Evan adds it to Script Properties.

If a staff member stops receiving DMs, the most common cause is a revoked or expired webhook. The recipient needs to regenerate it in Slack and pass the new URL to Evan.

The current list of who has a personal DM webhook configured is maintained in [`/docs/sakura/for-admins/02-staff-and-access-management.md`](../for-admins/02-staff-and-access-management.md).

**Important May 2026 change:** The Monday weekly active tasks summary now posts to the managers channel only (via `SLACK_MANAGERS_CHANNEL_WEBHOOK`), not to individual DMs. Personal DMs are still used for task assignment alerts and BLOCKED escalations.

---

## 4. Slack Channel Posts and Webhook Map

The system uses several Slack webhooks, each configured as a Script Property:

| Script Property | Used for |
|---|---|
| `SAKURA_SLACK_WEBHOOK_LIVE` | Nightly shift report Block Kit message (LIVE mode) |
| `SAKURA_SLACK_WEBHOOK_TEST` | Nightly shift report Block Kit message (TEST mode) |
| `SLACK_MANAGERS_CHANNEL_WEBHOOK` | Monday weekly active tasks summary and other manager-tier task posts |
| `ESCALATION_SLACK_WEBHOOK` | BLOCKED-over-14-day task escalation alerts to Evan |
| `SLACK_DM_WEBHOOKS` | JSON map of staff name to personal DM webhook |

The specific Slack channel each webhook points at is configured in the Slack workspace, not in code. If you need to know which workspace channel a webhook targets, ask Evan. Changing the webhooks themselves requires admin access.

---

## 5. Adding or Removing Staff Safely (Manager Overview)

When a new staff member joins, or an existing one leaves, several places need to update. Some are manager-safe; others require admin access.

### What you can do as a manager

1. **Reassign their open tasks before they depart.** Open Task Management, filter by Staff Allocated equal to the departing person, change each row to a different name. Do this before their last day. Do not leave tasks orphaned on a name that will be removed from the dropdown.
2. **Check their recurring tasks.** Tasks with a Recurrence value (Weekly, Fortnightly, Monthly) will regenerate after DONE. If the departing staff member owned recurring tasks, edit each one to reassign before they leave; otherwise the system will regenerate tasks pointing at a name no longer on the roster.

### What needs admin (Evan)

1. **Adding or removing names from the `STAFF_LIST`.** The dropdown is hard-coded in `EnhancedTaskManagement_Sakura.gs`. Evan updates the list and re-runs the dropdown reapply menu to refresh the validation rules in the sheet.
2. **Adding or removing a personal Slack DM webhook.** The new staff member generates their webhook in Slack and gives it to Evan, who adds it to the `SLACK_DM_WEBHOOKS` Script Property.
3. **Adding or removing from the email recipient list.** Evan updates `SAKURA_EMAIL_RECIPIENTS` in Script Properties.
4. **Updating Slack channel access.** Slack workspace admin (separate from this system).

Tell Evan as soon as you know about a staff change, and follow up the day before their last day to confirm tasks are reassigned and dropdowns are clean.

---

## 6. The Staff Allocated Dropdown

The Staff Allocated column in the Task Management spreadsheet uses a closed-list dropdown. When you click a cell in that column, you see only the names and roles from Section 1 above.

If the dropdown disappears, looks broken, or has the wrong names, escalate to admin. Reapplying dropdown validation is admin-tier (requires the menu password). The procedure is documented in [`/docs/sakura/for-admins/03-advanced-troubleshooting.md`](../for-admins/03-advanced-troubleshooting.md).

If the dropdown still shows a name that has been removed from `STAFF_LIST` in code, the `reapplyFormattingAndValidation` step has not been run after the code update. Tell Evan.

---

## 7. Quick Lookup Card

For a printable quick reference, here is the summary:

**6 named individuals in `STAFF_LIST`:** Evan, Nick, Gooch, Cynthia, Adam, Ian.

**3 team-level assignees:** FOH Team, Bar Team, Kitchen Team.

**3 catch-all assignees:** All, Contractor, General Management.

**Total roster entries:** 12 (matching Section 1).

**Channel and DM webhooks (Script Properties):** `SAKURA_SLACK_WEBHOOK_LIVE`, `SAKURA_SLACK_WEBHOOK_TEST`, `SLACK_MANAGERS_CHANNEL_WEBHOOK`, `ESCALATION_SLACK_WEBHOOK`, `SLACK_DM_WEBHOOKS`.

**Email recipients list (Script Property):** `SAKURA_EMAIL_RECIPIENTS`. Current contents in [`/docs/sakura/for-admins/02-staff-and-access-management.md`](../for-admins/02-staff-and-access-management.md).

If you spot anything in this list that is wrong or out of date, tell Evan.
