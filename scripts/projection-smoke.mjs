import { isLachesisBundle, projectTopLevelRegions, toDesignMapSnapshot } from '../lib/design-map.ts';

function snapshot(count, childCount = 0) {
  const modules = Array.from({ length: count }, (_, index) => ({
    id: `module-${index}`,
    name: `Module ${String(index).padStart(3, '0')}`,
    path: `src/module-${index}`,
    node_ids: [`node-${index}`],
  }));
  const nodes = modules.map((module) => ({ id: module.node_ids[0], label: `Anchor ${module.name}`, kind: 'function', file: `${module.path}/index.c`, line: 1 }));
  if (childCount && modules[0]) {
    modules.push(...Array.from({ length: childCount }, (_, index) => ({
      id: `child-${index}`,
      name: `Child ${String(index).padStart(3, '0')}`,
      parent_id: modules[0].id,
      node_ids: [`child-node-${index}`],
    })));
    nodes.push(...Array.from({ length: childCount }, (_, index) => ({ id: `child-node-${index}`, label: `Child anchor ${index}`, kind: 'function', file: `src/child-${index}.c`, line: 1 })));
  }
  return { repository: 'fixture', revision: 'test', language: 'C', lines: 1, indexedNodes: nodes.length, includedNodes: nodes.length, coverageScope: 'repository', limitations: [], modules, nodes };
}

for (const count of [0, 1, 8, 30, 500]) {
  const regions = projectTopLevelRegions(snapshot(count));
  const expected = Math.min(count, 12);
  if (regions.length !== expected) throw new Error(`${count} modules projected to ${regions.length}; expected ${expected}`);
  if (regions.length > 12) throw new Error(`${count} modules exceeded the twelve-region adapter bound`);
  if (count > 12 && !regions.at(-1)?.rolledUp) throw new Error(`${count} modules did not emit an explicit remainder region`);
  console.log(`ok ${count} top-level modules → ${regions.length} regions`);
}

const children = projectTopLevelRegions(snapshot(1, 20));
if (children[0]?.children?.length !== 12) throw new Error(`20 child modules projected to ${children[0]?.children?.length ?? 0}; expected 12 including remainder`);
if (!children[0]?.children?.at(-1)?.label.startsWith('Other ')) throw new Error('child projection is missing its explicit remainder roll-up');
console.log('ok 20 child modules → 12 bounded children');

const macroBound = projectTopLevelRegions(snapshot(10), 9);
if (macroBound.length !== 9 || !macroBound.at(-1)?.rolledUp || !macroBound.at(-1)?.label.startsWith('Other ')) throw new Error('nine-region macro bound did not emit an explicit Other remainder');
console.log('ok 10 top-level modules → 9 macro regions with remainder');

const relationshipSnapshot = { ...snapshot(2), relationships: [{ source: 'node-0', target: 'node-1', relation: 'call' }] };
const relationshipRegions = projectTopLevelRegions(relationshipSnapshot, 9);
if (!relationshipRegions[0]?.downstream?.includes('module-1') || !relationshipRegions[1]?.upstream?.includes('module-0')) throw new Error('node relationships did not project to top-level regions');
if (relationshipRegions[0]?.relationshipKinds?.['module-1'] !== 'call') throw new Error('relationship kind did not project to top-level regions');
if (relationshipRegions[1]?.incomingRelationshipKinds?.['module-0'] !== 'call') throw new Error('incoming relationship kind did not project to top-level regions');
console.log('ok node relationships → top-level region relationships');

function topologySnapshot(count, pairs) {
  const base = snapshot(count);
  return { ...base, relationships: pairs.map(([source, target]) => ({ source: `node-${source}`, target: `node-${target}`, kind: 'calls' })) };
}
const pipeline = projectTopLevelRegions(topologySnapshot(4, [[0, 1], [1, 2], [2, 3]]), 9);
if (pipeline[0]?.downstream?.join() !== 'module-1' || pipeline[3]?.upstream?.join() !== 'module-2') throw new Error('pipeline topology was not preserved');
const fan = projectTopLevelRegions(topologySnapshot(4, [[0, 1], [0, 2], [0, 3]]), 9);
if (fan[0]?.downstream?.length !== 3 || fan.slice(1).some((region) => !region.upstream?.includes('module-0'))) throw new Error('fan-out topology was not preserved');
const meshPairs = Array.from({ length: 4 }, (_, source) => Array.from({ length: 4 }, (_, target) => [source, target])).flat().filter(([source, target]) => source !== target);
const mesh = projectTopLevelRegions(topologySnapshot(4, meshPairs), 9);
if (mesh.some((region) => region.upstream?.length !== 3 || region.downstream?.length !== 3)) throw new Error('flat mesh topology was not preserved');
console.log('ok pipeline, fan-out, and flat-mesh topology fixtures');

const rankedBase = snapshot(4);
rankedBase.modules = rankedBase.modules.map((module, index) => ({ ...module, node_ids: Array.from({ length: index + 1 }, (_, child) => `node-${child % 4}`) }));
const rankedFirst = projectTopLevelRegions(rankedBase, 9);
const rankedSecond = projectTopLevelRegions(rankedBase, 9);
if (JSON.stringify(rankedFirst) !== JSON.stringify(rankedSecond)) throw new Error('identical snapshots produced different projections');
if (rankedFirst[0]?.nodeCount !== 4) throw new Error('regions were not ranked by architectural footprint');
console.log('ok deterministic footprint ranking');

const aliasBase = snapshot(2);
const aliasSnapshot = { ...aliasBase, modules: aliasBase.modules.map(({ node_ids: _nodeIds, ...module }) => module), nodes: aliasBase.nodes.map((node, index) => ({ ...node, module: `Module ${String(index).padStart(3, '0')}` })), relationships: [{ source: 'node-0', target: 'node-1' }] };
const aliasRegions = projectTopLevelRegions(aliasSnapshot, 9);
if (!aliasRegions[0]?.downstream?.includes('module-1')) throw new Error('module name aliases did not resolve node relationships');
console.log('ok module name aliases resolve relationships');
const collisionSnapshot = { ...aliasSnapshot, modules: aliasSnapshot.modules.map((module) => ({ ...module, name: 'Shared module' })), nodes: aliasSnapshot.nodes.map((node) => ({ ...node, module: 'Shared module' })) };
const collisionRegions = projectTopLevelRegions(collisionSnapshot, 9);
if (collisionRegions.some((region) => region.upstream?.length || region.downstream?.length)) throw new Error('ambiguous module aliases inferred a relationship');
console.log('ok ambiguous module aliases remain unprojected');
const idPrecedenceSnapshot = { ...aliasSnapshot, modules: [{ ...aliasSnapshot.modules[0], id: 'shared', name: 'Alpha' }, { ...aliasSnapshot.modules[1], id: 'module-1', name: 'shared' }], nodes: aliasSnapshot.nodes.map((node, index) => ({ ...node, module: index === 0 ? 'shared' : 'module-1' })) };
const idPrecedenceRegions = projectTopLevelRegions(idPrecedenceSnapshot, 9);
if (!idPrecedenceRegions[0]?.downstream?.includes('module-1')) throw new Error('canonical module ID did not take precedence over a colliding name alias');
console.log('ok canonical module IDs take precedence over aliases');
const membershipConflictSnapshot = { ...snapshot(2), modules: [{ ...snapshot(2).modules[0], node_ids: ['node-0'] }, { ...snapshot(2).modules[1], node_ids: ['node-1'] }], nodes: snapshot(2).nodes.map((node, index) => ({ ...node, module: index === 0 ? 'module-1' : 'module-1' })), relationships: [{ source: 'node-0', target: 'node-1' }] };
const membershipConflictRegions = projectTopLevelRegions(membershipConflictSnapshot, 9);
if (membershipConflictRegions.some((region) => region.upstream?.length || region.downstream?.length)) throw new Error('conflicting node module membership inferred a relationship');
console.log('ok conflicting node membership remains unprojected');

const validBundle = {
  format: 'lachesis-explorer-bundle',
  schema_version: '2.0',
  meta: { repository: 'fixture', language: 'C', revision: 'test', lines: 1, indexed_nodes: 1 },
  graph: { nodes: [{ id: 'node-0', label: 'Anchor', kind: 'function', file: 'src/main.c', line: 1, snippet: 'int main(void) {}' }] },
};
if (!isLachesisBundle(validBundle)) throw new Error('valid bundle rejected by the schema guard');
const comprehensionBundle = {
  ...validBundle,
  analysis_projection: 'code-understanding',
  graph: {
    ...validBundle.graph,
    nodes: [
      validBundle.graph.nodes[0],
      { id: 'node-1', label: 'Dispatch', kind: 'function', file: 'src/main.c', line: 4 },
      { id: 'node-2', label: 'Respond', kind: 'function', file: 'src/main.c', line: 8 },
    ],
    entrypoints: [{ id: 'entry.main', label: 'main', kind: 'cli-entry', node_id: 'node-0', file: 'src/main.c', line: 1 }],
  },
  paths: { requests: [{ id: 'request.main', kind: 'call-path', description: 'Main lifecycle', entry_node: 'node-0', source_node: 'node-0', sink_node: 'node-2', hops: [{ node_id: 'node-0', caption: 'receives' }, { node_id: 'node-1', caption: 'dispatches', edge_label: 'calls' }, { node_id: 'node-2', caption: 'responds', edge_label: 'calls' }] }], values: [] },
  security: { findings: [] },
  meta: { ...validBundle.meta, indexed_nodes: 3, description: 'A bounded request path through the system.', source_url_template: 'https://github.com/example/repo/blob/{revision}/{file}#L{line}-L{end_line}' },
};
if (!isLachesisBundle(comprehensionBundle)) throw new Error('valid comprehension projection rejected by the schema guard');
const comprehensionSnapshot = toDesignMapSnapshot(comprehensionBundle);
if (comprehensionSnapshot.description !== 'A bounded request path through the system.' || comprehensionSnapshot.sourceUrlTemplate !== comprehensionBundle.meta.source_url_template || comprehensionSnapshot.entrypoints.length !== 1 || comprehensionSnapshot.requestPaths[0]?.hops.length !== 3) throw new Error('comprehension metadata, source template, entrypoints, or request paths were dropped by the adapter');
if (isLachesisBundle({ ...comprehensionBundle, paths: { requests: [{ ...comprehensionBundle.paths.requests[0], hops: comprehensionBundle.paths.requests[0].hops.slice(0, 2) }] } })) throw new Error('underspecified comprehension path accepted by the schema guard');
if (isLachesisBundle({ ...comprehensionBundle, graph: { ...comprehensionBundle.graph, entrypoints: [] } })) throw new Error('code-understanding bundle without an entrypoint accepted by the schema guard');
if (isLachesisBundle({ ...comprehensionBundle, graph: { ...comprehensionBundle.graph, nodes: comprehensionBundle.graph.nodes.map((node) => node.id === 'node-2' ? { ...node, file: '', line: 0 } : node) }, paths: { requests: [{ ...comprehensionBundle.paths.requests[0], hops: comprehensionBundle.paths.requests[0].hops.map((hop) => hop.node_id === 'node-2' ? { ...hop, node_id: 'node-2' } : hop) }] } })) throw new Error('code-understanding bundle without a source-backed multi-hop path accepted by the schema guard');
console.log('ok comprehension entrypoints and guided paths retained');
const conceptBundle = {
  ...comprehensionBundle,
  graph: {
    ...comprehensionBundle.graph,
    modules: [{ id: 'module.main', name: 'src.main', path: 'src/main.c', node_ids: ['node-0', 'node-1', 'node-2'] }],
    concepts: [
      { id: 'concept.entry', label: 'Request entry', description: 'Receives work at the public boundary.', node_ids: ['node-0'] },
      { id: 'concept.dispatch', label: 'Dispatch', description: 'Selects and invokes the responsible handler.', node_ids: ['node-1', 'node-2'] },
    ],
    edges: [{ source: 'node-0', target: 'node-1', kind: 'calls' }],
  },
};
if (!isLachesisBundle(conceptBundle)) throw new Error('valid architecture concepts rejected by the schema guard');
const conceptSnapshot = toDesignMapSnapshot(conceptBundle);
const conceptRegions = projectTopLevelRegions(conceptSnapshot, 9);
if (conceptRegions.length !== 2 || conceptRegions[0]?.label !== 'Dispatch' || !conceptRegions.some((region) => region.summary?.includes('public boundary'))) throw new Error('multi-concept architecture did not replace the file-module projection');
if (!conceptRegions.find((region) => region.id === 'concept.entry')?.downstream?.includes('concept.dispatch')) throw new Error('graph relationships were not projected across architecture concepts');
const coarseConceptSnapshot = { ...conceptSnapshot, concepts: [conceptSnapshot.concepts[0]] };
if (projectTopLevelRegions(coarseConceptSnapshot, 9)[0]?.id !== 'module.main') throw new Error('one catch-all concept replaced the more useful module projection');
console.log('ok architectural concepts preferred while preserving authored overlap');
const noModuleBundle = { ...validBundle, graph: { nodes: [{ id: 'node-a', label: 'A', kind: 'function', file: '', line: 0 }, { id: 'node-b', label: 'B', kind: 'function', file: 'src/beta/b.c', line: 1, snippet: 'void b() {}' }], edges: [{ source: 'node-a', target: 'node-b', kind: 'calls' }] }, meta: { ...validBundle.meta, indexed_nodes: 2 } };
if (!isLachesisBundle(noModuleBundle)) throw new Error('valid bundle without modules rejected by the schema guard');
const noModuleSnapshot = toDesignMapSnapshot(noModuleBundle);
const noModuleRegions = projectTopLevelRegions(noModuleSnapshot, 9);
if (noModuleRegions.length !== 2 || !noModuleRegions[0]?.downstream?.includes(noModuleRegions[1]?.id ?? '')) throw new Error('nodes without declared modules did not derive a conservative relationship projection');
if (!noModuleSnapshot.limitations.some((item) => /derived from node module\/file metadata/i.test(item))) throw new Error('derived-module limitation was not disclosed');
console.log('ok bundles without declared modules derive conservative regions');
const partialModuleBundle = { ...validBundle, graph: { nodes: [{ id: 'node-a', label: 'A', kind: 'function', file: 'src/alpha/a.c', line: 1, module: 'alpha' }, { id: 'node-b', label: 'B', kind: 'function', file: 'src/beta/b.c', line: 1 }], modules: [{ id: 'module-alpha', name: 'Alpha', node_ids: [] }], edges: [{ source: 'node-a', target: 'node-b', kind: 'calls' }] }, meta: { ...validBundle.meta, indexed_nodes: 2 } };
if (!isLachesisBundle(partialModuleBundle)) throw new Error('valid bundle with partial module membership rejected by the schema guard');
const partialSnapshot = toDesignMapSnapshot(partialModuleBundle);
if (partialSnapshot.modules.length !== 2 || partialSnapshot.modules[0]?.node_ids?.length !== 1 || !partialSnapshot.limitations.some((item) => /not assigned to a declared module/i.test(item))) throw new Error('unassigned graph nodes were dropped instead of conservatively projected');
console.log('ok partial module membership remains visible');
const representativeNodes = projectTopLevelRegions(snapshot(1));
if (representativeNodes[0]?.children?.[0]?.label !== 'Anchor Module 000' || !representativeNodes[0]?.children?.[0]?.summary.includes('function')) throw new Error('top-level module nodes were not exposed as bounded representative children');
console.log('ok module focus exposes bounded representative nodes');
const windowBundle = { ...validBundle, graph: { nodes: [{ ...validBundle.graph.nodes[0], snippet: undefined, source_window: { start_line: 1, lines: ['int main(void) {}'] } }] } };
if (!isLachesisBundle(windowBundle)) throw new Error('valid source_window bundle rejected by the schema guard');
if (isLachesisBundle({ ...validBundle, meta: { ...validBundle.meta, generated_at: { invalid: true } } })) throw new Error('non-string generated_at accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, meta: { ...validBundle.meta, generated_at: null } })) throw new Error('null generated_at accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, meta: { ...validBundle.meta, source_url_template: 'javascript:alert(1)' } })) throw new Error('non-HTTP source URL template accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, meta: { ...validBundle.meta, indexed_nodes: 1.5 } })) throw new Error('non-integer indexed_nodes accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [{ ...validBundle.graph.nodes[0], kind: 42 }] } })) throw new Error('non-string node kind accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, edges: [{ source: 'node-0', target: 'node-0', relation: 42 }] } })) throw new Error('non-string edge relation accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, modules: [{ id: 'module-0', name: 'Module', node_ids: [42] }] } })) throw new Error('non-string module node ID accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, coverage: { limitations: 'not-an-array' } } })) throw new Error('non-array coverage limitations accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, capabilities: 'not-an-array' } })) throw new Error('non-array graph capabilities accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, capabilities: ['relationships', 42] } })) throw new Error('non-string graph capability accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, coverage: { indexed_nodes: 2.5 } } })) throw new Error('non-integer coverage count accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, coverage: { included_nodes: 0 } } })) throw new Error('coverage included_nodes mismatch accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, coverage: { included_nodes: 1, indexed_nodes: 0 } } })) throw new Error('coverage indexed_nodes below included_nodes accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [{ ...validBundle.graph.nodes[0], documentation: null }] } })) throw new Error('null node documentation accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, coverage: { included_nodes: null } } })) throw new Error('null coverage count accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, coverage: null } })) throw new Error('null coverage object accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [] } })) throw new Error('empty graph accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [{ ...validBundle.graph.nodes[0], label: '' }] } })) throw new Error('blank node label accepted by the schema guard');
if (!isLachesisBundle({ ...validBundle, graph: { nodes: [{ ...validBundle.graph.nodes[0], snippet: undefined }] } })) throw new Error('source-less graph node was rejected by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [{ ...validBundle.graph.nodes[0], snippet: undefined, source_window: { lines: [] } }] } })) throw new Error('empty source_window accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [{ ...validBundle.graph.nodes[0], parent_id: 'missing-node' }] } })) throw new Error('dangling node parent reference accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [{ ...validBundle.graph.nodes[0], parent_id: 'node-0' }] } })) throw new Error('self-referential node parent accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [{ id: 'node-0', label: 'A', kind: 'function', file: 'a.c', line: 1, parent_id: 'node-1' }, { id: 'node-1', label: 'B', kind: 'function', file: 'b.c', line: 1, parent_id: 'node-0' }] } })) throw new Error('cyclic node hierarchy accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, edges: [{ source: 'node-0', target: 'missing-node' }] } })) throw new Error('dangling graph edge accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, edges: [{ id: 'edge-0', source: 'node-0', target: 'node-0' }, { id: 'edge-0', source: 'node-0', target: 'node-0' }] } })) throw new Error('duplicate graph edge IDs accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, edges: [{ id: '', source: 'node-0', target: 'node-0' }] } })) throw new Error('blank graph edge ID accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [validBundle.graph.nodes[0], validBundle.graph.nodes[0]] } })) throw new Error('duplicate node IDs accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, modules: [{ id: 'module-0', name: 'Module', node_ids: ['missing-node'] }] } })) throw new Error('dangling module node reference accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, modules: [{ id: 'module-0', name: 'Module', parent_id: 'missing-module' }] } })) throw new Error('dangling module parent reference accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, modules: [{ id: 'module-0', name: 'Module' }, { id: 'module-0', name: 'Duplicate' }] } })) throw new Error('duplicate module IDs accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, modules: [{ id: 'module-0', name: 'Module', node_ids: ['node-0'] }, { id: 'module-1', name: 'Duplicate membership', node_ids: ['node-0'] }] } })) throw new Error('duplicate module node membership accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, modules: [{ id: 'module-0', name: 'Cycle A', parent_id: 'module-1' }, { id: 'module-1', name: 'Cycle B', parent_id: 'module-0' }] } })) throw new Error('cyclic module hierarchy accepted by the schema guard');
console.log('ok malformed metadata rejected by bundle guard');
