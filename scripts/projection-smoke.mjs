import { isLachesisBundle, projectTopLevelRegions } from '../lib/design-map.ts';

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
if (macroBound.length !== 9 || !macroBound.at(-1)?.rolledUp) throw new Error('nine-region macro bound did not emit an explicit remainder');
console.log('ok 10 top-level modules → 9 macro regions with remainder');

const relationshipSnapshot = { ...snapshot(2), relationships: [{ source: 'node-0', target: 'node-1', kind: 'call' }] };
const relationshipRegions = projectTopLevelRegions(relationshipSnapshot, 9);
if (!relationshipRegions[0]?.downstream?.includes('module-1') || !relationshipRegions[1]?.upstream?.includes('module-0')) throw new Error('node relationships did not project to top-level regions');
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

const validBundle = {
  format: 'lachesis-explorer-bundle',
  schema_version: '2.0',
  meta: { repository: 'fixture', language: 'C', revision: 'test', lines: 1, indexed_nodes: 1 },
  graph: { nodes: [{ id: 'node-0', label: 'Anchor', kind: 'function', file: 'src/main.c', line: 1 }] },
};
if (!isLachesisBundle(validBundle)) throw new Error('valid bundle rejected by the schema guard');
if (isLachesisBundle({ ...validBundle, meta: { ...validBundle.meta, generated_at: { invalid: true } } })) throw new Error('non-string generated_at accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, meta: { ...validBundle.meta, generated_at: null } })) throw new Error('null generated_at accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, meta: { ...validBundle.meta, indexed_nodes: 1.5 } })) throw new Error('non-integer indexed_nodes accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [{ ...validBundle.graph.nodes[0], kind: 42 }] } })) throw new Error('non-string node kind accepted by the schema guard');
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
