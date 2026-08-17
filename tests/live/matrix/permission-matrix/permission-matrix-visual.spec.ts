/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-permission-matrix TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/permission-matrix) owns the grid's data: which
 * checkbox is checked, what `permission-toggle` carried, what `getMatrix()`
 * returns. This tier owns the grid as an administrator meets it — and for an
 * access-control table, being READ correctly is the whole job:
 *
 *   · every checkbox must sit under its own permission heading, because the
 *     cell a person ticks is chosen by eye and not by `data-perm`;
 *   · a checked box must look different from an unchecked one — the component
 *     draws its own tick with `::after`, which no DOM assertion can see;
 *   · the readonly check and dash indicators are pure paint: the docs say
 *     "Readonly mode shows check/dash indicators instead of checkboxes", and
 *     they are inline SVG with no text at all;
 *   · every box must be the element under its own centre, or the click lands
 *     on the wrong permission.
 *
 * ── Layer 2 ────────────────────────────────────────────────────────────────
 *   the granted and revoked states are captured as pixels and must differ.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/permission-matrix/matrix.html';

/** The roles and permissions from the doc's own example. */
const ROLES = [
  { id: 'admin', name: 'Admin', description: 'Full access' },
  { id: 'editor', name: 'Editor' },
  { id: 'viewer', name: 'Viewer' },
];
const PERMISSIONS = [
  { id: 'create', name: 'Create' },
  { id: 'read', name: 'Read', description: 'See everything' },
  { id: 'update', name: 'Update' },
  { id: 'delete', name: 'Delete' },
];
const MATRIX: Record<string, string[]> = {
  admin: ['create', 'read', 'update', 'delete'],
  editor: ['create', 'read', 'update'],
  viewer: ['read'],
};

interface Combo {
  id: string;
  roles: typeof ROLES;
  permissions: typeof PERMISSIONS;
  matrix: Record<string, string[]>;
  readonly: boolean;
}

/**
 * shape (4) x readonly (2) = 8 mounted combos. The shapes are the doc's own
 * example, a single role, a single permission, and an empty grid — the last is
 * the documented "No roles or permissions configured." state, which has no
 * table at all and therefore needs its own geometry rules.
 */
function generateCombos(): Combo[] {
  const shapes: Array<[string, typeof ROLES, typeof PERMISSIONS, Record<string, string[]>]> = [
    ['full', ROLES, PERMISSIONS, MATRIX],
    ['one-role', [ROLES[0]], PERMISSIONS, { admin: ['read'] }],
    ['one-permission', ROLES, [PERMISSIONS[1]], MATRIX],
    ['empty', [], [], {}],
  ];
  const combos: Combo[] = [];
  for (const [name, roles, permissions, matrix] of shapes) {
    for (const readonly of [false, true]) {
      combos.push({
        id: `${name}/${readonly ? 'readonly' : 'editable'}`,
        roles, permissions, matrix, readonly,
      });
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

    const base = sr.querySelector('[part="base"]') as HTMLElement | null;
    if (!base) { say('part="base" is missing'); return problems; }
    if (rect(base).width <= 0 || rect(base).height <= 0) {
      say(`part="base" is ${rect(base).width}x${rect(base).height}`);
    }

    const empty = combo.roles.length === 0 || combo.permissions.length === 0;
    const table = sr.querySelector('.matrix-table') as HTMLElement | null;
    if (empty) {
      // The documented empty state: a message, and no grid to misread.
      if (table) say('an unconfigured matrix still painted a table');
      const message = sr.querySelector('.matrix-empty') as HTMLElement | null;
      if (!message) { say('no empty-state message'); return problems; }
      if (message.getClientRects().length === 0) say('the empty-state message is not painted');
      return problems;
    }
    if (!table) { say('no table painted for a configured matrix'); return problems; }

    // ── One column per permission, plus the role column ────────────────────
    const headings = [...sr.querySelectorAll('thead th')] as HTMLElement[];
    if (headings.length !== combo.permissions.length + 1) {
      say(`${headings.length} headings for ${combo.permissions.length} permissions`);
    }
    const rows = [...sr.querySelectorAll('tbody tr')] as HTMLElement[];
    if (rows.length !== combo.roles.length) {
      say(`${rows.length} rows for ${combo.roles.length} roles`);
    }

    // ── Every control sits under its own permission heading ────────────────
    for (const [r, row] of rows.entries()) {
      const cells = [...row.querySelectorAll('td')] as HTMLElement[];
      if (cells.length !== combo.permissions.length + 1) {
        say(`row ${r} has ${cells.length} cells under ${headings.length} headings`);
        continue;
      }
      for (const [c, cell] of cells.entries()) {
        const head = rect(headings[c]);
        const box = rect(cell);
        const centre = box.left + box.width / 2;
        if (centre < head.left - EPS || centre > head.right + EPS) {
          say(`row ${r} cell ${c} is not under the "${headings[c].textContent?.trim()}" heading`);
        }
      }
      const control = row.querySelector('.matrix-checkbox, .matrix-readonly-indicator');
      if (!control) say(`row ${r} paints no permission control at all`);
    }

    // ── Editable: real, hit-testable checkboxes, checked ones distinguishable
    const boxes = [...sr.querySelectorAll('.matrix-checkbox')] as HTMLInputElement[];
    const indicators = [...sr.querySelectorAll('.matrix-readonly-indicator')] as HTMLElement[];
    if (combo.readonly) {
      if (boxes.length) say(`a readonly matrix painted ${boxes.length} checkboxes`);
      if (indicators.length !== combo.roles.length * combo.permissions.length) {
        say(`${indicators.length} readonly indicators for`
          + ` ${combo.roles.length * combo.permissions.length} cells`);
      }
      for (const [i, indicator] of indicators.entries()) {
        const svg = indicator.querySelector('svg');
        if (!svg) { say(`indicator ${i} draws nothing`); continue; }
        const box = rect(svg);
        if (box.width <= 0 || box.height <= 0) {
          say(`indicator ${i} is ${box.width}x${box.height}`);
        }
      }
      // Each cell draws the glyph its own data calls for: a check where the
      // role holds the permission, a dash where it does not.
      const expectedChecks = combo.roles.reduce((sum, role) =>
        sum + combo.permissions.filter(perm =>
          (combo.matrix[role.id] ?? []).includes(perm.id)).length, 0);
      const checks = indicators.filter(node => node.querySelector('.matrix-readonly-check'));
      const dashes = indicators.filter(node => node.querySelector('.matrix-readonly-dash'));
      if (checks.length !== expectedChecks) {
        say(`${checks.length} checks drawn for ${expectedChecks} granted permissions`);
      }
      if (dashes.length !== indicators.length - expectedChecks) {
        say(`${dashes.length} dashes drawn for`
          + ` ${indicators.length - expectedChecks} revoked permissions`);
      }
      return problems;
    }

    if (indicators.length) say(`an editable matrix painted ${indicators.length} indicators`);
    if (boxes.length !== combo.roles.length * combo.permissions.length) {
      say(`${boxes.length} checkboxes for`
        + ` ${combo.roles.length * combo.permissions.length} cells`);
    }
    for (const [i, box] of boxes.entries()) {
      const rectangle = rect(box);
      if (rectangle.width < 12 || rectangle.height < 12) {
        say(`checkbox ${i} is ${rectangle.width.toFixed(1)}x${rectangle.height.toFixed(1)},`
          + ' too small to hit');
      }
      const x = rectangle.left + rectangle.width / 2;
      const y = rectangle.top + rectangle.height / 2;
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) continue;
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (hit !== box) {
        say(`checkbox ${i} is not the element under its own centre`
          + ` (<${hit?.tagName.toLowerCase() ?? 'nothing'}>)`);
      }
    }

    const checked = boxes.find(box => box.checked);
    const unchecked = boxes.find(box => !box.checked);
    if (checked && unchecked) {
      const face = (box: HTMLInputElement) => {
        const style = getComputedStyle(box);
        return `${style.backgroundColor}|${style.borderColor}`;
      };
      if (face(checked) === face(unchecked)) {
        say(`a granted permission paints exactly like a revoked one (${face(checked)})`);
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('permission-matrix visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      const cells = combo.roles.length * combo.permissions.length;
      expect(combo.readonly ? mounted.indicators : mounted.checkboxes, 'permission controls')
        .toBe(cells);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('permission-matrix visual matrix: toggling a cell', () => {
  test('a clicked checkbox repaints and grants the permission', async () => {
    await page.evaluate(({ roles, permissions, matrix }) => (window as any).matrix.mount({
      roles, permissions, matrix, readonly: false,
    }), { roles: ROLES, permissions: PERMISSIONS, matrix: MATRIX });

    const before = await page.evaluate(() => {
      const box = document.getElementById('subject')!.shadowRoot!
        .querySelector('.matrix-checkbox[data-role="viewer"][data-perm="delete"]') as HTMLInputElement;
      const style = getComputedStyle(box);
      return { checked: box.checked, face: `${style.backgroundColor}|${style.borderColor}` };
    });
    expect(before.checked, 'viewer/delete starts revoked').toBe(false);

    const result = await page.evaluate(() => (window as any).matrix.toggle('viewer', 'delete'));
    expect(result, 'the cell exists').not.toBeNull();
    expect(result.checked, 'the box is ticked').toBe(true);
    expect(result.granted, 'hasPermission() agrees with the paint').toBe(true);

    const after = await page.evaluate(() => {
      const box = document.getElementById('subject')!.shadowRoot!
        .querySelector('.matrix-checkbox[data-role="viewer"][data-perm="delete"]') as HTMLInputElement;
      const style = getComputedStyle(box);
      return `${style.backgroundColor}|${style.borderColor}`;
    });
    expect(after, 'a granted box must not paint like a revoked one').not.toBe(before.face);
  });
});

// ── LAYER 2: pinned pixel captures ──────────────────────────────────────────

test.describe('permission-matrix visual matrix: marquee pixels', () => {
  test('granted and revoked are different pixels, in both modes', async () => {
    await page.evaluate(({ roles, permissions, matrix }) => (window as any).matrix.mount({
      roles, permissions, matrix, readonly: false,
    }), { roles: ROLES, permissions: PERMISSIONS, matrix: MATRIX });

    const [granted, revoked] = await capture(
      page, '#subject', 'permission-matrix-checkboxes',
      `(host) => {
        const sr = host.shadowRoot;
        const on = sr.querySelector('.matrix-checkbox[data-role="admin"][data-perm="delete"]');
        const off = sr.querySelector('.matrix-checkbox[data-role="viewer"][data-perm="delete"]');
        const centre = node => {
          const box = node.getBoundingClientRect();
          return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        };
        return [centre(on), centre(off)];
      }`,
    );
    expect(sameColor(granted, revoked),
      `a granted checkbox painted ${granted.join(',')}, the same as a revoked one`).toBe(false);

    await page.evaluate(({ roles, permissions, matrix }) => (window as any).matrix.mount({
      roles, permissions, matrix, readonly: true,
    }), { roles: ROLES, permissions: PERMISSIONS, matrix: MATRIX });

    const [check, dash] = await capture(
      page, '#subject', 'permission-matrix-readonly',
      `(host) => {
        const sr = host.shadowRoot;
        const rows = [...sr.querySelectorAll('tbody tr')];
        const on = rows[0].querySelectorAll('.matrix-readonly-indicator')[3];
        const off = rows[2].querySelectorAll('.matrix-readonly-indicator')[3];
        const centre = node => {
          const box = node.getBoundingClientRect();
          return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        };
        return [centre(on), centre(off)];
      }`,
    );
    expect(sameColor(check, dash),
      `the readonly check painted ${check.join(',')}, the same as the dash`).toBe(false);
  });
});
