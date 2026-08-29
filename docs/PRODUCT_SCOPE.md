# Product scope

## Product outcome

Ecuador Prioritizer helps fact-checkers notice which public news items or claims may deserve attention first. It provides ranked signals, not editorial decisions.

The current release is a best-effort public pilot. It supports human review; it
does not fact-check, decide about people, or promise an SLA.

## Users and jobs-to-be-done

| User | Job |
|---|---|
| Fact-checker or research team member | Quickly triage a batch of items before using their own verification process. |
| Newsroom or civil-society monitor | Spot potentially relevant claims without creating a new case-management system. |
| Public evaluator or contributor | Understand how to run and assess an open prioritization tool. |

## Capabilities

- Accept an item or batch through the public interface/API contract to be defined during implementation.
- Produce a prioritized score and concise, non-definitive explanation of input signals.
- Keep use anonymous and session-only by default.
- Export results locally when the future UI supports it.
- Publish reproducible documentation, releases, and model/data provenance.

## Explicit non-goals

- Editorial intake, investigation workflow, case assignment, or publication approval.
- Accounts, roles, comments, notifications, or collaboration features.
- Definitive truth labels, verdicts, or automated fact-checking claims.
- Persistent user data, database-backed history, queues, or Kubernetes.
- A promise to replace professional verification judgment.

## Success metrics

Metrics must be defined and measured only after the public implementation exists:

- Human evaluators can complete a batch triage faster than their documented baseline.
- Evaluators judge high-ranked items useful often enough to continue using the tool.
- Public releases can be reproduced from documented inputs and checks.
- Adoption is evidenced by documentation use, a runnable demo, API use where offered, releases, and community feedback—not by a vague claim of being well known.

## Ethical limits

- Scores are decision support, never evidence of truth, intent, harm, or editorial priority.
- The UI and API must state uncertainty and invite human review.
- Do not retain submitted content, identifiers, or usage histories by default.
- Do not expose the private scraped Ecuador dataset or reproduce protected article text.
- Report model limitations, provenance, and known blind spots with each public release.

Next: [Architecture](ARCHITECTURE.md) and [Publication policy](PUBLICATION_POLICY.md).
