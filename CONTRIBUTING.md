# Contributing to Unbound Map

Unbound Map is the architecture-reading layer for UnboundCompute. Contributions should keep the
boundary clear: Design Map explains repository shape; Lachesis owns exact symbols and source
context; Trace owns reviewed findings.

## Development

```bash
npm install
npm run check
npm run build
npm run projection-smoke
npm run hosted-smoke
```

Run `npm run smoke` with the local app running on port 3000. Changes to hosted-bundle behavior
should include a focused regression and an entry in `AUDIT.md`. Do not commit `.next`, generated
bundles, credentials, or AWS configuration.

## Pull requests

Describe the reader problem, the route or contract changed, and the verification performed. Keep
implementation and audit/documentation commits separate where practical. Preserve provenance and
avoid presenting illustrative fixture content as repository evidence.
