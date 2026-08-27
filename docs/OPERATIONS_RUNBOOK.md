# P7E operations runbook

This runbook covers the existing public edge and API only. It is an operational reference, not a production-SLA claim. Keep checks low-volume and never place request content, credentials, model data, or environment values in tickets or logs.

## Current verified baseline

| Component | Verified value | Evidence boundary |
| --- | --- | --- |
| Public Worker | `ecuador-prioritizer` — <https://ecuador-prioritizer.scaizapa.workers.dev> | Cloudflare deployment/version evidence from the P7D release |
| Public source merge | `f96e6db31e1437c9884846f232cdd6521657eb97` | GitHub merge commit for the P7D frontend support-reference slice |
| Worker version | `6739513b-58ad-481d-8059-d562b64c3043` | Wrangler deployment record; verify again before an incident action |
| Render API | <https://ecuador-prioritizer-api.onrender.com> | Existing private runtime service; do not infer configuration from this public repository |
| Render health check | `/api/v1/health` | Render service setting recorded during P7B |
| Render deploy | `dep-da7pdjugekts738nkef0` | Successful P7B deploy; runtime commit `13c5c53` in the private runtime repository |

The baseline is historical evidence, not a claim that the dashboard is currently open or unchanged. Before acting, re-read the provider's current deployment record.

## Quick path: low-volume health check

Run one check at a time, from a trusted shell. Do not submit an analysis payload as a health check.

```powershell
curl.exe -fsS -D - -o NUL --max-time 30 https://ecuador-prioritizer.scaizapa.workers.dev/
curl.exe -fsS -D - -o NUL --max-time 60 https://ecuador-prioritizer-api.onrender.com/api/v1/health
```

Record only:

- UTC timestamp and endpoint path (not query strings or bodies).
- HTTP status, elapsed time, and whether the response was received.
- `X-Request-ID` only as an opaque reference when present; do not record response content.
- The exact source merge SHA, Worker version, and Render deploy/commit checked.

A Render Free service may be asleep. The first request after at least 15 minutes without inbound traffic can take about one minute while the instance starts; do not classify that delay as an outage without a second bounded check. Render says Free services are for testing/hobby use and have no production SLA. See [Render Free](https://render.com/docs/free) and [Render health checks](https://render.com/docs/health-checks).

## Inspect the existing deployments

### Cloudflare Worker

Use the repository's `wrangler.toml` and an authenticated Wrangler session. Do not copy tokens into commands, files, or tickets.

```powershell
npx wrangler deployments status --name ecuador-prioritizer --json
npx wrangler deployments list --name ecuador-prioritizer --json
npx wrangler versions list --name ecuador-prioritizer --json
```

A deployment selects the Worker version serving traffic; a version captures the Worker code, assets, bindings, and compatibility settings. Workers documentation describes both concepts and the Wrangler commands in [Versions & deployments](https://developers.cloudflare.com/workers/versions-and-deployments/) and [Workers commands](https://developers.cloudflare.com/workers/wrangler/commands/workers/). The Worker has Workers Logs enabled in source configuration. Use the Cloudflare dashboard's **Workers & Pages → Worker → Observability** or Wrangler real-time logs only for the minimum evidence needed; never log request bodies or secrets. Workers Logs configuration and access are documented in [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/).

### Render API

Use the Render Dashboard for the service's **Events** page and **Health** settings. Confirm the current deploy status, deployed commit, health path, and failure notifications before changing anything. The service's public health endpoint is:

```text
https://ecuador-prioritizer-api.onrender.com/api/v1/health
```

Do not assume a deploy or commit from GitHub's public repository: the API is built from the private runtime repository. Render's deployment lifecycle and specific-commit behavior are documented in [Deploying on Render](https://render.com/docs/deploys).

## P7D opaque request reference

The API may return `X-Request-ID`. Treat its value as an opaque support correlation reference:

1. Copy the value exactly into the private support ticket, if needed.
2. Record the endpoint path, UTC time, status, and safe symptom only.
3. Do **not** record the request body, article text, response body, authorization headers, cookies, tokens, model output, or full URL with query parameters.
4. Do not use the reference as authentication or expose it in a public issue.

A reference ID proves correlation only; it is not proof of cause, persistence, or user identity.

## Rollback

Rollback is an incident action. Capture the current deployment evidence first, then use the provider-native path and run the low-volume health check again.

### Cloudflare

1. Identify the last known-good version ID from `wrangler versions list` or **Workers & Pages → Worker → Deployments**.
2. Confirm it is within the available version history and that required bindings still exist.
3. Run the authenticated Wrangler command:

```powershell
npx wrangler rollback --name ecuador-prioritizer --version-id <LAST_KNOWN_GOOD_VERSION_ID>
```

4. Re-check deployment status, then perform one Worker and one API health check.

Cloudflare says a rollback immediately creates a new deployment at 100% traffic and supports the 100 most recently published versions. It does not roll back associated storage state, and binding/resource changes can make a previous version ineligible. See [Cloudflare rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

### Render

1. In the service's **Events** page, select the last known-good successful deploy and choose **Rollback**; confirm the target deploy.
2. Wait for the new deploy to become live, then check `/api/v1/health` once.
3. If using the Render API instead, call the documented **Roll back deploy** endpoint with a secret held by the provider/secret manager; never paste the token into a ticket or shell history.
4. API-triggered rollback does **not** disable automatic deploys. Disable auto-deploys before incident remediation if a new push could immediately reintroduce the faulty commit; Dashboard rollback disables auto-deploys automatically.

Render rollbacks require the target build artifact to still be retained. They reuse the target deploy's build artifact and selected service settings, but do not revert every current setting (for example custom domains, static headers, disks, or platform-level runtime changes). See [Render rollbacks](https://render.com/docs/rollbacks).

## Evidence record

Use this small record for each release or incident:

```text
UTC time:
GitHub merge SHA:
Cloudflare Worker version ID:
Render deploy ID:
Render runtime commit:
Checks: Worker / ; API /api/v1/health ; status/latency:
Opaque X-Request-ID (private ticket only, if needed):
Action and outcome:
```

Never attach raw logs, request/response bodies, screenshots containing secrets, or private model/data paths. This repository's Cloudflare static build publishes frontend assets only; this documentation change does not require a Worker deployment.
