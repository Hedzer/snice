/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-estimate matrix — the authored-markup channel and the three events
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Half of this component's documented surface is attributes. The doc's
 * property table names one per line —
 *
 *     estimateNumber: string = '';   // attribute: estimate-number
 *     expiryDate: string = '';       // attribute: expiry-date
 *     taxRate: number = 0;           // attribute: tax-rate
 *
 * — and the doc's HTML example writes them:
 *
 *     <snice-estimate estimate-number="EST-001" date="2026-01-15"
 *                     status="sent" tax-rate="10">
 *
 * So the cross below is every documented attribute against a value, asserting
 * the property it is documented to set.
 *
 * ── MATRIX-estimate-1 (fixed), and what THIS tier sees of it ────────────────
 *
 * All three kebab-named properties used to be declared with a bare
 * `@property()`, so the element observed `estimatenumber`, `expirydate` and
 * `taxrate` — not the names the docs publish. In a REAL BROWSER that made all
 * three documented attributes inert (pinned in
 * tests/live/matrix/estimate/estimate-visual.spec.ts), because happy-dom hands
 * `attributeChangedCallback` every attribute change whether or not the element
 * observed it. Under happy-dom the values therefore arrived — through a path
 * that skipped the `type: Number` converter, so `tax-rate="10"` set `taxRate`
 * to the STRING `"10"`.
 *
 * The decorators now name the documented attributes (`estimate-number`,
 * `expiry-date`, `tax-rate`), the kebab attributes run their converters, and
 * every case below runs unpinned as the regression guard.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, cross, Problems, expectClean, captureEvents, removeComponent, click, wait }
  from '../matrix-kit';
import { exactPart as part, exactParts as parts } from '../part-exact';
import {
  REQUIRED_LINES, EXCLUDED_LINES, LINE_SETS, expectedTotal, includedItems,
  readSummary, expectedSummary,
} from './estimate-support';

const TAG = 'snice-estimate';
await import('../../../packages/components/src/estimate/snice-estimate');

afterEach(() => { document.body.innerHTML = ''; });

// ── The documented attributes ───────────────────────────────────────────────

interface AttrCase {
  attribute: string;
  value: string;
  property: string;
  expected: unknown;
  /** True when the documented attribute really is the one the component observes. */
  works: boolean;
}

const ATTRIBUTES: AttrCase[] = [
  { attribute: 'date', value: '2026-01-15', property: 'date', expected: '2026-01-15', works: true },
  { attribute: 'status', value: 'sent', property: 'status', expected: 'sent', works: true },
  { attribute: 'currency', value: '€', property: 'currency', expected: '€', works: true },
  { attribute: 'discount', value: '20', property: 'discount', expected: 20, works: true },
  { attribute: 'notes', value: 'Thanks', property: 'notes', expected: 'Thanks', works: true },
  { attribute: 'terms', value: 'Net 30', property: 'terms', expected: 'Net 30', works: true },
  { attribute: 'variant', value: 'creative', property: 'variant', expected: 'creative', works: true },
  { attribute: 'qr-data', value: 'https://e/1', property: 'qrData', expected: 'https://e/1', works: true },
  { attribute: 'qr-position', value: 'footer', property: 'qrPosition', expected: 'footer', works: true },
  { attribute: 'estimate-number', value: 'EST-001', property: 'estimateNumber', expected: 'EST-001', works: true },
  { attribute: 'expiry-date', value: '2026-02-15', property: 'expiryDate', expected: '2026-02-15', works: true },
  // Documented `taxRate: number` (MATRIX-estimate-1, fixed): the converter runs.
  { attribute: 'tax-rate', value: '10', property: 'taxRate', expected: 10, works: true },
];

describe('estimate matrix: every documented attribute reaches its property', () => {
  for (const item of ATTRIBUTES) {
    const title = `${item.attribute}="${item.value}" -> ${item.property}`
      + (item.works ? '' : ' [MATRIX-estimate-1]');
    const run = async () => {
      const el = await mount<any>(TAG, { [item.attribute]: item.value });
      expect(el[item.property], `${item.attribute} -> ${item.property}`)
        .toEqual(item.expected);
    };
    if (item.works) it(title, run); else it.fails(title, run);
  }

  it('toJSON() reports the documented numeric taxRate [MATRIX-estimate-1 (fixed)]', async () => {
    const el = await mount<any>(TAG, { 'tax-rate': '10' }, { items: REQUIRED_LINES });
    expect(typeof el.toJSON().taxRate, 'toJSON().taxRate type').toBe('number');
  });

  it('the attribute-set tax rate still prints the documented tax row', async () => {
    // Scoping MATRIX-estimate-1 (fixed): the rate used to arrive as a string
    // that survived arithmetic by coercion. This case stays so a future change
    // that alters the rendered figure cannot hide behind the type guard above.
    const el = await mount<HTMLElement>(TAG, { 'tax-rate': '10', currency: '$' },
      { items: REQUIRED_LINES });
    const problems = new Problems();
    problems.equal(readSummary(el), expectedSummary(REQUIRED_LINES, 0, 10, '$'),
      'summary with an attribute-set tax rate');
    expectClean(problems, 'tax-rate="10"');
  });

  it('show-qr renders the documented QR block', async () => {
    const el = await mount<HTMLElement>(TAG, { 'show-qr': true, 'qr-position': 'footer' },
      { items: REQUIRED_LINES });
    expect(part(el, 'qr-container'), 'part="qr-container" for show-qr').not.toBeNull();
  });
});

describe('estimate matrix: the properties the docs mark "JS only"', () => {
  for (const property of ['from', 'to', 'items']) {
    it(`${property} has no attribute form`, async () => {
      const el = await mount<any>(TAG, {});
      expect(el.getAttribute(property), `${property} reflected to an attribute`).toBeNull();
    });
  }
});

// ── The three documented events ─────────────────────────────────────────────

describe('estimate matrix: estimate-accept', () => {
  const combos = cross({
    lines: ['required', 'excluded', 'defaulted'] as const,
    taxRate: [0, 10] as const,
    discount: [0, 20] as const,
  });

  for (const combo of combos) {
    it(combo.id, async () => {
      const items = LINE_SETS[combo.lines];
      const el = await mount<any>(TAG, { status: 'sent' }, {
        estimateNumber: 'EST-001', taxRate: combo.taxRate, discount: combo.discount, items,
      });
      const seen = captureEvents<any>(el, 'estimate-accept');
      click(part(el, 'accept-button'));
      await wait(30);

      const problems = new Problems();
      problems.equal(seen.length, 1, 'event count');
      const detail = seen[0] ?? {};
      problems.equal(detail.estimateNumber, 'EST-001', 'detail.estimateNumber');
      // "items" is what is being accepted: the included lines.
      problems.equal(detail.items?.length, includedItems(items).length, 'detail.items length');
      problems.equal(detail.total, expectedTotal(items, combo.discount, combo.taxRate),
        'detail.total');
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('estimate matrix: estimate-decline', () => {
  for (const status of ['draft', 'sent'] as const) {
    it(`status=${status}`, async () => {
      const el = await mount<any>(TAG, { status }, {
        estimateNumber: 'EST-009', items: REQUIRED_LINES,
      });
      const seen = captureEvents<any>(el, 'estimate-decline');
      click(part(el, 'decline-button'));
      await wait(30);
      expect(seen.map(d => d.estimateNumber), `estimate-decline for status=${status}`)
        .toEqual(['EST-009']);
      removeComponent(el);
    });
  }
});

describe('estimate matrix: item-toggle', () => {
  const combos = cross({ startIncluded: [true, false], lines: [1, 2] as const });

  for (const combo of combos) {
    it(combo.id, async () => {
      const items = [
        { description: 'Brand Identity', quantity: 1, unitPrice: 5000 },
        {
          description: 'SEO Audit', quantity: 1, unitPrice: 1500,
          optional: true, included: combo.startIncluded,
        },
      ].slice(0, combo.lines === 1 ? 2 : 2);
      const el = await mount<any>(TAG, {}, { items });
      const seen = captureEvents<any>(el, 'item-toggle');
      click(part(el, 'item-toggle'));
      await wait(30);

      const problems = new Problems();
      problems.equal(seen.length, 1, 'event count');
      problems.equal(seen[0]?.index, 1, 'detail.index');
      problems.equal(seen[0]?.included, !combo.startIncluded, 'detail.included');
      problems.equal(seen[0]?.item?.included, !combo.startIncluded, 'detail.item.included');
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }

  it('the comparison variant accepts one option at a time', async () => {
    const el = await mount<any>(TAG, { variant: 'comparison' }, {
      estimateNumber: 'EST-002', items: REQUIRED_LINES,
    });
    const seen = captureEvents<any>(el, 'estimate-accept');
    const buttons = parts(el, 'option-button');
    expect(buttons.length, 'one button per option').toBe(REQUIRED_LINES.length);
    click(buttons[1]);
    await wait(30);
    expect(seen.length, 'estimate-accept count').toBe(1);
    expect(seen[0].items.map((i: any) => i.description), 'the accepted option')
      .toEqual([REQUIRED_LINES[1].description]);
    expect(seen[0].total, 'the option total')
      .toBe(REQUIRED_LINES[1].quantity * REQUIRED_LINES[1].unitPrice);
  });
});

describe('estimate matrix: excluded lines never reach an acceptance', () => {
  it('estimate-accept carries only the included lines', async () => {
    const el = await mount<any>(TAG, { status: 'sent' }, {
      estimateNumber: 'EST-003', items: EXCLUDED_LINES,
    });
    const seen = captureEvents<any>(el, 'estimate-accept');
    click(part(el, 'accept-button'));
    await wait(30);
    expect(seen[0].items.map((i: any) => i.description)).toEqual(['Brand Identity']);
  });
});
