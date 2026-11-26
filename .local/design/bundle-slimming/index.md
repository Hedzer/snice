# Bundle Slimming & Cache-Friendly Plugin — Design Index

- **Design ID**: `bundle-slimming`
- **Status / Current Phase**: `story finalization` complete — all 4 user decisions (`Q-1`..`Q-4`) settled and all 11 whole stories (`BS-01`..`BS-11`) authored, reviewed by independent A/B/C/D advisory critics, refined, and placed in `.local/board/ready/`.
- **Next Unfinished Action**: Review `.gitignore` narrow exception for tracking `.local/design/**` (keeping `.local/board/`, `.local/cards/`, and `.local/gauntlet/` ignored) and commit the durable design artifacts when ready. Implementation stories are ready in `.local/board/ready/` for a separately invoked implementation workflow.

---

## Attribution

### User-Provided Details
1. Original request: *"is there anything that we can make that will help lean up pacages made using snice? the same way that react and other things make very small packages? not minification alone, not just compresion but anything that could understand and strup out"*
2. Approval to plan and author stories: *"ok, let's do it, plan it out, make the stories and then work them"*
3. Core product direction: *"i want a perfect, working, plugin that will deliver tiny, easy to cache packages for our users"*
4. Settled product decisions (`Q-1`..`Q-4`, all Option A):
   - **Q-1 = Option A**: Built-in subpath exports on `snice` (`snice/vite`, `snice/rollup`), authored cleanly under `packages/plugin/` for lockstep versioning and zero extra install.
   - **Q-2 = Option A**: Vite + Rollup first with single-plugin ergonomics (`plugins: [snice()]`) handling Snice decorator lowering + TC39 2022-03 fallback for non-Snice decorators, replacing `unplugin-swc` in `create-app` templates.
   - **Q-3 = Option A**: Include both quick-win shared-helper decoupling (`BS-04`: `utils.ts` icon split & `pdf-viewer` lazy load) AND backwards-compatible modular `snice-table` slimming (`BS-11`), keeping default `snice-table` import 100% backwards compatible.
   - **Q-4 = Option A**: Safe auto-detect defaults — auto-enable allowlisted `var(--snice-*, fallback)` stripping in production when `theme.css` is imported (`stripCssFallbacks: 'auto'`); keep `theme.css` token pruning opt-in (`pruneTheme: false`) with `themeSafelist` support.

### Skill-Authored Details
- Codebase measurements, `file:line` citations, compatibility constraints, personas/flows, volatility-tiered caching architecture, critic-verified refinements, and the 11-story decomposition in the linked design documents and board stories.

---

## Artifact Map

| Artifact | Purpose |
|---|---|
| [index.md](index.md) | Master index, settled decisions ledger, story decomposition map, linked board stories, and next action |
| [personas-and-flows.md](personas-and-flows.md) | Personas, measured size baselines, and end-to-end user/CLI/build/caching flows |
| [codebase-audit.md](codebase-audit.md) | Verified source-level evidence (`file:line` citations) for core, decorators, templates, CSS, components, templates, CLI, and test gates |
| [architecture.md](architecture.md) | Technical architecture for Pillar 1 (Tiny Packages) and Pillar 2 (Easy to Cache), transform contracts, compatibility matrix, and verification strategy |

---

## Decisions Ledger

### Settled Constraints (Repository Policy & Compatibility Contracts)
- **S-1 (No-Plugin Backwards Compatibility)**: Snice core, components, CDN shared runtime (`dist/cdn/runtime/snice-runtime.min.js`), React adapters (`adapters/react/`), and apps *not* using the Snice plugin MUST continue to work with zero breaking changes.
- **S-2 (Published Package Contracts)**: Preserve `package.json` `exports` condition ordering (`types` before `import`/`require`), existing deep component paths (`snice/components/<name>/snice-<name>`), and non-null `sourcesContent` in all `dist/` and `adapters/react/` sourcemaps (`tests/package-contract.test.ts`), plus `> 0.8` CDN sourcemap named-mapping fidelity (`tests/cdn-sourcemaps.test.ts`).
- **S-3 (Core Quality Gates)**: Core changes MUST introduce zero circular dependencies (`rollup.config.js:34-40`) and maintain strictly `> 90%` (`90.01%`) statements/branches/functions/lines across the 8 core engine files (`vitest.core-coverage.config.ts`).
- **S-4 (`snice check` / `snice doctor` Compatibility)**: The plugin MUST work when `snice doctor` runs `vite.build` in a temporary `probeDir` with `manualChunks: () => undefined` and custom non-Snice TC39 2022-03 decorators (`bin/snice.js:471-535`), and `bin/project-analyzer.js` must allow `'snice/vite'` and `'snice/rollup'`.
- **S-5 (Two-Pillar Product Goal — User-Provided)**: Deliver both **tiny packages** (Snice-aware compile-time stripping/lowering + core tree-shaking) and **easy-to-cache packages** (deterministic, volatility-tiered chunk boundaries with stable content hashes) through an ergonomic, "just works" plugin.

### Settled User Decisions (`Q-1`..`Q-4`)

| ID | Decision | Settled Choice (User-Provided) | Affects Stories |
|---|---|---|---|
| **Q-1** | **Plugin packaging & import surface** | **Option A**: Subpath exports on `snice` (`snice/vite`, `snice/rollup`) authored under `packages/plugin/` | `BS-05`..`BS-10` |
| **Q-2** | **Bundler targets & Vite SWC replacement** | **Option A**: Vite + Rollup first; `plugins: [snice()]` handles Snice decorator lowering + TC39 2022-03 fallback and replaces `unplugin-swc` in `create-app` templates | `BS-05`, `BS-06`, `BS-09`, `BS-10` |
| **Q-3** | **Heavy-component slimming scope** | **Option A**: Include both quick-win decoupling (`BS-04`) and backwards-compatible modular `snice-table` (`BS-11`) | `BS-04`, `BS-11` |
| **Q-4** | **Default aggressiveness for `theme.css` stripping/pruning** | **Option A**: Auto-enable allowlisted `var(--snice-*, fallback)` stripping when `theme.css` is imported (`'auto'`); keep `pruneTheme: false` opt-in with `themeSafelist` | `BS-08` |

### Open User Decisions
- None. All four scope/packaging questions are settled.

---

## Story Decomposition & Linked Board Stories

All 11 stories are self-contained, critic-reviewed (A/B/C/D), and saved under `.local/board/ready/`:

| Story ID | Title | Pillar | Board Status | Linked Story Path | Prerequisites |
|---|---|---|---|---|---|
| **BS-01** | Core side-effect elimination, `"sideEffects"` declaration & `css()` stylesheet caching | Tiny | `ready` | `.local/board/ready/BS-01.md` | None |
| **BS-02** | Acyclic lifecycle-hook inversion & core ESM tree-shaking | Tiny | `ready` | `.local/board/ready/BS-02.md` | `BS-01` |
| **BS-03** | Production `__DEV__` diagnostic gating & dead-code-eliminable warnings | Tiny | `ready` | `.local/board/ready/BS-03.md` | `BS-01`, `BS-02` (serialized on `main`) |
| **BS-04** | Component shared-helper decoupling (`utils.ts` icon split & `pdf-viewer` lazy loader) | Tiny | `ready` | `.local/board/ready/BS-04.md` | None (parallel with `BS-01`..`BS-03`) |
| **BS-05** | Snice bundler plugin scaffold, Vite/Rollup integration & deterministic cache-boundary chunking | Cache + Foundation | `ready` | `.local/board/ready/BS-05.md` | `BS-01` |
| **BS-06** | Build-time Snice decorator lowering & TC39 2022-03 fallback | Tiny | `ready` | `.local/board/ready/BS-06.md` | `BS-02`, `BS-05` |
| **BS-07** | Build-time `html\`...\`` / `svg\`...\`` template minification & opt-in pre-compiled descriptors | Tiny | `ready` | `.local/board/ready/BS-07.md` | `BS-02`, `BS-05` |
| **BS-08** | Build-time CSS pipeline (inline `css\`...\`` minification, `.css?inline` folding, allowlisted `var()` stripping & opt-in `pruneTheme`) | Tiny + Cache | `ready` | `.local/board/ready/BS-08.md` | `BS-01`, `BS-05` |
| **BS-09** | Snice own distribution & CDN build dogfooding + size/cache regression suite | Tiny + Cache | `ready` | `.local/board/ready/BS-09.md` | `BS-02`, `BS-03`, `BS-04`, `BS-05`, `BS-06`, `BS-07`, `BS-08` |
| **BS-10** | `create-app` templates, `snice check`/`doctor` integration & human+AI documentation | Ergonomics + Cache | `ready` | `.local/board/ready/BS-10.md` | `BS-05`, `BS-06`, `BS-07`, `BS-08` |
| **BS-11** | Modular `snice-table` feature/cell tree-shaking & plugin-guided stripping | Tiny | `ready` | `.local/board/ready/BS-11.md` | `BS-03`, `BS-05`, `BS-10` (doc sequencing) |

---

## Repository Housekeeping Notes
- `.gitignore:124` currently ignores `.local/` wholesale, hiding `.local/design/bundle-slimming/` from Git. Before committing `.local/design/bundle-slimming/`, apply the narrow `.gitignore` exception (`!/.local/`, `/.local/*`, `!/.local/design/`, `!/.local/design/**`) so `.local/design/**` is tracked while `.local/board/`, `.local/cards/`, and `.local/gauntlet/` remain ignored.
- `.ai/policies/primer.md` does not currently exist; create if desired as a separate housekeeping step.
