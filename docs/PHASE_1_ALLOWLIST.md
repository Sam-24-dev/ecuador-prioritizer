# Phase 1 source allowlist

## Result: PASS

Every tracked blob in the frozen two-source set is classified in [`source-allowlist.json`](../manifests/source-allowlist.json): **236/236 covered, 0 missing, 0 extra, and 0 UNKNOWN**. Phase 2 has since been materialized in the clean workspace from this approved allowlist; this document remains the Phase 1 classification record, not a publication authorization.

## Frozen scope

| Role | Repository | Commit | Tree | Blobs |
|---|---|---|---|---:|
| Public product | `Sam-24-dev/ecuador-prioritizer` | `145e8b3adc98bb450289aee8ab058ac265e15372` | `0d071ddfd1000a1bdc6d257c3c42170f1414eacd` | 96 |
| Private capability | `Sam-24-dev/ecuador-prioritizer-owner-private` | `9e5d118edee03b9174a598f469a8e2b5c132df76` | `bf9d4bd7702010f03d46ef9fd8f70d8856d0a035` | 140 |

`COPY`, `ADAPT`, `MERGE_REFERENCE`, and `REWRITE_REFERENCE` are Phase 2 instructions. Their classifications define the permitted materialization scope; they do not authorize publication of artifacts or datasets.

## Counts

| Action | Tracked blobs |
|---|---:|
| `COPY` | 83 |
| `ADAPT` | 14 |
| `MERGE_REFERENCE` | 7 |
| `REWRITE_REFERENCE` | 12 |
| `PENDING_PHASE_3` | 1 |
| `EXCLUDE_DUPLICATE_PUBLIC` | 37 |
| `EXCLUDE_GENERATED_LOCKFILE` | 1 |
| `EXCLUDE_LEGACY_EDITORIAL` | 11 |
| `EXCLUDE_MOCK_PRODUCTION` | 4 |
| `EXCLUDE_OBSOLETE_DOCUMENTATION` | 18 |
| `EXCLUDE_OLD_PACKAGING` | 4 |
| `EXCLUDE_OPERATIONAL` | 10 |
| `EXCLUDE_PERSISTENCE` | 10 |
| `EXCLUDE_REMOTE_ASSET` | 1 |
| `EXCLUDE_UNUSED_UI` | 23 |
| **Total** | **236** |

The manifest also records four non-tree items: three real XGBoost assets as `PENDING_PHASE_3` with `source_blob_sha: null`, and the private scraped Ecuador dataset as `EXCLUDE_PRIVATE_DATASET`.

## Included by subsystem

| Subsystem | Phase 2 boundary |
|---|---|
| Frontend | Public batch/manual input, URL preview, TXT import, session-only results, CSV export, lean UI, and focused tests. The API client becomes HTTP-only. |
| Public API | Health and batch analysis contracts, stateless orchestration, schemas, safe errors, and focused tests. |
| URL extraction | Private extraction schema, URL validation, pinned HTTP fetcher, article extraction, orchestration, synthetic HTML fixtures, and tests. |
| XGBoost runtime | Private preprocessing and `owner_xgboost.py`, adapted to `backend/app/ml/xgboost_inference.py`; no Random Forest or production mock fallback. |
| Configuration | `.gitignore`, settings, router, requirements, pytest, OpenAPI tests, frontend package metadata, and sanitized environment examples are rewritten or merged rather than silently preferred. |

## Explicit exclusions

- Editorial cases, dashboard/queue/model-info flows, persistence, Alembic, repositories, and demo seeding.
- Legacy Fly/Vercel-era operational files, old Dockerfiles, private artifact-bundling recipes, and old materialization manifests.
- Production mocks, unused private UI, remote Google Fonts, missing remote/local asset references, and the old generated `package-lock.json`.
- Superseded legacy documentation, screenshots/archives if encountered later, private scraped data, and any unverified public dataset.
- Random Forest and old packaging are outside the target even though no deployable Random Forest blob is present in the frozen trees.

Public datasets remain excluded until the exact license and provenance are verified. The scraped Ecuador dataset remains private and must never enter Git history.

## Conflicts and rewrites

Eight target paths intentionally have multiple source references; every one uses only `MERGE_REFERENCE` or `REWRITE_REFERENCE`:

- `.gitignore`
- `backend/app/api/v1/router.py`
- `backend/app/core/config.py`
- `backend/app/services/inference_factory.py`
- `backend/pytest.ini`
- `backend/requirements.txt` (three references, including the selective XGBoost requirements)
- `backend/tests/test_openapi_contract.py`
- `frontend/package.json`

The frontend lockfile is regenerated only after the reduced `package.json`. Docker is rewritten later; no old Dockerfile is an operational input.

## Security findings and gates

| Severity | Finding | Required gate |
|---|---|---|
| **HIGH** | `get_url_extraction_service()` creates a new `HttpFetcher` per request, so its semaphore and minimum-interval limiter are instance-local. | Phase 2 must compose one shared process-wide fetcher/rate limiter and test concurrency. |
| **HIGH** | `owner_xgboost.py` calls `joblib.load` before proving artifact digest or lineage. Type/shape checks after deserialization do not establish authenticity. | Phase 3 must verify approved hashes and lineage **before** any deserialization. |
| Pending | DNS pinning, redirect revalidation, proxy disabling, response bounds, and sanitized errors are useful controls, but a controlled real-TLS test is still required. | Run the TLS/SNI test against an approved fixture in Phase 3 or 4. |
| Supply chain | Google Fonts and untracked favicon/OG references are not allowed by default. | Phase 2 adapts `index.html`, Tailwind, and browser tests to local/system assets and zero unexpected remote requests. |

The validator reads GitHub tree metadata only; it does not print blob contents or secret values. A separate candidate-content secret/license scan remains mandatory after Phase 2 materialization.

## Validation

```powershell
./tools/validate_source_allowlist.ps1
```

The validator re-queries both exact commits with `gh api`, verifies commit/tree/blob identities, full coverage, duplicate handling, action/phase rules, summaries, external-asset null SHAs, and target conflicts.

**Gate: PASS.** Phase 2 materialization was subsequently completed from this approved allowlist in the clean workspace; the Phase 1 gate remains a classification-only record.
