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
  parent_id?: string;
  documentation?: string;
};

export type BundleModule = {
  id: string;
  name: string;
  path?: string;
  parent_id?: string;
  node_ids?: string[];
};

export type BundleEdge = {
  id?: string;
  source: string;
  target: string;
  kind?: string;
};

export type LachesisBundle = {
  format: 'lachesis-explorer-bundle';
  schema_version: '2.0';
  meta: {
    repository: string;
    language: string;
    revision: string;
    generated_at?: string;
    description?: string;
    lines: number;
    indexed_nodes: number;
    source_url_template?: string;
  };
  graph: {
    nodes: BundleNode[];
    modules?: BundleModule[];
    edges?: BundleEdge[];
    coverage?: {
      scope?: string;
      included_nodes?: number;
      indexed_nodes?: number;
      limitations?: string[];
      capabilities?: string[];
    };
  };
};

export function isLachesisBundle(value: unknown): value is LachesisBundle {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LachesisBundle>;
  const meta = candidate.meta;
  const graph = candidate.graph;
  const validShape = candidate.format === 'lachesis-explorer-bundle'
    && candidate.schema_version === '2.0'
    && !!meta && typeof meta === 'object'
    && typeof meta.repository === 'string' && meta.repository.trim().length > 0 && typeof meta.language === 'string' && meta.language.trim().length > 0 && typeof meta.revision === 'string' && meta.revision.trim().length > 0
    && typeof meta.lines === 'number' && Number.isInteger(meta.lines) && meta.lines >= 0
    && typeof meta.indexed_nodes === 'number' && Number.isInteger(meta.indexed_nodes) && meta.indexed_nodes >= 0
    && (meta.generated_at === undefined || typeof meta.generated_at === 'string')
    && (meta.description === undefined || typeof meta.description === 'string')
    && (meta.source_url_template === undefined || typeof meta.source_url_template === 'string')
    && !!graph && typeof graph === 'object'
    && Array.isArray(graph.nodes) && graph.nodes.length > 0
    && (graph.modules === undefined || Array.isArray(graph.modules))
    && (graph.edges === undefined || Array.isArray(graph.edges))
    && (graph.coverage === undefined || (!!graph.coverage && typeof graph.coverage === 'object' && (graph.coverage.scope === undefined || typeof graph.coverage.scope === 'string') && (graph.coverage.included_nodes === undefined || (typeof graph.coverage.included_nodes === 'number' && Number.isInteger(graph.coverage.included_nodes) && graph.coverage.included_nodes >= 0)) && (graph.coverage.indexed_nodes === undefined || (typeof graph.coverage.indexed_nodes === 'number' && Number.isInteger(graph.coverage.indexed_nodes) && graph.coverage.indexed_nodes >= 0)) && (graph.coverage.limitations === undefined || (Array.isArray(graph.coverage.limitations) && graph.coverage.limitations.every((item) => typeof item === 'string'))) && (graph.coverage.capabilities === undefined || (Array.isArray(graph.coverage.capabilities) && graph.coverage.capabilities.every((item) => typeof item === 'string')))));
  if (!validShape) return false;

  if (graph!.nodes.some((node) => !node || typeof node !== 'object' || typeof node.id !== 'string' || !node.id.trim()
    || typeof node.label !== 'string' || !node.label.trim() || typeof node.kind !== 'string' || !node.kind.trim()
    || typeof node.file !== 'string' || !node.file.trim() || typeof node.line !== 'number' || !Number.isInteger(node.line) || node.line < 0
    || (node.module !== undefined && (typeof node.module !== 'string' || !node.module.trim()))
    || (node.parent_id !== undefined && (typeof node.parent_id !== 'string' || !node.parent_id.trim()))
    || (node.documentation !== undefined && typeof node.documentation !== 'string'))) return false;
  const nodesById = new Map(graph!.nodes.map((node) => [node.id, node]));
  if (graph!.nodes.some((node) => node.parent_id && (!nodesById.has(node.parent_id) || node.parent_id === node.id))) return false;
  if (graph!.nodes.some((node) => {
    const seen = new Set<string>([node.id]);
    let parent = node.parent_id;
    while (parent) {
      if (seen.has(parent)) return true;
      seen.add(parent);
      parent = nodesById.get(parent)?.parent_id;
    }
    return false;
  })) return false;
  if ((graph!.modules ?? []).some((module) => !module || typeof module.id !== 'string' || !module.id.trim()
    || typeof module.name !== 'string' || !module.name.trim() || (module.path !== undefined && typeof module.path !== 'string')
    || (module.parent_id !== undefined && (typeof module.parent_id !== 'string' || !module.parent_id.trim()))
    || (module.node_ids !== undefined && (!Array.isArray(module.node_ids) || module.node_ids.some((id) => typeof id !== 'string' || !id.trim()))))) return false;
  if ((graph!.edges ?? []).some((edge) => !edge || typeof edge !== 'object' || (edge.id !== undefined && (typeof edge.id !== 'string' || !edge.id.trim())) || typeof edge.source !== 'string' || !edge.source.trim()
    || typeof edge.target !== 'string' || !edge.target.trim() || (edge.kind !== undefined && typeof edge.kind !== 'string'))) return false;
  const edgeIds = (graph!.edges ?? []).map((edge) => edge.id).filter((id): id is string => id !== undefined);
  if (new Set(edgeIds).size !== edgeIds.length) return false;

  const nodeIds = new Set(graph!.nodes.map((node) => node.id));
  if (nodeIds.size !== graph!.nodes.length) return false;
  const includedNodes = graph!.coverage?.included_nodes ?? graph!.nodes.length;
  const indexedNodes = graph!.coverage?.indexed_nodes ?? meta!.indexed_nodes;
  if (includedNodes !== graph!.nodes.length || indexedNodes < includedNodes) return false;
  if ((graph!.edges ?? []).some((edge) => !nodeIds.has(edge.source) || !nodeIds.has(edge.target))) return false;
  const modules = graph!.modules ?? [];
  const moduleIds = new Set(modules.map((module) => module.id));
  if (moduleIds.size !== modules.length) return false;
  const assignedNodes = new Set<string>();
  if (modules.some((module) => (module.node_ids ?? []).some((nodeId) => assignedNodes.has(nodeId) || (assignedNodes.add(nodeId), !nodeIds.has(nodeId))))) return false;
  return modules.every((module) => {
    if (module.parent_id && !moduleIds.has(module.parent_id)) return false;
    const seen = new Set<string>([module.id]);
    let parent = module.parent_id;
    while (parent) {
      if (seen.has(parent)) return false;
      seen.add(parent);
      parent = modules.find((candidate) => candidate.id === parent)?.parent_id;
    }
    return true;
  });
}

export type DesignMapSnapshot = {
  repository: string;
  revision: string;
  generatedAt?: string;
  language: string;
  lines: number;
  indexedNodes: number;
  includedNodes: number;
  coverageScope: string;
  limitations: string[];
  modules: BundleModule[];
  relationships: BundleEdge[];
  nodes: BundleNode[];
};

export type HLDRegion = {
  id: string;
  label: string;
  path?: string;
  nodeCount: number;
  rolledUp: boolean;
  anchor?: Pick<BundleNode, 'id' | 'label' | 'file' | 'line'>;
  children?: { label: string; summary: string; anchor?: string }[];
  inputs?: string[];
  outputs?: string[];
  structures?: string[];
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
    generatedAt: bundle.meta.generated_at,
    language: bundle.meta.language,
    lines: positiveInteger(bundle.meta.lines, 0),
    indexedNodes,
    includedNodes,
    coverageScope: bundle.graph.coverage?.scope ?? 'repository',
    limitations,
    modules: bundle.graph.modules ?? [],
    relationships: bundle.graph.edges ?? [],
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
  const nodeById = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const childProjection = (parentId: string) => {
    const children = snapshot.modules
      .filter((module) => module.parent_id === parentId)
      .map((module) => ({
        label: module.name,
        summary: `${module.node_ids?.length ?? 0} indexed nodes${module.path ? ` · ${module.path}` : ''}.`,
        anchor: module.node_ids?.map((id) => nodeById.get(id)).find(Boolean)?.label,
        nodeCount: module.node_ids?.length ?? 0,
      }))
      .sort((a, b) => b.nodeCount - a.nodeCount || a.label.localeCompare(b.label));
    if (children.length <= 12) return children.map(({ nodeCount: _nodeCount, ...child }) => child);
    const visible = children.slice(0, 11).map(({ nodeCount: _nodeCount, ...child }) => child);
    const remainder = children.slice(11);
    return [...visible, { label: `Other ${remainder.length} regions`, summary: `${remainder.reduce((total, child) => total + child.nodeCount, 0)} indexed nodes across the bounded remainder.` }];
  };
  const topLevel = snapshot.modules
    .filter((module) => !module.parent_id)
    .map((module) => ({
      id: module.id,
      label: module.name,
      path: module.path,
      nodeCount: module.node_ids?.length ?? 0,
      rolledUp: false,
      anchor: module.node_ids?.map((id) => nodeById.get(id)).find(Boolean),
      children: childProjection(module.id),
    }))
    .sort((a, b) => b.nodeCount - a.nodeCount || a.label.localeCompare(b.label));

  const regionIdForModule = new Map<string, string>();
  topLevel.slice(0, safeLimit).forEach((module) => regionIdForModule.set(module.id, module.id));
  if (topLevel.length > safeLimit) topLevel.slice(safeLimit - 1).forEach((module) => regionIdForModule.set(module.id, 'region:other'));
  const moduleByNodeId = new Map<string, string>();
  snapshot.modules.forEach((module) => (module.node_ids ?? []).forEach((nodeId) => moduleByNodeId.set(nodeId, module.id)));
  snapshot.nodes.forEach((node) => { if (node.module) moduleByNodeId.set(node.id, node.module); });
  const topLevelByModule = new Map(snapshot.modules.map((module) => [module.id, module.parent_id ? undefined : module.id]));
  const findTopLevel = (moduleId: string | undefined) => {
    let current = moduleId;
    const seen = new Set<string>();
    while (current && !seen.has(current)) {
      seen.add(current);
      const top = topLevelByModule.get(current);
      if (top) return top;
      current = snapshot.modules.find((module) => module.id === current)?.parent_id;
    }
    return undefined;
  };
  const outgoing = new Map<string, Set<string>>();
  const incoming = new Map<string, Set<string>>();
  (snapshot.relationships ?? []).forEach((edge) => {
    const from = regionIdForModule.get(findTopLevel(moduleByNodeId.get(edge.source)) ?? '');
    const to = regionIdForModule.get(findTopLevel(moduleByNodeId.get(edge.target)) ?? '');
    if (!from || !to || from === to) return;
    if (!outgoing.has(from)) outgoing.set(from, new Set());
    if (!incoming.has(to)) incoming.set(to, new Set());
    outgoing.get(from)!.add(to);
    incoming.get(to)!.add(from);
  });
  const withRelationships = (regions: HLDRegion[]) => regions.map((region) => ({
    ...region,
    upstream: [...(incoming.get(region.id) ?? [])].sort(),
    downstream: [...(outgoing.get(region.id) ?? [])].sort(),
  }));

  if (topLevel.length <= safeLimit) return withRelationships(topLevel);
  const visible = topLevel.slice(0, safeLimit - 1);
  const remainder = topLevel.slice(safeLimit - 1);
  return withRelationships([...visible, {
    id: 'region:other',
    label: `${remainder.length} more regions`,
    nodeCount: remainder.reduce((total, region) => total + region.nodeCount, 0),
    rolledUp: true,
  }]);
}
