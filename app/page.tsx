import Link from 'next/link';
import { DocsShell, EvidenceNote, PageIntro } from './components/DocsShell';
import { illustrativeSnapshot } from '../lib/view-model';

export default function HomePage() {
  return <DocsShell active="/">
    <div className="doc-page start-page">
      <PageIntro title="See the system before you read it." snapshot={illustrativeSnapshot}>
        {illustrativeSnapshot.repository} turns network traffic into structured protocol state, runs a wide detection stage across it, and emits alerts and telemetry. This is the short architectural orientation before the source.
      </PageIntro>
      <section className="thesis-block" aria-labelledby="thesis-title"><div className="thesis-label">The structural idea</div><h2 id="thesis-title">A long packet-processing path with a broad detection stage in the middle.</h2><p>Start at the wire, follow the handoffs, then choose the region that answers your question. The map names responsibilities; Lachesis opens the exact implementation.</p></section>
      <section className="start-map-preview" aria-labelledby="preview-title"><div className="section-heading-row"><div><h2 id="preview-title">The route through the repository</h2><p>One glance gives you the shape. Open Architecture when you need to focus a region.</p></div><Link className="quiet-link" href="/architecture">Open Architecture <span aria-hidden="true">→</span></Link></div><div className="macro-path" aria-label="Network input to output architecture path">{['wire', 'decode', 'flow + stream', 'protocols', 'detect', 'output'].map((label, index) => <span key={label} className={index === 4 ? 'path-emphasis' : ''}>{label}</span>)}</div><p className="map-caption">The detection stage is intentionally wider: it is where protocol-aware rules, prefilters, and matchers meet the normalized stream.</p></section>
      <section className="reading-start" aria-labelledby="start-title"><div className="section-heading-row"><div><h2 id="start-title">Choose a way in</h2><p>Each page answers one question. You can leave and come back without losing repository context.</p></div></div><div className="start-links"><Link href="/architecture" className="start-link"><span className="start-number">01</span><span><strong>Find a responsibility</strong><small>See the bounded system map and region chapters.</small></span><span className="link-arrow" aria-hidden="true">↗</span></Link><Link href="/flows" className="start-link"><span className="start-number">02</span><span><strong>Follow a packet</strong><small>Walk one canonical path from bytes to flow state.</small></span><span className="link-arrow" aria-hidden="true">↗</span></Link><Link href="/trust" className="start-link"><span className="start-number">03</span><span><strong>Understand an obligation</strong><small>Use the glossary to locate trust surfaces without calling them findings.</small></span><span className="link-arrow" aria-hidden="true">↗</span></Link></div></section>
      <EvidenceNote>Illustrative prototype: repository facts and Suricata wording here are a content fixture until a graph-backed snapshot is connected. Structural claims should carry the loaded revision and coverage when published.</EvidenceNote>
    </div>
  </DocsShell>;
}
