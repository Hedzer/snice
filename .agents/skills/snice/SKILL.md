---
name: snice
description: Build, modify, debug, or review applications and components that use the Snice web-component framework or its React adapters. Use for Snice component selection, imports, decorators, templates, bindings, routing, controllers, forms, theming, accessibility, generated applications, and release-grade verification.
---

# Work with Snice

Use the documentation shipped with the exact installed Snice version. Do not
reconstruct Snice APIs from Lit or generic web-component conventions.

If a consuming project does not yet contain `.agents/skills/snice/SKILL.md`,
run `npx snice init-ai` from that project root before writing Snice code. This
installs version-matched guidance plus `AGENTS.md` and `CLAUDE.md` pointers.

## Locate the reference

Use the first directory that exists:

1. `docs/ai/` in a Snice source checkout.
2. `node_modules/snice/docs/ai/` in a consuming application.

If neither exists, install the project dependencies before writing Snice code.

## Load only relevant context

1. Read `README.md` for the framework contract and documentation map.
2. Read the specific topical reference needed:
   - `decorators.md` for decorator signatures.
   - `rendering.md` and `bindings.md` for templates and reactivity.
   - `react-integration.md` for React adapters.
   - `theme.md` for tokens and theming.
   - `patterns.md` for architecture and composition.
3. Read only `components/<name>.md` for components actually used.

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
- Keep application data and orchestration in pages, controllers, or services.
- Pass objects and arrays through property bindings, not string attributes.
- Preserve native form, keyboard, focus, and accessibility behavior.
- Use the project compiler configuration for TC39 decorators.
- Do not edit generated distribution, adapter, metadata, or website output.

Run `npx snice check` after changing Snice code. It combines package,
configuration, import, hallucination, and component-recommendation checks.
Use `npx snice doctor` or `npx snice validate` only when isolating the
configuration or source half of a failed check.

## Verify

Run the consuming project's available checks in this order:

1. `npm run type-check`
2. `npm run build`
3. `npm test`
4. Relevant browser journeys

For changes to the Snice repository itself, finish with the complete
`npm test` gate. Do not replace it with a subset.
