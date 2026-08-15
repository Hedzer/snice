/**
 * snice-layout matrix — the documented per-shell options.
 *
 * Every option in `docs/ai/components/layout.md`'s shell table, crossed over its
 * documented value set: `centered` width, `split` direction x ratio, `card`
 * columns x gap, `landing` use-nav, `fullscreen` overlay, `master-detail`
 * selected, `auth-split` panel-position, and the sidebar shells' `collapsed`.
 *
 * The DOM-tier claim for a layout option is narrow on purpose: the option must
 * survive both channels (attribute in, property out), it must reach the
 * rendered tree so a stylesheet can key off it, and it must not disturb the
 * shell's documented regions. Where the option MEANS a proportion or a measure,
 * only a browser can judge it — that is `tests/live/matrix/layout`'s job.
 *
 * 44 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  SHELLS, checkShell, expectNoProblems, makeShell, shell, wait,
} from './layout-support';

/**
 * The single option value whose region damage is a recorded finding
 * (MATRIX-layout-3, asserted in shells.test.ts): `use-nav` swaps the documented
 * `nav` region out for the placard-driven nav, so the region stops existing.
 * Skipped here so one defect is reported once, in the file that owns it.
 */
function isKnownRegionFinding(tag: string, property: string, value: unknown): boolean {
  return tag === 'snice-layout-landing' && property === 'useNav' && value === true;
}

describe('layout matrix — documented defaults', () => {
  afterEach(() => unmountAll());

  for (const spec of SHELLS) {
    if (!spec.options) continue;
    it(`${spec.tag}: defaults`, async () => {
      const el = await makeShell(spec);
      const problems: string[] = [];
      for (const [property, option] of Object.entries(spec.options)) {
        if ((el as any)[property] !== option.default) {
          problems.push(`${property} defaults to ${JSON.stringify((el as any)[property])},`
            + ` expected ${JSON.stringify(option.default)}`);
        }
      }
      expectNoProblems(problems, `${spec.tag} defaults`);
    });
  }
});

describe('layout matrix — option values', () => {
  afterEach(() => unmountAll());

  for (const spec of SHELLS) {
    if (!spec.options) continue;
    for (const [property, option] of Object.entries(spec.options)) {
      for (const value of option.values) {
        it(`${spec.tag} ${option.attribute}=${String(value)}`, async () => {
          const attrs = typeof value === 'boolean'
            ? (value ? { [option.attribute]: true } : {})
            : { [option.attribute]: value };
          const el = await makeShell(spec, attrs);

          expect((el as any)[property], `${property} did not cross the attribute channel`)
            .toBe(value);
          // The shell's documented regions are unaffected by any option —
          // except for the one combination MATRIX-layout-3 pins (see
          // shells.test.ts), which is asserted there rather than twice.
          if (!isKnownRegionFinding(spec.tag, property, value)) {
            expectNoProblems(checkShell(el, spec), `${spec.tag} ${option.attribute}=${String(value)}`);
          }
        });
      }
    }
  }
});

describe('layout matrix — split proportions', () => {
  afterEach(() => unmountAll());

  const spec = shell('snice-layout-split');

  for (const direction of ['horizontal', 'vertical'] as const) {
    for (const ratio of ['50-50', '60-40', '70-30', '33-67', '67-33'] as const) {
      it(`${direction}/${ratio}: both panes are rendered and filled`, async () => {
        const el = await makeShell(spec, { direction, ratio });
        expect((el as any).direction).toBe(direction);
        expect((el as any).ratio).toBe(ratio);
        expectNoProblems(checkShell(el, spec), `${direction}/${ratio}`);
      });
    }
  }
});

describe('layout matrix — card grid', () => {
  afterEach(() => unmountAll());

  const spec = shell('snice-layout-card');

  for (const columns of ['1', '2', '3', '4', '6'] as const) {
    for (const gap of ['sm', 'md', 'lg', 'xl'] as const) {
      it(`columns=${columns} gap=${gap}`, async () => {
        const el = await makeShell(spec, { columns, gap });
        expect((el as any).columns).toBe(columns);
        expect((el as any).gap).toBe(gap);
        expectNoProblems(checkShell(el, spec), `columns=${columns}/gap=${gap}`);
      });
    }
  }
});

describe('layout matrix — options through the property channel', () => {
  afterEach(() => unmountAll());

  for (const spec of SHELLS) {
    if (!spec.options) continue;
    it(`${spec.tag}: a later property change reaches the rendered shell`, async () => {
      const el = await makeShell(spec);
      const problems: string[] = [];
      for (const [property, option] of Object.entries(spec.options)) {
        const next = option.values.find(value => value !== option.default);
        if (next === undefined) continue;
        (el as any)[property] = next;
        await wait(30);
        if ((el as any)[property] !== next) {
          problems.push(`${property} did not take the value ${JSON.stringify(next)}`);
        }
        if (isKnownRegionFinding(spec.tag, property, next)) continue;
        problems.push(...checkShell(el, spec).map(problem => `after ${property}=${String(next)}: ${problem}`));
      }
      expectNoProblems(problems, `${spec.tag} property channel`);
    });
  }
});
