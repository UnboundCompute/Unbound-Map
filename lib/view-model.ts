import { expandSourceUrl, type BundleEntrypoint, type DesignMapSnapshot, type HLDRegion } from './design-map';
export { illustrativeSnapshot } from './illustrative-suricata';

export type SnapshotProvenance = 'illustrative' | 'graph-backed';
export type CoverageState = 'limited' | 'verified';
export type SharedSnapshotContext = { repository?: string; revision?: string; bundle?: string; region?: string; label?: string; anchor?: string; flow?: string; step?: string; branch?: string; domain?: string };

export type RepositorySnapshotView = {
  provenance: SnapshotProvenance;
  coverageState: CoverageState;
  repository: string;
  revision: string;
  description?: string;
  sourceUrlTemplate?: string;
  entrypoints?: BundleEntrypoint[];
  generatedAt?: string;
  language: string;
  coverageScope: string;
  indexedNodes: number;
  includedNodes: number;
  /** Number of graph relationships in the source snapshot, including intra-region edges. */
  relationshipCount?: number;
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
  relationshipKinds?: Record<string, string>;
  incomingRelationshipKinds?: Record<string, string>;
  children?: { label: string; summary: string; anchor?: string }[];
  inputs?: string[];
  outputs?: string[];
  structures?: string[];
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

export type TrustDomain = {
  id: string;
  label: string;
  meaning: string;
  obligation: string;
  families: string[];
  location: string;
  anchor: string;
  regionId: string;
};

export type LachesisHandoff = {
  repository: string;
  revision: string;
  regionId: string;
  regionLabel: string;
  anchor: string;
  bundleId?: string;
  /** Optional route context carried when the anchor was reached through another reading surface. */
  flowId?: string;
  stepId?: string;
  trustDomainId?: string;
};

export function snapshotWithContext(snapshot: RepositorySnapshotView, context: SharedSnapshotContext): RepositorySnapshotView {
  const limitations = context.bundle && snapshot.provenance === 'illustrative' && !snapshot.limitations.some((item) => /bundle requested/i.test(item))
    ? [...snapshot.limitations, 'A graph-backed bundle was requested; this page is awaiting its validated projection.']
    : snapshot.limitations;
  return {
    ...snapshot,
    repository: context.repository || snapshot.repository,
    revision: context.revision || snapshot.revision,
    limitations,
  };
}

export const flowSteps: FlowStep[] = [
  { id: 'ethernet', noun: 'Ethernet frame', handoff: 'wire → packet decode', regionId: 'decode', guard: 'Reject a runt frame before reading EtherType.', anchor: 'DecodeEthernet()', description: 'Reads the outer frame and establishes the protocol type carried by its payload.', input: 'raw network bytes', output: 'payload + EtherType', decision: 'Which layer-three decoder should receive this payload?' },
  { id: 'network', noun: 'network payload', handoff: 'EtherType → network decoder', regionId: 'decode', guard: 'The EtherType switch selects an enumerated L3 decoder.', anchor: 'DecodeNetworkLayer()', description: 'Dispatches the frame to IPv4, IPv6, VLAN, ARP, or another supported network-layer decoder.', input: 'payload + EtherType', output: 'network header + L4 payload', decision: 'Which protocol branch is valid for this frame?' },
  { id: 'ipv4', noun: 'validated IPv4 payload', handoff: 'network header → transport', regionId: 'decode', guard: 'HLEN, IPLEN, and the available buffer length must agree.', anchor: 'DecodeIPV4()', description: 'Validates the IP header, extracts the transport protocol, and exposes the next payload window.', input: 'network header + L4 payload', output: 'proto + transport payload', decision: 'Is the transport header inside the validated window?' },
  { id: 'tcp', noun: 'validated TCP packet', handoff: 'transport payload → flow', regionId: 'core', guard: 'The TCP header is present before the packet enters flow state.', anchor: 'DecodeTCP()', description: 'Validates the TCP header and prepares the packet for the bidirectional flow manager.', input: 'proto + transport payload', output: 'packet', decision: 'Which existing connection owns this packet?' },
  { id: 'flow', noun: 'packet + owning Flow', handoff: 'packet → flow state', regionId: 'core', guard: 'Failed decoding returns an error; a half-decoded packet is not passed downstream.', anchor: 'FlowSetupPacket()', description: 'Attaches the decoded packet to its flow—the stateful unit used by stream and application parsers.', input: 'packet', output: 'packet with flow back-pointer', decision: 'What downstream parser state should this flow carry?' },
];

export const trustDomains: TrustDomain[] = [
  { id: 'resource-lifecycle', label: 'Resource lifecycle', meaning: 'Operations that acquire, release, use, or transfer a tracked resource such as memory, a handle, or a lock.', obligation: "Keep every resource operation within the object's lifetime; release exactly once and before ownership escapes.", families: ['acquire', 'release', 'use', 'escape', 'leak', 'double-free', 'use-after-free'], location: 'src/flow · src/util', anchor: 'FlowInit()', regionId: 'core' },
  { id: 'memory-safety', label: 'Memory safety', meaning: 'Operations that take a size or write into a buffer.', obligation: 'Ensure a length fits its destination and an allocation stays bounded by validated input.', families: ['copy', 'index', 'alloc'], location: 'src/decode · src/util', anchor: 'DecodeIPV4()', regionId: 'decode' },
  { id: 'injection', label: 'Injection', meaning: 'A string or protocol value handed to an engine that executes or parses it.', obligation: 'Do not let untrusted input reach an interpreter or parser without the required boundary and encoding.', families: ['query', 'exec', 'markup', 'document', 'format'], location: 'src/app-layer · src/detect', anchor: 'AppLayerParserParse()', regionId: 'protocols' },
  { id: 'request-forgery', label: 'Request forgery and redirection', meaning: 'A URL or destination that a component fetches or sends a client toward.', obligation: 'Keep the destination within the allowed policy; it must not be attacker-chosen by accident.', families: ['fetch', 'redirect'], location: 'src/output · src/app-layer', anchor: 'OutputTxLogCallLoggers()', regionId: 'output' },
  { id: 'object-integrity', label: 'Object integrity', meaning: 'Untrusted bytes turned into live objects or merged into shared state.', obligation: 'Prevent attacker input from becoming executable behavior or mutating state outside its contract.', families: ['deserialize', 'prototype', 'reflection'], location: 'src/app-layer · src/flow', anchor: 'FlowSetupPacket()', regionId: 'core' },
  { id: 'filesystem', label: 'Filesystem', meaning: 'A file path opened or a file created as part of processing.', obligation: 'Resolve paths within the intended directory and keep file effects explicit.', families: ['path', 'temp'], location: 'src/output', anchor: 'OutputTxLogCallLoggers()', regionId: 'output' },
  { id: 'crypto-transport', label: 'Cryptography and transport configuration', meaning: 'A cryptographic or TLS operation selected with a security-relevant setting.', obligation: 'Use an approved primitive and keep transport verification enabled where the protocol requires it.', families: ['primitive', 'transport'], location: 'src/app-layer-ssl.c', anchor: 'SSLDecode()', regionId: 'protocols' },
  { id: 'resource-exhaustion', label: 'Resource exhaustion', meaning: 'An operation whose time, memory, or output cost can grow with input.', obligation: 'Bound attacker-controlled work so a request cannot drive catastrophic cost.', families: ['regex', 'loop', 'allocation'], location: 'src/detect · src/app-layer', anchor: 'DetectRunTx()', regionId: 'detect' },
];

export function snapshotFromProjection(snapshot: DesignMapSnapshot, regions: HLDRegion[]): RepositorySnapshotView {
  return {
    provenance: 'graph-backed',
    coverageState: snapshot.includedNodes < snapshot.indexedNodes || snapshot.limitations.length > 0 ? 'limited' : 'verified',
    repository: snapshot.repository,
    revision: snapshot.revision,
    description: snapshot.description,
    sourceUrlTemplate: snapshot.sourceUrlTemplate,
    entrypoints: snapshot.entrypoints,
    generatedAt: snapshot.generatedAt,
    language: snapshot.language,
    coverageScope: snapshot.coverageScope,
    indexedNodes: snapshot.indexedNodes,
    includedNodes: snapshot.includedNodes,
    relationshipCount: snapshot.relationships.length,
    limitations: snapshot.limitations,
    regions: regions.map((region) => ({
      id: region.id,
      label: region.label,
      summary: region.rolledUp ? 'A bounded remainder of smaller regions.' : region.summary || 'Graph-derived top-level module projection.',
      path: region.path ?? 'top-level module',
      nodeCount: region.nodeCount,
      metricLabel: `${region.nodeCount.toLocaleString()} indexed nodes`,
      rolledUp: region.rolledUp,
      anchor: region.anchor,
      children: region.children,
      inputs: region.inputs,
      outputs: region.outputs,
      structures: region.structures,
      upstream: region.upstream,
      downstream: region.downstream,
      relationshipKinds: region.relationshipKinds,
      incomingRelationshipKinds: region.incomingRelationshipKinds,
    })),
  };
}

/** Build an exact source link when the exporter provides a revision-pinned template. */
export function sourceHref(snapshot: Pick<RepositorySnapshotView, 'sourceUrlTemplate' | 'revision'>, file?: string, line?: number, endLine?: number) {
  return expandSourceUrl(snapshot.sourceUrlTemplate, snapshot.revision, file, line, endLine);
}

export function toHandoff(snapshot: RepositorySnapshotView, region: SystemRegion, anchor = region.anchor?.label ?? region.label, bundleId?: string): LachesisHandoff {
  return { repository: snapshot.repository, revision: snapshot.revision, regionId: region.id, regionLabel: region.label, anchor, bundleId };
}
