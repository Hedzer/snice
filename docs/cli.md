<!-- AI: For the AI-optimized version of this doc, see docs/ai/cli.md -->
# CLI

Snice ships a command line tool for scaffolding projects, diagnosing setup, validating source, and serving documentation to AI agents.

```
npx snice <command>
```

## Commands

| Command | Purpose |
|---|---|
| `create-app <path>` | Create a complete vanilla or React application |
| `init-ai [path]` | Install the version-matched Snice skill and agent pointers |
| `check [path]` | Run all package, configuration, and source checks |
| `doctor [path]` | Diagnose configuration, imports, dependencies, and AI setup |
| `validate [path]` | Run the source analyzer only |
| `generate-component <name>` | Print a current element scaffold |
| `build-component <name>` | Build a CDN bundle from a Snice source checkout |

## Creating a Project

```bash
npx snice create-app my-app
npx snice create-app my-app --template=react
```

The default template is vanilla Snice with routing and a build already configured. `--template=react` scaffolds the React adapter setup described in [React Integration](./react-integration.md).

## Checking a Project

`check` is the broad gate — it runs the package and configuration checks and the source analyzer together.

```bash
npx snice check
npx snice check --json      # machine-readable, for CI
```

Run the halves individually when you want a narrower signal:

```bash
npx snice doctor      # configuration, imports, dependencies, AI setup
npx snice validate    # source analyzer only
```

`doctor` reports on the things that silently break a Snice project: decorator configuration in `tsconfig.json`, a bundler that cannot handle decorators, missing peer dependencies, and whether the Snice skill is installed for your coding agent.

`validate` runs the analyzer over your source. It catches mistakes that compile but never work, including:

- an `@element`-decorated class that does not extend `HTMLElement` (or a Snice element subclass) — Snice registers and renders only element subclasses
- deep imports that were never released package paths, such as `snice/decorators`
- a Router without `target`, `type`, or a project-wide `initialize()` call
- a routed class combining `@page` with redundant `@element`
- a path/query `:param` or named `*splat` whose page has no reachable attribute
  target (`snice/route-param-has-no-binding-target`), including
  `attribute: false` and mismatched explicit aliases

The route-param check follows proven local declarations, direct relative
re-exports, and named or namespace Snice imports, so an inherited bindable
property satisfies it. It deliberately defers a missing-target error for an
unresolved/ambiguous base or dynamic route/attribute contract; locally visible
disabled or mismatched properties are still diagnosed. Native reflected IDL
attributes such as an unmodified `id`, and statically known custom
`observedAttributes` handlers, also satisfy the attribute target.

It also gives non-blocking architecture suggestions: keep `@page`, `@element`,
`@controller`, and `@daemon` classes under `src/pages`, `src/components`,
`src/controllers`, and `src/daemons`; keep visual behavior in elements,
application behavior specific to a set of elements in controllers, and element
orchestration in pages. A host-free reusable function may remain a plain module
wherever the project convention places it.

Both accept `--json` for CI.

### Diagnostic codes and `.sniceignore`

Every error, warning, and suggestion has a stable code in human and JSON
output. When a project intentionally accepts a finding, create `.sniceignore`
in the project root. Prefer the narrowest entry:

```text
# One exact diagnostic
snice/prefer-dispatch-decorator src/components/legacy-filter.ts:42:5

# Every instance in one file
snice/prefer-dispatch-decorator src/components/legacy-filter.ts

# Every instance in the project
snice/prefer-dispatch-decorator
```

`code path:line` is also accepted. Paths are project-relative and entries are
exact rather than glob patterns. Suppressed diagnostics are omitted from both
text and JSON output and do not affect the exit status. The file applies to
`check`, `doctor`, and `validate`, including doctor codes such as
`snice-skill`.

## AI Setup

```bash
npx snice init-ai
npx snice init-ai --force    # overwrite an existing install
```

This installs a skill matched to the Snice version in your project, so an agent reads the documentation for the version you actually have rather than whatever it remembers. See [AI Assistance](#ai-assistance) below.

## AI Assistance

There are two ways to give a coding agent the Snice skill. Both install the same
skill; they differ in what it is scoped to.

### Per project, from npm

Installs into the current project, matched to the Snice version that project has:

```bash
npx snice init-ai
```

This writes `.agents/skills/snice/` plus `AGENTS.md` and `CLAUDE.md` pointing at
it. Use `--force` to overwrite an existing install. Because the skill reads
`node_modules/snice/docs/ai/`, the agent always sees documentation for the
version actually installed — not whatever it remembers.

### Per harness, from the repository

Installs globally for your agent, straight from the repo. Snice ships the plugin
manifests these harnesses expect, so no clone or build step is needed.

**Claude Code**

```bash
/plugin marketplace add https://gitlab.com/Hedzer/snice
/plugin install snice@snice
```

**Antigravity**

```bash
agy plugin install https://gitlab.com/Hedzer/snice
```

**Gemini CLI**

```bash
gemini extensions install https://gitlab.com/Hedzer/snice
gemini extensions update snice     # later
```

**Kimi Code**

```text
/plugins install https://gitlab.com/Hedzer/snice
```

**Factory Droid**

```bash
droid plugin marketplace add https://gitlab.com/Hedzer/snice
droid plugin install snice@snice
```

Prefer `init-ai` when you work on one Snice project and want the skill pinned to
its version. Prefer the repository install when you move between Snice projects
and want the skill always available.

Token-efficient copies of every reference page live in `docs/ai/`, mirroring these documents without the prose. Agents should read those instead of the human pages.

## Generating a Component

Prints a scaffold using the current decorator conventions, so a new element
starts from correct code rather than a half-remembered example:

```bash
npx snice generate-component task-item
npx snice generate-component task-item --props=label:string,done:boolean --events=status-changed
```

| Option | Meaning |
|---|---|
| `--props=name:type,…` | Declared `@property()` fields. Types: `string`, `number`, `boolean`, `array`, `object` (default `string`) |
| `--events=name,…` | A `@dispatch()` method per event |
| `--no-styles` | Omit the `@styles()` block |
| `--out=<path>` | Write to a file instead of stdout. Never overwrites |

Output goes to stdout by default, so you can review or pipe it. `--out` is the
explicit opt-in to writing, and refuses to clobber an existing file.

## Building CDN Bundles

`build-component` is for building CDN bundles from a Snice source checkout; application projects do not need it.

```bash
npx snice build-component button
npx snice build-component table --format=iife,es --with-theme
```

| Option | Default | Meaning |
|---|---|---|
| `--output=<dir>` | `./dist/cdn` | Output directory |
| `--format=iife,es` | `iife` | Output formats (`table` defaults to `iife,es`) |
| `--no-minify` | off | Disable minification |
| `--with-theme` | off | Include `theme.css` |

See [CDN](./cdn.md) for how the resulting bundles are loaded.
