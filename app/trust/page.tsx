import Link from 'next/link';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from '../components/DocsShell';
import { TrustGlossary } from '../components/TrustGlossary';
import { illustrativeSnapshot } from '../../lib/view-model';

export const metadata: Metadata = { title: 'Suricata trust surfaces · Design Map', description: 'Use a searchable glossary to understand security and correctness obligations in Suricata without mistaking presence for a finding.' };

export default function TrustPage() {
  return <DocsShell active="/trust"><div className="doc-page trust-page"><PageIntro title="Where do obligations begin?" snapshot={illustrativeSnapshot}>Trust surfaces are places where data enters, is constrained, or leaves a processing boundary. This page explains the obligation without turning a source or sink into a vulnerability claim.</PageIntro><section className="trust-intro"><h2>Read the obligation, then inspect the evidence.</h2><p>Choose a surface by what it does—enters, protects, or leaves—then open its anchor in Lachesis for exact guards and references.</p></section><TrustGlossary /><EvidenceNote>Illustrative taxonomy: the domains and locations below are a prototype index. Presence identifies where to investigate; it does not establish exploitability or a finding.</EvidenceNote><Link className="quiet-link" href="/architecture">Return to Architecture <span aria-hidden="true">→</span></Link></div></DocsShell>;
}
