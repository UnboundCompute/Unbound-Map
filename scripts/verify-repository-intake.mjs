import assert from 'node:assert/strict';
import { repositoryRefError, repositoryUrlError } from '../lib/repository-intake.ts';

for (const value of ['https://github.com/GNOME/libxml2', 'https://gitlab.com/group/project.git', 'https://bitbucket.org/team/project/']) {
  assert.equal(repositoryUrlError(value), undefined, `accepted URL rejected: ${value}`);
}
for (const value of ['http://github.com/GNOME/libxml2', 'https://github.com/GNOME/libxml2?token=secret', 'git@github.com:GNOME/libxml2.git', 'https://github.com/GNOME/libxml2/tree/main']) {
  assert.ok(repositoryUrlError(value), `unsafe URL accepted: ${value}`);
}
for (const value of ['', 'main', 'release/v1.2.3', 'a'.repeat(40)]) {
  assert.equal(repositoryRefError(value), undefined, `valid ref rejected: ${value}`);
}
for (const value of ['feature name', 'main~1', 'main..broken', 'refs//heads/main', '@{bad}']) {
  assert.ok(repositoryRefError(value), `invalid ref accepted: ${value}`);
}
console.log('repository intake: URL and ref validation passed');
