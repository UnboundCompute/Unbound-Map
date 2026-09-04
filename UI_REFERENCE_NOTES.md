# Design Map UI reference notes

Research date: 2026-09-05

These references were reviewed as interaction and information-architecture evidence. They are not
visual templates to copy.

| Reference | Observed pattern | Design Map decision |
| --- | --- | --- |
| [IcePanel diagramming](https://docs.icepanel.io/core-features/diagramming) | One model is shown through connected abstraction levels; selecting an object exposes details and incoming/outgoing relationships. | Use bounded semantic zoom and a stable region inspector/chapter. Keep editing controls out. |
| [IcePanel flows](https://docs.icepanel.io/visual-storytelling/flows) | A flow introduces the full sequence, then highlights one step over the same diagram. | Use a stepper plus a linear text mode. The step narrative stays meaningful without animation. |
| [C4 model](https://c4model.com/) | A diagram communicates its scope and level of abstraction explicitly. | Label the current map level and cap visible regions; do not force every repository into C4 boxes. |
| [EventCatalog](https://www.eventcatalog.dev/) | Domains, systems, services, messages, and flows are first-class views over one connected model. | Keep Start, Architecture, Flows, and Trust as different views over shared snapshot data. |
| [CodeSee map exploration](https://docs.codesee.io/docs/explore-your-map) | Large maps begin collapsed, support selection/filtering, and provide a clear route to code. | Start collapsed and bounded; the map is design-level, not a file dependency graph. |
| [Diátaxis](https://diataxis.fr/) | Documentation is organized around distinct user needs rather than one mixed page. | Separate orientation, architecture explanation, canonical flows, and trust reference into routes. |
| [GitHub newcomer journey](https://docs.github.com/en/get-started/start-your-journey) | Newcomers get an obvious starting point and ordered next steps. | Start here has one recommended flow and explicit next action. |
| [Stripe documentation](https://docs.stripe.com/) | Technical reading has strong hierarchy, task-led entry points, and persistent context. | Keep repository/revision context persistent; use prose and whitespace rather than dashboard chrome. |
| [GitHub code navigation](https://docs.github.com/en/repositories/working-with-files/using-files/navigating-code-on-github) | Symbol navigation moves from a visible definition/reference affordance to exact source context. | Design Map stops at anchors and hands exact symbol work to Lachesis. |
| [Sourcegraph code navigation](https://sourcegraph.com/docs/code-navigation) | Code navigation makes definitions, references, and contextual actions explicit. | Handoff must preserve repository, revision, selected region/step, and anchor. |
| [W3C page structure](https://www.w3.org/WAI/tutorials/page-structure/) | Landmarks, headings, labels, and main-content bypass improve navigation for everyone. | Use semantic landmarks, one logical h1, skip link, and a visible text alternative to diagrams. |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Focus, contrast, target sizing, reflow, and non-obscured controls are measurable requirements. | Treat these as release gates, not optional polish. |

## Teardown / retain decision

### Replace

- The current single shell plus duplicated `DocTabs` navigation.
- The product-like overview copy and card/grid story layout.
- The four-node fixed map and its `mode` prop used to stand in for three surfaces.
- The current Flow and Trust visual implementations.
- The current Explore page's homepage-only Lachesis link.
- The global CSS as a visual world; no overrides should be layered over the replacement.

### Retain when compatible

- Next.js/React and static-first route rendering.
- `lib/hosted.ts` opaque bundle validation and safe loading behavior.
- `lib/design-map.ts` bundle normalization and bounded projection, after adapting its view model.
- Explicit illustrative provenance and snapshot limitations.
- The concept's Design Map/Lachesis/Trace boundary.

### Evidence from the Claude concepts

`designdoc.html` is the content inventory: Suricata's long pipeline, detection fan-out, twelve
subsystems, boot points, decode handoffs, dispatch, key structures, and eight trust domains.
`understanding.html` supplies the useful sequence: orientation → architecture → traced flow →
deeper investigation. Their single-page dashboard treatment is deliberately not retained.
