# Staff and Recipients, A Manager's Guide

**Audience:** Venue managers who need to know the current staff roster, who receives what notifications, and how to handle simple staff changes safely.

For deeper administrative changes (editing Script Properties, regenerating webhooks, password resets), see [`/docs/waratah/for-admins/`](../for-admins/) when that tier is published in Phase 3.

---

## 1. Current Staff Roster (May 2026)

The Waratah's active staff allocated in the system right now is 7 named individuals plus 5 role-based options:

| Name | Role |
|---|---|
| Evan | Owner, system admin |
| Cynthia | Operations |
| Adam | Hospitality Manager |
| Jaiden | Floor Staff |
| Joffy | Floor Staff (added May 2026) |
| Nick | Floor Manager |
| Howie | Bar Manager |

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
| Nick | Floor Manager |
| Chef | Head Chef |
| Howie | Bar Manager |
| Adam | Hospitality Manager |

The list is stored in a Script Property called `WARATAH_EMAIL_RECIPIENTS`. As a manager you cannot edit this directly; if the list needs to change (a new manager joining, an old one departing), tell Evan and the change happens through the admin interface.

If a recipient says they are not receiving emails, first check their spam folder. If that fails, see [`05-troubleshooting.md`](05-troubleshooting.md) Section 5.

---

## 3. Slack DM Recipients

Personal Slack direct messages (DMs) for nightly shift reports go to six people:

| Recipient | Has personal DM? |
|---|---|
| Evan | Yes |
| Cynthia | Yes |
| Adam | Yes |
| Jaiden | Yes |
| Joffy | Yes (added May 2026) |
| Nick | Yes |
| Howie | No (opted out, prefers managers channel only) |
| Chef | No (kitchen monitors managers channel) |

The DM webhooks are stored in a Script Property called `SLACK_DM_WEBHOOKS`. Each person's webhook is generated individually in Slack by the recipient (via Slack > Settings > Configure Apps > Incoming Webhooks > Add Configuration). Once the recipient generates the webhook, Evan adds it to Script Properties.

If a recipient stops receiving DMs, the most common cause is a revoked or expired webhook. The recipient needs to regenerate it in Slack.

---

## 4. Slack Channel Posts

Beyond DMs, the system posts the shift report to two manager channels for redundancy. The configured channels and what posts to them:

| Channel | What posts | Frequency |
|---|---|---|
| `#waratah-shift-reports` | Full nightly Slack Block Kit message | Every LIVE send (Wed to Sun) |
| `#waratah-management` | Full nightly Slack Block Kit message | Every LIVE send (mirror of above for visibility) |
| `#waratah-tasks` | Task-related notifications (assignments, blocked task escalations) | As tasks are created, assigned, or escalated |

Channel webhooks live in Script Properties (`WARATAH_SLACK_WEBHOOK_PRIMARY`, `WARATAH_SLACK_WEBHOOK_TASKS`, and so on). Changing them requires admin access.

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

If the dropdown disappears, looks broken, or has the wrong names, run **Waratah Tools > Admin Tools > Reapply Dropdowns and Formatting** in the Task Management spreadsheet. This reasserts every dropdown rule from code. It is non-destructive: it does not change task data, only the validation rules.

If running Reapply Dropdowns does not fix the issue, the underlying `STAFF_LIST` code likely changed without a refresh. Tell Evan.

---

## 7. Quick Lookup Card

For a printable quick reference, here is the summary:

**7 active staff (May 2026):** Evan, Cynthia, Adam, Jaiden, Joffy, Nick, Howie.

**6 email recipients:** Evan, Cynthia, Nick, Chef, Howie, Adam.

**6 Slack DM recipients:** Evan, Cynthia, Adam, Jaiden, Joffy, Nick.

**3 Slack channels for posts:** `#waratah-shift-reports`, `#waratah-management`, `#waratah-tasks`.

**5 role-based assignees:** Bar Team, Kitchen Team, FOH Team, General Management, Marketing Explicit.

**2 catch-all assignees:** Contractor, All.

If you spot anything in this list that is wrong or out of date, tell Evan.
