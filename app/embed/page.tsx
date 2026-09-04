import Link from 'next/link';
import { MapClient } from '../components/MapClient';
import { illustrativeSnapshot } from '../../lib/view-model';

export const metadata = {
  title: 'Suricata architecture map · Design Map',
  description: 'An embeddable high-level architecture map for Suricata.',
};

export default function EmbedPage() {
  return <main className="embed-page"><header className="embed-header"><div><span className="embed-kicker">Design Map · HLD</span><h1>{illustrativeSnapshot.repository} architecture</h1><p>Read the system shape before the source.</p></div><Link href="/architecture">Open full guide <span aria-hidden="true">↗</span></Link></header><MapClient route="/embed" /><footer className="embed-footer"><span>Illustrative snapshot · {illustrativeSnapshot.revision}</span><Link href="/">About this map</Link></footer></main>;
}
