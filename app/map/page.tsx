import { DocsShell, DocTabs } from '../components/DocsShell';
import { MapClient } from '../components/MapClient';

export default function MapPage() {
  return <DocsShell active="/map"><div className="doc-page"><DocTabs active="/map" /><p className="doc-kicker">System map · high-level</p><h1 className="doc-title">Start with the regions.</h1><p className="doc-lede">The repository is easier to enter when its biggest responsibilities have names. Select a region to see its footprint, then follow the anchor into code.</p><MapClient /><p className="doc-footnote">The map is a bounded projection of the graph. Placement is editorial; labels, counts, and anchors retain bundle provenance.</p></div></DocsShell>;
}
