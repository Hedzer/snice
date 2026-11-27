# OpenCode dispatch

Use this only when the invoking harness is OpenCode, with the selected model profile.
Start each story in a new terminal with a fresh
OpenCode process/session, without resuming or forking another story or loading its
automatic task memory. Keep the coordinator as that story terminal's primary agent;
give each specialist `mode: subagent` and its selected `provider/model`
identifier. Invoke specialists through the Task tool or the installed equivalent.
Built-in general agents inherit the parent model unless overridden; naming a selected
model in prose does not configure it.

Pass `--auto` on every factory OpenCode CLI launch: `opencode run --auto` for
non-interactive runs, or `opencode --auto` for the terminal UI. Include it for fresh
stories, resumes from disk, maintenance, and separately launched specialist CLIs.
The installed flag auto-approves permission requests that are not explicitly denied;
do not describe it as removing explicit deny rules. Pass the selected model/variant
and existing launch arguments as usual; apply the mode per process.

Discover provider IDs and model support from the actual installation. A vendor model
name alone is not a complete OpenCode identifier. Use project-local role definitions
in `.opencode/agents/` if needed; preserve existing persistent configuration and apply
the requested unattended mode through the CLI flag.
For installations using this Markdown format, a bounded worker definition is:

```markdown
---
description: Implement one bounded local factory item.
mode: subagent
model: <configured-provider>/<selected-worker-model>
---
Read the supplied dispatch. Edit only its permitted files. Return evidence and scope requests.
```

The model field is a template: replace both parts with an available identifier before
use. Create separate reviewer roles with the selected role model and separate advisory
results. Scope writes to their advice; workers own source edits. Reviewers may need test
execution rights, so do not apply a read-only profile that prevents required verification.

Use the installed OpenCode version's supported schema for permissions and reasoning;
do not copy incompatible configuration between versions. Confirm that the coordinator
can invoke the roles and that each role can read input paths and write its own output.
Collect independent role outputs through shared artifacts, not assumed nested callbacks.
If a role/model cannot be selected, report the gap before substituting. Serialize
reviewers if the provider or harness has insufficient parallel capacity.

Dispatch mechanism checked 2026-10-16:
[OpenCode agents](https://opencode.ai/docs/agents/).

Launch flag verified in installed `opencode --help` and `opencode run --help`.
