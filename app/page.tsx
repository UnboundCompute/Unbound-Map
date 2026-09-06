import type { Metadata } from 'next';
import { DocsShell, PageIntro } from './components/DocsShell';
import { RepositoryLauncher } from './components/RepositoryLauncher';
import { emptySnapshot } from '../lib/view-model';
import { documentMetadata } from '../lib/seo';

export const metadata: Metadata = documentMetadata('Start a repository map · Unbound Map', 'Generate or open a cached graph-backed repository map, then follow its first architectural flow.');

export default function HomePage() {
  return <DocsShell active="/" snapshot={emptySnapshot}><div className="doc-page start-page landing-page"><PageIntro eyebrow="Unbound Map" title="Read the system before the source." snapshot={emptySnapshot}>A repository map should begin with evidence, not a placeholder. Choose a real indexed snapshot or send Lachesis a public repository to generate one.</PageIntro><RepositoryLauncher /><section className="landing-note" aria-labelledby="landing-note-title"><span className="page-eyebrow">The handoff</span><h2 id="landing-note-title">Orientation first. Source detail second.</h2><p>Unbound Map turns a validated Lachesis bundle into a calm, shareable reading path. Once you choose a repository, the first flow opens with its revision and graph context intact.</p></section></div></DocsShell>;
}
