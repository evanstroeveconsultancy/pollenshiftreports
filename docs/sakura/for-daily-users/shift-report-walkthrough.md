# Your Daily Shift Report: A Complete Walkthrough

**Audience:** Floor staff and MODs (Managers on Duty) who fill in the shift report at the end of service.

**Time required:** About 20 minutes once you know the system

This guide walks you through every step of completing and sending the shift report at Sakura House, from the cash count to clicking Confirm & Send. You do not need to know how the system works underneath. You just need to know what to type where, and when to click which button.

If you want to understand what happens after you click Confirm & Send (the Slack post, the email, the data warehouse), there is a brief overview in Section 4, and a manager-level explanation in [`for-managers/01-shift-reports.md`](../for-managers/01-shift-reports.md).

---

## 1. What You Are Filling In

The Sakura House shift report is one Google Sheet with one tab per service day, Monday through Saturday. Sakura is closed on Sunday, so there is no Sunday tab.

Before you start filling in fields, scan the day's tab. You will see four kinds of content:

| Kind | What it looks like | Do you touch it? |
|---|---|---|
| Manager input cells | Empty light cells with a light border | **Yes**, this is where your numbers go |
| Auto-calculated cells | Cells that show a formula in the formula bar (anything starting with `=`) | **No**, you cannot edit these |
| Narrative text fields | Five large fields lower down on the sheet | **Yes**, type your notes here |
| Header and label cells | Bold text, coloured backgrounds | **No**, these are layout only, and are protected |

Sheet protection means staff can only change specific input cells. Formulas, ranges, titles, and headers are all locked.

### Checklist before you send

You must have filled in:

1. The date and your name as MOD
2. FOH staff and BOH staff for the shift
3. Cash count breakdown and cash record totals
4. Production amount and any function deposits
5. Card tips, cash tips, and surcharge tips
6. The five narrative fields (Shift Summary, Guests of Note, Good Notes, Issues, Kitchen Notes)

You should have filled in (where applicable):

7. Any tasks (TO-DOs) with assignees
8. Any wastage, maintenance items, or RSA incidents from tonight

If the calculated Net Revenue looks wrong (negative, or far from expected), **stop and check your input cells before sending**. Net Revenue is a formula. It is wrong only if one of your typed numbers is wrong.

---

## 2. Step-by-Step Walkthrough

### 2.1 Check the date and enter your name

Look at the tab name at the bottom of the spreadsheet and confirm it matches today's date. The tabs cycle automatically each Monday morning, so if today is Wednesday, the active tab should read something like `WEDNESDAY 21/05/2026` (the day name in capitals followed by the date), and the date cell at the top of the sheet should match today's date.

Select your name in the MOD (Manager on Duty) field, and the FOH and BOH staff who worked the shift in their respective fields underneath.

### 2.2 Enter the cash count and cash record

Sakura's cash section has two blocks: the **Cash Count** breakdown (denominations) and the **Cash Record** totals.

For the **Cash Count** block, enter each denomination from your till count. The total fills in automatically.

For the **Cash Record** block, the system shows the cash you should have based on the day's takings, and compares against your count. Any variance is calculated.

If the variance looks unusually large, stop and recount before continuing. Variance over a sensible threshold almost always means a counting error or a refloat figure typed wrong. The system does not block the send; managers will see the variance in the Slack post and follow up.

If a petty cash transaction happened during the shift, record it in the Petty Cash section below the cash record. Each line is a single transaction.

### 2.3 Enter the financial figures

Below the cash section is the financial summary. You enter values only in the manager-input cells.

You will need to enter:

- **Production Amount**, from the Lightspeed till
- **Deposit**, any revenue paid outside the Lightspeed till (function deposits, etc.)
- **Discounts**, total discounts from Lightspeed
- **Cash Tips** (cell C29)
- **Card Tips** (cell C30)
- **Surcharge Tips** (cell C31)

Cells that calculate automatically:

- **Net Revenue** (formula; never typed)
- Total tips and any rolled-up totals
- Cash variance

If a number you typed looks wrong on the formula side, check the input cells above. Most "wrong" calculations come from a single typo in an input cell.

### 2.4 Write your shift notes

Below the financial section are five large narrative fields. Each is one paragraph in length, with the field name on its own row above.

| Field | What goes here |
|---|---|
| Shift Summary | General overview: vibe, atmosphere, anything notable |
| Guests of Note | High profile guests, returning regulars, anniversaries, special bookings |
| Good Notes | Positive feedback, compliments, things that went well |
| Issues | What went wrong, even small things (problems, complaints, slow tickets) |
| Kitchen Notes | Notes from or about the kitchen: issues, comps, staffing |

These narratives are read by the management team the next morning. Be specific. "Table 7 complained about steak temperature, remade and comped" is useful. "Some complaints" is not.

If a field genuinely has nothing to report, write "Nothing notable" or "NTR" rather than leaving it blank. Blank fields trigger a system warning on send.

### 2.5 Add tasks (TO-DOs)

There is a tasks section with sixteen rows. Each row has a task description column and an assignee column.

| Task description | Assignee |
|---|---|
| Increase linen order | Adam |
| Contact builders about plumbing issue in toilets | Cynthia |

Rules for tasks:

- Be specific. "Fix the leaky tap in the men's bathroom" beats "Fix plumbing".
- Assign every task you create. If unsure who owns it, assign to the General Management group and explain in the description.
- Tasks roll into the Sakura Actionables Sheet automatically when you send the report. You do not need to copy them anywhere.
- Tasks without an assignee will warn in the pre-send check; the system still sends, but unassigned tasks need someone to claim them later.

### 2.6 Record wastage, maintenance, and RSA incidents

Below the tasks section are three narrative fields for incidents that need a record beyond a simple task:

| Field | Use for | Example |
|---|---|---|
| Wastage / Comps | Stock thrown out, returns, or discounts/comps with a dollar value | "Steak overcooked, comped, approx $45" |
| Maintenance | Equipment failures or facility issues | "Glass washer leaking, needs service" |
| RSA Incidents | Any responsible service of alcohol incident, no matter how small | "Refused service to intoxicated guest at 9.45pm, no further issue" |

Wastage and comp entries should always include the rough dollar value if known. RSA incidents must always be recorded even if nothing came of them. The legal record matters more than the size of the incident.

If you have nothing to record, type "None" rather than leaving the field blank.

### 2.7 Send the report

Go to the menu bar at the top of the spreadsheet and click **Shift Report → Send Nightly Report**.

What happens:

1. A confirmation dialog appears asking "You are about to export a shift report. Continue?" Click **Yes**.
2. A second checklist dialog appears titled **Pre-Send Checklist** with two checkboxes:
   - "Deputy Timesheets Approved"
   - "Fruit Order Done"
3. Tick both boxes. The **Confirm & Send** button is disabled until both are checked.
4. Click **Confirm & Send**. The button changes to "Sending…" while the report processes.
5. A green tick and "✓ Sent successfully" message appears.
6. The dialog auto-closes after about two seconds.

Total time from click to confirmation: about thirty seconds.

Neither Send Nightly Report nor Send Test Report require a password. Only the admin tools below the menu separator are password-gated.

---

## 3. TEST Mode, Optional Practice Run

You can run the system in TEST mode to practise sending the report without anything going to the production recipients. This is useful for training new managers and for confirming the report is filled in correctly before a real send.

In TEST mode:

- A Slack message is posted to a **test channel only**, not to the manager channels
- A single PDF email is sent to **your own Google account**, not to the management distribution list
- **No data is written to the warehouse**
- **No tasks are pushed to the Sakura Actionables Sheet**
- No AI insights are routed to the team

To send a test, go to **Shift Report → Send Test Report**. The same checklist dialog appears. After you confirm, the system processes the report exactly as it would in live mode but redirects all outputs as above.

You can run TEST mode as many times as you like. It does not consume any quotas or write any permanent records.

---

## 4. What Happens After You Click Confirm & Send

This is for your information only, you do not need to do anything for this section. It is here so you know the report is in motion.

When you click Confirm & Send on a LIVE report, four things happen in sequence over about ten seconds:

1. The system reads every field on the day's tab and runs validation.
2. Financial, operational, wastage, and qualitative data is written to the central data warehouse.
3. A formatted Block Kit message is posted to the venue's Slack manager channel.
4. A PDF copy of the report is generated and emailed to the management team. Any TO-DOs you added are pushed to the Sakura Actionables Sheet, and assigned staff receive Slack DM notifications.

If Slack is down or the email service is slow, the system does not crash. It records what failed and the other steps still complete. The warehouse write is the most important step; if that succeeds, the report is considered safely captured even if Slack or email did not arrive.

If a system failure does occur, there is a backfill procedure your manager can run to push tonight's data into the warehouse the next morning. You do not need to do this yourself; just flag to Adam that the send did not work.

---

## 5. What Gets Posted to Slack

The Slack message your management team receives is built from your report. It includes:

**Always shown:**

- Date, day of the week, and MOD name
- FOH and BOH staff on shift
- Net Revenue, Production Amount, Total Discounts
- Tips breakdown (cash, card, surcharge)
- The Shift Summary narrative

**Conditional (only when present):**

- Guests of Note
- Good Notes
- Issues
- Kitchen Notes

**Task section (if you added any):**

- A summary of tonight's TO-DOs and assignees

**Incident section (if you added any):**

- Wastage, maintenance, or RSA items

**Action buttons:**

- A button to view the full PDF report
- A button to open the live spreadsheet

The message is posted as one structured Slack block, not a wall of text. If you want to see what your shift report will look like, send a TEST report first.

---

## 6. AI Insights

Sakura's shift report system includes an AI-generated shift summary section powered by the Claude API. After you click Confirm & Send, the system analyses your shift data and produces:

- A brief narrative of how the shift performed
- A comparison against recent averages and trends
- Recommended actions if anomalies are detected

The AI section appears in the Slack post and the PDF email automatically. You do not need to do anything to trigger it.

If revenue is unusually high or low compared to the past four weeks, the system flags the shift as an anomaly and posts an alert to the management Slack channel. This does **not** block your report from sending; the data is still recorded as-is. The alert exists so management can review and either confirm the unusual shift happened, or check your entries for typos.

Delivery of AI insights is controlled by an admin setting (`AI_INSIGHTS_MODE` in Script Properties). During soft-launch periods this setting routes the upgraded analysis only to Evan; once promoted, it goes to the full management team. This is not a setting you adjust as a daily user.

---

## 7. Who Receives the Report

The shift report email goes to a list of managers maintained in the `SAKURA_EMAIL_RECIPIENTS` Script Property, and Slack DMs are routed via webhooks recorded in `SLACK_DM_WEBHOOKS`. The lists change as the team changes, so this guide does not enumerate them.

For the current canonical list and the procedure for updating it, see [`for-admins/02-staff-and-access-management.md`](../for-admins/02-staff-and-access-management.md).

The Slack message goes to the venue's manager-channel webhook. Personal DMs are handled separately by the Task Management system (for task assignments and BLOCKED-task escalations), not by the nightly shift report itself.

If the recipient list needs to change (someone leaves, new manager joins), that is an admin change made via the Script Properties. As a floor staff member you do not need to do this yourself.

---

## 8. Common Mistakes and Quick Fixes

| Mistake | What happens | Quick fix |
|---|---|---|
| Sent from the wrong tab (Instructions, TO-DOs, Read Me) | Send is blocked with an error message | Click on the correct day tab and retry |
| Sent TEST when you meant LIVE | TEST report goes to your email only, no group send | Click **Shift Report → Send Nightly Report** and retry |
| Cash variance looks unusually large | Slack message shows the variance, a manager will ask | Recount, then add a note in Shift Summary explaining the actual discrepancy |
| Left MOD field blank | Pre-send dialog blocks the send | Type your name in the MOD cell and retry |
| Pre-send checklist dialog never appears | Your browser is blocking popups | Allow popups for Google Sheets in your browser settings, then retry |
| Slack message did not appear | Slack outage, popup blocker, or expired webhook | Check the Sakura Slack first. If others' messages appear, the issue is in the script; contact Adam |
| Email did not arrive | Spam folder, or recipient filter | Search "Sakura shift report" in your spam folder; if not there, contact Adam |
| Confirm & Send button stays disabled | One of the two checklist boxes is not ticked | Tick both checklist items, the button becomes active |
| "Named range not found" error | Part of the spreadsheet system was edited or deleted | Contact Adam; admin can rebuild named ranges from the menu |

If your specific problem is not in this table, see the manager troubleshooting guide at [`for-managers/05-troubleshooting.md`](../for-managers/05-troubleshooting.md), or contact Adam directly.

---

## 9. What Happens on Monday Morning

Every Monday at around 10am Sydney time, the system runs the **weekly rollover**. You do not need to do anything for this. It happens automatically.

What the rollover does:

1. Generates a PDF of the full week (Monday through Saturday) and archives it to a Google Drive folder.
2. Saves a copy of the complete spreadsheet to the same archive folder for permanent record.
3. Renames each day tab to reflect the new week's dates.
4. Clears the manager input cells (except the formula cell for Net Revenue) so the sheet is ready for the new week's Monday service.

If the rollover fails partway, the system emails an alert to Evan with the error.

If you log in on Monday afternoon for service and the tabs still show last week's dates, or old data appears in the input cells, do not delete anything yourself. Contact Adam. The rollover did not run cleanly and somebody needs to investigate before fresh data is entered.

You can also kick off Monday's shift before 10am if needed. The rollover is designed to run before service starts, but the system tolerates a late rollover if there is no production data yet in the new week.

---

## 10. Quick Reference Card

Print this section and stick it inside the cash drawer for first weeks.

**Before service ends:**

- Confirm today's tab is active
- Type your name in MOD; add FOH and BOH staff

**Cash:**

- Enter the Cash Count denominations
- Enter the Cash Record totals
- Record any petty cash transactions

**Financial:**

- Enter Production Amount, Deposit, Discounts
- Enter Cash Tips, Card Tips, Surcharge Tips
- Do not touch any cell with `=` in it (especially Net Revenue)

**Narrative (five fields):**

- Shift Summary, Guests of Note, Good Notes, Issues, Kitchen Notes
- Type "Nothing notable" if a field is empty

**Tasks and incidents:**

- Add tasks with assignees
- Record wastage, maintenance, RSA incidents

**Send:**

- Shift Report → Send Nightly Report
- Click Yes on the confirmation
- Tick both checklist boxes
- Click Confirm & Send
- Wait for green "✓ Sent successfully" message (about 30 seconds)

**If something fails:**

- Wait two minutes, try once more
- If still failing, contact Adam

---

## 11. Where to Go Next

If you are responsible for more than just sending tonight's report, the following guides will help:

- [`for-managers/01-shift-reports.md`](../for-managers/01-shift-reports.md): managing the daily report process, watching the numbers, follow-ups
- [`for-managers/02-task-management.md`](../for-managers/02-task-management.md): the Task Management spreadsheet, the nine-status workflow
- [`for-managers/03-weekly-automation.md`](../for-managers/03-weekly-automation.md): the weekly rollover, the digest, dashboards
- [`for-managers/05-troubleshooting.md`](../for-managers/05-troubleshooting.md): things that go wrong and how to fix them yourself

For the canonical reference of all current settings (Script Properties, recipient lists, webhooks):

- [`for-admins/01-configuration-reference.md`](../for-admins/01-configuration-reference.md)

For the technical internals (named ranges, cell maps, code structure):

- [`for-developers/02-cell-reference-and-field-config.md`](../for-developers/02-cell-reference-and-field-config.md)
- [`for-developers/01-architecture-and-data-flow.md`](../for-developers/01-architecture-and-data-flow.md)
