# Luna Implementation Brief: Rebuild Design Map from Scratch

## Status and authority

This is the single implementation brief for the next Design Map frontend. It supersedes the
current frontend composition and the earlier incremental rebuild plan.

The user explicitly approved a from-scratch rebuild. Treat every current route, component,
stylesheet, and visual decision as disposable. Preserve existing code only when it demonstrably
supports the product contract below. Do not polish the current pages; rebuild the information
architecture and reading experience.

## Mission

Build a public, shareable repository field guide that lets a newcomer understand the shape of an
unfamiliar codebase before reading its source.

The experience must make this sequence self-evident:

1. Identify the repository, revision, coverage, and provenance.
2. Learn the repository's dominant structural idea in one sentence.
3. See its major regions and relationships without facing the full graph.
4. Focus one region and understand its responsibility, neighbors, anchors, and important data.
5. Follow one canonical design-level flow through the system.
6. Learn where security and correctness obligations exist.
7. Continue into Lachesis with the exact repository and selected context preserved.

The finished experience must be credible enough to send to an OSS maintainer without an
explanatory email.

## Product contract

Design Map is the generated **table of contents and glossary** for a repository at HLD/LLD
altitude.

| Product | Altitude | Question it answers |
| --- | --- | --- |
| Design Map | Architecture and design | What are the major parts, how do they relate, and where should I begin? |
| Lachesis | Source and symbols | What does this symbol do, who calls it, and what exact path does a value take? |
| Trace | Reviewed findings | Which suspected issues have been adjudicated as real? |

Design Map may show a canonical architectural flow such as packet decode. It must not present a
runtime trace, claim that taint reaches a sink, render function bodies, or become a source-code
browser. Those interactions belong in Lachesis.

The guiding line is **“Read this before the source.”** It may appear once, quietly. It is not a
marketing hero.

## Definition of user success

- After 5 seconds: “Which repository and revision am I looking at, and is this real or a demo?”
- After 30 seconds: “What does this repository do, and what is its dominant architectural shape?”
- After 2 minutes: “Which subsystem should I open for my task, and what does it connect to?”
- After a flow: “Where does this data enter, change form, cross a boundary, and leave?”
- At handoff: “What will Lachesis open, and why am I going there?”

If a reader must understand the product before understanding the repository, the experience has
failed.

## Audience and visitor mode

The primary reader is a developer approaching a large OSS repository for the first time. They may
arrive from a README badge, a maintainer's link, an issue, or a pull request. They are impatient,
uncertain where to start, and unfamiliar with project vocabulary.

Maintainers are the secondary audience. They need the artifact to be accurate, revision-addressed,
honest about limitations, and easy to share. They should not have to defend invented prose or an
opaque AI conclusion.

The visitor mode is **Read**, with a small amount of **Operate** on the spatial map. Comprehension
outranks spectacle.

## Sources of truth

Use sources in this order:

1. This brief and direct user instructions.
2. `../design-map-concept.md` for purpose, boundaries, generation model, and scale.
3. Existing typed snapshot/bundle adapters for facts actually represented in data.
4. `/Users/riyandhiman/.claude/jobs/8d8d2701/tmp/designdoc.html` for the richer Suricata content.
5. `/Users/riyandhiman/.claude/jobs/8d8d2701/tmp/understanding.html` for the useful reading order.
6. The current frontend only as evidence of problems to avoid.

The two Claude HTML files are **content references, not design references**. Do not copy their
single-page layouts, card grids, badges, tiny type, or visual density.

## Mandatory online reference research

The interface must be grounded in observed, current products rather than an invented “developer
tool” aesthetic. Before implementation, view these official references and record the page,
pattern borrowed, screenshot or precise observation, and date in `UI_REFERENCE_NOTES.md`.

| Reference | Borrow | Do not copy |
| --- | --- | --- |
| [IcePanel diagramming](https://docs.icepanel.io/core-features/diagramming) | A shared model shown through bounded levels; drill into a selected object; incoming/outgoing details | Its editing UI, enterprise controls, or authoring chrome |
| [IcePanel flows](https://docs.icepanel.io/visual-storytelling/flows) | Step-by-step playback over the same diagram; highlight the active path; introduce before playback | Presentation controls, excessive tags, or animation-dependent meaning |
| [C4 model](https://c4model.com/) | Explicit abstraction levels and a clear promise about what each diagram includes | Generic C4 boxes as the final identity or one fixed shape for every repository |
| [EventCatalog](https://www.eventcatalog.dev/) | Start broad, then move from domains to systems, services, and messages; several views over one model | Catalog-card density, ownership dashboards, or event vocabulary forced on all repos |
| [CodeSee map exploration](https://docs.codesee.io/docs/explore-your-map) | Begin collapsed; reveal detail on demand; selection, filtering, and a visible path to code | A file/folder hairball, freeform dragging as the main task, or file-level ownership here |
| [Diátaxis](https://diataxis.fr/) | Separate explanation, reference, and guided learning needs | Its four labels as product navigation when repository terms are clearer |
| [GitHub newcomer journey](https://docs.github.com/en/get-started/start-your-journey) | A clear starting point, an ordered journey, and an obvious next step | A large article directory or generic docs homepage |
| [Stripe documentation](https://docs.stripe.com/) | Strong reading hierarchy, persistent context, restrained technical typography, task-led entry | A three-column API-reference shell or irrelevant code samples |
| [GitHub code navigation](https://docs.github.com/en/repositories/working-with-files/using-files/navigating-code-on-github) | Familiar transition from symbols to definitions and references | Rebuilding symbol navigation inside Design Map |
| [Sourcegraph code navigation](https://sourcegraph.com/docs/code-navigation) | Exact source-level continuation and contextual actions | Search-heavy code-intelligence controls on architecture pages |
| [W3C page structure](https://www.w3.org/WAI/tutorials/page-structure/) | Semantic landmarks, logical headings, efficient navigation, document fallback | `application` semantics for the entire page |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Visible/non-obscured focus, contrast, reflow, and operable targets | Treating conformance as a substitute for usability |

Research synthesis:

- IcePanel supplies the **map and flow interaction model**.
- C4 supplies the **bounded abstraction principle**.
- Diátaxis and GitHub Docs supply the **multipage reading model**.
- Stripe supplies the **quality bar for technical reading**, not a visual clone.
- GitHub and Sourcegraph define the **handoff boundary to Lachesis**.
- W3C supplies the **semantic and accessibility floor**.

Reject the generic dark SaaS/dashboard direction previously returned by the local UI design-system
search. Dark cards, green accents, and pervasive monospace reproduce the AI-generated visual
language the user rejected.

## Core experience thesis

The product opens as a repository, not as a product landing page.

The first screen contains only:

1. Repository identity and honest snapshot status.
2. A repository-specific one-sentence structural thesis.
3. A simplified interactive architecture map with an obvious place to begin.

The map is the visual anchor. Prose explains it without competing with it. Detail is progressively
disclosed through routes and focused chapters.

## Information architecture

| Route | Visible label | Reader question |
| --- | --- | --- |
| `/` | Start here | What is this repository, and how should I approach it? |
| `/architecture` | Architecture | What are the major responsibilities and relationships? |
| `/architecture/[region]` | Region name | What does this region own, and where does it connect? |
| `/flows` | Flows | Which canonical journeys explain this system? |
| `/flows/[flow]` | Flow name | How does one meaningful datum or request move through the design? |
| `/trust` | Trust | Where do security or correctness obligations begin and end? |
| `/explore` | Open in Lachesis | What exact context am I carrying into the code explorer? |

Redirect legacy `/map` to `/architecture` and `/flow` to `/flows`. Do not maintain two route
families.

Use one primary navigation with four items: Start here, Architecture, Flows, Trust. On desktop it
may be a compact left rail. On small screens it becomes a conventional menu or short horizontal
route row. Do not duplicate navigation in a sidebar and header. “Open in Lachesis” is contextual,
not a fifth permanent section.

## Global shell

### Repository bar

Show repository owner/name, short revision with access to the full revision, and snapshot state:
illustrative, graph-backed, coverage-limited, stale, or unavailable. Add repository search/switch
only if the data supports it.

Do not show decorative statistics here. Counts belong near the content they qualify. Never claim
“always current” merely because regeneration is intended; show actual revision and generation
time.

### Reading rail

The rail contains the four routes, current-location semantics, and at most one concise snapshot
note. It contains no repeated descriptions, marketing, or second tab set.

### Main document

Each page begins with one direct question or descriptive title, a two-sentence explanation, and a
provenance/coverage note only when it affects interpretation. Do not stack an eyebrow, numbered
badge, category, and title above every heading.

## Page: Start here

This is guided orientation, not a landing page.

```text
┌ repository / revision / snapshot state ───────────────────────────────┐
│ nav rail │ Suricata                                                   │
│          │ Network traffic becomes structured protocol state, then    │
│ Start    │ passes through a wide detection stage before fan-out.      │
│ Arch     │                                                            │
│ Flows    │ [ simplified architecture map — dominant visual ]          │
│ Trust    │                                                            │
│          │ Start with: [Follow a packet]  [Explore architecture]       │
│          │ Coverage and limitation note                               │
└──────────┴────────────────────────────────────────────────────────────┘
```

Required content:

- Repository-specific title; do not headline “Design Map.”
- One structural thesis.
- A simplified map of five to nine macro regions.
- One graph-justified recommended flow.
- One secondary action to open the complete architecture.
- A short provenance note.

Exclude feature cards, “why Design Map,” metric walls, testimonials, and product explanations.
Put methodology behind an unobtrusive About/Method link if needed.

## Page: Architecture

This is the only intentionally spatial page.

### Semantic zoom

- **Level 0 — system shape:** five to nine macro regions and external entry/exit points.
- **Level 1 — region focus:** selected region, four to twelve important children, and its direct
  incoming/outgoing relationships.
- **Level 2 — design anchors:** important entry/boot functions, structures, dispatch sites, and
  representative paths. No function body or raw caller/callee list.

State the visible level in text and encode it in the URL. Browser Back/Forward restores focus.
Every region and flow is deep-linkable.

Selecting a region does not open a small tooltip. On desktop, open a stable adjacent inspector or
navigate to a region chapter while retaining the map. On mobile, navigate to the chapter. Hover
may preview but is never required.

### Diagram rules

- Express the actual shape: pipeline, fan-out, fan-in, mesh, layers, or hubs. Do not force a
  left-to-right pipeline.
- Region size may encode footprint only with a visible metric legend.
- Connection width may encode rolled-up weight only with a bounded, labeled range.
- Never depend on size, width, position, or color alone.
- Keep labels horizontal and readable.
- Place external inputs/outputs outside the repository boundary.
- Distinguish boot/initialization from runtime paths.
- Show at most nine primary regions and twelve primary connections initially.
- At any level, show at most twelve selectable children. Roll up the rest as, for example,
  “Other protocol parsers · 37.”
- Keep layout deterministic for the same snapshot.
- Pan/zoom may assist desktop use but cannot be necessary for comprehension.

### Region chapter order

1. Responsibility in plain language.
2. Why it exists in the system.
3. Inputs and outputs described as data/responsibility.
4. Direct upstream and downstream regions.
5. Important entry/boot anchors.
6. Key structures or state it owns.
7. Representative paths/files.
8. Provenance and coverage.
9. One contextual Lachesis handoff.

Use document sections and a compact relationship list, not generic cards.

### Accessible alternative

Render a visible ordered/nested relationship summary from the same data. Hide decorative routes
from assistive technology. Selecting a summary item and its node performs the same action. The
document remains complete if the diagram fails.

## Page: Flows

The index contains a short list of canonical design journeys, not every possible path. Examples:
“Packet to alert,” “Configuration to initialized engine,” or “Request to response.”

Each flow reuses the architecture model and presents one step at a time.

```text
Flow: How a packet becomes an alert                    Step 2 of 6

[ architecture map with only current and adjacent path emphasized ]

← Previous   Decode network layer                     Next →
             Input: Ethernet payload + EtherType
             Decision: choose an L3 decoder
             Guard: reject a truncated header
             Output: validated IPv4 payload

[ All steps — visible ordered text version ]
```

Requirements:

- Introduce the flow with the complete route at low emphasis.
- Synchronize controls, highlighted objects/connections, narrative, and URL.
- Support Previous/Next and direct keyboard-operable step selection.
- Show the data noun passed between steps.
- Annotate guards, boundaries, and resolved dispatch only when supported.
- Name alternate/parallel paths and let readers select them without rendering a tangle.
- Provide an “All steps” linear mode; default to it on mobile when needed.
- “Open this step in Lachesis” carries step, region, anchor, repository, and revision.

Do not create a vertical stack of equal cards with arrows. Do not represent confidence as a swarm
of pills; state provenance at the relevant fact.

## Page: Trust

Trust is an educational glossary and repository index, not a vulnerability dashboard. Presence of
a source or sink is not a finding.

Structure:

- Short explanation of a trust surface.
- Searchable/filterable index organized by domain.
- Domain detail with meaning, obligation, families, relevant regions, and graph-backed counts.
- Optional selected-domain architecture overlay, secondary to the glossary.

Start with a readable index/list or table, not eight cards. Filters use labels and counts, not
color alone. Selected domains are deep-linkable.

Illustrative taxonomy:

1. Resource lifecycle.
2. Memory safety.
3. Injection.
4. Request forgery and redirection.
5. Object integrity.
6. Filesystem.
7. Cryptography and transport configuration.
8. Resource exhaustion.

For each domain, distinguish meaning, obligation, constructor families, repository presence, and
the explicit non-claim that presence alone does not establish a bug.

## Page: Lachesis handoff

This is a confirmation step, not an advertisement. Show repository/full revision, selected
region/flow step/trust domain, anchor symbol/file, why Lachesis is next, context preserved, one
primary action, and a way back.

Define and test a deterministic URL contract containing the opaque bundle ID where one exists.
Never drop selection context and send the reader to the Lachesis homepage.

## Illustrative Suricata content

Use `designdoc.html` to prove the interface carries substantive repository knowledge. Label it
**Illustrative prototype** until loaded from a verified snapshot.

### Structural thesis and macro path

Suricata is a network intrusion-detection and prevention engine. Raw packets are decoded, grouped
into flows, reassembled, parsed as application protocols, inspected by a wide detection stage, and
emitted as alerts/logs. Its memorable shape is a long pipeline with a broad detection stage in the
middle.

```text
wire → packet decode → flow/stream state → application protocols
     → prefilter/matcher/detection → alerts and output
```

### Regions

- Packet decode.
- TCP stream engine.
- Flow manager.
- Protocol detection.
- Protocol parsers, initially grouped; DNP3, TLS/SSL, and SMTP/FTP appear after focus.
- Detection engine.
- Prefilter.
- Multi-pattern matcher.
- Datasets.
- Output and logging.

This proves progressive grouping: never render all twelve as equal cards on the first view.

### Boot path

Keep initialization separate from packet processing. `SigTableSetup` builds the signature
language through rule-keyword registration. `PostConfLoadedSetup` wires the engine after config
loading.

### First canonical flow: How a packet enters flow state

1. `DecodeEthernet` validates the frame and reads EtherType.
2. `DecodeNetworkLayer` dispatches to the correct layer-three decoder.
3. `DecodeIPV4` / `DecodeIPV4Packet` validates and exposes transport data.
4. `DecodeTCP` validates the transport header.
5. `FlowSetupPacket` attaches the decoded packet to its flow.

Include data passed forward, header/length guards, the untrusted-network boundary, fail-closed
behavior, and the difference between static EtherType dispatch and runtime `StateAlloc` dispatch.
Exact source reading belongs in Lachesis.

### Key structures

- `Packet`: transport protocol, owning flow, and current payload window.
- `Flow`: detected application protocol and per-flow parser state.

Explain why these connect stages; do not render raw structure definitions.

## Data and provenance model

Use or evolve typed models for `RepositorySnapshot`, region hierarchy/relationships, architecture
anchors, flows/steps/branches, trust domains/families/presence, evidence and coverage, and
`LachesisHandoff`.

Every fact must be attributable to graph-derived, repository-text-derived, editorial arrangement,
or illustrative fixture. Do not badge every sentence; provide calm page-level sourcing and
fact-level detail where provenance differs or confidence is limited.

Keep files, symbols, graph nodes, included nodes, communities, and displayed regions distinct.
Never show an undefined number.

Required states:

- Loading.
- Verified graph-backed.
- Illustrative fixture.
- Empty.
- Sparse/one-region.
- Coverage-limited.
- Malformed.
- Expired/unavailable.

Each state needs plain-language interpretation or recovery. Never silently replace failed live
data with a realistic fixture.

## Scalability rules

- Maximum nine macro regions initially and twelve children per focused region.
- Stable “Other …” roll-ups include count and combined footprint.
- Rank by architectural importance from graph facts, not alphabetically or file order.
- Preserve relationships during merging and expose what was summarized.
- Choose a suitable layout for pipeline, hub, layers, fan-in/out, or bounded clusters.
- If spatial confidence is low, prefer a textual hierarchy and conservative diagram rather than
  claiming a meaningful layout.
- Never default to a force-directed hairball.
- The same snapshot produces stable ordering and positions.

Test 0, 1, 8, 30, and 500 regions; a pipeline; fan-out/fan-in; and a flat mesh without a defensible
spine.

## Visual direction

The world is a **carefully edited technical field guide**, not a SaaS dashboard, AI chat surface,
graph-analysis console, or marketing site.

- Calm, exact, and recognizably human-edited.
- Light neutral reading surface by default, not generic navy.
- Near-black text and one restrained signal color for selection/current path.
- Readable humanist sans for interface/prose; mono only for revisions, identifiers, files, symbols.
- Typography and whitespace establish hierarchy before borders.
- A darker technical-drawing map surface is optional only if it improves topology and contrast.
- Sparse consistent SVG icons; accessible names for interactive icons.
- Motion communicates focus/path progression, not decoration.

Human character comes from repository-specific editorial judgment: a truthful structural thesis,
project vocabulary paired with plain language, graph-justified “Start with…” recommendations,
labeled relationships/captions, and honest unknown states. Do not simulate humanity with scribbles,
random rotation, paper texture, jokes, decorative illustration, or chatty AI copy.

### Prohibited patterns

- Equal card or bento grids as primary organization.
- Decorative metrics.
- Excessive pills, badges, tags, colored side borders, gradients, or glows.
- Grid backgrounds without a diagram-reading function.
- Tiny uppercase mono labels as the main hierarchy device.
- More than one competing CTA per section.
- Hover-only disclosure.
- Large sticky header plus sticky sidebar plus sticky inspector.
- Marketing copy inside repository routes.
- Symbol deep-dive inside Design Map.
- Raw force graph.
- Generic copy such as “Unlock insights,” “Explore your codebase,” or “AI-powered understanding.”

## Responsive behavior

Mobile is a different composition, not a squeezed canvas.

- At 375px, show repository identity, structural thesis, and ordered macro path first.
- Architecture becomes a vertical/nested relationship view with optional simplified topology.
- Region selection navigates to a full-width chapter instead of an overlay.
- Flow defaults to linear “All steps” mode with Previous/Next.
- Trust becomes a searchable disclosure list/table with no page-level horizontal scroll.
- Preserve selection and step across viewport changes.

Verify 375×812, 768×1024, 1024×768, and 1440×1000.

## Accessibility requirements

- Semantic header, nav, main, article/section, aside, and footer landmarks.
- One logical `h1`, nested headings, skip link, and `aria-current="page"`.
- Keyboard operation in meaningful focus order.
- Visible focus equivalent to a 2px perimeter, 3:1 state contrast, never obscured.
- Normal text contrast 4.5:1; meaningful non-text diagram elements 3:1.
- Never rely on color, position, line width, or motion alone.
- Standalone controls target 44×44 CSS pixels where practical and never miss WCAG 2.2 AA.
- Body starts at 16px; informational text never below 12px.
- Diagram has an equivalent visible text representation.
- Loading/error updates are announced without stealing focus.
- Reduced motion removes travel/decorative animation but preserves state.
- At 200% zoom, content reflows and remains operable.

## Implementation boundaries

Next.js/React remains suitable. Stay static-first and server-light. Do not add canvas, animation,
state, or component libraries unless a requirement cannot be met cleanly with the platform and the
dependency is justified in the commit.

Prefer semantic HTML and SVG. Keep layout data-driven/deterministic. Server-render reading content;
hydrate only necessary map/flow interactions.

Preserve safe opaque hosted-bundle loading and validated graph adapters if they fit. Rewrite only
with equivalent tests. Preserve unrelated user changes.

Required responsibilities, though names may change:

- Repository shell and snapshot status.
- Primary reading navigation.
- Start-here orientation.
- Bounded architecture projection and deterministic layout.
- Region inspector/chapter and accessible relationship summary.
- Flow selector, stepper, and linear fallback.
- Trust index and domain detail.
- Evidence/provenance note.
- Lachesis handoff builder/confirmation.
- Loading/error/empty/coverage states.

Do not implement System, Flow, and Trust with a `mode` prop on one generic graph. They share data,
not presentation semantics.

## Delivery phases and commits

Every phase ends with a working build and focused commit. Commit audit evidence separately.

### Phase 0 — research and teardown

1. Create `UI_REFERENCE_NOTES.md` from the official references.
2. Record desktop/mobile screenshots or precise observations where available.
3. List current modules to retain, replace, or delete and why.
4. Commit `docs: establish researched rebuild direction`; audit in a separate commit.

### Phase 1 — truth model and routes

1. Finalize typed data/provenance models and fixture boundaries.
2. Establish canonical routes and redirects.
3. Build semantic shell, repository bar, one navigation, and material states without flourishes.
4. Commit `ux: establish repository reading architecture`; audit separately.

### Phase 2 — Start here and Architecture

1. Implement first-run orientation.
2. Implement bounded semantic zoom and deterministic layout.
3. Implement region chapters and accessible relationship view.
4. Validate 0, 1, 8, 30, and 500-community fixtures.
5. Commit Start here and Architecture separately; audit each separately.

### Phase 3 — Flows

Implement flow index, introduction, step playback, alternatives, linear mode, and Suricata decode
flow. Verify deep links/history. Commit `ux: build guided architectural flows`; audit separately.

### Phase 4 — Trust

Implement glossary/index, filtering, domain detail, optional overlay, and eight illustrative domains
with non-finding language. Commit `ux: build trust surface index`; audit separately.

### Phase 5 — Lachesis handoff

Define/render/test the full context contract for regions, flow steps, and trust domains. Commit
`ux: preserve context into Lachesis`; audit separately.

### Phase 6 — visual system and bounded QA

1. Apply the researched direction consistently and remove superseded CSS/components.
2. Run `npm run check` and `npm run build`.
3. Test keyboard, zoom, contrast, reduced motion, focus, errors, and deep links.
4. Capture every route at required viewports; inspect desktop and mobile together.
5. Run once after UI completion:
   `node /Users/riyandhiman/.codex/skills/impeccable/scripts/detect.mjs --json <changed targets>`
6. Fix verified findings in one bounded pass, confirm once, stop polishing.
7. Commit implementation and final audit separately; leave the worktree clean.

## Required end-to-end scenarios

### Newcomer

“Understand how a network packet becomes an alert and find the code transitioning from decode into
flow state.” The reader starts at `/`, follows the suggested flow, focuses `FlowSetupPacket`, and
reaches Lachesis with repository/revision/flow/step/anchor intact.

### Maintainer trust

“Is this current, and which claims are generated versus illustrative?” The answer is visible
without developer tools or an About essay.

### Architecture exploration

“Which parts feed detection, and where does its output go?” Both the selected map and textual
relationship summary answer it.

### Trust education

“What does memory-safety surface mean here, and does presence prove a vulnerability?” The glossary
explains obligation, locations/counts with provenance, and explicitly says no.

## Acceptance criteria

- First viewport is about the repository, not Design Map.
- A recommended starting action is obvious without scanning the page.
- Start, Architecture, Flows, and Trust have different information structures.
- Initial architecture has at most nine regions and remains useful for 500 communities.
- Selection updates meaningful content/URL/history and offers a complete Lachesis handoff.
- Flow controls synchronize map, narrative, URL, and accessible ordered content.
- Trust is educational/indexed and never resembles a vulnerability scorecard.
- No fixture fact can be mistaken for verified evidence.
- No function body, symbol neighborhood, or taint-result UI appears here.
- Mobile has no overlap, precision-only interaction, or viewport overflow.
- Meaning survives without color, hover, animation, or diagram rendering.
- All snapshot/error states are intentionally designed.
- Accessibility and responsive requirements pass.
- `npm run check`, `npm run build`, smoke/interaction tests, and screenshot review pass.
- Superseded components/CSS are deleted rather than buried under overrides.
- Every material change and audit is committed separately.

## Automatic rejection conditions

Reject and return to the relevant phase if:

- It is the current UI with new colors.
- It copies either Claude HTML file as one long page.
- The system map is a card grid, node cloud, or raw force graph.
- The first screen leads with marketing or decorative statistics.
- System, Flow, and Trust are one renamed visualization.
- Mobile shrinks or horizontally scrolls the desktop diagram.
- Selection context is lost on Lachesis handoff.
- It uses dark cards, green accents, tiny mono text, badges, and glows as developer-tool costume.
- Any currency, security, coverage, or confidence claim exceeds available evidence.

## Definition of done

Design Map must feel like a deliberately edited, graph-backed field guide. A newcomer forms a
correct mental model and chooses where to go next; a maintainer trusts the revision and provenance;
and Lachesis preserves the reader's place.

The goal is not “a beautiful architecture page.” The goal is **faster, more trustworthy repository
comprehension than either stale prose or starting from raw source**.
