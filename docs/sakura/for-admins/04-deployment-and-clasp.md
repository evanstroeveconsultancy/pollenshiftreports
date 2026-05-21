# Deployment and Clasp

**Audience:** Admin operators pushing code changes to Sakura House's Apps Script projects via clasp, managing time-based triggers, and verifying that a deployment landed correctly.

This file is the operational view. Deeper code-level deployment details (clasp configuration, script properties for development, full rollback procedures) live in the developer documentation at [`/docs/sakura/for-developers/`](../for-developers/), pending Phase 4.

---

## 1. What clasp Does (and Does Not Do)

`clasp` is Google's command-line tool for syncing Apps Script code between your local machine and Google's servers. From the admin perspective:

| Action | What happens |
|---|---|
| `clasp push` | Uploads your local `.gs` / `.html` files to the Apps Script project on Google's servers. The code runs immediately on subsequent script invocations. |
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

## 2. The Two Sakura Projects

Sakura has two independent Apps Script projects, each with its own `.clasp.json` and its own bound spreadsheet. They must be pushed independently.

| Project | Local directory | What it contains |
|---|---|---|
| Shift Report | `SAKURA HOUSE/SHIFT REPORT SCRIPTS/` | 13 `.gs` files plus 3 HTML files: `analytics-viewer.html`, `export-dashboard.html`, `rollover-wizard.html`. Handles the nightly shift report, weekly rollover, warehouse logging, AI insights, dashboards, and Slack digest. |
| Task Management | `SAKURA HOUSE/TASK MANAGEMENT SCRIPTS/` | 9 `.gs` files plus 1 HTML file: `checklist-dialog.html` (referenced as `task-manager.html` in some legacy docs). Handles the 9-status task workflow, daily maintenance, weekly summary, and on-edit auto-sort. |

If your change touches both projects, you must `clasp push` from both directories. Pushing one does not deploy the other.

---

## 3. Pre-Deployment Checklist

Before any `clasp push` to production:

1. **Code review passed.** Run `/review` (gas-code-review-agent) before deploying any change larger than five lines. Confirm no P0 or P1 issues remain.
2. **Test on a copy.** Make a copy of the production spreadsheet, then in a separate Apps Script project set `SAKURA_WORKING_FILE_ID` (and `SAKURA_DATA_WAREHOUSE_ID` if warehouse code changed) to the copy's ID. Verify your changes there first.
3. **Docs updated.** If the change affects manager-visible behaviour, the corresponding `for-managers/` or `for-admins/` doc must already be updated in the same commit.
4. **No `_SETUP_` files staged.** `.gitignore` excludes `_SETUP_*` files (Slack webhook secrets). Confirm `git status` shows no `_SETUP_*` files staged before committing.
5. **Confirm relevant Script Properties.** If the new code introduces new properties, document them in [`01-configuration-reference.md`](01-configuration-reference.md) and add them to the project's setup routine.
6. **Note the current triggers.** Apps Script may destroy triggers on push. Open the Triggers panel for both projects and take a screenshot so you know what to reinstall if anything is lost.
7. **Confirm you are on the correct git branch.** Per the project convention: `sakura/develop` for Sakura work.
8. **Communicate the change.** If the deployment affects manager-visible behaviour, tell the manager team what is changing and when.

---

## 4. Why Triggers Can Die After Deployment

Google Apps Script ties time-based triggers to specific handler function names. When you `clasp push`:

- If a function name in the new code matches an existing trigger's function name, the trigger remains in place pointing at the new code.
- If a function was renamed, removed, or its file was moved, the trigger is **destroyed silently**. No notification.
- If a new function was added that needs a trigger, **no trigger is created automatically**; you must install it.

In Sakura's current setup, `clasp push` does not generally destroy triggers because handler function names (`performInPlaceRollover`, `runDailyTaskMaintenance`, `sendWeeklyActiveTasksSummary`, `sendWeeklyRevenueDigest_Sakura`, `onTaskSheetEditWithAutoSort`) have been stable for months. But **always verify** the Triggers panel after a push. If a handler was renamed, the trigger is gone.

---

## 5. Standard clasp Push Procedure

From your local machine, in the correct directory:

```bash
cd "/Users/.../SHIFT REPORTS 3.0/SAKURA HOUSE/SHIFT REPORT SCRIPTS"
clasp push
```

For the Task Management project, the directory is different:

```bash
cd "/Users/.../SHIFT REPORTS 3.0/SAKURA HOUSE/TASK MANAGEMENT SCRIPTS"
clasp push
```

If you have changes in both projects, push each separately. The first time you push from a directory, clasp asks for confirmation; after that, pushes are silent.

After both pushes, immediately run the post-deploy verification (Section 6).

---

## 6. Post-Deployment Verification

In order:

### Step 1: Confirm code reached Apps Script

1. Open the relevant Apps Script editor (`clasp open` or from the spreadsheet > Extensions > Apps Script).
2. Open one or two of the files you just changed. Confirm the new code is present and file timestamps reflect the push.
3. Open the function dropdown and confirm new or renamed functions appear in the listing.

### Step 2: Verify triggers (Shift Report project)

Expected triggers for the Shift Report project:

| Trigger | Schedule | Handler function |
|---|---|---|
| Weekly Rollover | Monday 10am | `performInPlaceRollover` |
| Weekly Revenue Digest | Monday 8am | `sendWeeklyRevenueDigest_Sakura` |

Install paths if a trigger is missing:
- Weekly Rollover: `Shift Report > Admin Tools > Weekly Rollover` submenu (creator function `createRolloverTrigger_Sakura()`).
- Weekly Revenue Digest: `Shift Report > Admin Tools > Weekly Digest` submenu (creator function `setupWeeklyDigestTrigger_Sakura()`).

### Step 3: Verify triggers (Task Management project)

Expected triggers for the Task Management project:

| Trigger | Schedule | Handler function |
|---|---|---|
| Daily task maintenance | Daily 7am | `runDailyTaskMaintenance` |
| Weekly active tasks summary | Monday 6am | `sendWeeklyActiveTasksSummary` |
| On-edit auto-sort | onEdit (installable) | `onTaskSheetEditWithAutoSort` |

Creator functions if any are missing: `createDailyMaintenanceTrigger()`, `createWeeklySummaryTrigger()`, `createOnEditTrigger()`. Run them from the Apps Script editor function dropdown if the corresponding menu items are not exposed.

Open the Triggers panel for each project and confirm no **orphan triggers** remain (triggers pointing at function names that no longer exist after a rename). Orphan triggers fail silently and clutter the panel; delete them.

### Step 4: Verify Script Properties survive

Apps Script does not destroy Script Properties on `clasp push`, but it is worth confirming:

1. Both projects > Project Settings > Script Properties.
2. Spot-check that the values you expect are still present.
3. If any are missing, refer to [`01-configuration-reference.md`](01-configuration-reference.md) and restore.

### Step 5: Smoke test

1. From the shift report spreadsheet, **Shift Report > Send Test Report** (`exportAndEmailPDF_TestToSelf`). This exercises the nightly Slack post against the TEST webhook (`SAKURA_SLACK_WEBHOOK_TEST`) without writing to the warehouse or pushing tasks.
2. Confirm TEST Slack message arrives.
3. If you changed warehouse code, run **Test Integrations** from `Shift Report > Admin Tools > Integrations & Analytics` and confirm a test row lands in the warehouse spreadsheet (`SAKURA_DATA_WAREHOUSE_ID`).
4. If you changed rollover code, run **Preview Rollover** from `Shift Report > Admin Tools > Weekly Rollover` and confirm the wizard shows the expected fields.
5. If you changed task management code, open the Tasks sheet and confirm `onTaskSheetEditWithAutoSort` still fires on edit (change a status cell; the row should re-sort).

If all relevant smoke tests succeed, the deployment is healthy.

### Step 6: Verify with the manager team

If the deployment is non-trivial, ask a manager to run their normal nightly send the next service night. Confirm the LIVE pipeline works end-to-end without manual intervention.

---

## 7. Cross-Project Sync Requirements

Some changes require **both** projects to be deployed together:

- **Shared Slack constants or webhook keys.** If `SLACK_MANAGERS_CHANNEL_WEBHOOK` or `SAKURA_SLACK_WEBHOOK_TEST` semantics change, both projects read these properties and must be redeployed together.
- **Warehouse spreadsheet ID changes.** Both projects read `SAKURA_DATA_WAREHOUSE_ID` (shift report side at `IntegrationHubSakura.gs:25`; task management side at `SlackBlockKitSAKURA.gs:164`).
- **Task push contract changes.** If `TaskIntegrationSakura.gs` (shift report side) changes the format of pushed tasks, the receiving task management project may need a matching column or parser update.
- **`VENUE_NAME` Script Property.** Read by both projects.

When in doubt, push both. Pushing both is cheap; a mismatch between the two is expensive.

---

## 8. If a Deployment Goes Wrong

### Symptom: Triggers are gone and you cannot reinstall via menu

The menu items themselves may have been broken by the code change. Recovery:

1. Open Apps Script editor for the affected project.
2. Find the relevant trigger creator function: `createRolloverTrigger_Sakura()`, `setupWeeklyDigestTrigger_Sakura()`, `createDailyMaintenanceTrigger()`, `createWeeklySummaryTrigger()`, or `createOnEditTrigger()`.
3. Select the function in the dropdown and click Run.
4. Verify the trigger appears in the Triggers panel.

If the trigger setup function itself is broken in the new code, you need to fix the bug and re-push before triggers can be reinstalled.

### Symptom: A nightly send fails after deployment

1. Have a manager try the send again (might be transient).
2. Check the Executions panel for the failed call. Read the error.
3. If the error is in code you just pushed, you have two options:
   - **Quick rollback:** `git revert HEAD` (creates a new commit undoing the push), then `clasp push` from the reverted state to redeploy the older code. `clasp pull` is NOT a rollback; it pulls Google's code down to local, which is the wrong direction.
   - **Hotfix:** Identify the bug, fix locally, `clasp push` again.

Document the incident and the fix.

### Symptom: Script Properties were inadvertently lost

`clasp push` does not delete Script Properties, but a human edit or running a reset routine can. Recovery: refer to [`01-configuration-reference.md`](01-configuration-reference.md) and restore the documented values. Some values (webhooks) can be regenerated; some (spreadsheet IDs) can be recovered from URLs of the relevant files; some (passwords) must be set fresh.

---

## 9. Git Workflow for Sakura

The repository uses two main feature branches:

- `sakura/develop` for Sakura-only work.
- `waratah/develop` for Waratah-only work.
- `main` receives merges only; never commit directly.

Standard Sakura workflow:

```bash
git checkout sakura/develop
# edit code
cd "SAKURA HOUSE/SHIFT REPORT SCRIPTS" && clasp push
cd ../..
git add -A
git commit -m "feat(sakura): describe the change"
git push origin sakura/develop
```

**Cross-merge rule.** When a Sakura commit touches **shared files** (`CLAUDE.md`, `docs/` content that applies to both venues, `.claude/agents/`, `.claude/commands/`, `CLAUDE_SHARED.md`), cross-merge immediately so Waratah does not drift:

```bash
git checkout waratah/develop
git merge sakura/develop
git push origin waratah/develop
git checkout sakura/develop
```

Sakura-only files (`CLAUDE_SAKURA.md`, `docs/sakura/*`, `SAKURA HOUSE/*`) do not require cross-merge. Waratah-only files do not require cross-merge in the other direction either. The rule applies only when both branches need to see the same content.

Before starting any session, check for drift:

```bash
git log --oneline sakura/develop ^waratah/develop
git log --oneline waratah/develop ^sakura/develop
```

If either side has shared-file commits the other does not, cross-merge before doing any work.

---

## 10. Deployment Quick-Reference

| Step | Action | Required? |
|---|---|---|
| Code review (`/review`) | Catch issues before deploy | Yes for changes over 5 lines |
| Test on copy | Verify new behaviour does not break existing functionality | Yes for non-trivial changes |
| Docs updated in same commit | Keep docs and code in lockstep | Yes if behaviour changed |
| No `_SETUP_` files staged | Webhook secrets stay out of git | Yes |
| Pre-deploy notes | Snapshot current triggers, confirm Script Properties unchanged | Yes |
| `clasp push` (Shift Report) | From `SAKURA HOUSE/SHIFT REPORT SCRIPTS` | Yes if SR files changed |
| `clasp push` (Task Management) | From `SAKURA HOUSE/TASK MANAGEMENT SCRIPTS` | Yes if TM files changed |
| Verify SR triggers | Mon 10am rollover, Mon 8am digest | Yes |
| Verify TM triggers | Daily 7am maintenance, Mon 6am summary, onEdit auto-sort | Yes |
| Check for orphan triggers | Delete any pointing at renamed functions | Yes |
| Verify Script Properties | Both projects | Yes |
| Smoke test | Send Test Report, Test Integrations, Preview Rollover as relevant | Yes |
| Git commit and push | Save the code change to git | Yes |
| Cross-merge to `waratah/develop` | Per CLAUDE.md rule for shared files | Yes if shared files touched |
| Tell manager team | If user-visible behaviour changed | Conditional |

Skipping the trigger verification step is the single most common post-deployment failure.
