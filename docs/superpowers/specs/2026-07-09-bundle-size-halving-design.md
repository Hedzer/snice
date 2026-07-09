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

Go as low as possible: land all five stages, then keep pulling any additional
safe levers found along the way. 50% is the floor, not the finish line. Final
before/after table against `.size-baseline.json` at the end.

## Outcome (2026-07-09) — stopped after stage 1, by decision

Measurement invalidated the estimates; recorded here so this isn't re-litigated:

- Landed: terser config-max (−2.6% runtime, −1.3% across components), size
  baseline + `scripts/size-report.js`, automated source-map fidelity guard
  (`tests/cdn-sourcemaps.test.ts`, name-trace ratio 1.000 at baseline).
- Measured ceilings that killed the plan: CSS fallback hoisting is 2.3%
  corpus-wide (not ~25% as the button sample suggested); mangling EVERY
  property (guaranteed breakage) buys only ~8% on the runtime; console strings
  3.5%; corpus dictionary rejected — components ship individually, so
  cross-bundle commonality taxes the runtime to help an aggregate nobody
  downloads. The 427 KB "table anomaly" was a stale `public/` artifact.
- Halving raw bytes by safe transforms is not achievable (realistic stack
  ≈ −22%, runtime ≈ 53 KB). Remaining real levers, if ever wanted: a
  component-core runtime split (−13-15%, product-shape change: `snice-runtime`
  without router/fetcher + `snice-runtime-full`), a pdf-viewer lazy engine
  split (−8-9% of corpus total), or brotli precompression (wire: runtime
  ~19 KB br). Decision: keep stage 1 + infrastructure, stop.
