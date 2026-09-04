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
  role?: 'entry' | 'runtime' | 'fanout' | 'output' | 'boot';
  upstream?: string[];
  downstream?: string[];
  children?: { label: string; summary: string; anchor?: string }[];
  anchor?: { id: string; label: string; file: string; line: number };
};

export type FlowStep = {
  id: string;
  noun: string;
  handoff: string;
  regionId: string;
  guard?: string;
  anchor: string;
  description: string;
  input: string;
  output: string;
  decision?: string;
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
  { id: 'ethernet', noun: 'Ethernet frame', handoff: 'wire → packet decode', regionId: 'decode', guard: 'Reject a runt frame before reading EtherType.', anchor: 'DecodeEthernet()', description: 'Reads the outer frame and establishes the protocol type carried by its payload.', input: 'raw network bytes', output: 'payload + EtherType', decision: 'Which layer-three decoder should receive this payload?' },
  { id: 'network', noun: 'network payload', handoff: 'EtherType → network decoder', regionId: 'decode', guard: 'The EtherType switch selects an enumerated L3 decoder.', anchor: 'DecodeNetworkLayer()', description: 'Dispatches the frame to IPv4, IPv6, VLAN, ARP, or another supported network-layer decoder.', input: 'payload + EtherType', output: 'network header + L4 payload', decision: 'Which protocol branch is valid for this frame?' },
  { id: 'ipv4', noun: 'validated IPv4 payload', handoff: 'network header → transport', regionId: 'decode', guard: 'HLEN, IPLEN, and the available buffer length must agree.', anchor: 'DecodeIPV4()', description: 'Validates the IP header, extracts the transport protocol, and exposes the next payload window.', input: 'network header + L4 payload', output: 'proto + transport payload', decision: 'Is the transport header inside the validated window?' },
  { id: 'tcp', noun: 'validated TCP packet', handoff: 'transport payload → flow', regionId: 'core', guard: 'The TCP header is present before the packet enters flow state.', anchor: 'DecodeTCP()', description: 'Validates the TCP header and prepares the packet for the bidirectional flow manager.', input: 'proto + transport payload', output: 'packet', decision: 'Which existing connection owns this packet?' },
  { id: 'flow', noun: 'packet + owning Flow', handoff: 'packet → flow state', regionId: 'core', guard: 'Failed decoding returns an error; a half-decoded packet is not passed downstream.', anchor: 'FlowSetupPacket()', description: 'Attaches the decoded packet to its flow—the stateful unit used by stream and application parsers.', input: 'packet', output: 'packet with flow back-pointer', decision: 'What downstream parser state should this flow carry?' },
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
