# Luna Goal: Rebuild Design Map as a Trustworthy Reading Tool

## Goal

Replace the current interface and content system with a clear, credible documentation experience for a newcomer entering an unfamiliar repository.

The result must make this sequence obvious without explanation:

1. Understand what the repository does and the revision being described.
2. Learn the few major regions and what each owns.
3. Follow one concrete design-level path through those regions.
4. Understand where trust obligations begin or end.
5. Continue into Lachesis with repository, revision, region, and symbol context intact.

This is a **replacement**, not a polish pass. Preserve the product boundary, typed bundle adapter, hosted-bundle safety, and route separation. Replace the current content hierarchy, visual system, map presentation, and handoff UX.

## Product truth

Design Map is a generated table of contents and glossary at HLD/LLD altitude. It is not a graph explorer, source viewer, or findings dashboard.

- Design Map answers: “What are the major parts, how do they relate, and where should I begin?”
- Lachesis answers: “What does this symbol do, who calls it, and what exact path does this value take?”
- Trace answers: “Which reviewed findings are real?”

Do not invent repository facts. Fixture content must say it is illustrative. Graph-backed claims must expose repository, revision, coverage, and limitations at the point of reading.

## Current audit

### Audit health score

| Dimension | Score | Key finding |
| --- | ---: | --- |
| Accessibility | 2/4 | Multiple 9–11px labels fail contrast; several links are below a 44px touch target. |
| Performance | 3/4 | The app is small and statically rendered, but dead legacy CSS and unnecessary client map instances remain. |
| Responsive design | 1/4 | Mobile node-position selectors do not match the rendered buttons, causing the four map nodes to overlap. |
| Theming | 1/4 | Two unrelated visual systems and dozens of raw colors coexist in one stylesheet. |
| Implementation integrity | 1/4 | Fixture metadata reads as real, three lenses reuse one map, and the Lachesis handoff drops its context. |
| **Total** | **8/20** | **Poor — major overhaul required** |

Implementation integrity verdict: **Fail.** The current implementation does not yet express a coherent product-specific reading system. The multipage routes are useful scaffolding, but the content and map semantics remain interchangeable with a generic architecture template.

Issue count: **0 P0, 6 P1, 6 P2, 2 P3**.

### P1 — fix before showing maintainers

#### 1. Fixture data is presented as verified repository evidence

- **Locations:** `app/components/DocsShell.tsx:20`, `:35-39`; `app/components/MapClient.tsx:10-14`; `app/page.tsx:5`.
- **Impact:** A maintainer cannot tell whether `suricata · main`, revision `8f4c1b2`, `12,486 nodes`, file counts, and responsibilities came from a real graph. This damages the core promise of determinism.
- **Fix:** Introduce a single snapshot state with `fixture | graph-backed` provenance. Label fixture screens “Illustrative prototype.” Render repository identity, commit, counts, coverage, and limitations only from the loaded snapshot.
- **Suggested command:** `$impeccable clarify`

#### 2. System Map, Data Flow, and Trust Surface are the same visualization

- **Locations:** `app/flow/page.tsx:6`, `app/trust/page.tsx:6`, `app/components/MapClient.tsx:45-53`.
- **Impact:** Changing routes mostly changes headings and one toolbar label. Readers do not learn a flow or a trust boundary; the product promise feels fake.
- **Fix:** Give each route its own content model and visual grammar:
  - System Map: regions, ownership, boot/entry anchors, rolled-up interactions.
  - Data Flow: ordered handoffs, data noun at each step, guard/dispatch annotations, start/end.
  - Trust Surface: sources, guards, sinks, obligation text, taxonomy/filtering.
- **Suggested command:** `$impeccable shape`

#### 3. Map nodes overlap on mobile

- **Location:** `app/globals.css:183`.
- **Evidence:** The CSS targets `.map-node:nth-of-type(5..8)`, but there are only four button elements of that type. Inline `top: 44%` values therefore remain for all nodes after `left` is forced to `58px`.
- **Impact:** The primary product surface becomes unreadable on phones.
- **Fix:** Do not repair this with positional selector tricks. Render mobile as an ordered semantic path/list, or calculate positions through data-backed CSS custom properties with verified non-overlap.
- **Suggested command:** `$impeccable adapt`

#### 4. The Lachesis handoff loses the selected context

- **Locations:** `app/components/MapClient.tsx:59`; `app/explore/page.tsx:5`.
- **Impact:** The map links to `/explore?symbol=…`, but the explore page ignores the symbol and opens the Lachesis homepage without repository, revision, region, or anchor. The user has to start over.
- **Fix:** Define and test one handoff URL contract. Echo the selected context on `/explore`, then pass it into Lachesis. Preserve opaque hosted bundle ID where available.
- **Suggested command:** `$impeccable harden`

#### 5. Small low-contrast text fails basic readability

- **Locations:** `app/globals.css:156-172`, `:178-180`, `:189-191`.
- **Evidence:** Measured contrast on the paper surface: `#898c84` = 3.03:1, `#7d8279` = 3.49:1, `#85887f` = 3.20:1, `#a7a79e` = 2.15:1. These colors are used at 9–11px.
- **Impact:** Navigation notes, tabs, snapshot metadata, node metadata, and directory counts are difficult to read and fail WCAG 1.4.3 for normal text.
- **Fix:** Set a 12px floor for auxiliary text, 14–16px for explanatory text, and use token pairs with at least 4.5:1 contrast.
- **Suggested command:** `$impeccable typeset`

#### 6. Competing legacy and documentation styles create visual corruption

- **Locations:** `app/globals.css:1-144` and `:146-192`.
- **Evidence:** The obsolete dark prototype and the newer paper documentation world are both global. `.brand-mark::before/::after` from the old system still applies to the new bar-mark component.
- **Impact:** The interface looks assembled from iterations rather than designed as one system; selectors can alter unrelated current components.
- **Fix:** Remove unused legacy rules, scope the surviving map surface, and rebuild tokens/components from one documented design system.
- **Suggested command:** `$impeccable document`

### P2 — fix in the rebuild

#### 7. Navigation is duplicated without a clear hierarchy

- **Locations:** `DocsShell.tsx:23-31`, `:47-50`.
- **Impact:** Sidebar navigation and top tabs repeat the same three destinations, consuming space while still omitting overview as an explicit item.
- **Fix:** Use one primary docs navigation. Add a compact next/previous reading control inside documents if sequence support is needed.
- **Suggested command:** `$impeccable distill`

#### 8. Current-route semantics are missing

- **Locations:** `DocsShell.tsx:27`, `:49`.
- **Impact:** Visual active state exists, but assistive technology is not told which page is current.
- **Fix:** Add `aria-current="page"` to the active route and retain a visible focus ring independent of hover styling.
- **Suggested command:** `$impeccable harden`

#### 9. Primary navigation and CTAs have undersized touch targets

- **Locations:** `app/globals.css:158`, `:168`, `:174`, `:177`, `:179`.
- **Impact:** Tabs and text links can be roughly 24–40px tall, making them error-prone on touch devices.
- **Fix:** Give every standalone interactive target a minimum 44×44px hit area without inflating all visible typography.
- **Suggested command:** `$impeccable adapt`

#### 10. Map semantics are incomplete

- **Locations:** `MapClient.tsx:49-53`.
- **Impact:** The canvas has an `aria-label` but no semantic role or textual relationship model. Decorative grid/routes/axes remain in the accessibility tree, and color dots have no declared meaning.
- **Fix:** Provide a visible ordered relationship summary and hide decorative geometry. Ensure map comprehension never depends on color or absolute position alone.
- **Suggested command:** `$impeccable harden`

#### 11. Reduced-motion handling removes all useful feedback

- **Location:** `app/globals.css:144`.
- **Impact:** A global `0.01ms` kill eliminates state-change continuity rather than providing an intentional low-motion alternative.
- **Fix:** Disable decorative entrance/translation only. Preserve immediate color, outline, and content-state feedback.
- **Suggested command:** `$impeccable animate`

#### 12. Hosted projection vocabulary is inconsistent

- **Locations:** `MapClient.tsx:36`, `:40`, `:62`.
- **Impact:** Fixture rows call footprints “files,” hosted rows call them “nodes,” and the UI uses both as if they are comparable. The inspector description remains fixture copy after hosted labels replace the region name.
- **Fix:** Define explicit metrics (`files`, `symbols`, `included nodes`) and never reuse fixture descriptions for hosted regions.
- **Suggested command:** `$impeccable clarify`

### P3 — finish after the core experience works

#### 13. Source files are difficult to review

- **Locations:** all route `page.tsx` files and `MapClient.tsx:45-62`.
- **Impact:** Entire pages and complex branches are compressed onto single lines, making content review and regressions harder to spot.
- **Fix:** Format components around semantic sections and extract data definitions from rendering.
- **Suggested command:** `$impeccable polish`

#### 14. The decorative map grid is a familiar generated-UI signature

- **Locations:** `app/globals.css:86`, `:178`.
- **Detector result:** Advisory only. A grid is defensible on a real spatial map, so this is not automatically a defect.
- **Impact:** Combined with generic node cards and glowing dots, it contributes to the “AI-generated” impression.
- **Fix:** Keep a measurement grid only if the final map layout uses it functionally; otherwise prefer restrained topology lines and whitespace.
- **Suggested command:** `$impeccable quieter`

## What is worth preserving

- The routes `/`, `/map`, `/flow`, `/trust`, and `/explore` correctly separate reading tasks.
- Native links and buttons provide a reasonable semantic foundation.
- Hosted loading uses text status/error states and an abort signal.
- The graph adapter bounds large community sets and exposes an explicit remainder roll-up.
- The app has no image payload, no animation library, and builds as static pages.
- The map inspector uses `aria-live`, selected buttons expose `aria-pressed`, and reduced motion was considered even though the current implementation is too blunt.

## Required replacement direction

### Experience model

The surface is a **repository field guide**, not a dashboard and not a marketing landing page.

- Use a single calm reading column with a compact repository rail.
- Let the system map be the one genuinely spatial surface.
- Render flow as an ordered narrative diagram.
- Render trust as a glossary/index with precise obligation language.
- Make “generated fact,” “editorial arrangement,” and “illustrative fixture” visibly different states.
- Prefer authored hierarchy, whitespace, typography, and topology over cards, badges, glows, and ornamental grids.

### Content model

Each page must answer a concrete newcomer question.

| Route | Question | Required content |
| --- | --- | --- |
| `/` | What is this repository and how should I read this map? | One sourced overview, snapshot provenance, three-entry reading sequence, limitations. |
| `/map` | What are the major responsibilities and how do they interact? | Regions, responsibilities, footprint metric, anchors, entry/boot points, rolled-up edges. |
| `/flow` | What happens to one meaningful value/request? | Named path, ordered data nouns, handoffs, guards, resolved dispatch, start/end anchors. |
| `/trust` | Where do security or correctness obligations start? | Source/guard/sink taxonomy, plain-language obligation, repo locations, counts with provenance. |
| `/explore` | What should I open in Lachesis? | Selected repo/revision/region/symbol, why it was selected, context-preserving external link. |

### Visual direction

Choose one visual world and document it in `DESIGN.md` before implementation. Recommended direction:

- Warm technical editorial surface: off-white paper, dense near-black type, one restrained signal color.
- A distinctive humanist body face with a precise mono only for identifiers and metadata.
- No generic card grid, no gratuitous pills, no glow-as-status, no decorative statistics.
- Hairlines must express real document structure; do not surround every section.
- Use a compact, unmistakable wordmark rather than a generic analytics glyph.
- Motion should clarify navigation and selection only, using transform/opacity and a reduced-motion alternative.

The high-end design rules are a quality bar, not a mandate to add glass, cinematic animation, or nested cards. This is a reading product; comprehension outranks spectacle.

## Luna implementation plan

### Phase 1 — establish truth and content

1. Create typed `RepositorySnapshot`, `SystemRegion`, `DesignFlow`, `TrustSurface`, and `LachesisHandoff` view models.
2. Move fixture data into a clearly named `illustrative-suricata.ts` source with a permanent fixture banner.
3. Remove hard-coded snapshot facts from `DocsShell`.
4. Write concrete page copy from view-model facts; do not write unsourced architecture claims.
5. Commit as `content: establish honest repository view models`.
6. Add the commit and evidence to `AUDIT.md` in a separate commit.

### Phase 2 — replace the visual system

1. Write `DESIGN.md` with tokens, typography, layout, interaction, and responsive rules.
2. Delete the unused legacy CSS layer rather than overriding it.
3. Build one responsive docs shell with one primary navigation.
4. Rebuild the overview as a short field-guide entry, not a hero plus feature cards.
5. Commit as `ux: replace the documentation visual system`.
6. Audit and commit the evidence separately.

### Phase 3 — build three genuinely distinct reading surfaces

1. System Map: bounded spatial topology plus accessible relationship summary.
2. Data Flow: ordered, data-backed handoff diagram with guards and dispatch.
3. Trust Surface: glossary/index organized by source, guard, and sink.
4. Do not pass a `mode` prop to one generic map component.
5. Commit each surface independently and audit each independently.

### Phase 4 — repair the Lachesis handoff

1. Parse selected context on `/explore`.
2. Display what will be opened and why.
3. Build the external URL from repository, revision, bundle, region, and anchor.
4. Verify round-trip context with a deterministic unit or browser test.
5. Commit implementation and audit separately.

### Phase 5 — bounded verification

1. Run `npm run check` and `npm run build`.
2. Test loading, ready, malformed, expired, empty, sparse, and coverage-limited bundles.
3. Test keyboard order and visible focus across every route.
4. Verify text contrast at 4.5:1 or better.
5. Verify minimum 44×44px touch targets.
6. Capture and inspect 375×812, 768×1024, and 1440×1000 screenshots for all five routes.
7. Confirm zero viewport-level horizontal overflow and zero map-node collisions.
8. Run the Impeccable detector once after the UI is complete; fix verified findings in one bounded batch.
9. Record evidence in `AUDIT.md` and leave the worktree clean.

## Acceptance criteria

- A first-time visitor can state what Design Map is, what it is not, and where to start after the first viewport.
- No fixture value can be mistaken for a live graph-derived fact.
- System, Flow, and Trust pages differ in data, semantics, and visual representation—not only labels.
- Selecting a region changes useful evidence and produces a valid context-preserving Lachesis handoff.
- The interface remains readable with 8 regions, 500 regions summarized into a bounded projection, zero modules, and one module.
- Mobile map content never overlaps and does not require precision tapping.
- All normal text meets WCAG AA contrast and no informational text is below 12px.
- Every interactive target is keyboard accessible, visibly focused, and at least 44×44px on touch layouts.
- The final stylesheet contains one coherent token system and no dead predecessor UI.
- `npm run check`, `npm run build`, route smoke tests, interaction tests, and screenshot review all pass.

## Definition of done

This goal is done only when the experience is credible enough to send to an OSS maintainer without an explanatory email. The interface must feel authored for repository comprehension, the content must be trustworthy, and the transition into Lachesis must preserve the reader’s place.

After implementation, re-run `$impeccable audit`, then finish with `$impeccable polish`.
