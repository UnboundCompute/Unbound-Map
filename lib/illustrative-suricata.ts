import type { RepositorySnapshotView } from './view-model';

/** Deliberately non-live content used until a real Lachesis bundle is supplied. */
export const illustrativeSnapshot: RepositorySnapshotView = {
  provenance: 'illustrative',
  repository: 'Suricata',
  revision: '8f4c1b2',
  language: 'C',
  coverageScope: 'illustrative repository slice',
  indexedNodes: 12486,
  includedNodes: 12486,
  limitations: ['Illustrative fixture; not a live Suricata checkout.', 'Region placement is editorial.'],
  regions: [
    { id: 'input', label: 'Input & protocol', summary: 'Accepts packets, normalizes framing, and hands validated data to the engine.', path: 'src/decode', nodeCount: 46, metricLabel: '46 illustrative files', anchor: { id: 'decode', label: 'DecodePacket()', file: 'src/decode/decode.c', line: 184 } },
    { id: 'core', label: 'Runtime core', summary: 'Owns the event loop and routes normalized traffic through processing stages.', path: 'src/runmodes', nodeCount: 118, metricLabel: '118 illustrative files', anchor: { id: 'runmode', label: 'RunModeDispatch()', file: 'src/runmodes/runmodes.c', line: 92 } },
    { id: 'detect', label: 'Detection engine', summary: 'Applies protocol-aware rules through a resolved operations table.', path: 'src/detect', nodeCount: 227, metricLabel: '227 illustrative files', anchor: { id: 'signature', label: 'SigMatchSignatures()', file: 'src/detect/detect.c', line: 411 } },
    { id: 'output', label: 'Outputs & telemetry', summary: 'Serializes alerts and metrics for configured output consumers.', path: 'src/output', nodeCount: 74, metricLabel: '74 illustrative files', anchor: { id: 'output', label: 'OutputRegisterModules()', file: 'src/output/output.c', line: 63 } },
  ],
};
