/**
 * Matrix slice COMMENTS / INTERACTION — the documented methods and events,
 * crossed with thread position and with the switches that gate the affordance
 * a user would reach them through.
 *
 * Contract asserted (docs/ai/components/comments.md § Methods, § Events):
 *   · `likeComment(id)` TOGGLES `liked` and moves `likes` by one, and emits
 *     `comment-like -> { id, likes, liked }` carrying the NEW state.
 *   · `addComment(text)` appends a top-level comment authored by `currentUser`
 *     and emits `comment-add -> { id, text, author }`.
 *   · `addComment(text, parentId)` appends a REPLY and emits
 *     `comment-reply -> { id, text, author, parentId }` — a different event from
 *     the top-level one, which is why both are documented separately.
 *   · `deleteComment(id)` removes the comment and emits
 *     `comment-delete -> { id }`. A comment is a thread node, so deleting it
 *     takes its replies with it.
 *   · Every one of those is reachable from the rendered affordance whose switch
 *     is on, and from no affordance whose switch is off.
 *
 * Dimensions: 4 documented operations x thread depth (0,1,2) x the gating
 * switch, ~50 cases.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product, captureEvents, click, shadow } from '../matrix-utils';
import {
  chain, config, attrsOf, propsOf, byId, idsOf, stateOf, readThread, EVENTS,
  type CommentsConfig, type Comment,
} from './comments-support';

const ME = 'Alice';

async function mountThread(c: CommentsConfig, comments: Comment[]) {
  return mount<HTMLElement>('snice-comments', attrsOf(c), '', propsOf(c, comments));
}

/** A 3-level chain authored by `author`, ids c0/c1/c2. */
const thread = (author: string, liked: boolean) =>
  chain({ depth: 2, author, avatars: false, liked });

describe('comments matrix: interaction', () => {
  afterEach(() => unmountAll());

  // ── likeComment ───────────────────────────────────────────────────────────

  for (const combo of product({ depth: [0, 1, 2], liked: [false, true] })) {
    const id = `likeComment toggles at depth ${combo.depth} from liked=${combo.liked}`;

    it(id, async () => {
      const comments = thread(ME, combo.liked);
      const c = config({ currentUser: ME });
      const el = await mountThread(c, comments);
      const target = `c${combo.depth}`;
      const before = stateOf(el, target)!;
      const recorder = captureEvents(el, [...EVENTS]);

      (el as any).likeComment(target);
      await (el as any).rendered;

      const wantLiked = !combo.liked;
      const wantLikes = (before.likes ?? 0) + (wantLiked ? 1 : -1);
      const after = stateOf(el, target)!;

      expect(recorder.types(), id).toEqual(['comment-like']);
      expect(recorder.events[0].detail, id).toEqual({ id: target, likes: wantLikes, liked: wantLiked });
      expect(after.liked, `${id}: liked`).toBe(wantLiked);
      expect(after.likes, `${id}: likes`).toBe(wantLikes);
    });
  }

  for (const depth of [0, 1, 2]) {
    it(`the like affordance at depth ${depth} calls the documented toggle`, async () => {
      const comments = thread(ME, false);
      const c = config({ currentUser: ME });
      const el = await mountThread(c, comments);
      const recorder = captureEvents(el, [...EVENTS]);

      click(byId(el, `c${depth}`).likeButton);
      await (el as any).rendered;

      expect(recorder.types()).toEqual(['comment-like']);
      expect(recorder.events[0].detail).toEqual({ id: `c${depth}`, likes: 1, liked: true });
      expect(stateOf(el, `c${depth}`)!.liked).toBe(true);
    });
  }

  it('likeComment with an unknown id is inert', async () => {
    const comments = thread(ME, false);
    const c = config({ currentUser: ME });
    const el = await mountThread(c, comments);
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).likeComment('nope');
    await (el as any).rendered;

    expect(recorder.types()).toEqual([]);
    expect(idsOf(el)).toEqual(['c0', 'c1', 'c2']);
  });

  it('allowLikes=false leaves no like affordance to reach', async () => {
    const c = config({ currentUser: ME, allowLikes: false });
    const el = await mountThread(c, thread(ME, false));
    expect(readThread(el).map(r => r.likeButton)).toEqual([null, null, null]);
  });

  // ── addComment: top level vs reply ────────────────────────────────────────

  it('addComment appends a top-level comment and emits comment-add', async () => {
    const c = config({ currentUser: ME });
    const el = await mountThread(c, thread(ME, false));
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).addComment('A fresh take');
    await (el as any).rendered;

    expect(recorder.types()).toEqual(['comment-add']);
    const detail = recorder.events[0].detail;
    expect(detail.text).toBe('A fresh take');
    expect(detail.author).toBe(ME);
    expect(typeof detail.id).toBe('string');
    expect(idsOf(el)).toEqual(['c0', 'c1', 'c2', detail.id]);
    expect(stateOf(el, detail.id)!.text).toBe('A fresh take');
  });

  for (const depth of [0, 1, 2]) {
    it(`addComment(text, "c${depth}") emits comment-reply and nests one level deeper`, async () => {
      const c = config({ currentUser: ME, maxDepth: 5 });
      const el = await mountThread(c, thread(ME, false));
      const recorder = captureEvents(el, [...EVENTS]);

      (el as any).addComment('Replying', `c${depth}`);
      await (el as any).rendered;

      expect(recorder.types()).toEqual(['comment-reply']);
      const detail = recorder.events[0].detail;
      expect(detail.parentId).toBe(`c${depth}`);
      expect(detail.text).toBe('Replying');
      expect(detail.author).toBe(ME);

      const rendered = readThread(el);
      const parent = rendered.find(r => r.id === `c${depth}`)!;
      const reply = rendered.find(r => r.id === detail.id)!;
      expect(reply.depth, 'a reply sits one level below its parent').toBe(parent.depth + 1);
    });
  }

  it('addComment with an unknown parentId adds nothing', async () => {
    const c = config({ currentUser: ME });
    const el = await mountThread(c, thread(ME, false));
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).addComment('Orphan', 'nope');
    await (el as any).rendered;

    expect(recorder.types()).toEqual([]);
    expect(idsOf(el)).toEqual(['c0', 'c1', 'c2']);
  });

  // ── The reply composer ───────────────────────────────────────────────────

  for (const depth of [0, 1]) {
    it(`the reply affordance at depth ${depth} opens a composer that emits comment-reply`, async () => {
      const c = config({ currentUser: ME, maxDepth: 5 });
      const el = await mountThread(c, thread(ME, false));

      // Closed until asked for: the composer is a reply-in-progress, not chrome.
      expect(byId(el, `c${depth}`).replyInput).toBeNull();

      click(byId(el, `c${depth}`).replyButton);
      await (el as any).rendered;

      const open = byId(el, `c${depth}`);
      expect(open.replyInput, 'reply composer did not open').not.toBeNull();
      expect(readThread(el).filter(r => r.replyInput).map(r => r.id),
        'only the replied-to comment composes').toEqual([`c${depth}`]);

      const recorder = captureEvents(el, [...EVENTS]);
      open.replyInput!.value = 'From the composer';
      open.replyInput!.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      click(open.replySubmit);
      await (el as any).rendered;

      expect(recorder.types()).toEqual(['comment-reply']);
      expect(recorder.events[0].detail.parentId).toBe(`c${depth}`);
      expect(recorder.events[0].detail.text).toBe('From the composer');
      expect(byId(el, `c${depth}`).replyInput, 'composer stayed open after submit').toBeNull();
    });
  }

  it('cancelling a reply closes the composer and adds nothing', async () => {
    const c = config({ currentUser: ME });
    const el = await mountThread(c, thread(ME, false));

    click(byId(el, 'c0').replyButton);
    await (el as any).rendered;
    const open = byId(el, 'c0');
    open.replyInput!.value = 'Never mind';
    open.replyInput!.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    const recorder = captureEvents(el, [...EVENTS]);
    click(open.replyCancel);
    await (el as any).rendered;

    expect(recorder.types()).toEqual([]);
    expect(byId(el, 'c0').replyInput).toBeNull();
    expect(idsOf(el)).toEqual(['c0', 'c1', 'c2']);
  });

  // ── deleteComment ────────────────────────────────────────────────────────

  for (const depth of [0, 1, 2]) {
    it(`deleteComment("c${depth}") removes that node and its replies`, async () => {
      const c = config({ currentUser: ME });
      const el = await mountThread(c, thread(ME, false));
      const recorder = captureEvents(el, [...EVENTS]);

      (el as any).deleteComment(`c${depth}`);
      await (el as any).rendered;

      expect(recorder.types()).toEqual(['comment-delete']);
      expect(recorder.events[0].detail).toEqual({ id: `c${depth}` });

      const survivors = ['c0', 'c1', 'c2'].slice(0, depth);
      expect(idsOf(el), 'a deleted node takes its subtree with it').toEqual(survivors);
      expect(readThread(el).map(r => r.id)).toEqual(survivors);
    });
  }

  for (const depth of [0, 1, 2]) {
    it(`the delete affordance at depth ${depth} deletes only that comment's subtree`, async () => {
      const c = config({ currentUser: ME });
      const el = await mountThread(c, thread(ME, false));
      const recorder = captureEvents(el, [...EVENTS]);

      click(byId(el, `c${depth}`).deleteButton);
      await (el as any).rendered;

      expect(recorder.types()).toEqual(['comment-delete']);
      expect(idsOf(el)).toEqual(['c0', 'c1', 'c2'].slice(0, depth));
    });
  }

  it('deleteComment with an unknown id is inert', async () => {
    const c = config({ currentUser: ME });
    const el = await mountThread(c, thread(ME, false));
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).deleteComment('nope');
    await (el as any).rendered;

    expect(recorder.types()).toEqual([]);
    expect(idsOf(el)).toEqual(['c0', 'c1', 'c2']);
  });

  it('a comment authored by someone else offers no delete affordance', async () => {
    const c = config({ currentUser: ME });
    const el = await mountThread(c, thread('Bob', false));
    expect(readThread(el).map(r => r.deleteButton)).toEqual([null, null, null]);
  });

  // ── The top-level composer in the input area ─────────────────────────────

  it('the input-area composer posts a top-level comment', async () => {
    const c = config({ currentUser: ME });
    const el = await mountThread(c, []);
    const recorder = captureEvents(el, [...EVENTS]);

    const input = shadow(el).querySelector<HTMLTextAreaElement>('.comments__new-input')!;
    input.value = 'First!';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    click(shadow(el).querySelector('.comments__submit'));
    await (el as any).rendered;

    expect(recorder.types()).toEqual(['comment-add']);
    expect(recorder.events[0].detail.text).toBe('First!');
    expect(recorder.events[0].detail.author).toBe(ME);
    expect(readThread(el).map(r => r.text)).toEqual(['First!']);
  });
});
