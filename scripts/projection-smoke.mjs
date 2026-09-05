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
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, coverage: { indexed_nodes: 2.5 } } })) throw new Error('non-integer coverage count accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [{ ...validBundle.graph.nodes[0], documentation: null }] } })) throw new Error('null node documentation accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, coverage: { included_nodes: null } } })) throw new Error('null coverage count accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, coverage: null } })) throw new Error('null coverage object accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [] } })) throw new Error('empty graph accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [{ ...validBundle.graph.nodes[0], label: '' }] } })) throw new Error('blank node label accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [{ ...validBundle.graph.nodes[0], parent_id: 'missing-node' }] } })) throw new Error('dangling node parent reference accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [{ ...validBundle.graph.nodes[0], parent_id: 'node-0' }] } })) throw new Error('self-referential node parent accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [{ id: 'node-0', label: 'A', kind: 'function', file: 'a.c', line: 1, parent_id: 'node-1' }, { id: 'node-1', label: 'B', kind: 'function', file: 'b.c', line: 1, parent_id: 'node-0' }] } })) throw new Error('cyclic node hierarchy accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, edges: [{ source: 'node-0', target: 'missing-node' }] } })) throw new Error('dangling graph edge accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { nodes: [validBundle.graph.nodes[0], validBundle.graph.nodes[0]] } })) throw new Error('duplicate node IDs accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, modules: [{ id: 'module-0', name: 'Module', node_ids: ['missing-node'] }] } })) throw new Error('dangling module node reference accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, modules: [{ id: 'module-0', name: 'Module', parent_id: 'missing-module' }] } })) throw new Error('dangling module parent reference accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, modules: [{ id: 'module-0', name: 'Module' }, { id: 'module-0', name: 'Duplicate' }] } })) throw new Error('duplicate module IDs accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, modules: [{ id: 'module-0', name: 'Module', node_ids: ['node-0'] }, { id: 'module-1', name: 'Duplicate membership', node_ids: ['node-0'] }] } })) throw new Error('duplicate module node membership accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, graph: { ...validBundle.graph, modules: [{ id: 'module-0', name: 'Cycle A', parent_id: 'module-1' }, { id: 'module-1', name: 'Cycle B', parent_id: 'module-0' }] } })) throw new Error('cyclic module hierarchy accepted by the schema guard');
console.log('ok malformed metadata rejected by bundle guard');
