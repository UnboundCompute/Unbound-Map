'use client';

import { useEffect, useState } from 'react';
import type { CoverageState, SnapshotProvenance } from '../../lib/view-model';

export type BadgeState = { provenance: SnapshotProvenance; coverageState: CoverageState; limitations: string[]; regionCount: number; revision: string; generatedAt?: string; coverageScope: string; indexedNodes: number };

function labelFor({ provenance, coverageState, limitations, regionCount }: BadgeState) {
  const bundlePending = provenance === 'illustrative' && limitations.some((item) => /bundle\s+(?:was\s+)?requested/i.test(item));
  const stale = provenance === 'graph-backed' && limitations.some((item) => /\b(stale|outdated|superseded)\b/i.test(item));
  const sparse = provenance === 'graph-backed' && regionCount <= 1;
  return {
    label: bundlePending ? 'Graph-backed bundle requested' : provenance === 'illustrative' ? 'Illustrative fixture · coverage limited' : stale ? 'Graph-backed · stale snapshot' : sparse ? 'Graph-backed · sparse projection' : coverageState === 'limited' ? 'Graph-backed · coverage limited' : 'Verified graph-backed',
    className: `snapshot-state snapshot-${provenance}${stale ? ' snapshot-stale' : ''}${bundlePending ? ' snapshot-pending' : ''}${sparse ? ' snapshot-sparse' : ''}`,
  };
}

export function LiveSnapshotState(initial: BadgeState) {
  const [state, setState] = useState(initial);
  useEffect(() => {
    const update = (event: Event) => {
      const next = (event as CustomEvent<BadgeState>).detail;
      if (next?.provenance && next?.coverageState && Array.isArray(next.limitations) && typeof next.regionCount === 'number' && typeof next.revision === 'string' && typeof next.coverageScope === 'string' && typeof next.indexedNodes === 'number') setState(next);
    };
    window.addEventListener('design-map:snapshot-ready', update);
    return () => window.removeEventListener('design-map:snapshot-ready', update);
  }, []);
  const badge = labelFor(state);
  return <span className={badge.className}><i aria-hidden="true" />{badge.label}</span>;
}

export function LiveSnapshotDetails(initial: BadgeState) {
  const [state, setState] = useState(initial);
  useEffect(() => {
    const update = (event: Event) => {
      const next = (event as CustomEvent<BadgeState>).detail;
      if (next?.provenance && next?.coverageState && Array.isArray(next.limitations) && typeof next.regionCount === 'number' && typeof next.revision === 'string' && typeof next.coverageScope === 'string' && typeof next.indexedNodes === 'number') setState(next);
    };
    window.addEventListener('design-map:snapshot-ready', update);
    return () => window.removeEventListener('design-map:snapshot-ready', update);
  }, []);
  const sparse = state.provenance === 'graph-backed' && state.regionCount <= 1;
  const stale = state.provenance === 'graph-backed' && state.limitations.some((item) => /\b(stale|outdated|superseded)\b/i.test(item));
  return <><dl className="snapshot-list"><div><dt>revision</dt><dd><code>{state.revision}</code></dd></div><div><dt>generated</dt><dd>{state.generatedAt ? <time dateTime={state.generatedAt}><code>{state.generatedAt}</code></time> : 'Not supplied by snapshot'}</dd></div><div><dt>coverage</dt><dd>{state.coverageScope}</dd></div><div><dt>indexed</dt><dd>{state.indexedNodes.toLocaleString()} nodes</dd></div></dl><p className="rail-note">{state.limitations.some((item) => /bundle\s+(?:was\s+)?requested/i.test(item)) ? 'A graph-backed bundle is requested. The map will replace the fixture only after validation succeeds.' : state.provenance === 'illustrative' ? 'Illustrative content for the prototype. Replace with a verified bundle before sharing.' : sparse ? 'Generated from the Lachesis graph, but only one top-level region is available. Treat this as a sparse projection until coverage expands.' : stale ? 'Generated from the Lachesis graph, but this snapshot is marked stale. Confirm the revision before relying on it.' : state.coverageState === 'limited' ? 'Generated from the Lachesis graph, but this view covers only part of the indexed repository.' : 'Generated from the Lachesis graph. Layout is editorial; counts retain bundle provenance.'}</p></>;
}
