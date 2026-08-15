/**
 * snice-user-card feature-combination matrix.
 *
 * Dimensions (docs/ai/components/user-card.md + the .types.ts contract):
 *
 *   identity   variant x avatar x status         = 3 x 2 x 4 = 24
 *   contact    variant x {email,phone,location}  = 3 x 8     = 24
 *   role line  variant x {role,company}          = 3 x 4     = 12
 *   social     variant x social set              = 3 x 3     =  9
 *                                                            ------
 *                                                              69 combos
 *
 * The contact axis is enumerated as the full 2^3 vector because the three
 * fields are independently optional and the block that holds them is
 * conditional on ANY of them — the only way a "block appears when it should,
 * and only then" rule can be checked is to try every subset, including the
 * empty one.
 *
 * `variant` rides along every axis on purpose: the doc describes it as a
 * layout choice, so nothing structural may change with it. Whether the three
 * layouts actually LOOK different is a paint question and belongs to
 * tests/live/matrix/user-card-visual.spec.ts.
 */
import { describe, it, afterEach } from 'vitest';
import {
  Problems, captureEvents, click, cross, expectClean, mount, removeComponent, wait,
} from '../matrix-kit';
import {
  AVATAR_URL, STATUSES, VARIANTS, baseOf, checkActions, checkAvatar, checkContact,
  checkIdentity, checkSocial, socialControlsOf, type Profile, type SocialLink,
} from './user-card-support';
import '../../../packages/components/src/user-card/snice-user-card';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

async function mountCard(
  attrs: Record<string, string | number | boolean>,
  social: SocialLink[] = [],
): Promise<HTMLElement> {
  el = await mount('snice-user-card', attrs, { social });
  return el;
}

/** Every combo asserts the parts that exist unconditionally. */
function checkFrame(card: HTMLElement, problems: Problems): void {
  problems.check(baseOf(card) !== null, 'no [part="base"] container');
  checkActions(card, problems);
}

// ── Identity: variant x avatar x status ─────────────────────────────────────

describe('user-card matrix: identity', () => {
  for (const combo of cross({
    variant: VARIANTS,
    avatar: ['', AVATAR_URL] as const,
    status: STATUSES,
  })) {
    it(combo.id, async () => {
      const profile: Profile = {
        name: 'Sarah Johnson', avatar: combo.avatar, role: 'Engineer', company: 'Acme Corp',
      };
      const card = await mountCard({ ...profile, status: combo.status, variant: combo.variant });
      const problems = new Problems();

      checkFrame(card, problems);
      checkAvatar(card, profile, combo.status, problems);
      checkIdentity(card, profile, problems);

      expectClean(problems, combo.id);
    });
  }

  // The initials rule has cases of its own: one word, two words, more than two,
  // and the empty name that has no initials at all.
  for (const name of ['Sarah Johnson', 'Prince', 'ada b. lovelace king', '']) {
    it(`initials for "${name}"`, async () => {
      const profile: Profile = { name };
      const card = await mountCard({ name, status: 'online', variant: 'card' });
      const problems = new Problems();
      checkAvatar(card, profile, 'online', problems);
      checkIdentity(card, profile, problems);
      expectClean(problems, `initials/${name || 'empty'}`);
    });
  }
});

// ── Contact: variant x the 2^3 field vector ─────────────────────────────────

describe('user-card matrix: contact', () => {
  const FIELDS = [
    { email: '', phone: '', location: '' },
    { email: 'sarah@acme.test', phone: '', location: '' },
    { email: '', phone: '+1 555-0123', location: '' },
    { email: '', phone: '', location: 'San Francisco, CA' },
    { email: 'sarah@acme.test', phone: '+1 555-0123', location: '' },
    { email: 'sarah@acme.test', phone: '', location: 'San Francisco, CA' },
    { email: '', phone: '+1 555-0123', location: 'San Francisco, CA' },
    { email: 'sarah@acme.test', phone: '+1 555-0123', location: 'San Francisco, CA' },
  ] as const;

  const named = FIELDS.map(fields => ({
    ...fields,
    name: [
      fields.email && 'email', fields.phone && 'phone', fields.location && 'location',
    ].filter(Boolean).join('+') || 'none',
  }));

  for (const combo of cross({ variant: VARIANTS, fields: named })) {
    it(combo.id, async () => {
      const { name: _label, ...fields } = combo.fields;
      const profile: Profile = { name: 'Sarah Johnson', ...fields };
      const card = await mountCard({ ...profile, variant: combo.variant, status: 'online' });
      const problems = new Problems();

      checkFrame(card, problems);
      checkContact(card, profile, problems);
      // A contact block must never disturb the identity above it.
      checkIdentity(card, profile, problems);

      expectClean(problems, combo.id);
    });
  }
});

// ── Role line: variant x {role, company} ────────────────────────────────────

describe('user-card matrix: role line', () => {
  const PAIRS = [
    { name: 'neither', role: '', company: '' },
    { name: 'role', role: 'Engineer', company: '' },
    { name: 'company', role: '', company: 'Acme Corp' },
    { name: 'both', role: 'Engineer', company: 'Acme Corp' },
  ];

  for (const combo of cross({ variant: VARIANTS, pair: PAIRS })) {
    it(combo.id, async () => {
      const { name: _label, ...pair } = combo.pair;
      const profile: Profile = { name: 'Sarah Johnson', ...pair };
      const card = await mountCard({ ...profile, variant: combo.variant, status: 'busy' });
      const problems = new Problems();

      checkFrame(card, problems);
      checkIdentity(card, profile, problems);

      expectClean(problems, combo.id);
    });
  }
});

// ── Social: variant x link set, and the social-click contract ───────────────

describe('user-card matrix: social', () => {
  const SETS: Array<{ name: string; links: SocialLink[] }> = [
    { name: 'none', links: [] },
    { name: 'one', links: [{ platform: 'github', url: 'https://github.test/u' }] },
    {
      name: 'three',
      links: [
        { platform: 'github', url: 'https://github.test/u' },
        { platform: 'linkedin', url: 'https://linkedin.test/in/u' },
        // A platform with no built-in icon still has to render a control: the
        // doc types `platform` as a plain string, not an enum.
        { platform: 'mastodon', url: 'https://mastodon.test/@u' },
      ],
    },
  ];

  for (const combo of cross({ variant: VARIANTS, set: SETS })) {
    it(combo.id, async () => {
      const profile: Profile = { name: 'Sarah Johnson', role: 'Engineer' };
      const card = await mountCard(
        { ...profile, variant: combo.variant, status: 'away' },
        combo.set.links,
      );
      const problems = new Problems();

      checkFrame(card, problems);
      checkSocial(card, combo.set.links, problems);

      expectClean(problems, combo.id);
    });
  }

  it('clicking each social control emits its own platform and url', async () => {
    const links = SETS[2].links;
    const card = await mountCard({ name: 'Sarah Johnson', status: 'online' }, links);
    const problems = new Problems();
    const seen = captureEvents<{ platform: string; url: string }>(card, 'social-click');

    socialControlsOf(card).forEach(control => click(control));
    await wait(20);

    problems.equal(
      seen,
      links.map(link => ({ platform: link.platform, url: link.url })),
      'social-click details in click order',
    );
    expectClean(problems, 'social-click');
  });

  it('replacing the social array repaints the row', async () => {
    const card = await mountCard({ name: 'Sarah Johnson', status: 'online' }, SETS[2].links);
    const problems = new Problems();

    (card as any).social = SETS[1].links;
    await wait(40);
    checkSocial(card, SETS[1].links, problems);

    (card as any).social = [];
    await wait(40);
    checkSocial(card, [], problems);

    expectClean(problems, 'social/replace');
  });
});

// ── emitActionClick: the documented imperative escape hatch ─────────────────

describe('user-card matrix: action-click', () => {
  for (const action of ['follow', 'message', '']) {
    it(`emitActionClick("${action}") dispatches action-click`, async () => {
      const card = await mountCard({ name: 'Sarah Johnson', status: 'online' });
      const problems = new Problems();
      const seen = captureEvents<{ action: string }>(card, 'action-click');

      (card as any).emitActionClick(action);
      await wait(20);

      problems.equal(seen, [{ action }], 'action-click detail');
      expectClean(problems, `action-click/${action || 'empty'}`);
    });
  }
});
