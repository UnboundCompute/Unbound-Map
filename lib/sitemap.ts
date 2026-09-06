type RepositoryPublication = {
  repository?: string;
  revision?: string;
  curated_tour?: unknown;
};

function publishedPath(repository: string | undefined, revision: string | undefined) {
  if (!repository || !revision || !/^[0-9a-f]{7,64}$/i.test(revision)) return undefined;
  const parts = repository.split('/').filter(Boolean);
  const [host, owner, repo] = parts.length === 2 ? ['github.com', parts[0], parts[1]] : parts.length === 3 ? parts : [];
  if (!host || !owner || !repo || !['github.com', 'gitlab.com', 'bitbucket.org'].includes(host) || !/^[A-Za-z0-9._-]{1,100}$/.test(owner) || !/^[A-Za-z0-9._-]{1,100}$/.test(repo)) return undefined;
  return `/r/${(host === 'github.com' ? [owner, repo] : [host, owner, repo]).map((part) => encodeURIComponent(part)).join('/')}`;
}

export function approvedCanonicalRoutes(repositories: RepositoryPublication[]) {
  return [...new Set(repositories
    .filter((item) => Boolean(item.curated_tour && typeof item.curated_tour === 'object' && !Array.isArray(item.curated_tour)))
    .map((item) => publishedPath(item.repository, item.revision))
    .filter((route): route is string => Boolean(route)))];
}
