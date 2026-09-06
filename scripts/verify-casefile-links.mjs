import { casefileFamilies } from '../lib/casefiles.ts';

const entries = Object.entries(casefileFamilies);
const paths = entries.flatMap(([, values]) => values);

if (entries.length !== 29 || paths.length !== 42) {
  throw new Error(`Expected 29 semantic families and 42 Casefile routes, got ${entries.length} and ${paths.length}`);
}

if (new Set(paths).size !== paths.length || paths.some((path) => !path.startsWith('/cves/'))) {
  throw new Error('Casefile crosswalk contains duplicate or malformed routes');
}

console.log(`Casefile crosswalk verified: ${entries.length} semantic families → ${paths.length} routes`);
