# Safeloop — Python layout

Follow-up to the w4s-safeloop skill. Load before writing or reviewing Python code.

## Directory layout

```
.
├── cli/                # entrypoints (command-line commands)
├── routes/             # entrypoints (API handlers)
├── services/           # atomic, context-free operations
├── types/              # pure data (dataclasses, aliases)
└── utils.py            # small pure helpers, one level up (import graph enforced by tests)
```

## File convention

- One operation per file in `services/`, named after the unit of work — and
  named for the specific thing it returns, not the entity:
  `services/user_creds.py` holds `get_user_login_creds`, not a
  `get_user_by_id` whole-entity fetch.
- A `test_<module>.py` sits next to each module covering the module's
  public functions and its private helpers.

## Rules

- Pass dependencies explicitly — connections, loggers, config. No module-level
  singletons or global imports of `db_connection`, `logger`, etc.
- Never raise for expected failures. Return `Result[T, E]` (the `result`
  package: `Ok`/`Err`) or a discriminated union so errors are explicit
  values handled at the call site. Exceptions/panics are for loading things
  that must fail — e.g. config loading — where fallbacks and defaults can
  cause data corruption.
- Types are `@dataclass`/`TypedDict` pure data; behavior lives in free
  functions.
- Three layers: entry (routes/cli, user intent) → service (atomic, unaware of
  intent) → type (pure data).
- Side effects at entry: connections, transactions, commits, rollbacks live
  in entrypoint code; service functions take a `Connection` parameter and
  never commit.
- Services don't import services; compose at the entrypoint.
- Import graph is a DAG.
- Pass a contextual logger; log where the error happens.
- Prefer concrete types over ABCs/interfaces without a real substitution
  boundary.

## Verification

- `ruff`/`flake8`, `mypy --strict` where applicable, and the test suite are
  binding.
- Grep-level checks: no `raise` in service modules, no module-level mutable
  state, no `import db_connection`.

Reference: Safeloop Architecture (medium.com/@hedzer87), Python samples.
