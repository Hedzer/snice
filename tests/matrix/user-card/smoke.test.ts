/**
 * Smoke slice of the snice-user-card matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/user-card/, 69 combos) is excluded
 * from the default Vitest include and runs via `npm run test:matrix`. This file
 * is what the everyday loop pays for, and it lives at `smoke.test.ts` so it
 * stays collected.
 *
 * The marquee combos: the fully-populated profile (every optional field on at
 * once), the bare one (nothing set but a name — the half a rich-only smoke
 * would never notice), and one assertion per event the component owns.
 * Everything routes through the matrix's own oracle, so this file cannot
 * assert something weaker than the suite it stands in for.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach } from 'vitest';
import { Problems, captureEvents, click, expectClean, mount, removeComponent, wait } from '../matrix-kit';
import {
  AVATAR_URL, checkActions, checkAvatar, checkContact, checkIdentity, checkSocial,
  socialControlsOf, type Profile, type SocialLink,
} from './user-card-support';
import '../../../packages/components/src/user-card/snice-user-card';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const SOCIAL: SocialLink[] = [
  { platform: 'github', url: 'https://github.test/u' },
  { platform: 'linkedin', url: 'https://linkedin.test/in/u' },
];

describe('user-card matrix smoke', () => {
  it('a fully populated profile renders every documented region', async () => {
    const profile: Profile = {
      name: 'Sarah Johnson',
      avatar: AVATAR_URL,
      role: 'Engineer',
      company: 'Acme Corp',
      email: 'sarah@acme.test',
      phone: '+1 555-0123',
      location: 'San Francisco, CA',
    };
    el = await mount('snice-user-card', { ...profile, status: 'online' }, { social: SOCIAL });
    const problems = new Problems();

    checkAvatar(el, profile, 'online', problems);
    checkIdentity(el, profile, problems);
    checkContact(el, profile, problems);
    checkSocial(el, SOCIAL, problems);
    checkActions(el, problems);

    expectClean(problems, 'smoke/full');
  });

  it('a name-only profile falls back to initials and renders nothing else', async () => {
    const profile: Profile = { name: 'Sarah Johnson' };
    el = await mount('snice-user-card', { name: profile.name, variant: 'compact' }, { social: [] });
    const problems = new Problems();

    // status defaults to 'offline' per the documented default.
    checkAvatar(el, profile, 'offline', problems);
    checkIdentity(el, profile, problems);
    checkContact(el, profile, problems);
    checkSocial(el, [], problems);

    expectClean(problems, 'smoke/bare');
  });

  it('a social control emits social-click with its platform and url', async () => {
    el = await mount('snice-user-card', { name: 'Sarah Johnson' }, { social: SOCIAL });
    const problems = new Problems();
    const seen = captureEvents<{ platform: string; url: string }>(el, 'social-click');

    click(socialControlsOf(el)[1]);
    await wait(20);

    problems.equal(seen, [{ platform: 'linkedin', url: SOCIAL[1].url }], 'social-click detail');
    expectClean(problems, 'smoke/social-click');
  });

  it('emitActionClick dispatches action-click', async () => {
    el = await mount('snice-user-card', { name: 'Sarah Johnson' });
    const problems = new Problems();
    const seen = captureEvents<{ action: string }>(el, 'action-click');

    (el as any).emitActionClick('message');
    await wait(20);

    problems.equal(seen, [{ action: 'message' }], 'action-click detail');
    expectClean(problems, 'smoke/action-click');
  });
});
