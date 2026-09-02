# Ecuador Prioritizer Model Card

## Summary

Ecuador Prioritizer is a public-pilot tool that ranks public news items and claims for **human review**. It provides preliminary prioritization signals; it does not fact-check, establish truth or falsity, or make decisions about people. This document describes the software release target v1.0.0 and its current operational boundary. It is not an evaluation report and does not claim that a stable release already exists.

## Intended use

- Help fact-checkers, researchers, newsrooms, and civil-society monitors decide what to inspect first in a small batch.
- Support a reviewer who checks the original source and applies an independent editorial or verification process.
- Evaluate an open prioritization interface without sending private or sensitive material.

The product is anonymous and session-only by default. It is best effort, has no SLA, and keeps a human in the loop.

## Out of scope

The system is not a fact-checker, a truth-verdict service, an editorial approval system, or a people-decision system. Its labels and scores are not evidence of truth, intent, harm, or editorial priority. It does not provide accounts, persistent case history, or a supported third-party API.

## High-level architecture

1. **Text preparation:** bounded plain-text input is cleaned before feature extraction. The public implementation removes URLs and mentions, drops empty or attribution-only lines, and normalizes whitespace and punctuation spacing.
2. **TF-IDF:** the cleaned text is transformed into a sparse term-frequency/inverse-document-frequency representation.
3. **FEDA-style feature layout:** the base representation is arranged with the project's feature-expansion/domain-adaptation layout before inference.
4. **XGBoost:** the private runtime uses an XGBoost classifier to produce probability signals. The model and its supporting assets are not part of this repository.

The architecture is intentionally described at a level that explains the flow without publishing private model bytes, artifacts, training text, or integrity identifiers.

## Inputs and outputs

The public batch contract accepts 1-10 items. Each item contains:

| Field | Contract |
|---|---|
| `text` | Required plain text, 15-2,000 characters after input validation. |
| `source` | Optional source label or URL, up to 200 characters. |
| `client_id` | Optional session-local identifier, up to 100 characters. |

A response returns the item identifier, source, a bounded text snippet, a preliminary class (`Falso` or `Verdadero`), `p_true`, and `score_false`. The names are inherited from the application contract and must not be read as factual verdicts. Results are ordered with the lower preliminary class first, then by descending `score_false`, while preserving input order for ties.

## Scoring and threshold behavior

The runtime obtains a `p_true` probability signal from XGBoost and exposes `score_false = 1 - p_true`. A configured threshold maps that signal to the preliminary class shown in the response. This threshold is a decision-support control, not an accuracy, calibration, or truth claim. No performance metrics are published here because no public, source-verified evaluation record is part of this release scope.

## Data provenance and publication boundary

The historic pipeline uses private training material associated with the Ecuador-focused use case, including a private scraped dataset. The public repository documents the provenance boundary and schema-level behavior only; it does not publish article text, source inventories, samples, the dataset, the model bundle, derived artifacts, hashes, or private operational details. Authorization for the owner-managed pilot runtime does not authorize redistribution of those materials. See [Publication policy](PUBLICATION_POLICY.md) and the [Phase 3 asset gate](PHASE_3_ASSET_GATE.md).

## Limitations and risks

- **Domain shift:** language, topics, publishers, and formats can differ from historic training material.
- **Text dependence:** missing, short, noisy, or poorly extracted text can produce weak or unavailable signals.
- **Preprocessing loss:** URL and mention removal, normalization, and extraction choices can remove context that matters to a reviewer.
- **Model and data errors:** the system can rank an item incorrectly or surface a misleading signal; human review remains required.
- **No public metrics:** behavior of the live pilot depends on the private runtime bundle and cannot be reproduced from this public repository alone.

Do not submit personal information, credentials, sensitive content, or material that you are not authorized to process.

## Deployment and reproducibility

The public flow is:

`Anonymous browser -> Cloudflare Worker frontend -> owner-managed Render FastAPI service -> private scoring runtime -> ranked response held in the browser session`

The frontend is public and the backend is reachable by that application, but the backend is not offered as a supported public API. Public backend tests can run against the repository's code and fixtures without the private bundle; live ML inference is not reproducible without the private bundle and training data.

## Asset boundary

The public repository contains approved application code and documentation intended for this release target. The private model bundle, model artifacts, vectorizer, scraped dataset, raw source content, credentials, logs, and other non-public operational material remain outside the public repository. No artifact-release approval is implied by the current pilot runtime.
