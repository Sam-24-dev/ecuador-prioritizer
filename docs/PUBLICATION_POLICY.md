# Publication policy

## Rule

Public release is allowlist-first. `.gitignore` reduces accidents; it does not authorize publication.

The historic model runtime is private and owner-authorized only, with no
retraining in this phase. Public code excludes the private bundle, model
assets, and scraped data. Conditions for use or redistribution remain tied to
the original sources; this policy records evidence boundaries, not legal advice.

## Include/exclude matrix

| Material | Public release | Requirement |
|---|---:|---|
| Approved application source | Include only after approval of Phases 0-1 | Path is allowlisted and reviewed from the clean SHA. |
| Documentation and reproduction scripts | Include only after approval of Phases 0-1 | Scripts must not require or embed private data. |
| Model/artifacts trained with private scraped data | Exclude by default | Publish only after documented rights, privacy, and leakage-risk review, or exclusive reproduction with verified-public-license datasets. |
| Model/artifacts from verified-public inputs | Include only after approval of Phases 0-1 and artifact verification | Record version identifier, hash, provenance, license status, and evaluation note. |
| Dataset with verified MIT license | Include only after approval of Phases 0-1 and verification | Preserve license text, source URL/identity, hash, schema, and provenance record. |
| Scraped Ecuador dataset | Exclude | Keep private and outside Git history; document only provenance, schema, aggregate statistics, hashes, and reproduction method. |
| Credentials, tokens, and `.env*` files | Exclude | Store only in provider-managed secret configuration. Only a sanitized, reviewed `.env.example` may be published; it contains no values. |
| Logs, screenshots, ZIPs, archives, dumps | Exclude by default | Publish only a separately reviewed, intentionally redacted item. |
| Third-party notices | Include when required | Maintain `THIRD_PARTY_NOTICES` before release. |
| Legacy/editorial/persistence code | Exclude unless independently approved | Target product does not need it. |

## Licenses and artifacts

- Every public dependency, dataset, model artifact, and bundled asset needs an identified license before publication.
- “MIT” is not enough unless the actual license and provenance are verified for the exact material being released.
- Do not redistribute scraped article content without a documented right to do so.
- Model artifacts must be traceable to a documented training recipe and approved input classes; private data may be described but not included.
- An artifact trained with the private scraped dataset is not public by default. Its release needs documented review of rights, privacy, and leakage risk, unless it is reproduced exclusively from verified-public-license datasets.

## Pre-publication verification

1. Confirm approval of Phases 0-1 and compare candidate paths to the approved allowlist.
2. For every model artifact, confirm verified-public-only reproduction or the documented rights, privacy, and leakage-risk approval.
3. Scan for credentials, private URLs, local paths, request bodies, personal data, archives, and generated outputs.
4. Verify licenses, copyright notices, provenance, hashes, and reproducibility records.
5. Confirm `THIRD_PARTY_NOTICES` is complete for distributed material.
6. Inspect the release package, not only Git status.
7. Obtain the required human approval before publishing.

## Minimum public provenance record

For every allowed dataset/model release, publish or link to:

- Identifier and intended purpose.
- License and verification date: **[VERIFY AT RELEASE]**.
- Source/provenance summary.
- Schema or feature description.
- Aggregate statistics that do not expose private content.
- Cryptographic hash and reproduction command/script reference.
- Limitations and known exclusions.

Related: [Migration plan](MIGRATION_PLAN.md) and [.gitignore](../.gitignore).
