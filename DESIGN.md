# Design Map visual system

<!-- impeccable:design-system 1 -->

## Direction

Design Map is a repository field guide. The visual mode is **Read**: typography and sequence do the work, while the system map is the only deliberately spatial surface.

The chosen world is **warm technical editorial**:

- Paper-like background: a quiet warm neutral, not a white SaaS canvas.
- Near-black ink for claims and headings.
- One restrained signal color for links, selection, and the current path.
- A humanist sans for prose and a mono only for identifiers, measurements, revisions, and code anchors.
- Hairlines appear only where the document has a real boundary: navigation, tables, route steps, and map frames.
- No gradients, glows, decorative metrics, generic icon cards, or ornamental grid outside the map canvas.

The map should feel like a careful technical drawing printed into the document—not a dashboard bolted onto it.

## Type

- Body: IBM Plex Sans, 16px base, 1.55–1.7 line-height, 65–75ch measure.
- Display: a sourced characterful display face selected before implementation; do not default to a platform/system face.
- Identifiers: JetBrains Mono, 11–13px, only where the value is a file, symbol, revision, count, or URL.
- No informational text below 12px.
- Heading tracking never tighter than `-0.04em`.
- Heading scale should have visible steps: page title, section title, item title, metadata.

## Color tokens

Use tokens in components; raw color literals belong only in this file or the token declaration.

```css
:root {
  --surface-page: #f4f1ea;
  --surface-raised: #ebe7de;
  --surface-map: #111914;
  --ink-strong: #202521;
  --ink-body: #4f5c52;
  --ink-muted: #667067;
  --ink-on-map: #e3e6dc;
  --rule: #d3d0c8;
  --rule-map: #334238;
  --signal: #9a5c2f;
  --signal-map: #c9a76a;
  --focus: #315c83;
  --error: #9b3e2f;
}
```

Normal text pairs must meet 4.5:1. Large text must meet 3:1. Muted tokens are not exempt because they are small; if a label is not important enough to make readable, remove it.

## Layout

- Desktop: one reading column with a 240–260px documentation rail.
- The overview should use editorial sections and a deliberate reading order, not a hero-plus-card dashboard.
- The System Map may use a map frame and inspector, but it must have an adjacent ordered text summary for keyboard and mobile readers.
- Flow is an ordered vertical or horizontal narrative; Trust is a filterable glossary/index.
- Keep generous whitespace around sections. Avoid equal-height card matrices.
- Mobile below 768px: the rail becomes a horizontal, scrollable navigation row; map geometry becomes an ordered list or a verified single-column path. Never depend on absolute positioning for comprehension.
- All content must fit 375px without viewport-level horizontal overflow.

## Interaction

- Primary links have a minimum 44×44px hit area and a visible focus ring using `--focus`.
- Active route uses both visual styling and `aria-current="page"`.
- Map selection is keyboard-operable and updates a nearby inspector plus the ordered summary.
- Loading, error, empty, sparse, and coverage-limited states are plain-language states with recovery guidance.
- Motion is sparse: selection and route transitions may use transform/opacity with an authored cubic-bezier; reduced motion removes movement while preserving state contrast and focus.
- Decorative map geometry is `aria-hidden`; meaning is carried by text.

## Content rules

- Every page opens with the question it answers, not a slogan.
- Every generated fact carries repository, revision, coverage, and provenance.
- Fixture content is visibly labeled “Illustrative prototype” and never uses live-sounding metadata without that label.
- A region description says what it owns and points to an anchor. It does not claim a security finding.
- Handoff links preserve repository, revision, region, anchor, and opaque bundle ID.
- “Files,” “symbols,” “indexed nodes,” and “included nodes” are separate metrics; never substitute one for another.

## Component vocabulary

Prefer these primitives:

- `DocsShell`: repository identity, one primary navigation, snapshot provenance.
- `PageIntro`: question heading, concise explanation, source/provenance note.
- `EvidenceNote`: generated vs editorial vs illustrative distinction.
- `MapFrame`: spatial HLD only.
- `OrderedPath`: flow and mobile map fallback.
- `GlossaryList`: trust surfaces with kind, obligation, location, anchor.
- `HandoffPanel`: the selected context and a single Lachesis action.

Avoid generic `Card`, `Badge`, `Metric`, or `DashboardPanel` primitives unless the content model proves they are necessary.

## Quality gates

Before calling a surface ready:

1. Read the first viewport aloud: a newcomer should know what this is and where to start.
2. Test the full reading sequence with keyboard only.
3. Test fixture, graph-backed, empty, sparse, malformed, expired, and coverage-limited states.
4. Verify 375×812, 768×1024, and 1440×1000 screenshots.
5. Verify no map collision and no horizontal overflow.
6. Verify contrast and 44px hit areas.
7. Run the Impeccable detector once after the UI is complete and fix verified findings in one bounded batch.
