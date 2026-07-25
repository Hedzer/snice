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
| `build-component <name>` | Build a CDN bundle from a Snice source checkout |
| `mcp` | Start the stdio MCP documentation server |

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

Both accept `--json` for CI.

## AI Setup

```bash
npx snice init-ai
npx snice init-ai --force    # overwrite an existing install
```

This installs a skill matched to the Snice version in your project, so an agent reads the documentation for the version you actually have rather than whatever it remembers. See [AI Assistance](#ai-assistance) below.

## MCP Server

```bash
npx snice mcp
```

Starts an stdio MCP server exposing component documentation, decorator references, and a code validator as tools.

Register it with Claude Code:

```bash
claude mcp add snice -- npx snice mcp
```

The MCP server is optional. `init-ai` is the primary path — the skill points at version-matched documentation and does not require a running server.

## AI Assistance

Token-efficient copies of every reference page live in `docs/ai/`, mirroring these documents without the prose. Agents should read those instead of the human pages.

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
