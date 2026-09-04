import Link from 'next/link';
import { flowSteps, illustrativeSnapshot } from '../../lib/view-model';

export function FlowDiagram() {
  return (
    <section className="ordered-path" aria-label="Packet processing path">
      <div className="path-line" aria-hidden="true" />
      {flowSteps.map((step, index) => {
        const region = illustrativeSnapshot.regions.find((item) => item.id === step.regionId);
        return <article className="path-step" key={step.id}>
          <div className="path-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
          <div className="path-copy"><p className="path-handoff">{step.handoff}</p><h2>{step.noun}</h2><p>{region?.summary}</p>{step.guard && <p className="path-guard"><strong>Guard</strong>{step.guard}</p>}<Link className="text-link" href={`/explore?repository=${encodeURIComponent(illustrativeSnapshot.repository)}&revision=${illustrativeSnapshot.revision}&region=${step.regionId}&anchor=${encodeURIComponent(step.anchor)}`}>Inspect {step.anchor} in Lachesis →</Link></div>
        </article>;
      })}
    </section>
  );
}
