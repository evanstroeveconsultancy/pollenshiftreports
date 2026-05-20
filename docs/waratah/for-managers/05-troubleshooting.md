# Troubleshooting, A Manager's Guide

**Audience:** Venue managers facing a problem that they may be able to resolve themselves without admin or developer access.

This guide covers the situations you can fix from the menu, the spreadsheet UI, or a quick check. If the problem turns out to need admin work (Script Properties, log inspection, trigger reset, password change), the relevant section directs you to escalate.

---

## 1. Quick Diagnosis Checklist

When something looks wrong, run through this decision tree before reaching for the troubleshooting sections:

1. **Was a shift report sent last night?** Check Slack and email. If both are missing, see Section 3.
2. **Did the Slack message arrive but the email did not?** See Section 5.
3. **Did the email arrive but Slack is silent?** See Section 4.
4. **Did the rollover not run on Monday night?** See Section 6.
5. **Is the menu missing from the spreadsheet?** See Section 2.
6. **Are tasks from last night's TO-DOs missing from Task Management?** See [`02-task-management.md`](02-task-management.md) Section 14, FAQ.
7. **Did a cell suddenly start showing `#REF!` or wrong numbers?** See Section 7.

If none of the above describes the symptom, see Section 8 for escalation.

---

## 2. The Menu Disappeared

**Symptom:** The shift report spreadsheet's **Waratah Tools** menu, or the Task Management spreadsheet's **Task Management** menu, is missing from the menu bar.

**Why this happens:** The menu is installed by an `onOpen` script that runs every time the spreadsheet is opened. Occasionally Google Apps Script does not run the trigger immediately. Refreshing or reopening usually fixes it.

**What to do:**

1. Refresh the browser tab (Cmd+R or Ctrl+R).
2. If still missing, close the tab and reopen the spreadsheet from your browser bookmarks or Drive.
3. If still missing after both, run the **Extensions > Apps Script** menu in the spreadsheet. Inside Apps Script, manually run the function `onOpen()` from the dropdown. Save and re-open the spreadsheet.
4. If still missing after step 3, tell Evan. The `onOpen` trigger may have been removed and needs reinstalling.

---

## 3. Nothing Is Running Automatically

**Symptom:** Weekly rollover did not happen Monday night. Or Revenue Digest did not post Monday afternoon. Or backfill did not run.

**Why this happens:** Following the May 2026 cutover, the new code is installed but the time-based triggers may not yet be set up. Some automation needs manual triggering until Evan completes setup. Also, when code is redeployed, existing triggers are sometimes destroyed and need recreation.

**What to do (manager-safe):**

1. Confirm with Evan whether the triggers for this venue have been installed yet. The May 2026 cutover left them pending.
2. While triggers are pending, run the missing automation manually from the menu:
   - **Waratah Tools > Admin Tools > Weekly Reports > Weekly Rollover (In-Place) > Run Rollover Now** for the rollover.
   - **Waratah Tools > Admin Tools > Weekly Digest > Send Revenue Digest (LIVE)** for the digest.
   - **Waratah Tools > Admin Tools > Data Warehouse > Backfill This Sheet to Warehouse** for a per-sheet backfill (or ask Evan to run `runWeeklyBackfill_` from the Apps Script editor for a full-week backfill).
3. If you do not have admin password access to the menu items above, contact Evan.

Trigger setup itself is an admin task. See [`/docs/waratah/for-admins/`](../for-admins/) when Phase 3 is published.

---

## 4. Slack Messages Not Posting

**Symptom:** Email arrived but no Slack message appeared in the manager channels.

**Common causes:**

- Slack outage (rare but happens; check Slack status page or other channels)
- Expired Slack webhook
- Manager channel renamed or archived, leaving the webhook pointing nowhere
- Network interruption during send (only the Slack step failed; other outputs succeeded)

**What to do:**

1. Check whether other Slack messages are arriving normally in the same channel (any chat, any bot). If Slack itself is down or the channel is broken, that is not a system problem; wait for Slack to recover.
2. Resend the shift report by running **Waratah Tools > Daily Reports > Export & Email PDF (LIVE)** again. Re-sending repeats Slack and email; the warehouse write is skipped on duplicates so it is safe.
3. If Slack is healthy but the resend also fails, the webhook may have expired. This is an admin fix; tell Evan. The webhook lives in Script Properties.

---

## 5. Emails Not Arriving

**Symptom:** Slack message posted but no email arrived for one or more recipients.

**Common causes:**

- Spam folder filtering
- Recipient changed their email and the Script Property was not updated
- Google Workspace daily send-quota exceeded (very rare)
- Recipient's mailbox is full

**What to do:**

1. Ask the affected recipient to check their spam folder. Search for "Waratah shift report" or the sender address.
2. If found in spam, ask them to mark as Not Spam to whitelist future sends.
3. If not found anywhere, send a TEST report (**Waratah Tools > Daily Reports > Export & Email (TEST to me)**) and check whether the test email arrives in your own inbox (TEST mode emails only the running user).
4. If TEST also does not arrive, ask Evan to verify the recipient's address in `WARATAH_EMAIL_RECIPIENTS` Script Property.

If only some recipients are missing emails while others receive them, that is almost certainly a per-recipient filtering issue, not a system problem.

---

## 6. Rollover Symptom-Spotting

The rollover runs Monday at 9pm and does four things: archives the week's PDF to Drive, saves a copy of the spreadsheet to Drive, renames day tabs for the new week, clears manager input cells. Success is silent; if the rollover fails, an error message is posted to Slack via `notifyError_`.

### Symptom: I logged in Tuesday morning and tab names show last week's dates

**Likely cause:** Rollover did not run, or it ran and failed mid-way.

**What to do:**

1. Check the Slack manager channels for a rollover error message around Monday 9pm. If an error appeared, the rollover failed.
2. Tell Evan. The fix is to run the rollover manually with **Waratah Tools > Admin Tools > Weekly Reports > Weekly Rollover (In-Place) > Run Rollover Now**. Do not attempt to rename tabs by hand; the rollover script handles it correctly.

### Symptom: Tab names rolled correctly but old data is still in the cells

**Likely cause:** The rollover archive ran but the clear step did not complete.

**What to do:**

1. **Do not type fresh data into the dirty cells.** Tell Evan first.
2. Evan will re-run the rollover via `runWaratahWeeklyRollover`, or manually clear the affected ranges from the Apps Script editor using `_warClearAllSheetData_`. This is a restricted admin operation.

### Symptom: A PDF or spreadsheet copy is missing from the Drive archive

**Likely cause:** The Drive permission or folder configuration changed.

**What to do:** Tell Evan. The Drive folder ID lives in a Script Property and can be reset.

---

## 7. Don't Insert or Delete Rows on Day Tabs

The Waratah shift report sheets use named ranges to refer to cells. Every input field has a named range, and the exact installed count is reported by the `namedRangeHealthCheck_Waratah` diagnostic. The code refers to fields by their named range name (`WEDNESDAY_SR_NetRevenue`), not by row or column number.

**This means:**

- If you **insert** a row on a day tab, all named ranges below it shift down. The shift report code does not know this happened; it reads from the named range, which has moved. Output values get scrambled.
- If you **delete** a row, the same thing happens in reverse, and you may delete a cell that is the target of a named range, causing `#REF!` errors.

**Manager rule:** never insert or delete rows on a day tab (Wednesday, Thursday, Friday, Saturday, Sunday). The same applies to columns. The sheet layout is fixed.

If you accidentally inserted or deleted a row:

1. **Press Cmd+Z (Mac) or Ctrl+Z (Windows) immediately** to undo.
2. If the undo window has passed (you closed the browser tab), tell Evan. The setup script can rebuild named range bindings, but it is not a one-click fix.

The Read Me, Task Management, and Analytics tabs do not use named ranges. You can edit those freely.

---

## 8. Escalating a Problem

If none of the above sections resolves your problem, escalate to Evan. When you escalate, send:

1. **What you observed.** "The Slack message did not appear for last night's report." Specific date, channel, recipient.
2. **What you tried.** "I refreshed the spreadsheet, ran Export & Email PDF (LIVE) again. Slack still empty."
3. **A screenshot if visible.** A broken cell, an error dialog, a missing menu item.
4. **The time you noticed.** This helps narrow down which trigger or send is implicated.

Evan can usually triage in under five minutes if the above three items are present.

For after-hours emergencies (a Friday or Saturday service-night failure), call rather than message. Anything that prevents end-of-service reporting is urgent.

---

## 9. Most Common Problems, Quick Table

| Symptom | First check | Likely fix | Manager can do it? |
|---|---|---|---|
| Slack message missing | Is Slack itself working? | Re-run Export & Email PDF (LIVE) | Yes |
| Email missing | Check spam folder | Whitelist sender, or fix recipient list (admin) | Partly |
| Menu missing | Refresh, reopen | Run `onOpen()` from Apps Script editor | Mostly |
| Rollover didn't run | Slack confirmation absent? | Run rollover manually (admin password) | No (escalate) |
| Tasks not in Task Management | Check Task Management spreadsheet | Re-run send (skips warehouse, syncs tasks) | Yes |
| Cell showing `#REF!` | Did you insert or delete a row? | Cmd+Z immediately | Yes (if quick) |
| Dropdown missing | Open the Task Management spreadsheet; run **Task Management > Admin Tools > Cleanup > Reapply Dropdowns & Formatting** | Menu action (admin password required) | Partly (needs admin password) |
| Numbers in cells look wrong | Check formula vs manager-input cell | Re-enter the manager input | Yes |
| Wrong recipient list | Tell Evan | Edit `WARATAH_EMAIL_RECIPIENTS` (admin) | No |
| Webhook expired | Test report fails to post | Regenerate webhook in Slack, give to Evan | Partly |
