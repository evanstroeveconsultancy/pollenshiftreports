**Last updated:** May 17, 2026 (Phase 1.2 — cell map correction)
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

> The top of every shift report has the date and your name. Make sure the date is correct — if it's wrong, the system will record data on the wrong day's history. Your name (MOD) is required so the management team knows who to ask questions about tonight.

At the top of the sheet:

- **Date** — Already filled in. Confirm it shows tonight's date. If it doesn't, tell Evan.
- **MOD** — Type your name. This is the Manager on Duty field — it records who ran tonight's service.
- **FOH Staff** — List your front-of-house staff members for tonight.
- **BOH Staff** — List your back-of-house (kitchen) staff members for tonight.

---

## Step 2: Count and Reconcile the Cash Tills

> Cash reconciliation is now built into the shift report. You count both tills, enter the counts and refloats, and the system automatically calculates whether the cash matches what the POS recorded. If there's a big difference, it flags it so you can investigate.

You'll see **four till entry columns**, one for each till:

| Column | What to Enter | Why |
|--------|---------------|-----|
| **Public Till Count** | Total cash you counted from the public till | Must match what the till receipt shows |
| **Public Till Refloat** | New cash you put back in the public till | To start tomorrow with float |
| **Terrace Till Count** | Total cash you counted from the terrace till | Must match what the terrace till receipt shows |
| **Terrace Till Refloat** | New cash you put back in the terrace till | To start tomorrow with float |

**The system then calculates three summary numbers automatically:**

| Field | What It Shows | What It Means |
|-------|---------------|---------------|
| **Cash Counted** | Sum of both till counts | Total physical cash in hand |
| **Cash Take** | Counted cash minus what you refloated | Actual money leaving the venue |
| 💰 **Cash Variance** | Your take vs. what POS expected | Did the till balance? (should be ~$0) |

**If 💰 Cash Variance is large (more than ±$50):** Stop. Recount both tills carefully. There's a real difference between physical cash and POS records — this needs to be investigated before you send the report.

---

## Step 3: Enter the Financial Figures

> Most financial data comes from your POS end-of-day report. Enter values from top to bottom — tips, then production amount, then the POS breakdown. Some cells (like Net Revenue and Taxes) calculate automatically — leave those alone.

**Tips section** (enter these from your POS):

| Field | What to Enter |
|-------|---------------|
| **Cash Tips** | Total tips paid in cash |
| **Card Tips** | Total tips charged to card |
| **Surcharge Tips** | Any automatic surcharge amount (if applicable) |

**Revenue & Expenses section**:

| Field | What to Enter |
|-------|---------------|
| **Production Amount** | Tonight's production figure from POS |
| **Function/Event Deposit** | Cash deposit for functions or external events |
| **Card Expenses** | Payment processing fees (6 separate line items from your POS) |
| **Total Adjustments/Discounts** | Any overall discounts or adjustments tonight |

**Cash returns & discounts** (from POS breakdown):

| Field | What to Enter |
|-------|---------------|
| **Cash Returns** | Customer refunds paid in cash |
| **CD Discount** | Card discount amount |

### Fields You Must NOT Edit — Formula Cells

Some cells contain formulas that calculate automatically from your entries. Do NOT type in these cells — they'll break the entire financial calculation if you overwrite them.

**Do not type in these:**

| Cell | What It Calculates | Where |
|------|--------------------|-------|
| **Cash Take** | Counted cash minus refloats | Cash reconciliation section |
| **Total Tips** | Sum of cash tips + card tips + surcharge tips | Tips section |
| **Gross Sales** | Derived from production + cash | Revenue section |
| **Discounts (exc Cash)** | Calculated discounts | Revenue section |
| **Taxes** | Calculated from sales | Revenue section |
| **Net Revenue** | Final result after all adjustments | Revenue section |
| **Running Totals** | Week-to-date summaries | Right column (D) |

**How to tell if a cell is a formula:** Click on it and look at the formula bar at the top of the spreadsheet. If it starts with `=`, it's a formula — don't type in it.

---

## Step 4: Write Your Shift Notes

> The shift notes section is where you tell the management team what actually happened tonight. Write clearly and concisely — assume they weren't there and won't ask follow-up questions. These notes go straight to email and Slack, so they're read by busy managers who need context quickly.

You'll see five narrative fields:

| Field | What to Write |
|-------|---------------|
| **General Shift Comments** | Overview of the night. How many covers, vibe, major events, anything notable. 2-3 sentences. |
| **Guests of Note** | Any notable guests, regulars, VIPs, special occasions, or table incidents. |
| **The Good** | What went well. Staff wins, smooth service, positive feedback, table compliments. |
| **The Bad** | Problems, complaints, customer issues, equipment failures, anything requiring follow-up. |
| **Kitchen Notes** | Food quality, prep issues, items 86'd, kitchen communication issues, staffing challenges. |

**Write as if the owner is reading this the next morning and needs to understand your shift.** Be specific. Instead of "customer issue," write "Table 7 complained about steak temperature — remade and comped." Managers need context, not vague descriptions.

---

## Step 5: Add Tasks (TO-DOs)

> Tasks from your shift report get collected in a master task list that the whole team can see. Don't write vague tasks — write them so someone else reading them knows exactly what needs to happen.

Below the notes, there's a task section with 16 available rows. For each task that came up during service:

| Column | What to Enter |
|--------|---------------|
| **Task Description** | What needs to be done. Be specific — "Fix the leaky tap in the women's bathroom" not "Fix plumbing". |
| **Assigned To** | Which staff member is responsible. Use a real name, not "someone" or "anyone". |

**Leave unused rows empty.** If you only have 3 tasks tonight, fill rows 1–3 and leave rows 4–16 blank. These tasks automatically get collected into the team's Master Actionables task list so nothing slips through the cracks.

---

## Step 6: Record Wastage, Maintenance, and RSA Incidents

> Some things happen during a shift that affect venue operations: broken equipment, food waste, or alcohol service incidents. Record these so the management team can track patterns and budgets.

At the bottom of the sheet:

| Field | What to Enter | Why |
|-------|---------------|-----|
| **Wastage/Comps** | Any food wastage, comps, or write-offs. Include item, reason, and value (e.g., "Steak overcooked $45"). | Tracks food waste and comps for budgeting. |
| **Maintenance Issues** | Equipment failures, broken items, repairs needed (e.g., "Espresso machine leaking"). | Helps schedule maintenance and track equipment costs. |
| **RSA / Injuries** | Any Responsible Service of Alcohol incidents or staff injuries (required by law). | Legal record; essential for safety and compliance. |

If nothing to report in a category, just leave it blank. Only write something if there's actually something to record.

---

## Step 7: Send the Report

> Once you've filled in everything, one menu click sends the report to the entire management team, posts a summary to Slack, saves the data to analytics, and pushes tasks to the master list. You need to confirm two things before sending — that you've approved timesheets and placed the fruit order.

When you've finished filling everything in:

1. **Click the "Waratah Tools" menu** at the top of the spreadsheet (next to Help)
2. **Click "Daily Reports"**
3. **Click "Export & Email PDF (LIVE)"**
4. A dialog appears asking you to confirm tonight's sheet — **click Yes**
5. A **checklist appears** with two required confirmations:
   - ☐ **Deputy Timesheets Approved** — Tick this box to confirm you've approved tonight's timesheets in Deputy
   - ☐ **Fruit Order Done** — Tick this box to confirm the fruit order has been placed for tomorrow
6. **Both boxes must be checked.** The "Confirm & Send" button stays greyed out until you tick both.
7. **Click "Confirm & Send"**
8. Wait for the **green success message** — it takes about 10–15 seconds to complete
9. The dialog closes automatically when done

### What Just Happened

When you clicked "Confirm & Send", the system automatically:

- Generated a clean PDF of tonight's shift report (all your data, formatted nicely)
- Emailed that PDF to 9 management team members and key stakeholders
- Posted a summary to the Waratah Slack channel — including **💰 Cash Variance: $X.XX** so managers can instantly see if the till balanced
- Saved tonight's financial data to the analytics database (for weekly and monthly reporting)
- Pushed all your tasks to the team's Master Actionables list (so nothing gets forgotten)
- Updated the TO-DOs summary tab with your entries

**You don't need to do anything else.** Everything is sent, saved, and synced automatically. Your job is done.

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
