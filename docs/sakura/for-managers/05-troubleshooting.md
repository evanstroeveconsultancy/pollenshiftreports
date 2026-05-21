# Troubleshooting, A Manager's Guide

**Audience:** Sakura House venue managers facing a problem they may be able to resolve themselves without admin or developer access.

This guide covers the situations you can fix from the menu, the spreadsheet UI, or a quick check. Anything that requires Script Properties access, the admin password, or trigger reinstallation is an admin task; those sections direct you to escalate.

The only menu items you can run without the admin password are **Shift Report > Send Nightly Report** and **Shift Report > Send Test Report**. Everything under **Admin Tools** is password-gated.

---

## 1. Quick Diagnosis Checklist

1. Nightly Slack and email both missing? See Section 3.
2. Slack arrived but email did not? See Section 5.
3. Email arrived but Slack silent? See Section 4.
4. Monday rollover did not run? See Section 7.
5. Menu missing? See Section 2.
6. TO-DOs missing from the Actionables sheet? See Section 8.
7. Cell shows `#REF!` or looks scrambled? See Section 9.
8. AI anomaly alert posted but numbers look correct? See Section 11.

If none of these match, see Section 12 for escalation.

---

## 2. The Menu Disappeared

**Problem:** The **Shift Report** menu in the shift report spreadsheet, or the **Task Management** menu in the Sakura Actionables Sheet, is missing.

**What it means:** The menu is installed by an `onOpen` script that runs each time the spreadsheet opens. Occasionally Google Apps Script does not run it immediately.

**What to do:**

1. Refresh the browser tab (Cmd+R or Ctrl+R) and wait 5 to 10 seconds for the menu to load.
2. If still missing, close the tab and reopen the spreadsheet from your bookmarks or Drive.
3. If still missing, escalate. See [`/docs/sakura/for-admins/03-advanced-troubleshooting.md`](../for-admins/03-advanced-troubleshooting.md).

---

## 3. Nightly Shift Report Did Not Send

**Problem:** No Slack message and no email for last night's shift.

**What it means:** Either the manager forgot to click **Send Nightly Report**, or the send ran and failed silently mid-way.

**What to do:**

1. Open the shift report spreadsheet and check the relevant day tab. If the input cells were not filled in, no report was triggered. Fill them in and run **Shift Report > Send Nightly Report**.
2. If the day tab was filled in, run **Shift Report > Send Test Report**. The test goes only to you and posts to the test Slack channel.
3. If the test succeeds, re-run **Send Nightly Report**. Re-sending is safe; the warehouse skips duplicates.
4. If the test also fails, escalate.

---

## 4. Slack Message Did Not Appear

**Problem:** The email arrived but no Slack message appeared in the managers channel.

**What it means:** Most often a Slack webhook problem (expired, channel renamed or archived) or a transient network failure during the Slack step.

**What to do:**

| Check | What to do |
|---|---|
| Is Slack itself working? | Confirm other messages and bots are posting in the same channel. If Slack is down or the channel was archived, that is not a system problem. |
| Did only Slack fail? | Re-run **Shift Report > Send Nightly Report**. The Slack and email steps both repeat; the warehouse write skips duplicates so re-sending is safe. |
| Resend still failed? | The webhook may have expired. This is an admin fix; escalate. See [`/docs/sakura/for-admins/03-advanced-troubleshooting.md`](../for-admins/03-advanced-troubleshooting.md). |

---

## 5. Email Did Not Arrive

**Problem:** Slack posted but no email arrived for one or more recipients.

**What it means:** Usually spam filtering or an out-of-date recipient list. Rarely, a Google Workspace send-quota issue.

**What to do:**

1. Ask the recipient to check their spam or junk folder. Search for "Sakura" or the sender address.
2. If found in spam, mark as Not Spam so future sends are whitelisted.
3. Run **Shift Report > Send Test Report**. TEST mode emails the running user only; if you receive the test, the email step is healthy and the issue is the recipient list.
4. If TEST also fails to arrive, escalate; the recipient list and quota are admin-side.

If only some recipients are missing the email while others receive it, that is almost certainly per-recipient filtering, not a system problem.

---

## 6. Pre-Send Checklist Dialog Did Not Appear, or Confirm & Send Is Disabled

**Problem:** You clicked **Send Nightly Report** and either no dialog appeared, or the dialog opened but the **Confirm & Send** button stays greyed out.

**What it means:** The export dashboard checks the current day tab for required fields before allowing send. If a required field is missing, the button stays disabled. If the dialog did not open at all, there is likely a script error on load.

**What to do:**

1. Check that the day tab matching today's day-of-week (Monday to Saturday; Sakura is closed Sunday) has values in the required cells: Date, MOD, FOH Staff, BOH Staff, Cash Count, and the financial inputs (Net Revenue, Production Amount, Deposit, Tips, Discounts).
2. The dashboard lists which fields are missing. Fill those cells and the **Confirm & Send** button becomes active.
3. If the dialog did not appear at all, refresh the spreadsheet and try again.
4. If the dialog still will not open after a refresh, escalate.

---

## 7. Weekly Rollover Did Not Run

The rollover runs Monday at 10:00 AM Australia/Sydney. It archives last week's PDF, renames day tabs, and clears manager input cells for the new week. Net Revenue is a formula and is deliberately not cleared.

### Symptom: Monday afternoon and tab names still show last week's dates

**What it means:** The rollover trigger did not fire, or it fired and failed.

**What to do:** Escalate. The rollover runs from a time-based trigger that managers cannot inspect or restart from the spreadsheet UI. See [`/docs/sakura/for-admins/03-advanced-troubleshooting.md`](../for-admins/03-advanced-troubleshooting.md).

### Symptom: Tab names rolled correctly but old data is still in the input cells

**What it means:** The archive step succeeded but the clear step did not finish.

**What to do:**

1. **Do not type fresh data into the dirty cells.** Overwriting last week's data destroys the archive reference.
2. Escalate immediately. The clear step needs to be re-run from the Apps Script editor (admin only).

### Symptom: A PDF or spreadsheet copy is missing from the Drive archive

**What it means:** Likely a Drive folder permission or configuration issue.

**What to do:** Escalate. The Drive folder ID is stored in Script Properties and only an admin can adjust it.

---

## 8. TO-DOs Did Not Sync to the Actionables Sheet

**Problem:** You added TO-DOs in cells A69:A84 (with assignees in D69:D84) on the day tab, ran Send Nightly Report, but the tasks did not appear in the Sakura Actionables Sheet.

**What it means:** The push to Actionables runs as the last step of the nightly send. If the Slack or email step failed early, the push may not have run; or the Actionables spreadsheet ID may be misconfigured.

**What to do:**

1. Confirm the TO-DO cells are actually populated on the correct day tab and that the assignee column is filled.
2. Re-run **Shift Report > Send Nightly Report**. The push step is idempotent; running again will sync the missing tasks.
3. If the tasks still do not appear, escalate.

---

## 9. Cell Showing `#REF!` or Scrambled Numbers (Named Range Error)

Sakura uses named ranges so that the code refers to cells by name (`MONDAY_SR_NetRevenue`) rather than by row and column number. There are 144 named ranges in total (24 fields × 6 days).

**Problem:** A cell shows `#REF!`, or the output values look like they came from the wrong row.

**What it means:** A row or column was inserted or deleted on a day tab, shifting named ranges out of position; or a named range was manually removed.

**Manager rule:** never insert or delete rows or columns on a day tab (Monday to Saturday). The layout is fixed. The Read Me, Task Management, and Analytics tabs do not use named ranges and can be edited freely.

**What to do:**

1. If you just inserted or deleted a row, press **Cmd+Z** (Mac) or **Ctrl+Z** (Windows) immediately to undo.
2. If the undo window has passed (you closed the tab), escalate. The named ranges need to be rebuilt by an admin from **Shift Report > Admin Tools > Set Up & Diagnostics**.

---

## 10. Cash Variance Looks Wrong

**Problem:** The cash variance number on the day tab or in the Slack message does not match what you counted.

**What it means:** Cash variance is a formula based on the cash count breakdown (C10:E17) and cash record totals (C22:D23). If any of those input cells is empty or has a typo, the variance will be wrong.

**What to do:**

1. Check the cash count breakdown cells (C10:E17) on the day tab. Every denomination should have either a number or be blank-but-not-text.
2. Check the cash record totals (C22:D23) match what is in the till tape.
3. Correct any typos. The variance updates automatically.
4. If the inputs are correct but the variance still looks wrong, take a screenshot of the day tab cells and escalate.

---

## 11. Anomaly Alert Posted But the Numbers Look Correct

**Problem:** An AI-generated anomaly alert was posted (for example, "Net Revenue unusually low") but you can see the numbers are normal for that day.

**What it means:** The AI insights system flags revenue movements against the recent baseline. A genuinely unusual but explainable shift (private event, public holiday, weather closure) can still trip the threshold. The alert is informational, not an error.

**What to do:**

1. If the numbers are accurate and the unusual movement has a known cause, no action is needed. Add a note in the day's Shift Summary explaining the cause; that context is helpful for future review.
2. If the numbers themselves are wrong (a typo, a missed input), correct the day tab and re-run **Send Nightly Report**.
3. If anomaly alerts are firing repeatedly with no clear cause, escalate. The sensitivity threshold is admin-tunable.

---

## 12. Escalating a Problem

When you escalate, send (1) what you observed with date, channel, recipient; (2) what you tried; (3) a screenshot of any error; (4) the time you noticed. For after-hours emergencies (Friday or Saturday service-night failures), call rather than message.

Admin-side fixes (Script Properties, webhook regeneration, trigger reinstall, password reset, named range rebuild): [`/docs/sakura/for-admins/03-advanced-troubleshooting.md`](../for-admins/03-advanced-troubleshooting.md). Staff and access changes: [`/docs/sakura/for-admins/02-staff-and-access-management.md`](../for-admins/02-staff-and-access-management.md).

---

## 13. Most Common Problems, Quick Table

| Problem | What it means | What to do |
|---|---|---|
| Slack missing, email arrived | Webhook or transient Slack issue | Re-run Send Nightly Report; if still failing, escalate |
| Email missing, Slack arrived | Spam filter or recipient list | Check spam; run Send Test Report; if TEST fails, escalate |
| Both Slack and email missing | Nightly send did not run | Run Send Test Report to isolate; re-run Send Nightly Report |
| Pre-send dialog did not appear | Script error on load | Refresh and retry; if persistent, escalate |
| Confirm & Send button disabled | Required cells empty on day tab | Fill missing fields listed in dialog |
| TO-DOs not in Actionables | Push step did not complete | Re-run Send Nightly Report |
| Cash variance wrong | Input typo in cash count or cash record | Check C10:E17 and C22:D23 on day tab |
| Tabs show last week's dates Monday afternoon | Rollover did not run | Escalate; do not rename tabs by hand |
| Old data still in cells after rollover | Clear step did not finish | Do not overwrite; escalate |
| `#REF!` or scrambled cell | Row or column inserted or deleted on a day tab | Cmd+Z immediately; if too late, escalate |
| Anomaly alert but numbers correct | Known unusual shift tripped the threshold | Add context in Shift Summary |
| Menu disappeared | `onOpen` did not fire | Refresh, reopen; if still missing, escalate |

---

**Need more help?** Admin-side fixes: [`/docs/sakura/for-admins/03-advanced-troubleshooting.md`](../for-admins/03-advanced-troubleshooting.md). Staff and access: [`/docs/sakura/for-admins/02-staff-and-access-management.md`](../for-admins/02-staff-and-access-management.md).
