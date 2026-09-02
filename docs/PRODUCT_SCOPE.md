# Product scope

## Product outcome

Ecuador Prioritizer helps fact-checkers notice which public news items or claims may deserve attention first. It provides ranked signals, not editorial decisions.

The current release identity is **Public Pilot v1.0**. It is a best-effort public pilot that supports human review; it does not fact-check, decide about people, or promise an SLA.

## Users and jobs-to-be-done

| User | Job |
|---|---|
| Fact-checker or research team member | Quickly triage a batch of items before using their own verification process. |
| Newsroom or civil-society monitor | Spot potentially relevant claims without creating a new case-management system. |
| Public evaluator or contributor | Understand how to run and assess an open prioritization tool. |

## Capabilities

- Accept a public URL or a batch of up to 10 text items through the public web interface; the owner-managed service is not a supported third-party API.
- Produce a prioritized score and concise, non-definitive explanation of input signals.
- Keep use anonymous and session-only by default.
- Export current-session results locally as CSV.
- Publish documentation that states the pilot scope, limitations, and model/data provenance boundaries.

## Explicit non-goals

- Editorial intake, investigation workflow, case assignment, or publication approval.
- Accounts, roles, comments, notifications, or collaboration features.
- Definitive truth labels, verdicts, or automated fact-checking claims.
- Persistent user data, database-backed history, queues, or Kubernetes.
- A promise to replace professional verification judgment.

## Post-pilot success measures

The current pilot does not claim measured product outcomes. If it is evaluated after pilot use, measure:

- Human evaluators can complete a batch triage faster than their documented baseline.
- Evaluators judge high-ranked items useful often enough to continue using the tool.
- Any future public release can be reproduced from documented inputs and checks.
- Adoption is evidenced by documentation use, a runnable demo, and community feedback—not by a vague claim of being well known.

## Ethical limits

- Scores are decision support, never evidence of truth, intent, harm, or editorial priority.
- The UI and API must state uncertainty and invite human review.
- Do not retain submitted content, identifiers, or usage histories by default.
- Do not expose the private scraped Ecuador dataset or reproduce protected article text.
- Report model limitations, provenance, and known blind spots with each public release.

Next: [Architecture](ARCHITECTURE.md) and [Publication policy](PUBLICATION_POLICY.md).
