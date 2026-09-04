'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { illustrativeSnapshot, trustDomains } from '../../lib/view-model';

export function TrustGlossary() {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  useEffect(() => {
    const restoreFilters = () => {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get('q') ?? '');
      setKind(params.get('kind') ?? 'all');
    };
    restoreFilters();
    window.addEventListener('popstate', restoreFilters);
    return () => window.removeEventListener('popstate', restoreFilters);
  }, []);
  const updateUrl = (nextQuery: string, nextKind: string) => {
    const params = new URLSearchParams(window.location.search);
    nextQuery ? params.set('q', nextQuery) : params.delete('q');
    nextKind !== 'all' ? params.set('kind', nextKind) : params.delete('kind');
    const value = params.toString();
    window.history.replaceState(null, '', `/trust${value ? `?${value}` : ''}${window.location.hash}`);
  };
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return trustDomains.filter((domain) => {
      const matchesText = !needle || [domain.label, domain.meaning, domain.obligation, ...domain.families].join(' ').toLowerCase().includes(needle);
      const matchesKind = kind === 'all' || (kind === 'input' && ['memory-safety', 'injection', 'request-forgery', 'object-integrity'].includes(domain.id)) || (kind === 'effect' && ['filesystem', 'crypto-transport', 'resource-exhaustion'].includes(domain.id)) || (kind === 'lifecycle' && domain.id === 'resource-lifecycle');
      return matchesText && matchesKind;
    });
  }, [kind, query]);
  return <section className="trust-glossary" aria-label="Trust domain glossary">
    <div className="trust-tools"><label htmlFor="trust-search">Find a trust domain</label><input id="trust-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); updateUrl(event.target.value, kind); }} placeholder="Search memory, input, lifecycle…" /><label htmlFor="trust-kind">Show</label><select id="trust-kind" value={kind} onChange={(event) => { setKind(event.target.value); updateUrl(query, event.target.value); }}><option value="all">All domains</option><option value="input">Input and parsing</option><option value="effect">Effects and cost</option><option value="lifecycle">Lifecycle</option></select></div>
    <div className="trust-result-count" role="status">{filtered.length} of {trustDomains.length} domains</div>
    <div className="trust-key" aria-label="How to interpret a domain"><span><i className="kind-source" /> enters or represents data</span><span><i className="kind-guard" /> obligation to preserve</span><span><i className="kind-sink" /> effect or cost</span></div>
    <div className="trust-domain-list">{filtered.map((domain) => <article className="trust-domain" key={domain.id} id={domain.id}><div className="trust-domain-index"><span>{String(trustDomains.indexOf(domain) + 1).padStart(2, '0')}</span><small>{domain.families.length} families</small></div><div><h2>{domain.label}</h2><p className="trust-meaning">{domain.meaning}</p><p className="trust-obligation"><strong>Obligation</strong>{domain.obligation}</p><div className="trust-families">{domain.families.map((family) => <code key={family}>{family}</code>)}</div><div className="trust-meta"><code>{domain.location}</code><Link className="quiet-link" href={`/explore?${new URLSearchParams({ repository: illustrativeSnapshot.repository, revision: illustrativeSnapshot.revision, region: domain.regionId, label: domain.label, domain: domain.id, anchor: domain.anchor }).toString()}`}>Inspect {domain.anchor} in Lachesis <span aria-hidden="true">↗</span></Link></div><p className="trust-nonclaim">Presence marks a place to investigate; it does not establish exploitability or a finding.</p></div></article>)}</div>{filtered.length === 0 && <p className="trust-empty">No trust domain matches “{query}”. Try a broader term.</p>}
  </section>;
}
