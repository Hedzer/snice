/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-avatar-group TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/avatar-group, `npm run test:matrix`) owns the
 * arithmetic and the payload: which items are visible, the "+N" the chip
 * reads, the initials a name derives, the hashed-colour custom property, both
 * events' details, and the slotted-mode sizing attributes. It cannot own this
 * component's headline, because the headline IS geometry: "Row of OVERLAPPING
 * avatars" — a stride, a paint order in the overlap, a chip the same size as
 * the avatars it stands for. happy-dom lays out none of that.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · every avatar is the same square box — the group's own size custom
 *     property plus its 2px ring (`.avatar-item` is content-box);
 *   · consecutive avatars sit exactly `overlap` px apart: stride = box −
 *     overlap. `overlap = 0` never overlaps; `overlap > 0` really does;
 *   · the row is ONE line: every centre-Y equal, the base part hugging the
 *     row, nothing above or below it;
 *   · the "+N" chip participates in the same rhythm as the last member of the
 *     row and paints the theme's container surface — a control, not an avatar;
 *   · an avatar's centre is never occluded by its overlapping neighbour;
 *   · the item shapes paint real content: the image fills the ring's interior,
 *     initials and the fallback glyph have boxes, a custom `color` paints that
 *     exact background;
 *   · slotted `<snice-avatar>` children get the same stride, and the hidden
 *     overflow children really vanish (`display: none` is a paint claim).
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   In an overlapping row the LATER avatar must paint over the earlier one,
 *   a custom colour must reach the pixels, initials must be readable on their
 *   chip, and the "+N" chip must be a different surface from its neighbours.
 *   Only pixels can judge any of those.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/avatar-group/matrix.html';

/** The fixture leaves the root font size at the browser default: 16px/rem. */
const REM = 16;
/** The group's own ring: `--avatar-group-border-width: 2px`. */
const BORDER = 2;

type Size = 'small' | 'medium' | 'large';
type Shape = 'image' | 'initials' | 'named' | 'colored' | 'anonymous';

/** The size custom property per documented size (`--avatar-group-size`). */
const SIZE_REM: Record<Size, number> = { small: 2, medium: 2.5, large: 3 };

/** Parse a computed `rgb(r, g, b)` / `rgba(...)` string into pixel-probe RGB. */
function toRGB(computed: string): RGB {
  const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(computed);
  if (!m) return [-1, -1, -1];
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

interface Combo {
  id: string;
  mode?: 'imperative' | 'slotted';
  size: Size;
  overlap: number;
  max?: number;
  avatars?: unknown[];
  children?: unknown[];
}

const base = (over: Partial<Combo> & { id: string }): Combo => ({
  size: 'medium', overlap: 8, ...over,
});

/**
 * GEOMETRY: size (3) x overlap (0, 8, 20) x total (4 = under max, 7 = over
 * max) = 18 combos at the documented default max of 5. These are the axes
 * that move BOXES; colour and shape are separate, smaller crosses so the two
 * claims cannot mask each other.
 */
function geometryCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const size of ['small', 'medium', 'large'] as const) {
    for (const overlap of [0, 8, 20]) {
      for (const total of [4, 7]) {
        combos.push(base({
          id: `geometry/${size}/overlap=${overlap}/total=${total}`,
          size, overlap,
          avatars: Array.from({ length: total }, (_, i) => ({ name: `Person Number ${i}` })),
        }));
      }
    }
  }
  return combos;
}

/**
 * SHAPE: the doc's item model (`src` / `initials` / `name` / `color`, and
 * nothing at all) x size (small, large) = 10 single-avatar groups, so the
 * content a shape paints is the only variable.
 */
function shapeCombos(): Combo[] {
  const shapes: Record<Shape, unknown> = {
    image: { name: 'Bob Smith', src: '__IMG__' },
    initials: { name: 'Alice Johnson', initials: 'AJ' },
    named: { name: 'Carol Williams' },
    colored: { name: 'Dan', color: '#7c3aed' },
    anonymous: {},
  };
  const combos: Combo[] = [];
  for (const shape of Object.keys(shapes) as Shape[]) {
    for (const size of ['small', 'large'] as const) {
      combos.push(base({
        id: `shape/${shape}/${size}`,
        size,
        // `__IMG__` is swapped for the fixture's offline data-URL image inside
        // mountCombo, so no binary ever lives in the spec source.
        avatars: [shapes[shape]],
      }));
    }
  }
  return combos;
}

/**
 * MAX: total 9 against max 1 / 5 / 12 — the stride and the chip must hold at
 * the extremes of "Max visible before +N", including max > total (no chip).
 */
function maxCombos(): Combo[] {
  return [1, 5, 12].map(max => base({
    id: `max/${max}/total=9`,
    max,
    avatars: Array.from({ length: 9 }, (_, i) => ({ name: `Person Number ${i}` })),
  }));
}

/** SLOTTED: size (3) x overflow (no / yes) = 6 declarative groups. */
function slottedCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const size of ['small', 'medium', 'large'] as const) {
    for (const over of [false, true]) {
      combos.push(base({
        id: `slotted/${size}/${over ? 'overflow' : 'within-max'}`,
        mode: 'slotted', size,
        children: Array.from({ length: over ? 7 : 3 }, (_, i) => ({ name: `Slotted Person ${i}` })),
      }));
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
  return page.evaluate(({ combo, sizePx, border }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const round = (n: number) => n.toFixed(1);
    const matrix = (window as any).matrix;
    const token = (name: string) => matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const basePart = sr.querySelector('.avatar-group') as HTMLElement | null;
    if (!basePart) { say('no .avatar-group row painted'); return problems; }

    const slotted = combo.mode === 'slotted';
    const max = combo.max ?? 5;
    const all: HTMLElement[] = slotted
      ? [...host.querySelectorAll('snice-avatar')] as unknown as HTMLElement[]
      : [...sr.querySelectorAll('[part~="avatar"]')] as HTMLElement[];
    const chip = sr.querySelector('[part~="overflow"]') as HTMLElement | null;

    if (all.length === 0) { say('no avatars rendered'); return problems; }

    // Slotted mode hides its overflow children with display:none — zero-size
    // boxes that belong to the hidden check below, never to the row geometry.
    const members = all.filter((_, index) => !slotted || index < max);
    const boxes = members.map(node => node.getBoundingClientRect());

    // ── every avatar is the same square box ─────────────────────────────────
    for (const [index, box] of boxes.entries()) {
      if (Math.abs(box.width - sizePx) > EPS || Math.abs(box.height - sizePx) > EPS) {
        say(`avatar ${index} renders at ${round(box.width)}x${round(box.height)}px,`
          + ` expected the ${round(sizePx)}px box (size + ${border}px ring)`);
      }
    }

    // ── the stride: exactly `overlap` px apart, one line tall ───────────────
    // The stylesheet gives every member after the first a negative
    // margin-left of `overlap` px, so the distance between consecutive LEFT
    // edges is box − overlap: `overlap = 0` never overlaps, `overlap > 0`
    // really does. The chip follows the same rule as the last member.
    const row: Array<[string, DOMRect]> = [
      ...boxes.map((box, i) => [`avatar ${i}`, box] as [string, DOMRect]),
      ...(chip ? [['the +N chip', chip.getBoundingClientRect()] as [string, DOMRect]] : []),
    ];
    for (let i = 1; i < row.length; i++) {
      const stride = row[i][1].left - row[i - 1][1].left;
      const want = sizePx - combo.overlap;
      if (Math.abs(stride - want) > EPS) {
        say(`${row[i][0]} sits ${round(stride)}px after ${row[i - 1][0]},`
          + ` expected ${round(want)}px (box ${round(sizePx)} − overlap ${combo.overlap})`);
      }
    }
    if (combo.overlap > 0 && row.length > 1) {
      const overlapping = row[1][1].left < row[0][1].right - EPS;
      if (!overlapping) {
        say(`overlap=${combo.overlap} produced a non-overlapping row — "Row of overlapping avatars"`);
      }
    }

    // One line: every centre-Y equal, and the base part hugs the row.
    const centerY = boxes[0].top + boxes[0].height / 2;
    for (const [index, box] of boxes.entries()) {
      if (Math.abs(box.top + box.height / 2 - centerY) > EPS) {
        say(`avatar ${index} is not on the row's centre line`);
      }
    }
    if (chip) {
      const chipBox = chip.getBoundingClientRect();
      if (Math.abs(chipBox.top + chipBox.height / 2 - centerY) > EPS) {
        say('the +N chip is not on the row\'s centre line');
      }
    }
    const baseBox = basePart.getBoundingClientRect();
    if (baseBox.left > boxes[0].left + EPS || baseBox.right < row[row.length - 1][1].right - EPS) {
      say(`the row (${round(boxes[0].left)}..${round(row[row.length - 1][1].right)}) escapes part="base"`
        + ` (${round(baseBox.left)}..${round(baseBox.right)})`);
    }

    // ── the chip: same rhythm, same size, a CONTROL's surface ───────────────
    if (chip) {
      const chipBox = chip.getBoundingClientRect();
      if (Math.abs(chipBox.height - sizePx) > EPS || Math.abs(chipBox.width - sizePx) > EPS) {
        say(`the +N chip renders at ${round(chipBox.width)}x${round(chipBox.height)}px —`
          + ' it must match the avatars it stands for');
      }
      const chipFill = getComputedStyle(chip).backgroundColor;
      const container = token('--snice-color-surface-container-high');
      if (chipFill !== container) {
        say(`the +N chip fills "${chipFill}", expected the container surface "${container}"`);
      }
      // The chip is a control, not an avatar: no avatar may share its fill.
      for (const [index, member] of members.entries()) {
        if (getComputedStyle(member).backgroundColor === container) {
          say(`avatar ${index} paints the chip's own surface — indistinguishable from "+N"`);
        }
      }
    }

    // ── content shapes ──────────────────────────────────────────────────────
    if (!slotted) {
      for (const [index, member] of members.entries()) {
        const cs = getComputedStyle(member);
        const img = member.querySelector('img');
        const initials = member.querySelector('.avatar-initials');
        const glyph = member.querySelector('svg');
        if (img) {
          const inner = img.getBoundingClientRect();
          const want = sizePx - 2 * border;
          if (Math.abs(inner.width - want) > EPS || Math.abs(inner.height - want) > EPS) {
            say(`avatar ${index}'s image fills ${round(inner.width)}x${round(inner.height)}px`
              + ` of the ${round(want)}px ring interior`);
          }
        } else if (initials) {
          const box = initials.getBoundingClientRect();
          if (box.width <= 0 || box.height <= 0) {
            say(`avatar ${index} painted no readable initials box`);
          }
          if (cs.backgroundColor === 'rgba(0, 0, 0, 0)') {
            say(`avatar ${index}'s chip is transparent — nothing behind its initials`);
          }
        } else if (glyph) {
          const box = glyph.getBoundingClientRect();
          if (box.width < 4 || box.height < 4) {
            say(`avatar ${index}'s fallback glyph renders at ${round(box.width)}x${round(box.height)}px`);
          }
          if (cs.backgroundColor === 'rgba(0, 0, 0, 0)') {
            say(`avatar ${index}'s chip is transparent behind its fallback glyph`);
          }
        }
        // The doc's `color` is "Custom background color": it must BE the paint.
        const data = combo.avatars as Array<{ color?: string }> | undefined;
        const custom = data?.[index]?.color;
        if (custom) {
          const [r, g, b] = [1, 3, 5].map(i => parseInt(custom.slice(i, i + 2), 16));
          if (cs.backgroundColor !== `rgb(${r}, ${g}, ${b})`) {
            say(`avatar ${index} fills "${cs.backgroundColor}", expected its custom ${custom}`);
          }
        }
      }
    } else {
      // Slotted children: the hidden overflow children really vanish, and the
      // visible ones are ringed circles in the same stride (measured above on
      // the hosts' own boxes, which carry the ::slotted ring).
      for (const [index, child] of all.entries()) {
        if (index >= max) {
          const box = child.getBoundingClientRect();
          if (box.width > 0 || box.height > 0) {
            say(`slotted avatar ${index} past max still renders at`
              + ` ${round(box.width)}x${round(box.height)}px`);
          }
        }
      }
    }

    // ── occlusion: an avatar's centre is its own ────────────────────────────
    // Neighbours overlap the edges, never the centre — but only while the
    // documented stride (box − overlap, docs/ai/components/avatar-group.md
    // "overlap: Overlap in px") keeps the centre clear, i.e. overlap < half
    // the box. At small with overlap=20 the stride (36 − 20 = 16px) is SHORTER
    // than the half-box (18px), so the row's own documented geometry — later
    // members painting over earlier ones — is the rightful topmost hit at that
    // centre. A foreign hit there is arithmetic, not occlusion; everywhere the
    // geometry keeps the centre clear, it still is one.
    for (const [index, box] of boxes.entries()) {
      if (index >= max) continue;
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`avatar ${index}'s centre hit-tests as <${outer?.tagName.toLowerCase() ?? 'nothing'}>`);
        continue;
      }
      const nextLeft = index + 1 < row.length ? row[index + 1][1].left : Infinity;
      if (nextLeft < x + EPS) continue;
      if (!slotted) {
        const inner = (sr as any).elementFromPoint(x, y) as Element | null;
        if (inner !== members[index] && !members[index].contains(inner as Node)) {
          say(`avatar ${index} is occluded by <${inner?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    }

    return problems;
  }, {
    combo,
    sizePx: SIZE_REM[combo.size] * REM + 2 * BORDER,
    border: BORDER,
  });
}

/** Mount one combo, substituting the fixture's offline image URL into items. */
async function mountCombo(combo: Combo): Promise<void> {
  const imgUrl = await page.evaluate(() => (window as any).matrix.IMG_URL);
  const prepared: Combo = {
    ...combo,
    avatars: combo.avatars?.map(avatar =>
      JSON.parse(JSON.stringify(avatar).replace('"__IMG__"', JSON.stringify(imgUrl)))),
  };
  const mounted = await page.evaluate(c => (window as any).matrix.mount(c), prepared as any);
  expect(mounted.size, `attribute reflection for ${combo.id}`).toBe(combo.size);
  expect(Number(mounted.overlap), `attribute reflection for ${combo.id}`).toBe(combo.overlap);
}

test.describe('avatar-group visual matrix: layer 1 — size x overlap x overflow', () => {
  for (const combo of geometryCombos()) {
    test(combo.id, async () => {
      await mountCombo(combo);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('avatar-group visual matrix: layer 1 — the item shapes', () => {
  // The `__IMG__` placeholder is substituted with the fixture's data-URL
  // image inside mountCombo, so the spec never embeds binary in its source.
  for (const combo of shapeCombos()) {
    test(combo.id, async () => {
      await mountCombo(combo);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('avatar-group visual matrix: layer 1 — max extremes', () => {
  for (const combo of maxCombos()) {
    test(combo.id, async () => {
      await mountCombo(combo);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('avatar-group visual matrix: layer 1 — declarative slotted mode', () => {
  // VISUAL-MATRIX-avatar-group-1 — declarative mode paints NOTHING at mount.
  //
  // DOM-tier pin MATRIX-avatar-group-1 (tests/matrix/avatar-group/
  // avatar-group-events-and-slot.test.ts) already holds the structural half:
  // the group's first render commits BEFORE `detectMode()` (the @ready() hook
  // in snice-avatar-group.ts) flips `useSlot`, and that flip schedules no
  // render — so no `<slot>` is ever painted. This tier sees the paint half of
  // the same defect: unprojected light-DOM children render nothing, so every
  // "Slotted Person" host measures 0x0 (no box, no stride, no ring, no hit)
  // until any watched property changes and a render finally runs. The
  // assertions stay exactly as the documented declarative contract
  // (docs/ai/components/avatar-group.md: the default slot takes
  // "<snice-avatar> elements for declarative mode") demands; the day the
  // mount-time ordering is fixed they must pass as written.
  for (const combo of slottedCombos()) {
    test.fail(combo.id, async () => {
      await mountCombo(combo);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/** The size axis is an ORDERING claim no single combo can make. */
test.describe('avatar-group visual matrix: the size axis is an ordering', () => {
  test('small < medium < large in box height, at every overlap', async () => {
    for (const overlap of [0, 8, 20]) {
      const heights: Record<Size, number> = { small: 0, medium: 0, large: 0 };
      for (const size of ['small', 'medium', 'large'] as const) {
        await mountCombo(base({
          id: `ordering/${size}`, size, overlap,
          avatars: [{ name: 'Alice Johnson' }],
        }));
        heights[size] = await page.evaluate(() =>
          (window as any).matrix.avatarNodes()[0].getBoundingClientRect().height);
      }
      expect(heights.small, `overlap=${overlap}: small < medium`)
        .toBeLessThan(heights.medium);
      expect(heights.medium, `overlap=${overlap}: medium < large`)
        .toBeLessThan(heights.large);
    }
  });
});

// ── Real pointers and keys ──────────────────────────────────────────────────

test.describe('avatar-group visual matrix: real pointers and keys', () => {
  test('a real click on an avatar fires avatar-click exactly once', async () => {
    await mountCombo(base({ id: 'click', avatars: Array.from({ length: 3 }, (_, i) => ({ name: `Person Number ${i}` })) }));
    const center = await page.evaluate(() => (window as any).matrix.avatarCenter(1));
    await page.mouse.click(center.x, center.y);
    await page.evaluate(() => (window as any).matrix.settle());
    const events = await page.evaluate(() => (window as any).matrix.recordedEvents());
    expect(events.filter((e: any) => e.type === 'avatar-click'),
      'the real click did not select the avatar').toHaveLength(1);
  });

  test('a real click on the +N chip fires overflow-click', async () => {
    await mountCombo(base({
      id: 'overflow-click',
      avatars: Array.from({ length: 7 }, (_, i) => ({ name: `Person Number ${i}` })),
    }));
    const center = await page.evaluate(() => (window as any).matrix.overflowCenter());
    expect(center, 'no chip rendered to click').not.toBeNull();
    await page.mouse.click(center.x, center.y);
    await page.evaluate(() => (window as any).matrix.settle());
    const events = await page.evaluate(() => (window as any).matrix.recordedEvents());
    expect(events.filter((e: any) => e.type === 'overflow-click')).toHaveLength(1);
  });

  test('a real Tab focuses the first avatar and paints its focus ring', async () => {
    // "Focus styles on all interactive elements" — the one claim about focus
    // the doc makes, and only a real keyboard can raise :focus-visible.
    await mountCombo(base({ id: 'focus', avatars: [{ name: 'Alice Johnson' }] }));
    await page.mouse.move(5, 850); // the pointer is nowhere near the group
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const button = host.shadowRoot!.querySelector('[part~="avatar"]') as HTMLElement;
      const active = host.shadowRoot!.activeElement;
      const cs = getComputedStyle(button);
      return {
        isFocused: active === button,
        outlineStyle: cs.outlineStyle,
        outlineWidth: parseFloat(cs.outlineWidth),
      };
    });
    expect(focused.isFocused, 'Tab did not focus the first avatar').toBe(true);
    expect(focused.outlineStyle !== 'none' && focused.outlineWidth >= 1,
      `the focused avatar paints outline ${focused.outlineStyle} ${focused.outlineWidth}px`)
      .toBe(true);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('avatar-group visual matrix: marquee pixels', () => {
  test('in an overlapping row the LATER avatar paints over the earlier one', async () => {
    // Both items carry a blank `initials: ' '` so the chips are pure colour
    // with no monogram glyph to confuse the probes.
    await mountCombo(base({
      id: 'overlap-order',
      overlap: 20,
      avatars: [
        { color: '#ff0000', initials: ' ' },
        { color: '#0000ff', initials: ' ' },
      ],
    }));
    const [strip, redCentre] = await capture(
      page, '#subject', 'avatar-group-overlap-order',
      `(host) => {
        const buttons = [...host.shadowRoot.querySelectorAll('[part~="avatar"]')];
        const a = buttons[0].getBoundingClientRect();
        return [
          // Inside avatar 0's right edge, inside the 20px strip avatar 1
          // covers, past avatar 1's own 2px ring.
          { x: a.right - 6, y: a.top + a.height / 2 },
          { x: a.left + a.width / 2, y: a.top + a.height / 2 },
        ];
      }`,
    );
    // The covered strip must be BLUE (the later avatar), not red (the earlier).
    expect((strip as RGB)[2] > 40 && (strip as RGB)[0] < 40,
      `the overlap strip painted rgb(${strip.join(',')}), expected the later avatar's blue`).toBe(true);
    expect(sameColor(strip as RGB, redCentre as RGB),
      'the overlap strip matches the EARLIER avatar — the row paints back-to-front').toBe(false);
  });

  test('a custom color reaches the pixels', async () => {
    await mountCombo(base({
      id: 'custom-color',
      avatars: [{ color: '#7c3aed', initials: ' ' }],
    }));
    const [before, after] = await capture(
      page, '#subject', 'avatar-group-custom-color',
      `(host) => {
        const box = host.shadowRoot.querySelector('[part~="avatar"]').getBoundingClientRect();
        return [
          { x: box.left + box.width * 0.25, y: box.top + box.height / 2 },
          { x: box.left + box.width * 0.75, y: box.top + box.height / 2 },
        ];
      }`,
    );
    // #7c3aed = rgb(124, 58, 237); two probes either side of centre, both far
    // from the 2px ring.
    for (const p of [before, after]) {
      expect([0, 1, 2].every(i => Math.abs((p as RGB)[i] - [124, 58, 237][i]) <= 2),
        `the avatar painted rgb(${p.join(',')}), expected #7c3aed`).toBe(true);
    }
  });

  // VISUAL-MATRIX-avatar-group-2 — the monogram is painted unreadably on its
  // own chip.
  //
  // The doc's item model makes `initials` the documented fallback CONTENT a
  // named avatar paints (docs/ai/components/avatar-group.md: "initials:
  // Fallback initials" / "name: Name (used for initials/color/title)"), and
  // this suite's marquee charter judges exactly that the monogram is readable
  // on the chip it names. The component paints every monogram in a fixed
  // `--snice-color-text-inverse` (white, snice-avatar-group.css `.avatar-item`)
  // over a name-hashed palette colour with no contrast adaptation: "Alice
  // Johnson" hashes to `avatar-color-lime` (rgb(163, 230, 53)), and white on
  // that lime measures ~1.4:1 — below even the 3:1 antialiased floor for
  // large text. The assertion stays strict; it must pass the day the monogram
  // ink adapts to its chip.
  test.fail('initials are readable on their chip', async () => {
    await mountCombo(base({
      id: 'initials-contrast', size: 'large',
      avatars: [{ name: 'Alice Johnson', initials: 'AJ' }],
    }));
    const pixels = await capture(
      page, '#subject', 'avatar-group-initials',
      `(host) => {
        const avatar = host.shadowRoot.querySelector('[part~="avatar"]');
        const initials = avatar.querySelector('.avatar-initials');
        const chipBox = avatar.getBoundingClientRect();
        const t = initials.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 12; i++) {
          points.push({ x: t.x + (t.width * i) / 14, y: t.y + t.height / 2 });
        }
        points.push({ x: chipBox.x + 4, y: chipBox.y + chipBox.height / 2 });
        return points;
      }`,
    );
    const chip = pixels[pixels.length - 1] as RGB;
    const glyphs = pixels.slice(0, -1) as RGB[];
    expect(glyphs.some(p => !sameColor(p, chip)),
      `every probed initials pixel equals the chip ${chip.join(',')}`).toBe(true);
    const best = Math.max(...glyphs.map(p => contrast(p, chip)));
    // 12-16px semibold monogram on a mid-tone chip: 3:1 is the antialiased
    // floor for a glyph that is really there.
    expect(best, `best initials-vs-chip contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('the +N chip paints the container surface, not an avatar colour', async () => {
    await mountCombo(base({
      id: 'chip-surface',
      avatars: Array.from({ length: 6 }, (_, i) => ({ name: `Person Number ${i}` })),
    }));
    // Probes sit at 20% of each box's width, clear of the "+1" glyph and the
    // last avatar's "P5" monogram, which are both centred.
    const [chip, neighbour] = await capture(
      page, '#subject', 'avatar-group-chip',
      `(host) => {
        const sr = host.shadowRoot;
        const chipBox = sr.querySelector('[part~="overflow"]').getBoundingClientRect();
        const avatars = [...sr.querySelectorAll('[part~="avatar"]')];
        const last = avatars[avatars.length - 1].getBoundingClientRect();
        return [
          { x: chipBox.left + chipBox.width * 0.2, y: chipBox.top + chipBox.height / 2 },
          { x: last.left + last.width * 0.2, y: last.top + last.height / 2 },
        ];
      }`,
    );
    const container = toRGB(await page.evaluate(
      () => (window as any).matrix.token('--snice-color-surface-container-high')));
    expect([0, 1, 2].every(i => Math.abs((chip as RGB)[i] - container[i]) <= 2),
      `the chip painted rgb(${chip.join(',')}), expected the container surface`
        + ` rgb(${container.join(',')})`).toBe(true);
    expect(sameColor(chip as RGB, neighbour as RGB),
      'the chip and the last avatar paint the same colour — "+N" is not distinguishable').toBe(false);
  });
});
