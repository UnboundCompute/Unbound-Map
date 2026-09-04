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

const validBundle = {
  format: 'lachesis-explorer-bundle',
  schema_version: '2.0',
  meta: { repository: 'fixture', language: 'C', revision: 'test', lines: 1, indexed_nodes: 1 },
  graph: { nodes: [{ id: 'node-0', label: 'Anchor', kind: 'function', file: 'src/main.c', line: 1 }] },
};
if (!isLachesisBundle(validBundle)) throw new Error('valid bundle rejected by the schema guard');
if (isLachesisBundle({ ...validBundle, meta: { ...validBundle.meta, generated_at: { invalid: true } } })) throw new Error('non-string generated_at accepted by the schema guard');
if (isLachesisBundle({ ...validBundle, meta: { ...validBundle.meta, indexed_nodes: 1.5 } })) throw new Error('non-integer indexed_nodes accepted by the schema guard');
console.log('ok malformed metadata rejected by bundle guard');
