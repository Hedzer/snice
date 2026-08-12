# CLI

Public human reference: `docs/cli.md`.

```
npx snice <command>
```

## Commands

| Command | Purpose |
|---|---|
| `create-app <path> [--template=default\|react]` | Create a vanilla or React app |
| `init-ai [path] [--force]` | Install version-matched Snice skill + agent pointers |
| `check [path] [--json]` | Run all package/config/source checks (broad gate) |
| `doctor [path] [--json]` | Diagnose config, imports, dependencies, AI setup |
| `validate [path] [--json]` | Run the source analyzer only |
| `build-component <name> [options]` | Build a CDN bundle from a Snice source checkout |

## create-app

```bash
npx snice create-app my-app                    # vanilla, default template
npx snice create-app my-app --template=react   # React adapter setup
```

- Default template: vanilla Snice, routing + build already configured
- `--template=react`: React adapter setup, see react-integration.md

## check / doctor / validate

```bash
npx snice check              # doctor + validate together — the broad gate
npx snice check --json       # machine-readable, for CI

npx snice doctor             # configuration, imports, dependencies, AI setup
npx snice validate           # source analyzer only
```

`check` runs `doctor` + `validate` together; run them individually for a narrower signal.

`doctor` reports on things that silently break a project: decorator configuration in `tsconfig.json`, a bundler that cannot handle decorators, missing peer dependencies, whether the Snice skill is installed for your coding agent.

`validate` runs the analyzer over source. Catches mistakes that compile but never work:
- an `@element`-decorated class that does not extend `HTMLElement` (or a Snice element subclass) — Snice registers/renders only element subclasses
- deep imports that were never released package paths, e.g. `snice/decorators`
- Router missing `target`, `type`, or a project-wide `initialize()` call
- a routed class combining `@page` with redundant `@element`
- route path/query `:param` or named `*splat` without a reachable attribute target,
  including `attribute: false` and mismatched aliases
  (`snice/route-param-has-no-binding-target`)

Route-param inheritance follows proven local declarations, direct relative
re-exports, and named or namespace Snice imports. Missing-target findings are
deferred for unresolved/ambiguous bases or dynamic route/attribute contracts;
locally visible disabled or mismatched properties are still reported.

Non-blocking architecture suggestions:
- `@page` -> `src/pages/`
- `@element` -> `src/components/`
- `@controller` -> `src/controllers/`
- `@daemon` -> `src/daemons/`
- visual behavior -> element
- application behavior specific to a set of elements -> controller
- element orchestration -> page; do not attach a controller to the page host
- host-free reusable function -> plain module in the project's chosen location

Both `doctor` and `validate` accept `--json`.

## Diagnostic codes and `.sniceignore`

Every error, warning, and suggestion has a stable `code` in JSON and text
output. Create `.sniceignore` at the project root to suppress an accepted
diagnostic. Entries are exact; glob patterns are not used.

```text
# One exact diagnostic (preferred)
snice/prefer-dispatch-decorator src/components/legacy-filter.ts:42:5

# Every instance in one file
snice/prefer-dispatch-decorator src/components/legacy-filter.ts

# The rule everywhere in the project
snice/prefer-dispatch-decorator
```

`code path:line` is also accepted. Paths are project-relative. A code-only
entry suppresses the rule globally, including its effect on the command's exit
status; use it only when the project intentionally rejects that rule. The same
file applies to `check`, `doctor`, and `validate`.

## init-ai

```bash
npx snice init-ai            # install version-matched skill
npx snice init-ai --force    # overwrite an existing install
```

Installs a skill matched to the Snice version in the project, so an agent reads documentation for the version actually installed, not whatever it remembers.

## AI Assistance

Token-efficient copies of every reference page live in `docs/ai/`, mirroring the human docs without the prose. Agents should read those instead.

## generate-component

```bash
snice generate-component <name> [--props=a:string,b:number] [--events=x-changed] [--no-styles] [--out=path]
```

- Prints a scaffold to stdout; `--out=<path>` writes instead and refuses to overwrite
- `--props` types: `string` | `number` | `boolean` | `array` | `object` (default `string`)
- `--events` emits one `@dispatch('<name>')` method each, named `emit<PascalName>`
- `--no-styles` omits the `@styles()` block
- Name must be a valid custom-element name (lowercase, contains a hyphen)

## build-component

```bash
npx snice build-component button
npx snice build-component table --format=iife,es --with-theme
```

For building CDN bundles from a Snice source checkout; application projects do not need it.

| Option | Default | Meaning |
|---|---|---|
| `--output=<dir>` | `./dist/cdn` | Output directory |
| `--format=iife,es` | `iife` | Output formats (`table` defaults to `iife,es`) |
| `--no-minify` | off | Disable minification |
| `--with-theme` | off | Include `theme.css` |

See `docs/ai/cdn.md` for how the resulting bundles load.
