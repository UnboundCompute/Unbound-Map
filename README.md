# Design Map

Design Map is the HLD reading layer for UnboundCompute: a generated, commit-addressed view of a repository's subsystems, meaningful paths, and trust boundaries.

It is designed to answer **“what is this system?”** before a newcomer opens the source. Code-level questions hand off to [Lachesis](https://lachesis.unboundcompute.com/), the graph reader.

## Local development

```bash
npm install
npm run dev
```

The current UI is a focused Suricata prototype with fixture data. The map is intentionally kept at architectural altitude; the next integration step is a deep-link contract into Lachesis that preserves repository, commit, subsystem, and anchor context.

The typed adapter in [`lib/design-map.ts`](./lib/design-map.ts) is the boundary for that integration. It accepts Lachesis graph-first bundle metadata and projects it into the smaller snapshot surface that an HLD renderer needs: repository identity, revision, coverage, limitations, and modules. Raw graph nodes should stay in Lachesis.

[`lib/hosted.ts`](./lib/hosted.ts) is the companion transport boundary. It accepts only opaque `b_…` bundle IDs, uses the existing Lachesis bundle endpoint, caps response size, rejects redirects, and reports expired or malformed artifacts as user-readable errors.

## Design principles

- Deterministic structure from the code-property graph; no invented architecture.
- Progressive disclosure: repository → region → subsystem → Lachesis symbol/path.
- Commit and coverage metadata are visible wherever a generated claim is shown.
- Newcomers get a small readable map; experts can follow evidence into the explorer.
