# Decision log

| ID | Decision | Why | Tradeoff / revisit trigger |
|---|---|---|---|
| D-001 | Public, anonymous prioritization product | Helps fact-checkers triage without taking over editorial work. | Revisit only if a separately approved product need requires accounts or collaboration. |
| D-002 | No editorial workflow or definitive verdicts | Human verification remains the authority. | Better explanation UX may be added without changing this boundary. |
| D-003 | React/Vite + FastAPI/Python | Matches the confirmed implementation direction. | Revisit only with evidence that the stack blocks the product. |
| D-004 | TF-IDF + FEDA + XGBoost | Keeps the confirmed model pipeline and supports reproducible scoring. | Re-evaluate with documented model evidence, not novelty. |
| D-005 | Stateless/session-only; no database by default | Minimizes privacy and operations without a persistence requirement. | Add storage only after a documented user need and privacy review. |
| D-006 | Cloudflare Pages + OCI Always Free is the documented target, not a final hosting choice | It is the current minimal design. | Phase 5 must reconcile it with the later Vercel mention before deployment. |
| D-007 | Worker is optional and narrow | A gateway/rate limit may help, but is not core product logic. | Add after measured abuse or boundary need. |
| D-008 | Public artifacts require provenance and verified MIT licensing | Public reproducibility must not redistribute private or unlicensed material. | Revisit each artifact at release time. |
| D-009 | Scraped Ecuador data remains private | Avoids publishing raw scraped content or embedding it in Git history. | Share only aggregate, rights-cleared documentation. |
| D-010 | Migrate from an approved immutable source set using an allowlist | No single clean SHA contains the intended product; the dirty checkout is non-canonical. | Each included path must remain assigned to its source SHA; never use a recursive worktree copy. |
| D-011 | Model artifacts trained with private scraped data remain private by default | Prevent rights, privacy, and leakage risk from being assumed away. | Publish only after verified-public-only reproduction or documented review. |
| D-012 | Discoverability is earned through usable public artifacts | Adoption should be evidenced by docs, demo, API, releases, and community. | Define concrete measurements after implementation. |
| D-013 | Retire repositories in phases | Preserves rollback while making the new public project the definitive repository. | Reusing the name invalidates GitHub redirects to the legacy repository. |
| D-014 | Phase 1 uses an exhaustive two-tree allowlist with explicit merge/rewrites | Prevents silent source preference, duplicate private copies, mock/legacy materialization, and invented artifact hashes. | Phase 2 may begin only after validator PASS and explicit approval; Phase 3 must verify artifact lineage/hashes before deserialization. |
| D-015 | Historic XGBoost assets run only from an external private, owner-authorized bundle; no retraining | Preserves the approved historic pipeline without adding model/data bytes to public code. | Scraped Ecuador data and bundle remain private; use or redistribution conditions stay tied to original sources and require later evidence review. |

Related: [Product scope](PRODUCT_SCOPE.md), [Architecture](ARCHITECTURE.md), [Migration plan](MIGRATION_PLAN.md), [Phase 0 source evidence](PHASE_0_SOURCE_EVIDENCE.md), and [Phase 1 source allowlist](PHASE_1_ALLOWLIST.md).
