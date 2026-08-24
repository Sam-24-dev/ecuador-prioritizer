# Phase 0 source evidence

## Result: PASS

Phase 0 passes with an **approved immutable source set**, not a single source SHA:

```text
{
  public: 145e8b3adc98bb450289aee8ab058ac265e15372,
  private: 9e5d118edee03b9174a598f469a8e2b5c132df76
}
```

This identifies reviewed inputs for Phase 1. It does **not** authorize a full copy of either repository. Phase 1 must classify every path and exclude legacy, private, scraped, generated, and unknown content.

## Source set

| Role | Repository | Visibility | Branch | Immutable SHA | Confirmed role |
|---|---|---|---|---|---|
| Public product source | [Sam-24-dev/ecuador-prioritizer](https://github.com/Sam-24-dev/ecuador-prioritizer) | Public | `main` | `145e8b3adc98bb450289aee8ab058ac265e15372` | Frontend batch/session-only and URL-import flow; reduced public backend; no XGBoost. |
| Private capability source | `Sam-24-dev/ecuador-prioritizer-owner-private` | Private | `main` | `9e5d118edee03b9174a598f469a8e2b5c132df76` | Backend/XGBoost/extractor and legacy editorial material. |

## Evidence considered

- The public repository is public at its recorded `main` SHA and has a successful Vercel Production deployment.
- The private repository is private at its recorded `main` SHA and contains the model/extractor capability absent from the public source.
- There is no single clean SHA containing the intended future product.
- The local dirty checkout is not a source of record and was not used for this gate.
- Any Fly-to-private-SHA association is historical/operational evidence only; it is **not** a cryptographic attestation.

## Risks and controls

| Risk | Control |
|---|---|
| Copying private, scraped, legacy, or generated material | Phase 1 path-by-path allowlist; exclude unknown paths. |
| Treating the pair as permission to publish all contents | Keep roles separate; allowlist and publication policy remain mandatory. |
| Releasing a model trained with private scraped data | Keep it private unless reproduced from verified-public datasets or cleared by documented rights, privacy, and leakage-risk review. |
| Assuming deployment evidence proves source identity | Record it as operational context only; use the stated immutable SHAs for source identity. |

## Explicitly not done at the Phase 0 gate

These statements describe the Phase 0 evidence boundary; later phases were evaluated separately.

- No source, data, artifact, archive, secret, screenshot, or operational file had been copied at the Phase 0 gate.
- No Git repository had been initialized at the Phase 0 gate.
- No repositories, deployments, hosting, or GitHub settings had been changed at the Phase 0 gate.
- No hosting decision had been made between the current Cloudflare target and the more recent Vercel mention at the Phase 0 gate.
- No Phase 1 allowlist had been created at the Phase 0 gate.

Phase 2 was subsequently materialized in the clean workspace from the approved allowlist; that later work does not change the Phase 0 source-evidence scope above.

Next: [Migration plan](MIGRATION_PLAN.md) Phase 1 and [Publication policy](PUBLICATION_POLICY.md).
