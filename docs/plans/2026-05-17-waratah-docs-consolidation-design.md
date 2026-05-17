# The Waratah Documentation Consolidation, Design Document

**Date:** 2026-05-17
**Status:** Approved, implementation beginning
**Owner:** Evan Stroeve
**Topic:** Restructuring Waratah documentation into an audience-tiered hierarchy

---

## Executive Summary

The Waratah documentation currently spans 12 markdown files across two parent directories, totalling approximately 5,300 lines with roughly 30 percent redundancy. This design replaces that structure with 20 audience-tiered files under a single home at `/docs/waratah/`, organised by reader type: daily users, managers, admins, and developers.

Migration runs in four phases, smallest tier first, with a validation gate between each phase. Total estimated effort: 21 to 27 hours across four sessions.

---

## 1. Current State

| Location | File | Lines | Audience | Notes |
|---|---|---:|---|---|
| `/docs/waratah/` | CELL_REFERENCE_MAP.md | 385 | Dev | Phase 1.3 fresh, unique |
| `/docs/waratah/` | DEEP_DIVE_ARCHITECTURE.md | 301 | Dev | Overlaps with 03-ADVANCED |
| `/docs/waratah/` | INTEGRATION_FLOWS.md | 778 | Dev | Mostly unique |
| `/docs/waratah/` | WORKFLOW_WEEKLY.md | 472 | Dev/Tech | Overlaps with 3_WEEKLY and 02-INT |
| `/docs/waratah/explainers/` | 01-BASIC-Daily-Shift-Report-Guide.md | 256 | End user | Overlaps with 1_DAILY_SHIFT |
| `/docs/waratah/explainers/` | 02-INTERMEDIATE-How-The-System-Works.md | 355 | Manager | Overlaps with 3_WEEKLY |
| `/docs/waratah/explainers/` | 03-ADVANCED-Complete-Backend-Reference.md | 690 | Dev | Overlaps with DEEP_DIVE and INTEGRATION |
| `/THE WARATAH/FILE EXPLAINERS/` | 1_DAILY_SHIFT_REPORT.md | 268 | End user | Overlaps with 01-BASIC |
| `/THE WARATAH/FILE EXPLAINERS/` | 2_TASK_MANAGEMENT.md | 480 | Manager | Unique, only task doc |
| `/THE WARATAH/FILE EXPLAINERS/` | 3_WEEKLY_AUTOMATED_EVENTS.md | 399 | Manager | Overlaps with WORKFLOW_WEEKLY |
| `/THE WARATAH/FILE EXPLAINERS/` | 4_TROUBLESHOOTING.md | 367 | Manager | Mostly unique |
| `/THE WARATAH/FILE EXPLAINERS/` | 5_CONFIGURATION_REFERENCE.md | 560 | Manager | Overlaps with DEEP_DIVE properties |
| **Total** | **12 files** | **~5,311** | | **~30 percent redundant** |

`CLAUDE_WARATAH.md` (876 lines) and `CLAUDE_SHARED.md` (858 lines) are out of scope, they remain as navigation and AI-routing artefacts.

---

## 2. Problems Being Solved

1. **Overlap and duplication.** Four clusters of overlapping content (daily report walkthrough, weekly events, configuration reference, backend internals) across the two doc locations.
2. **Audience drift.** The split between `/docs/waratah/` (originally developer) and `/THE WARATAH/FILE EXPLAINERS/` (originally manager) has eroded; manager-relevant content now lives in dev docs and vice versa.
3. **Stale content risk.** With multiple sources of truth on the same topics, updates miss copies. The May 17 sweep found departed-staff references in three places.
4. **No clear entry path.** A new reader has no obvious starting point.

---

## 3. Design Decisions

| Question | Decision |
|---|---|
| Scope of consolidation | All 12 documentation files across both locations. `CLAUDE_WARATAH.md` and `CLAUDE_SHARED.md` remain untouched. |
| Audience tier structure | Four tiers: Daily User, Manager, Admin, Developer. |
| File organisation | Hybrid: per-tier entry-point files plus topic deep-dives. Tier directories under `/docs/waratah/`. |
| Directory structure | Single home at `/docs/waratah/` with four tier subdirectories. `/THE WARATAH/FILE EXPLAINERS/` becomes a stub README pointing to the new location. |
| Migration approach | Phased by tier, smallest first: Daily User, then Manager, then Admin, then Developer. |

---

## 4. Final Structure

```
docs/waratah/
├── README.md                                Landing router, "who are you?" by audience
│
├── for-daily-users/                         Floor staff who only fill the report
│   └── shift-report-walkthrough.md
│
├── for-managers/                            Venue managers, daily oversight and light config
│   ├── README.md
│   ├── 01-shift-reports.md
│   ├── 02-task-management.md
│   ├── 03-weekly-automation.md
│   ├── 04-staff-and-recipients.md
│   └── 05-troubleshooting.md
│
├── for-admins/                              IT-savvy ops, full config and recovery authority
│   ├── README.md
│   ├── 01-configuration-reference.md
│   ├── 02-staff-and-access-management.md
│   ├── 03-advanced-troubleshooting.md
│   └── 04-deployment-and-clasp.md
│
├── for-developers/                          Developers and Claude AI agents, canonical reference
│   ├── README.md
│   ├── 01-architecture-and-data-flow.md
│   ├── 02-cell-reference-and-field-config.md
│   ├── 03-integration-pipeline.md
│   ├── 04-warehouse-schemas.md
│   ├── 05-rollover-and-triggers.md
│   └── 06-task-management-internals.md
│
└── _archive/                                Old files preserved, never deleted
    ├── (former /docs/waratah/*.md)
    ├── (former /docs/waratah/explainers/*.md)
    └── (former /THE WARATAH/FILE EXPLAINERS/*.md)
```

**Totals:** 20 new files (1 root + 1 daily user + 6 manager + 5 admin + 7 developer), replacing 12 existing files.

---

## 5. Content Migration Mapping

Bold marks the canonical, single source of truth for each topic. Other destinations get summaries with cross-links back.

| Existing File | Lines | Primary Destination(s) | Secondary (summaries or links) |
|---|---:|---|---|
| A. `/docs/waratah/CELL_REFERENCE_MAP.md` | 385 | **`for-developers/02-cell-reference-and-field-config.md`** | linked from admin troubleshooting |
| B. `/docs/waratah/DEEP_DIVE_ARCHITECTURE.md` | 301 | **`for-developers/01-architecture-and-data-flow.md`** + **`for-admins/01-configuration-reference.md`** (Script Properties section) | task mgmt internals split off |
| C. `/docs/waratah/INTEGRATION_FLOWS.md` | 778 | **`for-developers/03-integration-pipeline.md`** | summary in `for-managers/01-shift-reports.md` |
| D. `/docs/waratah/WORKFLOW_WEEKLY.md` | 472 | **`for-developers/05-rollover-and-triggers.md`** | summary in `for-managers/03-weekly-automation.md`; manual execution to admin/03 |
| E. `01-BASIC-Daily-Shift-Report-Guide.md` | 256 | **`for-daily-users/shift-report-walkthrough.md`** (merged with H) | none |
| F. `02-INTERMEDIATE-How-The-System-Works.md` | 355 | Split across manager/01, 02, 03, 05 | glossary to manager/README |
| G. `03-ADVANCED-Complete-Backend-Reference.md` | 690 | Split across dev/01, 02, 03, 04, 05 | deployment to admin/04 |
| H. `1_DAILY_SHIFT_REPORT.md` | 268 | **`for-daily-users/shift-report-walkthrough.md`** (merged with E) | "what can go wrong" to manager/05 |
| I. `2_TASK_MANAGEMENT.md` | 480 | **`for-managers/02-task-management.md`** | staff to manager/04, properties to admin/01, audit trail to dev/06, staff change to admin/02 |
| J. `3_WEEKLY_AUTOMATED_EVENTS.md` | 399 | **`for-managers/03-weekly-automation.md`** | trigger destruction to admin/03 and dev/05 |
| K. `4_TROUBLESHOOTING.md` | 367 | Split: manager-fixable to manager/05, log inspection and recovery to admin/03, password to admin/02, hardcoded cells to dev/02 | none |
| L. `5_CONFIGURATION_REFERENCE.md` | 560 | **`for-admins/01-configuration-reference.md`** | recipient and Slack changes to admin/02, trigger reference to dev/05 (canonical) |

**Integrity principles:**

1. **One canonical home per fact.** Script Properties live in `for-admins/01-configuration-reference.md`, full stop. The dev architecture doc links to it, it does not restate it. This eliminates the "two stale staff lists" problem the May 17 sweep hit.
2. **Summaries can exist anywhere, sources of truth do not move.** Manager summary of rollover is roughly 200 words. The dev reference remains the canonical 800-word document. Behaviour changes update the dev file first and the manager summary refreshes from there.

**Net content recovery:** about 5,300 source lines become approximately 6,500 to 7,500 new lines. The increase fills current gaps: Daily User has only one file today, Admin has no dedicated guide, and the AI agent README for developers does not exist.

---

## 6. Phase Plan

### Phase 1: Daily User Tier (~3 hours)

| Action | File |
|---|---|
| CREATE | `docs/waratah/README.md` |
| CREATE | `docs/waratah/for-daily-users/shift-report-walkthrough.md` |
| CREATE | `docs/waratah/_archive/` |
| MOVE | E to `_archive/` with header |
| MOVE | H to `_archive/` with header |
| UPDATE | `CLAUDE_WARATAH.md` daily-user links |
| CREATE | `THE WARATAH/FILE EXPLAINERS/README.md` (stub pointing to new home) |

Target file structure agreed (12 sections, daily-user-walkthrough).

### Phase 2: Manager Tier (~6 to 8 hours)

CREATE: `for-managers/README.md` plus 01 to 05 (5 files).
ARCHIVE: F (full), manager portions of I, J, K.
UPDATE: `CLAUDE_WARATAH.md` manager links.

### Phase 3: Admin Tier (~4 to 6 hours)

CREATE: `for-admins/README.md` plus 01 to 04 (4 files).
ARCHIVE: L (full), B (mostly), K (remainder), admin portions of I.
UPDATE: `CLAUDE_WARATAH.md` admin links plus `CLAUDE_SHARED.md` cross-references.

### Phase 4: Developer Tier (~8 to 10 hours)

CREATE: `for-developers/README.md` plus 01 to 06 (6 files).
ARCHIVE: A, C, D, G (full), remnants of B.
UPDATE: `CLAUDE_WARATAH.md` developer links, `.claude/agents/*` paths if any reference the old locations.

---

## 7. Cross-Phase Mechanics

1. **Archive, never delete.** Files move into `docs/waratah/_archive/` with a one-line header appended at the top of the file: `<!-- ARCHIVED YYYY-MM-DD. Superseded by /docs/waratah/[new-path]. -->`. Old content stays readable for comparison.
2. **Inbound link sweep after each phase.** Grep the whole repository for the old file path. Update every hit. Files to check: `CLAUDE.md`, `CLAUDE_WARATAH.md`, `CLAUDE_SHARED.md`, anything in `.claude/agents/`, anything in `.claude/commands/`, anything in other `docs/` files.
3. **Cross-merge on every phase commit.** Per the project CLAUDE.md doc-branch rule, shared file edits commit on `waratah/develop` then merge into `sakura/develop` to keep the branches in sync.

---

## 8. Validation Gates (per phase)

Each phase must pass these checks before the next phase begins:

1. **Content audit.** Every section heading from source files is present in the new files, or explicitly dropped with a recorded reason.
2. **Inbound link sweep.** Every reference to legacy files is updated or annotated `<!-- LEGACY: replaced in Phase N -->`.
3. **Cold reader walkthrough.** Read the new files from a fresh perspective, flag any missing steps or unclear cross-references.
4. **Cross-link integrity.** Every internal link resolves either to a new file or an annotated legacy path.
5. **Git hygiene.** Commit on `waratah/develop`, cross-merge to `sakura/develop`, push both.

---

## 9. Style Standards

All new content must follow these rules:

- **UK English spelling throughout.** Examples: organised, behaviour, centralised, summarise, recognise, defence, licence (noun), colour, favour.
- **No em-dashes anywhere.** Substitute with commas, colons, semicolons, parentheses, or split sentences.
- **Voice:** Plain, instructional, second person ("You enter the date in cell B2"). Avoid corporate hedging ("It is recommended that one consider...").
- **Code references:** Use markdown link form `[filename.gs:42](THE WARATAH/SHIFT REPORT SCRIPTS/RunWaratah.js#L42)` when pointing to specific lines.
- **Lists over paragraphs** where steps are involved.
- **One topic per heading.** If a heading covers two distinct topics, split it.

---

## 10. Estimated Effort

| Phase | Tier | Hours | Files Created | Files Archived |
|---|---|---:|---:|---:|
| 1 | Daily User | 3 | 2 (root + daily) | 2 (E, H) |
| 2 | Manager | 6 to 8 | 6 | 4 |
| 3 | Admin | 4 to 6 | 5 | 3 |
| 4 | Developer | 8 to 10 | 7 | 4 |
| **Total** | | **21 to 27** | **20** | **12** |

---

## 11. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI agent routing breaks during transition | Medium | High | Update `CLAUDE_WARATAH.md` and any `.claude/agents/` references at the end of each phase, not all at once. |
| Content lost in merge | Medium | High | Section-by-section audit in validation gate; archived originals preserved. |
| Manager bookmarks point at old `FILE EXPLAINERS/` paths | High | Low | Stub README in old location redirects readers. |
| Both venues drift on docs (Sakura version stale) | Low | Medium | Cross-merge to `sakura/develop` after every commit, per CLAUDE.md rule. |
| Phase 4 dev tier larger than estimated | Medium | Medium | Validation gate after Phase 3 includes re-estimating Phase 4 based on what is left unmoved. |

---

## 12. Implementation Order, Phase 1 Specifics

In sequence:
1. Dispatch parallel research: content extraction from E and H, plus inbound link sweep. (in progress now)
2. Write `docs/waratah/README.md` (root router).
3. Write `docs/waratah/for-daily-users/shift-report-walkthrough.md` (merged from E and H).
4. Create `docs/waratah/_archive/` directory.
5. Move E and H to `_archive/` with archive headers.
6. Create stub `THE WARATAH/FILE EXPLAINERS/README.md`.
7. Update `CLAUDE_WARATAH.md` to point daily-user-tier links to the new path.
8. Run validation gate (content audit, link sweep, cold walkthrough).
9. Commit on `waratah/develop`, cross-merge to `sakura/develop`, push.

---

**End of design document.**
