/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-layout (and its twelve sibling shells) TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/layout, `npm run test:matrix`) owns the option
 * surface: which slots each shell declares, which attributes it reflects, which
 * shells answer `update()`, which expose `contained`. It cannot own a single
 * one of this family's actual promises, because every one of them is a
 * statement about the SCREEN and happy-dom has no screen:
 *
 *   · "Layouts own the screen. App shells … are `position: fixed; inset: 0` —
 *     body margin/ancestor padding cannot inset them";
 *   · "Content shells use `100dvh` … and let the page scroll";
 *   · "`contained` on any shell → sizes to parent instead";
 *   · "Sidebar is in-flow on desktop (main reflows on collapse); below 768px it
 *     overlays behind a scrim … Content is never hidden";
 *   · `rail` keeps an icon column, `offcanvas` hides it, `none` pins it;
 *   · every `ratio`, every `columns`, every `width` — all of them numbers a
 *     browser computes and a DOM stub does not.
 *
 * ── Layer 1 (every combo) ───────────────────────────────────────────────────
 *   Each shell is mounted with one flat-filled div in every documented slot,
 *   and the evaluate below asserts: every region is painted with a real box,
 *   inside the shell; sibling regions in a FLOW shell never overlap (layered
 *   shells declare themselves as such); the shell occupies the screen the way
 *   its family says it does; and each option's own geometric consequence — the
 *   collapsed rail's width, the split's ratio, the card grid's column count,
 *   the centered card's max width — matches the documented value.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Three. A region can measure perfectly and still be invisible: covered by a
 *   sibling, clipped by an `overflow: hidden` ancestor, or painted under a
 *   scrim. The fixture fills every region with a unique flat colour, so a probe
 *   answers WHICH region the browser drew at a point — which is how "content is
 *   never hidden" gets checked rather than assumed.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/layout/matrix.html';

/**
 * The shell table, transcribed from `docs/ai/components/layout.md`'s own
 * "Shell variants" list. `family` is the doc's split between the shells that
 * are "the page" (fixed, inset 0) and the ones that flow with it; `layered`
 * names the shells whose regions are documented as stacking on top of each
 * other, where overlap is the feature rather than the bug.
 */
interface Shell {
  tag: string;
  slots: string[];
  family: 'app' | 'content';
  layered?: boolean;
  /** Regions that are alternatives, so only one of them is ever painted. */
  exclusive?: string[][];
  /**
   * The documented responsive rules, as widths. `hiddenBelow` names regions
   * the docs say disappear under a breakpoint ("panel hidden <768px", "rail
   * drops at 1152px"); `drawerBelow` names the ones that stop being in-flow
   * and become an off-canvas drawer ("below 768px it overlays behind a
   * scrim", "tree → drawer at 996px"). Both change what "inside the shell"
   * means, so the oracle needs them rather than a blanket rule.
   */
  hiddenBelow?: Record<string, number>;
  drawerBelow?: Record<string, number>;
}

const SHELLS: Record<string, Shell> = {
  stacked: { tag: 'snice-layout', slots: ['brand', 'page', 'footer'], family: 'content' },
  sidebar: {
    tag: 'snice-layout-sidebar',
    slots: ['brand', 'header', 'sidebar', 'page', 'footer'],
    family: 'app',
    drawerBelow: { sidebar: 768 },
  },
  dashboard: {
    tag: 'snice-layout-dashboard',
    slots: ['brand', 'header', 'toolbar', 'sidebar', 'page', 'right-sidebar'],
    family: 'app',
    drawerBelow: { sidebar: 768 },
  },
  blog: {
    tag: 'snice-layout-blog',
    slots: ['brand', 'nav', 'page', 'sidebar', 'footer'],
    family: 'content',
  },
  centered: { tag: 'snice-layout-centered', slots: ['brand', 'page', 'footer'], family: 'content' },
  split: { tag: 'snice-layout-split', slots: ['left', 'right'], family: 'content' },
  landing: {
    tag: 'snice-layout-landing',
    slots: ['brand', 'nav', 'cta', 'hero', 'page', 'footer'],
    family: 'content',
  },
  card: { tag: 'snice-layout-card', slots: ['header', 'page', 'footer'], family: 'content' },
  minimal: { tag: 'snice-layout-minimal', slots: ['page'], family: 'content' },
  fullscreen: {
    tag: 'snice-layout-fullscreen',
    slots: ['background', 'overlay', 'page', 'controls'],
    family: 'app',
    // "layers: background, overlay, page, controls" — stacking IS the shell.
    layered: true,
  },
  'master-detail': {
    tag: 'snice-layout-master-detail',
    slots: ['brand', 'header', 'list', 'detail', 'empty'],
    family: 'content',
    // "empty" is the placeholder shown INSTEAD of a detail.
    exclusive: [['detail', 'empty']],
  },
  docs: {
    tag: 'snice-layout-docs',
    slots: ['brand', 'header', 'sidebar', 'page', 'toc', 'footer'],
    family: 'content',
    // "rail drops at 1152px, tree -> drawer at 996px"
    hiddenBelow: { toc: 1152 },
    drawerBelow: { sidebar: 996 },
  },
  'auth-split': {
    tag: 'snice-layout-auth-split',
    slots: ['brand', 'page', 'footer', 'panel'],
    family: 'content',
    // "panel hidden <768px"
    hiddenBelow: { panel: 768 },
  },
};

interface Combo {
  id: string;
  shell: string;
  attrs?: Record<string, string | boolean>;
  contained?: boolean;
  viewport?: { width: number; height: number };
  /** Region geometry the combo's options make predictable. */
  expect?: {
    sidebarWidth?: 'full' | 'rail' | 'hidden';
    ratio?: [number, number];
    direction?: 'horizontal' | 'vertical';
    columns?: number;
    maxWidthRem?: number;
    /** Regions the combo says must NOT be painted at all. */
    absent?: string[];
  };
  /**
   * A `MATRIX-layout-N` id when this combo is a recorded divergence. The
   * assertion stays exactly as correct as every other combo's; the id is what
   * turns the test into `test.fail`, so the tier still exits 0 while the
   * divergence stays on the record and starts failing the day it is fixed.
   */
  finding?: string;
}

const DESKTOP = { width: 1400, height: 900 };
const TABLET = { width: 900, height: 800 };
const MOBILE = { width: 500, height: 800 };

function combo(over: Combo): Combo {
  return { viewport: DESKTOP, ...over };
}

/**
 * `collapse-mode` belongs to `snice-layout-sidebar` alone. The dashboard has a
 * sidebar and the documented `collapsed` switch but no mode; the docs shell
 * documents its own breakpoint rules ("rail drops at 1152px, tree → drawer at
 * 996px") instead of the collapse vocabulary. The DOM matrix draws the same
 * line (tests/matrix/layout/layout-support.ts), and the two tiers must not
 * disagree about what the contract is.
 */
const COLLAPSE_MODE_SHELL = 'sidebar';
const COLLAPSIBLE_SHELLS = ['sidebar', 'dashboard'] as const;

/**
 * 81 combos. This is a FAMILY of thirteen shells whose entire contract is
 * geometry, so the matrix is sized to that rather than to a single component:
 * every shell gets its regions measured, and then each option that changes a
 * number — the three collapse modes, the two breakpoint sides, five ratios,
 * five column counts, four card widths, four gaps — is crossed with the shell
 * it belongs to.
 */
const COMBOS: Combo[] = [
  // ── Every shell, desktop: the regions exist, fit, and do not collide ──────
  ...Object.keys(SHELLS).map(shell => combo({ id: `${shell}/desktop`, shell })),

  // ── Every shell, mobile: the same claim at the other side of the ─────────
  //    breakpoints, where a shell that hides content instead of reflowing it
  //    shows up.
  ...Object.keys(SHELLS).map(shell =>
    combo({ id: `${shell}/mobile`, shell, viewport: MOBILE })),

  // ── The sidebar shell: three collapse modes × collapsed or not ───────────
  ...(['rail', 'offcanvas', 'none'] as const).flatMap(mode =>
    [false, true].map(collapsed => combo({
      id: `${COLLAPSE_MODE_SHELL}/${mode}/${collapsed ? 'collapsed' : 'expanded'}`,
      shell: COLLAPSE_MODE_SHELL,
      attrs: { 'collapse-mode': mode, ...(collapsed ? { collapsed: true } : {}) },
      expect: {
        // "collapse-mode — rail (default, icon column) | offcanvas (hidden) |
        //  none (pinned, no toggle)"
        sidebarWidth: !collapsed || mode === 'none' ? 'full'
          : mode === 'rail' ? 'rail' : 'hidden',
      },
    }))),

  // ── The dashboard: `collapsed` alone, and "main reflows on collapse" ─────
  ...[false, true].map(collapsed => combo({
    id: `dashboard/${collapsed ? 'collapsed' : 'expanded'}`,
    shell: 'dashboard',
    attrs: collapsed ? { collapsed: true } : {},
    expect: { sidebarWidth: collapsed ? 'hidden' : 'full' },
  })),

  // ── split: both directions × every documented ratio ──────────────────────
  //
  // VISUAL-MATRIX-layout-4 (fixed): `snice-layout-split.css` used to scope its
  // direction rule but not its ratio rules, so a vertical split with a
  // non-default ratio restored three columns and the panes went side by side.
  // The ratio rules are now scoped per direction (`:not([direction="vertical"])`
  // guards on the horizontal ones, dedicated `grid-template-rows` rules for the
  // vertical ones), so the pin is unwrapped and every combo asserts normally.
  ...(['horizontal', 'vertical'] as const).flatMap(direction =>
    ([['50-50', [50, 50]], ['60-40', [60, 40]], ['70-30', [70, 30]],
      ['33-67', [33, 67]], ['67-33', [67, 33]]] as const).map(([ratio, parts]) => combo({
      id: `split/${direction}/${ratio}`,
      shell: 'split',
      attrs: { direction, ratio },
      expect: { ratio: parts as unknown as [number, number], direction },
    }))),

  // ── card: every column count, and every gap ──────────────────────────────
  ...([1, 2, 3, 4, 6] as const).map(columns => combo({
    id: `card/columns=${columns}`,
    shell: 'card',
    attrs: { columns: String(columns) },
    expect: { columns },
  })),
  ...(['sm', 'md', 'lg', 'xl'] as const).map(gap => combo({
    id: `card/gap=${gap}`, shell: 'card', attrs: { gap },
  })),

  // ── centered: every documented card width ────────────────────────────────
  ...([['sm', 20], ['md', 24], ['lg', 32], ['xl', 38]] as const).map(([width, rem]) => combo({
    id: `centered/width=${width}`,
    shell: 'centered',
    attrs: { width },
    expect: { maxWidthRem: rem },
  })),

  // ── fullscreen: the documented overlay switch ────────────────────────────
  ...[false, true].map(overlay => combo({
    id: `fullscreen/overlay=${overlay}`, shell: 'fullscreen', attrs: { overlay },
  })),

  // ── auth-split: both panel positions, and the <768px rule ────────────────
  ...(['end', 'start'] as const).map(position => combo({
    id: `auth-split/panel=${position}`,
    shell: 'auth-split',
    attrs: { 'panel-position': position },
  })),
  // "panel hidden <768px"
  combo({
    id: 'auth-split/mobile hides the panel',
    shell: 'auth-split',
    viewport: MOBILE,
    expect: { absent: ['panel'] },
  }),

  // ── master-detail: with and without a selection ──────────────────────────
  combo({ id: 'master-detail/selected', shell: 'master-detail', attrs: { selected: true } }),
  combo({ id: 'master-detail/tablet', shell: 'master-detail', viewport: TABLET }),

  // ── docs: the two documented rail breakpoints ────────────────────────────
  combo({ id: 'docs/1152 rail drop', shell: 'docs', viewport: { width: 1100, height: 900 } }),
  combo({ id: 'docs/996 tree to drawer', shell: 'docs', viewport: { width: 960, height: 900 } }),

  // ── contained: the doc's own embedding example ───────────────────────────
  ...(['sidebar', 'split', 'card', 'centered'] as const).map(shell =>
    combo({ id: `${shell}/contained`, shell, contained: true })),
];

let page: Page;
let currentViewport = DESKTOP;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: DESKTOP });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

async function mount(combo: Combo) {
  const viewport = combo.viewport ?? DESKTOP;
  if (viewport.width !== currentViewport.width || viewport.height !== currentViewport.height) {
    await page.setViewportSize(viewport);
    currentViewport = viewport;
  }
  const shell = SHELLS[combo.shell];
  return page.evaluate(c => (window as any).matrix.mount(c), {
    tag: shell.tag,
    slots: shell.slots,
    attrs: combo.attrs ?? {},
    contained: combo.contained ?? false,
  } as any);
}

/**
 * LAYER 1. One evaluate per combo, returning EVERY violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  const shell = SHELLS[combo.shell];
  return page.evaluate(({ combo, shell }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const round = (n: number) => n.toFixed(0);

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

    // ── "The layout is the frame" ────────────────────────────────────────────
    //
    // The doc draws a hard line: app shells are `position: fixed; inset: 0`, so
    // "body margin/ancestor padding cannot inset them"; content shells use
    // `100dvh` and flow with the page. The fixture gives the body a 20px margin
    // precisely so the two are distinguishable, and `contained` overrides both.
    const hostStyle = getComputedStyle(host);
    if (combo.contained) {
      const parent = host.parentElement as HTMLElement;
      const pb = rect(parent);
      if (hostStyle.position === 'fixed') {
        say('a `contained` shell is still position: fixed — it does not size to its parent');
      }
      if (hostBox.width > pb.width + EPS || hostBox.height > pb.height + EPS) {
        say(`a \`contained\` shell is ${round(hostBox.width)}x${round(hostBox.height)}`
          + ` inside a ${round(pb.width)}x${round(pb.height)} parent`);
      }
    } else if (shell.family === 'app') {
      if (hostStyle.position !== 'fixed') {
        say(`an app shell is position: ${hostStyle.position}, expected fixed`);
      }
      if (Math.abs(hostBox.left) > EPS || Math.abs(hostBox.top) > EPS
        || Math.abs(hostBox.width - window.innerWidth) > EPS
        || Math.abs(hostBox.height - window.innerHeight) > EPS) {
        say(`an app shell occupies (${round(hostBox.left)},${round(hostBox.top)})`
          + ` ${round(hostBox.width)}x${round(hostBox.height)} of a`
          + ` ${window.innerWidth}x${window.innerHeight} viewport — the body margin inset it`);
      }
    } else {
      // Content shells fill the viewport height they are given and flow inside
      // the body's margin.
      if (hostBox.height < window.innerHeight - 2 * 20 - EPS) {
        say(`a content shell is only ${round(hostBox.height)}px tall in a`
          + ` ${window.innerHeight}px viewport — it does not fill the screen`);
      }
    }

    // ── Every documented region is painted, inside the shell ─────────────────
    //
    // "inside the shell" is conditional on the documented responsive rules: a
    // region the docs drop under a breakpoint must NOT be painted there, and a
    // sidebar the docs turn into a closed drawer must be parked OFF the shell
    // rather than inside it. Both are checked as their own claims below instead
    // of being waved through.
    const regions = new Map<string, DOMRect>();
    const parked = new Set<string>();
    const width = window.innerWidth;
    const absent = new Set([
      ...(combo.expect?.absent ?? []),
      ...Object.entries(shell.hiddenBelow ?? {})
        .filter(([, breakpoint]) => width < (breakpoint as number))
        .map(([name]) => name),
    ]);
    const drawers = new Set(Object.entries(shell.drawerBelow ?? {})
      .filter(([, breakpoint]) => width < (breakpoint as number))
      .map(([name]) => name));

    for (const name of shell.slots as string[]) {
      const node = host.querySelector(`[data-region="${name}"]`) as HTMLElement | null;
      if (!node) { say(`slot "${name}" content is not in the light DOM`); continue; }
      const assigned = (node as any).assignedSlot as HTMLSlotElement | null;
      const r = rect(node);
      const painted = r.width > 0 && r.height > 0;

      if (absent.has(name)) {
        if (painted) {
          say(`region "${name}" is painted at ${round(r.width)}x${round(r.height)},`
            + ' but this viewport hides it');
        }
        continue;
      }
      if (drawers.has(name)) {
        // "below 768px it overlays behind a scrim … Content is never hidden" —
        // so the drawer keeps its box (it is a closed drawer, not a deleted
        // one) and is parked clear of the shell's leading edge.
        if (!painted) {
          say(`region "${name}" is a closed drawer at ${width}px but has no box —`
            + ' it was hidden rather than parked');
        } else if (r.right > hostBox.left + EPS) {
          say(`the closed drawer "${name}" ends at ${round(r.right)}, inside a shell`
            + ` that starts at ${round(hostBox.left)} — it is not parked off-screen`);
        }
        parked.add(name);
        continue;
      }
      if (!assigned) { say(`region "${name}" was never assigned to a slot`); continue; }
      if (!painted) {
        // The one documented exception: an `empty` placeholder gives way to a
        // real detail, and vice versa.
        const alternatives = (shell.exclusive ?? [])
          .find((group: string[]) => group.includes(name)) as string[] | undefined;
        if (!alternatives) {
          say(`region "${name}" renders at ${round(r.width)}x${round(r.height)}`);
        }
        continue;
      }
      if (r.left < hostBox.left - EPS || r.right > hostBox.right + EPS
        || r.top < hostBox.top - EPS || r.bottom > hostBox.bottom + EPS) {
        say(`region "${name}" (${round(r.left)},${round(r.top)}`
          + ` ${round(r.width)}x${round(r.height)}) escapes the shell`
          + ` (${round(hostBox.left)},${round(hostBox.top)}`
          + ` ${round(hostBox.width)}x${round(hostBox.height)})`);
      }
      regions.set(name, r);
    }

    // ── Regions of a FLOW shell do not sit on top of one another ─────────────
    //
    // Skipped for the shells the docs describe as layers, and for the pairs the
    // shell itself declares as alternatives.
    if (!shell.layered) {
      const exclusive = (shell.exclusive ?? []) as string[][];
      const names = [...regions.keys()];
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          const [x, y] = [names[i], names[j]];
          if (exclusive.some(group => group.includes(x) && group.includes(y))) continue;
          const a = regions.get(x)!;
          const b = regions.get(y)!;
          if (a.left < b.right - EPS && b.left < a.right - EPS
            && a.top < b.bottom - EPS && b.top < a.bottom - EPS) {
            say(`regions "${x}" and "${y}" overlap`);
          }
        }
      }
    }

    // ── Option consequences ──────────────────────────────────────────────────
    const want = combo.expect ?? {};

    // The sidebar's three collapse modes, in pixels.
    if (want.sidebarWidth) {
      const aside = sr.querySelector('.sidebar, [part~="sidebar"]') as HTMLElement | null;
      if (!aside) say('no sidebar element painted');
      else {
        const w = rect(aside).width;
        const full = 16 * rem;   // --snice-layout-sidebar-width
        const rail = 3 * rem;    // --snice-layout-rail-collapsed-width
        // Below 768px the sidebar leaves the flow entirely and overlays, so the
        // desktop widths do not apply; those combos run at the desktop size.
        if (want.sidebarWidth === 'hidden' && w > EPS) {
          say(`collapse-mode="offcanvas" left a ${round(w)}px sidebar in the flow`);
        }
        if (want.sidebarWidth === 'rail' && Math.abs(w - rail) > 2) {
          say(`a collapsed rail is ${round(w)}px, expected the`
            + ` ${round(rail)}px icon column`);
        }
        if (want.sidebarWidth === 'full' && w < full - 2) {
          say(`an expanded sidebar is ${round(w)}px, expected ${round(full)}px`);
        }
        // "main reflows on collapse" — the content region must start where the
        // sidebar ends, whatever the sidebar's width.
        const main = sr.querySelector('.main, [part~="main"]') as HTMLElement | null;
        if (main) {
          const mainBox = rect(main);
          const asideBox = rect(aside);
          if (mainBox.left < asideBox.right - EPS) {
            say(`main starts at ${round(mainBox.left)}, inside a sidebar that`
              + ` ends at ${round(asideBox.right)} — it did not reflow`);
          }
        }
      }
    }

    // The split ratios, as a share of the pane axis.
    //
    // Measured on the PANES, not on the slotted content: each pane carries its
    // own padding, so a content box would report the ratio the padding left
    // over rather than the ratio the grid tracks were given.
    if (want.ratio) {
      const leftPane = sr.querySelector('.panel-left') as HTMLElement | null;
      const rightPane = sr.querySelector('.panel-right') as HTMLElement | null;
      const left = leftPane ? rect(leftPane) : undefined;
      const right = rightPane ? rect(rightPane) : undefined;
      if (!left || !right) say('a split pane is missing');
      else {
        const vertical = want.direction === 'vertical';
        const a = vertical ? left.height : left.width;
        const b = vertical ? right.height : right.width;
        const share = a / (a + b) * 100;
        const wanted = want.ratio[0];
        // Half a point of slack, for the single pixel the divider track takes
        // out of the axis before the fr units are shared.
        if (Math.abs(share - wanted) > 0.5) {
          say(`ratio="${want.ratio.join('-')}" ${vertical ? 'vertically' : 'horizontally'}`
            + ` produced a ${share.toFixed(1)}/${(100 - share).toFixed(1)} split`);
        }
        // `direction` decides which axis is divided at all.
        if (vertical && Math.abs(left.width - right.width) > EPS) {
          say('a vertical split gave its two panes different widths');
        }
        if (!vertical && Math.abs(left.height - right.height) > EPS) {
          say('a horizontal split gave its two panes different heights');
        }
      }
    }

    // The card grid's column count, read off the painted tracks.
    if (want.columns) {
      const grid = sr.querySelector('.grid') as HTMLElement | null;
      if (!grid) say('no card grid painted');
      else {
        const tracks = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean);
        if (tracks.length !== want.columns) {
          say(`columns="${want.columns}" produced ${tracks.length} tracks`
            + ` (${tracks.join(' ')})`);
        }
      }
    }

    // The centered card's documented max width.
    if (want.maxWidthRem) {
      const container = sr.querySelector('.container') as HTMLElement | null;
      if (!container) say('no centered container painted');
      else {
        const max = parseFloat(getComputedStyle(container).maxWidth);
        if (Math.abs(max - want.maxWidthRem * rem) > 1) {
          say(`width="${(combo.attrs ?? {}).width}" resolved to a ${round(max)}px`
            + ` card, expected ${round(want.maxWidthRem * rem)}px`);
        }
        // "Centered" is the shell's name: the card sits on the shell's own axis.
        const c = rect(container);
        const shellCentre = hostBox.left + hostBox.width / 2;
        if (Math.abs(c.left + c.width / 2 - shellCentre) > EPS) {
          say(`the card's centre is ${round(c.left + c.width / 2)},`
            + ` the shell's is ${round(shellCentre)}`);
        }
      }
    }

    return problems;
  }, { combo, shell } as any);
}

test.describe('layout visual matrix: layer 1', () => {
  for (const combo of COMBOS) {
    const declare = combo.finding ? test.fail : test;
    declare(combo.finding ? `${combo.finding}: ${combo.id}` : combo.id, async () => {
      const mounted = await mount(combo);
      expect(mounted.tag, `mounted shell for ${combo.id}`).toBe(SHELLS[combo.shell].tag);
      // The fullscreen shell parks its controls below the frame until
      // :host(:hover) slides them in. Chromium's never-moved pointer sits at
      // (0,0), which is inside that fixed shell, so it reveals the controls by
      // accident; Firefox and WebKit apply no :hover without pointer movement.
      // Hover explicitly — the documented reveal — and restore the pointer so
      // later combos run under the same conditions chromium always had.
      if (combo.shell === 'fullscreen') {
        await page.mouse.move(currentViewport.width / 2, currentViewport.height / 2);
        await page.waitForTimeout(340);
      }
      const problems = await visualProblems(combo);
      if (combo.shell === 'fullscreen') await page.mouse.move(0, 0);
      expect(problems, `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('layout visual matrix: sidebar behaviour', () => {
  test.beforeEach(async () => {
    await page.setViewportSize(DESKTOP);
    currentViewport = DESKTOP;
  });

  test('the toggle collapses the sidebar and main takes the space back', async () => {
    await mount(combo({ id: 'x', shell: 'sidebar', attrs: { 'collapse-mode': 'rail' } }));
    const before = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      return {
        sidebar: sr.querySelector('.sidebar')!.getBoundingClientRect().width,
        main: sr.querySelector('.main')!.getBoundingClientRect().width,
      };
    });
    const clicked = await page.evaluate(() => (window as any).matrix.toggle());
    expect(clicked.clicked, 'the shell painted no sidebar toggle').toBe(true);
    const after = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      return {
        sidebar: sr.querySelector('.sidebar')!.getBoundingClientRect().width,
        main: sr.querySelector('.main')!.getBoundingClientRect().width,
      };
    });
    expect(after.sidebar, 'the toggle did not narrow the sidebar')
      .toBeLessThan(before.sidebar);
    expect(after.main, 'main did not reflow into the space the sidebar gave up')
      .toBeGreaterThan(before.main);
  });

  test('collapse-mode="none" paints no toggle at all', async () => {
    await mount(combo({ id: 'x', shell: 'sidebar', attrs: { 'collapse-mode': 'none' } }));
    const result = await page.evaluate(() => (window as any).matrix.toggle());
    expect(result.clicked, '"none" is documented as pinned, with no toggle').toBe(false);
  });

  test('below 768px the sidebar overlays main behind a scrim, hiding nothing', async () => {
    // The documented mobile rule, and the one claim in this family that only a
    // hit-test can settle: "it overlays behind a scrim that closes on
    // click/Escape. Content is never hidden."
    await page.setViewportSize(MOBILE);
    currentViewport = MOBILE;
    await mount(combo({ id: 'x', shell: 'sidebar', viewport: MOBILE }));
    const closed = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const aside = sr.querySelector('.sidebar')! as HTMLElement;
      const scrim = sr.querySelector('.scrim')! as HTMLElement;
      return {
        sidebarLeft: aside.getBoundingClientRect().left,
        scrimShown: getComputedStyle(scrim).display !== 'none',
        pageVisible: !!document.querySelector('[data-region="page"]')!
          .getBoundingClientRect().height,
      };
    });
    expect(closed.scrimShown, 'a scrim is showing before the drawer was opened').toBe(false);
    expect(closed.sidebarLeft, 'the mobile drawer is not parked off-screen')
      .toBeLessThan(0);
    expect(closed.pageVisible, 'the page content was hidden by the mobile layout').toBe(true);

    await page.evaluate(() => (window as any).matrix.toggle());
    const open = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const aside = sr.querySelector('.sidebar')! as HTMLElement;
      const scrim = sr.querySelector('.scrim')! as HTMLElement;
      const asideBox = aside.getBoundingClientRect();
      const scrimBox = scrim.getBoundingClientRect();
      return {
        sidebarLeft: asideBox.left,
        scrimShown: getComputedStyle(scrim).display !== 'none',
        scrimWidth: scrimBox.width,
        // Does the drawer really sit ON TOP of the content?
        onTop: (sr as any).elementFromPoint(
          asideBox.left + asideBox.width / 2,
          asideBox.top + asideBox.height / 2,
        ) === aside || aside.contains((sr as any).elementFromPoint(
          asideBox.left + asideBox.width / 2,
          asideBox.top + asideBox.height / 2,
        )),
        pageHeight: document.querySelector('[data-region="page"]')!
          .getBoundingClientRect().height,
      };
    });
    expect(open.sidebarLeft, 'the drawer did not slide onto the screen').toBeCloseTo(0, 0);
    expect(open.scrimShown, 'no scrim behind the open drawer').toBe(true);
    expect(open.onTop, 'the drawer opened UNDER the content it is meant to overlay').toBe(true);
    expect(open.pageHeight, 'opening the drawer hid the page content')
      .toBeGreaterThan(0);

    const dismissed = await page.evaluate(() => (window as any).matrix.press('Escape'));
    expect(dismissed, 'Escape did not reach the shell').toBeTruthy();
    const afterEscape = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      return sr.querySelector('.sidebar')!.getBoundingClientRect().left;
    });
    expect(afterEscape, 'Escape did not close the mobile drawer').toBeLessThan(0);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('layout visual matrix: marquee pixels', () => {
  test.beforeEach(async () => {
    await page.setViewportSize(DESKTOP);
    currentViewport = DESKTOP;
  });

  test('every region of the dashboard shell is actually painted, not just placed',
    async () => {
      // Six regions, six flat fills, six probes. A region measured at the right
      // box and covered by a sibling passes layer 1 and fails here — which is
      // the whole reason a layered shell family gets a pixel tier.
      await mount(combo({ id: 'x', shell: 'dashboard' }));
      const fills = await page.evaluate(() => (window as any).matrix.FILL);
      const names = SHELLS.dashboard.slots;
      const pixels = await capture(
        page, '#subject', 'layout-dashboard-regions',
        `() => ${JSON.stringify(names)}.map(name => {
          const box = document.querySelector('[data-region="' + name + '"]')
            .getBoundingClientRect();
          return { x: box.x + box.width / 2, y: box.bottom - 3 };
        })`,
      );
      names.forEach((name, i) => {
        const want = (fills[name] as string).match(/\d+/g)!.map(Number);
        expect(pixels[i],
          `region "${name}" painted ${pixels[i].join(',')} where its own`
          + ` ${want.join(',')} should be — it is covered or clipped`)
          .toEqual(want);
      });
    });

  test('the collapsed rail still paints a navigation column', async () => {
    // "rail (default, icon column)" — the point of the rail is that navigation
    // stays REACHABLE when collapsed. A 3rem strip that paints the page's own
    // background is a rail in name only.
    await mount(combo({
      id: 'x',
      shell: 'sidebar',
      attrs: { 'collapse-mode': 'rail', collapsed: true },
    }));
    const [rail, main] = await capture(
      page, '#subject', 'layout-rail-collapsed',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const aside = sr.querySelector('.sidebar').getBoundingClientRect();
        const region = document.querySelector('[data-region="sidebar"]').getBoundingClientRect();
        return [
          { x: aside.x + 3, y: region.y + Math.min(6, region.height / 2) },
          { x: aside.right + 40, y: region.y + 6 },
        ];
      }`,
    );
    expect(sameColor(rail, main),
      `the collapsed rail painted ${rail.join(',')} — the same as the content`
      + ' area beside it, so no column survived').toBe(false);
  });

  test('the split divider paints a real line between the two panes', async () => {
    // The split's grid spends a 1px track on a divider. A 1px track is exactly
    // the sort of thing that measures correctly and paints nothing.
    await mount(combo({
      id: 'x', shell: 'split', attrs: { direction: 'horizontal', ratio: '50-50' },
    }));
    const [left, divider, right] = await capture(
      page, '#subject', 'layout-split-divider',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const d = sr.querySelector('.divider').getBoundingClientRect();
        const y = d.y + d.height / 2;
        return [
          { x: d.x - 6, y },
          { x: d.x + d.width / 2, y },
          { x: d.right + 6, y },
        ];
      }`,
    );
    expect(sameColor(divider, left) && sameColor(divider, right),
      `the divider painted ${divider.join(',')}, identical to both panes —`
      + ' no line was drawn').toBe(false);
  });
});
