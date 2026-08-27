# Ecuador Prioritizer

A public, anonymous tool that helps Ecuadorian fact-checkers **prioritize** incoming news and claims for human review. It ranks signals; people decide what to investigate and what to publish.

## Status

**Phases 0-1 passed; Phase 2 is materialized and locally verified.** Allowlisted application paths were recreated from frozen GitHub blobs. **Phase 3 remains `PUBLIC_ASSET_GATE=BLOCKED` for publication:** the owner-authorized private runtime may use historic XGBoost assets without retraining only from an external private bundle. Public code excludes the bundle, model assets, and scraped Ecuador dataset. Technical checks are not asset authorization. Use or redistribution conditions remain tied to original sources; this is not a legal, deployment, production-readiness, hosting, model-package, or public-release claim.

## Scope at a glance

- Public, stateless, session-only prioritization interface.
- React/Vite frontend; FastAPI/Python scoring API.
- TF-IDF + FEDA + XGBoost model pipeline.
- **Límite de alcance del modelo:** cada ítem admite hasta **2.000 caracteres**. En una evaluación offline controlada, usando el pipeline oficial fijo (XGBoost/TF-IDF/FEDA) sobre el holdout congelado de 870 ítems, 2.000 caracteres rindieron mejor que 5.000 y 10.000: macro-F1/accuracy de **0,9428/0,9586**, frente a **0,9313/0,9517** y **0,9296/0,9506**, respectivamente. Este es un límite de producto/modelo, no una garantía de verificación factual.
- No accounts, editorial workflow, cases, comments, database, or definitive verdicts.
- Public release includes approved code only until a separate artifact-release gate approves any additional material; the private bundle/assets/data are excluded.

## Target architecture

```text
Browser → Cloudflare Pages → OCI-hosted FastAPI/XGBoost API
                  └──── optional Cloudflare Worker gateway/rate limit
```

See [Architecture](docs/ARCHITECTURE.md) for boundaries and [Free deployment](docs/FREE_DEPLOYMENT.md) for operating assumptions. Final hosting remains subject to a later decision gate.

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
4. Phase 3 is `PUBLIC_ASSET_GATE=BLOCKED`; assets remain absent/private until documented rights, lineage, and digest evidence pass the gate.
5. Run release checks before any deployment; runtime checks and a blocked asset gate are not production or hosting evidence.

The migration process is defined in [Migration plan](docs/MIGRATION_PLAN.md); source history and the current worktree are not canonical inputs.
