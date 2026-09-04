import type { DesignMapSnapshot, HLDRegion } from './design-map';
export { illustrativeSnapshot } from './illustrative-suricata';

export type SnapshotProvenance = 'illustrative' | 'graph-backed';

export type RepositorySnapshotView = {
  provenance: SnapshotProvenance;
  repository: string;
  revision: string;
  language: string;
  coverageScope: string;
  indexedNodes: number;
  includedNodes: number;
  limitations: string[];
  regions: SystemRegion[];
};

export type SystemRegion = {
  id: string;
  label: string;
  summary: string;
  path: string;
  nodeCount: number;
  metricLabel: string;
  rolledUp?: boolean;
  anchor?: { id: string; label: string; file: string; line: number };
};

export type FlowStep = {
  id: string;
  noun: string;
  handoff: string;
  regionId: string;
  guard?: string;
  anchor: string;
};

export type TrustSurface = {
  id: string;
  kind: 'source' | 'guard' | 'sink';
  label: string;
  obligation: string;
  location: string;
  anchor: string;
};

export type LachesisHandoff = {
  repository: string;
  revision: string;
  regionId: string;
  regionLabel: string;
  anchor: string;
  bundleId?: string;
};

export const flowSteps: FlowStep[] = [
  { id: 'bytes', noun: 'packet bytes', handoff: 'capture adapter → decode', regionId: 'input', guard: 'length and framing established', anchor: 'DecodePacket()' },
  { id: 'event', noun: 'normalized event', handoff: 'decode → run mode', regionId: 'core', guard: 'parser invariants carried forward', anchor: 'RunModeDispatch()' },
  { id: 'cursor', noun: 'signature cursor', handoff: 'run mode → detection', regionId: 'detect', guard: 'resolved operations table', anchor: 'SigMatchSignatures()' },
  { id: 'record', noun: 'alert record', handoff: 'detection → output', regionId: 'output', anchor: 'OutputRegisterModules()' },
];

export const trustSurfaces: TrustSurface[] = [
  { id: 'external', kind: 'source', label: 'External packet', obligation: 'Establish length and framing before treating bytes as a protocol value.', location: 'src/decode', anchor: 'DecodePacket()' },
  { id: 'validation', kind: 'guard', label: 'Validation gate', obligation: 'Preserve the invariants downstream stages assume after normalization.', location: 'src/runmodes', anchor: 'RunModeDispatch()' },
  { id: 'alert', kind: 'sink', label: 'Alert sink', obligation: 'Keep serialized output within the configured alert and telemetry contract.', location: 'src/output', anchor: 'OutputRegisterModules()' },
];

export function snapshotFromProjection(snapshot: DesignMapSnapshot, regions: HLDRegion[]): RepositorySnapshotView {
  return {
    provenance: 'graph-backed',
    repository: snapshot.repository,
    revision: snapshot.revision,
    language: snapshot.language,
    coverageScope: snapshot.coverageScope,
    indexedNodes: snapshot.indexedNodes,
    includedNodes: snapshot.includedNodes,
    limitations: snapshot.limitations,
    regions: regions.map((region) => ({
      id: region.id,
      label: region.label,
      summary: region.rolledUp ? 'A bounded remainder of smaller regions.' : 'Graph-derived top-level module projection.',
      path: region.path ?? 'top-level module',
      nodeCount: region.nodeCount,
      metricLabel: `${region.nodeCount.toLocaleString()} indexed nodes`,
      rolledUp: region.rolledUp,
      anchor: region.anchor,
    })),
  };
}

export function toHandoff(snapshot: RepositorySnapshotView, region: SystemRegion, anchor = region.anchor?.label ?? region.label, bundleId?: string): LachesisHandoff {
  return { repository: snapshot.repository, revision: snapshot.revision, regionId: region.id, regionLabel: region.label, anchor, bundleId };
}
