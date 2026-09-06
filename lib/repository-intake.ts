const PUBLIC_REPOSITORY_HOSTS = new Set(['github.com', 'gitlab.com', 'bitbucket.org']);

export function repositoryUrlError(value: string): string | undefined {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    return 'Enter a full HTTPS repository URL, such as https://github.com/org/repository.';
  }
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.replace(/\/$/, '').replace(/\.git$/, '');
  const segments = path.split('/').filter(Boolean);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || !PUBLIC_REPOSITORY_HOSTS.has(host) || segments.length !== 2) {
    return 'Use a public HTTPS GitHub, GitLab, or Bitbucket repository URL without credentials or extra path segments.';
  }
  return undefined;
}

export function repositoryRefError(value: string): string | undefined {
  const ref = value.trim();
  if (!ref) return undefined;
  if (ref.length > 256 || /[\u0000-\u0020~^:?*\\[\]]/.test(ref) || ref.includes('..') || ref.includes('@{')) {
    return 'Use a branch, tag, or commit ref without spaces or Git-special characters.';
  }
  if (ref === '@' || ref.startsWith('/') || ref.endsWith('/') || ref.startsWith('.') || ref.endsWith('.') || ref.includes('//')) {
    return 'Use a valid branch, tag, or commit ref, such as main or v1.2.3.';
  }
  return undefined;
}
