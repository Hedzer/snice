/**
 * Smoke slice of the snice-comments matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full comments cross runs only via
 * `npm run test:matrix`. This file lives at `smoke.test.ts` so it stays
 * collected, and it buys only the marquee combos:
 *
 *   · the default thread — every affordance on, so a regression in any of them
 *     shows up somewhere;
 *   · `maxDepth` at its boundary, the only rule that reads a comment's DEPTH;
 *   · both switches off, the two `<if>` branches around the action row;
 *   · a thread I do not own, the "delete only on own comments" rule;
 *   · the three documented mutations, each with its documented event.
 *
 * Every structural assertion routes through the matrix's own `threadProblems`
 * oracle, so this file cannot drift into something weaker than the suite it
 * stands in for. BUDGET: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, captureEvents, click } from '../matrix-utils';
import {
  chain, config, attrsOf, propsOf, threadProblems, readThread, byId, idsOf, stateOf, EVENTS,
  type CommentsConfig, type Comment,
} from './comments-support';

const ME = 'Alice';
const THEM = 'Bob';

async function mountThread(c: CommentsConfig, comments: Comment[]) {
  return mount<HTMLElement>('snice-comments', attrsOf(c), '', propsOf(c, comments));
}

describe('comments matrix smoke', () => {
  afterEach(() => unmountAll());

  const marquee: Array<[string, CommentsConfig, Comment[]]> = [
    [
      'default thread, everything on',
      config({ currentUser: ME }),
      chain({ depth: 3, author: ME, avatars: true, liked: true }),
    ],
    [
      'maxDepth boundary hides Reply at the last level',
      config({ currentUser: ME, maxDepth: 1 }),
      chain({ depth: 2, author: ME, avatars: false, liked: false }),
    ],
    [
      'maxDepth=0 offers no reply anywhere',
      config({ currentUser: ME, maxDepth: 0 }),
      chain({ depth: 1, author: ME, avatars: false, liked: false }),
    ],
    [
      'both switches off',
      config({ currentUser: ME, allowLikes: false, allowReplies: false }),
      chain({ depth: 2, author: ME, avatars: false, liked: true }),
    ],
    [
      "someone else's thread offers no delete",
      config({ currentUser: ME }),
      chain({ depth: 2, author: THEM, avatars: false, liked: false }),
    ],
    [
      'empty thread',
      config({ currentUser: ME }),
      [],
    ],
  ];

  for (const [id, c, comments] of marquee) {
    it(id, async () => {
      const el = await mountThread(c, comments);
      expect(threadProblems(el, c, comments), `combo ${id}`).toEqual([]);
    });
  }

  it('likeComment toggles and emits comment-like', async () => {
    const c = config({ currentUser: ME });
    const el = await mountThread(c, chain({ depth: 1, author: ME, avatars: false, liked: false }));
    const recorder = captureEvents(el, [...EVENTS]);

    click(byId(el, 'c1').likeButton);
    await (el as any).rendered;

    expect(recorder.types()).toEqual(['comment-like']);
    expect(recorder.events[0].detail).toEqual({ id: 'c1', likes: 1, liked: true });
    expect(stateOf(el, 'c1')!.liked).toBe(true);
  });

  it('addComment emits comment-add at top level and comment-reply under a parent', async () => {
    const c = config({ currentUser: ME, maxDepth: 5 });
    const el = await mountThread(c, chain({ depth: 1, author: ME, avatars: false, liked: false }));
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).addComment('Top');
    (el as any).addComment('Nested', 'c0');
    await (el as any).rendered;

    expect(recorder.types()).toEqual(['comment-add', 'comment-reply']);
    expect(recorder.events[1].detail.parentId).toBe('c0');
    expect(readThread(el).some(r => r.text === 'Nested')).toBe(true);
  });

  it('deleteComment removes the subtree and emits comment-delete', async () => {
    const c = config({ currentUser: ME });
    const el = await mountThread(c, chain({ depth: 2, author: ME, avatars: false, liked: false }));
    const recorder = captureEvents(el, [...EVENTS]);

    click(byId(el, 'c1').deleteButton);
    await (el as any).rendered;

    expect(recorder.types()).toEqual(['comment-delete']);
    expect(recorder.events[0].detail).toEqual({ id: 'c1' });
    expect(idsOf(el)).toEqual(['c0']);
  });
});
