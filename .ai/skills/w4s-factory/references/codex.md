# Codex profile

Use the latest available model in each family. Default to `--rigor 1`; only the
user selects another level.

| Rigor | Roles | Model | Reasoning effort |
|---|---|---|---|
| 1 | Foreman/coordinator and planner | Sol latest | high |
| 1 | Every other role | Luna latest | high |
| 2 | Foreman/coordinator and planner | Sol latest | xhigh |
| 2 | Every other role | Luna latest | xhigh |
| 3 | Foreman/coordinator | Sol latest | high |
| 3 | Worker and verifier | Luna latest | xhigh |
| 3 | Every other role, including planner and critics | Astra latest | high |

Launch the story CLI with Foreman/coordinator on Sol latest at every rigor level,
using the effort above; apply the
selected level to every specialist dispatch. All levels use the same delivery
workflow and advisory critics.

Launch every factory Codex CLI with `--yolo`, including `codex exec --yolo` for
non-interactive runs. This is the alias for `--dangerously-bypass-approvals-and-sandbox`;
it disables approval prompts and command sandboxing for that run. Include it on fresh,
resumed-from-disk, maintenance, and separately launched specialist processes.
Pass the selected model and effort as usual. Do not combine it with `--approve-for-me`.

Dispatch with native subagent tools and explicit model/effort when supported. Use a
fresh, narrow context containing the dispatch contract. If the runtime requires a fresh
context for model overrides, do not combine overrides with inherited conversation history.
Run each story in a new terminal with a fresh `codex exec` conversation; never use
`resume` for another story. The coordinator is that terminal's primary agent, not a
native subagent. Apply the shared memory-isolation rules. Critics provide serious
advice only; they do not approve advancement or delivery.

Custom agent files can select resolved role models in `.codex/agents/<role>.toml`;
resolve the latest Luna identifier and set effort from the selected rigor before use:

```toml
name = "factory_worker"
description = "Implement one bounded local factory item."
model = "<resolved-latest-luna-id>"
model_reasoning_effort = "high"
developer_instructions = "Read the supplied dispatch. Edit only its permitted files. Return evidence and scope requests."
```

Create role configuration only when needed and authorized; merge with existing settings.
The role file does not replace the task-specific dispatch. If model selection is fixed
by the host, record the actual model and obtain an explicit substitution when needed;
never report a requested model as the one used without evidence.

Model discovery and agent configuration:
[models](https://developers.openai.com/api/docs/models),
[subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents).

Launch flags verified with installed `codex exec --yolo --help` and
[official OpenAI CLI documentation](https://learn.chatgpt.com/docs/developer-commands?surface=cli).
