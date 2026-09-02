# Migration plan

## Principle

Do not copy the dirty worktree. The current checkout is non-canonical: it is dirty, diverged, and contains legacy/private material. Migration starts from an approved immutable source set—one or more clean, role-assigned SHAs—and an explicit allowlist. A source set never authorizes a recursive copy.

Phase 0 is recorded in [Phase 0 source evidence](PHASE_0_SOURCE_EVIDENCE.md).

## Current state

- Phase 0: **PASS** — immutable two-source set approved.
- Phase 1: **PASS** — [236 tracked blobs are exhaustively classified](PHASE_1_ALLOWLIST.md); validator output is PASS.
- Phase 2: **materialized and locally verified** - only allowlisted Phase 2 paths were recreated from the frozen GitHub blobs. Applicable checks passed: allowlist validator, COPY blob verification, focused backend tests, frontend package/static/build/E2E checks, `pip check`, installed versions and requirement pins, and 95 applicable pytest tests. This runtime evidence is not production or Phase 3 asset authorization.
- Phase 3: **Public artifact release remains closed** - the owner-authorized private model bundle serves current public pilot inference, while model/data assets remain absent from the public repository. See [Phase 3 public asset gate](PHASE_3_ASSET_GATE.md).
- Phase 3 private runtime: **owner-authorized, no retraining** - the private bundle is not published, and the workspace/public code excludes model assets and the scraped Ecuador dataset.

## Phases and gates

| Phase | Work | Gate to proceed | Rollback |
|---|---|---|---|
| 0. Freeze source evidence | Identify an approved immutable source set: one or more clean SHAs, each with repository, branch, role, provenance, and approval. | Every source SHA is reachable, reviewed, role-assigned, and approved. | Stop; replace only the deficient source identity. |
| 1. Build allowlist | Classify each candidate path against its assigned source SHA as include, private, legacy, generated, or unknown. | Every materialized path has an approved classification; unknown is excluded. | Remove the unapproved path from the new workspace. |
| 2. Materialize safely | Recreate only allowlisted source and minimal configuration from the assigned approved SHA. No recursive copy, archive extraction, or history transfer. | Path manifest matches allowlist; no private/operational content found. | Delete only newly materialized approved paths; preserve audit record. |
| 3. Reproduce or review public assets | Rebuild artifacts exclusively from verified-public-license datasets, or run explicit documented rights, privacy, and leakage-risk review for any artifact trained with private scraped data. | License, provenance, reproducibility, quality checks, and the applicable artifact-release gate pass before publication. This gate does not block owner-authorized private pilot inference. | Keep the artifact/package private. |
| 4. Verify product | Add and run focused frontend/API/model tests, security checks, and documentation checks. | Results are recorded against the candidate revision. | Fix in the new workspace; never patch from the dirty checkout. |
| 5. Deploy preview | Select hosting through a documented provider decision, then configure approved frontend/API targets using non-secret deployment settings. | Preview smoke tests, privacy checks, and cost guardrails pass. The current pilot boundary is Cloudflare Worker frontend plus an owner-managed Render service. | Disable preview or revert to prior known-good release. |
| 6. Public cutover | Verify backups/bundles, rename prior repositories with a `-legacy` suffix to release `ecuador-prioritizer`, create/publish the new definitive repository, reconnect hosting, and validate. | Publication checklist, release manifest, verified backups/bundles, hosting validation, and rollback owner are confirmed. | Revert hosting to the last known-good release; preserve legacy repositories for rollback. |
| 7. Retirement | Archive legacy repositories first. Delete only after a satisfactory rollback window and explicit user authorization. | Archive state, rollback evidence, and explicit user authorization for deletion are recorded. | Stop at archive; do not delete. |

## Required evidence at Phase 0 (completed)

- Immutable source-set record with the full SHA, repository, branch, visibility, and assigned role for each source.
- Reachability of each recorded remote `main` SHA and repository visibility.
- Role inspection showing the public batch/session-only source and the private XGBoost/extractor source, plus the absence of a single clean SHA containing both.
- Explicit exclusion of the dirty local checkout as a source of record.

## Phase 1 requirements and gate

- The exhaustive manifest is [`manifests/source-allowlist.json`](../manifests/source-allowlist.json); its review summary is [Phase 1 source allowlist](PHASE_1_ALLOWLIST.md).
- Both frozen trees are fully covered: 96 public blobs + 140 private blobs, with zero UNKNOWN.
- Phase 1 passed classification only; Phase 2 materialization proceeded after explicit approval and a fresh validator PASS.

## Phase 3 artifact requirements and gate

The public artifact release gate remains closed. No private artifact has been admitted to the public repository; see [Phase 3 public asset gate](PHASE_3_ASSET_GATE.md)
for the evidence boundary and publication conditions. This does not block the
owner-authorized private bundle from serving the current public pilot.

- Verify public artifact/data license, provenance, hash, reproducibility, and quality evidence.
- For artifacts trained with private scraped data, require verified-public-only reproduction or documented rights, privacy, and leakage-risk approval.
- Keep the artifact/package private until the applicable artifact-release gate passes.
- Use or redistribution conditions remain tied to the original sources; no legal conclusion is inferred here.

## Materialization rules

- Create files path-by-path from the approved source SHA assigned in the allowlist.
- Do not initialize Git in this workspace during this documentation phase.
- Do not copy source code, model outputs, datasets, secrets, screenshots, archives, logs, or operational artifacts now.
- Do not use the existing worktree as a source of truth.
- Artifacts trained with private scraped data stay private until the Phase 3 artifact-release gate passes.
- Record hashes for each public artifact before release.

## Repository retirement policy

- During Phases 0–5, do not delete or rename previous repositories.
- At Phase 6, retain verified backups/bundles before any rename. Renaming old repositories with `-legacy` releases the definitive name for the new public repository.
- Reusing the old GitHub repository name invalidates GitHub redirects to the legacy repository. This is the tradeoff for keeping the new project at the definitive name; publish migration guidance before cutover.
- At Phase 7, archive before considering deletion. Do not set an invented number of rollback days; deletion needs a satisfactory rollback window and explicit user authorization.

## Cutover safety

- Keep the prior public endpoint unchanged until the new release passes the agreed smoke checks.
- Use a documented rollback action for both frontend and API.
- Do not claim production readiness without deployment identity, live checks, and release-manifest evidence.
- Do not resolve final hosting from historical documentation alone; use the Phase 5 decision gate.

Related: [Publication policy](PUBLICATION_POLICY.md), [Free deployment](FREE_DEPLOYMENT.md), [Phase 0 source evidence](PHASE_0_SOURCE_EVIDENCE.md), and [Phase 1 source allowlist](PHASE_1_ALLOWLIST.md).
