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

## Known prototype limits

- Suricata counts and node facts are fixture data, not yet read from a Lachesis graph endpoint.
- The Lachesis query string is the agreed handoff shape; the explorer must implement its parser and focused-bundle loading.
- The system map currently renders four illustrative regions; the scalable community roll-up engine is the next product slice.
