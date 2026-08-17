/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-invoice matrix — document structure
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The doc's CSS-part list is a contract: a consumer styles `::part(total)` and
 * `::part(party-name)`, so which parts exist for a given property vector is
 * public API. This slice crosses variant x status x parties x notes x QR and
 * asserts the tree the docs describe.
 *
 * ── What this tier deliberately does NOT judge ──────────────────────────────
 *
 * `docs/ai/components/invoice.md` says, in Notes: "`detailed` variant shows
 * line numbers and per-item tax". The component honours that with CSS
 * (`:host(:not([variant="detailed"])) .invoice__col-line { display: none }`)
 * rather than with conditional markup, and happy-dom runs no cascade: every
 * variant's tree carries the same nodes here, and asking this tier which of
 * them are SHOWN would be asking a question the environment cannot answer.
 * That sentence is asserted in both directions — shown under `detailed`,
 * absent everywhere else — in tests/live/matrix/invoice/invoice-visual.spec.ts,
 * against cells that really have boxes. What this file owns is the markup
 * contract: the documented headings, one row per item, and the columns those
 * rows fill.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, cross, Problems, expectClean, text, removeComponent } from '../matrix-kit';
import { exactPart as part, exactParts as parts } from '../part-exact';
import {
  VARIANTS, STATUSES, QR_POSITIONS, DERIVED_LINES, TAXED_LINES, FROM, TO,
  expectedColumnCount, expectedColumnHeadings, expectedDescriptionCell,
  readBodyRows, readHeadings, checkAlwaysParts, checkNoUndocumentedParts,
} from './invoice-support';

const TAG = 'snice-invoice';
await import('../../../packages/components/src/invoice/snice-invoice');

afterEach(() => { document.body.innerHTML = ''; });

// ── variant x lines: the table's shape ──────────────────────────────────────

describe('invoice matrix: the line-item table', () => {
  const combos = cross({ variant: VARIANTS, lines: ['none', 'two'] as const });

  for (const combo of combos) {
    it(combo.id, async () => {
      const items = combo.lines === 'two' ? DERIVED_LINES : [];
      const el = await mount<HTMLElement>(TAG, { variant: combo.variant }, { items });
      const problems = new Problems();

      // "the line-item table" only exists once there are lines to put in it.
      const table = part(el, 'table');
      problems.check(!!table === (items.length > 0),
        `part="table" ${table ? 'present' : 'absent'} for ${items.length} items`);

      if (items.length > 0) {
        problems.equal(readHeadings(el), expectedColumnHeadings(combo.variant),
          'column headings');
        problems.equal(parts(el, 'table-row').length, items.length, 'body row count');
      }
      checkAlwaysParts(el, problems);
      checkNoUndocumentedParts(el, problems);
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('invoice matrix: the detailed variant carries its extra column', () => {
  for (const variant of VARIANTS) {
    it(`variant=${variant}`, async () => {
      const el = await mount<HTMLElement>(TAG, { variant }, { items: DERIVED_LINES });
      const problems = new Problems();

      // The HEADER is conditional markup, so this tier owns it outright.
      problems.equal(readHeadings(el).length, expectedColumnCount(variant),
        'header column count');

      // Every body row is built the same way, whatever the variant: the
      // documented values fill the last four cells, and the line-number cell
      // the `detailed` variant reveals rides in front of them.
      const rows = readBodyRows(el);
      const widths = new Set(rows.map(cells => cells.length));
      problems.check(widths.size === 1, `body rows disagree on their width: ${[...widths]}`);
      for (const [i, cells] of rows.entries()) {
        problems.check(cells.length >= expectedColumnCount(variant),
          `row ${i} has ${cells.length} cells, fewer than the ${expectedColumnCount(variant)}`
            + ' documented columns');
      }
      expectClean(problems, `variant=${variant}`);
      removeComponent(el);
    });
  }
});

describe('invoice matrix: the line-number cell numbers its line', () => {
  it('the detailed variant numbers every row from one', async () => {
    const el = await mount<HTMLElement>(TAG, { variant: 'detailed' }, { items: DERIVED_LINES });
    const numbers = readBodyRows(el).map(cells => cells[0]);
    expect(numbers, 'line numbers').toEqual(DERIVED_LINES.map((_, i) => String(i + 1)));
  });

  it('the detailed variant prints per-item tax beside the description', async () => {
    const el = await mount<HTMLElement>(TAG, { variant: 'detailed' }, { items: TAXED_LINES });
    const rows = readBodyRows(el);
    const problems = new Problems();
    TAXED_LINES.forEach((item, i) => {
      const cells = rows[i] ?? [];
      problems.equal(cells[cells.length - 4], expectedDescriptionCell(item, 'detailed'),
        `line ${i} description cell`);
    });
    expectClean(problems, 'detailed/per-item tax');
  });
});

// ── status: the badge the docs promise ──────────────────────────────────────

describe('invoice matrix: status', () => {
  const combos = cross({ status: STATUSES, variant: ['standard', 'modern', 'ticket'] as const });

  for (const combo of combos) {
    it(combo.id, async () => {
      const el = await mount<HTMLElement>(TAG, {
        status: combo.status, variant: combo.variant,
      });
      const problems = new Problems();
      const badge = part(el, 'status');
      problems.check(!!badge, 'part="status" is missing');
      // The default slot content of `status` is the status itself.
      problems.equal(text(badge), combo.status, 'status text');
      problems.check(
        (badge?.getAttribute('class') ?? '').includes(`invoice__status--${combo.status}`),
        `status node carries no per-status class (${badge?.getAttribute('class')})`);
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

// ── parties, notes: present exactly when their data is ──────────────────────

describe('invoice matrix: parties and notes appear with their data', () => {
  const combos = cross({
    from: ['named', 'empty'] as const,
    to: ['named', 'empty'] as const,
    notes: ['set', 'empty'] as const,
  });

  for (const combo of combos) {
    it(combo.id, async () => {
      const from = combo.from === 'named' ? FROM : { name: '' };
      const to = combo.to === 'named' ? TO : { name: '' };
      const notes = combo.notes === 'set' ? 'Payment due in 30 days.' : '';
      const el = await mount<HTMLElement>(TAG, { notes }, { from, to });
      const problems = new Problems();

      const hasParties = combo.from === 'named' || combo.to === 'named';
      problems.check(!!part(el, 'parties') === hasParties,
        `part="parties" ${part(el, 'parties') ? 'present' : 'absent'} for from=${combo.from} to=${combo.to}`);

      const partyBlocks = parts(el, 'party');
      const expectedBlocks = (combo.from === 'named' ? 1 : 0) + (combo.to === 'named' ? 1 : 0);
      problems.equal(partyBlocks.length, expectedBlocks, 'party blocks');

      if (combo.from === 'named') {
        const labels = parts(el, 'party-label').map(node => text(node));
        problems.check(labels.includes('From'), `no "From" party label (${labels})`);
      }
      if (combo.to === 'named') {
        const labels = parts(el, 'party-label').map(node => text(node));
        problems.check(labels.includes('Bill To'), `no "Bill To" party label (${labels})`);
      }

      problems.check(!!part(el, 'notes') === (combo.notes === 'set'),
        `part="notes" for notes=${combo.notes}`);
      if (combo.notes === 'set') {
        problems.equal(text(part(el, 'notes-label')), 'Notes', 'notes label');
        problems.equal(text(part(el, 'notes-content')), notes, 'notes content');
      }
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

// ── QR: shown when show-qr is set, positioned as documented ─────────────────

describe('invoice matrix: the QR block', () => {
  const combos = cross({ showQr: [false, true], position: QR_POSITIONS });

  for (const combo of combos) {
    it(combo.id, async () => {
      const el = await mount<HTMLElement>(TAG, {
        ...(combo.showQr ? { 'show-qr': true } : {}),
        'qr-position': combo.position,
        'qr-data': 'https://example.com/inv/1',
      }, { items: DERIVED_LINES });
      const problems = new Problems();

      const container = part(el, 'qr-container');
      problems.check(!!container === combo.showQr,
        `part="qr-container" ${container ? 'present' : 'absent'} for show-qr=${combo.showQr}`);
      if (combo.showQr) {
        problems.check(!!part(el, 'qr'), 'part="qr" is missing inside the container');
        problems.check(
          (container?.getAttribute('class') ?? '').includes(`invoice__qr--${combo.position}`),
          `QR container carries no position class for ${combo.position}`
            + ` (${container?.getAttribute('class')})`);
      }
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('invoice matrix: the print method the docs promise', () => {
  it('print() calls window.print()', async () => {
    const el = await mount<any>(TAG, {});
    const original = window.print;
    let called = 0;
    (window as any).print = () => { called++; };
    try {
      el.print();
    } finally {
      (window as any).print = original;
    }
    expect(called, 'window.print() was not called').toBe(1);
  });
});
