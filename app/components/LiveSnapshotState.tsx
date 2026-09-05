'use client';

import { useEffect, useState } from 'react';
import type { CoverageState, SnapshotProvenance } from '../../lib/view-model';

type BadgeState = { provenance: SnapshotProvenance; coverageState: CoverageState; limitations: string[]; regionCount: number };

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
      if (next?.provenance && next?.coverageState && Array.isArray(next.limitations) && typeof next.regionCount === 'number') setState(next);
    };
    window.addEventListener('design-map:snapshot-ready', update);
    return () => window.removeEventListener('design-map:snapshot-ready', update);
  }, []);
  const badge = labelFor(state);
  return <span className={badge.className}><i aria-hidden="true" />{badge.label}</span>;
}
