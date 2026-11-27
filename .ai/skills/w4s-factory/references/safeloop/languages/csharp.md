# Safeloop — C# layout

Follow-up to the w4s-safeloop skill. Load before writing or reviewing C# code.

## Directory layout

```
.
├── Entrypoints/        # controllers, endpoints, CLI commands (user intent)
├── Services/           # static operation classes (atomic, context-free)
├── Types/              # pure data structs/records
└── Utils/              # small pure helpers, one level up (import graph enforced by tests)
```

## File convention

- Types are `struct`/`record` pure data: `Types/User.cs`.
- In C#, one file holds one class: a `static class` per domain with
  `static` functions — `Services/UserService.cs` holds
  `GetUserLoginCreds` and related operations. C# loves instances, but
  services are static classes with static functions — no instance service
  classes; the static class is a namespace for the operations, not a state
  holder. Grouping related operations in one file is the idiomatic C#
  shape.
- A test file sits next to each module (`UserServiceTests.cs`) covering the
  module's public methods and their private helpers.

## Rules

- Pass dependencies explicitly — connections, loggers, config. No static
  mutable state, no service locators, no ambient singletons.
- Never throw for expected failures. Return `Result<T, E>` / `Maybe<T>`
  (e.g. the `CSharpFunctionalExtensions` package) so errors are explicit
  values. Exceptions are for loading things that must fail — e.g. config
  loading — where fallbacks and defaults can cause data corruption.
- Types are pure data. Behavior lives in static classes. Apply the core skill's daemon definition and OOP exception.
- Three layers: entry (controllers, user intent) → service (atomic) →
  type (pure data).
- Side effects at entry: transactions, commits, rollbacks, `IDbConnection`
  lifecycle in entrypoint code; services take connections as parameters and
  never commit.
- Services don't import services; compose at the entrypoint.
- Import graph is a DAG.
- Pass a contextual logger (`ILogger`); log where the error happens.
- Prefer concrete types over interfaces without a real substitution
  boundary (`DbConnection`, `ILogger`, output sinks are fine).

## Verification

- `dotnet build` (warnings as errors), `dotnet format`/analyzers, and the
  test suite are binding.
- Architecture tests (e.g. via `ArchUnitNET`) enforce layering and the DAG.
- Grep-level checks: no `throw new` in service classes, no static mutable
  state.

Reference: Safeloop Architecture (medium.com/@hedzer87), C# samples.
