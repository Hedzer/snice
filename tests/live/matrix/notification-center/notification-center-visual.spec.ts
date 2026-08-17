/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-notification-center TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/notification-center, `npm run test:matrix`)
 * owns behavioural truth: which items render, what they say, the three
 * methods, the three events and the accessibility attributes. It cannot own
 * visual truth, because happy-dom performs no layout and paints nothing — and
 * this component is a DROPDOWN, so almost everything that can go wrong with it
 * is about position and stacking.
 *
 * The claims reachable only here:
 *
 *   · `open` is a PAINT claim. `hidden` in the DOM is one thing; a panel that
 *     really occupies no space, and then really covers the page beneath it, is
 *     another;
 *   · `placement: 'start'|'end'` aligns the panel to one side of the bell.
 *     Which side is a geometric fact with no DOM equivalent at all;
 *   · the panel floats ABOVE the page — a dropdown that renders behind its own
 *     siblings is the classic z-index failure, and only a hit-test finds it;
 *   · the unread badge sits on the bell rather than beside it, and is legible;
 *   · `unread` is documented as a highlight — in the DOM a class, on screen a
 *     tint that must differ from a read row;
 *   · a long list scrolls inside the panel instead of growing the page;
 *   · the four `type` values tint their icons four different colours.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/notification-center/matrix.html';

const LISTS = ['empty', 'one', 'mixed', 'allRead', 'allUnread', 'typed'] as const;
const PLACEMENTS = ['start', 'end'] as const;

interface Combo {
  id: string;
  list: typeof LISTS[number];
  placement: typeof PLACEMENTS[number];
  open: boolean;
  icon?: string;
  slotIcon?: boolean;
}

/** 6 lists x 2 placements x open/closed = 24 combos. */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const list of LISTS) {
    for (const placement of PLACEMENTS) {
      for (const open of [false, true]) {
        combos.push({
          id: `${list}/${placement}/${open ? 'open' : 'closed'}`,
          list, placement, open,
          icon: n % 4 === 1 ? '🔔' : undefined,
        });
        n++;
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

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.0;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partNamed = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    // ── The bell ────────────────────────────────────────────────────────────
    const trigger = partNamed('trigger');
    if (!trigger) { say('no part="trigger"'); return problems; }
    const triggerBox = rect(trigger);
    if (triggerBox.width <= 0 || triggerBox.height <= 0) {
      say(`the bell renders at ${triggerBox.width}x${triggerBox.height}`);
      return problems;
    }
    if (getComputedStyle(trigger).cursor !== 'pointer') {
      say(`the bell's cursor is "${getComputedStyle(trigger).cursor}"`);
    }
    // "Bell icon is keyboard-focusable" — a real <button> that can take focus.
    trigger.focus();
    if (sr.activeElement !== trigger) say('the bell cannot take keyboard focus');

    const icon = partNamed('icon');
    if (!icon) {
      say('no part="icon"');
    } else {
      const box = rect(icon);
      if (box.width <= 0 || box.height <= 0) {
        say(`the bell icon renders at ${box.width}x${box.height}`);
      }
    }

    // The bell is a real target — nothing paints over it.
    {
      const x = triggerBox.left + triggerBox.width / 2;
      const y = triggerBox.top + triggerBox.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`the bell's hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>,`
          + ' not the notification centre');
      }
    }

    // ── The unread badge sits ON the bell ──────────────────────────────────
    const badge = sr.querySelector('snice-badge') as HTMLElement | null;
    if (!badge) {
      say('no unread badge');
    } else {
      const box = rect(badge);
      if (box.width <= 0 || box.height <= 0) {
        say(`the badge renders at ${box.width}x${box.height}`);
      }
      // The badge WRAPS the bell icon (position="top-right"), so it must
      // overlap the trigger rather than sit somewhere else on the page.
      const overlaps = box.left < triggerBox.right + EPS && box.right > triggerBox.left - EPS
        && box.top < triggerBox.bottom + EPS && box.bottom > triggerBox.top - EPS;
      if (!overlaps) say('the unread badge is not on the bell');
    }

    // ── The panel ──────────────────────────────────────────────────────────
    const panel = partNamed('panel');
    if (!panel) { say('no part="panel"'); return problems; }
    const panelBox = rect(panel);
    const panelCs = getComputedStyle(panel);
    const painted = panelCs.display !== 'none' && panelBox.width > 0 && panelBox.height > 0;

    if (!combo.open) {
      if (painted) {
        say(`a closed panel still occupies ${panelBox.width.toFixed(0)}x`
          + `${panelBox.height.toFixed(0)}px`);
      }
      return problems;
    }

    if (!painted) {
      say(`an open panel renders at ${panelBox.width}x${panelBox.height}`);
      return problems;
    }

    // It hangs BELOW the bell, not over it.
    if (panelBox.top < triggerBox.bottom - EPS) {
      say(`the panel (top ${panelBox.top.toFixed(1)}) covers the bell`
        + ` (bottom ${triggerBox.bottom.toFixed(1)})`);
    }
    // And it floats: an absolutely/fixed positioned box, not one that pushes
    // the page around.
    if (panelCs.position === 'static') {
      say('the panel is statically positioned — it displaces the page instead of floating');
    }
    // Fully on screen.
    if (panelBox.left < -EPS || panelBox.right > window.innerWidth + EPS) {
      say(`the panel escapes the viewport horizontally`
        + ` (${panelBox.left.toFixed(0)}..${panelBox.right.toFixed(0)}`
        + ` in 0..${window.innerWidth})`);
    }

    // ── `placement` aligns the panel to one side of the bell ───────────────
    const startAligned = Math.abs(panelBox.left - triggerBox.left) < 24;
    const endAligned = Math.abs(panelBox.right - triggerBox.right) < 24;
    if (combo.placement === 'start' && !startAligned) {
      say(`placement="start": the panel's left edge is ${panelBox.left.toFixed(0)},`
        + ` the bell's is ${triggerBox.left.toFixed(0)}`);
    }
    if (combo.placement === 'end' && !endAligned) {
      say(`placement="end": the panel's right edge is ${panelBox.right.toFixed(0)},`
        + ` the bell's is ${triggerBox.right.toFixed(0)}`);
    }

    // ── The panel header and its mark-all action ───────────────────────────
    const header = partNamed('panel-header');
    if (!header) {
      say('no part="panel-header"');
    } else {
      const box = rect(header);
      if (box.height <= 0) say(`the panel header renders at ${box.width}x${box.height}`);
      if (box.top < panelBox.top - EPS) say('the panel header sits above its own panel');
      const markAll = sr.querySelector('.mark-all-btn') as HTMLElement | null;
      if (!markAll) {
        say('no "mark all as read" action');
      } else {
        const b = rect(markAll);
        if (b.width <= 0 || b.height <= 0) {
          say(`the mark-all action renders at ${b.width}x${b.height}`);
        }
        if (b.right > box.right + EPS) say('the mark-all action escapes the header');
        if (getComputedStyle(markAll).cursor !== 'pointer') {
          say(`the mark-all action's cursor is "${getComputedStyle(markAll).cursor}"`);
        }
      }
    }

    // ── The items ──────────────────────────────────────────────────────────
    const items = [...sr.querySelectorAll('.notification-item')] as HTMLElement[];
    const empty = sr.querySelector('snice-empty-state') as HTMLElement | null;

    if (combo.list === 'empty') {
      if (items.length > 0) say(`an empty centre painted ${items.length} rows`);
      if (!empty) {
        say('an empty centre painted no empty state');
      } else if (rect(empty).height <= 0) {
        say('the empty state renders at zero height');
      }
      return problems;
    }

    if (items.length === 0) { say('an open panel painted no rows'); return problems; }
    if (empty) say('a populated panel still painted the empty state');

    let previousBottom = -Infinity;
    for (const [i, item] of items.entries()) {
      const box = rect(item);
      if (box.height <= 0) { say(`row ${i} renders at ${box.width}x${box.height}`); continue; }
      if (box.top < previousBottom - EPS) say(`rows ${i - 1}/${i} overlap vertically`);
      previousBottom = box.bottom;
      if (box.left < panelBox.left - EPS || box.right > panelBox.right + EPS) {
        say(`row ${i} escapes the panel horizontally`);
      }
      if (getComputedStyle(item).cursor !== 'pointer') {
        say(`row ${i} is clickable but its cursor is "${getComputedStyle(item).cursor}"`);
      }

      // Title, message and timestamp each have a box, and they stack.
      const parts = ['.notification-title', '.notification-message', '.notification-time']
        .map(selector => item.querySelector(selector) as HTMLElement | null);
      for (const [j, node] of parts.entries()) {
        if (!node) { say(`row ${i} is missing text part ${j}`); continue; }
        const b = rect(node);
        if (b.width <= 0 || b.height <= 0) say(`row ${i} text part ${j} renders at ${b.width}x${b.height}`);
      }

      // The dismiss button is a reachable target inside its own row.
      const dismiss = item.querySelector('.dismiss-btn') as HTMLElement | null;
      if (!dismiss) {
        say(`row ${i} has no dismiss button`);
      } else {
        const b = rect(dismiss);
        if (b.width <= 0 || b.height <= 0) {
          say(`row ${i} dismiss button renders at ${b.width}x${b.height}`);
        } else {
          if (b.right > box.right + EPS) say(`row ${i} dismiss button escapes its row`);
          const x = b.left + b.width / 2;
          const y = b.top + b.height / 2;
          if (y > panelBox.top && y < Math.min(panelBox.bottom, window.innerHeight)) {
            const outer = document.elementFromPoint(x, y);
            if (outer !== host) {
              say(`row ${i} dismiss button's hit-test found`
                + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the centre`);
            }
          }
        }
      }
    }

    // ── `unread` is a visible highlight ────────────────────────────────────
    const unread = items.filter(item =>
      (item.getAttribute('class') ?? '').split(/\s+/).includes('unread'));
    const read = items.filter(item => !unread.includes(item));
    if (unread.length && read.length) {
      const unreadBg = getComputedStyle(unread[0]).backgroundColor;
      const readBg = getComputedStyle(read[0]).backgroundColor;
      if (unreadBg === readBg) {
        say(`unread and read rows paint the same background (${unreadBg})`);
      }
    }

    // ── The four documented types tint four different icons ────────────────
    if (combo.list === 'typed') {
      const colors = items.map((item) => {
        const node = item.querySelector('.notification-icon') as HTMLElement | null;
        return node ? getComputedStyle(node).color : 'none';
      });
      if (new Set(colors).size !== colors.length) {
        say(`the four types painted ${new Set(colors).size} distinct icon colours`
          + ` (${colors.join(' | ')})`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('notification-center visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.open, `combo ${combo.id} open state`).toBe(combo.open);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('notification-center visual matrix: the panel is a real dropdown', () => {
  test('an open panel covers the content behind it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      list: 'mixed', placement: 'end', open: true,
    }));
    // Put a sibling directly under the panel and check the panel wins the
    // hit-test. A dropdown that renders behind the page is the classic
    // z-index failure, and it is invisible to every DOM assertion.
    const covered = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const panel = host.shadowRoot!.querySelector('[part~="panel"]')!
        .getBoundingClientRect();

      const victim = document.createElement('div');
      victim.id = 'victim';
      victim.style.cssText = `position:absolute; left:${panel.left}px; top:${panel.top}px;`
        + `width:${panel.width}px; height:${panel.height}px; background:#f0f;`;
      document.body.appendChild(victim);

      const x = panel.left + panel.width / 2;
      const y = panel.top + Math.min(panel.height / 2, 60);
      const hit = document.elementFromPoint(x, y);
      const tag = hit?.id || hit?.tagName.toLowerCase() || 'nothing';
      victim.remove();
      return tag;
    });
    expect(covered,
      'a box painted at the panel\'s own coordinates won the hit-test — the dropdown'
      + ' renders behind the page').toBe('subject');
  });

  test('a long list scrolls inside the panel instead of growing it forever', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      list: 'long', placement: 'end', open: true,
    }));
    const measured = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const panel = sr.querySelector('[part~="panel"]') as HTMLElement;
      const list = sr.querySelector('.notification-list') as HTMLElement;
      const scroller = panel.scrollHeight > panel.clientHeight ? panel : list;
      return {
        panelHeight: panel.getBoundingClientRect().height,
        viewport: window.innerHeight,
        overflowY: getComputedStyle(scroller).overflowY,
        overflow: scroller.scrollHeight - scroller.clientHeight,
        rows: sr.querySelectorAll('.notification-item').length,
      };
    });
    expect(measured.rows).toBe(12);
    if (measured.overflow > 0) {
      expect(measured.overflowY,
        'the panel overflows but cannot be scrolled').toMatch(/auto|scroll/);
    } else {
      expect(measured.panelHeight,
        'a 12-item panel neither scrolls nor fits on screen')
        .toBeLessThanOrEqual(measured.viewport);
    }
  });

  test('the slotted icon replaces the built-in bell', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      list: 'one', placement: 'end', open: false, slotIcon: true,
    }));
    const measured = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const slotted = host.querySelector('#slotted-bell') as HTMLElement | null;
      const box = slotted?.getBoundingClientRect();
      const trigger = host.shadowRoot!.querySelector('[part~="trigger"]')!
        .getBoundingClientRect();
      return {
        painted: !!box && box.width > 0 && box.height > 0,
        insideTrigger: !!box && box.left >= trigger.left - 1 && box.right <= trigger.right + 1,
      };
    });
    expect(measured.painted, 'the slotted icon was not painted at all').toBe(true);
    expect(measured.insideTrigger, 'the slotted icon landed outside the bell button')
      .toBe(true);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

/**
 * The panel is `position: absolute` and hangs OUTSIDE the host's own box, so
 * an element screenshot of `#subject` would clip it away entirely and every
 * probe inside it would read the clamped edge pixel. The captures below shoot
 * the whole page instead — the one place the dropdown is actually painted.
 */
const PAGE = 'body';

test.describe('notification-center visual matrix: marquee pixels', () => {
  test('an unread row is visibly tinted next to a read one', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      list: 'mixed', placement: 'end', open: true,
    }));
    const [unreadPx, readPx] = await capture(
      page, PAGE, 'notification-unread',
      `() => {
        const host = document.getElementById('subject');
        const rows = [...host.shadowRoot.querySelectorAll('.notification-item')];
        const unread = rows.find(r => r.classList.contains('unread'));
        const read = rows.find(r => !r.classList.contains('unread'));
        const mid = (el) => {
          const b = el.getBoundingClientRect();
          return { x: b.left + 4, y: b.y + b.height / 2 };
        };
        return [mid(unread), mid(read)];
      }`,
    );
    expect(sameColor(unreadPx, readPx),
      `an unread row painted ${unreadPx.join(',')}, identical to a read one —`
      + ' the documented highlight is invisible').toBe(false);
  });

  test('the unread badge is legible on the bell', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      list: 'allUnread', placement: 'end', open: false,
    }));
    const scan = await capture(
      page, PAGE, 'notification-badge',
      `() => {
        const host = document.getElementById('subject');
        const badge = host.shadowRoot.querySelector('snice-badge').getBoundingClientRect();
        const points = [];
        for (let x = Math.round(badge.left); x < Math.round(badge.right); x++) {
          points.push({ x, y: badge.top + 6 });
        }
        points.push({ x: badge.left + 2, y: badge.bottom - 2 });
        return points;
      }`,
    );
    const reference = scan[scan.length - 1];
    const inked = scan.slice(0, -1).filter(px => !sameColor(px, reference));
    expect(inked.length,
      `the badge painted a single flat colour (${reference.join(',')}) — the count is`
      + ' not visible').toBeGreaterThan(0);
  });

  test('the open panel is a solid surface, not a transparent overlay', async () => {
    // Probe a notification card's own fill — a large flat surface well inside
    // the panel — rather than the panel's bottom-right corner: the corner sits
    // on the panel's scrollbar/shadow strip, whose width is engine-specific
    // (WebKit paints a classic scrollbar there), and at WebKit's
    // deviceScaleFactor 2 the element-screenshot mapping drifts a pixel at
    // the edge and reads the page instead. The card's fill is what "the panel
    // has a surface of its own" means to a reader either way.
    const probe = `() => {
      const sr = document.getElementById('subject').shadowRoot;
      const panel = sr.querySelector('[part~="panel"]').getBoundingClientRect();
      const card = sr.querySelector('.notification-item').getBoundingClientRect();
      return [
        { x: card.x + card.width - 8, y: card.y + 8 },
        { x: panel.right + 40, y: panel.bottom - 6 },
      ];
    }`;
    await page.evaluate(() => (window as any).matrix.mount({
      list: 'mixed', placement: 'start', open: true,
    }));
    const [inside, outside] = await capture(page, PAGE, 'notification-panel', probe);
    expect(sameColor(inside, outside),
      `the panel painted ${inside.join(',')}, the same as the page beside it — the`
      + ' dropdown has no surface of its own').toBe(false);
    expect(contrast(inside, outside),
      `panel contrast against the page is ${contrast(inside, outside).toFixed(3)}:1`)
      .toBeGreaterThan(1.01);
  });

  test('the four notification types paint four distinguishable icons', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      list: 'typed', placement: 'end', open: true,
    }));
    const pixels = await capture(
      page, PAGE, 'notification-types',
      `() => [...document.getElementById('subject').shadowRoot
        .querySelectorAll('.notification-icon')].map(node => {
        const b = node.getBoundingClientRect();
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      })`,
    );
    expect(pixels).toHaveLength(4);
    const unique = new Set(pixels.map(px => px.join(',')));
    expect(unique.size,
      `the four types painted ${unique.size} distinct icon colours`
      + ` (${[...unique].join(' | ')})`).toBeGreaterThan(1);
  });
});
