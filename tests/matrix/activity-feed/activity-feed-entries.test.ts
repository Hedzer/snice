/**
 * Matrix slice ACTIVITY-FEED / ENTRY RENDERING — one activity's documented
 * fields, crossed with both halves of the dual API.
 *
 * Dimensions: target (2) x type (2) x avatar (2) x timestamp (2: parseable /
 * unparseable) x source (2) = 32 combos, plus the documented `type` tokens
 * against `icon` (9). 41 cases.
 *
 * Contract asserted (docs/ai/components/activity-feed.md):
 *   · An entry renders its actor name, its action and its target.
 *   · `timestamp` — "unparseable values display as-is"; a parseable one is
 *     rendered relatively (the docs call the refresh a "relative-timestamp
 *     refresh"), so it is NOT the raw string.
 *   · `avatar` — an image of that URL; without one the entry falls back to the
 *     actor's initials ("falls back to initials if the image fails to load").
 *   · `icon` — "registry name ('star'), URL, or text/emoji"; `type` —
 *     "create|update|delete|comment|deploy|login|upload|download map to
 *     registry icons"; an explicit `icon` is the more specific instruction and
 *     wins over the type mapping.
 *   · Every entry renders SOMETHING in its `icon` part, typed or not.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach } from 'vitest';
import { cleanup, cross, parts, part, text, Problems, expectClean } from './matrix-utils';
import { TYPES, AVATAR, SOURCES, ago, mountFeed } from './activity-feed-support';

const UNPARSEABLE = 'sometime last week';
const PARSEABLE = ago(2 * 3_600_000);

describe('activity-feed matrix: entry rendering', () => {
  afterEach(() => cleanup());

  for (const combo of cross({
    target: [false, true],
    typed: [false, true],
    avatar: [false, true],
    stamp: ['parseable', 'unparseable'] as const,
    source: SOURCES,
  })) {
    it(`${combo.id}: the entry renders its documented fields`, async () => {
      const timestamp = combo.stamp === 'parseable' ? PARSEABLE : UNPARSEABLE;
      const activity = {
        id: 'a1',
        actor: { name: 'Alice Ray', ...(combo.avatar ? { avatar: AVATAR } : {}) },
        action: 'created',
        ...(combo.target ? { target: 'Project Alpha' } : {}),
        timestamp,
        ...(combo.typed ? { type: 'create' } : {}),
      };
      const el = await mountFeed({ activities: [activity], source: combo.source });
      const p = new Problems();

      const entry = parts(el, 'entry')[0];
      if (!entry) {
        p.say('the activity rendered no entry');
        expectClean(p, combo.id);
        return;
      }

      const line = text(entry);
      p.ok(line.includes(activity.actor.name), `entry "${line}" omits the actor name`);
      p.ok(line.includes(activity.action), `entry "${line}" omits the action`);
      if (combo.target) {
        p.ok(line.includes('Project Alpha'), `entry "${line}" omits the target`);
      }

      // The timestamp part: verbatim when unparseable, relative when not.
      const stamp = text(part(el, 'timestamp'));
      if (combo.stamp === 'unparseable') {
        p.eq('unparseable timestamp', stamp, UNPARSEABLE);
      } else {
        p.ok(stamp.length > 0, 'parseable timestamp rendered nothing');
        p.ok(stamp !== timestamp,
          `parseable timestamp rendered the raw string "${stamp}" instead of a relative one`);
      }

      // The avatar: the declared image, or the actor's initials.
      const img = entry.querySelector('img');
      if (combo.avatar) {
        p.ok(img !== null, 'declared avatar rendered no image');
        p.eq('avatar src', img?.getAttribute('src'), AVATAR);
      } else {
        p.ok(img === null, `an actor with no avatar rendered <img src="${img?.getAttribute('src')}">`);
        p.ok(line.includes('AR'), `initials fallback missing from "${line}"`);
      }

      // Every entry has an icon, typed or not.
      const icon = part(el, 'icon');
      p.ok(icon !== null, 'no part="icon"');
      p.ok((icon?.innerHTML ?? '').trim().length > 0, 'part="icon" rendered nothing');

      expectClean(p, combo.id);
    });
  }

  // ── icon vs type: the documented icon sources ─────────────────────────────

  for (const type of TYPES) {
    it(`type=${type}: the documented type token renders an icon`, async () => {
      const el = await mountFeed({
        activities: [{
          id: 'a1', actor: { name: 'Alice' }, action: 'did', timestamp: PARSEABLE, type,
        }],
      });
      const p = new Problems();
      const icon = part(el, 'icon');
      p.ok(icon !== null, 'no part="icon"');
      p.ok((icon?.innerHTML ?? '').trim().length > 0, `type="${type}" rendered an empty icon`);
      // The type is also surfaced to the reader as the entry's badge, which is
      // what makes the filter bar's tokens recognisable.
      p.ok(text(parts(el, 'entry')[0]).includes(type),
        `type="${type}" is not shown on the entry`);
      expectClean(p, `type=${type}`);
    });
  }

  it('an explicit icon wins over the type mapping', async () => {
    const p = new Problems();

    const typed = await mountFeed({
      activities: [{ id: 'a1', actor: { name: 'A' }, action: 'x', timestamp: PARSEABLE, type: 'create' }],
    });
    const typedIcon = part(typed, 'icon')!.innerHTML;
    cleanup();

    const explicit = await mountFeed({
      activities: [{
        id: 'a1', actor: { name: 'A' }, action: 'x', timestamp: PARSEABLE,
        type: 'create', icon: '🚀',
      }],
    });
    const explicitIcon = part(explicit, 'icon')!;

    p.ok(text(explicitIcon).includes('🚀'),
      `an explicit icon rendered "${text(explicitIcon)}"`);
    p.ok(explicitIcon.innerHTML !== typedIcon,
      'an explicit icon rendered the same markup as the type mapping');

    expectClean(p, 'icon-precedence');
  });
});
