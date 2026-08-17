/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-estimate matrix — document structure
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The doc's CSS-part list is the contract this file crosses: which of
 * `header`/`parties`/`table`/`comparison`/`summary`/`notes`/`terms`/`actions`/
 * `qr-container` exist for a given property vector, and what the header says.
 *
 * The `comparison` variant is the interesting axis — the docs give it its own
 * parts (`comparison`, `option`, `option-button`), so it is a different
 * document rather than a differently painted one, and every other section has
 * to be judged with it in the cross.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, cross, Problems, expectClean, text, removeComponent } from '../matrix-kit';
import { exactPart as part, exactParts as parts } from '../part-exact';
import {
  VARIANTS, STATUSES, QR_POSITIONS, REQUIRED_LINES, FROM, TO,
  checkNoUndocumentedParts,
} from './estimate-support';

const TAG = 'snice-estimate';
await import('../../../packages/components/src/estimate/snice-estimate');

afterEach(() => { document.body.innerHTML = ''; });

describe('estimate matrix: the header', () => {
  const combos = cross({ status: STATUSES, expiry: ['set', 'unset'] as const });

  for (const combo of combos) {
    it(combo.id, async () => {
      const el = await mount<HTMLElement>(TAG, { status: combo.status }, {
        estimateNumber: 'EST-001',
        date: '2026-01-15',
        expiryDate: combo.expiry === 'set' ? '2026-02-15' : '',
      });
      const problems = new Problems();

      problems.check(!!part(el, 'header'), 'part="header" is missing');
      // "Estimate #<number>" — the doc's own example numbers the document.
      problems.equal(text(part(el, 'title')), 'Estimate #EST-001', 'title');
      problems.equal(text(part(el, 'status')), combo.status, 'status badge text');
      problems.equal(text(part(el, 'meta')), '2026-01-15', 'meta (date)');

      const expiry = part(el, 'expiry');
      problems.check(!!expiry === (combo.expiry === 'set'),
        `part="expiry" ${expiry ? 'present' : 'absent'} for expiry=${combo.expiry}`);
      if (combo.expiry === 'set') {
        problems.equal(text(part(el, 'expiry-date')), '2026-02-15', 'expiry date');
        problems.check(text(expiry).startsWith('Valid until'),
          `expiry reads "${text(expiry)}"`);
      }
      checkNoUndocumentedParts(el, problems);
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('estimate matrix: variant decides which document is rendered', () => {
  const combos = cross({ variant: VARIANTS, lines: ['none', 'two'] as const });

  for (const combo of combos) {
    it(combo.id, async () => {
      const items = combo.lines === 'two' ? REQUIRED_LINES : [];
      const el = await mount<HTMLElement>(TAG, { variant: combo.variant }, { items });
      const problems = new Problems();
      const isComparison = combo.variant === 'comparison';

      // The comparison variant renders option cards; every other variant
      // renders the line-item table and the summary block.
      problems.check(!!part(el, 'comparison') === isComparison,
        `part="comparison" ${part(el, 'comparison') ? 'present' : 'absent'}`
          + ` for variant=${combo.variant}`);
      if (isComparison) {
        problems.equal(parts(el, 'option').length, items.length, 'option cards');
        problems.equal(parts(el, 'option-button').length, items.length, 'option buttons');
        problems.check(!part(el, 'table'), 'the comparison variant still renders a table');
        problems.check(!part(el, 'summary'),
          'the comparison variant still renders a summary block');
      } else {
        problems.check(!!part(el, 'table') === (items.length > 0),
          `part="table" for ${items.length} items`);
        problems.check(!!part(el, 'summary'), 'part="summary" is missing');
        problems.equal(parts(el, 'table-row').length, items.length, 'table rows');
      }
      checkNoUndocumentedParts(el, problems);
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('estimate matrix: parties, notes and terms follow their data', () => {
  const combos = cross({
    parties: ['both', 'from', 'to', 'none'] as const,
    notes: ['set', 'empty'] as const,
    terms: ['set', 'empty'] as const,
  });

  for (const combo of combos) {
    it(combo.id, async () => {
      const from = combo.parties === 'both' || combo.parties === 'from' ? FROM : null;
      const to = combo.parties === 'both' || combo.parties === 'to' ? TO : null;
      const el = await mount<HTMLElement>(TAG, {
        notes: combo.notes === 'set' ? 'Prices held for 30 days.' : '',
        terms: combo.terms === 'set' ? 'Payment on acceptance.' : '',
      }, { from, to, items: REQUIRED_LINES });
      const problems = new Problems();

      const hasParties = !!from || !!to;
      problems.check(!!part(el, 'parties') === hasParties,
        `part="parties" for parties=${combo.parties}`);
      problems.equal(parts(el, 'party').length, (from ? 1 : 0) + (to ? 1 : 0),
        'party blocks');
      const labels = parts(el, 'party-label').map(node => text(node));
      if (from) problems.check(labels.includes('From'), `no "From" label (${labels})`);
      if (to) problems.check(labels.includes('To'), `no "To" label (${labels})`);
      if (from) {
        const names = parts(el, 'party-name').map(node => text(node));
        problems.check(names.includes(FROM.name), `no party-name for ${FROM.name}`);
      }

      problems.check(!!part(el, 'notes') === (combo.notes === 'set'),
        `part="notes" for notes=${combo.notes}`);
      if (combo.notes === 'set') {
        problems.equal(text(part(el, 'notes-label')), 'Notes', 'notes label');
        problems.equal(text(part(el, 'notes-content')), 'Prices held for 30 days.',
          'notes content');
      }
      problems.check(!!part(el, 'terms') === (combo.terms === 'set'),
        `part="terms" for terms=${combo.terms}`);
      checkNoUndocumentedParts(el, problems);
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('estimate matrix: the QR block', () => {
  const combos = cross({ showQr: [false, true], position: QR_POSITIONS });

  for (const combo of combos) {
    it(combo.id, async () => {
      const el = await mount<HTMLElement>(TAG, {
        ...(combo.showQr ? { 'show-qr': true } : {}),
        'qr-position': combo.position,
        'qr-data': 'https://example.com/est/1',
      }, { items: REQUIRED_LINES });
      const problems = new Problems();

      const container = part(el, 'qr-container');
      problems.check(!!container === combo.showQr,
        `part="qr-container" ${container ? 'present' : 'absent'} for show-qr=${combo.showQr}`);
      if (combo.showQr) {
        problems.check(
          (container?.getAttribute('class') ?? '').includes(`est__qr--${combo.position}`),
          `no position class for qr-position=${combo.position}`
            + ` (${container?.getAttribute('class')})`);
        problems.check(!!part(el, 'qr'), 'part="qr" is missing');
      }
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('estimate matrix: print()', () => {
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
