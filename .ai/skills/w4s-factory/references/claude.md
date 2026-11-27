# Claude Code profile

Use the latest available release through native aliases or resolved current IDs.
Default to `--rigor 1`; only the user selects another level.

| Rigor | Roles | Model | Requested reasoning effort |
|---|---|---|---|
| 1 | Foreman/coordinator and planner | Opus latest | high |
| 1 | Every other role | Haiku latest | high |
| 2 | Foreman/coordinator and planner | Opus latest | xhigh |
| 2 | Every other role | Haiku latest | xhigh |
| 3 | Worker and verifier | Haiku latest | xhigh |
| 3 | Every other role, including Foreman/coordinator, planner, and critics | Opus latest | high |

Set the harness's supported reasoning/effort control explicitly. If a requested
setting is unavailable, report the actual supported setting rather than claiming it
was applied. All levels use the same delivery workflow and advisory critics.

Pass `--dangerously-skip-permissions --chrome` on every factory Claude CLI launch,
including fresh stories, resumes from disk, maintenance, and separate specialist CLIs.
The first flag enables permission bypass; the second enables Chrome integration.
`--allow-dangerously-skip-permissions` alone does not activate bypass. Use these flags
alongside the selected model/effort and existing launch arguments.

Launch a new terminal and fresh `claude` CLI conversation for each story, with the
Foreman/coordinator on Opus latest at every rigor level, using the effort above. Never pass
`--continue`, `--resume`, or a history fork across stories. For
installed versions supporting it, set `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` only for the
launched process; otherwise use a verified per-run equivalent or stop. Record the fresh
terminal/process and session IDs. The coordinator is the primary agent of this story
terminal; it is not an Agent-tool subagent. If the session model
differs, report it and continue only with that disclosed substitution. Dispatch each
role through the Agent tool, selecting its model explicitly. Use `general-purpose`
when the role must write an artifact; read-only exploration agents cannot write reports.
Keep all role dispatch in the coordinator instead of relying on nested agent dispatch.

Optional persistent role files belong in `.claude/agents/<role>.md`. For example:

```markdown
---
name: factory-worker
description: Implement one bounded local factory item.
model: haiku
---
Read the supplied dispatch. Edit only its permitted files. Return evidence and scope requests.
```

Pass the full local dispatch to each role; no source-specific prompt script is needed.
Do not replace installed agents or persistently change permission configuration;
apply the requested permission flags to the launched process.
Check alias availability and record its resolved model when exposed by the harness.

Agent mechanism and aliases checked 2026-10-16:
[Claude Code subagents](https://code.claude.com/docs/en/sub-agents),
[CLI sessions](https://code.claude.com/docs/en/cli-reference),
[memory controls](https://code.claude.com/docs/en/memory).

Launch flags verified with installed `claude --dangerously-skip-permissions --chrome --help`.
