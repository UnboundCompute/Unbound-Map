# Design Map visual contract

This file is the implementation companion to `LUNA_UI_UX_REBUILD_GOAL.md`. The Luna brief is the
authority for product behavior; this file keeps future UI work aligned with the shipped field-guide
direction.

## Product character

Design Map is a carefully edited technical field guide: calm, exact, readable, and honest about
what is illustrative versus graph-backed. It is not a SaaS dashboard, graph-analysis console,
marketing page, or source-code browser.

The visual hierarchy comes from repository-specific prose, whitespace, typography, and bounded
relationships. Every page should help a newcomer answer one repository question before opening
the source.

## Tokens

```css
:root {
  --paper: #f4f1ea;
  --paper-deep: #e8e3d9;
  --ink: #202521;
  --body: #4f5c52;
  --muted: #667067;
  --rule: #d3d0c8;
  --signal: #8b4f27;
  --focus: #315c83;
  --map: #ece8df;
  --map-rule: #c8c1b5;
  --sans: 'IBM Plex Sans', sans-serif;
  --serif: 'IBM Plex Serif', Georgia, serif;
  --mono: 'JetBrains Mono', monospace;
}
```

Use a light neutral reading surface by default. Near-black text and one restrained rust signal
color carry selection and action. Use the serif only for editorial headings, the humanist sans for
prose and controls, and mono for revisions, identifiers, files, and symbols. Informational text is
never smaller than 12px; body text starts at 16px.

## Layout rules

- Keep one semantic primary navigation with Start here, Architecture, Flows, and Trust.
- Keep repository, revision, snapshot state, coverage, and provenance visible without developer tools.
- Use document sections and relationship lists rather than equal feature cards.
- Architecture is the only spatial page. Start is orientation; Flows are guided reading; Trust is a glossary.
- Keep the map bounded: nine macro regions, twelve focused children, and twelve initial connections.
- Provide a visible ordered text alternative from the same data as every diagram.
- Mobile is a deliberate reading composition: map/list, linear flow, searchable trust list, and full-width chapters.
- Maintain a 44px minimum target for standalone controls and a visible 3px focus outline.

## Component guidance

Use semantic HTML (`header`, `nav`, `main`, `article`, `section`, `aside`, `footer`) and plain links,
buttons, lists, tables, and disclosures before adding a component abstraction. Interactive map nodes
must expose their label, role, and metric in text. A selected node must update content and URL/history;
hover cannot be the only disclosure.

Keep transitions limited to focus/path state and honor `prefers-reduced-motion`. Do not use
`transition: all`, glow, backdrop blur, decorative gradients, or animated reveals that hide reading
content. The map grid is allowed only as a technical-drawing aid and must never carry meaning alone.

## Explicitly rejected patterns

- Blue dashboard palettes, dark developer-tool shells, green-on-navy accents, or pervasive monospace.
- Bento/card grids as the primary organization, decorative metric walls, or confidence badge swarms.
- Generic copy such as “Unlock insights,” “Explore your codebase,” or “AI-powered understanding.”
- Raw force-directed graphs, file/folder hairballs, freeform dragging as the main task, or function bodies.
- Sticky header + sidebar + inspector stacks that consume the reading viewport.
- Color, position, line width, hover, or motion as the sole carrier of meaning.

## Release gates

Before a UI change is committed, run `npm run check`, `npm run build`, route/interaction smoke, and
`git diff --check`. Verify 375×812, 768×1024, 1024×768, and 1440×1000; test keyboard focus,
200%-equivalent reflow, contrast, reduced motion, loading/error states, and deep-link context.
Record material evidence in `AUDIT.md` as a separate commit.
