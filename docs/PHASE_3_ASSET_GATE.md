# Phase 3 public asset gate

## Status

The owner-authorized private model bundle may serve public pilot inference through
the owner-managed Render service, which is publicly reachable by the application but not a supported third-party API. The bundle, model artifacts, and scraped Ecuador
dataset remain outside this workspace and are not published. The public artifact
release gate is closed for distribution, but it does not block the current pilot
runtime. Any use or redistribution conditions remain tied to the original
sources; this document makes no legal determination.

Phase 2 materialized approved code only. No model, vectorizer, training dataset,
or derived artifact has been admitted to the public repository.

## Evidence and boundary

Legacy review identified private model and dataset material associated with
third-party sources. Those bytes, their paths, and their digests are intentionally
not published here. They remain private and are not thereby authorized for
redistribution.

## Technical checks are separate from authorization

Repository and runtime checks, when performed, show only that approved code can
be exercised in its verified environment. They are not evidence of asset
ownership, dataset licensing, provenance, privacy review, leakage review,
artifact-release approval, or permission to redistribute a private artifact.

## Reference sources

- [Ecuador Chequea methodology](https://ecuadorchequea.com/metodologia-ecuador-chequea/)
- [Ecuador Verifica methodology](https://ecuadorverifica.org/metodologia/)
- [GitHub Docs: adding a license to a repository](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-a-license-to-a-repository)

These sources provide project context and the general role of explicit licenses;
they are not a grant for private corpus or artifacts. This gate records no
inferred license, authorization, or approval.

## Minimum evidence to publish an artifact

1. Obtain documented, applicable permission or a verified public license for every training-data source and for distribution of any derived artifacts.
2. Produce a reviewable lineage record that maps each artifact to approved source data, preprocessing, training process, and permitted use.
3. Record approved integrity digests for the exact model, vectorizer, and configuration, plus a designated artifact-release approver.
4. Verify upstream license context and separately establish the actual role of each source in historic training; byte identity alone is insufficient.
5. Re-run the public artifact-release review and implement the required integrity and lineage controls before distributing any artifact; only then may a separately approved action consider publication.

None of these publication conditions is implied by the current pilot runtime.

## Explicitly out of scope while the release gate is closed

Do not copy or add artifacts/datasets, publish assets, train a replacement model,
or treat the application as production-ready. The private bundle remains
owner-controlled outside the public workspace; its access and operational
details are intentionally not documented here.
