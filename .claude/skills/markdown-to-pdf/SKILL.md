---
name: markdown-to-pdf
description: Render a Markdown file (with optional `mermaid` diagrams, tables, code blocks) into a polished PDF styled in Pollen's dark-botanical Avenir palette. Triggers when Evan asks to "turn this md into a pdf", "render this markdown", "convert /path/to/something.md to pdf", "make a pdf from this doc", "print this guide", "/print [path]", or points at any `.md` file with an implied conversion intent. Also triggers when Evan asks to refresh the standalone HTML viewer or the persistent Cowork artifact. Mermaid diagrams render via kroki.io and land on their own landscape pages. Output PDF saves into the workspace folder beside the source MD (or wherever Evan specifies) and is linked back as a `computer://` link.
tags: [markdown, pdf, mermaid, documentation, weasyprint, kroki, pollen-style]
---

# Markdown → PDF Skill

## When to fire

Auto-trigger when Evan:
- Names an `.md` file path with no further context (he almost always means "render it")
- Says "convert", "render", "turn into a pdf", "print", "make a pdf", "save as pdf"
- Asks to update or refresh the standalone viewer / Cowork artifact

Do **not** fire when he asks to *read*, *summarise*, *edit*, *grep*, or *commit* an `.md` file.

## Iron Law: use the existing tooling

There is already a working renderer at `tools/markdown-to-pdf/build_pdf.py` and a standalone HTML viewer at `tools/markdown-to-pdf/Markdown_PDF_Viewer.html`. Do not rewrite either from scratch. Either:

- Run `build_pdf.py` against the source file (default path for headless conversion), or
- Update the existing files if Evan wants the styling/behaviour changed.

If `build_pdf.py` doesn't exist yet (fresh clone, repo wiped), bootstrap it by reading `tools/markdown-to-pdf/README.md` for the design rationale, then recreate following the same approach. Never invent a different pipeline (e.g. don't switch to pandoc + LaTeX, don't shell out to puppeteer, don't try a different mermaid renderer) without a clear reason. The current pipeline is: `markdown` (Python) → `kroki.io` for mermaid PNGs → `weasyprint`. It works.

## Workflow

### Step 1 — Confirm the source file exists

```bash
ls -la "<absolute path to .md>"
grep -c '^```mermaid' "<path>"   # how many diagrams to render
wc -c "<path>"                    # rough size sanity check
```

If the file isn't in a connected workspace folder, call `mcp__cowork__request_cowork_directory` first.

### Step 2 — Decide the output path

Default: save the PDF into the session outputs folder first, then optionally copy to the workspace folder if Evan wants it persisted on disk. For one-off conversions, outputs is fine — link with `computer://`. For docs that belong with the source (e.g. an explainer in `docs/waratah/explainers/`), put the PDF beside the MD with the same basename + `.pdf`.

Naming convention: take the MD basename, strip leading number-dash-prefixes like `03-ADVANCED-` if the result is more readable without them, prepend the venue if it's a venue doc (e.g. `Waratah_Complete_Backend_Reference.pdf`).

### Step 3 — Run the renderer

```bash
cd /sessions/<session>/mnt/outputs    # or wherever you want the PDF
python3 "/sessions/<session>/mnt/SHIFT REPORTS 3.0/tools/markdown-to-pdf/build_pdf.py" \
  "<absolute path to .md>" \
  "<output.pdf>" \
  --title "<Document Title>" \
  --eyebrow "<Venue · Project>" \
  --meta "Last updated <date>"
```

The script prints page count and byte size on success. Diagrams are auto-fetched from kroki — first run may take ~3 seconds per diagram.

### Step 4 — Verify

```bash
python3 -c "import pypdf; r = pypdf.PdfReader('<output.pdf>'); print(len(r.pages))"
```

If the doc has Mermaid blocks, render the first diagram page to PNG and view it to confirm labels are legible:

```bash
python3 -c "from pdf2image import convert_from_path; convert_from_path('<output.pdf>', dpi=110)[<page-index>].save('/tmp/check.png')"
```

Then `Read` the PNG.

### Step 5 — Deliver

Reply with a `computer://` link to the PDF. Keep the message short — page count, diagram count if any, and the link. Avoid a long postamble; Evan can open the file.

If Evan asked to update the Cowork artifact, also call `mcp__cowork__update_artifact` (not `create_artifact`) with the same id — the artifact survives across sessions.

## Known gotchas

| Symptom | Cause | Fix |
|---------|-------|-----|
| `kroki rendering failed (403): error code: 1010` | Cloudflare blocking the default Python user-agent | Renderer already sends a Chrome UA — if this resurfaces, rotate the UA string in `render_mermaid()` |
| Mermaid diagram renders as boxes with no text | SVG `<foreignObject>` (Mermaid v11 default) — WeasyPrint can't rasterise it | Renderer requests PNG from kroki, not SVG. Don't switch back to SVG. |
| Wide diagram squashed unreadable | Aspect ratio > ~3:1 vs portrait page width | Renderer already puts diagrams on landscape pages via the `@page diagram` rule + `.mermaid-figure { page: diagram }` |
| `weasyprint: command not found` | Not installed in the sandbox | `pip3 install weasyprint markdown --break-system-packages` |
| Tables breaking across pages awkwardly | `page-break-inside: avoid` on `<table>` should prevent this | Already set — if it recurs, the table is genuinely too tall for one page; split the source doc |
| PNG preview shows old content | `pdf2image` can't overwrite read-only outputs from a previous run | Write previews into a fresh subfolder (`mkdir -p preview/`) |

## Styling reference (do not drift)

- **Ink**: `#1f2421` body, `#0f2e23` headings
- **Accent**: `#3f6b4a` (rules, accents), `#2a4d3a` (secondary heading)
- **Surfaces**: `#f6f8f6` (code blocks), `#e7eee9` (table headers), `#fafcfa` (alternating rows), `#f2f7f3` (blockquotes)
- **Rules**: `#cfd9d2`
- **Type**: Avenir Next / Avenir / Helvetica Neue / Arial stack; monospace is SF Mono / Menlo / Consolas
- **Page**: A4, 18/16/20/16mm margins (portrait); A4 landscape with 12mm margins for diagram pages
- **Header**: doc title top-left; "Page N of M" bottom-centre — both in the same Avenir stack at 9pt

If Evan asks for a "branded" Pollen/Waratah/Sakura doc, this stack is already the dark-botanical palette he uses. NewEddyDisplay and ABCGaisyr Mono are not available as web fonts in the renderer — fall back gracefully to the Avenir stack and note this to Evan if he asks for those specifically.

## Files this skill owns

- `tools/markdown-to-pdf/build_pdf.py` — Python renderer (single source of truth for styling)
- `tools/markdown-to-pdf/Markdown_PDF_Viewer.html` — standalone browser-based viewer with the same styling
- `tools/markdown-to-pdf/README.md` — user-facing how-to

Keep all three in sync when styling changes. If the Python template and the HTML viewer's `<style>` block drift, future Evan will get inconsistent PDFs depending on which path he uses.
