# Design Map audit log

This prototype is intentionally a fixture-backed HLD surface. Each implementation commit was verified before moving to the next slice.

## Commits

| Commit | Change | Evidence |
| --- | --- | --- |
| `1206ab1` | Next app scaffold, HLD shell, map fixture, three lenses | `npm run build` passed |
| `d017257` | README, ignore rules, lockfile and TypeScript config normalization | clean repository after commit |
| `f6a171e` | Responsive map path for small screens | Playwright: `390px` viewport, `scrollWidth - clientWidth = 0` |
| `3e61dd6` | Pin Turbopack to this repository | `npm run build` passed without workspace-root warning |
| `a93f664` | Context-preserving Lachesis handoff | Playwright verified generated `repo`, `commit`, `focus`, and `anchor` query parameters |
| `2efa208` | Distinct System, Data Flow, and Trust Surface reading models plus newcomer guidance | `npm run check`, `npm run build`, Playwright verified lens-specific helper text and labels at mobile width |
| `1564feb` | First-viewport reading rail and explicit “Start with the system map” CTA | Playwright verified CTA anchor navigation, three rail steps, and zero mobile overflow |
| `f8207d5` | Point-of-reading provenance status and expandable evidence explanation | Playwright verified `Graph-backed` status, disclosure expansion, evidence copy, and zero mobile overflow |
| `a053424` | Typed Lachesis graph-first bundle adapter | `npm run check` and `npm run build`; adapter preserves indexed-vs-included counts and projected-subset limitations |
| `5da2f52` | Safe opaque hosted-bundle loader | `npm run check` and `npm run build`; loader validates IDs, rejects redirects, caps body size, and handles expiry/malformed JSON |
| `4b55c54` | Transparent hosted loading, identity, coverage, and error states in the HLD page | Playwright verified invalid bundle IDs produce an accessible alert, default pages remain fixture-ready, and mobile overflow stays at zero |
| `7fe9963` | Deterministic bounded projection from Lachesis modules to HLD regions | `npm run check` and `npm run build`; projection ranks top-level modules by footprint and emits an explicit remainder roll-up |
| `4d07d04` | Render projected hosted region labels and footprints in the HLD canvas | Playwright fulfilled a mocked graph-first bundle and verified live repository/revision metadata, three projected region labels, and module footprint text |
| `9952590` | Capture product context and persist the UI/UX Pro Max design system | PRODUCT.md records audience, boundaries, evidence, and accessibility commitments; generated MASTER.md records typography, palette, spacing, and anti-pattern checks |
| `48730c0` | Split the single dashboard into documentation routes with a human-authored reading rail | `npm run check`, `npm run build`, and local HTTP smoke tests returned 200 for `/`, `/map`, `/flow`, `/trust`, and `/explore`; Impeccable detector findings were reduced to the permitted map-canvas grid advisory |
| `06047cf` | Preserve hosted-bundle loading, error, and graph-backed status in the new map surface | `npm run check` and `npm run build` passed; map client still validates the hosted transport through the existing adapter and announces loading/error/ready states |
| `795c946` | Add a scalable region directory beneath the bounded spatial projection | `npm run check` and `npm run build` passed; hosted projections can expose all bounded regions in a readable list while the canvas stays limited to four placed regions |
| `1a7f60e` | Keep the spatial canvas on its newcomer-safe fixture when a hosted projection is too sparse to place | `npm run check` and `npm run build` passed; empty or single-region projections no longer leave the inspector without a selected region |
| `0351079` | Document the multipage route model in the repository handoff | README now names all five routes and the map/explorer boundary |
| `dc113df` | Audit the current UI/UX and write Luna's replacement implementation goal | `LUNA_UI_UX_REBUILD_GOAL.md` records a 5-dimension 8/20 audit, 14 prioritized findings, a phased commit plan, and measurable acceptance criteria; `npm run check` and `npm run build` passed before the report was committed |
| `a2d636e` | Establish honest repository view models and isolate illustrative Suricata content | `npm run check` and `npm run build` passed; `RepositorySnapshotView` carries provenance/coverage/limitations, `illustrative-suricata.ts` is explicitly non-live, and hosted map handoff uses the same typed snapshot context |
| `624f24e` | Replace the competing CSS layers with one warm technical editorial visual system | `DESIGN.md` defines Read-mode layout/type/tokens/interaction gates; legacy CSS was removed, mobile nodes now use a verified single-column flow, focus and touch sizing were added, and detector findings were reduced to the permitted map grid advisory after the font finding was corrected |
| `1d3b288` | Give Data Flow a distinct ordered reading surface | `FlowDiagram` renders four data nouns, handoffs, guards, region ownership, and symbol-specific Lachesis links; `npm run check` and `npm run build` passed |
| `3a96cbb` | Give Trust Surface its own glossary/index | `TrustGlossary` renders source/guard/sink kinds, plain-language obligations, repository locations, and anchor-specific Lachesis links; `npm run check` and `npm run build` passed |
| `111943b` | Replace Luna's incremental UI plan with a researched, from-scratch implementation specification | The brief defines product boundaries, authoritative inputs, 12 official online references, canonical routes, page-level interaction contracts, semantic zoom limits, responsive and accessible alternatives, Suricata proof content, staged commits, end-to-end tasks, acceptance criteria, and automatic rejection conditions; `git diff --check` passed before commit |
| `158a661` | Record the researched UI references and frontend teardown/retain decision | `UI_REFERENCE_NOTES.md` links the official references, names the observed interaction pattern, records the Design Map decision, and separates replaceable presentation from retained adapters; `git diff --check` passed |
| `1ed525c` | Establish the canonical repository reading architecture | `/` is repository-first Start here; `/architecture` and `/flows` are canonical pages; `/map` and `/flow` redirect; navigation is centralized in the new shell; Explore is explicitly a handoff confirmation surface; `npm run check` and `npm run build` passed |
| `bed786a` | Replace the documentation visual system | Replaced the global stylesheet and route composition with a single light technical-editorial world, one repository shell, no duplicated tabs, map/list mobile reflow, semantic landmarks/focus styles, and route-specific document sections; `npm run check`, `npm run build`, and `git diff --check` passed |
| `6da06d1` | Build the bounded, data-driven Architecture surface | Suricata fixture now has eight meaningful regions with roles, relationships, children, anchors, and a separate boot path; the map draws metadata-backed edges, has a visible text relationship summary, supports `/architecture/[region]`, preserves hosted loading, and switches to ordered content on mobile; `npm run check`, `npm run build`, and `git diff --check` passed |
| `389c404` | Build guided architectural flows | Flow steps now describe the Suricata decode handoffs with data nouns, decisions, guards, anchors, synchronized progress state, URL step deep links, Previous/Next controls, and an accessible all-steps fallback; `npm run check`, `npm run build`, and `git diff --check` passed |
| `eb33ce3` | Build the trust surface glossary/index | Trust now uses eight explicit domains with meaning, obligation, constructor families, locations, search/filter controls, deep links, and non-finding language; `npm run check`, `npm run build`, and `git diff --check` passed |
| `e64d057` | Preserve selected context into Lachesis | `/explore` now parses incoming repository/revision/region/label/anchor/flow/domain/bundle context, renders a confirmation summary, and builds a fixed-origin Lachesis URL without dropping context; `npm run check`, `npm run build`, and `git diff --check` passed |
| `b10f86c` | Resolve the Impeccable detector's mechanical flow warning | Replaced animated `width` with transform-based progress scaling and preserved the intentional map grid advisory; `npm run check`, `npm run build`, and `git diff --check` passed |
| `99fdce4` | Remove superseded UI vocabulary and align README routes | Deleted unused legacy flow/trust CSS and the obsolete three-entry trust model, removed stale `mode`/tab vocabulary from the tree, and documented canonical routes plus redirects in README; `npm run check`, `npm run build`, `git diff --check`, and stale-pattern search passed |

## Rebuild brief audit

The Luna brief was reviewed as a specification rather than as shipped UI.

- **Ambiguity:** Pass. Each route names its reader question, required content, interaction model,
  responsive behavior, and exclusions.
- **Research traceability:** Pass. Official sources are linked inline and every reference says what
  to borrow and what not to copy. Luna must create a dated visual research record before coding.
- **Product boundary:** Pass. Design-level canonical flows remain in Design Map; function bodies,
  symbol neighborhoods, runtime taint tracing, and findings remain in Lachesis/Trace.
- **Scalability:** Pass. The specification bounds initial regions, focused children, and
  connections; requires stable roll-ups and fixtures spanning zero to 500 communities; and rejects
  a force-directed hairball.
- **Content sufficiency:** Pass. The useful Suricata thesis, macro path, subsystem inventory, boot
  path, decode flow, dispatch distinction, key structures, and trust taxonomy are retained without
  copying either Claude mockup's layout.
- **Implementation authority:** Pass. The current frontend is explicitly disposable while safe
  bundle loading and validated graph adapters are preserved when suitable.
- **Verification:** Pass for documentation. `git diff --check` completed without whitespace errors;
  the document includes build, interaction, accessibility, screenshot, and clean-worktree gates for
  implementation.

## Current checks

```bash
npm run check
npm run build
```

Browser smoke checks performed against the local dev server:

- Document title: `Design Map — Read this before the source`
- H1: `See the system before you read it.`
- Three accessible tabs are rendered.
- Four map nodes are rendered.
- Clicking `Detection engine` changes the selected-region inspector.
- Clicking `Trust surface` changes the lens caption.
- Mobile viewport has no horizontal overflow.
- `prefers-reduced-motion` disables long transitions.
- System Map, Data Flow, and Trust Surface each change the user-facing reading model, not only the tab label.
- The first screen tells a newcomer what to do next and the handoff button names the destination explicitly.
- The first viewport exposes the complete reading sequence: Orient → Choose → Verify.
- The primary CTA navigates to the map without requiring the reader to guess where to start.
- The selected claim exposes its evidence status before the reader opens the code-level explorer.
- “How this map was made” is available as a disclosure rather than forcing methodology into the primary reading path.
- The home page is a concise orientation document; each route answers one question and links to the next depth.
- A persistent sidebar carries route context, snapshot facts, coverage, and the Lachesis handoff.
- Live browser visual inspection was unavailable in this environment; route/build/static checks were used instead.

## Known prototype limits

- Suricata counts and node facts are fixture data, not yet read from a Lachesis graph endpoint.
- The Lachesis query string is the agreed handoff shape; the explorer must implement its parser and focused-bundle loading.
- The system map currently renders four illustrative regions; the scalable community roll-up engine is the next product slice.
