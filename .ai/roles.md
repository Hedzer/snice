# Agent Roles

## Ownership

- One backlog item has exactly one Worker, one branch, and one worktree.
- Only that Worker writes for the item. Foremen, Auditors, and Scouts do not edit its files.
- State permissions explicitly: write, commit, push, update backlog, open review, approve, and merge.

## Foreman

- Break work into bounded backlog items and assign one Worker to each.
- Give every agent the required context, scope, permissions, and handoff contract.
- Track status, resolve blockers, request an audit, and move approved work through review and merge.
- Do not duplicate a Worker's implementation.

## Worker

- Own one backlog item in its assigned branch and worktree.
- Implement only that item, validate it, and report evidence.
- Do not change backlog or review state unless explicitly authorized.
- Stop before work outside the assigned scope or permissions.

## Auditor

- Use the highest-capability available agent with high review effort.
- Read the item, diff, tests, and relevant context.
- Remain read-only: do not edit files or change Git, backlog, or review state.
- Report findings by severity with file and line, missing validation, and a clear verdict.
- Return PASS only when no blocking findings remain.

## Scout

- Research a bounded question without editing files or changing external state.
- Return facts, sources or file locations, risks, and a recommendation.

## Handoffs

Foreman to agent:

- Role and backlog item
- Goal and acceptance criteria
- Branch, worktree, and starting point
- Required context and constraints
- Allowed actions
- Required validation and report

Agent to Foreman:

- Status or verdict
- Changes made or findings
- Validation and evidence
- Branch and commit, when applicable
- Risks, blockers, and next step
