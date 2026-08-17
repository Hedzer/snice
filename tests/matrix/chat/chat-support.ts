/**
 * Per-component oracle for the snice-chat matrix.
 *
 * snice-chat is a Slack-style interface: a scrollable message list, a
 * composer, social actions that self-apply, and a per-author colour system.
 * Everything encoded here comes from docs/ai/components/chat.md,
 * snice-chat.types.ts / snice-chat-message.types.ts, snice-chat.css, and the
 * framework property contract in docs/ai/properties.md:
 *
 *   · Two authoring channels for MESSAGES: the `messages: ChatMessage[]`
 *     array ("property only") and declarative `<snice-chat-message>` children
 *     ("declarative message child (rendered first; `messages`-array entries
 *     append after)").
 *   · Style/flag axes and their documented attribute names: `current-user`,
 *     `current-avatar`, `allow-files`, `show-typing`, `show-avatars`,
 *     `show-timestamps`, `color-authors` (doc annotates each), plus plain
 *     `placeholder`, `markdown`, `layout`. Documented defaults: currentUser
 *     'You', currentAvatar '', placeholder 'Type a message...', allowFiles/
 *     showTyping/showAvatars/showTimestamps true, colorAuthors/markdown
 *     false, layout 'default'.
 *   · CSS Parts are the row contract: `message` always, `message-own` /
 *     `message-other` by authorship, `system-message` for type='system',
 *     `avatar`/`author`/`timestamp`/`edited`/`message-text` internals,
 *     `attachment`, `reactions`/`reaction`/`reaction-active`, `actions`
 *     ("react on any message; edit/delete owner-only"), the inline editors,
 *     `typing-indicator`, and the `input-area`/`input-container`/`input`
 *     composer chain.
 *   · Per-author colour: "Per-author color is injected inline as
 *     --snice-chat-author-color; ::part(author) reads it". Precedence derives
 *     from the doc's three knobs: per-message authorColor, then the
 *     authorColors map, then colorAuthors auto-colouring, else nothing.
 *     "values containing ;/{/} are rejected" — an unsafe value is not the
 *     author's colour, so the next precedence level applies.
 *   · Markdown is opt-in: per-message `format='markdown'`, or chat-level
 *     `markdown` "render bodies as markdown by default", with a per-message
 *     `format='text'` override ("unset = chat-level markdown applies").
 *   · Self-apply contract: "React, edit, and delete self-apply to the local
 *     `messages` model AND emit the event"; "Delete is confirmed inline
 *     first"; "message-send does not self-add; the consumer adds the sent
 *     message".
 *   · `layout='bubbles'` is selected by the stylesheet as
 *     `:host([layout='bubbles'])` (snice-chat.css) — a style axis whose
 *     DOM-tier contract is the attribute channel.
 *   · docs/ai/properties.md reflection: defaults are NOT reflected; authored
 *     attributes are always present; a property assignment reflects exactly
 *     when it differs from the documented default. Booleans reflect `true`
 *     as an attribute value and REMOVE the attribute for `false`, so for the
 *     four true-default flags a property assignment is observably
 *     attribute-less either way — only `color-authors` and `markdown` can
 *     prove reflection from the property channel.
 */
import { expectShape, mount, shadow, settle, type Shape } from '../matrix-utils';
import type { ChatMessage, MessageFormat, MessageType } from '../../../packages/components/src/chat/snice-chat.types';

export const LAYOUTS = ['default', 'bubbles'] as const;
export const CHANNELS = ['attr', 'prop'] as const;
export const MESSAGE_FORMATS = ['unset', 'text', 'markdown'] as const;

export type Layout = typeof LAYOUTS[number];
/** How the combo's axes are authored: markup attributes, or JS assignment. */
export type Channel = typeof CHANNELS[number];
export type MessageFormatAxis = typeof MESSAGE_FORMATS[number];

/** Documented defaults, from docs/ai/components/chat.md Properties. */
export const DEFAULTS = {
  currentUser: 'You',
  currentAvatar: '',
  placeholder: 'Type a message...',
  allowFiles: true,
  showTyping: true,
  showAvatars: true,
  showTimestamps: true,
  colorAuthors: false,
  markdown: false,
  layout: 'default' as Layout,
};

export interface ChatCombo {
  currentUser: string;
  placeholder: string;
  showAvatars: boolean;
  showTimestamps: boolean;
  allowFiles: boolean;
  showTyping: boolean;
  markdown: boolean;
  layout: Layout;
  colorAuthors: boolean;
  channel: Channel;
}

/** Documented attribute names (docs annotate these per property). */
const ATTR_NAMES: Record<string, string> = {
  currentUser: 'current-user',
  currentAvatar: 'current-avatar',
  placeholder: 'placeholder',
  allowFiles: 'allow-files',
  showTyping: 'show-typing',
  showAvatars: 'show-avatars',
  showTimestamps: 'show-timestamps',
  colorAuthors: 'color-authors',
  markdown: 'markdown',
  layout: 'layout',
};

const comboAxes = (combo: ChatCombo): Record<string, unknown> => ({
  currentUser: combo.currentUser,
  placeholder: combo.placeholder,
  allowFiles: combo.allowFiles,
  showTyping: combo.showTyping,
  showAvatars: combo.showAvatars,
  showTimestamps: combo.showTimestamps,
  colorAuthors: combo.colorAuthors,
  markdown: combo.markdown,
  layout: combo.layout,
});

/**
 * Mount a chat combo through its own authoring channel. The attr channel
 * authors every axis as an attribute — booleans as "" (true) or "false",
 * both of which docs/ai/properties.md Boolean conversion defines — the way
 * the showcase's `show-avatars="false"` does. The prop channel assigns each
 * axis after connection, which is what proves reflection.
 */
export async function mountChat(
  combo: ChatCombo,
  options: { messages?: ChatMessage[]; slotted?: string; authorColors?: Record<string, string> } = {},
): Promise<HTMLElement> {
  const attrs: Record<string, any> = {};
  if (combo.channel === 'attr') {
    for (const [key, value] of Object.entries(comboAxes(combo))) {
      const name = ATTR_NAMES[key];
      attrs[name] = typeof value === 'boolean' ? (value ? true : 'false') : String(value);
    }
  }
  const el = await mount<HTMLElement>('snice-chat', attrs, options.slotted ?? '');
  if (combo.channel === 'prop') {
    const target = el as any;
    for (const [key, value] of Object.entries(comboAxes(combo))) target[key] = value;
    if (options.authorColors) target.authorColors = options.authorColors;
    if (options.messages) target.messages = options.messages;
    await settle(el, 30);
  } else if (options.messages || options.authorColors) {
    const target = el as any;
    if (options.authorColors) target.authorColors = options.authorColors;
    if (options.messages) target.messages = options.messages;
    await settle(el, 30);
  }
  return el;
}

// ── Message fixtures ────────────────────────────────────────────────────────

/** A message with a FIXED timestamp — deterministic under every combo. */
export function msg(over: Partial<ChatMessage> & { author: string }): ChatMessage {
  return {
    id: over.id ?? `m_${over.author}_${over.content ?? ''}`,
    type: 'text' as MessageType,
    content: 'body',
    timestamp: new Date('2026-08-16T10:30:00'),
    ...over,
  };
}

export function rowOf(el: HTMLElement, id: string): HTMLElement | null {
  return shadow(el).querySelector(`[data-message-id="${id}"]`);
}

/**
 * EXACT part-token lookup. happy-dom's `[part~="x"]` also matches
 * hyphen-prefixed neighbours (see tests/matrix/part-exact.ts), and chat is
 * full of them — `[part~="input"]` would answer the `input-area` wrapper,
 * `[part~="message"]` every `message-text`. Splitting the attribute keeps
 * the selector semantics of a real browser. Passing the HOST searches its
 * shadow root; passing any shadow-internal node searches that subtree.
 */
export function partNamed<T extends Element = HTMLElement>(
  root: HTMLElement | ShadowRoot | ParentNode,
  name: string,
): T | null {
  const scope: ParentNode = (root as HTMLElement).shadowRoot ?? root;
  return ([...scope.querySelectorAll('[part]')] as T[]).find(node =>
    (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) ?? null;
}

function partTokensOf(node: Element | null): Set<string> {
  return new Set((node?.getAttribute('part') ?? '').split(/\s+/).filter(Boolean));
}

/**
 * The DOCUMENTED shape of one rendered message row — the "expected" side of
 * the row oracle. Structure only; geometry and paint belong to the visual
 * tier (tests/live/matrix/chat).
 */
export function expectedRow(message: ChatMessage, combo: ChatCombo): Shape {
  const system = message.type === 'system';
  const own = message.author === combo.currentUser;
  const markdownBody = message.format === 'markdown'
    || (combo.markdown && message.format !== 'text');
  const reactions = message.reactions ?? [];
  return {
    partTokens: system
      ? new Set(['message', 'system-message'])
      : new Set(['message', own ? 'message-own' : 'message-other']),
    hasAvatarPart: !system && combo.showAvatars,
    avatarIsImg: !system && combo.showAvatars && !!message.avatar,
    avatarImgSrc: !system && combo.showAvatars && message.avatar ? message.avatar : null,
    // An avatar that paints nothing cannot identify anyone: with no URL the
    // avatar carries the author's mark as text.
    avatarTextNonEmpty: !system && combo.showAvatars && !message.avatar,
    hasAuthorPart: !system,
    authorText: system ? null : message.author,
    hasTimestampPart: !system && combo.showTimestamps,
    timestampTextNonEmpty: !system && combo.showTimestamps,
    hasEditedPart: !system && !!message.edited,
    hasTextPart: !!message.content,
    bodyText: message.content && !markdownBody ? message.content : null,
    bodyIsMarkdown: !!message.content && markdownBody,
    markdownContent: message.content && markdownBody ? message.content : null,
    hasAttachmentPart: !!message.attachment,
    attachmentIsImg: message.attachment?.type === 'image',
    attachmentImgSrc: message.attachment?.type === 'image' ? message.attachment.url : null,
    attachmentNameText: message.attachment && message.attachment.type === 'file'
      ? message.attachment.name : null,
    hasReactionsPart: reactions.length > 0,
    reactionEmojiTexts: reactions.map(r => r.emoji),
    reactionCountTexts: reactions.map(r => String(r.count)),
    reactionActiveFlags: reactions.map(r => r.users.includes(combo.currentUser)),
    hasActionsPart: !system,
    // "react on any message; edit/delete owner-only"
    hasReactButton: !system,
    hasEditButton: !system && own,
    hasDeleteButton: !system && own,
  };
}

/** The same description, read back off the rendered row. */
export function readRow(el: HTMLElement, id: string): Shape {
  const row = rowOf(el, id);
  if (!row) return { rowMissing: true };
  const sr = shadow(el);
  const avatar = partNamed<HTMLElement>(row, 'avatar');
  const avatarImg = avatar?.querySelector('img') ?? null;
  const author = partNamed(row, 'author');
  const timestamp = partNamed(row, 'timestamp');
  const edited = partNamed(row, 'edited');
  const markdown = row.querySelector('snice-markdown');
  const attachment = partNamed(row, 'attachment');
  const attachmentImg = attachment?.querySelector('img') ?? null;
  const reactions = partNamed(row, 'reactions');
  const chips = reactions ? [...reactions.querySelectorAll('[part]')].filter(node =>
    (node.getAttribute('part') ?? '').split(/\s+/).includes('reaction')) : [];
  const actions = partNamed(row, 'actions');
  const buttons = actions ? [...actions.querySelectorAll('button')] : [];
  const buttonTitled = (t: string) => buttons.some(b => b.getAttribute('title') === t);
  return {
    partTokens: partTokensOf(row),
    hasAvatarPart: !!avatar,
    avatarIsImg: !!avatarImg,
    avatarImgSrc: avatarImg?.getAttribute('src') ?? null,
    avatarTextNonEmpty: !!avatar && (avatar.textContent ?? '').trim() !== '',
    hasAuthorPart: !!author,
    authorText: author?.textContent ?? null,
    hasTimestampPart: !!timestamp,
    timestampTextNonEmpty: !!timestamp && (timestamp.textContent ?? '').trim() !== '',
    hasEditedPart: !!edited,
    hasTextPart: !!partNamed(row, 'message-text'),
    bodyText: markdown ? null : partNamed(row, 'message-text')?.textContent ?? null,
    bodyIsMarkdown: !!markdown,
    markdownContent: markdown ? (markdown as any).content ?? null : null,
    hasAttachmentPart: !!attachment,
    attachmentIsImg: !!attachmentImg,
    attachmentImgSrc: attachmentImg?.getAttribute('src') ?? null,
    attachmentNameText: attachment?.querySelector('.attachment-name')?.textContent ?? null,
    hasReactionsPart: !!reactions,
    reactionEmojiTexts: chips.map(c => c.querySelector('.reaction-emoji')?.textContent ?? ''),
    reactionCountTexts: chips.map(c => c.querySelector('.reaction-count')?.textContent ?? ''),
    reactionActiveFlags: chips.map(c =>
      partTokensOf(c).has('reaction-active')),
    hasActionsPart: !!actions,
    hasReactButton: buttonTitled('React'),
    hasEditButton: buttonTitled('Edit'),
    hasDeleteButton: buttonTitled('Delete'),
    rowMissing: false,
    srExists: !!sr,
  };
}

/** Compare a rendered row against its documented shape. */
export function expectRow(el: HTMLElement, message: ChatMessage, combo: ChatCombo, label: string): void {
  const expected = expectedRow(message, combo);
  const actual = readRow(el, message.id);
  if ((actual as any).rowMissing) {
    throw new Error(`${label}: no row rendered for ${message.id}`);
  }
  expectShape(actual, expected, label);
}

// ── The axis/reflection oracle ─────────────────────────────────────────────

/**
 * The DOCUMENTED axis state: property truth for every axis plus the
 * attribute channel the stylesheet and the page can select on. See the
 * module header for the reflection rules these numbers encode.
 */
export function expectedAxes(combo: ChatCombo): Shape {
  const stringAttr = (key: keyof typeof DEFAULTS, value: string) =>
    combo.channel === 'attr' ? value
      : value !== DEFAULTS[key] ? value : undefined;
  const boolAttr = (key: keyof typeof DEFAULTS, value: boolean) =>
    combo.channel === 'attr' ? true
      : value === true && DEFAULTS[key] === false ? true : false;
  return {
    'prop.currentUser': combo.currentUser,
    'prop.placeholder': combo.placeholder,
    'prop.allowFiles': combo.allowFiles,
    'prop.showTyping': combo.showTyping,
    'prop.showAvatars': combo.showAvatars,
    'prop.showTimestamps': combo.showTimestamps,
    'prop.colorAuthors': combo.colorAuthors,
    'prop.markdown': combo.markdown,
    'prop.layout': combo.layout,
    'attr.current-user': stringAttr('currentUser', combo.currentUser),
    'attr.placeholder': stringAttr('placeholder', combo.placeholder),
    'attr.allow-files': boolAttr('allowFiles', combo.allowFiles),
    'attr.show-typing': boolAttr('showTyping', combo.showTyping),
    'attr.show-avatars': boolAttr('showAvatars', combo.showAvatars),
    'attr.show-timestamps': boolAttr('showTimestamps', combo.showTimestamps),
    'attr.color-authors': boolAttr('colorAuthors', combo.colorAuthors),
    'attr.markdown': boolAttr('markdown', combo.markdown),
    'attr.layout': stringAttr('layout', combo.layout),
  };
}

export function readAxes(el: HTMLElement, combo: ChatCombo): Shape {
  const any = el as any;
  const has = (name: string) => el.hasAttribute(name);
  return {
    'prop.currentUser': any.currentUser,
    'prop.placeholder': any.placeholder,
    'prop.allowFiles': any.allowFiles,
    'prop.showTyping': any.showTyping,
    'prop.showAvatars': any.showAvatars,
    'prop.showTimestamps': any.showTimestamps,
    'prop.colorAuthors': any.colorAuthors,
    'prop.markdown': any.markdown,
    'prop.layout': any.layout,    'attr.current-user': el.getAttribute('current-user') ?? undefined,
    'attr.placeholder': el.getAttribute('placeholder') ?? undefined,
    'attr.allow-files': has('allow-files'),
    'attr.show-typing': has('show-typing'),
    'attr.show-avatars': has('show-avatars'),
    'attr.show-timestamps': has('show-timestamps'),
    'attr.color-authors': has('color-authors'),
    'attr.markdown': has('markdown'),
    'attr.layout': el.getAttribute('layout') ?? undefined,
  };
}

// ── Author colour resolution ────────────────────────────────────────────────

/** Reads the documented inline var off a message's author part. */
export function authorColorVar(el: HTMLElement, id: string): string {
  const author = rowOf(el, id)?.querySelector<HTMLElement>('[part~="author"]');
  return author?.style.getPropertyValue('--snice-chat-author-color').trim() ?? '';
}

/** The doc's example explicit colour for the authorColors map. */
export const MAP_COLOR = '#e11d48';
/** A safe per-message colour that differs from MAP_COLOR. */
export const MESSAGE_COLOR = '#2563eb';
/** A value the doc explicitly rejects ("values containing ;/{/}"). */
export const UNSAFE_COLOR = 'red;position:fixed;inset:0';
