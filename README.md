# Ecuador Prioritizer

A public, anonymous tool that helps Ecuadorian fact-checkers **prioritize** incoming news and claims for human review. It ranks signals; people decide what to investigate and what to publish. It does not verify facts or issue definitive verdicts.

## Live demo

Try the deployed frontend at [ecuador-prioritizer.scaizapa.workers.dev](https://ecuador-prioritizer.scaizapa.workers.dev/).

The frontend is hosted on Cloudflare Workers. Its FastAPI backend runs as a private Render service for this application; it is not a public third-party API endpoint or supported integration.

## Status

**Phases 0-1 passed; Phase 2 is materialized and locally verified.** The owner-authorized private model bundle may serve public pilot inference through the private Render backend. The bundle, model artifacts, and scraped Ecuador dataset remain private and are not published. This is a best-effort pilot for prioritizing items for human review: it does not fact-check, make decisions about people, or promise an SLA. Publication of any private artifact remains a separate release decision.

## Scope at a glance

- Public, stateless, session-only prioritization interface.
- React/Vite frontend; FastAPI/Python scoring API.
- TF-IDF + FEDA + XGBoost model pipeline.
- **Límite de alcance del modelo:** cada ítem admite hasta **2.000 caracteres**. En una evaluación offline controlada, usando el pipeline oficial fijo (XGBoost/TF-IDF/FEDA) sobre el holdout congelado de 870 ítems, 2.000 caracteres rindieron mejor que 5.000 y 10.000: macro-F1/accuracy de **0,9428/0,9586**, frente a **0,9313/0,9517** y **0,9296/0,9506**, respectivamente. Este es un límite de producto/modelo, no una garantía de verificación factual.
- No accounts, editorial workflow, cases, comments, database, or definitive verdicts.
- Public release includes approved code and documentation; the private bundle, model artifacts, and scraped data are excluded.

## Current deployment boundary

```text
Public frontend: Cloudflare Workers
Application backend: private Render FastAPI service
```

See [Architecture](docs/ARCHITECTURE.md) for product boundaries. This README records the current public runtime; it is not a claim of production readiness or a public API commitment.

## Navigation

- [Phase 0 source evidence](docs/PHASE_0_SOURCE_EVIDENCE.md)
- [Phase 1 source allowlist](docs/PHASE_1_ALLOWLIST.md)
- [Phase 3 public asset gate](docs/PHASE_3_ASSET_GATE.md)
- [Source allowlist manifest](manifests/source-allowlist.json)
- [Product scope](docs/PRODUCT_SCOPE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Migration plan](docs/MIGRATION_PLAN.md)
- [Publication policy](docs/PUBLICATION_POLICY.md)
- [Free deployment](docs/FREE_DEPLOYMENT.md)
- [Decision log](docs/DECISION_LOG.md)
- [P7E operations runbook](docs/OPERATIONS_RUNBOOK.md)

## Materialization and later gates

1. Use the approved immutable source set documented in [Phase 0 evidence](docs/PHASE_0_SOURCE_EVIDENCE.md).
2. Validate the approved [Phase 1 allowlist](docs/PHASE_1_ALLOWLIST.md) with `./tools/validate_source_allowlist.ps1`.
3. Phase 2 materialization used only approved entries from their assigned source SHAs.
4. The public artifact release gate remains separate from the current pilot: private assets stay outside the public repository even while the owner-authorized bundle serves pilot inference.
5. Run proportional release checks before future changes; the current deployment boundary is documented above and does not imply production readiness.

The migration process is defined in [Migration plan](docs/MIGRATION_PLAN.md); source history and the current worktree are not canonical inputs.
