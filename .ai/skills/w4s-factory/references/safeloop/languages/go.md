# Safeloop — Go layout (drake-style)

Follow-up to the w4s-safeloop skill. Load before writing or reviewing Go code.

## Directory layout

```
.
├── cmd/                    # Application entrypoints (each is its own main)
├── routes/                 # HTTP handlers (entrypoint layer, user intent)
├── services/               # Business logic (atomic, context-free operations)
├── daemons/                # Autonomous actors; use the core daemon definition
├── middleware/             # HTTP middleware
├── types/                  # Pure data structures and domain entities
├── utils/                  # Small pure domain-neutral helpers + test helpers
└── (one module per concern, e.g. backend/services/activity/)
```

Package names are lower-case, plural-ish, or the domain name (`types`,
`services`, `daemons`). No package-level mutable state.

## File convention

- **One public function per file.** The filename is the operation in snake
  case: `append_activity.go` contains `AppendActivity(...)`,
  `cancel_run.go` contains `CancelRun(...)`. Private helpers for that
  operation stay beside it in the same file.
- **A test file sits next to it:** `append_activity_test.go` tests
  `AppendActivity` and exercises the file's private helpers directly —
  both the public function and the private functions of that file.
- Packages carry a small `doc.go` describing the package's role.
- Types get their own file in `types/`, named after the type
  (`user.go` for `User`).

## Rules

- Pass dependencies explicitly: `db`, `*slog.Logger`, config, clocks — never
  globals or package-level variables.
- Return errors explicitly: `Result[T]` or `(T, error)`. Never panic.
- Types are pure data; functions do the work. Use the core skill's daemon definition and OOP exception.
- Three layers: entry (routes/cmd, user intent) → service (atomic,
  context-free) → type (pure data). Daemons have user-level agency.
- Entrypoints are surface-specific: an API uses routes, a CLI uses cmd. It
  is rare to abstract them; only when several surfaces (e.g. API + MCP +
  Terraform) drive the same operations are the shared entrypoint functions
  factored into an `entrypoints/` folder that each surface calls —
  abstraction needs a real reason.
- Side effects at entry: transactions, commits, rollbacks only in
  entrypoint code. Services accept a `Connection`-style interface.
- Services do not import services; compose at the entrypoint.
- Import graph is a DAG, imports point downward.
- Pass a contextual `*slog.Logger`; log where the error happens.
- Query the minimum projection; explicit column lists, never `SELECT *`.
- Prefer concrete types over interfaces unless there is a real substitution
  boundary.

## Verification

- `go vet ./...`, `go test ./...` must pass.
- A service file with more than one exported function is a smell — split it.
- Architecture tests (if present) enforce the DAG and layering mechanically.

Reference: drake backend layout (cmd/routes/services/daemons/middleware/types/utils).
