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
| `5e38d55` | Final implementation consistency audit | `DESIGN.md` now names the implemented shell/map/flow/trust components; `npm run check`, `npm run build`, `git diff --check`, canonical route smoke checks, context-query smoke check, and the one-time Impeccable detector pass completed. Browser screenshot inspection was attempted through the required browser surface but was unavailable, so visual screenshot evidence remains an explicit limitation. |
| `1fa3844` | Make the canonical flow deep-linkable | Added the required `/flows/[flow]` route for `packet-decode`, preserved step state in that route's URL, linked to it from the flow index, and corrected the architecture evidence note to describe the shipped eight-region fixture; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `690ed9f` | Expose hosted snapshot states | Hosted bundle requests now explicitly announce loading, unavailable/error, and valid-empty states; the illustrative fixture is hidden while a requested bundle is unresolved, and failed requests offer recovery instead of silently falling back; checks passed. |
| `704bf95` | Distinguish coverage-limited snapshots | Added typed coverage state and page/rail language for illustrative, verified graph-backed, and graph-backed coverage-limited snapshots; fixture and projection paths now expose the distinction; `npm run check` and `git diff --check` passed. |
| `e81c1ff` | Label map external boundaries | Added explicit `wire input` and `consumers` labels outside the repository map region so entry and exit points are readable without inferring them from position; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `fa29124` | Preserve map and flow history | Architecture selection now encodes level 1 and uses browser history with `popstate` restoration; flow step selection likewise uses history and restores the active step on Back/Forward; checks passed. |
| `a134391` | Make Start here map stages actionable | Replaced decorative macro-stage spans with keyboard-accessible links into each corresponding architecture region at `level=1`, while retaining the compact ordered path and responsive layout; checks passed. |
| `271d8e4` | Add semantic document footer | Added a restrained footer landmark with a contextual Lachesis continuation link and mobile reflow, completing the shell's semantic header/nav/main/aside/footer landmarks without adding competing navigation; `npm run check` and `git diff --check` passed. |
| `61f65e5` | Default flow linear mode on mobile | The accessible all-steps text fallback now opens automatically at the mobile breakpoint, tracks viewport changes, and remains user-toggleable while the guided stepper stays available; `npm run check` and `git diff --check` passed. |
| `3c44c7e` | Add shareable page metadata and links | Added a reusable Copy link control to every page intro and search-friendly title/description, Open Graph, Twitter, author, application, and keyword metadata at the root; `npm run check`, `npm run build`, and `git diff --check` passed. Clipboard behavior remains progressively optional when browser permissions deny access. |
| `2f1a50b` | Add embeddable architecture map | Added a lightweight `/embed` route for README, issue, and social embeds, reusing the bounded map and hosted snapshot states with a clear link back to the full guide; map history now respects the embed route; checks passed. |
| `1b56ee9` | Document shareable embed usage | README now lists the canonical flow and embed routes, explains when to use a normal link versus an iframe, and includes a ready-to-paste iframe snippet; route smoke testing confirmed `/embed` and social metadata (`og:title`, `twitter:card`, `Copy link`). |
| `1fd5446` | Harden share fallback | Copy link now uses the native share sheet when available, falls back to the clipboard, handles user cancellation quietly, and clearly explains when browser permissions make copying unavailable; `npm run check` and `git diff --check` passed. |
| `f9efbf2` | Add focused route metadata | Dynamic architecture-region and flow routes now emit repository/region/flow-specific titles and descriptions for search results and social previews; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `57e2058` | Audit stale vocabulary and crawler access | Stale UI terms are confined to historical/reference documentation or product vocabulary; no deprecated component/mode implementation remains. Added an explicit allow-all `robots.txt` route so public guide pages and embeds remain crawler-discoverable without inventing a deployment hostname. |
| `d761c1e` | Add social preview image | Added a generated Open Graph image with the product thesis and repository architecture vocabulary; configured `metadataBase` from `NEXT_PUBLIC_SITE_URL`/`VERCEL_URL` with a local fallback, and verified `/opengraph-image` prerenders during `npm run build`. |
| `98eb9ed` | Add index route metadata | Architecture, Flows, and Trust indexes now emit repository-specific titles and descriptions for search and social sharing rather than inheriting the generic root title; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `22f9b99` | Fix mobile map boundary labels | The mobile ordered relationship composition now hides spatial-only external boundary labels along with the diagram axes, preventing overlap and preserving a clean linear reading order; `npm run check` and `git diff --check` passed. |
| `b7ea8eb` | Avoid inferred graph relationships | Graph-backed maps no longer fabricate sequential edges when relationship evidence is absent; the map and ordered summary state that relationships are unavailable instead, preserving honest provenance; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `b687cc1` | Add technical article structured data | Root layout now emits JSON-LD `TechArticle` metadata describing the architecture field guide and its publisher, improving technical-document discovery without changing the reading UI; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `30584a8` | Preserve legacy link context | `/map` and `/flow` redirects now carry all incoming query parameters into `/architecture` and `/flows`, preserving selected regions, levels, and flow steps for shared legacy links; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `c09d328` | Add host-aware sitemap | Added a sitemap route for public guide, flow, trust, embed, and illustrative region pages using `NEXT_PUBLIC_SITE_URL`/`VERCEL_URL` with a local fallback; build verified `/sitemap.xml` generation. |
| `57d610a` | Link sitemap from robots | Configured `robots.txt` to advertise `/sitemap.xml` when a public deployment host is available while keeping local development valid without a fabricated hostname; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `339ea95` | Make unknown region links recoverable | Dynamic region chapters no longer 404 when a shared graph-backed region ID is outside the fixture; they explain the missing snapshot context and offer a Lachesis recovery link, avoiding invented architecture facts; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `0b17f51` | Preserve bundle context in region links | Architecture inspector and region-directory links now carry the active opaque bundle ID into focused chapters and Lachesis handoffs, keeping maintainer-shared graph context attached; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `3a94725` | Preserve bundle in fallback handoff | Unknown region chapters now parse their incoming bundle query and retain it in the recovery link to Lachesis, so incomplete graph-backed chapters remain actionable within the original snapshot; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `caaa8ab` | Carry identity through region links | Architecture inspector and directory links now carry repository, revision, and bundle context into region chapters; unknown-region recovery passes all three into Lachesis instead of relying on defaults; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `6452f1e` | Preserve trust filter links | Trust glossary search and category filters now persist as `q`/`kind` URL parameters, restore on open, and remain included when a filtered page is copied or shared; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `e57e5fe` | Restore trust filters from history | Trust glossary listens for `popstate` and restores URL-backed search/category state when navigating browser history, keeping shared review sessions coherent; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `4efb54e` | Make trust category history navigable | Search typing continues to replace the current URL, while deliberate category changes use `pushState`, allowing useful Back/Forward review without creating a history entry for every keystroke; `npm run check` and `git diff --check` passed. |
| `f3af308` | Make social preview repository-neutral | Global Open Graph artwork no longer hardcodes the Suricata fixture name, avoiding misleading previews when Design Map serves another repository; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `d475b78` | Support legacy copy fallback | Copy link now falls back to a temporary textarea/`execCommand` path when the native Clipboard API is unavailable, improving shareability in embedded and older browser contexts; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `11623d1` | Document public metadata host | README now explains that production deployments should set `NEXT_PUBLIC_SITE_URL` (with automatic `VERCEL_URL` support) so sitemap and social metadata never point maintainers at localhost; `npm run check` and `git diff --check` passed. |
| `6c28dcf` | Align product and design vocabulary | Updated Product to the shipped Architecture/Flows/Trust route names and documented Start/embed as distribution surfaces; updated the design system to record IBM Plex Serif as the implemented display face; no UI behavior changed. |
| `cbe862f` | Use Architecture map vocabulary | Updated the durable design guidance from retired “System Map” wording to the shipped Architecture map term, reducing naming drift for future work; `npm run check` and `git diff --check` passed. |
| `238140a` | Add copyable embed snippet | The `/embed` route now includes a compact, host-aware iframe snippet with a Copy embed code action, reducing friction when maintainers place the HLD map in a README or existing document; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `f83ca8e` | Harden embed code copy | Embed code copying now uses Clipboard API with a legacy textarea fallback and a visible unavailable state, matching the resilient Copy link behavior in restricted iframe/browser contexts; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `e424b60` | Add maintainer share copy | README now includes ready-to-adapt framing for README/issues and Twitter/LinkedIn, pointing readers to the architecture map and preserving the product’s “read before source” boundary; `npm run check` and `git diff --check` passed. |
| `1efe59c` | Add README image embed pattern | README now documents a GitHub-compatible linked Open Graph preview image in addition to the iframe, so maintainers can place a clickable HLD visual where iframes are stripped; `npm run check` and `git diff --check` passed. |
| `ba029a2` | Remove obsolete map state branches | Deleted unreachable loading/error banner branches and the unused error style after the explicit state-panel implementation, leaving one authoritative state presentation; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `e21cdab` | Remove legacy map route styles | Deleted unused decorative route/line CSS now that all map connections are data-driven SVG edges, keeping the stylesheet aligned with the current topology model; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `9f17437` | Make embed identity-aware | `/embed` now derives its title, description, heading, and footer state from incoming repository/bundle context, avoiding a misleading Suricata fixture label when a maintainer shares a graph-backed bundle; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `382f836` | Make map identity repository-aware | The accessible map canvas label now derives from the loaded snapshot repository instead of hardcoding Suricata, so hosted bundles do not expose a misleading screen-reader name; `npm run check`, `npm run build`, and `git diff --check` passed. |
| `2bf1b23` | Keep embed surface focused | Moved the README iframe authoring snippet from `/embed` into the full Architecture guide, so an embedded map contains only its repository header, map, accessible relationship summary, and recovery links; `npm run check`, `npm run build`, and `git diff --check` passed. |

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

Static and live route checks performed against the local dev server:

- `/`, `/architecture`, `/architecture/decode`, `/flows`, `/flows?step=ipv4`, `/flows/packet-decode`, `/trust`, `/explore`, `/embed`, `/opengraph-image`, `/robots.txt`, and `/sitemap.xml` returned 200 in the latest route smoke run.
- Legacy `/map` and `/flow` returned redirects to `/architecture` and `/flows`, preserving incoming query context.
- Contextful `/explore?repository=Suricata&revision=8f4c1b2&region=decode&anchor=DecodeEthernet%28%29` rendered `Context ready`, the repository/revision, region, anchor, and Lachesis handoff.
- Contextful `/embed?bundle=b_demo123&repository=Zeek&revision=main` rendered `Zeek architecture`, `Graph-backed bundle requested`, and a Zeek-specific document title; `/embed?bundle=b_demo123` uses the honest generic `Graph-backed repository` label.
- Rendered HTML smoke confirmed `/embed` contains the relationship summary without the README authoring panel, while `/architecture` retains `Use this map in a README` for maintainers preparing an embed.
- Unknown `/architecture/graph%3Amodule%3Aunknown?bundle=b_demo123` returned 200 with `Region context unavailable`, `Continue to Lachesis`, and the preserved bundle ID rather than a false 404.
- `npm run check`, `npm run build`, and `git diff --check` passed after the latest implementation; the build generated 22 routes including the share/discovery surfaces.
- Live browser screenshot inspection was attempted through the required browser surface, but no browser was available; visual screenshot evidence remains an explicit limitation.

## Known prototype limits

- Suricata counts and node facts are fixture data, not yet read from a Lachesis graph endpoint.
- The Lachesis query string is the agreed handoff shape; the explorer must implement its parser and focused-bundle loading.
- The architecture map currently renders eight illustrative regions; the scalable community roll-up engine is the next product slice.
- `/embed` is shareable and bundle-aware, but defaults to the explicitly labeled illustrative fixture until a valid `?bundle=b_…` identifier is supplied.
