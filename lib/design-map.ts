/**
 * The HLD adapter boundary.
 *
 * Lachesis owns the graph-first bundle. Design Map consumes only the small,
 * reading-oriented projection below; it should never render raw graph nodes
 * directly at repository altitude.
 */
export type BundleNode = {
  id: string;
  label: string;
  kind: string;
  file: string;
  line: number;
  module?: string;
  documentation?: string;
};

export type BundleModule = {
  id: string;
  name: string;
  path?: string;
  parent_id?: string;
  node_ids?: string[];
};

export type LachesisBundle = {
  format: 'lachesis-explorer-bundle';
  schema_version: '2.0';
  meta: {
    repository: string;
    language: string;
    revision: string;
    description?: string;
    lines: number;
    indexed_nodes: number;
    source_url_template?: string;
  };
  graph: {
    nodes: BundleNode[];
    modules?: BundleModule[];
    coverage?: {
      scope?: string;
      included_nodes?: number;
      indexed_nodes?: number;
      limitations?: string[];
      capabilities?: string[];
    };
  };
};

export type DesignMapSnapshot = {
  repository: string;
  revision: string;
  language: string;
  lines: number;
  indexedNodes: number;
  includedNodes: number;
  coverageScope: string;
  limitations: string[];
  modules: BundleModule[];
  nodes: BundleNode[];
};

export type HLDRegion = {
  id: string;
  label: string;
  path?: string;
  nodeCount: number;
  rolledUp: boolean;
  anchor?: Pick<BundleNode, 'id' | 'label' | 'file' | 'line'>;
};

function positiveInteger(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : fallback;
}

/** Normalize a validated Lachesis bundle into the HLD metadata surface. */
export function toDesignMapSnapshot(bundle: LachesisBundle): DesignMapSnapshot {
  const includedNodes = positiveInteger(bundle.graph.coverage?.included_nodes, bundle.graph.nodes.length);
  const indexedNodes = positiveInteger(bundle.graph.coverage?.indexed_nodes, bundle.meta.indexed_nodes);
  const limitations = [...(bundle.graph.coverage?.limitations ?? [])];

  if (indexedNodes > includedNodes && !limitations.some((item) => /projected subset|indexed nodes/i.test(item))) {
    limitations.push(`This map includes ${includedNodes.toLocaleString()} of ${indexedNodes.toLocaleString()} indexed nodes.`);
  }

  return {
    repository: bundle.meta.repository,
    revision: bundle.meta.revision,
    language: bundle.meta.language,
    lines: positiveInteger(bundle.meta.lines, 0),
    indexedNodes,
    includedNodes,
    coverageScope: bundle.graph.coverage?.scope ?? 'repository',
    limitations,
    modules: bundle.graph.modules ?? [],
    nodes: bundle.graph.nodes,
  };
}

/**
 * Convert the module hierarchy into a bounded HLD table of contents.
 *
 * The graph can contain hundreds of communities. At repository altitude we
 * keep the largest top-level modules and make the remainder an explicit
 * roll-up, rather than emitting a canvas full of peers.
 */
export function projectTopLevelRegions(snapshot: DesignMapSnapshot, limit = 12): HLDRegion[] {
  const safeLimit = Math.max(1, Math.floor(limit));
  const topLevel = snapshot.modules
    .filter((module) => !module.parent_id)
    .map((module) => ({
      id: module.id,
      label: module.name,
      path: module.path,
      nodeCount: module.node_ids?.length ?? 0,
      rolledUp: false,
      anchor: module.node_ids?.map((id) => snapshot.nodes.find((node) => node.id === id)).find(Boolean),
    }))
    .sort((a, b) => b.nodeCount - a.nodeCount || a.label.localeCompare(b.label));

  if (topLevel.length <= safeLimit) return topLevel;
  const visible = topLevel.slice(0, safeLimit - 1);
  const remainder = topLevel.slice(safeLimit - 1);
  return [...visible, {
    id: 'region:other',
    label: `${remainder.length} more regions`,
    nodeCount: remainder.reduce((total, region) => total + region.nodeCount, 0),
    rolledUp: true,
  }];
}
