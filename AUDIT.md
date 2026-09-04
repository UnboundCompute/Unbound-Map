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
