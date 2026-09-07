import { expandSourceUrl, type BundleEntrypoint, type DesignMapSnapshot, type HLDRegion, type ModuleExemplar } from './design-map.ts';

/** Render-ready projection of the advisory semantic overlay. Absent without a model. */
export type SnapshotEnrichment = {
  model?: string;
  dimensions?: number;
  facets?: string[];
  /** Behavioural facets whose members span many areas — horizontal concerns. */
  crossCutting?: { tag: string; count: number; moduleSpread: number }[];
  /** Copy-paste smells: pairs of near-identical members, most-similar first.
   *  Members often share a name across distinct declarations, so each side
   *  carries a `file:line` hint that disambiguates which declaration is meant. */
  nearDuplicates?: { aLabel: string; aHint?: string; bLabel: string; bHint?: string; score: number }[];
  /** A greedy semantic tour of the areas, resolved to labels where possible. */
  readingOrder?: { id: string; label: string }[];
};

export type SnapshotProvenance = 'graph-backed';
export type CoverageState = 'limited' | 'verified';
export type SharedSnapshotContext = { repository?: string; revision?: string; bundle?: string; region?: string; label?: string; anchor?: string; flow?: string; step?: string; branch?: string; domain?: string };

export type RepositorySnapshotView = {
  provenance: SnapshotProvenance;
  coverageState: CoverageState;
  repository: string;
  revision: string;
  description?: string;
  /** A real one-line "what is this repo" string, distinct from generic projection boilerplate. */
  purpose?: string;
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
  /** Advisory whole-repository semantic overlay; absent without a model. */
  enrichment?: SnapshotEnrichment;
};

export const emptySnapshot: RepositorySnapshotView = {
  provenance: 'graph-backed', coverageState: 'limited', repository: 'No repository selected', revision: '—', language: '—', coverageScope: 'awaiting repository', indexedNodes: 0, includedNodes: 0, relationshipCount: 0, limitations: ['Choose an indexed repository or add a public repository URL to begin.'], regions: [],
};

export type SystemRegion = {
  id: string;
  label: string;
  summary: string;
  path: string;
  nodeCount: number;
  /** Real declarations this area owns (canonical headline size). */
  definitionCount: number;
  metricLabel: string;
  /** Secondary "all projected nodes" label (never "symbols"). */
  projectedLabel: string;
  rolledUp?: boolean;
  sourcePaths?: string[];
  role?: 'entry' | 'runtime' | 'fanout' | 'output' | 'boot';
  upstream?: string[];
  downstream?: string[];
  internalRelationshipCount?: number;
  relationshipKinds?: Record<string, string>;
  incomingRelationshipKinds?: Record<string, string>;
  children?: { label: string; summary: string; anchor?: string }[];
  inputs?: string[];
  outputs?: string[];
  structures?: string[];
  anchor?: { id: string; label: string; file: string; line: number };
  // --- Advisory semantic enrichment (absent without a model) ---
  semanticLabel?: string;
  coherence?: number;
  tags?: string[];
  semanticSummary?: string;
  affinity?: { id: string; label: string; score: number }[];
  exemplars?: ModuleExemplar[];
  outliers?: { id: string; label: string }[];
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
  const awaitingBundle = Boolean(context.bundle) && snapshot.regions.length === 0;
  const limitations = awaitingBundle && !snapshot.limitations.some((item) => /bundle requested/i.test(item))
    ? [...snapshot.limitations, 'A graph-backed bundle was requested; this page is awaiting its validated projection.']
    : snapshot.limitations;
  return {
    ...snapshot,
    repository: context.repository || snapshot.repository,
    revision: context.revision || snapshot.revision,
    limitations,
  };
}

export function snapshotFromProjection(snapshot: DesignMapSnapshot, regions: HLDRegion[]): RepositorySnapshotView {
  const entrypoints = snapshot.entrypoints.filter((entry) => !/^(?:<)?anonymous(?:@|>|$)/i.test(entry.label.trim()));
  // A module with no declarations is usually a transport stub or generated
  // placeholder. Keep it in the raw projection for provenance, but do not make
  // it a named repository area when real declaration-backed regions exist.
  const displayRegions = regions.some((region) => region.definitionCount > 0)
    ? regions.filter((region) => region.definitionCount > 0)
    : regions;
  // Resolve the advisory overlay's node/area ids to human labels once, so the
  // view never has to carry raw ids. Absent overlay → undefined enrichment.
  const nodeLabel = new Map(snapshot.nodes.map((node) => [node.id, node.label]));
  // Near-duplicate members frequently share a bare name across separate
  // declarations (e.g. two `edit` functions in one file). Carry a compact
  // `file:line` hint per node so the rendered pair is not self-referential.
  const nodeLoc = new Map(snapshot.nodes.map((node) => {
    const base = node.file ? node.file.split('/').pop() : undefined;
    const loc = base ? (node.line ? `${base}:${node.line}` : base) : undefined;
    return [node.id, loc] as const;
  }));
  const areaLabel = new Map<string, string>([
    ...snapshot.modules.map((module) => [module.id, module.name] as const),
    ...snapshot.concepts.map((concept) => [concept.id, concept.label] as const),
  ]);
  const raw = snapshot.enrichment;
  const enrichment: SnapshotEnrichment | undefined = raw ? {
    model: raw.model,
    dimensions: raw.dimensions,
    facets: raw.facets,
    crossCutting: raw.cross_cutting?.map((item) => ({ tag: item.tag, count: item.count, moduleSpread: item.module_spread })),
    nearDuplicates: raw.near_duplicates?.map((item) => ({ aLabel: nodeLabel.get(item.a) ?? item.a, aHint: nodeLoc.get(item.a), bLabel: nodeLabel.get(item.b) ?? item.b, bHint: nodeLoc.get(item.b), score: item.score })),
    readingOrder: raw.reading_order?.map((id) => ({ id, label: areaLabel.get(id) ?? id })),
  } : undefined;
  return {
    provenance: 'graph-backed',
    coverageState: snapshot.includedNodes < snapshot.indexedNodes || snapshot.limitations.length > 0 ? 'limited' : 'verified',
    repository: snapshot.repository,
    revision: snapshot.revision,
    description: snapshot.description,
    purpose: snapshot.purpose,
    sourceUrlTemplate: snapshot.sourceUrlTemplate,
    entrypoints,
    generatedAt: snapshot.generatedAt,
    language: snapshot.language,
    coverageScope: snapshot.coverageScope,
    indexedNodes: snapshot.indexedNodes,
    includedNodes: snapshot.includedNodes,
    relationshipCount: snapshot.relationships.length,
    limitations: snapshot.limitations,
    regions: displayRegions.map((region) => ({
      id: region.id,
      label: region.label,
      summary: region.rolledUp ? 'A bounded remainder of smaller regions.' : region.summary || 'Graph-derived top-level module projection.',
      path: region.path ?? 'top-level module',
      nodeCount: region.nodeCount,
      definitionCount: region.definitionCount,
      // Canonical vocabulary (H13): headline the real declarations as
      // "definitions"; keep the projected-node count as a secondary "nodes"
      // label, never "symbols".
      metricLabel: `${region.definitionCount.toLocaleString()} definition${region.definitionCount === 1 ? '' : 's'}`,
      projectedLabel: `${region.nodeCount.toLocaleString()} projected node${region.nodeCount === 1 ? '' : 's'}`,
      rolledUp: region.rolledUp,
      sourcePaths: region.sourcePaths,
      anchor: region.anchor,
      children: region.children,
      inputs: region.inputs,
      outputs: region.outputs,
      structures: region.structures,
      upstream: region.upstream,
      downstream: region.downstream,
      internalRelationshipCount: region.internalRelationshipCount,
      relationshipKinds: region.relationshipKinds,
      incomingRelationshipKinds: region.incomingRelationshipKinds,
      semanticLabel: region.semanticLabel,
      coherence: region.coherence,
      tags: region.tags,
      semanticSummary: region.semanticSummary,
      affinity: region.affinity,
      exemplars: region.exemplars,
      outliers: region.outliers,
    })),
    enrichment,
  };
}

/** Build an exact source link when the exporter provides a revision-pinned template. */
export function sourceHref(snapshot: Pick<RepositorySnapshotView, 'sourceUrlTemplate' | 'revision'>, file?: string, line?: number, endLine?: number) {
  return expandSourceUrl(snapshot.sourceUrlTemplate, snapshot.revision, file, line, endLine);
}

export function toHandoff(snapshot: RepositorySnapshotView, region: SystemRegion, anchor = region.anchor?.label ?? region.label, bundleId?: string): LachesisHandoff {
  return { repository: snapshot.repository, revision: snapshot.revision, regionId: region.id, regionLabel: region.label, anchor, bundleId };
}
