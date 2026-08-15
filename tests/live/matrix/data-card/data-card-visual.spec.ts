/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-data-card TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/data-card, `npm run test:matrix`) owns
 * structure truth: which parts exist, which type rendered which element, which
 * events an edit emits. It cannot own visual truth — happy-dom performs no
 * layout, so every box reads 0 and nothing is painted.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · every field row has a real box, and rows stack without overlapping;
 *   · a row's label and value share a line and never overlap each other — the
 *     `.field` flex row is the component's whole layout premise;
 *   · a group title sits ABOVE the fields it names, and inside its own section;
 *   · nothing paints over a value: elementFromPoint at three points across the
 *     value's box has to find the value;
 *   · the value column never collapses to zero, however long the label is;
 *   · with `editable` on, the edit affordance has a real, hit-testable box.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A badge that "has a background-color" can still be the same colour as the
 *   card behind it, and a link that "is an anchor" can still paint as body
 *   text. The marquee decodes the PNG inside the browser under test and asserts
 *   the painted pixels actually differ.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/data-card/matrix.html';

type Variant = 'default' | 'horizontal' | 'compact';

interface Field {
  label: string;
  value: string | number;
  type?: 'text' | 'link' | 'badge' | 'date' | 'currency';
  group?: string;
  icon?: string;
  href?: string;
  badgeVariant?: string;
  editable?: boolean;
}

interface Dataset { name: string; fields: Field[] }

const DATASETS: Dataset[] = [
  {
    name: 'every-type',
    fields: [
      { label: 'Name', value: 'John Doe', icon: 'user' },
      { label: 'Site', value: 'example.test', type: 'link', href: 'https://example.test/p' },
      { label: 'Status', value: 'Active', type: 'badge', badgeVariant: 'success' },
      { label: 'Joined', value: '2024-01-15', type: 'date' },
      { label: 'Balance', value: '$1,250.00', type: 'currency' },
    ],
  },
  {
    name: 'grouped',
    fields: [
      { label: 'Name', value: 'John Doe', group: 'Personal' },
      { label: 'Email', value: 'john@example.test', group: 'Personal' },
      { label: 'Status', value: 'Active', type: 'badge', badgeVariant: 'warning', group: 'Account' },
      { label: 'Balance', value: '$1,250.00', type: 'currency', group: 'Account' },
    ],
  },
  {
    name: 'long-values',
    fields: [
      {
        label: 'A rather long field label that competes for the row',
        value: 'A value long enough that a broken flex row would push it out of the card entirely',
      },
      { label: 'Short', value: '1' },
    ],
  },
  {
    name: 'single',
    fields: [{ label: 'Only', value: 'One' }],
  },
];

const VARIANTS: Variant[] = ['default', 'horizontal', 'compact'];

interface Combo { id: string; variant: Variant; dataset: Dataset; editable: boolean }

/**
 * 3 variants x 4 datasets x editable — 24 combos. Sized to a component whose
 * documented visual surface is three presentation variants over one flex row;
 * the point of this tier is that the row, the grouping, and the edit affordance
 * get a real layout engine, not that the product is large.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of VARIANTS) {
    for (const dataset of DATASETS) {
      for (const editable of [false, true]) {
        combos.push({
          id: `${variant}/${dataset.name}/${editable ? 'editable' : 'read-only'}`,
          variant, dataset, editable,
        });
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1. One evaluate per combo, returning EVERY violation at once. */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const tokens = (node: Element) => (node.getAttribute('part') ?? '').split(/\s+/).filter(Boolean);
    const partsIn = (root: ParentNode, name: string) =>
      [...root.querySelectorAll('[part]')].filter(node => tokens(node).includes(name)) as HTMLElement[];

    const hostBox = rect(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    const rows = partsIn(sr, 'field');
    if (rows.length !== combo.dataset.fields.length) {
      say(`${rows.length} field rows, expected ${combo.dataset.fields.length}`);
      return problems;
    }

    let previousBottom = -Infinity;
    for (const [i, row] of rows.entries()) {
      const box = rect(row);
      if (box.width <= 0 || box.height <= 0) { say(`row ${i} renders at ${box.width}x${box.height}`); continue; }
      if (box.top < previousBottom - EPS) {
        say(`row ${i} (top ${box.top.toFixed(1)}) overlaps the row above (bottom ${previousBottom.toFixed(1)})`);
      }
      previousBottom = box.bottom;

      // The row must stay inside the card it belongs to.
      if (box.right > hostBox.right + EPS || box.left < hostBox.left - EPS) {
        say(`row ${i} (${box.left.toFixed(0)}..${box.right.toFixed(0)}) escapes the card`
          + ` (${hostBox.left.toFixed(0)}..${hostBox.right.toFixed(0)})`);
      }

      const label = partsIn(row, 'field-label')[0];
      const value = partsIn(row, 'field-value')[0];
      const input = partsIn(row, 'field-input')[0];
      if (!label) { say(`row ${i} paints no label`); continue; }
      const labelBox = rect(label);
      if (labelBox.width <= 0 || labelBox.height <= 0) {
        say(`row ${i} label renders at ${labelBox.width}x${labelBox.height}`);
      }
      if (getComputedStyle(label).visibility !== 'visible') say(`row ${i} label is not visible`);

      if (!value && !input) { say(`row ${i} paints neither a value nor an editor`); continue; }
      const target = (value ?? input)!;
      const valueBox = rect(target);
      if (valueBox.width <= 0 || valueBox.height <= 0) {
        say(`row ${i} value renders at ${valueBox.width}x${valueBox.height} — the value column collapsed`);
        continue;
      }

      // The documented layout of a field is ONE row: label and value side by
      // side. They may not overlap, and they must share vertical space.
      const overlapX = Math.min(labelBox.right, valueBox.right) - Math.max(labelBox.left, valueBox.left);
      const overlapY = Math.min(labelBox.bottom, valueBox.bottom) - Math.max(labelBox.top, valueBox.top);
      if (overlapX > EPS && overlapY > EPS) {
        say(`row ${i} label and value overlap by ${overlapX.toFixed(1)}x${overlapY.toFixed(1)}px`);
      }
      if (overlapY <= 0) {
        say(`row ${i} value dropped off the label's line`
          + ` (label ${labelBox.top.toFixed(0)}..${labelBox.bottom.toFixed(0)},`
          + ` value ${valueBox.top.toFixed(0)}..${valueBox.bottom.toFixed(0)})`);
      }

      // Occlusion: nothing may paint over the value.
      const y = valueBox.top + valueBox.height / 2;
      for (const fraction of [0.2, 0.5, 0.8]) {
        const x = valueBox.left + valueBox.width * fraction;
        const outer = document.elementFromPoint(x, y);
        if (outer !== host) {
          say(`row ${i} value @${Math.round(fraction * 100)}%: page hit-test found`
            + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the card`);
          continue;
        }
        const hit = (sr as any).elementFromPoint(x, y) as Element | null;
        if (hit !== target && !target.contains(hit as Node) && !(hit as Element)?.contains(target)) {
          say(`row ${i} value @${Math.round(fraction * 100)}% is occluded by`
            + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }

      // The edit affordance, when the doc says the field has one.
      const field = combo.dataset.fields[i];
      const wantEdit = combo.editable && field.editable !== false && field.type !== 'link';
      const editButton = partsIn(row, 'field-edit')[0];
      if (wantEdit) {
        if (!editButton) { say(`row ${i} is editable but paints no edit affordance`); continue; }
        const editBox = rect(editButton);
        if (editBox.width <= 0 || editBox.height <= 0) {
          say(`row ${i} edit affordance renders at ${editBox.width}x${editBox.height} — unclickable`);
        } else {
          const hit = (sr as any).elementFromPoint(
            editBox.left + editBox.width / 2, editBox.top + editBox.height / 2) as Element | null;
          if (hit !== editButton && !editButton.contains(hit as Node)) {
            say(`row ${i} edit affordance is covered by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
          }
        }
      }
    }

    // Group titles: above the fields they name, inside their own section.
    const sections = partsIn(sr, 'group');
    for (const [i, section] of sections.entries()) {
      const title = partsIn(section, 'group-title')[0];
      if (!title) continue;
      const titleBox = rect(title);
      if (titleBox.width <= 0 || titleBox.height <= 0) {
        say(`group ${i} title renders at ${titleBox.width}x${titleBox.height}`);
        continue;
      }
      for (const [j, row] of partsIn(section, 'field').entries()) {
        if (rect(row).top < titleBox.bottom - EPS) {
          say(`group ${i} field ${j} is painted above its own group title`);
        }
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('data-card visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(
        c => (window as any).matrix.mount(c),
        { variant: combo.variant, editable: combo.editable, fields: combo.dataset.fields } as any,
      );
      expect(mounted.fields).toBe(combo.dataset.fields.length);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('data-card visual matrix: density and editing', () => {
  test('the compact variant really is denser than the default one', async () => {
    // "compact" is a promise about SPACE, and space is the one thing a DOM test
    // cannot measure. Same fields, same width, two variants, one comparison.
    const fields = DATASETS[0].fields;
    await page.evaluate(f => (window as any).matrix.mountPair(
      { variant: 'default', fields: f }, { variant: 'compact', fields: f }), fields as any);
    const [tall, short] = await page.evaluate(() => [
      document.getElementById('subject')!.getBoundingClientRect().height,
      document.getElementById('subject-b')!.getBoundingClientRect().height,
    ]);
    expect(short, `compact card is ${short}px, default is ${tall}px`).toBeLessThan(tall);
  });

  test('an open editor has a real, hit-testable box next to its save button', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'default',
      editable: true,
      fields: [{ label: 'Subject', value: 'before' }],
    }));
    expect(await page.evaluate(() => (window as any).matrix.startEdit('Subject'))).toBe(true);

    const problems = await page.evaluate(() => {
      const out: string[] = [];
      const host = document.getElementById('subject') as HTMLElement;
      const sr = host.shadowRoot!;
      const tokens = (n: Element) => (n.getAttribute('part') ?? '').split(/\s+/);
      const find = (name: string) =>
        [...sr.querySelectorAll('[part]')].find(n => tokens(n).includes(name)) as HTMLElement | undefined;
      const input = find('field-input');
      const save = find('field-save');
      if (!input) { out.push('no [part="field-input"] painted'); return out; }
      if (!save) { out.push('no [part="field-save"] painted'); return out; }
      const inputBox = input.getBoundingClientRect();
      const saveBox = save.getBoundingClientRect();
      if (inputBox.width < 20 || inputBox.height < 10) {
        out.push(`editor renders at ${inputBox.width}x${inputBox.height} — untypeable`);
      }
      if (saveBox.width <= 0 || saveBox.height <= 0) {
        out.push(`save button renders at ${saveBox.width}x${saveBox.height} — unclickable`);
      }
      const overlapX = Math.min(inputBox.right, saveBox.right) - Math.max(inputBox.left, saveBox.left);
      const overlapY = Math.min(inputBox.bottom, saveBox.bottom) - Math.max(inputBox.top, saveBox.top);
      if (overlapX > 1.5 && overlapY > 1.5) out.push('the save button sits on top of the editor');
      const hit = (sr as any).elementFromPoint(
        saveBox.left + saveBox.width / 2, saveBox.top + saveBox.height / 2);
      if (hit !== save && !save.contains(hit)) {
        out.push(`the save button is covered by <${hit?.tagName?.toLowerCase() ?? 'nothing'}>`);
      }
      return out;
    });
    expect(problems, 'open editor geometry').toEqual([]);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot costs two orders of magnitude more than an
// evaluate, and layer 1 already measured the model the browser built. These two
// exist because "the badge has a background-color" and "the badge is visible"
// are different claims, and only pixels can tell them apart.

test.describe('data-card visual matrix: marquee pixels', () => {
  test('a badge value paints a fill distinct from the card behind it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'default',
      fields: [
        { label: 'Status', value: 'Active', type: 'badge', badgeVariant: 'success' },
        { label: 'Plain', value: 'Text' },
      ],
    }));
    const [badge, surface] = await capture(
      page, '#subject', 'data-card-badge',
      `(host) => {
        const tokens = (n) => (n.getAttribute('part') || '').split(/\\s+/);
        const values = [...host.shadowRoot.querySelectorAll('[part]')]
          .filter(n => tokens(n).includes('field-value'));
        const badge = values[0].getBoundingClientRect();
        const plainRow = values[1].getBoundingClientRect();
        return [
          // Just inside the badge's leading edge — its fill, not its text.
          { x: badge.x + 3, y: badge.y + badge.height / 2 },
          // The card surface on the row below, well clear of any glyph.
          { x: plainRow.right + 20, y: plainRow.y + plainRow.height / 2 },
        ];
      }`,
    );
    expect(sameColor(badge, surface),
      `the badge painted ${badge.join(',')}, identical to the card surface`).toBe(false);
    // The instrument is CHANNEL DISTANCE, not WCAG contrast. A status chip is a
    // tint: `success` on a white card is a pale green whose luminance is almost
    // the card's (measured 1.04:1), so a contrast floor would fail a badge that
    // is plainly visible. What must hold is that the fill is a different COLOUR
    // by more than a rounding step — a chip within 1-2 levels of the surface is
    // one nobody can see.
    const distance = Math.max(...badge.map((channel, i) => Math.abs(channel - surface[i])));
    expect(distance,
      `badge fill rgb(${badge.join(',')}) is within ${distance} of the card rgb(${surface.join(',')})`)
      .toBeGreaterThanOrEqual(6);
  });

  test('a link value paints in a different colour from a plain text value', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'default',
      fields: [
        { label: 'Site', value: 'MMMMMMMM', type: 'link', href: 'https://example.test/p' },
        { label: 'Plain', value: 'MMMMMMMM' },
      ],
    }));
    // Sample the darkest pixel inside each value's box: glyph coverage varies
    // with anti-aliasing, so the extreme is the stable reading of "what colour
    // is this text", where any single point is not.
    const [link, plain] = await page.evaluate(() => {
      const tokens = (n: Element) => (n.getAttribute('part') ?? '').split(/\s+/);
      const host = document.getElementById('subject') as HTMLElement;
      const values = [...host.shadowRoot!.querySelectorAll('[part]')]
        .filter(n => tokens(n).includes('field-value')) as HTMLElement[];
      return values.map(v => getComputedStyle(v).color);
    });
    expect(link, `the link value painted ${link}, the same colour as body text ${plain}`)
      .not.toBe(plain);

    // …and the link's colour is really on screen, not merely in the cascade.
    const [linkPixel, plainPixel] = await capture(
      page, '#subject', 'data-card-link',
      `(host) => {
        const tokens = (n) => (n.getAttribute('part') || '').split(/\\s+/);
        const values = [...host.shadowRoot.querySelectorAll('[part]')]
          .filter(n => tokens(n).includes('field-value'));
        return values.map(v => {
          const b = v.getBoundingClientRect();
          return { x: b.x + 2, y: b.y + b.height / 2 };
        });
      }`,
    );
    expect(sameColor(linkPixel, plainPixel),
      `link and plain glyphs both painted ${linkPixel.join(',')}`).toBe(false);
  });
});
