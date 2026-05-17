# The Waratah Documentation

Welcome to the operational and technical documentation for The Waratah's shift report and task management system.

This documentation is organised by **who you are**, so you can jump to the right place without wading through content meant for other audiences. Pick the heading that describes you below.

---

## Who Are You?

### I am a floor staff member or daily user

You fill in the shift report at the end of each shift and click Send. You don't need to know how the system works underneath, you just need to know what to type where.

**Go to:** [`for-daily-users/shift-report-walkthrough.md`](for-daily-users/shift-report-walkthrough.md)

### I am a venue manager

You oversee daily reports, manage tasks, watch weekly numbers, and step in when something needs attention. You change small things (a missed task, a wastage entry) but you don't touch the underlying configuration.

**Go to:** [`for-managers/`](for-managers/) (Phase 2 complete)

### I am an admin or IT-savvy operator

You configure Script Properties, manage the staff and recipient lists, change Slack webhooks, recover the system when something breaks, and deploy code changes via clasp.

**Go to:** [`for-admins/`](for-admins/) (Phase 3 complete)

### I am a developer or Claude AI agent

You modify the codebase, work with named ranges and cell maps, read warehouse schemas, manage triggers, and deploy. You need exhaustive reference material rather than narrative walkthroughs.

**Go to:** [`for-developers/`](for-developers/) (Phase 4 complete)

---

## Where Things Live

```
docs/waratah/
├── README.md                 You are here
├── for-daily-users/          Floor staff who fill the daily report
├── for-managers/             Venue managers, daily oversight
├── for-admins/               Configuration, recovery, deployment
├── for-developers/           Canonical technical reference and AI agent routing
└── _archive/                 Old documentation, preserved during migration
```

---

## Migration Status

This documentation is being consolidated from 12 older files into the audience-tiered structure above. The migration runs in four phases:

| Phase | Tier | Status | Notes |
|---|---|---|---|
| 1 | Daily User | **Complete (2026-05-17)** | Daily user walkthrough plus this README |
| 2 | Manager | **Complete (2026-05-17)** | Six files |
| 3 | Admin | **Complete (2026-05-17)** | Five files |
| 4 | Developer | **Complete (2026-05-17)** | Seven files |

The full design and content migration map lives at [`/docs/plans/2026-05-17-waratah-docs-consolidation-design.md`](../plans/2026-05-17-waratah-docs-consolidation-design.md).

All legacy files have been archived to `_archive/`. The `THE WARATAH/FILE EXPLAINERS/` directory now contains only a `README.md` stub pointing here.

---

## For AI Agents (Claude Code)

The master routing file for AI-driven sessions is [`/CLAUDE_WARATAH.md`](../../CLAUDE_WARATAH.md) at the repository root. Always start there for AI tasks on this project. That file points back here for content reference, and contains the agent dispatch rules.

---

## Style Standards

All documentation in this directory uses:

- UK English spelling (organised, behaviour, recognise, summarise, defence, licence/license)
- No em-dashes anywhere
- Plain, instructional second-person voice
- Lists over paragraphs where steps are involved
- One topic per heading

Contributions outside this style should be normalised before merging.
