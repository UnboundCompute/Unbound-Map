/** Shared reader-facing evidence vocabulary used across the product surfaces. */
export const EVIDENCE_STATUSES = ['structural', 'semantic', 'lead', 'killed', 'proven', 'fixed', 'unknown'] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export function evidenceStatusLabel(status: EvidenceStatus): string {
  return {
    structural: 'Structural · graph-backed',
    semantic: 'Semantic · model classified',
    lead: 'Lead · review needed',
    killed: 'Killed · refuted by evidence',
    proven: 'Proven · reproduced',
    fixed: 'Fixed · regression closed',
    unknown: 'Unknown · evidence incomplete',
  }[status];
}
