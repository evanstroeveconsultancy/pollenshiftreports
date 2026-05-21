# Sakura House Documentation

Welcome to the operational and technical documentation for Sakura House's shift report and task management system.

This documentation is organised by **who you are**, so you can jump to the right place without wading through content meant for other audiences. Pick the heading that describes you below.

---

## Who Are You?

### I am a floor staff member or daily user

You fill in the shift report at the end of each shift and click Send. You don't need to know how the system works underneath, you just need to know what to type where.

**Go to:** [`for-daily-users/shift-report-walkthrough.md`](for-daily-users/shift-report-walkthrough.md)

### I am a venue manager

You oversee daily reports, manage tasks, watch weekly numbers, and step in when something needs attention. You change small things (a missed task, a wastage entry) but you don't touch the underlying configuration.

**Go to:** [`for-managers/`](for-managers/)

### I am an admin or IT-savvy operator

You configure Script Properties, manage the staff and recipient lists, change Slack webhooks, recover the system when something breaks, and deploy code changes via clasp.

**Go to:** [`for-admins/`](for-admins/)

### I am a developer or Claude AI agent

You modify the codebase, work with named ranges and cell maps, read warehouse schemas, manage triggers, and deploy. You need exhaustive reference material rather than narrative walkthroughs.

**Go to:** [`for-developers/`](for-developers/)

---

## Where Things Live

```
docs/sakura/
├── README.md                 You are here
├── for-daily-users/          Floor staff who fill the daily report
├── for-managers/             Venue managers, daily oversight
├── for-admins/               Configuration, recovery, deployment
├── for-developers/           Canonical technical reference and AI agent routing
└── _archive/                 Old documentation, preserved during migration
```

---

## Migration Status

This documentation has been consolidated from nine older files into the audience-tiered structure above. The migration runs in four phases:

| Phase | Tier | Status | Notes |
|---|---|---|---|
| 1 | Daily User | In progress (2026-05-22) | Daily user walkthrough plus this README |
| 2 | Manager | In progress (2026-05-22) | Five files |
| 3 | Admin | In progress (2026-05-22) | Four files |
| 4 | Developer | In progress (2026-05-22) | Six files |

The full design and content migration map lives at [`/docs/plans/2026-05-22-sakura-docs-system-mirror.md`](../plans/2026-05-22-sakura-docs-system-mirror.md). The verified code fact sheet that grounded the migration is at [`/docs/plans/2026-05-22-sakura-docs-FACT-SHEET.md`](../plans/2026-05-22-sakura-docs-FACT-SHEET.md).

The four legacy flat docs (`CELL_REFERENCE_MAP_SAKURA.md`, `DEEP_DIVE_ARCHITECTURE_SAKURA.md`, `INTEGRATION_FLOWS_SAKURA.md`, `WORKFLOW_WEEKLY_SAKURA.md`) have been moved to `_archive/`. The `SAKURA HOUSE/FILE EXPLAINERS/` directory has been reduced to a stub pointing here.

---

## What Sakura House Is

Sakura House is a six-day-a-week (Monday to Saturday, closed Sunday) hospitality venue running on a Google Apps Script-driven shift report and task management system. The system covers:

- Daily shift reports filled by the Manager on Duty, submitted via a Send button
- A central data warehouse that aggregates financial, operational, wastage, and qualitative data nightly
- Slack notifications via Block Kit to managers and venue channels
- An eight-status (plus RECURRING) task management workflow with auto-escalation and recurring task generation
- AI-generated shift summaries and anomaly detection via the Claude API
- Weekly automated rollover that resets day sheets in place every Monday morning
- Two analytics dashboards (Executive and Financial) rebuilt from warehouse data on demand

The codebase lives in two Google Apps Script projects:

- `SAKURA HOUSE/SHIFT REPORT SCRIPTS/` (14 `.gs` files + HTML, ~5,700 lines)
- `SAKURA HOUSE/TASK MANAGEMENT SCRIPTS/` (8 `.gs` files + HTML, ~3,800 lines)

---

## For AI Agents (Claude Code)

The master routing file for AI-driven sessions is [`/CLAUDE_SAKURA.md`](../../CLAUDE_SAKURA.md) at the repository root. Always start there for AI tasks on this project. That file points back here for content reference, and contains the agent dispatch rules.

---

## Style Standards

All documentation in this directory uses:

- UK English spelling (organised, behaviour, recognise, summarise, defence, licence/license)
- No em-dashes anywhere
- Plain, instructional second-person voice
- Lists over paragraphs where steps are involved
- One topic per heading

Contributions outside this style should be normalised before merging.
