# Snice Project Agent Guide

Load `.agents/skills/snice/SKILL.md` before implementing, debugging, or
reviewing Snice code. It routes you to the version-matched references under
`node_modules/snice/docs/ai/` and includes an optional, complete core example.

Do not infer Snice behavior from Lit or generic web-component conventions. Read
only the topical reference and component documents needed for the task.

Visual behavior belongs in elements. Application behavior specific to a set of
elements belongs in a controller. Element orchestration belongs in pages. Keep
those ownership rules separate from the attachment mechanism: do not attach a
controller to a page host. A host-free reusable function may stay a plain module
wherever the project convention puts it; state plus lifecycle belongs in a daemon.

Useful diagnostics:

```bash
npx snice check
```

Use `doctor` or `validate` only to isolate the configuration or source half of
a failed check.
