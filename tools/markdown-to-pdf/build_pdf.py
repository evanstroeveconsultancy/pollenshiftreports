#!/usr/bin/env python3
"""
Render a Markdown file (with embedded ```mermaid blocks) into a polished PDF.

Pipeline:
  1. Read the source .md
  2. Find each ```mermaid block, POST it to kroki.io, get back an inline SVG
  3. Convert remaining markdown to HTML (tables, headings, code) with python-markdown
  4. Wrap in a styled HTML shell tuned for print
  5. Use WeasyPrint to render the final PDF

Usage:
  python3 build_pdf.py <input.md> <output.pdf> [--title "Document Title"]
"""

import argparse
import base64
import json
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path

import markdown as md_lib
from weasyprint import HTML, CSS


KROKI_URL = "https://kroki.io/mermaid/png"


def render_mermaid(diagram_source: str) -> str:
    """POST mermaid source to kroki.io and return an inline PNG <img>.

    PNG is used instead of SVG because Mermaid v11 renders text labels
    inside <foreignObject>, which WeasyPrint cannot rasterise. PNG bakes
    the text into the bitmap so it always shows.
    """
    data = diagram_source.encode("utf-8")
    req = urllib.request.Request(
        KROKI_URL,
        data=data,
        headers={
            "Content-Type": "text/plain",
            "Accept": "image/png",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                          "AppleWebKit/537.36 (KHTML, like Gecko) "
                          "Chrome/124.0.0.0 Safari/537.36",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            png_bytes = resp.read()
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"kroki rendering failed ({e.code}): {msg}") from e

    b64 = base64.b64encode(png_bytes).decode("ascii")
    return (
        '<figure class="mermaid-figure">'
        f'<img alt="Diagram" src="data:image/png;base64,{b64}" />'
        '</figure>'
    )


MERMAID_BLOCK = re.compile(r"```mermaid\s*\n(.*?)\n```", re.DOTALL)


def replace_mermaid_blocks(source_md: str) -> tuple[str, int]:
    placeholders: list[str] = []

    def _sub(match: re.Match) -> str:
        diagram = match.group(1)
        rendered = render_mermaid(diagram)
        token = f"@@MERMAID_PLACEHOLDER_{len(placeholders)}@@"
        placeholders.append(rendered)
        return token

    transformed = MERMAID_BLOCK.sub(_sub, source_md)
    # store placeholders on the function for the next pass
    replace_mermaid_blocks.placeholders = placeholders
    return transformed, len(placeholders)


def restore_mermaid(html: str) -> str:
    for i, rendered in enumerate(replace_mermaid_blocks.placeholders):
        token = f"@@MERMAID_PLACEHOLDER_{i}@@"
        # Markdown wraps the bare token in <p>...</p> — strip it
        html = html.replace(f"<p>{token}</p>", rendered)
        html = html.replace(token, rendered)
    return html


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>
  @page {{
    size: A4;
    margin: 18mm 16mm 20mm 16mm;
    @bottom-center {{
      content: "Page " counter(page) " of " counter(pages);
      font-family: "Avenir Next", "Avenir", "Helvetica Neue", Arial, sans-serif;
      font-size: 9pt;
      color: #6b6b6b;
    }}
    @top-left {{
      content: "{title}";
      font-family: "Avenir Next", "Avenir", "Helvetica Neue", Arial, sans-serif;
      font-size: 9pt;
      color: #6b6b6b;
    }}
  }}
  @page diagram {{
    size: A4 landscape;
    margin: 12mm 12mm 14mm 12mm;
    @bottom-center {{
      content: "Page " counter(page) " of " counter(pages);
      font-family: "Avenir Next", "Avenir", "Helvetica Neue", Arial, sans-serif;
      font-size: 9pt;
      color: #6b6b6b;
    }}
    @top-left {{
      content: "{title} — Diagram";
      font-family: "Avenir Next", "Avenir", "Helvetica Neue", Arial, sans-serif;
      font-size: 9pt;
      color: #6b6b6b;
    }}
  }}
  html, body {{
    font-family: "Avenir Next", "Avenir", "Helvetica Neue", Arial, sans-serif;
    color: #1f2421;
    line-height: 1.5;
    font-size: 10.5pt;
  }}
  h1, h2, h3, h4 {{
    font-family: "Avenir Next", "Avenir", "Helvetica Neue", Arial, sans-serif;
    color: #0f2e23;
    page-break-after: avoid;
    line-height: 1.25;
  }}
  h1 {{ font-size: 22pt; margin: 0 0 6pt 0; border-bottom: 2px solid #3f6b4a; padding-bottom: 4pt; }}
  h2 {{ font-size: 16pt; margin: 18pt 0 6pt 0; border-bottom: 1px solid #cfd9d2; padding-bottom: 3pt; }}
  h3 {{ font-size: 12.5pt; margin: 14pt 0 4pt 0; color: #2a4d3a; }}
  h4 {{ font-size: 11pt; margin: 10pt 0 3pt 0; color: #2a4d3a; }}
  p {{ margin: 4pt 0 8pt 0; }}
  ul, ol {{ margin: 4pt 0 8pt 18pt; padding: 0; }}
  li {{ margin: 2pt 0; }}
  code {{
    font-family: "SF Mono", "Menlo", "Consolas", monospace;
    font-size: 9.5pt;
    background: #f1f4f1;
    padding: 1pt 3pt;
    border-radius: 3pt;
    color: #2a4d3a;
  }}
  pre {{
    font-family: "SF Mono", "Menlo", "Consolas", monospace;
    background: #f6f8f6;
    border: 1px solid #cfd9d2;
    border-radius: 4pt;
    padding: 8pt;
    font-size: 9pt;
    line-height: 1.45;
    overflow: hidden;
    page-break-inside: avoid;
    white-space: pre-wrap;
    word-wrap: break-word;
  }}
  pre code {{ background: none; padding: 0; color: inherit; }}
  blockquote {{
    border-left: 3px solid #3f6b4a;
    background: #f2f7f3;
    margin: 8pt 0;
    padding: 6pt 10pt;
    color: #2a4d3a;
    page-break-inside: avoid;
  }}
  table {{
    border-collapse: collapse;
    width: 100%;
    margin: 8pt 0 12pt 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }}
  th, td {{
    border: 1px solid #cfd9d2;
    padding: 4pt 6pt;
    text-align: left;
    vertical-align: top;
  }}
  th {{
    background: #e7eee9;
    color: #0f2e23;
    font-weight: 600;
  }}
  tr:nth-child(even) td {{ background: #fafcfa; }}
  hr {{ border: 0; border-top: 1px solid #cfd9d2; margin: 14pt 0; }}
  strong {{ color: #0f2e23; }}
  .mermaid-figure {{
    margin: 0;
    padding: 0;
    text-align: center;
    page: diagram;
    page-break-before: always;
    page-break-after: always;
    page-break-inside: avoid;
  }}
  .mermaid-figure img {{
    display: block;
    margin: 0 auto;
    max-width: 100%;
    max-height: 175mm;
    width: auto;
    height: auto;
  }}
  .mermaid-caption {{
    page: diagram;
    text-align: center;
    font-size: 10pt;
    color: #4a5d4f;
    margin-top: 6pt;
  }}
  .cover {{
    border-bottom: 2px solid #3f6b4a;
    padding-bottom: 12pt;
    margin-bottom: 18pt;
  }}
  .cover .eyebrow {{
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 9pt;
    color: #6b8773;
    margin-bottom: 4pt;
  }}
  .cover .title {{
    font-size: 26pt;
    font-weight: 600;
    color: #0f2e23;
    line-height: 1.1;
    margin: 0;
  }}
  .cover .meta {{
    font-size: 9.5pt;
    color: #4a5d4f;
    margin-top: 8pt;
  }}
</style>
</head>
<body>
  <div class="cover">
    <div class="eyebrow">{eyebrow}</div>
    <p class="title">{title}</p>
    <div class="meta">{meta}</div>
  </div>
  {body}
</body>
</html>
"""


def build_html(source_md: str, title: str, eyebrow: str, meta: str) -> str:
    transformed_md, n_diagrams = replace_mermaid_blocks(source_md)
    md = md_lib.Markdown(
        extensions=[
            "extra",          # tables, fenced code, footnotes
            "sane_lists",
            "toc",
        ]
    )
    body_html = md.convert(transformed_md)
    body_html = restore_mermaid(body_html)

    print(f"  • Rendered {n_diagrams} Mermaid diagram(s)", file=sys.stderr)

    return HTML_TEMPLATE.format(
        title=title,
        eyebrow=eyebrow,
        meta=meta,
        body=body_html,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_md", type=Path)
    parser.add_argument("output_pdf", type=Path)
    parser.add_argument("--title", default="Complete Backend Reference")
    parser.add_argument("--eyebrow", default="Waratah · Shift Reports 3.0")
    parser.add_argument("--meta", default="Last updated 17 May 2026")
    parser.add_argument("--html-out", type=Path, default=None,
                        help="Also write the generated HTML here (for inspection / re-print).")
    args = parser.parse_args()

    source = args.input_md.read_text(encoding="utf-8")
    print(f"Source: {args.input_md} ({len(source):,} chars)", file=sys.stderr)

    html = build_html(source, args.title, args.eyebrow, args.meta)

    if args.html_out:
        args.html_out.write_text(html, encoding="utf-8")
        print(f"HTML  : {args.html_out}", file=sys.stderr)

    HTML(string=html).write_pdf(args.output_pdf)
    print(f"PDF   : {args.output_pdf} ({args.output_pdf.stat().st_size:,} bytes)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
