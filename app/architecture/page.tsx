import Link from 'next/link';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from '../components/DocsShell';
import { MapClient } from '../components/MapClient';
import { illustrativeSnapshot } from '../../lib/view-model';

export const metadata: Metadata = { title: 'Suricata architecture · Design Map', description: 'Explore Suricata’s bounded responsibilities, relationships, and region chapters before opening the source.' };

export default function ArchitecturePage() {
  return <DocsShell active="/architecture"><div className="doc-page architecture-page"><PageIntro title="What are the major responsibilities?" snapshot={illustrativeSnapshot}>The first map is deliberately bounded. It shows the regions that carry Suricata from network input to detection and output, then lets you focus one region at a time.</PageIntro><MapClient /><section className="architecture-next"><h2>Map before source.</h2><p>Placement is a reading aid. Labels, counts, and anchors should come from the loaded graph snapshot; exact symbol behavior belongs in Lachesis.</p><Link className="quiet-link" href="/flows">Follow the packet flow <span aria-hidden="true">→</span></Link></section><EvidenceNote>Illustrative prototype: this eight-region map is editorial fixture content. A graph-backed bundle may produce a different shape, number of regions, and coverage scope.</EvidenceNote></div></DocsShell>;
}
