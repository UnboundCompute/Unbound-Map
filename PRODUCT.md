# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Next.js and React, chosen to support a small static-first documentation surface with route-level progressive disclosure.

## Users

Primary users are newcomers and contributors approaching an unfamiliar open-source repository. Maintainers are the secondary audience: they need a trustworthy, shareable orientation artifact that reduces repeated architecture explanations.

## Product Purpose

Design Map is a generated design-level map of a codebase. It helps a reader understand the repository’s major regions, meaningful data paths, and trust boundaries before reading source code. Success means a newcomer can identify where to start, choose a relevant subsystem or path, and reach the exact implementation in Lachesis without getting lost.

## Positioning

Design Map is the human reading layer over the Lachesis code-property graph: a small, commit-addressed table of contents and glossary at HLD/LLD altitude. It is not a raw dependency graph, code explorer, or adjudicated finding report.

## Operating Context

The artifact is linked from a repository README or shared directly with a contributor. Readers move from repository overview to a focused documentation page, then hand off to Lachesis for symbol-level paths and source evidence. Public snapshots must be understandable without an account or repository installation.

## Capabilities and Constraints

- System Map, Data Flow, and Trust Surface are separate reading surfaces, not three dense panels in one dashboard.
- Structural facts come from Lachesis bundles and remain tied to a commit, coverage scope, and limitations.
- The HLD renderer must reduce large graphs into a bounded hierarchy with semantic zoom.
- The UI must distinguish graph evidence from layout and must not present a map as a security finding.
- Hosted bundles use opaque IDs and may be loading, expired, malformed, or coverage-limited.
- The current prototype contains fixture data while the hosted community projection is being connected.

## Brand Commitments

The product name is Design Map. The guiding line is “Read this before the source.” The interface should feel like a carefully edited technical document: calm, precise, spatial, and human—not an AI chat surface or analytics dashboard.

## Evidence on Hand

- `design-map-concept.md` defines the content model, boundaries, graph-derived facts, and scalability requirements.
- `lib/design-map.ts` defines the Lachesis graph-first bundle adapter and bounded HLD region projection.
- `lib/hosted.ts` defines safe opaque hosted-bundle loading.
- The current Suricata fixture is illustrative and must not be described as a live repository snapshot.

## Product Principles

1. Orient before exposing complexity.
2. Every architectural claim carries provenance.
3. A page should answer one reader question well.
4. Handoff depth belongs in Lachesis, not in the HLD surface.
5. Generated structure must remain useful when the graph grows by two orders of magnitude.

## Accessibility & Inclusion

The product is a web document and must remain keyboard navigable, responsive below 768px, readable without color alone, and usable with reduced motion. Errors and coverage limitations must be announced in text.
