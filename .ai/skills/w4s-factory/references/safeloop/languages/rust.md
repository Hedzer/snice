# Safeloop — Rust layout

Follow-up to the w4s-safeloop skill. Load before writing or reviewing Rust code.

## Directory layout

A Cargo workspace, one crate per concern, import graph acyclic:

```
crates/
├── <core>_types/       # pure shared types: geometry, colors, IDs, diagnostics
├── <core>_<stage>/     # one crate per pipeline stage (parse, style, layout, ...)
├── <core>_resources/   # external resources (URLs, fonts, images)
├── <core>_paint/       # output-stage transformation
└── <core>_pdf/         # final writer (display list -> output)
```

For non-renderer projects: `types/`, one crate/module per operation stage,
entry adapters at the top.

## Roles

```
entry adapters  ->  engine composition  ->  stage operations  ->  pure types
      |                    |
      +-------------> explicit daemons
```

- **Types** are plain structs/enums with fields only.
- **Operations** are free functions over explicit inputs.
- **Entry adapters** translate CLI/HTTP/FFI intent and own side-effect policy.
- **Daemons** follow the core skill's autonomous-actor definition and OOP exception.
- **Utilities** are small, pure, and domain-neutral.

## File convention

- One public operation per file; private helpers stay beside it in the same
  file.
- Each source file carries focused unit tests in a bottom
  `#[cfg(test)] mod tests` that cover the file's public and private
  functions.
- One public type per file in the shared types module; filename matches the
  type in snake case.

## Rules

- Pass resources, caches, diagnostics, configuration, cancellation, and
  logging explicitly. No global mutable state, ambient singletons, hidden
  thread-locals, implicit system fonts, clock, locale, network, filesystem,
  or randomness.
- Expected failures return typed `Result` errors. Library code never panics
  on document/input data; no `unwrap`/`expect`/`panic!` in production paths.
- Types do not carry business-logic methods or constructors. Protocol trait
  implementations are fine.
- Stage modules do not import sibling stage modules to orchestrate work; the
  engine entry layer composes stages.
- Imports point down; crate and module graph is a DAG.
- Side effects happen at entry or capability boundaries; pure transformations
  remain replayable.
- Prefer concrete data and functions over trait hierarchies. Traits are for
  real substitution boundaries (caller-provided resources, output sinks,
  platform adapters).
- Log once where an operational error happens; document diagnostics are
  returned as ordered data, not emitted through a logger.

## Verification

- `cargo test --workspace --all-features` and `clippy --workspace
  --all-targets --all-features` are binding.
- Architecture tests parse the production code (e.g. with `syn`) and ratchet
  the dependency DAG, pure types, free-function behavior, daemon-only
  methods, and the panic ban. Each detector has a planted-violation test.

Reference: html-to-pdf workspace layout.
