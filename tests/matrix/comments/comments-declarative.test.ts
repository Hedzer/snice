/**
 * Matrix slice COMMENTS / DECLARATIVE — the authored-markup channel.
 *
 * docs/ai/components/comments.md § Declarative documents a second way to supply
 * the thread: `<snice-comment>` children, whose attributes are
 * `author`, `avatar`, `timestamp`, `likes` (number), `liked` (boolean), `id`,
 * whose text content is the comment body, and whose NESTED `<snice-comment>`
 * children become `replies`.
 *
 * That is a parser, so it gets a cross of its own: attribute presence (avatar,
 * likes, liked) x sibling count x the switches that decide what the parsed
 * thread then renders. Every case is judged by the same `threadProblems` oracle
 * the property channel is judged by — the two channels must produce the same
 * rendered thread, which is the whole point of documenting both.
 *
 * ── Why NESTED children are not asserted here ───────────────────────────────
 *
 * The parser selects a comment's own children with `:scope > snice-comment`.
 * happy-dom does not implement the `:scope` combinator: it matches DESCENDANTS,
 * so in this environment every comment in a nested chain is also collected as a
 * top level one and the parsed thread is duplicated. That is an ENVIRONMENT
 * limitation, not a divergence from the docs — a real browser scopes the
 * selector correctly — so asserting it here would record a false finding.
 * Nested `<snice-comment>` parsing is therefore asserted in the visual tier
 * (`tests/live/matrix/comments/`), where the selector behaves.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product } from '../matrix-utils';
import { config, threadProblems, readThread, type Comment, type CommentsConfig } from './comments-support';

const ME = 'Alice';
const THEM = 'Bob';
const STAMP = '2026-01-15T10:30:00Z';
const LATER = '2026-01-15T11:00:00Z';

async function mountMarkup(c: CommentsConfig, html: string) {
  const attrs: Record<string, any> = { 'max-depth': c.maxDepth };
  if (c.currentUser) attrs['current-user'] = c.currentUser;
  if (c.allowReplies) attrs['allow-replies'] = true;
  if (c.allowLikes) attrs['allow-likes'] = true;
  const el = await mount<HTMLElement>('snice-comments', attrs, html);
  // `allow-replies`/`allow-likes` default to true, so an absent attribute must
  // still cross the property channel to express the `false` half of the axis.
  (el as any).allowReplies = c.allowReplies;
  (el as any).allowLikes = c.allowLikes;
  await (el as any).rendered;
  return el;
}

describe('comments matrix: declarative children', () => {
  afterEach(() => unmountAll());

  // ── Attribute parsing, crossed with the rendering switches ───────────────

  for (const combo of product({
    avatar: [false, true],
    likes: [0, 3],
    liked: [false, true],
    allowLikes: [true, false],
    allowReplies: [true, false],
  })) {
    const id = `avatar=${combo.avatar} likes=${combo.likes} liked=${combo.liked}`
      + ` allowLikes=${combo.allowLikes} allowReplies=${combo.allowReplies}`;

    it(id, async () => {
      const markup = `
        <snice-comment id="a" author="${THEM}" timestamp="${STAMP}"
          ${combo.avatar ? 'avatar="https://cdn.test/bob.png"' : ''}
          likes="${combo.likes}" ${combo.liked ? 'liked' : ''}>Great article!</snice-comment>
      `;
      const c = config({
        currentUser: ME,
        allowLikes: combo.allowLikes,
        allowReplies: combo.allowReplies,
      });
      const el = await mountMarkup(c, markup);

      // The thread the DOCUMENTED attribute mapping describes.
      const expected: Comment[] = [{
        id: 'a',
        author: THEM,
        text: 'Great article!',
        timestamp: STAMP,
        likes: combo.likes,
        liked: combo.liked,
        ...(combo.avatar ? { avatar: 'https://cdn.test/bob.png' } : {}),
      }];

      expect((el as any).comments, `combo ${id}: parsed thread`).toEqual(expected);
      expect(threadProblems(el, c, expected), `combo ${id}`).toEqual([]);
    });
  }

  // ── Sibling threads ──────────────────────────────────────────────────────

  for (const maxDepth of [0, 1, 3]) {
    it(`sibling <snice-comment> children become top-level comments (maxDepth=${maxDepth})`, async () => {
      const markup = `
        <snice-comment id="a" author="${THEM}" timestamp="${STAMP}">Great article!</snice-comment>
        <snice-comment id="c" author="Charlie" timestamp="${LATER}" likes="2">Very informative.</snice-comment>
      `;
      const c = config({ currentUser: ME, maxDepth });
      const el = await mountMarkup(c, markup);

      const expected: Comment[] = [
        { id: 'a', author: THEM, text: 'Great article!', timestamp: STAMP, likes: 0, liked: false },
        { id: 'c', author: 'Charlie', text: 'Very informative.', timestamp: LATER, likes: 2, liked: false },
      ];

      expect((el as any).comments).toEqual(expected);
      expect(threadProblems(el, c, expected)).toEqual([]);
      expect(readThread(el).map(r => [r.id, r.depth])).toEqual([['a', 0], ['c', 0]]);
    });
  }

  it('a comment authored by the current user is deletable through the markup channel too', async () => {
    const markup = `<snice-comment id="a" author="${ME}" timestamp="${STAMP}">Mine</snice-comment>`;
    const c = config({ currentUser: ME });
    const el = await mountMarkup(c, markup);
    expect(readThread(el)[0].deleteButton).not.toBeNull();
  });

  it('no children leaves an empty thread', async () => {
    const c = config({ currentUser: ME });
    const el = await mountMarkup(c, '');
    expect((el as any).comments).toEqual([]);
    expect(threadProblems(el, c, [])).toEqual([]);
  });
});
