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
| `mcp` | Start the stdio MCP documentation server |

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

Both `doctor` and `validate` accept `--json`.

## init-ai

```bash
npx snice init-ai            # install version-matched skill
npx snice init-ai --force    # overwrite an existing install
```

Installs a skill matched to the Snice version in the project, so an agent reads documentation for the version actually installed, not whatever it remembers.

## mcp

```bash
npx snice mcp
```

- stdio MCP server exposing component docs, decorator references, a code validator as tools
- Register: `claude mcp add snice -- npx snice mcp`
- Optional — `init-ai` is the primary path; the skill points at version-matched docs and does not require a running server

## AI Assistance

Token-efficient copies of every reference page live in `docs/ai/`, mirroring the human docs without the prose. Agents should read those instead.

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
