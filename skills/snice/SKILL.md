---
name: snice
description: Build, modify, debug, or review applications and components that use the Snice web-component framework or its React adapters. Use for Snice component selection, imports, decorators, templates, bindings, routing, controllers, forms, theming, accessibility, generated applications, and release-grade verification.
---

# Work with Snice

Use the documentation shipped with the exact installed Snice version. Do not
reconstruct Snice APIs from Lit or generic web-component conventions.

## Choose the owner before the API

Make this decision before creating files or choosing decorators:

- **Element:** visual behavior, rendering, internal DOM, focus, keyboard behavior, visual state, and semantic events.
- **Controller:** application behavior specific to a set of elements, including API/storage access and business rules.
- **Page:** element orchestration: composition, properties, events, controller binding, and screen coordination. Routing is only one page concern.

Do not attach a controller to a page host, create a “page controller,” or move visual behavior into a controller to shrink an element. Host-free reusable functions may stay plain modules. State plus lifecycle belongs in an explicitly constructed `@daemon`, never a singleton.

Examples: focus/internal buttons → element; element-specific API behavior → controller;
coordinating search, results, and dialog elements → page; state plus lifecycle → daemon.

If `.agents/skills/snice/SKILL.md` is absent, run `npx snice init-ai` from the
project root before writing code; it installs version-matched agent guidance.

## Locate the reference

Use the first directory that exists:

1. `docs/ai/` in a Snice source checkout.
2. `node_modules/snice/docs/ai/` in a consuming application.

Every reference below is relative to that AI-doc root. Never substitute the
parallel human-facing files under `docs/`.

If neither exists, install the project dependencies before writing Snice code.

## Documentation gate (mandatory)

The agent doing the work must complete this gate itself before editing. Do not
delegate the reading, rely on memory, or substitute another agent's summary.

1. Read the AI-doc root's `README.md` for its contract and documentation map.
2. Before touching code that uses a Snice decorator, or introducing one, read
   `decorators.md` and that decorator's complete topical AI reference. The
   general decorator index alone does not satisfy this gate.
3. Before touching code that uses a built-in Snice element, or introducing one,
   read that element's complete `components/<name>.md` reference.
4. Read the applicable template, binding, routing, controller, daemon, React, theme, accessibility, or lifecycle reference before using that feature.

Treat those versioned files and the runtime TypeScript declarations as
authoritative. If they conflict, inspect the installed declarations/source and
add a regression test instead of guessing.

For a compact, compilable example covering every core feature category, read
`references/core-kitchen-sink.ts`. Load it only when a broad example is useful;
do not load it for a focused component change. In a Snice source checkout it
type-checks with `npx tsc -p references/tsconfig.kitchen-sink.json` after
`npm run build:distribution`.

## Implement

- Import built-in elements through their documented deep side-effect path.
- Import React wrappers from `snice/react`; also register each underlying
  custom element through its documented deep side-effect import.
- Pass objects and arrays through property bindings, not string attributes.
- In Router-backed controllers, receive `Context` with `@context()` and use
  `ctx.fetch` for middleware-aware transport. Managed decorators activate
  after `attach()`, so context-dependent startup belongs in the `@context()`
  handler. Do not call bare `fetch`, import the Router into the controller, or
  invent another context-injection channel.
- Preserve native form, keyboard, focus, and accessibility behavior.
- Use the project compiler configuration for TC39 decorators.
- Do not edit generated distribution, adapter, metadata, or website output.

Run `npx snice check` after changing Snice code. It combines package,
configuration, import, hallucination, and component-recommendation checks.
Use `npx snice doctor` or `npx snice validate` only when isolating the
configuration or source half of a failed check.

Diagnostics expose stable codes. After reading the referenced AI docs and verifying intentional acceptance, the agent may record the narrowest suppression in project-root `.sniceignore`: `code path:line:column` (one diagnostic), `code path` (one file), or `code` (global). Use global only when the project rejects the rule. Never suppress merely to pass a gate; comment non-obvious reasons.

## Verify

Run the consuming project's available checks in this order:

1. `npm run type-check`
2. `npm run build`
3. `npm test`
4. Relevant browser journeys

For changes to the Snice repository itself, finish with the complete
`npm test` gate. Do not replace it with a subset.
