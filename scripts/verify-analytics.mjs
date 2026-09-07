import { sanitizeEventProperties } from '../lib/analytics.ts';

const longValue = 'x'.repeat(65);
const sanitized = sanitizeEventProperties({
  surface: 'flow_card',
  action: 'map_another_repository',
  repository: 'owner/repository',
  source_path: 'src/app.ts',
  label: 'https://github.com/owner/repository',
  harmless_path_label: 'src/components/App.tsx',
  revision: 'abc123',
  long_label: longValue,
  finite_count: 3,
  infinite_count: Infinity,
});

const expected = { surface: 'flow_card', action: 'map_another_repository', finite_count: 3 };
if (JSON.stringify(sanitized) !== JSON.stringify(expected)) {
  throw new Error(`analytics sanitizer regression: ${JSON.stringify(sanitized)}`);
}
if (sanitizeEventProperties({}) !== undefined || sanitizeEventProperties() !== undefined) {
  throw new Error('analytics sanitizer should omit empty properties');
}

console.log('analytics privacy gate: sensitive identifiers and unsafe values redacted');
