/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-comments matrix — fixtures and the documented-behaviour oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted below is read off `docs/ai/components/comments.md` and
 * `packages/components/src/comments/snice-comments.types.ts`, never off what the
 * component happens to emit:
 *
 *   · `comments: Comment[]` is a THREAD — `replies` nest, so the rendered list
 *     is the pre-order flattening of that tree. A comment at depth d is the
 *     d-th generation of `replies`.
 *   · `allowLikes` gates the like affordance; the doc's `Comment.likes` /
 *     `Comment.liked` are what it reads and writes.
 *   · `allowReplies` gates the reply affordance, and `maxDepth` bounds how deep
 *     one may be offered: a comment already sitting at `maxDepth` cannot be
 *     replied to, because its reply would land past the documented maximum.
 *   · `currentUser` decides ownership — "Delete only on own comments" is the
 *     doc's accessibility line, so the delete affordance appears exactly on
 *     comments whose `author` equals `currentUser`.
 *   · `avatar?` is optional; the doc advertises "avatars", so a comment with an
 *     avatar shows that image and one without still shows an avatar slot (the
 *     initials fallback) rather than nothing.
 *   · "Relative timestamps" — the rendered time is a RELATIVE rendering of the
 *     ISO `timestamp`, never the raw ISO string.
 *   · Documented parts: `base`, `input-area`, `list`.
 *   · Documented methods `addComment` / `deleteComment` / `likeComment` and the
 *     four documented events with their exact detail shapes.
 *
 * The oracle collects EVERY violation of a combo and the test asserts the list
 * is empty, so one run reports the whole story (the table matrix's contract).
 */
import { shadow, text } from '../matrix-utils';
import '../../../packages/components/src/comments/snice-comments';
import type { Comment } from '../../../packages/components/src/comments/snice-comments.types';

export type { Comment };

// ── Documented defaults (docs/ai/components/comments.md § Properties) ───────

export const DEFAULTS = {
  currentUser: '',
  allowReplies: true,
  allowLikes: true,
  maxDepth: 3,
} as const;

/** Documented event names, in the order the doc lists them. */
export const EVENTS = ['comment-add', 'comment-reply', 'comment-delete', 'comment-like'] as const;

// ── Fixtures ────────────────────────────────────────────────────────────────

/** A fixed instant so relative-timestamp expectations are deterministic. */
export const NOW = Date.now();
export const minutesAgo = (n: number): string => new Date(NOW - n * 60_000).toISOString();

export interface ThreadOptions {
  /** Nesting depth of the deepest reply chain (0 = top level only). */
  depth: number;
  /** Author of every comment in the chain. */
  author: string;
  /** Give every comment an avatar URL. */
  avatars: boolean;
  /** Seed `likes`/`liked` so the like-count branch is exercised. */
  liked: boolean;
}

/**
 * A single chain `root -> reply -> reply …` of the requested depth. A chain (not
 * a bush) is deliberate: `maxDepth` is a property of the CHAIN, and one comment
 * per level makes "which levels offer Reply" a readable list.
 */
export function chain(options: ThreadOptions): Comment[] {
  const build = (level: number): Comment => {
    const node: Comment = {
      id: `c${level}`,
      author: options.author,
      text: `Comment at depth ${level}`,
      timestamp: minutesAgo(5 + level),
      likes: options.liked ? 2 : 0,
      liked: options.liked,
    };
    if (options.avatars) node.avatar = `https://cdn.test/${level}.png`;
    if (level < options.depth) node.replies = [build(level + 1)];
    return node;
  };
  return [build(0)];
}

/** Two independent top-level comments by different authors, one reply each. */
export function twoAuthors(mine: string, theirs: string): Comment[] {
  return [
    {
      id: 'mine',
      author: mine,
      text: 'My comment',
      timestamp: minutesAgo(3),
      likes: 1,
      liked: true,
      replies: [
        { id: 'mine-reply', author: theirs, text: 'Their reply', timestamp: minutesAgo(2), likes: 0, liked: false },
      ],
    },
    {
      id: 'theirs',
      author: theirs,
      text: 'Their comment',
      timestamp: minutesAgo(1),
      likes: 0,
      liked: false,
      replies: [
        { id: 'theirs-reply', author: mine, text: 'My reply', timestamp: minutesAgo(0), likes: 5, liked: false },
      ],
    },
  ];
}

// ── The documented flattening ───────────────────────────────────────────────

export interface Flat {
  comment: Comment;
  depth: number;
}

/** Pre-order walk of the documented thread: a parent, then its replies. */
export function flatten(comments: Comment[], depth = 0): Flat[] {
  const out: Flat[] = [];
  for (const comment of comments) {
    out.push({ comment, depth });
    if (comment.replies?.length) out.push(...flatten(comment.replies, depth + 1));
  }
  return out;
}

// ── Configuration vector ────────────────────────────────────────────────────

export interface CommentsConfig {
  currentUser: string;
  allowReplies: boolean;
  allowLikes: boolean;
  maxDepth: number;
}

export const config = (overrides: Partial<CommentsConfig> = {}): CommentsConfig => ({
  ...DEFAULTS,
  ...overrides,
});

/** Documented attribute names for the scalar half of the vector. */
export function attrsOf(c: CommentsConfig): Record<string, any> {
  const attrs: Record<string, any> = { 'max-depth': c.maxDepth };
  if (c.currentUser) attrs['current-user'] = c.currentUser;
  return attrs;
}

/** Properties for the parts with no attribute form, plus the boolean switches. */
export function propsOf(c: CommentsConfig, comments: Comment[]): Record<string, any> {
  return {
    allowReplies: c.allowReplies,
    allowLikes: c.allowLikes,
    comments,
  };
}

// ── Oracle ──────────────────────────────────────────────────────────────────

/** Documented gating of the reply affordance. */
export const expectsReply = (c: CommentsConfig, depth: number): boolean =>
  c.allowReplies && depth < c.maxDepth;

/** "Delete only on own comments" — ownership is `author === currentUser`. */
export const expectsDelete = (c: CommentsConfig, comment: Comment): boolean =>
  c.currentUser !== '' && comment.author === c.currentUser;

/** The like affordance exists exactly when likes are allowed. */
export const expectsLike = (c: CommentsConfig): boolean => c.allowLikes;

/** The like COUNT is only meaningful once a comment has likes. */
export const expectsLikeCount = (c: CommentsConfig, comment: Comment): boolean =>
  c.allowLikes && (comment.likes ?? 0) > 0;

/** A relative timestamp is anything that is not the raw ISO string it came from. */
export function isRelative(rendered: string, iso: string): boolean {
  return rendered !== '' && rendered !== iso;
}

// ── Reading the rendered thread ─────────────────────────────────────────────

export interface RenderedComment {
  id: string;
  author: string;
  text: string;
  time: string;
  depth: number;
  hasLike: boolean;
  likeCount: string | null;
  hasReply: boolean;
  hasDelete: boolean;
  hasAvatarImage: boolean;
  avatarSrc: string | null;
  avatarText: string;
  node: HTMLElement;
  /** The affordances themselves, for the interaction slice. */
  likeButton: HTMLElement | null;
  replyButton: HTMLElement | null;
  deleteButton: HTMLElement | null;
  /** The reply composer, present only while this comment is being replied to. */
  replyInput: HTMLTextAreaElement | null;
  replySubmit: HTMLElement | null;
  replyCancel: HTMLElement | null;
}

const label = (node: Element): string => node.getAttribute('aria-label') ?? text(node);

/**
 * Direct children carrying a class.
 *
 * Deliberately not `querySelectorAll(':scope > .x')`: happy-dom ignores the
 * `:scope` combinator and silently matches DESCENDANTS, which would fold a
 * reply's own action row into its parent's and invent divergences that the real
 * DOM does not have. A comment thread is nested by construction, so every read
 * here has to be depth-exact.
 */
function kids<T extends HTMLElement = HTMLElement>(node: Element | null | undefined, className: string): T[] {
  if (!node) return [];
  return [...node.children].filter(child => child.classList.contains(className)) as T[];
}

const kid = <T extends HTMLElement = HTMLElement>(node: Element | null | undefined, className: string): T | null =>
  kids<T>(node, className)[0] ?? null;

/**
 * Every rendered comment, in document order, with its nesting depth measured by
 * how many `.comment__replies` wrappers stand between it and the list root.
 */
export function readThread(el: HTMLElement): RenderedComment[] {
  const root = shadow(el);
  return [...root.querySelectorAll<HTMLElement>('.comment')].map(node => {
    let depth = 0;
    for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      if (parent.classList.contains('comment__replies')) depth++;
    }
    const body = kid(node, 'comment__body');
    const header = kid(body, 'comment__header');
    const actions = kids(kid(body, 'comment__actions'), 'comment__action');
    const likeButton = actions.find(a => /like/i.test(label(a)));
    const avatar = kid(node, 'comment__avatar');
    const avatarImage = avatar?.querySelector('img') ?? null;
    return {
      id: node.getAttribute('data-id') ?? '',
      author: text(kid(header, 'comment__author')),
      text: text(kid(body, 'comment__text')),
      time: text(kid(header, 'comment__time')),
      depth,
      hasLike: !!likeButton,
      likeCount: likeButton?.querySelector('.comment__like-count')
        ? text(likeButton.querySelector('.comment__like-count'))
        : null,
      hasReply: actions.some(a => /^reply$/i.test(label(a))),
      hasDelete: actions.some(a => /delete/i.test(label(a))),
      hasAvatarImage: !!avatarImage,
      avatarSrc: avatarImage?.getAttribute('src') ?? null,
      avatarText: text(avatar),
      node,
      likeButton: likeButton ?? null,
      replyButton: actions.find(a => /^reply$/i.test(label(a))) ?? null,
      deleteButton: actions.find(a => /delete/i.test(label(a))) ?? null,
      replyInput: kid(body, 'comment__reply-input')?.querySelector('textarea') ?? null,
      replySubmit: kids(kid(body, 'comment__reply-input'), 'comments__submit')[0] ?? null,
      replyCancel: kids(kid(body, 'comment__reply-input'), 'comment__cancel')[0] ?? null,
    };
  });
}

/** The rendered comment carrying `id`, or a hard failure naming what was found. */
export function byId(el: HTMLElement, id: string): RenderedComment {
  const rendered = readThread(el);
  const found = rendered.find(r => r.id === id);
  if (!found) throw new Error(`no rendered comment "${id}" (have: ${rendered.map(r => r.id).join(', ')})`);
  return found;
}

/** The element's own comment tree, flattened — the state a method mutated. */
export const idsOf = (el: any): string[] => flatten(el.comments as Comment[]).map(f => f.comment.id);

/** The comment carrying `id` inside the element's live tree. */
export function stateOf(el: any, id: string): Comment | undefined {
  return flatten(el.comments as Comment[]).find(f => f.comment.id === id)?.comment;
}

/**
 * The whole documented contract for one mounted combo, as a problem list.
 * Returns `[]` when the component matches its documentation.
 */
export function threadProblems(el: HTMLElement, c: CommentsConfig, comments: Comment[]): string[] {
  const problems: string[] = [];
  const say = (message: string) => problems.push(message);

  // Documented parts.
  const root = shadow(el);
  if (!root.querySelector('[part~="base"]')) say('no [part="base"] container');
  if (!root.querySelector('[part~="input-area"]')) say('no [part="input-area"] region');

  const expected = flatten(comments);
  if (expected.length > 0 && !root.querySelector('[part~="list"]')) {
    say(`${expected.length} comments but no [part="list"] container`);
  }

  const rendered = readThread(el);
  if (rendered.length !== expected.length) {
    say(`rendered ${rendered.length} comments, documented thread flattens to ${expected.length}`);
    return problems;
  }

  expected.forEach(({ comment, depth }, i) => {
    const got = rendered[i];
    const where = `comment #${i} (${comment.id} @depth ${depth})`;

    if (got.id !== comment.id) say(`${where}: rendered data-id "${got.id}"`);
    if (got.depth !== depth) say(`${where}: rendered at depth ${got.depth}`);
    if (got.author !== comment.author) say(`${where}: author "${got.author}" != "${comment.author}"`);
    if (got.text !== comment.text) say(`${where}: text "${got.text}" != "${comment.text}"`);

    if (!isRelative(got.time, comment.timestamp)) {
      say(`${where}: timestamp rendered as "${got.time}" — docs promise a relative timestamp`);
    }

    const wantLike = expectsLike(c);
    if (got.hasLike !== wantLike) {
      say(`${where}: like affordance ${got.hasLike ? 'present' : 'absent'}, allowLikes=${c.allowLikes}`);
    }
    const wantCount = expectsLikeCount(c, comment);
    if (wantCount && got.likeCount !== String(comment.likes)) {
      say(`${where}: like count "${got.likeCount}" != "${comment.likes}"`);
    }
    if (!wantCount && got.likeCount !== null) {
      say(`${where}: like count "${got.likeCount}" shown for likes=${comment.likes ?? 0}`);
    }

    const wantReply = expectsReply(c, depth);
    if (got.hasReply !== wantReply) {
      say(`${where}: reply affordance ${got.hasReply ? 'present' : 'absent'},`
        + ` allowReplies=${c.allowReplies} maxDepth=${c.maxDepth}`);
    }

    const wantDelete = expectsDelete(c, comment);
    if (got.hasDelete !== wantDelete) {
      say(`${where}: delete affordance ${got.hasDelete ? 'present' : 'absent'},`
        + ` author "${comment.author}" currentUser "${c.currentUser}"`);
    }

    if (comment.avatar) {
      if (!got.hasAvatarImage) say(`${where}: avatar "${comment.avatar}" set but no image rendered`);
      else if (got.avatarSrc !== comment.avatar) say(`${where}: avatar src "${got.avatarSrc}" != "${comment.avatar}"`);
    } else {
      if (got.hasAvatarImage) say(`${where}: no avatar set but an image is rendered`);
      if (got.avatarText === '') say(`${where}: no avatar and no fallback initials`);
    }
  });

  return problems;
}
