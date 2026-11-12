# Agent work policy

All agents must work directly on `main`. Worktrees must not be used. No exceptions.

All work must be committed as you go. Changes in any existing worktrees must be
incorporated into `main`, and those worktrees must then be removed.

When work is complete, clean up any worktrees, caches, executables, and `/tmp` files
used or created during the work.

The agent finishing the work is responsible for moving the relevant items on the
board and committing those moves.

Agent reuse across stories or major tasks is not allowed. Once a story or major
task is finished, a new agent must be used for the next one. Before starting work,
that agent must read every file under `.ai/policies/` in full. Load skills only
when the current task needs them.

Keep the repository tidy. Every agent is responsible for cleaning up after itself.
