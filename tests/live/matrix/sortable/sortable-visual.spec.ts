/**
 * snice-sortable TRUE-VISUAL matrix.
 *
 * The DOM matrix (`tests/matrix/sortable/`, 32 combos) owns which part exists,
 * which events a gesture emits with which detail, and which side of a target an
 * insertion lands on. It cannot own anything below, because happy-dom performs
 * no layout and does not reflect the `draggable` IDL attribute:
 *
 *   · `direction` is a FLEX AXIS. In happy-dom `vertical` and `horizontal` are
 *     the same string on a host and the same 0x0 boxes; only a real engine
 *     stacks the items down the page or across it.
 *   · "auto set `draggable`" is a claim about the attribute a browser reflects
 *     from the IDL property the component assigns. happy-dom sets only the
 *     property, so the DOM tier has to shim it — here it is measured.
 *   · `disabled` is documented as a state, and its whole rendered meaning is a
 *     computed style: `pointer-events: none` plus a dimmed host. A hit test is
 *     the browser's own answer to "could the user grab this".
 *   · `.sortable-dragging` and `.sortable-ghost` are documented as classes
 *     "during drag", and both carry ::slotted rules in the stylesheet. Whether
 *     the rules actually PAINT is a computed-style question.
 *
 * LAYER 1 — geometry / occlusion / computed style over the 8 combos of
 *   {2 directions} x {2 handle modes} x {2 disabled states}.
 * LAYER 2 — one pinned screenshot: the dragged item really dims to the 0.4
 *   opacity the stylesheet promises.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  openChartStage, mount, collectChartProblems, type ChartProbe,
} from '../chart-visual-support';
import { capture } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/sortable/matrix.html';

const DIRECTIONS = ['vertical', 'horizontal'] as const;
const HANDLES = ['', '.grip'] as const;

/**
 * The sortable's "marks" are its projected items, and they live in the LIGHT
 * DOM where the shared shadow-root probe cannot reach them. What the shared
 * probe can judge is the container itself — it must have a real, visible box in
 * every combo — and the per-combo test below adds the item geometry by hand.
 */
const PROBE: ChartProbe = {
  surface: '.sortable',
  marks: '[part~="base"]',
  marks_expected: 1,
  boxes: ['[part~="base"]'],
};

/**
 * Can a pointer reach the items? `document.elementFromPoint` at each item's
 * centre, plus the host's painted opacity — together, the entire rendered
 * meaning of the documented `disabled` switch.
 */
async function probeGrabbability(page: Page): Promise<{ hits: number; count: number; opacity: string }> {
  return page.evaluate(() => {
    const host = document.getElementById('subject')!;
    const items = [...host.children] as HTMLElement[];
    let hits = 0;
    for (const item of items) {
      const b = item.getBoundingClientRect();
      const found = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      if (found === item || item.contains(found)) hits++;
    }
    return { hits, count: items.length, opacity: getComputedStyle(host).opacity };
  });
}

/** The items' boxes, read from the light DOM where they are projected. */
function itemBoxes(page: Page) {
  return page.evaluate(() => [...document.getElementById('subject')!.children].map((item) => {
    const b = item.getBoundingClientRect();
    return {
      id: item.id, left: b.left, top: b.top, right: b.right, bottom: b.bottom,
      width: b.width, height: b.height,
    };
  }));
}

test.describe('snice-sortable visual matrix (layer 1)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const direction of DIRECTIONS) {
    for (const handle of HANDLES) {
      for (const disabled of [false, true]) {
        const id = `${direction}/${handle ? 'handle' : 'whole-item'}/${disabled ? 'disabled' : 'enabled'}`;
        test(id, async () => {
          await mount(page, { direction, handle, disabled });
          expect(await collectChartProblems(page, PROBE), id).toEqual([]);

          // Every projected item must have a real box and sit inside the
          // container. A sortable whose items escaped their own flex box is a
          // sortable nobody can aim at.
          const problems = await page.evaluate(() => {
            const out: string[] = [];
            const host = document.getElementById('subject')!;
            const base = host.shadowRoot!.querySelector('[part~="base"]')!.getBoundingClientRect();
            [...host.children].forEach((item, i) => {
              const b = item.getBoundingClientRect();
              if (b.width <= 0 || b.height <= 0) out.push(`item ${i} renders at ${b.width}x${b.height}`);
              if (b.left < base.left - 1.5 || b.right > base.right + 1.5
                || b.top < base.top - 1.5 || b.bottom > base.bottom + 1.5) {
                out.push(`item ${i} escapes part="base"`);
              }
            });
            return out;
          });
          expect(problems, id).toEqual([]);
        });
      }
    }
  }

  test('direction lays the items out on the axis it names', async () => {
    // `direction: 'vertical'|'horizontal' = 'vertical'`. This is the whole
    // meaning of the property and it is pure layout: in happy-dom both values
    // produce identical (empty) geometry.
    const problems: string[] = [];
    for (const direction of DIRECTIONS) {
      await mount(page, { direction });
      const boxes = await itemBoxes(page);
      for (let i = 1; i < boxes.length; i++) {
        const prev = boxes[i - 1];
        const cur = boxes[i];
        if (direction === 'vertical') {
          if (!(cur.top >= prev.bottom - 1.5)) {
            problems.push(`vertical: item ${i} (top ${cur.top}) does not follow item ${i - 1} (bottom ${prev.bottom})`);
          }
          if (Math.abs(cur.left - prev.left) > 1.5) {
            problems.push(`vertical: item ${i} is not left-aligned with item ${i - 1}`);
          }
        } else {
          if (!(cur.left >= prev.right - 1.5)) {
            problems.push(`horizontal: item ${i} (left ${cur.left}) does not follow item ${i - 1} (right ${prev.right})`);
          }
          if (Math.abs(cur.top - prev.top) > 1.5) {
            problems.push(`horizontal: item ${i} is not top-aligned with item ${i - 1}`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  test('every projected item really carries draggable="true"', async () => {
    // doc, Slots: "(default) — Items to be sortable (auto set `draggable`)".
    // A browser reflects the IDL assignment to the content attribute; that
    // attribute is what makes the native drag gesture start at all, and it is
    // exactly what happy-dom cannot show.
    for (const handle of HANDLES) {
      await mount(page, { handle });
      const attrs = await page.evaluate(() => [...document.getElementById('subject')!.children]
        .map(item => item.getAttribute('draggable')));
      expect(attrs, handle ? 'handle mode' : 'whole-item mode')
        .toEqual(['true', 'true', 'true', 'true']);
    }
  });

  test('disabled really takes the items out of the pointer\'s reach', async () => {
    // `disabled: boolean = false`. The stylesheet answers it with
    // `pointer-events: none` and a dimmed host — both invisible to the DOM
    // tier, and together they are the whole user-facing meaning of the switch.
    await mount(page, { disabled: false });
    const enabled = await probeGrabbability(page);
    await mount(page, { disabled: true });
    const disabled = await probeGrabbability(page);

    expect(enabled.hits, 'an enabled sortable does not hit-test to its own items')
      .toBe(enabled.count);
    expect(disabled.hits, 'a disabled sortable still hit-tests to its items').toBe(0);
    expect(Number(disabled.opacity), 'a disabled sortable is painted at full strength')
      .toBeLessThan(Number(enabled.opacity));
  });

  test('a drag in progress dims exactly the dragged item', async () => {
    // doc, Accessibility: "`.sortable-dragging` … during drag", and the
    // stylesheet answers with `::slotted(.sortable-dragging) { opacity: 0.4 }`.
    // A ::slotted rule that fails to match paints nothing and breaks nothing —
    // only a computed style catches it.
    await mount(page, { direction: 'vertical' });
    await page.evaluate(() => (window as any).matrix.beginDrag(0));
    const during = await page.evaluate(() => [...document.getElementById('subject')!.children]
      .map(item => getComputedStyle(item).opacity));
    await page.evaluate(() => (window as any).matrix.endDrag());
    const after = await page.evaluate(() => [...document.getElementById('subject')!.children]
      .map(item => getComputedStyle(item).opacity));

    expect(Number(during[0]), 'the dragged item is not dimmed').toBeLessThan(1);
    expect(during.slice(1).map(Number), 'an untouched item was dimmed too')
      .toEqual([1, 1, 1]);
    expect(after.map(Number), 'the dim survived the end of the drag').toEqual([1, 1, 1, 1]);
  });

  /**
   * MATRIX-sortable-1 (fixed) — the documented `.sortable-ghost` class.
   *
   * `docs/ai/components/sortable.md`, Accessibility: "Ghost placeholder with
   * dashed outline" / "`.sortable-dragging` / `.sortable-ghost` classes during
   * drag". The stylesheet ships the rule — `::slotted(.sortable-ghost)` with
   * `outline: 2px dashed var(--snice-color-primary)` — and the dragged
   * element now carries the class for the length of the drag, so the
   * documented ghost placeholder paints.
   */
  test('MATRIX-sortable-1 (fixed): a drag in progress paints the documented dashed ghost', async () => {
    await mount(page, { direction: 'vertical' });
    await page.evaluate(() => (window as any).matrix.beginDrag(0));
    const outlines = await page.evaluate(() => [...document.getElementById('subject')!.children]
      .map((item) => {
        const cs = getComputedStyle(item);
        return `${cs.outlineStyle} ${cs.outlineWidth}`;
      }));
    await page.evaluate(() => (window as any).matrix.endDrag());
    expect(outlines.some(o => o.startsWith('dashed')),
      'no item carries the documented dashed ghost outline during a drag').toBe(true);
  });
});

// ── LAYER 2: real pixels, one pinned combo ──────────────────────────────────

test.describe('snice-sortable visual matrix (layer 2: painted pixels)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  test('the dragged item really paints translucent over the stage', async () => {
    // A computed `opacity: 0.4` still leaves the question a screenshot answers:
    // does the item actually blend with what is behind it? The fixture stage is
    // magenta, a colour the component never paints, so a translucent item
    // measurably picks up its red and blue channels.
    await mount(page, { direction: 'vertical' });

    const CENTRES = `(host) => { const b = host.children[0].getBoundingClientRect();
      return [{ x: b.left + b.width / 2, y: b.top + b.height / 2 }]; }`;

    const [opaque] = await capture(page, '#subject', 'sortable-item-idle', CENTRES);
    await page.evaluate(() => (window as any).matrix.beginDrag(0));
    const [dragging] = await capture(page, '#subject', 'sortable-item-dragging', CENTRES);
    await page.evaluate(() => (window as any).matrix.endDrag());

    // Blended against magenta (#ff00ff), a translucent item loses green and
    // gains red+blue relative to its opaque self.
    expect(dragging[1], 'the dragged item did not blend with the stage behind it')
      .toBeLessThan(opaque[1]);
    expect(dragging[0] + dragging[2], 'the dragged item picked up no magenta at all')
      .toBeGreaterThan(opaque[0] + opaque[2] - 2);
  });
});
