# Unbound Map

**Unbound Map shows you what a codebase does before you open a single file. It draws the big parts of a repository, how they connect, and where the trust boundaries are.**

It answers one question: "what is this system?" When you want to go deeper, down to
the exact source and symbols, it hands off to
[Lachesis](https://lachesis.unboundcompute.com/), the code graph reader.

So the split is simple. Unbound Map explains the shape of a system. Lachesis shows
you the exact code.

## Run it locally

```bash
npm install
npm run dev
```

Before you share or open a pull request, run the checks:

```bash
npm run check
npm run build
npm run projection-smoke   # the adapter, with 0, 1, 8, 30, and 500 parts
npm run smoke              # routes, previews, broken-link recovery (needs dev on :3000)
```

## The pages

- `/` : start here, with a suggested reading order.
- `/architecture` : the map of the repository's main parts and how they relate.
- `/flows` : a guided walk through one data flow, with a plain-text fallback.
- `/trust` : a searchable list of trust domains.
- `/explore` : the handoff into Lachesis, keeping your place.
- `/embed` : a clean, map-only version for putting in a README or an issue.

The map stays at a high level on purpose. Code-level questions go to Lachesis, with
the repository, commit, and part carried along.

## Put a map in your README

GitHub doesn't render iframes, so use the pinned README badge. The Architecture page can generate this exact Markdown with its “Copy README badge” action:

```markdown
[![OWNER/REPO architecture field guide](https://<your-host>/opengraph-image?repository=OWNER%2FREPO&revision=COMMIT&bundle=b_…)](https://<your-host>/architecture?repository=OWNER%2FREPO&revision=COMMIT&bundle=b_…)
```

Anywhere that does render iframes, use the `/embed` page:

```html
<iframe src="https://<your-host>/embed?repository=OWNER/REPO&revision=COMMIT&bundle=b_…" title="OWNER/REPO architecture map" width="100%" height="620" loading="lazy"></iframe>
```

Keep the `repository`, `revision`, and `bundle` values on the URL. They pin the map
to one exact snapshot, so a reader always lands on the same map, not a stale one.

## Settings

A few environment variables control hosting and the link to Lachesis:

- `NEXT_PUBLIC_SITE_URL` : the public origin, used for the sitemap and social images.
- `NEXT_PUBLIC_LACHESIS_URL` : where Lachesis lives (defaults to the hosted one).
- `NEXT_PUBLIC_BUNDLE_API_URL` : where map data is loaded from (defaults to the shared hosted API).

To test against a local Lachesis:

```bash
NEXT_PUBLIC_LACHESIS_URL=http://localhost:3210 \
NEXT_PUBLIC_BUNDLE_API_URL=http://localhost:3210 \
npm run dev -- -p 3304
```

Bad or unsafe values fall back to the safe hosted defaults, so a plain static host
works out of the box.

## How the pieces fit

- [`lib/design-map.ts`](./lib/design-map.ts) is the boundary with Lachesis. It takes
  a Lachesis bundle and turns it into the smaller shape the map needs: repository,
  revision, coverage, parts, and the links between them. Raw graph data stays in Lachesis.
- [`lib/hosted.ts`](./lib/hosted.ts) is the transport. It accepts only `b_…` bundle
  IDs, caps the response size, blocks redirects, and turns expired or broken data
  into a readable error.

## Design principles

- The structure comes from the real code graph. No made-up architecture.
- Start big, then go deeper: repository, region, subsystem, then Lachesis.
- Commit and coverage info are always shown next to a generated claim.
- Newcomers get a small readable map. Experts can follow the evidence into Lachesis.

## License

See [`LICENSE`](./LICENSE).
