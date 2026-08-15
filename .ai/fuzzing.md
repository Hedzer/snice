# Fuzzing (Matrix Testing)

## Matrix (fuzz) testing is standard

Components get combinatorial matrix suites that cross their features against
each other and assert exact rendered output. Two tiers:

- **DOM tier** (happy-dom/jsdom, `tests/components/table-matrix/`-style):
  the full matrix runs intentionally via `npm run test:matrix` (and once in
  the full gate) — never in the default vitest loop. A small smoke slice
  (one combo per feature family plus marquee regressions, <10s) lives in the
  default loop.
- **Visual tier** (Playwright, `tests/live/matrix/`): on demand via
  `npm run test:matrix:visual`. Dedicated fixtures — never showcase pages.
  Asserts what DOM tests cannot see: paint, occlusion, computed style, plus
  read-the-screenshot checks on a pinned marquee set.

Rules that make the matrix worth anything:

- Expectations derive from the **documented** behavior (docs/ai/components/),
  never from observed output. A shared oracle helper keeps assertions uniform.
- A combo that diverges from docs is a **finding**: keep the correct
  assertion, mark it `it.fails` with a finding ID, and report it. Never
  weaken an assertion to match buggy output.
- Size the matrix to the component: the table is the ceiling, not the
  template. A divider gets a handful of combos.

See `tests/components/table-matrix/matrix-utils.ts` for the oracle pattern
and `.ai/testing.md` for browser-tier mechanics.
