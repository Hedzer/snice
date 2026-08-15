/**
 * Matrix slice COMMENTS / STRUCTURE — the rendered thread crossed against every
 * documented switch.
 *
 * Dimensions (docs/ai/components/comments.md § Properties):
 *   allowReplies (2) x allowLikes (2) x maxDepth (0,1,2,3) x ownership (2)
 *   x avatars (2) = 64 combos, each mounting a 4-level reply chain so every
 *   depth 0..3 is present and `maxDepth` has something to bound.
 *
 * Plus the mixed-authorship case (16) and the empty/degenerate cases, all
 * judged by the same oracle — `threadProblems` — so no case here can assert
 * something weaker than the suite it belongs to.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, product, unmountAll, shadow } from '../matrix-utils';
import {
  chain, twoAuthors, config, attrsOf, propsOf, threadProblems, flatten,
  type CommentsConfig, type Comment,
} from './comments-support';

const ME = 'Alice';
const THEM = 'Bob';

async function mountComments(c: CommentsConfig, comments: Comment[]) {
  return mount<HTMLElement>('snice-comments', attrsOf(c), '', propsOf(c, comments));
}

describe('comments matrix: structure', () => {
  afterEach(() => unmountAll());

  // ── The full cross ────────────────────────────────────────────────────────

  const combos = product({
    allowReplies: [true, false],
    allowLikes: [true, false],
    maxDepth: [0, 1, 2, 3],
    owned: [true, false],
    avatars: [true, false],
  });

  for (const combo of combos) {
    const id = `replies=${combo.allowReplies} likes=${combo.allowLikes}`
      + ` maxDepth=${combo.maxDepth} owned=${combo.owned} avatars=${combo.avatars}`;

    it(id, async () => {
      const author = combo.owned ? ME : THEM;
      const comments = chain({ depth: 3, author, avatars: combo.avatars, liked: combo.allowLikes });
      const c = config({
        currentUser: ME,
        allowReplies: combo.allowReplies,
        allowLikes: combo.allowLikes,
        maxDepth: combo.maxDepth,
      });
      const el = await mountComments(c, comments);
      expect(threadProblems(el, c, comments), `combo ${id}`).toEqual([]);
    });
  }

  // ── Mixed authorship: ownership is per-comment, not per-thread ────────────

  const mixed = product({
    allowReplies: [true, false],
    allowLikes: [true, false],
    maxDepth: [1, 3],
    currentUser: [ME, ''],
  });

  for (const combo of mixed) {
    const id = `mixed authors replies=${combo.allowReplies} likes=${combo.allowLikes}`
      + ` maxDepth=${combo.maxDepth} currentUser="${combo.currentUser}"`;

    it(id, async () => {
      const comments = twoAuthors(ME, THEM);
      const c = config(combo);
      const el = await mountComments(c, comments);
      expect(threadProblems(el, c, comments), `combo ${id}`).toEqual([]);
    });
  }

  // ── Degenerate threads ────────────────────────────────────────────────────

  it('empty thread renders the input area and no comments', async () => {
    const c = config({ currentUser: ME });
    const el = await mountComments(c, []);
    expect(threadProblems(el, c, [])).toEqual([]);
    expect(shadow(el).querySelectorAll('.comment')).toHaveLength(0);
  });

  it('an empty replies array is not a reply level', async () => {
    const comments: Comment[] = [
      { id: 'a', author: THEM, text: 'Solo', timestamp: new Date().toISOString(), likes: 0, liked: false, replies: [] },
    ];
    const c = config({ currentUser: ME });
    const el = await mountComments(c, comments);
    expect(flatten(comments)).toHaveLength(1);
    expect(threadProblems(el, c, comments)).toEqual([]);
  });

  it('a branching thread flattens pre-order', async () => {
    const stamp = new Date().toISOString();
    const comments: Comment[] = [
      {
        id: 'p', author: THEM, text: 'Parent', timestamp: stamp, likes: 0, liked: false,
        replies: [
          { id: 'r1', author: ME, text: 'First reply', timestamp: stamp, likes: 0, liked: false },
          { id: 'r2', author: THEM, text: 'Second reply', timestamp: stamp, likes: 4, liked: true },
        ],
      },
      { id: 'q', author: ME, text: 'Sibling', timestamp: stamp, likes: 0, liked: false },
    ];
    const c = config({ currentUser: ME });
    const el = await mountComments(c, comments);
    expect(threadProblems(el, c, comments)).toEqual([]);
  });
});
