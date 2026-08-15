/**
 * Shared oracle for the snice-funnel feature-combination matrix.
 *
 * Every assertion in this directory routes through the helpers below so the
 * matrix cannot drift into asserting something weaker than the documented
 * contract in `docs/ai/components/funnel.md`:
 *
 *   · `data` is an ORDERED list of stages; one rendered stage per entry, in
 *     the same order — nothing dropped, nothing reordered, nothing added.
 *   · `show-labels` / `show-values` / `show-percentages` each independently
 *     gate one text run per stage. A flag that is off must remove that text
 *     entirely, not merely hide it; a flag that is on must produce text for
 *     every stage the doc says it applies to.
 *   · `variant` and a stage's own `color` decide the fill; an explicit
 *     `stage.color` always wins.
 *   · `orientation` chooses the geometry, and NOTHING else: the same stage
 *     count, the same text content, the same a11y contract in both.
 *   · a11y: the svg is `role="img" aria-label="Funnel chart"`; every stage is
 *     `role="button" tabindex="0"` with a descriptive `aria-label`.
 *
 * Numbers the docs do not specify (path coordinates, exact palette entries,
 * the K/M abbreviation of a value) are asserted STRUCTURALLY — present,
 * ordered, distinct, non-empty — never pinned to an observed literal. That is
 * what keeps a rendering change from failing this suite for no reason while
 * still catching a stage that stopped rendering.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/funnel/snice-funnel';
import type { FunnelStage, SniceFunnelElement } from '../../../packages/components/src/funnel/snice-funnel.types';

export { wait };
export type { FunnelStage, SniceFunnelElement };

/** Settle time for a rebuild: the chart is rebuilt from a @watch reaction. */
export const SETTLE = 60;

export interface FunnelOptions {
  data?: FunnelStage[];
  orientation?: 'vertical' | 'horizontal';
  variant?: 'default' | 'gradient';
  showLabels?: boolean;
  showValues?: boolean;
  showPercentages?: boolean;
  animation?: boolean;
}

/**
 * Mount a funnel with the given combo. Flags go through the ATTRIBUTE channel
 * (`show-labels="false"`, per the documented markup examples) so the matrix
 * exercises the documented public surface rather than a private property poke.
 */
export async function makeFunnel(opts: FunnelOptions = {}): Promise<SniceFunnelElement> {
  const attrs: Record<string, any> = {};
  if (opts.orientation) attrs.orientation = opts.orientation;
  if (opts.variant) attrs.variant = opts.variant;
  if (opts.showLabels !== undefined) attrs['show-labels'] = String(opts.showLabels);
  if (opts.showValues !== undefined) attrs['show-values'] = String(opts.showValues);
  if (opts.showPercentages !== undefined) attrs['show-percentages'] = String(opts.showPercentages);
  if (opts.animation) attrs.animation = true;

  const el = await createComponent<SniceFunnelElement>('snice-funnel', attrs);
  if (opts.data) el.data = opts.data;
  await wait(SETTLE);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function svgEl(el: SniceFunnelElement): SVGElement | null {
  return (el.shadowRoot?.querySelector('.funnel__svg') ?? null) as SVGElement | null;
}

export function stageEls(el: SniceFunnelElement): SVGElement[] {
  return [...(el.shadowRoot?.querySelectorAll('.funnel__stage') ?? [])] as SVGElement[];
}

export function shapeOf(stage: SVGElement): SVGElement | null {
  return stage.querySelector('.funnel__stage-shape') as SVGElement | null;
}

export function textIn(stage: SVGElement, cls: string): string | null {
  const node = stage.querySelector(`.funnel__${cls}`);
  return node ? (node.textContent ?? '') : null;
}

/** Part-annotated shells the docs promise: base, chart, tooltip. */
export function partEl(el: SniceFunnelElement, part: string): HTMLElement | null {
  return (el.shadowRoot?.querySelector(`[part="${part}"]`) ?? null) as HTMLElement | null;
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/**
 * Percentage relative to the FIRST stage, the only reading of "percentages"
 * a funnel doc's `{Visitors 10000, Leads 5000, Customers 500}` example admits
 * (50%, 5%). Rendered to whole percent.
 */
export function expectedPercent(data: FunnelStage[], index: number): string {
  if (data.length === 0) return '0%';
  const first = data[0].value;
  if (first === 0) return '0%';
  return `${Math.round((data[index].value / first) * 100)}%`;
}

/**
 * The core oracle. Given the combo that was mounted, assert the whole rendered
 * stage list at once — every violation reported together, so one run tells you
 * everything wrong with a combo instead of one thing per re-run.
 */
export function expectFunnelMatches(
  el: SniceFunnelElement,
  data: FunnelStage[],
  opts: Required<Pick<FunnelOptions, 'showLabels' | 'showValues' | 'showPercentages'>>,
): void {
  const problems: string[] = [];
  const stages = stageEls(el);

  if (stages.length !== data.length) {
    problems.push(`stage count ${stages.length}, expected ${data.length}`);
  }

  stages.forEach((stage, i) => {
    const spec = data[i];
    if (!spec) { problems.push(`stage ${i}: rendered but not in data`); return; }

    // Order: a stage's data-index must be its position, or "the i-th stage"
    // means nothing and every click/hover payload below is addressing the
    // wrong row.
    if (stage.getAttribute('data-index') !== String(i)) {
      problems.push(`stage ${i}: data-index "${stage.getAttribute('data-index')}"`);
    }

    // a11y contract, documented verbatim.
    if (stage.getAttribute('role') !== 'button') {
      problems.push(`stage ${i}: role "${stage.getAttribute('role')}", expected button`);
    }
    if (stage.getAttribute('tabindex') !== '0') {
      problems.push(`stage ${i}: tabindex "${stage.getAttribute('tabindex')}", expected 0`);
    }
    const aria = stage.getAttribute('aria-label') ?? '';
    if (!aria.includes(spec.label)) {
      problems.push(`stage ${i}: aria-label "${aria}" omits label "${spec.label}"`);
    }

    // The painted shape must exist and carry a fill regardless of which text
    // flags are on — a funnel with no visible geometry is not a funnel.
    const shape = shapeOf(stage);
    if (!shape) {
      problems.push(`stage ${i}: no .funnel__stage-shape`);
    } else {
      const d = shape.getAttribute('d') ?? '';
      if (!/^M .+ Z$/.test(d)) problems.push(`stage ${i}: shape d="${d}" is not a closed path`);
      const fill = shape.getAttribute('fill') ?? '';
      if (!fill) problems.push(`stage ${i}: shape has no fill`);
      if (spec.color && fill !== spec.color) {
        problems.push(`stage ${i}: fill "${fill}" ignores stage.color "${spec.color}"`);
      }
    }

    // Text runs, each gated by its own documented flag.
    const label = textIn(stage, 'label');
    if (opts.showLabels) {
      if (label === null) problems.push(`stage ${i}: show-labels on but no label text`);
      else if (label !== spec.label) problems.push(`stage ${i}: label "${label}" != "${spec.label}"`);
    } else if (label !== null) {
      problems.push(`stage ${i}: show-labels off but label "${label}" rendered`);
    }

    const value = textIn(stage, 'value');
    if (opts.showValues) {
      if (value === null) problems.push(`stage ${i}: show-values on but no value text`);
      else if (!value.trim()) problems.push(`stage ${i}: value text is blank`);
    } else if (value !== null) {
      problems.push(`stage ${i}: show-values off but value "${value}" rendered`);
    }

    // Percentages are a RATIO TO THE FIRST STAGE, so stage 0 is the reference
    // and carries none; every later stage must show its computed ratio.
    const pct = textIn(stage, 'percentage');
    const wantsPct = opts.showPercentages && i > 0;
    if (wantsPct) {
      if (pct === null) problems.push(`stage ${i}: show-percentages on but no percentage text`);
      else if (pct !== expectedPercent(data, i)) {
        problems.push(`stage ${i}: percentage "${pct}" != "${expectedPercent(data, i)}"`);
      }
    } else if (pct !== null) {
      problems.push(`stage ${i}: unexpected percentage "${pct}"`);
    }
  });

  expect(problems).toEqual([]);
}

/** The documented SVG-level a11y contract. */
export function expectChartAccessible(el: SniceFunnelElement): void {
  const svg = svgEl(el);
  expect(svg).not.toBeNull();
  expect(svg!.getAttribute('role')).toBe('img');
  expect(svg!.getAttribute('aria-label')).toBe('Funnel chart');
}

/** Canonical dataset: the doc's own example, extended to four stages. */
export const CANONICAL: FunnelStage[] = [
  { label: 'Visitors', value: 10000 },
  { label: 'Leads', value: 5000 },
  { label: 'Opportunities', value: 2000 },
  { label: 'Customers', value: 500 },
];
