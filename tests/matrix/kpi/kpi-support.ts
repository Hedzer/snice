/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-kpi feature matrix — shared harness and oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted here is quoted from docs/ai/components/kpi.md and
 * packages/components/src/kpi/snice-kpi.types.ts, never from observed output:
 *
 *   · PARTS — container / header / main / label / value / trend / trend-icon /
 *     trend-value / sparkline. The label and value parts carry the documented
 *     `label` and `value` inputs verbatim.
 *   · TREND — `trendValue` is the trend text and `sentiment` the direction with
 *     its arrow ("up: Green, arrow up", "down: Red, arrow down",
 *     "neutral: Gray, arrow right"). So the trend block exists when either is
 *     given, the icon belongs to `sentiment` and the trend text to
 *     `trendValue` — each independently.
 *   · SPARKLINE — `trendData` is the "Sparkline data array" and
 *     `showSparkline: boolean = true` governs whether it is drawn, so the
 *     sparkline part exists exactly when both are satisfied.
 *   · COLOR-VALUE — "colorValue … apply sentiment color to value": the value
 *     element carries the sentiment when, and only when, both are set.
 *   · SLOTS — `before` ("Content before label/value") and `after` ("Content
 *     after sparkline") are documented as always available.
 *   · REFLECTION — docs/ai/properties.md: `@property` reflects setter changes;
 *     initial defaults are NOT reflected; `trendData` is `attribute: false` and
 *     must therefore never write one.
 *
 * The oracle reports EVERY divergence of a combo at once.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/kpi/snice-kpi';
import type { KpiSentiment, KpiSize } from '../../../packages/components/src/kpi/snice-kpi.types';

export { wait, createComponent };

export interface KpiCombo {
  id: string;
  label: string;
  value: string | number;
  trendValue?: string | number;
  trendData?: number[];
  sentiment?: KpiSentiment;
  size: KpiSize;
  showSparkline: boolean;
  colorValue: boolean;
  /** Light-DOM children for the documented slots. */
  slots: { before: boolean; after: boolean };
}

/** The documented defaults, straight out of the Properties block. */
export const DEFAULTS: Omit<KpiCombo, 'id'> = {
  label: '',
  value: '',
  trendValue: undefined,
  trendData: undefined,
  sentiment: undefined,
  size: 'medium',
  showSparkline: true,
  colorValue: false,
  slots: { before: false, after: false },
};

export const SENTIMENTS: Array<KpiSentiment | undefined> = [undefined, 'up', 'down', 'neutral'];
export const SIZES: KpiSize[] = ['small', 'medium', 'large'];
export const SERIES = [20, 25, 22, 30, 28, 35, 32];

export function combo(id: string, over: Partial<KpiCombo> = {}): KpiCombo {
  return { ...DEFAULTS, id, ...over };
}

/**
 * The cross: sentiment (including "none") x size x trend-value x trend-data —
 * 48 combos, every dimension that changes which documented parts exist — with
 * `showSparkline`, `colorValue` and the two slots rotated across them. That is
 * the mid-range size `.ai/fuzzing.md` asks for: the KPI's render function is
 * four conditionals over four independent inputs, so the conditionals get a
 * full cross and the pure presentation rides along.
 */
export function generateCombos(): KpiCombo[] {
  const combos: KpiCombo[] = [];
  let n = 0;
  for (const sentiment of SENTIMENTS) {
    for (const size of SIZES) {
      for (const hasTrendValue of [false, true]) {
        for (const hasTrendData of [false, true]) {
          const showSparkline = n % 4 !== 2;
          const colorValue = n % 3 === 0;
          const slots = { before: n % 5 === 0, after: n % 7 === 0 };
          combos.push({
            id: `${sentiment ?? 'no-sentiment'}/${size}`
              + `/${hasTrendValue ? 'trend' : 'no-trend'}`
              + `/${hasTrendData ? 'series' : 'no-series'}`
              + `/[${showSparkline ? 'sparkline' : 'sparkline-off'}`
              + `${colorValue ? ',color-value' : ''}`
              + `${slots.before ? ',slot:before' : ''}${slots.after ? ',slot:after' : ''}]`,
            label: 'Monthly Revenue',
            value: n % 2 === 0 ? '$54,239' : 54239,
            trendValue: hasTrendValue ? (n % 2 === 0 ? '+12.5%' : -3) : undefined,
            trendData: hasTrendData ? SERIES : undefined,
            sentiment, size, showSparkline, colorValue, slots,
          });
          n++;
        }
      }
    }
  }
  return combos;
}

/**
 * Attribute name for each documented property whose name needs no translation.
 * These reflect, and every combo of the cross checks them.
 */
const ATTRIBUTE_OF: Record<string, string> = {
  label: 'label',
  value: 'value',
  sentiment: 'sentiment',
  size: 'size',
};

/**
 * The documented attribute names for the three multi-word properties. The docs
 * spell each one out explicitly — "trendValue?: … // attr: trend-value",
 * "showSparkline: boolean = true; // attr: show-sparkline",
 * "colorValue: boolean = false; // attr: color-value" — and the usage block
 * writes them as markup (`<snice-kpi show-sparkline="false">`).
 *
 * They are checked by their own oracle rather than inside `kpiProblems` for one
 * reason only: all three currently diverge (MATRIX-kpi-1..3), and folding a
 * known finding into the structural oracle would paint 48 combos red and hide
 * the next structural regression behind it. The assertion itself is the
 * documented one and is NOT weakened — see the `it.fails` tests that own it.
 */
export const DOCUMENTED_ATTRIBUTE_OF: Record<string, string> = {
  trendValue: 'trend-value',
  showSparkline: 'show-sparkline',
  colorValue: 'color-value',
};

/**
 * The documented attribute contract for the multi-word properties, in both
 * directions: the attribute the docs name is the one the element observes
 * (markup in → property) and the one it reflects (property → markup out).
 */
export function kpiAttributeProblems(el: any, key: keyof typeof DOCUMENTED_ATTRIBUTE_OF): string[] {
  const problems: string[] = [];
  const attribute = DOCUMENTED_ATTRIBUTE_OF[key as string];
  const observed: string[] = (el.constructor as any).observedAttributes ?? [];
  if (!observed.includes(attribute)) {
    problems.push(`[${attribute}] is the documented attribute for ${String(key)} but the element`
      + ` observes ${JSON.stringify(observed.filter(a => a.includes(attribute.replace(/-/g, ''))))}`
      + ' — the documented markup form is ignored');
  }
  if (!el.hasAttribute(attribute)) {
    problems.push(`${String(key)} was assigned but [${attribute}] never reflected`);
  }
  return problems;
}

/**
 * Mount through the PROPERTY channel with only NON-DEFAULT values assigned,
 * and the documented slot children in place BEFORE connection — the KPI's
 * template renders named slots, and a slotted child appended afterwards would
 * measure a different, un-authored first paint.
 */
export async function mountKpi(c: Partial<KpiCombo>): Promise<any> {
  const el = document.createElement('snice-kpi') as any;
  const slots = c.slots ?? DEFAULTS.slots;
  let html = '';
  if (slots.before) html += '<span slot="before" data-probe="before">icon</span>';
  if (slots.after) html += '<span slot="after" data-probe="after">action</span>';
  if (html) el.innerHTML = html;
  document.body.appendChild(el);
  await el.ready;
  for (const [key, value] of Object.entries(c)) {
    if (key === 'id' || key === 'slots') continue;
    if ((DEFAULTS as any)[key] === value) continue;
    el[key] = value;
  }
  await wait(30);
  return el;
}

const partsNamed = (sr: ShadowRoot, name: string): HTMLElement[] =>
  [...sr.querySelectorAll('[part]')].filter(node =>
    (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

const text = (node: Element | null | undefined): string =>
  (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

export interface OracleOptions { fresh?: boolean }

/** Documented: the trend block exists when a trend value OR a sentiment is given. */
export function expectsTrend(c: KpiCombo): boolean {
  return c.trendValue !== undefined || c.sentiment !== undefined;
}

/** Documented: the sparkline is drawn when it is enabled and has data. */
export function expectsSparkline(c: KpiCombo): boolean {
  return c.showSparkline && !!c.trendData && c.trendData.length > 0;
}

/** Every documented consequence of `c`, read back off the rendered tree. */
export function kpiProblems(
  el: any,
  c: KpiCombo,
  { fresh = true }: OracleOptions = {},
): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);
  const sr = el.shadowRoot as ShadowRoot | null;
  if (!sr) { say('kpi rendered no shadow root'); return problems; }

  // ── The always-present skeleton of parts ──────────────────────────────────
  for (const name of ['container', 'header', 'main', 'label', 'value']) {
    const found = partsNamed(sr, name);
    if (found.length !== 1) {
      say(`${found.length} elements carry part="${name}", expected exactly 1`);
    }
  }
  const container = partsNamed(sr, 'container')[0];
  if (!container) return problems;

  const label = partsNamed(sr, 'label')[0];
  const value = partsNamed(sr, 'value')[0];
  if (label && text(label) !== String(c.label)) {
    say(`part="label" reads "${text(label)}", expected "${String(c.label)}"`);
  }
  if (value && text(value) !== String(c.value)) {
    say(`part="value" reads "${text(value)}", expected "${String(c.value)}"`);
  }

  // ── Trend: the block, its icon, and its text, independently ───────────────
  const trends = partsNamed(sr, 'trend');
  const icons = partsNamed(sr, 'trend-icon');
  const trendValues = partsNamed(sr, 'trend-value');
  const wantTrend = expectsTrend(c) ? 1 : 0;
  if (trends.length !== wantTrend) {
    say(`trendValue=${JSON.stringify(c.trendValue)} sentiment=${JSON.stringify(c.sentiment)}`
      + ` rendered ${trends.length} part="trend" element(s), expected ${wantTrend}`);
  }
  const wantIcon = c.sentiment !== undefined ? 1 : 0;
  if (icons.length !== wantIcon) {
    say(`sentiment=${JSON.stringify(c.sentiment)} rendered ${icons.length}`
      + ` part="trend-icon" element(s), expected ${wantIcon}`);
  } else if (wantIcon) {
    const icon = icons[0];
    if (!icon.querySelector('svg')) {
      say(`part="trend-icon" carries no arrow for sentiment="${c.sentiment}"`);
    }
    // "Sentiment: color + icon differentiation" — an icon that conveys nothing
    // to a screen reader must at least not be announced as stray text.
    if (icon.getAttribute('aria-hidden') !== 'true') {
      say('part="trend-icon" is decorative but not aria-hidden');
    }
  }
  const wantTrendValue = c.trendValue !== undefined ? 1 : 0;
  if (trendValues.length !== wantTrendValue) {
    say(`trendValue=${JSON.stringify(c.trendValue)} rendered ${trendValues.length}`
      + ` part="trend-value" element(s), expected ${wantTrendValue}`);
  } else if (wantTrendValue && text(trendValues[0]) !== String(c.trendValue)) {
    say(`part="trend-value" reads "${text(trendValues[0])}", expected "${String(c.trendValue)}"`);
  }

  // ── Sparkline ─────────────────────────────────────────────────────────────
  const sparklines = partsNamed(sr, 'sparkline');
  const wantSparkline = expectsSparkline(c) ? 1 : 0;
  if (sparklines.length !== wantSparkline) {
    say(`showSparkline=${c.showSparkline} trendData=${c.trendData ? `[${c.trendData.length}]` : 'none'}`
      + ` rendered ${sparklines.length} part="sparkline" element(s), expected ${wantSparkline}`);
  } else if (wantSparkline) {
    const chart = sparklines[0].querySelector('snice-sparkline') as any;
    if (!chart) {
      say('part="sparkline" holds no <snice-sparkline>');
    } else if (JSON.stringify(chart.data) !== JSON.stringify(c.trendData)) {
      say(`the sparkline plots ${JSON.stringify(chart.data)},`
        + ` expected ${JSON.stringify(c.trendData)}`);
    }
  }

  // ── colorValue: sentiment colour on the value ─────────────────────────────
  if (value) {
    const marker = `${value.getAttribute('class') ?? ''} ${value.getAttribute('part') ?? ''}`;
    const carries = c.sentiment !== undefined && marker.includes(String(c.sentiment));
    if (c.colorValue && c.sentiment !== undefined && !carries) {
      say(`colorValue with sentiment="${c.sentiment}" left part="value" unmarked`
        + ` (class="${value.getAttribute('class')}") — the sentiment colour cannot apply`);
    }
    if (!c.colorValue && carries) {
      say(`colorValue is off but part="value" still carries the sentiment marker`
        + ` (class="${value.getAttribute('class')}")`);
    }
  }

  // ── The documented slots exist whether or not they are filled ─────────────
  for (const name of ['before', 'after']) {
    const slot = sr.querySelector(`slot[name="${name}"]`) as HTMLSlotElement | null;
    if (!slot) { say(`the documented "${name}" slot is missing`); continue; }
    const assigned = slot.assignedElements ? slot.assignedElements() : [];
    const want = (c.slots as any)[name] ? 1 : 0;
    if (assigned.length !== want) {
      say(`slot "${name}" projects ${assigned.length} element(s), expected ${want}`);
    }
  }

  // ── Reflection ────────────────────────────────────────────────────────────
  for (const [key, attribute] of Object.entries(ATTRIBUTE_OF)) {
    const v = (c as any)[key];
    const isDefault = (DEFAULTS as any)[key] === v;
    const present = el.hasAttribute(attribute);
    if (isDefault) {
      if (present && fresh) {
        say(`${key} left at its default but [${attribute}]="${el.getAttribute(attribute)}"`
          + ' was written anyway');
      }
      continue;
    }
    if (typeof v === 'boolean') {
      // A boolean property reflects as attribute presence/absence.
      if (v && !present) say(`${key}=true assigned but [${attribute}] never reflected`);
      if (!v && present) say(`${key}=false assigned but [${attribute}] is still present`);
      continue;
    }
    if (!present) {
      say(`${key}=${JSON.stringify(v)} assigned as a property but [${attribute}] never reflected`);
      continue;
    }
    if (el.getAttribute(attribute) !== String(v)) {
      say(`[${attribute}] reflected "${el.getAttribute(attribute)}", expected "${String(v)}"`);
    }
  }
  // "trendData … (JS only, attribute: false)"
  if (el.hasAttribute('trend-data') || el.hasAttribute('trenddata')) {
    say('trendData is documented attribute:false but wrote an attribute anyway');
  }

  return problems;
}

/** Assert one combo against the oracle. */
export function expectKpi(el: any, c: KpiCombo, options?: OracleOptions): void {
  expect(kpiProblems(el, c, options), `combo ${c.id}`).toEqual([]);
}
