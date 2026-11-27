# Safeloop — TypeScript layout

Follow-up to the w4s-safeloop skill. Load before writing or reviewing TypeScript code.

## Directory layout

```
.
├── routes/             # entrypoints (HTTP handlers, user intent)
├── cli/                # entrypoints (command-line commands)
├── services/           # atomic, context-free operations
├── types/              # pure data (interfaces, type aliases)
└── utils/              # small pure helpers, one level up (import graph enforced by tests)
```

## File convention

- One operation per file in `services/`, named after the unit of work — and
  named for the specific thing it returns, not the entity:
  `services/userCreds.ts` exports `getUserLoginCreds`, not a `getUserById`
  whole-entity fetch.
- A test file sits next to each module (`userCreds.test.ts`) covering the
  module's public functions and its private helpers.

## Rules

- Pass dependencies explicitly — connections, loggers, config. No ambient
  module-level singletons imported across the codebase.
- Never throw for expected failures. Return a discriminated union
  (`Result<T, E>` with `Ok`/`Err` shapes, or `T | Error` with a type guard)
  so errors are explicit values handled at the call site. Exceptions are for
  loading things that must fail — e.g. config loading — where fallbacks and
  defaults can cause data corruption.
- Types are pure data: `interface`/`type` only, no methods. Behavior lives in exported functions. Apply the core skill's daemon definition and OOP exception.
- Three layers: entry (routes/cli) → service (atomic, unaware of intent) →
  type (pure data).
- Side effects at entry: transactions, commits, rollbacks, connection
  lifecycle in entrypoint code; services take connections as parameters and
  never commit.
- Services don't import services; compose at the entrypoint.
- Import graph is a DAG; no barrel files that create cycles.
- Pass a contextual logger; log where the error happens.
- Prefer concrete types over interfaces without a real substitution boundary.

## Verification

- `tsc --noEmit` (strict), `eslint`/`biome`, and the test suite are binding.
- Architecture tests (dependency-cruiser or similar) enforce the DAG.
- Grep-level checks: no `throw new Error` in service modules, no
  module-level mutable state.

Reference: Safeloop Architecture (medium.com/@hedzer87), TypeScript samples.
