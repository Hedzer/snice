# Bundle Size Halving — Design

**Goal:** Halve raw `.min.js` bytes of CDN bundles without removing functionality,
without altering source legibility, and with working source maps (verified by
automation).

**Baseline (2026-07-09):** runtime 70,189 B raw / 21,546 B gzip; button 20,014 B
raw (CSS strings ≈ 53% of it); worst offenders: table 427 KB (IIFE — 3× its own
ESM build, anomaly), pdf-viewer 331 KB. Terser runs with default options.

## Constraints

1. Target is **raw minified bytes** (gzip shrinks proportionally).
2. **Source files are never rewritten** — all gains come from build steps.
3. npm `dist/` output stays byte-legible; aggressive transforms apply to
   **CDN bundles only** (`rollup.config.cdn.js` path).
4. Source maps chain through every stage, enforced by an automated test.

## Components

- `scripts/size-report.js` — walks `dist/cdn/*/snice-*.min.js`, records raw +
  gzip per bundle. `--baseline` writes `.size-baseline.json`; default prints a
  markdown before/after table with per-bundle and total deltas.
- `tests/cdn-sourcemaps.test.ts` — for the runtime + sampled component bundles:
  `.map` exists, parses, `sources`/`mappings` non-empty, and a known identifier
  in the minified output traces back (via `source-map` consumer) to the correct
  original file. Runs in every `npm test`.
- Transform stages, in landing order, each measured against baseline:
  1. **Terser config-max** — `passes`, `ecma: 2020`, `pure_getters`; verify
     CSS minification quality (cssnano-level) at the inline step.
  2. **Table anomaly fix** — root-cause 427 KB IIFE vs 146 KB ESM.
  3. **CSS fallback hoisting** — at CSS-inline time rewrite repeated
     `var(--snice-x, <fallback>)` to `var(--snice-x, var(--_n))` plus one defs
     block per component. Semantics-preserving; applies to all builds.
  4. **Corpus string dictionary** — train on all components' large string
     literals (CSS + templates); dictionary ships once inside
     `snice-runtime.min.js` (+~300 B expander); component literals over a
     threshold become expander calls. CDN-only rollup plugin.
  5. **Type-aware private renaming** — file-local TS AST pass renames members
     declared `private`; bails on members referenced as string literals or via
     computed access in the same file. CDN-only.

## Error handling

- Dictionary expander missing (runtime not loaded first) is already guarded by
  the existing runtime-check banner.
- Any transform that cannot prove safety for a given file skips that file and
  logs it in the build output (no silent size-vs-correctness trades).

## Testing

- Full `npm test` green after each stage (`test:cdn-runtime` executes the
  transformed bundles).
- Source-map test guards every stage.
- `test:cdn` size assertions updated downward as stages land.

## Exit criteria

Total raw bytes across CDN bundles reduced ≥50% vs `.size-baseline.json`, or
all five stages landed — whichever comes first, with a final before/after table.
