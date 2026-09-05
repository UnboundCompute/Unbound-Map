# Design Map

Design Map is the HLD reading layer for UnboundCompute: a generated, commit-addressed view of a repository's subsystems, meaningful paths, and trust boundaries.

It is designed to answer **“what is this system?”** before a newcomer opens the source. Code-level questions hand off to [Lachesis](https://lachesis.unboundcompute.com/), the graph reader.

The boundary is deliberate: Design Map explains architecture, Lachesis exposes exact source and symbol context, and Trace is reserved for reviewed, adjudicated findings after investigation.

## Local development

```bash
npm install
npm run dev
```

Before sharing or opening a pull request, run the static and route gates:

```bash
npm run check
npm run build
npm run projection-smoke
npm run hosted-smoke
npm run explorer-smoke # with Lachesis Explorer running on port 3210
npm run smoke # with `npm run dev` running on port 3000
```

`projection-smoke` exercises the bounded adapter with 0, 1, 8, 30, and 500 communities plus a
child roll-up. `smoke` checks contextual routes, social previews, malformed-link recovery, loading
states, landmarks, and legacy redirects.
`explorer-smoke` verifies the opaque bundle endpoint and the real Lachesis-to-Design Map projection
boundary, including relationship and demo-fixture provenance.

The current UI is a focused Suricata prototype with fixture data and these documentation routes:

- `/` — Start here orientation and the recommended reading order
- `/architecture` — bounded spatial HLD map, relationship summary, and region chapters
- `/flows` — guided architectural data flow with a linear reading fallback
- `/flows/packet-decode` — shareable canonical packet-decode flow
- `/trust` — searchable trust-domain glossary and repository index
- `/explore` — context-preserving handoff into Lachesis
- `/embed` — lightweight embeddable architecture map for READMEs, issues, and blog posts

The old `/map` and `/flow` paths redirect to `/architecture` and `/flows` for shared links.

The map is intentionally kept at architectural altitude; code-level questions hand off to Lachesis with repository, commit, subsystem, and anchor context.

The full guide pages have a **Copy link** action. The `/embed` route is intentionally a clean,
map-only artifact; share its URL directly or use the full Architecture page’s README snippet when
you need a copyable iframe. For a compact README or issue embed, use the `/embed` path for the
same revision-addressed map:

```html
<iframe src="https://<your-design-map-host>/embed" title="Suricata architecture map" width="100%" height="620" loading="lazy"></iframe>
```

For a generated snapshot, keep the repository context on the embed URL (the opaque bundle ID is
what selects the hosted graph):

```html
<iframe src="https://<your-design-map-host>/embed?repository=OWNER/REPO&revision=COMMIT&bundle=b_…" title="OWNER/REPO architecture map" width="100%" height="620" loading="lazy"></iframe>
```

The first snippet is the illustrative prototype default; replace its title and URL before sharing
with maintainers.

For GitHub READMEs (which do not render iframes), use a linked preview image instead:

```markdown
[![Repository architecture field guide](https://<your-design-map-host>/opengraph-image?repository=OWNER%2FREPO&revision=COMMIT&bundle=b_…)](https://<your-design-map-host>/architecture?repository=OWNER%2FREPO&revision=COMMIT&bundle=b_…)
```

Prefer a normal link when the reader needs the explanation, region chapters, flow narrative, or
accessible text relationship summary; use the embed for a visual orientation inside an existing
document.

For production sharing, set `NEXT_PUBLIC_SITE_URL` to the public Design Map origin. It is used by
the sitemap and social-image metadata; `VERCEL_URL` is detected automatically on Vercel, while
local development falls back to `http://localhost:3000`.

For local cross-product testing, set `NEXT_PUBLIC_LACHESIS_URL` before building Design Map (for
example `http://localhost:3210`). Invalid values or values with credentials/query strings safely
fall back to `https://lachesis.unboundcompute.com`; production deployments should leave the
default unless the public Explorer origin is intentionally changed.

Graph-backed pages load opaque bundles through `NEXT_PUBLIC_BUNDLE_API_URL`. For the local
companion server, build or run Design Map with both origins configured:

```bash
NEXT_PUBLIC_LACHESIS_URL=http://localhost:3210 \\
NEXT_PUBLIC_BUNDLE_API_URL=http://localhost:3210 \\
npm run dev -- -p 3304
```

To exercise the currently hosted Lachesis demo bundle without running a local backend, use the
public Explorer origin for the bundle transport:

```bash
NEXT_PUBLIC_LACHESIS_URL=https://lachesis.unboundcompute.com \\
NEXT_PUBLIC_BUNDLE_API_URL=https://lachesis.unboundcompute.com \\
npm run dev -- -p 3304
```

Then open `/architecture?repository=demo%2Fatlas-commerce&revision=main&bundle=b_demo1234`.
This fixture is intentionally labeled as a demo; it proves transport and rendering, not repository
evidence.

The bundle API value is required to be an origin/path without credentials, query, or fragment;
production values must use HTTPS. If it is omitted, Design Map requests `/api/bundles/{id}` from
its own origin, which requires a same-origin reverse proxy or API route; a standalone static host
does not provide that route automatically.

Suggested maintainer-share framing:

- **README / issue:** “Start with the [architecture map](https://<your-design-map-host>/architecture) to see the repository’s major responsibilities before reading source.”
- **Twitter / LinkedIn:** “What does this codebase do before you open a file? Design Map gives you the HLD shape, one canonical flow, and a path into exact symbols: https://<your-design-map-host>/”

The typed adapter in [`lib/design-map.ts`](./lib/design-map.ts) is the boundary for that integration. It accepts Lachesis graph-first bundle metadata and projects it into the smaller snapshot surface that an HLD renderer needs: repository identity, revision, coverage, limitations, modules, and validated module-level relationships. Raw graph nodes should stay in Lachesis.

[`lib/hosted.ts`](./lib/hosted.ts) is the companion transport boundary. It accepts only opaque `b_…` bundle IDs, uses the existing Lachesis bundle endpoint, caps response size, rejects redirects, and reports expired or malformed artifacts as user-readable errors.

## Design principles

- Deterministic structure from the code-property graph; no invented architecture.
- Progressive disclosure: repository → region → subsystem → Lachesis symbol/path.
- Commit and coverage metadata are visible wherever a generated claim is shown.
- Newcomers get a small readable map; experts can follow evidence into the explorer.
