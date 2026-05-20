# Deployment and Clasp

**Audience:** Admin operators pushing code changes to The Waratah's Apps Script projects via clasp, managing time-based triggers, and verifying that a deployment landed correctly.

This file is the operational view. Deeper code-level deployment details (clasp configuration, script properties for development, full rollback procedures) live in the developer documentation at [`/docs/waratah/for-developers/`](../for-developers/), pending Phase 4.

---

## 1. What clasp Does (and Does Not Do)

`clasp` is Google's command-line tool for syncing Apps Script code between your local machine and Google's servers. From the admin perspective:

| Action | What happens |
|---|---|
| `clasp push` | Uploads your local `.js` / `.gs` / `.html` files to the Apps Script project on Google's servers. The code runs immediately on subsequent script invocations. |
| `clasp pull` | Downloads the current code from Google to your local machine. Useful for syncing after someone else made changes via the Apps Script editor. |
| `clasp open` | Opens the Apps Script editor in your browser for the configured project. |

**Critical distinction:** `clasp push` deploys code to Apps Script. **`git push` is separate.** Pushing to GitHub does not deploy to Apps Script and vice versa. See the project root `CLAUDE.md` for the standard workflow.

`clasp push` does NOT:
- Trigger any code execution
- Re-install time-based triggers
- Change Script Properties
- Notify anyone

It is purely a code upload. Side effects (triggers being destroyed, configuration drift) come from how Apps Script handles the new code, not from clasp itself.

---

## 2. Pre-Deployment Checklist

Before any `clasp push` to production:

1. **Test on a copy.** Make a copy of the production spreadsheet, then in a separate Apps Script project set both `WARATAH_SHIFT_REPORT_CURRENT_ID` and `WARATAH_WORKING_FILE_ID` to the copy's ID (and `WARATAH_SHEET_ID` if that fallback property is in use). Verify your changes there first.
2. **Confirm relevant Script Properties.** If the new code introduces new properties, document them in [`01-configuration-reference.md`](01-configuration-reference.md) and add them to `_SETUP_ScriptProperties.js`.
3. **Note the current triggers.** Apps Script may destroy triggers on push. Take a screenshot of the current Triggers panel for both projects so you know what to reinstall.
4. **Confirm you are on the correct git branch.** Per the project convention: `waratah/develop` for Waratah work, `sakura/develop` for Sakura.
5. **Run the relevant code review.** The project has a `gas-code-review-agent` skill; use the `/review` command before deploying.
6. **Communicate the change.** If the deployment affects manager-visible behaviour, tell the manager team what is changing and when.

---

## 3. Why Triggers Die After Deployment

Google Apps Script ties time-based triggers to specific handler function names. When you `clasp push`:

- If a function name in the new code matches an existing trigger's function name, the trigger remains in place pointing at the new code.
- If a function was renamed, removed, or its file was moved, the trigger is **destroyed silently**. No notification.
- If a new function was added that needs a trigger, **no trigger is created automatically**; you must install it.

In practice, after every clasp push, **assume all triggers in both projects need reinstallation**. Verify and reinstall as part of the post-deploy routine below.

---

## 4. Standard clasp Push Procedure

From your local machine, in the correct directory:

```bash
cd "/Users/.../SHIFT REPORTS 3.0/THE WARATAH/SHIFT REPORT SCRIPTS"
clasp push
```

The first time you push from a directory, clasp asks for confirmation. After that, pushes are silent.

For the Task Management project, the directory is different:

```bash
cd "/Users/.../SHIFT REPORTS 3.0/THE WARATAH/TASK MANAGEMENT SCRIPTS"
clasp push
```

If you have changes in both projects, push each separately.

After both pushes, immediately run the post-deploy verification (Section 5).

---

## 5. Post-Deployment Verification

In order:

### Step 1: Confirm code reached Apps Script

1. Open the relevant Apps Script editor (`clasp open` or from the spreadsheet > Extensions > Apps Script).
2. Open one or two of the files you just changed. Confirm the new code is present.
3. Save (Cmd+S). This is sometimes necessary even after clasp push to force a fresh permission grant.

### Step 2: Install triggers (Shift Report project)

Expected triggers for the Shift Report project:

| Trigger | Schedule | Handler function | Menu path to install |
|---|---|---|---|
| Weekly Rollover | Mon 9pm | `runWaratahWeeklyRollover` | `Waratah Tools > Admin Tools > Setup & Utilities > Setup All SR Triggers` OR `Waratah Tools > Admin Tools > Weekly Reports > Weekly Rollover (In-Place) > Create Rollover Trigger (Mon 9pm)` |
| Weekly Backfill | Mon 8am | `runWeeklyBackfill_` | `Setup All SR Triggers` OR `Waratah Tools > Admin Tools > Data Warehouse > Setup Weekly Backfill Trigger` |
| Revenue Digest | Mon 4pm | `sendWeeklyRevenueDigest_Waratah` | `Setup All SR Triggers` OR `Waratah Tools > Admin Tools > Weekly Digest > Setup Monday Digest Trigger` |

The quickest path is the single `Setup All SR Triggers` menu item, which installs all three at once. Confirm each trigger appears in the Triggers panel afterwards.

### Step 3: Install triggers (Task Management project)

Expected triggers for the Task Management project:

| Trigger | Schedule | Handler function | Menu path to install |
|---|---|---|---|
| Bi-hourly status cleanup | Every 2 hours | `cleanupAndSortMasterActionables` | `Task Management > 🔐 Admin Tools > 🔧 Setup Triggers > Create Bi-Hourly Cleanup Trigger (Every 2hrs)` |
| Daily 6am staff workload | Daily 6am | `runScheduledStaffWorkload` | `Task Management > 🔐 Admin Tools > 🔧 Setup Triggers > Create Daily Staff Workload Trigger (6am)` |
| Daily task maintenance | Daily 6am (fires within the 6 to 7am window) | `runDailyTaskMaintenance` | Not exposed in the current menu; install from the Apps Script editor by running `createDailyMaintenanceTrigger()` |
| Mon 6am weekly archive | Mon 6am | `runScheduledArchive` | `Task Management > 🔐 Admin Tools > 🔧 Setup Triggers > Create Weekly Archive Trigger (Mon 6am)` |
| Mon 10am weekly summary | Mon 10am | `sendWeeklyActiveTasksSummary` | `Task Management > 🔐 Admin Tools > 🔧 Setup Triggers > Create Weekly Summary Trigger (Mon 10am)` |
| On-edit auto-sort | On any cell edit | `onTaskSheetEditWithAutoSort` | `Task Management > 🔐 Admin Tools > 🔧 Setup Triggers > Create Edit Trigger (Auto-sort)` (installable trigger, not a simple trigger) |

Run each install menu item. Five of the six are exposed in the Setup Triggers submenu; `createDailyMaintenanceTrigger()` must be run from the Apps Script editor. Verify each appears in the Triggers panel.

### Step 4: Verify Script Properties survive

Apps Script does not destroy Script Properties on `clasp push`, but it is worth confirming:

1. Both projects > Project Settings > Script Properties.
2. Spot-check that the values you expect are still present.
3. If any are missing, refer to [`01-configuration-reference.md`](01-configuration-reference.md) and restore.

### Step 5: Smoke test

1. From the shift report spreadsheet, **Waratah Tools > Daily Reports > Export & Email (TEST to me)**. This exercises the full nightly pipeline but routes outputs to TEST destinations: posts to the TEST Slack channel and emails the TEST recipient (Evan by default). It does NOT write to the warehouse or push tasks.
2. Confirm TEST Slack message arrives.
3. Confirm warehouse received the test write (open the warehouse spreadsheet, look for today's TEST row).
4. Confirm Task Management received the test tasks (open Task Management, filter by Source = Shift Report and Date Created = today).

If all three succeed, the deployment is healthy.

### Step 6: Verify with the manager team

If the deployment is non-trivial, ask a manager to run their normal Wednesday-night send the next service night. Confirm the LIVE pipeline works end-to-end without manual intervention.

---

## 6. If a Deployment Goes Wrong

### Symptom: Triggers are gone and you cannot reinstall via menu

The menu items themselves may have been broken by the code change. Recovery:

1. Open Apps Script editor for the affected project.
2. Find the trigger setup function in the code (search for `ScriptApp.newTrigger`).
3. Manually run the function from the Apps Script editor dropdown (select function name, click Run).
4. Verify the trigger appears in the Triggers panel.

If the trigger setup function itself is broken in the new code, you need to fix the bug and re-push before triggers can be reinstalled.

### Symptom: A nightly send fails after deployment

1. Have a manager try the send again (might be transient).
2. Check the Executions panel for the failed call. Read the error.
3. If the error is in code you just pushed, you have two options:
   - **Quick rollback:** Check out the previous commit from local git (`git checkout <previous-commit-sha>` or `git revert HEAD`), then `clasp push` to deploy the older code. Note: `clasp pull` would pull from Google to local, which is the wrong direction for a rollback.
   - **Hotfix:** Identify the bug, fix locally, `clasp push` again.

Document the incident and the fix in your change log.

### Symptom: Script Properties were inadvertently lost

`clasp push` does not delete Script Properties, but a human edit (running `resetScriptProperties()`) can. Recovery:

1. Run `setupScriptProperties()` in the affected project. This restores defaults (with placeholder values).
2. Manually re-enter the real values from your previous documentation. The change log entries in `docs/waratah/_archive/CONFIG_CHANGE_LOG.md` should give you the current state.
3. Run `verifyScriptProperties()` to confirm.

If you do not have a record of the current values, this is a serious recovery scenario. Some values (webhooks) can be regenerated; some (spreadsheet IDs) can be recovered from the URLs of the relevant files; some (passwords) must be set fresh.

---

## 7. Branching and Merge Discipline

The repository uses two main feature branches:

- `waratah/develop` for Waratah-only work.
- `sakura/develop` for Sakura-only work.
- `main` receives merges only.

When you push Waratah code via clasp, you commit to `waratah/develop` in git. When shared files change (CLAUDE.md, docs/, `.claude/agents/`), **cross-merge immediately**:

```bash
git checkout sakura/develop
git merge waratah/develop
git push origin sakura/develop
git checkout waratah/develop
git push origin waratah/develop
```

This keeps the two venue branches from drifting on shared infrastructure files. See the project `CLAUDE.md` Cross-merge rule for the canonical procedure.

---

## 8. Deployment Quick-Reference

| Step | Action | Required? |
|---|---|---|
| Test on copy | Verify new behaviour does not break existing functionality | Yes for non-trivial changes |
| Pre-deploy notes | Snapshot current triggers, confirm Script Properties unchanged | Yes |
| `clasp push` (Shift Report) | From SHIFT REPORT SCRIPTS directory | Yes if SR files changed |
| `clasp push` (Task Management) | From TASK MANAGEMENT SCRIPTS directory | Yes if TM files changed |
| Install SR triggers | 3 triggers via menu (`Setup All SR Triggers` installs all three) | Yes |
| Install TM triggers | 5 triggers via menu plus 1 from the Apps Script editor (`createDailyMaintenanceTrigger()`) | Yes |
| Verify Script Properties | Both projects | Yes |
| TEST shift report | Smoke test the full pipeline | Yes |
| Confirm warehouse + tasks captured | Inspect dest spreadsheets | Yes |
| Git commit and push | Save the code change to git | Yes |
| Cross-merge to other venue branch | Per CLAUDE.md rule for shared files | Yes if shared files touched |
| Tell manager team | If user-visible behaviour changed | Conditional |

Skipping any of the trigger reinstalls is the single most common post-deployment failure.
