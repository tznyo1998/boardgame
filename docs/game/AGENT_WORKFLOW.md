# Agent Workflow

## Source-of-truth order

When project files conflict, use this order and report the conflict:

1. Approved entries in `DECISION_LOG.md`
2. Explicit current user instructions
3. `PROJECT_BRIEF.md` and `DESIGN_PILLARS.md`
4. `GAME_DESIGN.md`
5. `RULES_REFERENCE.md`
6. `RULEBOOK.md`
7. Proposal files

The order does not permit silent contradiction. Conflicts must be surfaced.

## Status meanings

- Draft: Incomplete and not fully approved.
- Proposed: Ready for review but not canon.
- Approved: Accepted as project truth.
- Implemented: Present in the build.
- Tested: Verified against acceptance criteria.
- Superseded: Replaced by a newer decision.
- Deprecated: Retained for history but no longer valid.

## Standard feature pipeline

1. Orchestrator interprets and scopes the request.
2. Game designer defines the intended experience and mechanic.
3. Project owner or orchestrator confirms the proposal is acceptable.
4. Rules designer formalizes deterministic behavior.
5. Orchestrator reconciles conflicts and records adopted decisions.
6. Repository manager creates a reviewed local checkpoint when requested.
7. Repository manager pushes only when the user explicitly authorizes a push.
8. Later agents implement, test, balance, and produce assets.

## Proposal naming

Use:

`docs/game/proposals/YYYY-MM-DD-short-topic.md`

Every proposal should state:
- Problem
- Proposed solution
- Assumptions
- Alternatives
- Risks
- Open decisions
- Recommended next step

## Git checkpoint workflow

1. Specialists complete their assigned work.
2. Orchestrator reviews and reconciles the output.
3. User or orchestrator identifies the exact approved change set.
4. Repository manager inspects `git status` and all relevant diffs.
5. Repository manager stages only the related files.
6. Repository manager creates a local commit when requested.
7. Repository manager pushes only after explicit user authorization.

A request to commit is not permission to push. Force-pushes, destructive resets, branch deletion, and committing secrets are prohibited.
