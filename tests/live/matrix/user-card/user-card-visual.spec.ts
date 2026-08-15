/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-user-card TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/user-card, `npm run test:matrix`) owns
 * structure truth: which regions render for which profile, the initials
 * fallback, the `social-click` / `action-click` details. Two of this component's
 * documented promises are invisible to it:
 *
 *   · the status indicator is an absolutely-positioned dot ON the avatar, and
 *     its meaning is entirely COLOUR — `online` green, `away` amber, `offline`
 *     grey, `busy` red. happy-dom paints nothing, so the dot is a div at 0x0
 *     with no colour;
 *   · `variant` reshapes the card — `card` stacks and centres, `horizontal` and
 *     `compact` put the info beside the avatar, and `compact` HIDES the contact
 *     and social sections through CSS alone. A DOM test sees those sections
 *     present in every variant and cannot tell that one variant hides them.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the card has a real box that stays inside its container;
 *   · the avatar is square, non-zero, and paints something (image or initials);
 *   · the status dot has a real box, sits INSIDE the avatar's box, and carries
 *     the documented colour family for its status;
 *   · the name has a real box, is the largest text in the card, and nothing
 *     paints over it;
 *   · `card` stacks the info under the avatar; `horizontal`/`compact` put it
 *     beside; `compact` hides contact and social entirely;
 *   · every social link is a real, hit-testable target.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The four statuses have to paint four different colours, and the dot has to
 *   be visible against the avatar it sits on.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/user-card/matrix.html';

type Variant = 'card' | 'horizontal' | 'compact';
type Status = 'online' | 'away' | 'offline' | 'busy';

interface Profile {
  name: string;
  avatar?: string;
  role?: string;
  company?: string;
  email?: string;
  phone?: string;
  location?: string;
}

interface ProfileCase { name: string; profile: Profile; social: { platform: string; url: string }[]; actions?: string }

/**
 * A 1x1 PNG data URI. A real image, so `avatar` takes its documented image
 * path, but with no network dependency and no decode timing to race.
 */
const AVATAR_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const PROFILES: ProfileCase[] = [
  {
    name: 'full',
    profile: {
      name: 'Sarah Johnson',
      avatar: AVATAR_URL,
      role: 'Staff Engineer',
      company: 'Acme Corp',
      email: 'sarah@acme.test',
      phone: '+1 555-0123',
      location: 'San Francisco, CA',
    },
    social: [
      { platform: 'github', url: 'https://github.test/sarah' },
      { platform: 'twitter', url: 'https://twitter.test/sarah' },
      { platform: 'linkedin', url: 'https://linkedin.test/in/sarah' },
    ],
    actions: '<button>Message</button>',
  },
  {
    name: 'initials-only',
    profile: { name: 'Sarah Johnson' },
    social: [],
  },
];

const VARIANTS: Variant[] = ['card', 'horizontal', 'compact'];
const STATUSES: Status[] = ['online', 'away', 'offline', 'busy'];

/** The documented colour family of each status, as a channel-dominance test. */
const STATUS_FAMILY: Record<Status, (rgb: number[]) => boolean> = {
  // success → green dominant
  online: ([r, g, b]) => g > r + 20 && g > b + 20,
  // warning → amber: red and green both high, blue low
  away: ([r, g, b]) => r > b + 40 && g > b + 40,
  // tertiary text → neutral grey: the three channels agree
  offline: ([r, g, b]) => Math.abs(r - g) < 24 && Math.abs(g - b) < 24,
  // danger → red dominant
  busy: ([r, g, b]) => r > g + 40 && r > b + 40,
};

interface Combo { id: string; variant: Variant; status: Status; profile: ProfileCase }

/**
 * 3 variants x 4 statuses x 2 profiles — 24 combos. Sized to a presentational
 * card whose documented visual surface is one layout switch and one colour
 * scale; the point of this tier is that both meet a real layout engine.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of VARIANTS) {
    for (const status of STATUSES) {
      for (const profile of PROFILES) {
        combos.push({ id: `${variant}/${status}/${profile.name}`, variant, status, profile });
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
async function visualProblems(combo: Combo, family: string): Promise<string[]> {
  return page.evaluate(({ combo, family }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const inFamily = new Function(`return (${family})`)() as (rgb: number[]) => boolean;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const tokens = (node: Element) => (node.getAttribute('part') ?? '').split(/\s+/).filter(Boolean);
    const partsIn = (root: ParentNode, name: string) =>
      [...root.querySelectorAll('[part]')].filter(node => tokens(node).includes(name)) as HTMLElement[];
    const partOf = (name: string) => partsIn(sr, name)[0] ?? null;

    const base = partOf('base');
    if (!base) { say('no [part="base"]'); return problems; }
    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`the card renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }
    const stage = document.getElementById('stage')!.getBoundingClientRect();
    if (baseBox.right > stage.right + EPS) {
      say(`the card (right ${baseBox.right.toFixed(0)}) overflows its ${stage.width}px container`);
    }

    // ── Avatar + status dot ──────────────────────────────────────────────────
    const avatar = partOf('avatar');
    if (!avatar) { say('no [part="avatar"]'); return problems; }
    const avatarBox = rect(avatar);
    if (avatarBox.width <= 0 || avatarBox.height <= 0) {
      say(`the avatar renders at ${avatarBox.width}x${avatarBox.height}`);
    } else if (Math.abs(avatarBox.width - avatarBox.height) > 2) {
      say(`the avatar is ${avatarBox.width.toFixed(0)}x${avatarBox.height.toFixed(0)} — not square`);
    }

    const dot = partOf('status');
    if (!dot) {
      say('no [part="status"] indicator');
    } else {
      const dotBox = rect(dot);
      if (dotBox.width <= 0 || dotBox.height <= 0) {
        say(`the status dot renders at ${dotBox.width}x${dotBox.height}`);
      } else {
        // The dot is documented as an indicator ON the avatar: its box must sit
        // inside the avatar's, not float somewhere else in the card.
        if (dotBox.left < avatarBox.left - EPS || dotBox.right > avatarBox.right + EPS
          || dotBox.top < avatarBox.top - EPS || dotBox.bottom > avatarBox.bottom + EPS) {
          say(`the status dot (${dotBox.left.toFixed(0)},${dotBox.top.toFixed(0)}) sits outside the`
            + ` avatar (${avatarBox.left.toFixed(0)},${avatarBox.top.toFixed(0)}`
            + `..${avatarBox.right.toFixed(0)},${avatarBox.bottom.toFixed(0)})`);
        }
        const radius = parseFloat(getComputedStyle(dot).borderTopLeftRadius) || 0;
        if (radius < dotBox.width / 4) say(`the status dot is not round (radius ${radius})`);
        const fill = getComputedStyle(dot).backgroundColor;
        const rgb = (fill.match(/\d+/g) ?? []).slice(0, 3).map(Number);
        if (rgb.length < 3) {
          say(`the status dot has no background colour ("${fill}")`);
        } else if (!inFamily(rgb)) {
          say(`status="${combo.status}" painted ${fill}, outside its documented colour family`);
        }
      }
    }

    // ── Name ─────────────────────────────────────────────────────────────────
    const name = partOf('name');
    if (!name) { say('no [part="name"]'); return problems; }
    const nameBox = rect(name);
    if (nameBox.width <= 0 || nameBox.height <= 0) {
      say(`the name renders at ${nameBox.width}x${nameBox.height}`);
    }
    const nameSize = parseFloat(getComputedStyle(name).fontSize);
    const role = partOf('role');
    if (role) {
      const roleSize = parseFloat(getComputedStyle(role).fontSize);
      if (roleSize >= nameSize) {
        say(`the role's font-size ${roleSize} is not smaller than the name's ${nameSize}`);
      }
    }
    // Nothing may paint over the name.
    const ny = nameBox.top + nameBox.height / 2;
    for (const fraction of [0.25, 0.75]) {
      const nx = nameBox.left + nameBox.width * fraction;
      if (document.elementFromPoint(nx, ny) !== host) {
        say(`name @${Math.round(fraction * 100)}% is outside the card's own hit area`);
        continue;
      }
      const hit = (sr as any).elementFromPoint(nx, ny) as Element | null;
      if (hit !== name && !name.contains(hit as Node) && !(hit as Element)?.contains(name)) {
        say(`name @${Math.round(fraction * 100)}% is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    // ── The variant's layout ─────────────────────────────────────────────────
    if (combo.variant === 'card') {
      if (nameBox.top < avatarBox.bottom - EPS) {
        say(`variant="card" put the name (top ${nameBox.top.toFixed(0)}) beside the avatar`
          + ` (bottom ${avatarBox.bottom.toFixed(0)}) instead of under it`);
      }
      // The card variant is documented as the centred one.
      const centreOffset = Math.abs(
        (avatarBox.left + avatarBox.right) / 2 - (baseBox.left + baseBox.right) / 2);
      if (centreOffset > 4) {
        say(`variant="card" left the avatar ${centreOffset.toFixed(1)}px off the card's centre line`);
      }
    } else {
      if (nameBox.left < avatarBox.right - EPS) {
        say(`variant="${combo.variant}" put the name (left ${nameBox.left.toFixed(0)}) under the`
          + ` avatar (right ${avatarBox.right.toFixed(0)}) instead of beside it`);
      }
    }

    // ── contact / social, and what `compact` does to them ────────────────────
    const contact = partOf('contact');
    const social = partOf('social');
    const hidden = (el: HTMLElement | null) =>
      !el || getComputedStyle(el).display === 'none' || rect(el).height === 0;

    if (combo.variant === 'compact') {
      if (contact && !hidden(contact)) {
        say('variant="compact" still paints the contact section');
      }
      if (social && !hidden(social)) {
        say('variant="compact" still paints the social row');
      }
    } else {
      if (combo.profile.social.length > 0) {
        if (hidden(social)) {
          say(`variant="${combo.variant}" hides the social row despite`
            + ` ${combo.profile.social.length} links`);
        } else {
          const links = social!.querySelectorAll('a, button');
          if (links.length !== combo.profile.social.length) {
            say(`${links.length} social targets painted, expected ${combo.profile.social.length}`);
          }
          for (const [i, link] of [...links].entries()) {
            const box = rect(link);
            if (box.width < 16 || box.height < 16) {
              say(`social link ${i} renders at ${box.width.toFixed(0)}x${box.height.toFixed(0)}`
                + ' — too small to hit');
              continue;
            }
            const hit = (sr as any).elementFromPoint(
              box.left + box.width / 2, box.top + box.height / 2) as Element | null;
            if (hit !== link && !link.contains(hit as Node)) {
              say(`social link ${i} is covered by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
            }
          }
        }
      }
      if (combo.profile.profile.email && hidden(contact)) {
        say(`variant="${combo.variant}" hides the contact section despite an email`);
      }
    }

    return problems;
  }, { combo, family } as any);
}

const combos = generateCombos();

test.describe('user-card visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), {
        ...combo.profile.profile,
        actions: combo.profile.actions,
        social: combo.profile.social,
        variant: combo.variant,
        status: combo.status,
      } as any);
      expect(mounted.social).toBe(combo.profile.social.length);
      expect(
        await visualProblems(combo, STATUS_FAMILY[combo.status].toString()),
        `combo ${combo.id}`,
      ).toEqual([]);
    });
  }
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. Layer 1 read the computed cascade; these two exist because a
// dot with `background: green` in the cascade can still be painted over by the
// avatar it sits on, and because four statuses that resolve to four cascade
// values still have to reach the screen as four different colours.

test.describe('user-card visual matrix: marquee pixels', () => {
  const AVATARLESS = { name: 'Sarah Johnson', variant: 'card' };

  test('the four statuses paint four distinct colours', async () => {
    const painted: Record<string, string> = {};
    for (const status of STATUSES) {
      await page.evaluate(c => (window as any).matrix.mount(c), { ...AVATARLESS, status } as any);
      const [dot] = await capture(
        page, '#subject', `user-card-status-${status}`,
        `(host) => {
          const tokens = (n) => (n.getAttribute('part') || '').split(/\\s+/);
          const el = [...host.shadowRoot.querySelectorAll('[part]')]
            .find(n => tokens(n).includes('status'));
          const b = el.getBoundingClientRect();
          return [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }];
        }`,
      );
      painted[status] = dot.join(',');
    }
    const distinct = new Set(Object.values(painted));
    expect(distinct.size, `the four statuses painted ${JSON.stringify(painted)}`).toBe(4);
  });

  test('the status dot stands out from the avatar it sits on', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), { ...AVATARLESS, status: 'online' } as any);
    const [dot, avatar] = await capture(
      page, '#subject', 'user-card-status-on-avatar',
      `(host) => {
        const tokens = (n) => (n.getAttribute('part') || '').split(/\\s+/);
        const find = (name) => [...host.shadowRoot.querySelectorAll('[part]')]
          .find(n => tokens(n).includes(name));
        const dot = find('status').getBoundingClientRect();
        const av = find('avatar').getBoundingClientRect();
        return [
          { x: dot.x + dot.width / 2, y: dot.y + dot.height / 2 },
          // The avatar's opposite corner — its own fill, well clear of the dot.
          { x: av.x + 4, y: av.y + 4 },
        ];
      }`,
    );
    expect(sameColor(dot, avatar),
      `the status dot painted ${dot.join(',')}, identical to the avatar behind it`).toBe(false);
    expect(contrast(dot, avatar),
      `status dot contrast against the avatar is ${contrast(dot, avatar).toFixed(2)}:1`)
      .toBeGreaterThan(1.15);
  });
});
