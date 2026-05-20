# Your Daily Shift Report: A Complete Walkthrough

**Audience:** Floor staff and MODs (Managers on Duty) who fill in the shift report at the end of service.

**Time required:** About 20 minutes once you know the system

This guide walks you through every step of completing and sending the shift report at The Waratah, from the cash count to clicking Confirm & Send. You do not need to know how the system works underneath. You just need to know what to type where, and when to click which button.

If you want to understand what happens after you click Confirm & Send (the Slack post, the email, the data warehouse), there is a brief overview in Section 5, and a manager-level explanation in [`for-managers/01-shift-reports.md`](../for-managers/01-shift-reports.md).

---

## 1. What You Are Filling In

The Waratah shift report is one Google Sheet with one tab per service day, Wednesday through Sunday.

Before you start filling in fields, scan the day's tab. You will see four kinds of content:

| Kind | What it looks like | Do you touch it? |
|---|---|---|
| Manager input cells | Empty light green cells with a light border | **Yes**, this is where your numbers go |
| Auto-calculated cells | Cells that show a formula in the formula bar (anything starting with `=`) | **No**, you cannot edit these |
| Narrative text fields | Five large fields lower down on the sheet | **Yes**, type your notes here |
| Header and label cells | Bold text, coloured backgrounds | **No**, these are layout only, and cannot be changed |

**Quick note for cells:** staff can only change specific cells. Formulas, ranges, titles, headers are all protected.

### Checklist before you send

You must have filled in:

1. The date and your name
2. Cash till counts and refloats (both tills), POS CD reads/returns
3. Return Card expense breakdown
4. Production amount and function deposits
5. Card tips and cash tips
6. The five narrative fields (Shift Report, VIPs, Good, Bad, Kitchen)

You should have filled in (where applicable):

7. Any tasks (TO-DOs)
8. Any comps, maintenance, or RSA incidents from tonight

If the cash variance shown by the sheet is more than fifty dollars in either direction, **stop and recount before sending**. A variance of plus or minus fifty almost always means a count mistake, not necessarily a real shortfall. This is an operational rule the venue follows; the system itself does not block the send.

---

## 2. Step-by-Step Walkthrough

### 2.1 Check the date and enter your name

Look at the tab name at the bottom of the spreadsheet and confirm it matches today's date. The tabs cycle automatically each Monday evening, so if today is Wednesday, the active tab should read something like `WEDNESDAY 21/05/2026` (the day name in capitals followed by the date), and the date in cells B3:F3 should match today's date.

Select your name in the MOD (Manager on Duty) cell, and any other staff who worked the shift in the Staff cell underneath.

### 2.2 Count and reconcile the cash tills

The Waratah operates two tills, Public and Terrace. Both need a full count at the end of service.

For each till, you enter:

- **Closing count**: every denomination and the total
- **Refloat**: the cash you left in the till to start tomorrow's service. House policy is $350; the system does not enforce this.
- **Cash variance**: this is auto-calculated, you do not type it

The system computes:

- **Cash Counted**: the total cash you counted across both tills
- **Cash Take**: the cash you should have, based on POS expected cash.
- **Cash Variance**: the difference between the two

**The fifty-dollar rule.** If Cash Variance shows anything more than plus or minus fifty dollars, stop and recount. Variance over fifty almost always means a counting error or a refloat figure typed wrong.

If the recount comes out the same, send the report anyway. The variance figure will be visible to managers in the Slack post and they can follow up.

### 2.3 Enter the financial figures

Below the cash section, there is a financial summary. You enter values in the light green cells

You will need to enter:

- **Refunds & Card Expenses**: six separate line items
- **Production Amount**: from the POS Takings
- **Function Deposit**: any deposits paid by function clients in advance, see Cynthia
- **Cash Returns and CD (Credit Discount)**: our recorded cash takings, leave blank if zero (actually entered above)
- **Total Tips Card**: the card tips total from POS
- **Total Tips Cash**: the cash tips total
- **Total Tips Surcharge**: the surcharge tips total

Cells that calculate automatically:

- Net Revenue
- Total Tips (sums card plus cash)
- Total Adjustments
- Gross Sales, Total Discounts, Net Taxable Sales
- Anything else

If a number you typed looks wrong on the formula side (for example, Net Revenue is negative), check the input cells above it. Most "wrong" auto-calculations are caused by a typo in one of the manager input cells

### 2.4 Write your shift notes

Below the financial section are five large narrative fields. Each is one paragraph in length, with the field name on its own row above.

| Field | What goes here |
|---|---|
| Shift Report | A general summary of the shift: vibe, atmosphere, anything notable |
| VIPs | Any high profile guests, returning regulars, or special bookings |
| Payroll | changes to start/finish times, sick leave, trial/rockstar notes |
| Bad | What went wrong, even small things (problems, complaints, slow tickets) |
| Kitchen | Notes from or about the kitchen: issues, comps, staffing |

These narratives are read by the management team the next morning. Be specific. "Table 7 complained about steak temperature, remade and comped" is useful. "Some complaints" is not.

If a field genuinely has nothing to report, write "Nothing notable" or "NTR" rather than leaving it blank. Blank fields trigger a system warning in some checks.

### 2.5 Add tasks (TO-DOs)

There is a tasks section with sixteen rows. Each row has a task description column and an assignee column.

| Task description | Assignee |
|---|---|
| Increase linen order | Adam |
| Contact builders about plumbing issues in Public bar | Cynthia |

Rules for tasks:

- Be specific. "Fix the leaky tap in the men's bathroom" beats "Fix plumbing".
- Assign every task you create. If unsure who owns it, assign to Adam and explain in the description.
- Tasks roll into the Task Management spreadsheet automatically when you send the report. You do not need to copy them anywhere.
- Skipping the assignee column is allowed but discouraged; unassigned tasks need someone to claim them later.

### 2.6 Record wastage, maintenance, and RSA incidents

Below the tasks section are three narrative fields for incidents that need a record beyond a simple task:

| Field | Use for | Example |
|---|---|---|
| Wastage/Co,ps | Stock you threw out, returns, or discounts/comps with a dollar value | "Steak overcooked, comped, approx $45" |
| Maintenance | Equipment failures or facility issues | "Glass wash machine leaking, needs service" |
| RSA Incidents | Any responsible service of alcohol incident, no matter how small | "Refused service to intoxicated guest at 9.45pm, no further issue" |

Wastage and comp entries should always include the rough dollar value if known. RSA incidents must always be recorded even if nothing came of them. The legal record matters more than the size of the incident.

If you have nothing to record, type "None" rather than leaving the field blank.

### 2.7 Send the report

Go to the menu bar at the top of the spreadsheet and click **Waratah Tools → Daily Reports → Export & Email PDF (LIVE)**.

What happens:

1. A confirmation dialog asks: "Send shift report for [today's date]?" Click **Yes**.
2. A second checklist dialog appears asking you to tick that you have:
   - Approved Deputy timesheets
   - Done the fruit order
3. Tick both boxes and click **Confirm & Send**.
4. A green confirmation message appears for about ten to fifteen seconds while the system processes.
5. The dialog auto-closes when complete.

Total time from click to confirmation: about thirty seconds.

---

## 3. TEST Mode, Optional Practice Run

You can run the system in TEST mode to practise sending the report without anything going to the production recipients. This is useful for training new managers and for confirming the report is filled in correctly before a real send.

In TEST mode:

- A Slack message is posted to a **test channel only**, not to the manager channels
- A single PDF email is sent to the configured test recipient (Adam by default); the management distribution list does not receive anything
- **No data is written to the warehouse**
- **No tasks are pushed to the Task Management spreadsheet**

To send a test, go to **Waratah Tools → Daily Reports → Export & Email (TEST to me)**. The same checklist dialog appears. After you confirm, the system processes the report exactly as it would in live mode but redirects all outputs as above.

You can run TEST mode as many times as you like. It does not consume any quotas or write any permanent records.

---

## 4. What Happens After You Click Confirm & Send

This is for your information only, you do not need to do anything for this section. It is here so you know the report is in motion.

When you click Confirm & Send, four things happen in sequence over about ten seconds:

1. The system reads every field on the day's tab and builds a structured report.
2. A formatted message is posted to the venue's Slack manager channel.
3. A PDF copy of the report is generated and emailed to the management team.
4. The numbers are written to the central data warehouse for weekly analytics.

If Slack is down or the email service is slow, the system does not crash. It records what failed and the other steps still complete. The data warehouse write is the most important step; if that succeeds, the report is considered safely captured even if Slack or email did not arrive.

If a system failure does occur, there is a backfill procedure your manager can run to push tonight's data into the warehouse the next morning. You do not need to do this yourself; just flag to Adam that the send did not work.

---

## 5. What Gets Posted to Slack

The Slack message your management team receives is built from your report. It includes:

**Always shown:**

- Date, day of the week, and MOD name
- Staff who worked the shift
- Net Revenue, Production, Cash Take, Cash Variance
- Total Tips (split into card and cash)
- The Shift Report narrative

**Conditional (only when present):**

- VIPs notes
- Payroll/Issues
- Kitchen notes
- Wastage and Maintenance items
- RSA incidents

**Task section (if you added any):**

- A summary of tonight's tasks and assignees

**Action buttons:**

- A `View PDF` button that opens the full PDF report
- An `Open Shift Report` button that opens the live spreadsheet

The message is posted as one structured Slack block, not a wall of text. If you want to see what your shift report will look like, send a TEST report first.

---

## 6. Who Receives the Report

The shift report email goes to a list of managers maintained in the `WARATAH_EMAIL_RECIPIENTS` Script Property, and Slack DMs go to staff whose webhook is recorded in `SLACK_DM_WEBHOOKS`. The lists change as the team changes, so this guide does not enumerate them.

For the current canonical list and the procedure for updating it, see [`for-admins/02-staff-and-access-management.md`](../for-admins/02-staff-and-access-management.md).

The Slack message goes to the venue's single manager-channel webhook. Personal DMs are handled separately by the Task Management system, not the nightly shift report.

If the recipient list needs to change (someone leaves, new manager joins), that is an admin change made by Evan via the Script Properties. As a floor staff member you do not need to do this yourself.

---

## 7. Common Mistakes and Quick Fixes

| Mistake | What happens | Quick fix |
|---|---|---|
| Sent from the wrong tab (Read Me, Task Management, Analytics) | Send menu greyed out, or error message | Click on the correct day tab and retry |
| Sent TEST when you meant LIVE | TEST report goes to test channel only, no group email | Click **Waratah Tools → Daily Reports → Export & Email PDF (LIVE)** and retry |
| Cash Variance over $50 not investigated | Slack message shows the variance, a manager will ask | Recount, then add a note in Shift Report explaining the actual discrepancy |
| Left MOD field blank | System warning before send, or unattributed report | Type your name in the MOD cell and retry |
| Slack message did not appear | Slack outage, popup blocker, or expired webhook | Check the venue's Slack first. If others' messages are appearing, the issue is in the script; contact Adam |
| Email did not arrive | Spam folder, or recipient filter | Search "Waratah shift report" in your spam folder; if not there, contact Adam |
| Send dialog froze or never completed | Network issue or script timeout | Wait two minutes, refresh the spreadsheet, try once more. If still failing, contact Adam |

If your specific problem is not in this table, see the manager troubleshooting guide at [`for-managers/05-troubleshooting.md`](../for-managers/05-troubleshooting.md), or contact Adam directly.

---

## 8. What Happens on Monday Evening

Every Monday at around 9pm, the system runs the **weekly rollover**. You do not need to do anything for this. It happens automatically.

What the rollover does:

1. Generates a PDF of the full week (Wednesday through Sunday) and archives it to a Google Drive folder.
2. Saves a copy of the complete spreadsheet to the same archive folder for permanent record.
3. Renames each day tab to reflect the next week's dates.
4. Clears the manager input cells so the sheet is ready for the new week's Wednesday service.

If the rollover fails partway, the system posts a Slack notification with the error. If everything succeeds, no Slack message is sent (you simply find the tabs ready for the new week on Tuesday morning).

If you log in on Tuesday morning and the tabs show last week's dates instead of this week's, the rollover did not run. This is rare but it happens occasionally if the script trigger fails. Contact Adam; the rollover can be run manually from the menu.

If you start your Wednesday shift and find old data still in the input cells (numbers from last week), do not delete them yourself. Contact Adam. The rollover did not run cleanly and somebody needs to investigate before fresh data is entered.

---

## 9. Quick Reference Card

Print this section and stick it inside the cash drawer for first weeks.

**Before service ends:**

- Confirm today's tab is active
- Type your name in MOD

**Cash:**

- Count both tills (Public and Terrace)
- Enter closing count and refloat for each
- If variance over ±$50, **recount before continuing**

**Financial:**

- Enter Card Expenses, Production, Function deposits, Tips
- Do not touch any cell with `=` in it

**Narrative (five fields):**

- Shift Report, VIPs, etc
- Type "Nothing notable" if a field is empty

**Tasks and incidents:**

- Add tasks with assignees
- Record wastage, maintenance, RSA incidents

**Send:**

- Waratah Tools → Daily Reports → Export & Email PDF (LIVE)
- Click Yes on the confirmation
- Tick both checklist boxes
- Click Confirm & Send
- Wait for green confirmation (about 30 seconds)

**If something fails:**

- Wait two minutes, try once more
- If still failing, contact Ad

---

## 10. Where to Go Next

If you are responsible for more than just sending tonight's report, the following guides will help:

- [`for-managers/01-shift-reports.md`](../for-managers/01-shift-reports.md): managing the daily report process, watching the numbers, follow-ups
- [`for-managers/02-task-management.md`](../for-managers/02-task-management.md): the Task Management spreadsheet, the 9-status workflow
- [`for-managers/03-weekly-automation.md`](../for-managers/03-weekly-automation.md): the weekly rollover, the digest, dashboards
- [`for-managers/05-troubleshooting.md`](../for-managers/05-troubleshooting.md): things that go wrong and how to fix them yourself

For the canonical reference of all current settings (Script Properties, recipient lists, webhooks):

- [`for-admins/01-configuration-reference.md`](../for-admins/01-configuration-reference.md)

For the technical internals (named ranges, cell maps, code structure)