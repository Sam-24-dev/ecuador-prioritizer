# Phase 3 public asset gate

## Status

`PUBLIC_ASSET_GATE=BLOCKED`

The private runtime is owner-authorized for local/private inference only. It uses
historic XGBoost assets without retraining; the external private bundle is not
part of this workspace or public code. The scraped Ecuador dataset remains
private. Any use or redistribution conditions remain tied to the original
sources; this document makes no legal determination.

Phase 2 materialized approved code only. No model, vectorizer, training dataset, or derived artifact has been admitted to this workspace. The runtime continues to fail closed before `joblib.load` while this gate is blocked.

## Evidence and boundary

The following identities were observed only during legacy review. They identify historic bytes; they do not authorize publication, reuse, loading, or distribution.

### Identity evidence only — not publication authorization

| Subject | SHA-256 | Evidence location |
| --- | --- | --- |
| `mejor_modelo.joblib` (model) | `0b727e769494e4f7b0f3c8d21f7590eecc57bec91a838ae3096d7641adc05d63` | Legacy review only |
| `tfidf_vectorizer_shared.joblib` (vectorizer) | `78d3a492d77d5c11c4e9affa3675db1898dda18ef38d2d40bad85e2aa8f297cc` | Legacy review only |
| `xgboost_model_config.json` (configuration) | `b3404422c4c50145c0569f08bbeca19fcd22eccf6343b4ca710d5ca3c4fef5e5` | Legacy review only |
| USMSC dataset | `6fc6c2f9fef2138e8148caf6f1dd03f9969e29c40fdc7ce44d5a5faafe5137af` | [Hugging Face file](https://huggingface.co/datasets/gabrielhuav/Unified-and-Balanced-Spanish-Fake-News-Corpus/blob/04707cf4b99a5bc62b6debefd73569bfbd98bede/gabrielhuav_Unified_Spanish_Misinformation_and_Satire_Corpus_USMSC.csv) at [commit `04707cf4b99a5bc62b6debefd73569bfbd98bede`](https://huggingface.co/datasets/gabrielhuav/Unified-and-Balanced-Spanish-Fake-News-Corpus/commit/04707cf4b99a5bc62b6debefd73569bfbd98bede) |

The three artifacts are absent from `ecuador-prioritizer-next`; no artifact bytes were copied here. The local USMSC dataset copy was byte-identical to the linked Hugging Face file at the listed commit. That byte-for-byte identity does **not** demonstrate a license, historical training lineage, or authorization to use or distribute the dataset or derived artifacts.

The historic model/vectorizer were derived from material associated with Ecuador Chequea, Ecuador Verifica, and USMSC. The legacy review recorded Ecuador Verifica as "Todos los derechos reservados." No license, reuse permission, or documented artifact-release authorization for the historic training inputs or derived artifacts has been established for this public candidate.

## Technical checks are separate from authorization

The current technical runtime checks pass:

- `pip check`: PASS
- Installed versions and requirement pins: PASS
- Applicable pytest suite: 95 passed

Those checks show that the approved code can be installed and exercised in the verified runtime. They are not evidence of asset ownership, dataset licensing, provenance, privacy review, leakage review, artifact integrity approval, or permission to deserialize a historic artifact.

## Reference sources

- [Ecuador Chequea methodology](https://ecuadorchequea.com/metodologia-ecuador-chequea/)
- [Ecuador Verifica methodology](https://ecuadorverifica.org/metodologia/)
- [GitHub Docs: adding a license to a repository](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-a-license-to-a-repository)

These sources provide project context and the general role of explicit licenses; they are not a grant for the historic corpus or artifacts. This gate records no inferred license, hash, authorization, or approval.

## Minimum evidence to unlock

1. Obtain documented, applicable permission or a verified public license for every training-data source and for distribution of the derived artifacts.
2. Produce a reviewable lineage record that maps each artifact to approved source data, preprocessing, training process, and permitted use.
3. Record approved SHA-256 digests for the exact model, vectorizer, and configuration, plus a designated artifact-release approver.
4. Verify the relevant USMSC upstream commit and its license context, and separately establish its actual role in historic training; byte identity alone is insufficient.
5. Re-run the public asset gate and implement digest/lineage verification before any `joblib.load`; only then may a separately approved Phase 3 action consider materialization.

None of these unlock conditions is satisfied by the technical runtime checks above.

## Explicitly out of scope while blocked

Do not copy or add artifacts/datasets, call `joblib.load`, train a replacement model, publish assets, deploy hosting, or treat the application as production-ready.

For the private runtime exception, the bundle is stored outside the workspace
and loaded only after its anchored manifest, paths, byte counts, and streamed
SHA-256 digests validate. This does not unlock public publication.
