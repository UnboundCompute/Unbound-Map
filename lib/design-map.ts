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
  };
}

