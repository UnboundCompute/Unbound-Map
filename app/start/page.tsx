import type { Metadata } from 'next';
import { DocsShell, PageIntro } from '../components/DocsShell';
import { RepositoryLauncher } from '../components/RepositoryLauncher';
import { emptySnapshot } from '../../lib/view-model';
import { documentMetadata } from '../../lib/seo';

export const metadata: Metadata = documentMetadata('Start a repository map · Unbound Map', 'Generate a new repository map or open a cached graph-backed snapshot.');

export default function StartPage() {
  return <DocsShell active="/start" snapshot={emptySnapshot}><div className="doc-page start-page landing-page">
    <PageIntro eyebrow="Unbound Map · New snapshot" title="Choose a repository to begin." snapshot={emptySnapshot}>Generate a graph-backed map from a public repository, or open one that Lachesis has already indexed.</PageIntro>
    <RepositoryLauncher />
  </div></DocsShell>;
}
