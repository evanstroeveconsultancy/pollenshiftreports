# Markdown → PDF Viewer

Two ways to turn any `.md` file (including ones with `mermaid` diagrams) into a styled PDF.

## What's in here

- **`Markdown_PDF_Viewer.html`** — Standalone HTML viewer. Double-click to open in your browser, drop any `.md` file onto it, click *Save as PDF*. No install. Requires internet on first open so Mermaid loads from CDN.
- **`build_pdf.py`** — Python script that does the same thing headlessly. Better for batch jobs or when you want consistent output without using a browser.

Both produce the same dark-botanical Pollen styling: Avenir-family stack, dark green accents (`#0f2e23` / `#3f6b4a`), striped tables, page numbers, header on every page, Mermaid diagrams on their own landscape pages.

---

## Option 1: The HTML viewer

1. Double-click `Markdown_PDF_Viewer.html`. Opens in your default browser.
2. Drop a `.md` file onto the page, or click *choose a file*.
3. Diagrams render live. Tables, headings, code, lists all styled.
4. Click **Save as PDF** in the toolbar. Browser print dialog opens. Pick *Save as PDF* as the destination, set margins to *Default*, click Save.

**Notes**
- The first load fetches Mermaid from `cdn.jsdelivr.net`. After that the browser caches it.
- For best print results: Chrome or Safari, A4, default margins, *Background graphics* enabled.
- Wide Mermaid diagrams (aspect ratio > 2.2:1) are auto-tagged to print on landscape pages.

---

## Option 2: The Python renderer

Useful when you want a clean PDF without going through the browser, or when you're scripting a batch.

### Requirements

```bash
pip3 install weasyprint markdown --break-system-packages
```

(On macOS you may also need `brew install pango cairo gdk-pixbuf libffi` for WeasyPrint's text rendering.)

### Usage

```bash
python3 build_pdf.py INPUT.md OUTPUT.pdf \
  --title "Document Title" \
  --eyebrow "Pollen · Project Name" \
  --meta "Last updated 17 May 2026" \
  --html-out OUTPUT.html      # optional, also dumps the intermediate HTML
```

### What it does

1. Reads the source `.md`.
2. Finds each ```` ```mermaid ```` block, POSTs it to `kroki.io` and gets back a PNG.
3. Converts the rest of the markdown to HTML using the Python `markdown` library (tables, fenced code, sane lists).
4. Wraps the HTML in the styled template (the same one the viewer uses).
5. Uses WeasyPrint to render the final PDF, putting each Mermaid diagram on its own landscape page.

### Why PNG (not SVG) for diagrams

Mermaid v11 renders text labels inside `<foreignObject>`, which WeasyPrint can't rasterise. Asking kroki for PNG instead bakes the text into the bitmap, so every label always shows.

### Why kroki.io

It's a public Mermaid rendering service. The alternative is installing `puppeteer + Chromium` locally — heavier setup, same result. If you ever need to work fully offline, install `@mermaid-js/mermaid-cli` (~150 MB) and swap the `render_mermaid` function to shell out to `mmdc`.

---

## Examples Evan has already run

- `Waratah_Backend_Reference.pdf` (17 pages, 2 diagrams on landscape pages) — from `docs/waratah/explainers/03-ADVANCED-Complete-Backend-Reference.md`
- `Waratah_Daily_Shift_Report_Guide.pdf` (6 pages, no diagrams) — from `docs/waratah/for-daily-users/shift-report-walkthrough.md` (Phase 1 canonical; previously sourced from `docs/waratah/explainers/01-BASIC-Daily-Shift-Report-Guide.md`, now archived)

---

## Customising the styling

The styling lives in two places (kept in sync):

- `build_pdf.py` — the `HTML_TEMPLATE` constant near the top, inside the `<style>` block.
- `Markdown_PDF_Viewer.html` — the `<style>` block at the top of the file.

Common tweaks:
- Brand colours: search for `#0f2e23` (dark green ink), `#3f6b4a` (accent), `#cfd9d2` (rules)
- Fonts: search for `Avenir Next` in the `font-family` declaration
- Page size / margins: the `@page` rules at the top of the stylesheet
- Diagram landscape threshold: in `Markdown_PDF_Viewer.html`, search for `2.2` in the `tagWideDiagrams` function
