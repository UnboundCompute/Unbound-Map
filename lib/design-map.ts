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
  snippet?: string;
  source_window?: { start_line?: number; lines: string[] };
  documentation?: string;
};

export type BundleModule = {
  id: string;
  name: string;
  path?: string;
  parent_id?: string;
  node_ids?: string[];
  description?: string;
  // Real declarations the module owns (the canonical headline size). Distinct
  // from symbol_count / node_ids.length, which count all projected nodes.
  definition_count?: number;
  symbol_count?: number;
  anchor_node_id?: string;
};

export type BundleConcept = {
  id: string;
  label: string;
  description?: string;
  node_ids: string[];
};

export type BundleEdge = {
  id?: string;
  source: string;
  target: string;
  kind?: string;
  relation?: string;
};

export type BundleEntrypoint = {
  id: string;
  label: string;
  kind: string;
  node_id: string;
  file: string;
  line?: number;
};

export type BundlePathHop = {
  id?: string;
  node_id: string;
  caption: string;
  edge_label?: string;
};

export type BundleRequestPath = {
  id: string;
  kind: string;
  description: string;
  entry_node: string;
  source_node?: string;
  sink_node?: string;
  confidence?: string;
  limitations?: string[];
  hops: BundlePathHop[];
};

export type BundleFinding = {
  finding_id?: string;
  display_name?: string;
  result_summary?: string;
  // The exporter marks a finding whose featured surface is an internal artifact
  // (a traceback local, a bare file handle, an anonymous callback) low_signal so
  // the trust view can demote it beneath the named security surfaces without
  // dropping it from the exhaustive envelope.
  low_signal?: boolean;
  analysis?: { confidence?: string; limitations?: string[] };
  semantic?: { provider?: string; model_id?: string; access_path?: string; role?: string; cwe?: string[] };
  witness?: { steps?: { node_id: string; role?: string; note?: string }[] };
};

export type LachesisBundle = {
  format: 'lachesis-explorer-bundle';
  schema_version: '2.0';
  analysis_projection?: string;
  meta: {
    repository: string;
    language: string;
    revision: string;
    generated_at?: string;
    description?: string;
    // A real one-line "what is this repo" string, distinct from the generic
    // projection boilerplate carried in `description`.
    purpose?: string;
    lines: number;
    indexed_nodes: number;
    fixture?: boolean;
    source_url_template?: string;
  };
  graph: {
    nodes: BundleNode[];
    modules?: BundleModule[];
    edges?: BundleEdge[];
    entrypoints?: BundleEntrypoint[];
    concepts?: BundleConcept[];
    core?: { node_id: string; label?: string; degree?: number }[];
    capabilities?: string[];
    coverage?: {
      scope?: string;
      included_nodes?: number;
      indexed_nodes?: number;
      limitations?: string[];
      capabilities?: string[];
    };
  };
  paths?: {
    requests?: BundleRequestPath[];
    values?: unknown[];
  };
  security?: { findings?: BundleFinding[] };
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
    && (meta.fixture === undefined || typeof meta.fixture === 'boolean')
    && (meta.description === undefined || typeof meta.description === 'string')
    && (meta.purpose === undefined || typeof meta.purpose === 'string')
    && (meta.source_url_template === undefined || typeof meta.source_url_template === 'string')
    && !!graph && typeof graph === 'object'
    && Array.isArray(graph.nodes) && graph.nodes.length > 0
    && (graph.modules === undefined || Array.isArray(graph.modules))
    && (graph.edges === undefined || Array.isArray(graph.edges))
    && (graph.entrypoints === undefined || Array.isArray(graph.entrypoints))
    && (graph.concepts === undefined || Array.isArray(graph.concepts))
    && (graph.core === undefined || Array.isArray(graph.core))
    && (graph.capabilities === undefined || (Array.isArray(graph.capabilities) && graph.capabilities.every((item) => typeof item === 'string')))
    && (graph.coverage === undefined || (!!graph.coverage && typeof graph.coverage === 'object' && (graph.coverage.scope === undefined || typeof graph.coverage.scope === 'string') && (graph.coverage.included_nodes === undefined || (typeof graph.coverage.included_nodes === 'number' && Number.isInteger(graph.coverage.included_nodes) && graph.coverage.included_nodes >= 0)) && (graph.coverage.indexed_nodes === undefined || (typeof graph.coverage.indexed_nodes === 'number' && Number.isInteger(graph.coverage.indexed_nodes) && graph.coverage.indexed_nodes >= 0)) && (graph.coverage.limitations === undefined || (Array.isArray(graph.coverage.limitations) && graph.coverage.limitations.every((item) => typeof item === 'string'))) && (graph.coverage.capabilities === undefined || (Array.isArray(graph.coverage.capabilities) && graph.coverage.capabilities.every((item) => typeof item === 'string')))));
  if (!validShape) return false;

  if (graph!.nodes.some((node) => !node || typeof node !== 'object' || typeof node.id !== 'string' || !node.id.trim()
    || typeof node.label !== 'string' || !node.label.trim() || typeof node.kind !== 'string' || !node.kind.trim()
    || typeof node.file !== 'string' || typeof node.line !== 'number' || !Number.isInteger(node.line) || node.line < 0
    || (node.module !== undefined && (typeof node.module !== 'string' || !node.module.trim()))
    || (node.parent_id !== undefined && (typeof node.parent_id !== 'string' || !node.parent_id.trim()))
    || (node.snippet !== undefined && (typeof node.snippet !== 'string' || !node.snippet.trim()))
    || (node.source_window !== undefined && (!node.source_window || typeof node.source_window !== 'object' || !Array.isArray(node.source_window.lines) || !node.source_window.lines.length || node.source_window.lines.some((line) => typeof line !== 'string') || (node.source_window.start_line !== undefined && (typeof node.source_window.start_line !== 'number' || !Number.isInteger(node.source_window.start_line) || node.source_window.start_line < 1))))
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
    || (module.description !== undefined && typeof module.description !== 'string')
    || (module.parent_id !== undefined && (typeof module.parent_id !== 'string' || !module.parent_id.trim()))
    || (module.definition_count !== undefined && (typeof module.definition_count !== 'number' || !Number.isInteger(module.definition_count) || module.definition_count < 0))
    || (module.symbol_count !== undefined && (typeof module.symbol_count !== 'number' || !Number.isInteger(module.symbol_count) || module.symbol_count < 0))
    || (module.anchor_node_id !== undefined && (typeof module.anchor_node_id !== 'string' || !module.anchor_node_id.trim()))
    || (module.node_ids !== undefined && (!Array.isArray(module.node_ids) || module.node_ids.some((id) => typeof id !== 'string' || !id.trim()))))) return false;
  if ((graph!.edges ?? []).some((edge) => !edge || typeof edge !== 'object' || (edge.id !== undefined && (typeof edge.id !== 'string' || !edge.id.trim())) || typeof edge.source !== 'string' || !edge.source.trim()
    || typeof edge.target !== 'string' || !edge.target.trim() || (edge.kind !== undefined && typeof edge.kind !== 'string') || (edge.relation !== undefined && typeof edge.relation !== 'string'))) return false;
  if (meta!.source_url_template !== undefined && (!/^https?:\/\//i.test(meta!.source_url_template)
    || !['{revision}', '{file}', '{line}'].every((token) => meta!.source_url_template!.includes(token)))) return false;
  if (candidate.analysis_projection !== undefined && (typeof candidate.analysis_projection !== 'string' || !candidate.analysis_projection.trim())) return false;
  const edgeIds = (graph!.edges ?? []).map((edge) => edge.id).filter((id): id is string => id !== undefined);
  if (new Set(edgeIds).size !== edgeIds.length) return false;

  const nodeIds = new Set(graph!.nodes.map((node) => node.id));
  if (nodeIds.size !== graph!.nodes.length) return false;
  const includedNodes = graph!.coverage?.included_nodes ?? graph!.nodes.length;
  const indexedNodes = graph!.coverage?.indexed_nodes ?? meta!.indexed_nodes;
  if (includedNodes !== graph!.nodes.length || indexedNodes < includedNodes) return false;
  if ((graph!.edges ?? []).some((edge) => !nodeIds.has(edge.source) || !nodeIds.has(edge.target))) return false;
  if ((graph!.entrypoints ?? []).some((entry) => !entry || typeof entry !== 'object'
    || typeof entry.id !== 'string' || !entry.id.trim() || typeof entry.label !== 'string' || !entry.label.trim()
    || typeof entry.kind !== 'string' || !entry.kind.trim() || typeof entry.node_id !== 'string' || !nodeIds.has(entry.node_id)
    || typeof entry.file !== 'string' || !entry.file.trim()
    || (entry.line !== undefined && (typeof entry.line !== 'number' || !Number.isInteger(entry.line) || entry.line < 1)))) return false;
  if ((graph!.concepts ?? []).some((concept) => !concept || typeof concept !== 'object'
    || typeof concept.id !== 'string' || !concept.id.trim() || typeof concept.label !== 'string' || !concept.label.trim()
    || (concept.description !== undefined && typeof concept.description !== 'string')
    || !Array.isArray(concept.node_ids) || !concept.node_ids.length || concept.node_ids.some((id) => typeof id !== 'string' || !nodeIds.has(id)))) return false;
  if ((graph!.core ?? []).some((item) => !item || typeof item !== 'object' || typeof item.node_id !== 'string' || !nodeIds.has(item.node_id)
    || (item.label !== undefined && typeof item.label !== 'string') || (item.degree !== undefined && (typeof item.degree !== 'number' || !Number.isFinite(item.degree) || item.degree < 0)))) return false;
  const requests = candidate.paths?.requests ?? [];
  if (candidate.paths !== undefined && (!candidate.paths || typeof candidate.paths !== 'object'
    || (candidate.paths.requests !== undefined && !Array.isArray(candidate.paths.requests))
    || (candidate.paths.values !== undefined && !Array.isArray(candidate.paths.values)))) return false;
  if (requests.some((path) => !path || typeof path !== 'object'
    || typeof path.id !== 'string' || !path.id.trim() || typeof path.kind !== 'string' || !path.kind.trim()
    || typeof path.description !== 'string' || typeof path.entry_node !== 'string' || !nodeIds.has(path.entry_node)
    || !Array.isArray(path.hops) || path.hops.length < 2
    || path.hops.some((hop) => !hop || typeof hop !== 'object' || typeof hop.node_id !== 'string' || !nodeIds.has(hop.node_id) || typeof hop.caption !== 'string' || !hop.caption.trim()
      || (hop.id !== undefined && (typeof hop.id !== 'string' || !hop.id.trim())) || (hop.edge_label !== undefined && typeof hop.edge_label !== 'string'))
    || (path.source_node !== undefined && !nodeIds.has(path.source_node)) || (path.sink_node !== undefined && !nodeIds.has(path.sink_node))
    || (path.confidence !== undefined && typeof path.confidence !== 'string')
    || (path.limitations !== undefined && (!Array.isArray(path.limitations) || path.limitations.some((item) => typeof item !== 'string'))))) return false;
  if (candidate.analysis_projection === 'code-understanding') {
    const entrypoints = graph!.entrypoints ?? [];
    const hasSourceBackedPath = requests.some((path) => path.hops.length >= 2 && path.hops.every((hop) => {
      const node = nodesById.get(hop.node_id);
      return Boolean(node?.file && node.line > 0);
    }));
    if (!entrypoints.length || !hasSourceBackedPath) return false;
  }
  if (candidate.security !== undefined && (!candidate.security || typeof candidate.security !== 'object'
    || (candidate.security.findings !== undefined && !Array.isArray(candidate.security.findings)))) return false;
  const findings = candidate.security?.findings ?? [];
  if (findings.some((finding) => {
    if (!finding || typeof finding !== 'object') return true;
    if (finding.finding_id !== undefined && (typeof finding.finding_id !== 'string' || !finding.finding_id.trim())) return true;
    if (finding.display_name !== undefined && typeof finding.display_name !== 'string') return true;
    if (finding.result_summary !== undefined && typeof finding.result_summary !== 'string') return true;
    const analysis = finding.analysis;
    if (analysis !== undefined && (!analysis || typeof analysis !== 'object'
      || (analysis.confidence !== undefined && typeof analysis.confidence !== 'string')
      || (analysis.limitations !== undefined && (!Array.isArray(analysis.limitations) || analysis.limitations.some((item) => typeof item !== 'string'))))) return true;
    const witness = finding.witness;
    if (witness !== undefined && (!witness || typeof witness !== 'object'
      || (witness.steps !== undefined && (!Array.isArray(witness.steps) || witness.steps.some((step) => !step || typeof step !== 'object' || typeof step.node_id !== 'string' || !nodeIds.has(step.node_id) || (step.role !== undefined && typeof step.role !== 'string') || (step.note !== undefined && typeof step.note !== 'string')))))) return true;
    return false;
  })) return false;
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
  description?: string;
  purpose?: string;
  sourceUrlTemplate?: string;
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
  entrypoints: BundleEntrypoint[];
  requestPaths: BundleRequestPath[];
  concepts: BundleConcept[];
};

export type HLDRegion = {
  id: string;
  label: string;
  path?: string;
  nodeCount: number;
  // Real declarations this area owns (the canonical headline size). Falls back
  // to the projected-node count when a bundle omits definition_count.
  definitionCount: number;
  rolledUp: boolean;
  summary?: string;
  anchor?: Pick<BundleNode, 'id' | 'label' | 'file' | 'line'>;
  children?: { label: string; summary: string; anchor?: string }[];
  inputs?: string[];
  outputs?: string[];
  structures?: string[];
  upstream?: string[];
  downstream?: string[];
  relationshipKinds?: Record<string, string>;
  incomingRelationshipKinds?: Record<string, string>;
};

/** Expand an exporter-provided revision-pinned source URL template. */
export function expandSourceUrl(template: string | undefined, revision: string, file?: string, line?: number, endLine?: number) {
  if (!template || !file || !line || line < 1) return undefined;
  return template.replaceAll('{revision}', encodeURIComponent(revision)).replaceAll('{file}', file.split('/').map(encodeURIComponent).join('/')).replaceAll('{line}', String(line)).replaceAll('{end_line}', String(endLine && endLine >= line ? endLine : line));
}

function positiveInteger(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : fallback;
}

function deriveModules(nodes: BundleNode[], idPrefix = 'derived:module'): BundleModule[] {
  const groups = new Map<string, string[]>();
  nodes.forEach((node) => {
    const key = node.module?.trim() || node.file.split('/').slice(0, -1).join('/') || 'root';
    const ids = groups.get(key) ?? [];
    ids.push(node.id);
    groups.set(key, ids);
  });
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, node_ids], index) => ({
    id: `${idPrefix}:${index}:${name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'root'}`,
    name,
    path: name === 'root' ? undefined : name,
    node_ids,
  }));
}

/** Normalize a validated Lachesis bundle into the HLD metadata surface. */
export function toDesignMapSnapshot(bundle: LachesisBundle): DesignMapSnapshot {
  const includedNodes = positiveInteger(bundle.graph.coverage?.included_nodes, bundle.graph.nodes.length);
  const indexedNodes = positiveInteger(bundle.graph.coverage?.indexed_nodes, bundle.meta.indexed_nodes);
  const limitations = [...(bundle.graph.coverage?.limitations ?? [])];
  const declaredModules = bundle.graph.modules ?? [];
  let modules = declaredModules.length ? declaredModules : deriveModules(bundle.graph.nodes);
  if (!declaredModules.length) limitations.push('Top-level regions were conservatively derived from node module/file metadata because this bundle did not declare graph modules.');
  else {
    const assigned = new Set(declaredModules.flatMap((module) => module.node_ids ?? []));
    const aliases = new Map<string, string | undefined>();
    declaredModules.forEach((module) => {
      for (const value of [module.id, module.name, module.path]) {
        if (!value) continue;
        const key = value.trim().toLowerCase();
        aliases.set(key, aliases.has(key) && aliases.get(key) !== module.id ? undefined : module.id);
      }
    });
    const additions = new Map<string, string[]>();
    const unassigned = bundle.graph.nodes.filter((node) => {
      if (assigned.has(node.id)) return false;
      const moduleId = node.module ? aliases.get(node.module.trim().toLowerCase()) : undefined;
      if (moduleId) {
        additions.set(moduleId, [...(additions.get(moduleId) ?? []), node.id]);
        return false;
      }
      return true;
    });
    if (additions.size) {
      modules = modules.map((module) => additions.has(module.id) ? { ...module, node_ids: [...(module.node_ids ?? []), ...additions.get(module.id)!] } : module);
    }
    if (unassigned.length) {
      modules = [...modules, ...deriveModules(unassigned, 'derived:unassigned')];
      limitations.push(`${unassigned.length.toLocaleString()} graph nodes were not assigned to a declared module; they are shown in conservative derived regions.`);
    }
  }

  if (bundle.meta.fixture === true && !limitations.some((item) => /demo fixture/i.test(item))) {
    limitations.unshift('Demo fixture: graph shape is transport-valid but is not verified repository evidence.');
  }

  if (indexedNodes > includedNodes && !limitations.some((item) => /projected subset|indexed nodes/i.test(item))) {
    limitations.push(`This map includes ${includedNodes.toLocaleString()} of ${indexedNodes.toLocaleString()} indexed nodes.`);
  }

  return {
    repository: bundle.meta.repository,
    revision: bundle.meta.revision,
    description: bundle.meta.description,
    purpose: bundle.meta.purpose,
    sourceUrlTemplate: bundle.meta.source_url_template,
    generatedAt: bundle.meta.generated_at,
    language: bundle.meta.language,
    lines: positiveInteger(bundle.meta.lines, 0),
    indexedNodes,
    includedNodes,
    coverageScope: bundle.graph.coverage?.scope ?? 'repository',
    limitations,
    modules,
    relationships: bundle.graph.edges ?? [],
    nodes: bundle.graph.nodes,
    entrypoints: bundle.graph.entrypoints ?? [],
    requestPaths: bundle.paths?.requests ?? [],
    concepts: bundle.graph.concepts ?? [],
  };
}

/**
 * Convert the module hierarchy into a bounded HLD table of contents.
 *
 * The graph can contain hundreds of communities. At repository altitude we
 * keep the largest top-level modules and make the remainder an explicit
 * roll-up, rather than emitting a canvas full of peers.
 */
export function projectTopLevelRegions(snapshot: DesignMapSnapshot, limit?: number): HLDRegion[] {
  const nodeById = new Map(snapshot.nodes.map((node) => [node.id, node]));
  // The real declarations an area owns is the canonical headline size; fall
  // back to the projected-node count when a bundle omits definition_count.
  const moduleDefCount = (module: BundleModule) => module.definition_count ?? (module.node_ids?.length ?? 0);
  const concepts = snapshot.concepts ?? [];
  // Concepts are semantic reading regions and may intentionally overlap (for
  // example, a request lifecycle and a query pipeline share their parsing nodes).
  // A single catch-all concept is not an architecture; with two or more concepts,
  // preserve the authored regions and resolve shared-node relationships by the
  // deterministic concept order supplied by the exporter.
  // Concept labels are authored reading vocabulary and must remain visible at
  // repository altitude. Keep the owning module's path and canonical counts
  // alongside them so the region stays source-grounded without replacing the
  // explanation with an implementation name.
  const ownerModuleForConcept = (concept: BundleConcept): BundleModule | undefined => {
    const conceptNodes = new Set(concept.node_ids);
    let best: BundleModule | undefined;
    let bestOverlap = 0;
    for (const module of snapshot.modules) {
      const overlap = (module.node_ids ?? []).reduce((total, id) => total + (conceptNodes.has(id) ? 1 : 0), 0);
      if (overlap > bestOverlap) { bestOverlap = overlap; best = module; }
    }
    return bestOverlap > 0 ? best : undefined;
  };
  const modules: BundleModule[] = concepts.length >= 2
    ? concepts.map((concept) => { const owner = ownerModuleForConcept(concept); return { id: concept.id, name: concept.label, path: owner?.path, description: concept.description, node_ids: concept.node_ids, definition_count: owner?.definition_count, symbol_count: owner?.symbol_count, anchor_node_id: owner?.anchor_node_id }; })
    : snapshot.modules;
  const childProjection = (parentId: string) => {
    const children = modules
      .filter((module) => module.parent_id === parentId)
      .map((module) => ({
        label: module.name,
        summary: `${moduleDefCount(module).toLocaleString()} definitions${module.path ? ` · ${module.path}` : ''}.`,
        anchor: module.node_ids?.map((id) => nodeById.get(id)).find(Boolean)?.label,
        nodeCount: moduleDefCount(module),
      }))
      .sort((a, b) => b.nodeCount - a.nodeCount || a.label.localeCompare(b.label));
    if (children.length) {
      if (children.length <= 12) return children.map(({ nodeCount: _nodeCount, ...child }) => child);
      const visible = children.slice(0, 11).map(({ nodeCount: _nodeCount, ...child }) => child);
      const remainder = children.slice(11);
      return [...visible, { label: `Other ${remainder.length} regions`, summary: `${remainder.reduce((total, child) => total + child.nodeCount, 0)} projected nodes across the bounded remainder.` }];
    }

    // Some graph bundles declare top-level modules but not nested communities.
    // Keep region focus useful by exposing a bounded representative node list;
    // exact source reading still belongs to Lachesis at level 2.
    const ownModule = modules.find((module) => module.id === parentId);
    const nodes = (ownModule?.node_ids ?? [])
      .map((id) => nodeById.get(id))
      .filter((node): node is BundleNode => Boolean(node))
      .sort((a, b) => a.line - b.line || a.label.localeCompare(b.label));
    const nodeChildren = nodes.map((node) => ({
      label: node.label,
      summary: `${node.kind} · ${node.file}:${node.line}`,
      anchor: node.label,
      nodeCount: 1,
    }));
    if (nodeChildren.length <= 12) return nodeChildren.map(({ nodeCount: _nodeCount, ...child }) => child);
    const visible = nodeChildren.slice(0, 11).map(({ nodeCount: _nodeCount, ...child }) => child);
    const remainder = nodeChildren.slice(11);
    return [...visible, { label: `Other ${remainder.length} nodes`, summary: `${remainder.length} projected nodes across the bounded remainder.` }];
  };
  const topLevel = modules
    .filter((module) => !module.parent_id)
    .map((module) => ({
      id: module.id,
      label: module.name,
      path: module.path,
      nodeCount: module.node_ids?.length ?? 0,
      definitionCount: moduleDefCount(module),
      rolledUp: false,
      summary: module.description,
      anchor: (module.anchor_node_id ? nodeById.get(module.anchor_node_id) : undefined) ?? module.node_ids?.map((id) => nodeById.get(id)).find(Boolean),
      children: childProjection(module.id),
    }))
    // Order by the real declarations an area owns so the largest-definition
    // areas are the named regions; small recalled areas keep their identity
    // instead of vanishing into an unlabeled remainder (H9).
    .sort((a, b) => b.definitionCount - a.definitionCount || b.nodeCount - a.nodeCount || a.label.localeCompare(b.label));

  // Scale the named-region budget with repository size so mid/large repos do not
  // collapse most areas into a single "Other N" bucket (H8). A generous cap keeps
  // the reader honest without emitting an unbounded canvas of peers.
  const safeLimit = Math.max(1, Math.floor(limit ?? Math.min(Math.max(topLevel.length, 1), 16)));

  const regionIdForModule = new Map<string, string>();
  topLevel.slice(0, safeLimit).forEach((module) => regionIdForModule.set(module.id, module.id));
  if (topLevel.length > safeLimit) topLevel.slice(safeLimit - 1).forEach((module) => regionIdForModule.set(module.id, 'region:other'));
  const moduleByNodeId = new Map<string, string>();
  const ambiguousNodeModules = new Set<string>();
  modules.forEach((module) => (module.node_ids ?? []).forEach((nodeId) => moduleByNodeId.set(nodeId, module.id)));
  const moduleIds = new Map<string, string>();
  const moduleAliases = new Map<string, string>();
  const ambiguousAliases = new Set<string>();
  const addModuleAlias = (alias: string, moduleId: string) => {
    if (ambiguousAliases.has(alias)) return;
    const previous = moduleAliases.get(alias);
    if (previous && previous !== moduleId) {
      moduleAliases.delete(alias);
      ambiguousAliases.add(alias);
      return;
    }
    moduleAliases.set(alias, moduleId);
  };
  modules.forEach((module) => {
    moduleIds.set(module.id, module.id);
    addModuleAlias(module.name, module.id);
    addModuleAlias(module.name.toLowerCase(), module.id);
    if (module.path) addModuleAlias(module.path, module.id);
    if (module.path) addModuleAlias(module.path.toLowerCase(), module.id);
  });
  // Concept membership is the authoritative semantic assignment when concepts
  // are being projected; raw node.module values describe implementation modules
  // and would incorrectly mark every overlapping concept as ambiguous.
  if (modules === snapshot.modules) snapshot.nodes.forEach((node) => {
    if (!node.module) return;
    const declared = moduleIds.get(node.module) ?? moduleAliases.get(node.module) ?? moduleAliases.get(node.module.toLowerCase()) ?? node.module;
    const existing = moduleByNodeId.get(node.id);
    if (existing && existing !== declared) {
      moduleByNodeId.delete(node.id);
      ambiguousNodeModules.add(node.id);
      return;
    }
    moduleByNodeId.set(node.id, declared);
  });
  const topLevelByModule = new Map(modules.map((module) => [module.id, module.parent_id ? undefined : module.id]));
  const findTopLevel = (moduleId: string | undefined) => {
    let current = moduleId;
    const seen = new Set<string>();
    while (current && !seen.has(current)) {
      seen.add(current);
      const top = topLevelByModule.get(current);
      if (top) return top;
      current = modules.find((module) => module.id === current)?.parent_id;
    }
    return undefined;
  };
  const outgoing = new Map<string, Set<string>>();
  const incoming = new Map<string, Set<string>>();
  const relationshipKinds = new Map<string, Map<string, Set<string>>>();
  const incomingRelationshipKinds = new Map<string, Map<string, Set<string>>>();
  (snapshot.relationships ?? []).forEach((edge) => {
    const from = ambiguousNodeModules.has(edge.source) ? undefined : regionIdForModule.get(findTopLevel(moduleByNodeId.get(edge.source)) ?? '');
    const to = ambiguousNodeModules.has(edge.target) ? undefined : regionIdForModule.get(findTopLevel(moduleByNodeId.get(edge.target)) ?? '');
    if (!from || !to || from === to) return;
    if (!outgoing.has(from)) outgoing.set(from, new Set());
    if (!incoming.has(to)) incoming.set(to, new Set());
    outgoing.get(from)!.add(to);
    incoming.get(to)!.add(from);
    const relationKind = edge.kind ?? edge.relation;
    if (relationKind) {
      if (!relationshipKinds.has(from)) relationshipKinds.set(from, new Map());
      if (!relationshipKinds.get(from)!.has(to)) relationshipKinds.get(from)!.set(to, new Set());
      relationshipKinds.get(from)!.get(to)!.add(relationKind);
      if (!incomingRelationshipKinds.has(to)) incomingRelationshipKinds.set(to, new Map());
      if (!incomingRelationshipKinds.get(to)!.has(from)) incomingRelationshipKinds.get(to)!.set(from, new Set());
      incomingRelationshipKinds.get(to)!.get(from)!.add(relationKind);
    }
  });
  const withRelationships = (regions: HLDRegion[]) => regions.map((region) => ({
    ...region,
    upstream: [...(incoming.get(region.id) ?? [])].sort(),
    downstream: [...(outgoing.get(region.id) ?? [])].sort(),
    relationshipKinds: Object.fromEntries([... (relationshipKinds.get(region.id) ?? new Map())].sort(([a], [b]) => a.localeCompare(b)).map(([target, kinds]) => [target, [...kinds].sort().join(', ')])),
    incomingRelationshipKinds: Object.fromEntries([... (incomingRelationshipKinds.get(region.id) ?? new Map())].sort(([a], [b]) => a.localeCompare(b)).map(([source, kinds]) => [source, [...kinds].sort().join(', ')])),
  }));

  if (topLevel.length <= safeLimit) return withRelationships(topLevel);
  const visible = topLevel.slice(0, safeLimit - 1);
  const remainder = topLevel.slice(safeLimit - 1);
  // Keep the remaining areas named and reachable (as roll-up children) rather
  // than dropping them into an anonymous bucket, so nothing is hidden (H8/H9).
  return withRelationships([...visible, {
    id: 'region:other',
    label: `Other ${remainder.length} areas`,
    nodeCount: remainder.reduce((total, region) => total + region.nodeCount, 0),
    definitionCount: remainder.reduce((total, region) => total + region.definitionCount, 0),
    rolledUp: true,
    children: remainder.map((region) => ({ label: region.label, summary: `${region.definitionCount.toLocaleString()} definitions${region.path ? ` · ${region.path}` : ''}.`, anchor: region.anchor?.label })),
  }]);
}
