**Last updated:** May 17, 2026 (Phase 1.1 refinements)
**Audience:** All venue managers — no technical knowledge required
**When to read:** Your first shift as MOD, or anytime you need a refresher

# Your Daily Shift Report: A Complete Walkthrough

This guide walks you through your shift report from start to finish. After following it, tonight's financial data, notes, and tasks will be saved, emailed to the management team, and posted to Slack.

**The shift report takes about 10 minutes to complete at end of service.**

---

## What You're Working With

> The Waratah shift report lives in a Google Spreadsheet. The system uses seven tabs, one for each day of the week, but only five of them are active (Wed–Sun). Monday and Tuesday tabs exist but aren't used because the venue is closed those days.

When you open it, you'll see tabs across the bottom:

| Tab | Day | Status |
|-----|-----|--------|
| MONDAY 18/05/2026 | Unused (closed) | Empty |
| TUESDAY 19/05/2026 | Unused (closed) | Empty |
| WEDNESDAY 20/05/2026 | First active day of week | Fill this |
| THURSDAY 21/05/2026 | | Fill this |
| FRIDAY 22/05/2026 | | Fill this |
| SATURDAY 23/05/2026 | | Fill this |
| SUNDAY 24/05/2026 | Last active day of week | Fill this |

There's also a **TO-DOs** tab that collects tasks from all five active days in one place.

**Click on tonight's tab** to get started. The dates on each tab update automatically every Monday night.

---

## Step 1: Check the Date and Enter Your Name

At the top of the sheet:

- **Date** — Already filled in. Confirm it shows tonight's date. If it doesn't, tell Evan.
- **MOD** — Type your name. This is the Manager on Duty field — it records who ran tonight's service.
- **Staff** — List who was on shift tonight.

---

## Step 2: Count and Reconcile the Cash Tills

> Before you fill in financial figures, you need to count the physical cash from the two tills (Public and Terrace) and record the counts and refloats. This is the cash reconciliation process — it's now part of the shift report instead of being done separately.

At the top of the financial section, you'll find **four till columns**:

| Column | What to Enter | Why |
|--------|---------------|-----|
| **Public Till Count** | Cash you counted from the public till | Must match what the till says |
| **Public Till Refloat** | New cash put back in the till to refloat it | To start tomorrow with cash on hand |
| **Terrace Till Count** | Cash you counted from the terrace till | Must match what the terrace till says |
| **Terrace Till Refloat** | New cash put back in the terrace till | To start tomorrow with cash on hand |

**Below these four columns, the system calculates three numbers for you:**

| Field | What It Shows | What It Means |
|-------|---------------|---------------|
| **Cash Counted** | Sum of both tills | Total physical cash you counted tonight |
| **Cash Take** | Counted cash minus refloats | Actual money leaving the venue |
| **Cash Variance** | Your take minus what POS expected | Did the till balance? (should be ~$0) |

**If cash variance is large (more than ±$50):** Stop. Recount the tills. There's a discrepancy between what came through the POS and what's physically in the tills.

---

## Step 3: Enter the Financial Figures

Work your way down the left column. Here's what to fill in:

| Field | What to Enter |
|-------|---------------|
| **Production amount** | Tonight's production figure |
| **Deposit** | Cash deposited |
| **Airbnb covers** | Airbnb guest count (if any) |
| **Cancellations** | Number of cancellations |
| **Card tips** | Total card tips |
| **Cash tips** | Total cash tips |
| **Net revenue** | Tonight's net revenue |
| **Covers** | Total guest count |

**The financial breakdown section** (gross sales, cash returns, discounts, refunds, etc.) — enter the values from your POS end-of-day report. Work down from gross sales to net sales.

### Fields You Must NOT Edit

Some cells contain formulas that calculate automatically. If you accidentally delete one, the system breaks and it has to be fixed manually.

**Do not type in these cells:**

| Cell | What It Calculates |
|------|--------------------|
| **Cash takings** | Calculated from your entries above |
| **Total tips** | Sum of card tips + cash tips |
| **Labour hours** | Pulled from staffing data |
| **Labour cost** | Calculated from hours |
| **Gross taxable sales** | Calculated |
| **Taxes** | Calculated |
| **Net sales with tips** | Calculated |
| **Discounts/comps exc CD** | Calculated |
| **Total discount** | Calculated |

**How to tell if a cell is a formula:** Click on it and look at the formula bar at the top. If it starts with `=`, it's a formula — don't touch it.

---

## Step 4: Write Your Shift Notes

Below the financial section, you'll find five narrative fields. These are where you write what happened tonight. Be concise but specific — these go straight to the management team.

| Field | What to Write |
|-------|---------------|
| **Shift summary** | Overview of the night. Covers, vibe, any major events. 2-3 sentences. |
| **VIP / Guests of note** | Any notable guests, regulars, VIPs, or special occasions. |
| **The Good** | What went well tonight. Staff wins, smooth service, positive feedback. |
| **The Bad / Issues** | Problems, complaints, equipment issues, anything that needs attention. |
| **Kitchen notes** | Food quality, prep issues, 86'd items, kitchen communication. |

**Tip:** Write as if a manager who wasn't there tonight needs to understand what happened. Don't assume they'll ask follow-up questions.

---

## Step 5: Add Tasks (TO-DOs)

Below the notes, there's a tasks section with 9 rows. For each task that came up during service:

| Column | What to Enter |
|--------|---------------|
| **Task description** | What needs to be done. Be specific enough that someone else could do it. |
| **Assigned to** | Who is responsible. Use a name, not "someone". |

Leave unused rows empty. These tasks automatically get collected into the TO-DOs summary tab and pushed to the Master Actionables list.

---

## Step 6: Record Wastage and RSA Incidents

At the bottom of the sheet:

- **Wastage/comps** — Record any wastage, comps, or write-offs from tonight. Include the item, reason, and approximate value.
- **RSA incidents** — Record any Responsible Service of Alcohol incidents. This is a legal requirement.

If nothing to report, leave these blank.

---

## Step 7: Send the Report

This is the most important step. When you've finished filling everything in:

1. **Click the "Waratah Tools" menu** at the top of the spreadsheet (next to Help)
2. **Select "Daily Reports"**
3. **Select "Export & Email PDF (LIVE)"**
4. A confirmation box appears showing tonight's sheet name — **click Yes**
5. A checklist dialog appears with two items:
   - **Deputy Timesheets Approved** — tick this to confirm you've approved tonight's timesheets in Deputy
   - **Fruit Order Done** — tick this to confirm the fruit order has been placed
6. Both boxes must be ticked before the **"Confirm & Send"** button activates
7. **Click "Confirm & Send"**
8. Wait for the green success message — it takes about 10-15 seconds
9. The dialog closes automatically

### What Just Happened

When you clicked Confirm & Send, the system did all of this in one go:

- Generated a PDF of tonight's shift report
- Emailed that PDF to 9 recipients (management team and key stakeholders)
- Posted a formatted summary to the Waratah Slack channel (including **💰 Cash Variance: $X.XX** so managers can see if the till balanced)
- Saved tonight's financial data to the data warehouse (for analytics)
- Copied your tasks to the Master Actionables list
- Updated the TO-DOs summary tab

**You don't need to do anything else.** The report is sent and saved.

---

## Step 8: TEST Mode (Optional)

If you want to preview the report before sending it to everyone:

1. **Waratah Tools > Daily Reports > Export & Email (TEST to me)**
2. This sends the report ONLY to Evan's email and uses the test Slack channel
3. No tasks are pushed to Master Actionables
4. Use this to check everything looks right before doing the real send

---

## What Happens on Monday Evening (The Weekly Rollover)

Every Monday at 9pm, the system automatically:

1. **Archives** last week's reports (saved as a PDF and a spreadsheet copy in Google Drive)
2. **Clears** all the data you entered last week
3. **Updates** the dates to this week (Wednesday through Sunday)
4. **Renames** each tab with the new dates
5. **Notifies** the team via email and Slack that the new week is ready

**You don't need to do anything for this.** When you open the spreadsheet on Wednesday, it will be clean and ready for the new week.

If the rollover didn't happen (you open the spreadsheet Monday afternoon and still see last week's dates), let Evan know.

---

## Common Mistakes and How to Avoid Them

| Mistake | What Happens | How to Avoid |
|---------|-------------|--------------|
| Editing a formula cell | The calculation breaks permanently | Check the formula bar before typing in any cell. If it starts with `=`, don't touch it. |
| Sending the report from the wrong tab | Wrong day's data gets sent | Always check the tab name matches tonight's day before clicking Export. |
| Forgetting to tick both checklist items | The Send button stays greyed out | Both Deputy timesheets and fruit order must be confirmed. |
| Leaving the MOD field blank | The report sends but the data warehouse can't log it properly | Always enter your name in the MOD field. |
| Sending TEST instead of LIVE | Only Evan receives the report | Make sure you choose "Export & Email PDF (LIVE)", not the TEST option. |
| Typing in the wrong sheet | Data goes to the wrong day | Check the tab name at the bottom of the screen matches tonight. |

---

## Quick Reference (For Regular Use)

Once you've done this a few times, here's the short version:

1. **Open tonight's tab**
2. **Enter** MOD name, staff, financial figures
3. **Write** shift notes (summary, VIP, good, bad, kitchen)
4. **Add** tasks with assignees
5. **Record** wastage/RSA if applicable
6. **Waratah Tools > Daily Reports > Export & Email PDF (LIVE)**
7. **Tick** both checklist items, click **Confirm & Send**
8. **Wait** for the green success message

**Done.** Go home.
