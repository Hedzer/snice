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
