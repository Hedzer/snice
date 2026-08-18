/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-work-order TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/work-order) owns the four cost accessors and
 * the three events. What it cannot own is the sheet a technician works from:
 * whether a task's checkbox is a box big enough to hit, whether a COMPLETED
 * task looks completed, whether the parts table's columns stay disjoint once a
 * part name is long, and whether the priority badge can be told apart from the
 * status badge sitting next to it.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · header, tasks, parts, labor, costs and signature stack without overlap;
 *   · every task row puts a hit-testable checkbox left of its description;
 *   · a completed task is painted differently from an incomplete one;
 *   · parts-table cells are horizontally disjoint and ascending;
 *   · the grand total is the heaviest line in the costs block, and unoccluded;
 *   · the two signature lines have real width and do not collide.
 *
 * ── Layer 2: pinned pixel captures ─────────────────────────────────────────
 *   the four priority badges must paint four distinguishable colours — the
 *   docs give each one its own `--wo-priority-*` custom properties, and a
 *   sheet where "urgent" looks like "low" is the failure that matters here.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/work-order/matrix.html';

const CUSTOMER = { name: 'Acme Corp', address: '123 Main St', phone: '555-1234' };
const ASSET = {
  id: 'HVAC-301', name: 'Rooftop Unit', location: '3rd Floor', serial: 'SN-2019-4521',
};
const TASKS = [
  { description: 'Remove old unit', assignee: 'John', completed: true, hours: 2 },
  { description: 'Install new rooftop condenser unit and recharge', assignee: 'Jane', completed: false, hours: 4 },
];
const PARTS = [
  { name: 'Air Filter', partNumber: 'AF-100', quantity: 2, unitCost: 25.5 },
  { name: 'Compressor assembly, high capacity', partNumber: 'CP-200', quantity: 1, unitCost: 450 },
];

interface Combo {
  id: string;
  variant: string;
  priority: string;
  status: string;
  tasks: typeof TASKS;
  parts: typeof PARTS;
  laborRate: number;
  customer?: typeof CUSTOMER | null;
  asset?: typeof ASSET | null;
  description?: string;
  notes?: string;
  showQr?: boolean;
  qrPosition?: string;
}

/**
 * variant (9) x data shape (2) = 18 combos. Every documented variant is in the
 * cross because each one restyles the sheet, and the data axis is "a job with
 * everything on it" against "a job with only tasks", which is what makes a
 * region disappear and its neighbours close the gap.
 */
function generateCombos(): Combo[] {
  const variants = [
    'standard', 'compact', 'field-service', 'maintenance', 'detailed',
    'paper', 'ink', 'ledger', 'ticket',
  ];
  const combos: Combo[] = [];
  for (const variant of variants) {
    combos.push({
      id: `${variant}/full`,
      variant, priority: 'high', status: 'in-progress',
      tasks: TASKS, parts: PARTS, laborRate: 75,
      customer: CUSTOMER, asset: ASSET,
      description: 'Replace HVAC system on 3rd floor',
      notes: 'Access via the service lift.',
    });
    combos.push({
      id: `${variant}/tasks-only`,
      variant, priority: 'low', status: 'open',
      tasks: TASKS, parts: [], laborRate: 0,
      customer: null, asset: null,
    });
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

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
    const tokens = (el: Element) => (el.getAttribute('part') ?? '').split(/\s+/);
    const exact = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(el => tokens(el).includes(name)) as HTMLElement[];
    const first = (name: string) => exact(name)[0] ?? null;

    // ── The sheet's regions stack ───────────────────────────────────────────
    const wanted = ['header', 'tasks', 'parts', 'labor', 'signature']
      .filter(name => {
        if (name === 'parts') return combo.parts.length > 0;
        if (name === 'labor') return combo.laborRate > 0;
        return true;
      });
    let previousBottom = -Infinity;
    let previousName = '';
    for (const name of wanted) {
      const node = first(name);
      if (!node) { say(`part="${name}" is missing`); continue; }
      const box = rect(node);
      if (box.width <= 0 || box.height <= 0) {
        say(`part="${name}" renders at ${box.width}x${box.height}`);
        continue;
      }
      if (box.top < previousBottom - 1) {
        say(`part="${name}" (top ${box.top.toFixed(1)}) overlaps part="${previousName}"`);
      }
      previousBottom = box.bottom;
      previousName = name;
    }

    // ── The two badges are separate, painted boxes ──────────────────────────
    const priority = first('priority');
    const status = first('status');
    if (!priority || !status) {
      say('a header badge is missing');
    } else {
      for (const [name, node] of [['priority', priority], ['status', status]] as const) {
        const box = rect(node);
        if (box.width <= 0 || box.height <= 0) say(`the ${name} badge is ${box.width}x${box.height}`);
      }
      const a = rect(priority);
      const b = rect(status);
      const overlaps = a.right > b.left + EPS && b.right > a.left + EPS
        && a.bottom > b.top + EPS && b.bottom > a.top + EPS;
      if (overlaps) say('the priority and status badges overlap');
    }

    // ── Tasks: a hit-testable box, left of the description ──────────────────
    const taskRows = exact('task');
    if (taskRows.length !== combo.tasks.length) {
      say(`${taskRows.length} task rows for ${combo.tasks.length} tasks`);
    }
    const completedStyles: string[] = [];
    for (const [i, row] of taskRows.entries()) {
      const box = row.querySelector('[part~="task-checkbox"]') as HTMLElement | null;
      const description = row.querySelector('[part~="task-description"]') as HTMLElement | null;
      if (!box || !description) { say(`task ${i} is missing a checkbox or a description`); continue; }
      const boxRect = rect(box);
      const textRect = rect(description);
      if (boxRect.width < 12 || boxRect.height < 12) {
        say(`task ${i}: the checkbox is ${boxRect.width.toFixed(1)}x${boxRect.height.toFixed(1)},`
          + ' too small to hit');
      }
      if (textRect.left < boxRect.right - EPS) {
        say(`task ${i}: the description (left ${textRect.left.toFixed(1)}) runs under the`
          + ` checkbox (right ${boxRect.right.toFixed(1)})`);
      }
      const hit = (sr as any).elementFromPoint(
        boxRect.left + boxRect.width / 2, boxRect.top + boxRect.height / 2) as Element | null;
      if (hit !== box && !box.contains(hit as Node)) {
        say(`task ${i}: the checkbox is not the element under its own centre`);
      }
      const style = getComputedStyle(description);
      completedStyles.push(`${style.color}|${style.textDecorationLine}|${getComputedStyle(row).opacity}`);
    }
    // The fixture's task set has one completed task and one not.
    if (completedStyles.length === 2 && completedStyles[0] === completedStyles[1]) {
      say(`a completed task paints exactly like an open one (${completedStyles[0]})`);
    }

    // ── Parts table: cells ascend and stay disjoint ─────────────────────────
    for (const [r, row] of exact('parts-row').entries()) {
      let previousRight = -Infinity;
      for (const [c, cell] of ([...row.querySelectorAll('td')] as HTMLElement[]).entries()) {
        const box = rect(cell);
        if (box.left < previousRight - EPS) {
          say(`parts row ${r} cell ${c} runs into the cell before it`);
        }
        previousRight = box.right;
      }
    }

    // ── The grand total is the loudest line, and unobstructed ───────────────
    const grand = first('grand-total');
    const costs = first('costs');
    if (combo.parts.length || combo.laborRate > 0) {
      if (!grand || !costs) {
        say('a priced work order rendered no grand total');
      } else {
        // "Loudest" is not "boldest": the ink and paper variants set the grand
        // total in a light 36px face, which is far louder than the 400-weight
        // 14px lines above it. So the claim is prominence — at least as large
        // as every line above it, and painted differently from all of them.
        const face = (node: HTMLElement) => {
          const style = getComputedStyle(node);
          return {
            size: parseFloat(style.fontSize),
            weight: Number(style.fontWeight),
            color: style.color,
            key: `${style.fontSize}/${style.fontWeight}/${style.color}`,
          };
        };
        const grandFace = face(grand);
        const others = ([...costs.querySelectorAll('.wo__cost-row')] as HTMLElement[])
          .filter(row => !row.contains(grand))
          .map(row => face(row.querySelectorAll('span')[1] as HTMLElement));
        if (!others.every(other => grandFace.size >= other.size)) {
          say(`the grand total is set at ${grandFace.size}px, smaller than a line above it`
            + ` (${others.map(o => o.size)})`);
        }
        if (others.some(other => other.key === grandFace.key)) {
          say(`the grand total paints exactly like a line above it (${grandFace.key})`);
        }
        const box = rect(grand);
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        const outer = document.elementFromPoint(x, y);
        if (outer !== host) {
          say(`grand total: page hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>`);
        } else {
          const hit = (sr as any).elementFromPoint(x, y) as Element | null;
          if (hit !== grand && !grand.contains(hit as Node)) {
            say(`the grand total is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
          }
        }
      }
    }

    // ── The signature lines are lines someone can sign on ───────────────────
    const line = first('signature-line');
    const dateLine = first('signature-date');
    if (!line || !dateLine) {
      say('a signature line is missing');
    } else {
      for (const [name, node] of [['signature-line', line], ['signature-date', dateLine]] as const) {
        const box = rect(node);
        if (box.width < 40) say(`part="${name}" is only ${box.width.toFixed(1)}px wide`);
      }
      const a = rect(line);
      const b = rect(dateLine);
      if (a.right > b.left + EPS && b.top < a.bottom - EPS && a.top < b.bottom - EPS) {
        say('the two signature lines overlap');
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('work-order visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.tasks, 'task rows').toBe(combo.tasks.length);
      expect(mounted.parts, 'parts rows').toBe(combo.parts.length);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('work-order visual matrix: the QR corners', () => {
  for (const position of ['top-right', 'header', 'footer']) {
    test(`qr-position=${position}`, async () => {
      await page.evaluate(pos => (window as any).matrix.mount({
        variant: 'standard', priority: 'high', status: 'open',
        tasks: [{ description: 'Inspect', hours: 1 }], parts: [], laborRate: 0,
        showQr: true, qrPosition: pos,
      }), position);

      const box = await page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const qr = sr.querySelector('[part~="qr-container"]') as HTMLElement | null;
        if (!qr) return null;
        const rect = qr.getBoundingClientRect();
        const hostRect = document.getElementById('subject')!.getBoundingClientRect();
        const footer = sr.querySelector('[part~="footer"]') as HTMLElement;
        return {
          width: rect.width, height: rect.height,
          centreX: rect.left + rect.width / 2,
          hostMidX: hostRect.left + hostRect.width / 2,
          inFooter: footer ? footer.contains(qr) : false,
        };
      });

      expect(box, `show-qr with qr-position=${position} rendered no QR block`).not.toBeNull();
      expect(box!.width, 'the QR block has width').toBeGreaterThan(0);
      if (position === 'top-right') {
        expect(box!.centreX, 'top-right lands in the right half')
          .toBeGreaterThan(box!.hostMidX);
      }
      if (position === 'footer') {
        expect(box!.inFooter, 'qr-position=footer puts the block in the footer').toBe(true);
      }
    });
  }
});

test.describe('work-order visual matrix: toggling a task', () => {
  test('an open task takes on the completed painting when it is ticked', async () => {
    await page.evaluate(tasks => (window as any).matrix.mount({
      variant: 'standard', priority: 'high', status: 'in-progress',
      tasks, parts: [], laborRate: 0,
    }), TASKS as any);

    // The checkbox's own fill is deliberately NOT read: it animates, so the
    // colour a probe catches depends on when the probe ran. The description's
    // painting is the stable statement of "this task is done".
    const read = (index: number) => page.evaluate((i) => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const row = sr.querySelectorAll('.wo__task')[i] as HTMLElement;
      const description = row.querySelector('[part~="task-description"]') as HTMLElement;
      const style = getComputedStyle(description);
      return {
        color: style.color,
        decoration: style.textDecorationLine,
        opacity: getComputedStyle(row).opacity,
      };
    }, index);

    const completed = await read(0);
    const before = await read(1);
    expect(await page.evaluate(() => (window as any).matrix.toggleTask(1)),
      'the open task offers a checkbox').toBe(true);
    const after = await read(1);

    expect(JSON.stringify(after), 'the ticked task must repaint')
      .not.toBe(JSON.stringify(before));
    expect(JSON.stringify(after), 'the ticked task must look like the already-completed one')
      .toBe(JSON.stringify(completed));
  });
});

// ── MATRIX-work-order-1 (fixed) and -2, as a page author meets them ─────────
//
// The doc's Basic Usage is a single block of markup:
//
//   labor-rate="75"  -> (fixed) `laborRate` now declares
//                       `attribute: 'labor-rate'`, so the rate arrives as the
//                       documented number and the sheet prices six hours of
//                       work at $450.
//   show-qr          -> `showQr` is still declared with a bare
//                       `@property({ type: Boolean })` (observed: `showqr`),
//                       so no QR block is painted however `qr-position` is set.
//                       MATRIX-work-order-2 remains pinned.
//
// The DOM matrix cannot see the second one — happy-dom hands
// `attributeChangedCallback` every attribute change whether or not the element
// observed it (see tests/matrix/work-order/work-order-interaction.test.ts).

test.describe('work-order visual matrix: the documented markup', () => {
  test('labor-rate="75" prices six hours of work [MATRIX-work-order-1 (fixed)]', async () => {
    const authored = await page.evaluate(() => (window as any).matrix.mountAuthored());
    expect(authored.laborRate, 'labor-rate -> laborRate').toBe(75);
    expect(authored.totalLaborCost, 'getTotalLaborCost() for 6h at $75').toBe(450);
    expect(authored.ratePainted, 'the rate line is painted').toBe(true);
    expect(authored.rateText, 'the rendered rate').toBe('$75.00/hr');
  });

  test('show-qr paints the QR block [MATRIX-work-order-2]', async () => {
    test.fail();
    const authored = await page.evaluate(() => (window as any).matrix.mountAuthored());
    expect(authored.showQr, 'show-qr -> showQr').toBe(true);
    expect(authored.qrPainted, 'the QR block is painted').toBe(true);
  });
});

// ── LAYER 2: pinned pixel captures ──────────────────────────────────────────

test.describe('work-order visual matrix: marquee pixels', () => {
  test('the four priorities paint four different badges', async () => {
    const painted: Record<string, [number, number, number]> = {};
    for (const priority of ['low', 'medium', 'high', 'urgent']) {
      await page.evaluate(p => (window as any).matrix.mount({
        variant: 'standard', priority: p, status: 'open',
        tasks: [{ description: 'Inspect', hours: 1 }], parts: [], laborRate: 0,
      }), priority);
      const [badge] = await capture(
        page, '#subject', `work-order-priority-${priority}`,
        `(host) => {
          const node = host.shadowRoot.querySelector('[part~="priority"]');
          const box = node.getBoundingClientRect();
          return [{ x: box.x + 4, y: box.y + box.height / 2 }];
        }`,
      );
      painted[priority] = badge;
    }

    const pairs: Array<[string, string]> = [
      ['low', 'medium'], ['low', 'high'], ['low', 'urgent'],
      ['medium', 'high'], ['medium', 'urgent'], ['high', 'urgent'],
    ];
    const collisions = pairs.filter(([a, b]) => sameColor(painted[a], painted[b]))
      .map(([a, b]) => `${a} and ${b} both paint ${painted[a].join(',')}`);
    expect(collisions, 'each documented priority has its own badge colour').toEqual([]);
  });
});
