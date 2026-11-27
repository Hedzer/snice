---
name: w4s-safeloop
description: Write and review code in the Safeloop architecture style — explicit dependencies, no globals, no thrown exceptions (typed results instead), data separated from behavior, entry/service/type layering, side effects managed at entrypoints, and acyclic imports. Use when writing new code, reviewing or refactoring existing code, or when the user mentions Safeloop, safety, or architecture style. Binding style for repos whose .ai policies adopt Safeloop.
---

# Safeloop

## What it is

Safeloop closes the loop between what code appears to do at design time and
what it does at runtime. Rules make code comprehensible at design time and
predictable at runtime: no hidden state, no hidden failure, no hidden
dependencies. Every circuit between user, code, and external systems is
complete and explicit, errors included. Code is verbose but simple to
comprehend, highly testable, and predictable.

## When to use

- Writing new code or tests in a Safeloop repo.
- Reviewing code against the Safeloop rules (use the checklist below).
- Refactoring code that violates the rules toward compliance.
- Answering questions about Safeloop or architecture style.

When a repo's `.ai/policies/architecture.md` or `style.md` adopts Safeloop,
these rules are binding. Enforce them; push back on violations.

## Binding rules

1. **Pass dependencies explicitly.** Never use globals, package-level mutable
   variables, ambient singletons, hidden thread-locals, or ambient imports for
   db, logger, clock, config, filesystem, network, or randomness. Everything a
   function uses arrives as a parameter.

   State that must be global (app-wide resources: db, logger, config, clock)
   must never live in a singleton or module-level variable. It is dependency
   injected via an explicit app-context value — a struct/record holding the
   resources, including daemons (as references) and configs. The context is
   built at start and is generally only known to the entrypoint — services
   and other functions get the specific values they need, not the context
   itself.

   Why each prohibition:

   - **Module-level variables and globals:** testing ease and testing
     contention. A test must be able to construct the function's world from
     scratch — set up the dependency, run, tear down — without stepping on
     other tests. A global forces every test to mutate shared state: tests
     cannot run in parallel (contention), one test's setup bleeds into the
     next, and varying a dependency per test means mutating and restoring
     global state. Hidden input is the secondary cost: a function that reads
     a global depends on state invisible in its signature, so what the code
     appears to do at design time and what it does at runtime diverge.
   - **Singletons:** globals wearing a hat. The "one true instance" hides
     the same dependency, forbids having two instances (a test database and
     a production database cannot coexist), couples the whole program to its
     initialization order, and makes substitution in tests impossible
     without reaching into global state.
   - **Ambient imports** (a db connection imported from a module): the same
     hidden coupling, smuggled through the import graph — nothing in the
     call tells you the function talks to a database.
   - **Thread-locals:** per-thread globals; the same hidden state plus
     nondeterminism, since what a function sees depends on which thread
     happened to run it.
   - **The app context instead:** the context is an explicit value holding
     what changes app behavior throughout — db, logger, config, clock,
     daemons by reference, and cross-cutting concerns such as logging,
     telemetry, cache, daemons, and localization. Those are common examples,
      not a hard list. It is built at start — at program startup. Generally
      only entrypoints are aware of it and have access to it (a request
      context is similar). Services and other functions get values, parts
      of configs, or the specific things they need — the context is not
      passed around wholesale. That is not strictly prohibited, but it is
      usually a bad idea: the context becomes a catch-all and hides what
      each function actually depends on.
      After assembly it is never mutated: where the language allows, make it
     immutable/frozen (final/readonly fields, frozen dataclass,
     `Readonly<T>`, and so on); where the language cannot enforce that,
     tests must detect assignment attempts outside the site where it was
     constructed. When calling down into services, the entrypoint passes
     each function specifically what it needs (a connection, a logger, a
     config value) — not the context itself; a context threaded into every
     function signature becomes a catch-all and is usually a bad idea.

2. **Return errors, don't throw.** Use a `Result`/union type (or equivalent)
   so failures are explicit values. No exceptions, panics, or unchecked
   `unwrap` in production paths. Forcing call sites to handle errors yields
   thorough failure testing and prevents surprise control flow.

3. **Separate data from behavior.** Types are pure data (fields only, no
   business-logic methods, no constructors doing work). Behavior lives in
   free functions over explicit inputs.

   Why: data and behavior have different import graphs. Data types form a
   stable, acyclic web — any module can import them. Functions, however,
   join across that web (view-like operations traverse parent→child, but
   also child→parent and across siblings), so function imports are the ones
   that go circular. Splitting them means the data graph stays importable
   everywhere while function orchestration is composed at the entrypoint.
   Combining them declares that the reason to import the data and the reason
   to import the behavior are identical and will never diverge — it works
   for a while, then demands abstraction and indirection to escape cycles.
   It also lets `self`-mutation travel up the call stack, turning input
   parameters into hidden outputs.

4. **Three layers.** Entrypoints understand user intent (routes, CLI, API
   handlers). Services are context-free atomic operations (units of work,
   unaware of intent). Types are pure data structures. Nothing else exists.

   Entrypoints are concrete to their surface. If the app is just an API,
   `routes/` are the entrypoints; if it's just a CLI, `commands/` are the
   entrypoints. It is rare to need to abstract entrypoints — only when the
   number of surfaces is very high, for example MCP, API, and Terraform all
   doing the same thing in one app. Then the shared entrypoint functions are
   put into their own layer (an `entrypoints/` folder or similar) and each
   surface calls into it. Abstraction requires a good reason: the operations
   must actually be exercised by more than one surface. One surface, one
   entrypoint layer. No speculative abstraction.

5. **Manage side effects at entry.** Transactional concepts — opening and
   closing transactions, commits, rollbacks — belong in the entrypoint,
   because the entrypoint understands the intent of the call while services
   are individual actions. The transaction is passed down to services, and
   they never decide to commit or roll it back; a service never opens a
   connection or decides the overall outcome. Letting a service decide when
   to commit is like letting any worker on a construction site declare the
   building finished — that decision belongs to the project manager who
   ensures every stage is complete. The entrypoint is the project manager.

6. **Services don't import services.** If a service looks like it needs to
   import a service, the usual cause is that it needs a result produced by
   another service: hand that result back to the entrypoint and let the
   entrypoint thread it to the other service. That is the most common reason
   the attempt occurs, but not the only. Cross-cutting concerns — usually
   utils — also trigger it: utils live one level up, and their import graph
   is enforced by tests. Constants are another case, but even those are
   passed down through dependency injection as part of the app context. The
   logger and config are never imported by services — they arrive as
   explicit parameters drawn from the app context at the entrypoint. When in
   doubt, compose at the entrypoint.

7. **Import graph is a DAG.** Every layer imports only downward:
   entry → service → type → util. No cycles, no upward imports.

8. **Log where the error happens.** Log at the site of failure with context,
   then return the typed error. Pass a contextual logger as a parameter
   (enriched with request id, user, etc.) rather than using a global.

9. **Prefer concrete over abstract.** No interfaces/traits/abstractions
   without a real substitution boundary (caller-provided resources, output
   sinks, platform adapters). Accept concrete types; correctness and clarity
   outrank abstraction reuse.

10. **Query the minimum projection.** Select only needed columns/fields;
    never `SELECT *` or whole-object fetches. Whole-entity fetchers like
    `get_user_by_id`/`getUserById` are a smell — they drag in everything
    and hide what the caller actually needs. Fetch the specific projection:
    `get_user_login_creds`, not the whole user.

11. **Name for findability.** Names are coarse categories; the point is to
    make it obvious where to find things. Avoid duplicate prefixes unless
    meaningful — do not make `user_auth/` and `user_profile/`; merge them
    into `user/`. Too specific a bucket creates ambiguity; too broad a
    bucket creates noise. When in doubt, start broader and split later if
    the bucket gets noisy.

## State and daemons

OOP is banned except for genuine daemons. Do not create or label a daemon merely to justify using OOP.

Daemons are rare, long-lived autonomous actors with user-level agency. They may invoke top-level entrypoints and services and combine state with attached methods.

State, a lifecycle, or convenient methods alone do not qualify a component as a daemon. All other components keep data separate from behavior.

Private subobjects inside a daemon are usually fine; they do not need to be separate daemons.

Passing a daemon into a service function is usually a smell that it was misclassified.

`ScheduledJob` describes the work and its schedule. `CronScheduler` decides when to run that work, runs it, and handles cancellation. The scheduler is the daemon; the job is data. Even if the job has a lifecycle, that does not make it a daemon.

These examples illustrate the distinction, not prescribed APIs.

**Daemon and its job data:**

```text
class CronScheduler:
    jobs: ScheduledJob[]
    Start()
    Stop()
    AddJob(job)
    RemoveJob(job)
    RunJob(job)
    CancelJob(job)

class ScheduledJob:
    schedule
    work
```

**Mistake: treating the job as another daemon when the scheduler has the autonomy:**

```text
class ScheduledJob:
    Run()
    Cancel()
```

## Language follow-ups

Language details — directory layout, file conventions, per-language rule
deltas — are NOT in this skill. They live in follow-up docs loaded only when
needed. Before writing, reviewing, or refactoring code, determine the repo's
primary language, then read the matching follow-up:

- Go → `languages/go.md` (drake-style layout: cmd/routes/services/daemons/middleware/types/utils; one public function per file, adjacent `_test.go` covering that file's public and private functions)
- Rust → `languages/rust.md` (workspace of stage crates; one public operation per file; bottom `#[cfg(test)] mod tests`)
- Python → `languages/python.md` (`cli`/`routes`/`services`/`types`; `Result[T, E]`)
- TypeScript → `languages/typescript.md` (`routes`/`services`/`types`; discriminated unions)
- C# → `languages/csharp.md` (structs + static service classes; `Result<T, E>`)

The follow-up file is loaded on demand — do not read all of them up front,
only the one for the language you are about to work in. If the repo's
language has no follow-up, use the general rules above and ask the user for
the layout and conventions before writing code.

## Why it's called Safeloop

Following the rules, every circuit between user, code, and external systems is
complete — errors included. Code is verbose but simple to comprehend, highly
testable, serviceable. The development process is surefooted, the runtime
behaves predictably. It is a safe loop for everyone involved.

## Pragmatism

If the language makes the style convoluted, adapt or abandon it — simplicity,
testability, and predictability are the point, not the letter of the rules.
Flexibility is important: what works really well for the purpose is, at the
end of the day, what should go. And if a repo adopts even one rule from
Safeloop, that is a win — full adoption is the target, not the entry
requirement.

## Mechanical enforcement

Every rule that can be checked mechanically should be: architecture tests
that parse the codebase and fail on violation — e.g. no global mutable
state, no `unwrap`/`panic` in production paths, no wildcard imports,
no service-to-service imports, dependency graph stays a DAG, types stay
pure. A detector should have a planted-violation test so a weakened check
cannot pass silently. Enforce with ratchets, not with agent review; agents
verify with the checks, they do not replace them.

## Review checklist

Go through each checkable rule explicitly when reviewing:

- [ ] Dependencies passed as parameters; no globals or ambient imports.
- [ ] App context built at start; never mutated; generally only entrypoints have access; functions get the specific values they need (wholesale context passing is a catch-all smell).
- [ ] No thrown exceptions/panics in production paths; errors are typed results.
- [ ] Types are pure data; no business-logic methods on data structures.
- [ ] Transactions/commits/rollbacks only at entrypoints.
- [ ] No service-to-service imports; composition happens at entrypoint.
- [ ] Import graph is acyclic and downward.
- [ ] Logs emitted where errors happen, with context; no swallowing.
- [ ] No abstraction without a real substitution boundary.
- [ ] No `SELECT *` or over-fetching.
- [ ] Architecture checks exist and pass for every rule that is mechanically checkable.
- [ ] Review as evidence: cite the violating line and the rule number.

Reference: https://medium.com/@hedzer87/safeloop-architecture-c0358a33cb69
