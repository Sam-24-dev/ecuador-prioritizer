# Free deployment

## Current boundary

The confirmed public frontend is the Cloudflare Worker at <https://ecuador-prioritizer.scaizapa.workers.dev/>. The FastAPI backend is an owner-managed Render service publicly reachable by this application; it is not a supported public API or third-party integration. This page records the boundary and planning guardrails; it does not claim the current provider plan, active version, deploy source, quota usage, alert settings, or production readiness.

For current operational procedures and evidence limits, use the [Operations runbook](OPERATIONS_RUNBOOK.md).

## Operating guardrails

- Verify current provider terms, quotas, eligibility, account state, and billing settings before provisioning or changing a service.
- Do not enable paid upgrades, usage-based overages, automatic scaling to paid resources, paid add-ons, or unreviewed marketplace services without an explicit owner decision.
- Keep deployment evidence, credentials, private runtime details, model/data bundles, and logs out of this public repository.
- Treat availability as best effort. These docs claim no continuous monitoring and no SLA; use the runbook's bounded checks and provider-native rollback paths when an owner performs an operational review.
- A provider dashboard, deploy version, plan, quota, or alert configuration must be rechecked at the time of an operational action rather than inferred from historical documentation.

## Historical planning context (superseded)

The original low-cost deployment plan considered the following arrangement:

| Historical option | Historical role | Current status |
|---|---|---|
| Cloudflare Pages | Static frontend hosting | Superseded by the current Cloudflare Worker frontend |
| OCI Always Free compute | FastAPI/scoring API hosting | Superseded by the current owner-managed Render service |
| Cloudflare Worker gateway | Optional gateway or rate-limit layer | The current Worker is the public frontend; do not infer a separate gateway deployment from this page |
| Local/private backup | Recovery for configuration and approved release evidence | Still a general safety practice; keep private material private |

The Pages/OCI plan is retained to explain earlier migration decisions. It is historical context, not an authorization or runbook for provisioning those providers.

Other providers considered during planning (including Vercel, Fly, Supabase, and managed databases) were not selected because they added operational surface without a demonstrated requirement. Reconsidering one requires fresh cost, security, privacy, and operational evidence.

## Constraints and rollback

- Free or low-cost provider terms, quotas, region capacity, and eligibility can change.
- No provider SLA is assumed for this project.
- Keep a private record of the release and deployment evidence needed for rollback; do not publish private identifiers or raw logs.
- Before any provider change, confirm the target boundary and rollback path with current provider evidence.

The [Operations runbook](OPERATIONS_RUNBOOK.md) contains the current low-volume checks, evidence template, and provider-native rollback references. This documentation-only change does not require a frontend deployment.
