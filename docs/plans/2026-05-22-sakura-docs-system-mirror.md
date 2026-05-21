# Sakura House Documentation System — Mirror of Waratah Structure

**Created:** 2026-05-22
**Status:** Planning — awaiting user approval before execution
**Owner:** Evan
**Related:** `docs/plans/2026-05-17-waratah-shift-report-sakura-alignment-design.md`

---

## 1. Goal

Restructure existing Sakura House documentation into the same polished 4-audience format Waratah uses at `docs/waratah/`, so that managers, admins, daily users, and developers each have a clean entry point with numbered, scoped documents.

**Out of scope:** writing new feature documentation, generating PDFs (separate pandoc/markdown-to-pdf pass once .md is final).

---

## 2. Source Material (what already exists)

### Sakura FILE EXPLAINERS (`SAKURA HOUSE/FILE EXPLAINERS/`)
| File | Length | Currency | Reuse % |
|------|--------|----------|---------|
| `1_DAILY_SHIFT_REPORT.md` | ~6k words | Mar 18 (stale spots) | 70% |
| `2_TASK_MANAGEMENT.md` | ~11k words | May 21 (current) | 80% |
| `3_WEEKLY_AUTOMATED_EVENTS.md` | ~9k words | May 21 (current) | 75% |
| `4_TROUBLESHOOTING.md` | ~7.5k words | Mar 18 (stale) | 60% |
| `5_CONFIGURATION_REFERENCE.md` | ~13k words | Apr 2 (current) | 85% |

### Sakura technical docs (`docs/sakura/`)
| File | Length | Currency | Reuse % |
|------|--------|----------|---------|
| `CELL_REFERENCE_MAP_SAKURA.md` | ~7k words | Mar 18 | 95% |
| `DEEP_DIVE_ARCHITECTURE_SAKURA.md` | ~12.5k words | May 21 | 90% |
| `INTEGRATION_FLOWS_SAKURA.md` | ~11k words | Apr 2 | 95% |
| `WORKFLOW_WEEKLY_SAKURA.md` | ~14k words | Mar 18 | 95% |

**Total source content:** ~91k words. Average reusability ~83%.

---

## 3. Target Structure (mirrors `docs/waratah/`)

```
docs/sakura/
├── README.md                          ← top-level audience router (NEW)
├── for-daily-users/
│   ├── README.md                      (optional, single-doc tier)
│   └── shift-report-walkthrough.md    ← NEW (currently missing for Sakura)
├── for-managers/
│   ├── README.md                      ← NEW (audience index + glossary)
│   ├── 01-shift-reports.md            ← from FILE EXPLAINERS/1
│   ├── 02-task-management.md          ← from FILE EXPLAINERS/2
│   ├── 03-weekly-automation.md        ← from FILE EXPLAINERS/3
│   ├── 04-staff-and-recipients.md     ← NEW (extract from current 2 + 5)
│   └── 05-troubleshooting.md          ← from FILE EXPLAINERS/4
├── for-admins/
│   ├── README.md                      ← NEW
│   ├── 01-configuration-reference.md  ← from FILE EXPLAINERS/5
│   ├── 02-staff-and-access-management.md ← NEW (assemble from 5 + 2)
│   ├── 03-advanced-troubleshooting.md ← NEW (admin slice of 4)
│   └── 04-deployment-and-clasp.md     ← NEW (mirror Waratah doc)
├── for-developers/
│   ├── README.md                      ← NEW (AI agent routing + critical rules)
│   ├── 01-architecture-and-data-flow.md ← from DEEP_DIVE_ARCHITECTURE_SAKURA
│   ├── 02-cell-reference-and-field-config.md ← from CELL_REFERENCE_MAP_SAKURA
│   ├── 03-integration-pipeline.md     ← from INTEGRATION_FLOWS_SAKURA
│   ├── 04-warehouse-schemas.md        ← NEW (extract from INTEGRATION_FLOWS)
│   ├── 05-rollover-and-triggers.md    ← from WORKFLOW_WEEKLY_SAKURA
│   └── 06-task-management-internals.md ← NEW (mirror Waratah 06)
└── _archive/                          ← move legacy flat docs here
    ├── CELL_REFERENCE_MAP_SAKURA.md
    ├── DEEP_DIVE_ARCHITECTURE_SAKURA.md
    ├── INTEGRATION_FLOWS_SAKURA.md
    └── WORKFLOW_WEEKLY_SAKURA.md
```

---

## 4. Source → Target Mapping

| Target file | Primary source(s) | Action |
|-------------|-------------------|--------|
| `for-managers/01-shift-reports.md` | FILE EXPLAINERS/1 | Restructure, refresh stale "soft launch" AI references, light edit |
| `for-managers/02-task-management.md` | FILE EXPLAINERS/2 | Reuse near-verbatim; verify 8-vs-9 status discrepancy (see §6) |
| `for-managers/03-weekly-automation.md` | FILE EXPLAINERS/3 | Reuse; add May 21 dashboard rebuild menu reference |
| `for-managers/04-staff-and-recipients.md` | FILE EXPLAINERS/2 §Staff, FILE EXPLAINERS/5 §Recipients | Assemble new doc following Waratah/04 layout |
| `for-managers/05-troubleshooting.md` | FILE EXPLAINERS/4 | Strip removed-menu references; refresh for May |
| `for-admins/01-configuration-reference.md` | FILE EXPLAINERS/5 | Reuse; trim manager-overlap content already in for-managers/04 |
| `for-admins/02-staff-and-access-management.md` | FILE EXPLAINERS/5 §Staff, /2 §Webhooks | Assemble |
| `for-admins/03-advanced-troubleshooting.md` | FILE EXPLAINERS/4 (admin-only sections) | Extract log-inspection, trigger-recreation, rollover-recovery only |
| `for-admins/04-deployment-and-clasp.md` | Waratah/04 template + Sakura specifics | Mirror Waratah structure; substitute Sakura paths |
| `for-developers/01-architecture-and-data-flow.md` | DEEP_DIVE_ARCHITECTURE_SAKURA.md | Reuse; reformat to Waratah/01 section order |
| `for-developers/02-cell-reference-and-field-config.md` | CELL_REFERENCE_MAP_SAKURA.md + RunSakura.gs FIELD_CONFIG | Reuse + sync field count (24 fields × 6 days = 144 named ranges per script survey) |
| `for-developers/03-integration-pipeline.md` | INTEGRATION_FLOWS_SAKURA.md | Reuse; reformat |
| `for-developers/04-warehouse-schemas.md` | INTEGRATION_FLOWS_SAKURA §Warehouse + IntegrationHubSakura.gs | Extract; document current 16-col NIGHTLY_FINANCIAL schema (post-April 2 column J deletion) |
| `for-developers/05-rollover-and-triggers.md` | WORKFLOW_WEEKLY_SAKURA.md | Reuse + add trigger inventory table |
| `for-developers/06-task-management-internals.md` | EnhancedTaskManagement_Sakura.gs + Waratah/06 template | NEW — mirror Waratah/06 but for 9-status (if confirmed) workflow |
| `for-daily-users/shift-report-walkthrough.md` | Waratah equivalent + screenshot pass | NEW |

---

## 5. Execution Phases

### Phase 0 — Scaffolding (5 min)
- Create directory tree under `docs/sakura/`
- Move 4 legacy technical docs into `docs/sakura/_archive/`
- Write top-level `docs/sakura/README.md` (audience router)

### Phase 1 — Developer tier (highest reuse, easiest) (~2 h)
Dispatch one Sakura-aware agent in parallel per doc:
- 1.1 `01-architecture-and-data-flow.md`
- 1.2 `02-cell-reference-and-field-config.md`
- 1.3 `03-integration-pipeline.md`
- 1.4 `04-warehouse-schemas.md` (extract from INTEGRATION_FLOWS)
- 1.5 `05-rollover-and-triggers.md`
- 1.6 `06-task-management-internals.md` (verify status workflow first)
- 1.7 `for-developers/README.md`

### Phase 2 — Admin tier (~1.5 h)
- 2.1 `01-configuration-reference.md`
- 2.2 `02-staff-and-access-management.md`
- 2.3 `03-advanced-troubleshooting.md`
- 2.4 `04-deployment-and-clasp.md`
- 2.5 `for-admins/README.md`

### Phase 3 — Manager tier (~1.5 h)
- 3.1 `01-shift-reports.md` (refresh + restructure)
- 3.2 `02-task-management.md`
- 3.3 `03-weekly-automation.md`
- 3.4 `04-staff-and-recipients.md`
- 3.5 `05-troubleshooting.md`
- 3.6 `for-managers/README.md`

### Phase 4 — Daily users tier (~1 h)
- 4.1 `shift-report-walkthrough.md` (fresh write, adapt from Waratah equivalent)

### Phase 5 — PDF generation + git commit (~30 min)
- Run `markdown-to-pdf` skill across all .md to produce companion PDFs (matches Waratah pattern)
- Cross-merge into `waratah/develop` if any shared doc was touched
- Commit on `sakura/develop`; push origin

**Total estimated effort:** 6–7 hours, mostly parallelisable per phase.

---

## 6. Known Discrepancies to Resolve Before Writing

1. **Task workflow status count** — script survey found **9 statuses** in `EnhancedTaskManagement_Sakura.gs` (NEW, TO DO, IN PROGRESS, TO DISCUSS, BLOCKED, DEFERRED, DONE, CANCELLED, RECURRING), but existing FILE EXPLAINERS/2 and `CLAUDE_SHARED.md` describe **8 statuses**. Before writing `for-developers/06-task-management-internals.md` and `for-managers/02-task-management.md`, read the actual `STATUSES` constant in `EnhancedTaskManagement_Sakura.gs` and confirm. RECURRING may be a recurrence flag rather than a status — common source of off-by-one.

2. **NIGHTLY_FINANCIAL column count** — script survey lists 16 columns A-P, but the April 2 deployment note in CLAUDE.md says "schema now 16 columns (A-P) after March 6's expansion to 17 columns minus deleted J". Verify current state matches survey before documenting schema.

3. **Stale "soft launch" references** in `1_DAILY_SHIFT_REPORT.md` — AI insights and anomaly detection were marked soft-launch in March; check current status before migrating.

4. **Removed menu items in `4_TROUBLESHOOTING.md`** — "Send Overdue Summary Now" and "Create Overdue Summary Trigger" were removed April 2; doc still references them.

---

## 7. Style Standards (carry from Waratah docs)

- UK English (organised, behaviour, centralise)
- No em-dashes anywhere (use commas, parentheses, or sentence splits)
- Second-person voice for manager/user docs ("you'll see…", "click…")
- Third-person / reference voice for admin and developer docs
- Numbered file prefix `01-` … `06-`
- Every tier has a README with: audience, scope boundary, links to all docs in tier, what the adjacent tiers cover
- Top-level `README.md` uses "Who are you?" audience-routing model

---

## 8. Acceptance Criteria

- [ ] Directory tree matches §3 exactly
- [ ] All 4 legacy `docs/sakura/*.md` flat docs moved to `_archive/`
- [ ] Existing 5 FILE EXPLAINERS remain in `SAKURA HOUSE/FILE EXPLAINERS/` untouched (operational managers still link there from CLAUDE_SAKURA.md until next pass updates references)
- [ ] Each tier README links to all sibling docs and explains adjacent tiers
- [ ] All 4 discrepancies in §6 resolved with code evidence cited inline
- [ ] PDFs generated for every .md (matches Waratah)
- [ ] `CLAUDE_SAKURA.md` and `CLAUDE.md` updated to reference new docs/sakura/ tree
- [ ] No em-dashes; UK English; lint-clean
- [ ] Cross-merge into `waratah/develop` if any shared file (CLAUDE.md, CLAUDE_SAKURA.md) touched
- [ ] Single commit on `sakura/develop` with message: `docs(sakura): mirror Waratah 4-audience docs structure`

---

## 9. Open Questions for User

1. **Daily user walkthrough** — Waratah has one (`shift-report-walkthrough.md`, 335 lines). Should Sakura get one immediately, or defer to a later pass (it's the only true "new write" in this plan)?
2. **PDF pass** — generate now, or after a manager review of the .md?
3. **Phase ordering** — proposed Dev → Admin → Manager → Daily. Reverse if you prefer to validate manager-facing content first.
4. **Keep `SAKURA HOUSE/FILE EXPLAINERS/`?** Waratah deprecated its `THE WARATAH/FILE EXPLAINERS/` to a 3-file stub (`README.md`, `1_DAILY_SHIFT_REPORT.md`, `2_TASK_MANAGEMENT.md`) once `docs/waratah/` took over. Do the same for Sakura?
