# DeepSeek model profile

Use DeepSeek Flash latest for every role, including Foreman/coordinator and all
specialists. No Pro upgrade or other model family. Resolve the latest available Flash
identifier from the current harness/provider; do not pin model versions.

Keep the invoking harness. Read [OpenCode dispatch](opencode.md) only when using
OpenCode. In Pi or another harness, use that harness's native launch and dispatch
controls with this profile's model/effort assignments; do not switch to OpenCode.

Default to `--rigor 1`; only the user selects another level.

| Rigor | Roles | Model | Native reasoning effort |
|---|---|---|---|
| 1 | Planner | DeepSeek Flash latest | max |
| 1 | Every other role | DeepSeek Flash latest | high |
| 2 | Every role | DeepSeek Flash latest | max |
| 3 | Every role | DeepSeek Flash latest | max |

Levels 2 and 3 deliberately use the same assignments; no Pro upgrade is selected.
Use native `max` for this profile's extra-high effort. Apply the selected level to
the coordinator CLI and every specialist dispatch. If an effort setting is unavailable,
report the actual supported setting rather than inventing a parameter. Rigor does not
change the delivery workflow or the critics' advisory authority.

Check the selected Flash model's modality support in the current harness. A text-only
model cannot review screenshots by receiving their paths. If required visual proof is
unavailable, report that limitation without silently switching model families or claiming
the proof exists; a critic cannot create a gate.

Model discovery:
[DeepSeek model discovery](https://api-docs.deepseek.com/api/list-models/).
