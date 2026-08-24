# Free deployment

## Target

Use Cloudflare Pages for the React/Vite frontend and an OCI Always Free compute instance for the FastAPI/XGBoost API. A Cloudflare Worker is optional and must remain limited to gateway/rate-limit duties.

## Zero-surprise operating rule

Use only free-tier resources. Do not enable paid upgrades, usage-based overages, automatic scaling to paid resources, paid add-ons, or unreviewed marketplace services. Free tiers have limits and no SLA; verify current terms, quotas, regions, eligibility, and account settings before provisioning.

## Components

| Component | Target role | Guardrail |
|---|---|---|
| Cloudflare Pages | Static frontend deployment | Confirm project settings and build output before publishing. |
| Optional Cloudflare Worker | Gateway/rate-limit layer only | Add only when traffic/abuse evidence requires it; keep usage inside verified free allowance. |
| OCI Always Free compute | FastAPI/XGBoost API | Confirm eligible shape, region capacity, network rules, and account billing state before provisioning. |
| Local/private backup | Recovery for deployment configuration and public release manifests | Keep private data and secrets out of backups intended for public sharing. |

## Known constraints

- Provider terms, quotas, region capacity, and free eligibility can change. Record verification evidence at provisioning time: **[VERIFY BEFORE DEPLOYMENT]**.
- No free provider SLA is assumed. Plan a clear degraded/unavailable response.
- OCI capacity may not be immediately available in a chosen region.
- Free infrastructure still needs monitoring of account notices, quotas, health, and resource state.

## Deliberately discarded for the target design

| Option | Why not target |
|---|---|
| Vercel | Existing/migration context only; not the selected frontend target. |
| Fly | Existing/migration context only; not the selected API target. |
| Supabase | No persistence requirement; adds an unnecessary database/service. |
| Managed database | Stateless, session-only product does not need one. |

## Operations and backup

- Keep infrastructure configuration minimal and documented.
- Record the deployed frontend/API revision and public model-artifact identity for each release.
- Back up release manifests, deployment configuration, and approved artifact hashes privately.
- Test a rollback to a last known-good release before relying on it.
- Review provider dashboards and notices on a documented cadence: **[DEFINE BEFORE CUTOVER]**.

## Provisioning gate

Do not deploy until [Migration plan](MIGRATION_PLAN.md) Phase 5 gates, [Publication policy](PUBLICATION_POLICY.md) checks, and provider free-tier verification are complete.
