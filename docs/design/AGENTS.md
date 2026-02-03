# Design Notes for Neuro

## Purpose
- Capture the Material-inspired UI direction that powers the Neuro marketing/console experience.
- Keep everything in `docs/design` so designers and engineers can find the Pencil source, the guidelines in `DESIGN.md`, and this operating note together.

## Brand & Assets
- Primary logo: the neural brain + document glyph supplied in the latest review. Use it on light backgrounds and pair with white/neutral button treatments (no color overlays). Maintain consistent padding so the glyph never feels cramped.
- Typeface stack: `Outfit` for prominent display text and `Inter` for supporting copy, following the sizes and weights recorded in `DESIGN.md`.

## Color & Material Strategy
- Backgrounds: pure white (#FFFFFF) plus zinc-light fills (#F3F6FF, #EFF3FF) so layers feel airy. Use #1E1B4B for high emphasis footers or CTA ribbons.
- Actions: primary CTAs are #2563EB with white text; secondary CTAs are white-bordered #2563EB strokes with dark text. Avoid additional accent colors beyond the brand palette.
- Shadows: keep surfaces flat. Depth comes from fills, borders, and typographic hierarchy per `DESIGN.md`.

## Layout & Components
- The Pencil layout is componentized: nav bar, hero card, feature grid, insights cards, CTA ribbon. Each frame can map to a reusable React component with slots for copy/metrics.
- Keep vertical spacing consistent (32px between major sections, 20px between sub-groups) and avoid overlapping frames. If you notice UI elements clipping or covering each other, adjust the `y` offsets so each card has breathing room.
- When you add new sections, follow the Material layout blocks (cards with 22–28px radius, 16px padding inside) and keep the width at 1120 while inside the 1200-wide canvas.

## Module inventory
- Document management, permissions management, model lifecycle, LLM management, and user directories each have their own Material cards inside the Modules Panel at `y=1340`.
- RAG tokenization, chunk health, and the LLM chat consoles live inside the Intelligence Hub near `y=1820`; any new observability card should respect the double-column split (RAG on the left, chat on the right).
- The Mini chat and Input bar are intentionally stacked beneath the chat console so they look like floating overlays; only swap their order if you keep the surrounding padding consistent.

## Workflows
- Always edit the master Pencil file at `docs/design/neuro.pen`. After changes, sync the summary here so implementers know what changed.
- Reference `docs/DESIGN.md` for tokens, typography scales, spacing, and component anatomy. This file is the single source of truth for new cards or flows.
- If you export assets (icons, gradients), store them in `docs/design/assets` and mention the path in this AGENTS file so the front-end team can grab them.

## Callouts
- There are a few stacked frames near the bottom of the hero card and features grid; double-check that their z-order matches the intended layout and that interaction hotspots (CTA buttons, stats chips) are not visually occluded.
- Keep Material cues (rounded pills, bold metrics, structured grids) prominent—don’t drift into overly decorative treatments.
