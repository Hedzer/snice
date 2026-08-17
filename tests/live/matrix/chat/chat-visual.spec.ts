/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-chat TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/chat, `npm run test:matrix`) owns structure
 * truth: the documented part contract per message row, the composer chain,
 * the markdown truth table, the per-author colour precedence, and the
 * self-apply event semantics. It cannot own visual truth, because happy-dom
 * performs no layout and paints nothing.
 *
 * snice-chat is an interactive LAYOUT component, so its visual matrix is
 * sized between the tag's 60 and the table's 1152: 27 layer-1 combos plus a
 * pinned marquee set. The claims reachable only here, each from
 * docs/ai/components/chat.md:
 *
 *   · `layout='bubbles'` = "aligned colored bubbles" — own messages
 *     right-aligned (row-reversed) in a `--snice-color-primary` bubble with
 *     inverse ink, others left in a neutral bubble; `default` paints no
 *     bubble at all (the stylesheet scopes every bubble rule to
 *     `:host([layout='bubbles'])`, so the default render is unchanged);
 *   · the chat is a column: a scrolling `role="log"` message area above the
 *     composer, the typing row between them, nothing overlapping;
 *   · `show-avatars` gates a 2.25rem avatar that sits beside the content;
 *   · the timestamp sits right of the author on the header line;
 *   · attachments and reaction chips stack BELOW the body, inside the
 *     message content, and the active chip is the primary-tinted one;
 *   · system messages centre in the log;
 *   · the send button is painted `--snice-color-primary`;
 *   · markdown bodies render real block structure, not literal markup.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   LAYOUT    layout (2) x showAvatars (2)                               = 8
 *   CONTENT   attachment (3) x reactions (3)                             = 9
 *   MARKDOWN  chat markdown (2) x per-message format (3)                 = 6
 *   COMPOSER  allowFiles (2) x typing row (2)                            = 4
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Pixel truth for the claims computed style cannot make: a bubble colour
 *   that is actually PAINTED, an author name that is actually IN its colour,
 *   and chips/buttons distinguishable from their neighbours at pixel level.
 *
 * ── Known defects pinned, never softened (.ai/fuzzing.md) ───────────────────
 *   VISUAL-MATRIX-chat-1 mirrors the DOM finding MATRIX-chat-1: the typing
 *   methods touch private state without requesting a render, so the
 *   documented "Show typing indicator" effect of a connected chat never
 *   lands (the layer-1 typing geometry mounts the indicator before the
 *   first render instead, which is the only path that paints it today).
 *   VISUAL-MATRIX-chat-2 — `layout='bubbles'` un-centres system messages.
 *   The stylesheet centres system rows globally (`.message.system {
 *   justify-content: center }` + `text-align: center`), but the bubbles
 *   rule `:host([layout='bubbles']) .message .message-text { display:
 *   inline-block }` also applies to the system text: it shrinks to fit and
 *   sits at the left of its column, so the centre claim only holds in the
 *   default layout. Both bubbles layer-1 combos are pinned.
 *   VISUAL-MATRIX-chat-3 — Enter never sends in a real browser. The
 *   composer's keydown listener lives on the HOST and gates on
 *   `e.target !== this.inputField`, but shadow DOM retargets a composed
 *   keydown's target to the host itself for host-level listeners, so the
 *   guard rejects every real keydown (verified with a physical keyboard:
 *   typing fires `typing-start`, Enter dispatches no `message-send`).
 *   happy-dom does not retarget, which is why the DOM tier's identical
 *   synthetic keydown passes — only this tier can see the breakage.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/chat/matrix.html';

type Layout = 'default' | 'bubbles';
type AttachmentKind = 'none' | 'image' | 'file';
type ReactionState = 'none' | 'inactive' | 'active';
type FormatAxis = 'unset' | 'text' | 'markdown';

interface Combo {
  id: string;
  layout: Layout;
  showAvatars: boolean;
  attachment: AttachmentKind;
  reactions: ReactionState;
  chatMarkdown: boolean;
  format: FormatAxis;
  allowFiles: boolean;
  typing: boolean;
}

const base = (over: Partial<Combo>): Combo => ({
  id: '', layout: 'default', showAvatars: true,
  attachment: 'none', reactions: 'none',
  chatMarkdown: false, format: 'unset',
  allowFiles: true, typing: false,
  ...over,
});

/** A conversation: one other-authored, one own, one system. */
const CONVERSATION = [
  { id: 'other', author: 'Alice', content: 'their words in a row' },
  { id: 'own', author: 'Me', content: 'my own answer here' },
  { id: 'sys', author: 'System', type: 'system', content: 'Alice joined' },
];

function layoutCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const layout of ['default', 'bubbles'] as Layout[]) {
    for (const showAvatars of [false, true]) {
      combos.push(base({
        id: `layout/${layout}/avatars=${showAvatars}`,
        layout, showAvatars,
      }));
    }
  }
  return combos;
}

function contentCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const attachment of ['none', 'image', 'file'] as AttachmentKind[]) {
    for (const reactions of ['none', 'inactive', 'active'] as ReactionState[]) {
      combos.push(base({
        id: `content/${attachment}/reactions=${reactions}`,
        attachment, reactions,
      }));
    }
  }
  return combos;
}

function markdownCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const chatMarkdown of [false, true]) {
    for (const format of ['unset', 'text', 'markdown'] as FormatAxis[]) {
      combos.push(base({
        id: `markdown/chat=${chatMarkdown}/format=${format}`,
        chatMarkdown, format,
      }));
    }
  }
  return combos;
}

function composerCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const allowFiles of [false, true]) {
    for (const typing of [false, true]) {
      combos.push(base({
        id: `composer/files=${allowFiles}/typing=${typing}`,
        allowFiles, typing,
      }));
    }
  }
  return combos;
}

/** The payload each cross mounts. */
function messagesFor(combo: Combo): any[] {
  if (combo.id.startsWith('layout/')) return CONVERSATION;
  if (combo.id.startsWith('content/')) {
    return [{
      id: 'subject-msg', author: 'Alice', content: 'the body of the message',
      attachment: combo.attachment === 'none' ? undefined : combo.attachment === 'image'
        ? { type: 'image', url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="60"%3E%3Crect width="120" height="60" fill="%232563eb"/%3E%3C/svg%3E', name: 'mockup.svg' }
        : { type: 'file', url: '#', name: 'report.pdf', size: 245760 },
      reactions: combo.reactions === 'none' ? undefined : [
        { emoji: '👍', count: 2, users: ['Alice', 'Bob'], active: combo.reactions === 'active' },
      ],
    }];
  }
  if (combo.id.startsWith('markdown/')) {
    return [{ id: 'subject-msg', author: 'Alice', content: '**bold** and moving', format: combo.format === 'unset' ? undefined : combo.format }];
  }
  return CONVERSATION;
}

function payloadFor(combo: Combo): Record<string, unknown> {
  return {
    layout: combo.layout,
    showAvatars: combo.showAvatars,
    markdown: combo.chatMarkdown,
    allowFiles: combo.allowFiles,
    typingUsers: combo.typing ? ['Alice'] : undefined,
    messages: messagesFor(combo),
  };
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** Part-token lookup with exact `~=` semantics, guarding the hyphen-prefix
 *  traps (`input` vs `input-area`, `message` vs `message-text`). */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo: Combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const matrix = (window as any).matrix;
    const token = (name: string) => matrix.token(name) as string;
    const exact = (root: ParentNode, name: string) =>
      [...root.querySelectorAll('[part]')].filter(n =>
        (n.getAttribute('part') ?? '').split(/\s+/).includes(name));

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const cs = (el: Element) => getComputedStyle(el);
    const frame = (box: DOMRect, name: string) =>
      `${name} (${box.left.toFixed(0)},${box.top.toFixed(0)}…${box.right.toFixed(0)},${box.bottom.toFixed(0)})`;

    // ── The chat is a full-height column ────────────────────────────────────
    const hostBox = rect(host);
    const hostCs = cs(host);
    if (hostCs.display !== 'flex') say(`host display "${hostCs.display}", expected the documented column flex`);
    if (hostCs.flexDirection !== 'column') say(`host flex-direction "${hostCs.flexDirection}", expected "column"`);
    if (hostBox.width <= 0 || hostBox.height < 500) {
      say(`the chat renders at ${hostBox.width}x${hostBox.height} — --snice-chat-height was not applied`);
      return problems;
    }

    const baseEl = exact(sr, 'base')[0];
    const area = exact(sr, 'messages')[0];
    const inputArea = exact(sr, 'input-area')[0];
    if (!baseEl || !area || !inputArea) {
      say('missing base/messages/input-area part');
      return problems;
    }
    const areaBox = rect(area);
    const inputAreaBox = rect(inputArea);
    if (area.getAttribute('role') !== 'log') say('the messages area is not role="log"');
    if (cs(area).overflowY !== 'auto') say(`messages area overflow-y "${cs(area).overflowY}", expected "auto"`);
    if (areaBox.bottom > inputAreaBox.top + EPS) {
      say(`${frame(areaBox, 'messages area')} overlaps ${frame(inputAreaBox, 'input area')}`);
    }
    if (inputAreaBox.bottom > hostBox.bottom + EPS || inputAreaBox.top < hostBox.top - EPS) {
      say(`the composer (${inputAreaBox.top.toFixed(0)}…${inputAreaBox.bottom.toFixed(0)}) escapes the chat frame`);
    }

    // ── The composer chain ──────────────────────────────────────────────────
    const input = exact(sr, 'input')[0] as HTMLTextAreaElement | undefined;
    if (!input) { say('no part="input" textarea'); return problems; }
    const inputBox = rect(input);
    if (inputBox.width <= 0 || inputBox.height <= 0) say(`the textarea renders at ${inputBox.width}x${inputBox.height}`);
    if (input.getAttribute('placeholder') !== 'Type a message...') {
      say(`textarea placeholder "${input.getAttribute('placeholder')}"`);
    }
    const attach = sr.querySelector('.input-button[title="Attach file"]') as HTMLElement | null;
    if (combo.allowFiles) {
      if (!attach) say('allow-files painted no attach button');
      else if (rect(attach).width <= 0) say('the attach button renders at zero size');
    } else if (attach) {
      say('allow-files=false painted an attach button');
    }
    const send = sr.querySelector('.input-button.send') as HTMLElement | null;
    if (!send || rect(send).width <= 0) say('the send button is missing or zero-sized');
    else {
      if (rect(send).left < inputBox.right - EPS) say('the send button is not right of the textarea');
      if (cs(send).backgroundColor !== token('--snice-color-primary')) {
        say(`send button painted ${cs(send).backgroundColor}, expected the primary token`);
      }
    }

    // ── The typing row lives between log and composer ───────────────────────
    const typingRow = exact(sr, 'typing-indicator')[0] ?? null;
    if (combo.typing) {
      if (!typingRow) { say('a typing user was mounted but no typing-indicator row rendered'); }
      else {
        const typingBox = rect(typingRow);
        if (typingBox.top < areaBox.bottom - EPS || typingBox.bottom > inputAreaBox.top + EPS) {
          say(`${frame(typingBox, 'typing row')} is not between log and composer`);
        }
        if (!(typingRow.textContent ?? '').includes('Alice')) say('the typing row does not name its user');
        const dots = typingRow.querySelectorAll('.typing-dot');
        if (dots.length !== 3) say(`typing row painted ${dots.length} dots, expected 3`);
      }
    } else if (typingRow) {
      say('a typing-indicator row rendered with nobody typing');
    }

    // ── The message rows stack inside the log ───────────────────────────────
    const rows = [...sr.querySelectorAll('.message')] as HTMLElement[];
    if (rows.length === 0) { say('no message rows rendered'); return problems; }
    let previousBottom = areaBox.top;
    for (const [i, row] of rows.entries()) {
      const rowBox = rect(row);
      const tokens = (row.getAttribute('part') ?? '').split(/\s+/);
      if (rowBox.width <= 0 || rowBox.height <= 0) { say(`row ${i} renders at ${rowBox.width}x${rowBox.height}`); continue; }
      if (rowBox.top < previousBottom - EPS) say(`row ${i} overlaps the row above it`);
      previousBottom = rowBox.bottom;
      if (rowBox.left < areaBox.left - EPS || rowBox.right > areaBox.right + EPS
        || rowBox.bottom > areaBox.bottom + EPS) {
        say(`row ${i} ${frame(rowBox, '')} escapes the log`);
      }
      if (!tokens.includes('message')) say(`row ${i} carries no "message" part token`);
    }

    // ── Per-cross specifics ─────────────────────────────────────────────────
    if (combo.id.startsWith('layout/')) {
      const other = rows.find(r => (r.getAttribute('part') ?? '').includes('message-other'));
      const own = rows.find(r => (r.getAttribute('part') ?? '').includes('message-own'));
      const sys = rows.find(r => (r.getAttribute('part') ?? '').includes('system-message'));
      if (!other || !own || !sys) { say('conversation rows missing'); return problems; }

      const ownContent = own.querySelector('.message-content') as HTMLElement;
      const otherContent = other.querySelector('.message-content') as HTMLElement;
      const ownText = exact(own, 'message-text')[0] as HTMLElement;
      const otherText = exact(other, 'message-text')[0] as HTMLElement;
      if (!ownContent || !otherContent || !ownText || !otherText) { say('row internals missing'); return problems; }
      const ownTextBox = rect(ownText);
      const otherTextBox = rect(otherText);

      // System rows carry none of the per-user internals.
      if (exact(sys, 'avatar').length || exact(sys, 'author').length || exact(sys, 'timestamp').length) {
        say('the system row painted avatar/author/timestamp internals');
      }
      const sysText = exact(sys, 'message-text')[0];
      if (sysText) {
        const sysBox = rect(sysText);
        const areaCenter = areaBox.left + areaBox.width / 2;
        if (Math.abs(sysBox.left + sysBox.width / 2 - areaCenter) > 8) {
          say(`the system message centres at ${(sysBox.left + sysBox.width / 2).toFixed(0)}, log centre ${areaCenter.toFixed(0)}`);
        }
      }

      // Avatars: 2.25rem square, beside the content, or absent entirely.
      for (const [name, row] of [['other', other], ['own', own]] as Array<[string, HTMLElement]>) {
        const avatar = exact(row, 'avatar')[0];
        if (combo.showAvatars) {
          if (!avatar) { say(`${name} row painted no avatar despite show-avatars`); continue; }
          const avatarBox = rect(avatar);
          if (Math.abs(avatarBox.width - 36) > 1.5 || Math.abs(avatarBox.height - 36) > 1.5) {
            say(`${name} avatar is ${avatarBox.width.toFixed(1)}x${avatarBox.height.toFixed(1)}, expected 2.25rem square`);
          }
          const content = row.querySelector('.message-content') as HTMLElement;
          // bubbles own rows are row-reversed: the avatar sits RIGHT.
          const avatarRight = combo.layout === 'bubbles' && name === 'own'
            ? avatarBox.left >= rect(content).right - EPS
            : avatarBox.right <= rect(content).left + EPS;
          if (!avatarRight) say(`${name} avatar is on the wrong side of its content in ${combo.layout}`);
        } else if (avatar) {
          say(`${name} row painted an avatar despite show-avatars=false`);
        }
      }

      // The timestamp joins the author on the header line. The stylesheet
      // orders the header author-then-timestamp; bubbles own rows mirror
      // the whole row (`:host([layout='bubbles']) .message.own
      // .message-header { flex-direction: row-reverse }`), so there — and
      // only there — the timestamp leads on the left. Both orders must
      // still be non-overlapping.
      if (combo.showAvatars !== false) {
        for (const [name, row] of [['other', other], ['own', own]] as Array<[string, HTMLElement]>) {
          const author = exact(row, 'author')[0];
          const timestamp = exact(row, 'timestamp')[0];
          if (!author || !timestamp) { say(`${name} row misses author/timestamp parts`); continue; }
          const mirrored = combo.layout === 'bubbles' && name === 'own';
          if (mirrored ? rect(timestamp).right > rect(author).left + EPS
                       : rect(timestamp).left < rect(author).right - EPS) {
            say(`${name} timestamp is not on the ${mirrored ? 'left' : 'right'} of its author in ${combo.layout}`);
          }
        }
      }

      // The bubble contract.
      if (combo.layout === 'bubbles') {
        if (cs(ownText).backgroundColor !== token('--snice-color-primary')) {
          say(`own bubble painted ${cs(ownText).backgroundColor}, expected the primary token`);
        }
        if (cs(ownText).color !== token('--snice-color-text-inverse')) {
          say(`own bubble ink ${cs(ownText).color}, expected the inverse text token`);
        }
        if (cs(otherText).backgroundColor !== token('--snice-color-surface-container')) {
          say(`other bubble painted ${cs(otherText).backgroundColor}, expected the surface-container token`);
        }
        // "aligned": the own bubble hugs the right edge, the other the left.
        const ownContentBox = rect(ownContent);
        if (ownTextBox.right < ownContentBox.right - 8) say('the own bubble is not right-aligned in its column');
        if (otherTextBox.left > rect(otherContent).left + 8) say('the other bubble is not left-aligned in its column');
        if (ownTextBox.left <= otherTextBox.left) say('the own bubble is not to the right of the other bubble');
      } else {
        for (const [name, text] of [['own', ownText], ['other', otherText]] as Array<[string, HTMLElement]>) {
          if (cs(text).backgroundColor !== 'rgba(0, 0, 0, 0)') {
            say(`default layout painted ${name} a bubble (${cs(text).backgroundColor})`);
          }
        }
        if (Math.abs(ownTextBox.left - otherTextBox.left) > EPS) {
          say(`default layout rows start at ${ownTextBox.left.toFixed(0)} and ${otherTextBox.left.toFixed(0)} — not one column`);
        }
      }
    }

    if (combo.id.startsWith('content/')) {
      const row = rows[0];
      const text = exact(row, 'message-text')[0] as HTMLElement | undefined;
      const content = row.querySelector('.message-content') as HTMLElement;
      if (!text || !content) { say('body/content missing'); return problems; }
      const textBox = rect(text);
      const contentBox = rect(content);

      const attachments = exact(row, 'attachment');
      if (combo.attachment === 'none') {
        if (attachments.length) say('an attachment part rendered with no attachment data');
      } else {
        const attachment = attachments[0];
        if (!attachment) { say('no attachment part rendered'); }
        else {
          const attachmentBox = rect(attachment);
          if (attachmentBox.top < textBox.bottom - EPS) say('the attachment is not below the body');
          if (attachmentBox.right > contentBox.right + EPS || attachmentBox.left < contentBox.left - EPS) {
            say('the attachment escapes the message content box');
          }
          // The cap is `.message-attachment { max-width: 25rem }` on a
          // content-box element with 1px borders: the cap owns the CONTENT
          // box (clientWidth), while the painted border box may legally
          // reach 402px. Measuring the border box against the cap would
          // flag every capped attachment.
          if (attachment.clientWidth > 400 + EPS) say(`the attachment content box is ${attachment.clientWidth}px wide, expected the 25rem cap`);
          if (combo.attachment === 'image') {
            const img = attachment.querySelector('img');
            if (!img || rect(img).width <= 0) say('an image attachment painted no visible image');
          } else {
            const name = attachment.querySelector('.attachment-name');
            if (!name || (name.textContent ?? '').trim() === '') say('a file attachment named nothing');
          }
        }
      }

      const reactions = exact(row, 'reactions')[0] ?? null;
      if (combo.reactions === 'none') {
        if (reactions) say('a reactions part rendered with no reaction data');
      } else if (!reactions) {
        say('no reactions part rendered');
      } else {
        const chips = exact(reactions, 'reaction');
        if (chips.length !== 1) { say(`painted ${chips.length} chips, expected 1`); }
        else {
          const chip = chips[0] as HTMLElement;
          const chipBox = rect(chip);
          if (chipBox.top < textBox.bottom - EPS) say('the reaction chip is not below the body');
          if (chipBox.height <= 0) say('the reaction chip renders at zero height');
          if (chipBox.right > contentBox.right + EPS) say('the reaction chip escapes the content box');
          const active = (chip.getAttribute('part') ?? '').split(/\s+/).includes('reaction-active');
          if (active !== (combo.reactions === 'active')) {
            say(`chip active=${active} but the combo says ${combo.reactions}`);
          }
          if (active && cs(chip).backgroundColor !== token('--snice-color-primary')) {
            say(`the active chip painted ${cs(chip).backgroundColor}, expected the primary token`);
          }
          if (!active && cs(chip).backgroundColor !== token('--snice-color-surface-container-low')) {
            say(`the inactive chip painted ${cs(chip).backgroundColor}, expected the neutral token`);
          }
          if (!(chip.textContent ?? '').includes('👍')) say('the chip does not show its emoji');
        }
      }
    }

    if (combo.id.startsWith('markdown/')) {
      const row = rows[0];
      const md = row.querySelector('snice-markdown') as HTMLElement | null;
      const applies = combo.format === 'markdown'
        || (combo.chatMarkdown && combo.format !== 'text');
      if (applies) {
        if (!md) say('a markdown body did not render through snice-markdown');
        else {
          if (rect(md).height <= 0) say('the markdown body renders at zero height');
          // snice-markdown renders its parsed HTML inside its OWN shadow
          // root (`.markdown-body` under `@render()`); the chat's
          // `<snice-markdown>` element is only the host, so the strong tag
          // must be looked for in its shadow tree.
          const mdRoot = md.shadowRoot ?? md;
          const strong = mdRoot.querySelector('strong');
          if (!strong || rect(strong).width <= 0) {
            say('**bold** did not render as a visible strong element');
          }
        }
      } else {
        if (md) say('a plain body rendered through snice-markdown');
        else {
          const text = exact(row, 'message-text')[0];
          if (!(text?.textContent ?? '').includes('**bold**')) {
            say('a plain body lost its literal markup');
          }
        }
      }
    }

    // ── Occlusion: nothing may paint over a message body or the composer ────
    const probeRow = rows.find(r => exact(r, 'message-text')[0]) ?? rows[0];
    const bodyText = exact(probeRow, 'message-text')[0] as HTMLElement | undefined;
    if (bodyText) {
      const bodyBox = rect(bodyText);
      const x = bodyBox.left + Math.min(bodyBox.width / 2, 40);
      const y = bodyBox.top + bodyBox.height * 0.7;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host && outer !== probeRow && !(outer && host.contains(outer))) {
        say(`a body hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the chat`);
      } else {
        const hit = (sr as any).elementFromPoint(x, y) as Element | null;
        if (hit && hit !== bodyText && !bodyText.contains(hit) && hit !== probeRow
          && !probeRow.contains(hit) && hit !== host) {
          say(`the message body is occluded by <${hit.tagName.toLowerCase()}${hit.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
        }
      }
    }
    const inputHit = document.elementFromPoint(inputBox.left + 10, inputBox.top + inputBox.height / 2);
    if (inputHit !== host && inputHit !== input && !(inputHit && host.contains(inputHit))) {
      say(`the composer hit-test found <${inputHit?.tagName.toLowerCase() ?? 'nothing'}>, not the chat`);
    }

    return problems;
  }, combo as any);
}

async function mountAndCheckReflection(combo: Combo): Promise<void> {
  const mounted = await page.evaluate(
    c => (window as any).matrix.mount(c),
    payloadFor(combo) as any,
  );
  // Every bubble rule is `:host([layout='bubbles'])`. A property assignment
  // that never reached an attribute paints the default layout, so reflection
  // IS the paint here (docs/ai/properties.md: defaults are not reflected).
  expect(mounted.reflected.layout).toBe(combo.layout === 'default' ? null : combo.layout);
  expect(mounted.reflected.markdown).toBe(combo.chatMarkdown === true);
}

test.describe('chat visual matrix: layer 1 — layout x avatars', () => {
  for (const combo of layoutCombos()) {
    test(combo.id, async () => {
      // FINDING VISUAL-MATRIX-chat-2: in `layout='bubbles'` the system
      // message loses its centring (see the header). The centre assertion
      // stays; both bubbles combos are pinned until the stylesheet keeps
      // system rows centred in every layout.
      test.fail(combo.layout === 'bubbles', 'VISUAL-MATRIX-chat-2: bubbles un-centres the system message');
      await mountAndCheckReflection(combo);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('chat visual matrix: layer 1 — attachment x reactions', () => {
  for (const combo of contentCombos()) {
    test(combo.id, async () => {
      await mountAndCheckReflection(combo);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('chat visual matrix: layer 1 — markdown x per-message format', () => {
  for (const combo of markdownCombos()) {
    test(combo.id, async () => {
      await mountAndCheckReflection(combo);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('chat visual matrix: layer 1 — composer x typing row', () => {
  for (const combo of composerCombos()) {
    test(combo.id, async () => {
      await mountAndCheckReflection(combo);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── Real-browser behaviour (the DOM matrix dispatches synthetic events) ─────

test.describe('chat visual matrix: real interaction', () => {
  // FINDING VISUAL-MATRIX-chat-3: Enter really sends is broken in every
  // real browser — the host-level keydown listener's `e.target !== input`
  // guard rejects the retargeted target (see the header). The synthetic
  // dispatch below behaves exactly like a physical keypress (both retarget),
  // and the assertions stay at the documented contract; pinned test.fail
  // until the guard accepts host-level retargeting.
  test.fail('VISUAL-MATRIX-chat-3: typing Enter really sends, clears the composer, and does not self-add', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      messages: [{ id: 'other', author: 'Alice', content: 'hello' }],
    }));
    const result = await page.evaluate(() => (window as any).matrix.typeAndSend('on it'));
    const sends = result.events.filter((e: any) => e.type === 'message-send');
    expect(sends, 'message-send dispatch count').toHaveLength(1);
    expect(sends[0].detail.message).toBe('on it');
    expect(result.inputValue, 'composer cleared').toBe('');
    const rowCount = await page.evaluate(() =>
      (document.getElementById('subject') as any).shadowRoot.querySelectorAll('.message').length);
    expect(rowCount, 'the consumer adds the sent message, not the chat').toBe(1);
  });

  test('the react menu really applies a reaction to another user’s message', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      messages: [{ id: 'other', author: 'Alice', content: 'react to me' }],
    }));
    const result = await page.evaluate(() => (window as any).matrix.clickReact(0));
    const reacts = result.events.filter((e: any) => e.type === 'message-react');
    expect(reacts, 'message-react dispatch count').toHaveLength(1);
    expect(reacts[0].detail.messageId).toBe('other');
    const active = await page.evaluate(() => {
      const chip = (document.getElementById('subject') as any).shadowRoot
        .querySelector('.reaction');
      return chip ? (chip.getAttribute('part') ?? '').split(/\s+/).includes('reaction-active') : false;
    });
    expect(active, 'the new chip is the current user’s own').toBe(true);
  });

  // FINDING VISUAL-MATRIX-chat-1 (mirrors DOM finding MATRIX-chat-1):
  // addTypingIndicator() on a connected chat touches private state without
  // requesting a render, so the documented "Show typing indicator" effect —
  // the doc's own Basic Usage calls it on a live chat — never paints. The
  // assertion stays as documented; pinned test.fail until the method renders.
  test.fail('addTypingIndicator on a live chat shows the typing row', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      messages: [{ id: 'other', author: 'Alice', content: 'hello' }],
    }));
    await page.evaluate(() => (window as any).matrix.addTyping('Alice'));
    const present = await page.evaluate(() =>
      !!(document.getElementById('subject') as any).shadowRoot
        .querySelector('[part~="typing-indicator"]'));
    expect(present, 'the typing row painted after addTypingIndicator').toBe(true);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is the expensive layer, and layer 1 already
// measured the model the browser built. These exist because "the bubble has a
// background-colour" and "the text is readable on it" are different claims,
// and only pixels can tell them apart.

/** Parse a browser-computed `rgb(r, g, b)` into pixel-probe's RGB tuple. */
function parseRGB(value: string): RGB {
  const m = value.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  return [Number(m![1]), Number(m![2]), Number(m![3])];
}

function colorNear(a: RGB, b: RGB, tolerance = 3): boolean {
  return Math.abs(a[0] - b[0]) <= tolerance
    && Math.abs(a[1] - b[1]) <= tolerance
    && Math.abs(a[2] - b[2]) <= tolerance;
}

async function token(page: Page, name: string): Promise<string> {
  return page.evaluate(n => (window as any).matrix.token(n), name);
}

test.describe('chat visual matrix: marquee pixels', () => {
  test('a bubbles own message paints a primary bubble its text is readable on', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      layout: 'bubbles',
      messages: [
        { id: 'other', author: 'Alice', content: 'their answer' },
        { id: 'own', author: 'Me', content: 'a reasonably long own reply' },
      ],
    }));
    const pixels = await capture(
      page, '#subject', 'chat-bubbles-own',
      `(host) => {
        const rows = [...host.shadowRoot.querySelectorAll('.message')];
        const own = rows.find(r => (r.getAttribute('part') ?? '').includes('message-own'));
        const other = rows.find(r => (r.getAttribute('part') ?? '').includes('message-other'));
        const ownText = own.querySelector('[part~="message-text"]');
        const otherText = other.querySelector('[part~="message-text"]');
        const t = ownText.getBoundingClientRect();
        const o = otherText.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 12; i++) {
          points.push({ x: t.x + (t.width * i) / 14, y: t.y + t.height / 2 });
        }
        points.push({ x: t.x + 3, y: t.y + 3 });
        points.push({ x: o.x + 3, y: o.y + 3 });
        return points;
      }`,
    );
    const glyphs = pixels.slice(0, 12) as RGB[];
    const ownBubble = pixels[12] as RGB;
    const otherBubble = pixels[13] as RGB;
    const primary = parseRGB(await token(page, '--snice-color-primary'));
    expect(colorNear(ownBubble, primary),
      `own bubble painted ${ownBubble.join(',')} not the primary token`).toBe(true);
    expect(sameColor(ownBubble, otherBubble),
      `own and other bubbles both painted ${ownBubble.join(',')}`).toBe(false);
    const best = Math.max(...glyphs.map(p => contrast(p, ownBubble)));
    expect(best, `best own-text-vs-bubble contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('the default layout paints no bubble where bubbles paints one', async () => {
    const interior: RGB[] = [];
    for (const layout of ['default', 'bubbles'] as const) {
      await page.evaluate(l => (window as any).matrix.mount({
        layout: l,
        messages: [{ id: 'own', author: 'Me', content: 'an own message body' }],
      }), layout);
      const [point] = await capture(
        page, '#subject', `chat-own-${layout}`,
        `(host) => {
          const text = host.shadowRoot.querySelector('[part~="message-text"]');
          const t = text.getBoundingClientRect();
          return [{ x: t.x + 3, y: t.y + 3 }];
        }`,
      );
      interior.push(point as RGB);
    }
    expect(sameColor(interior[0], interior[1]),
      `default (${interior[0].join(',')}) and bubbles (${interior[1].join(',')}) paint the same own-message interior`).toBe(false);
  });

  test('an authorColors entry paints the author name in its colour', async () => {
    const sweeps: RGB[][] = [];
    for (const authorColors of [undefined, { Alice: '#e11d48' }] as const) {
      await page.evaluate(colors => (window as any).matrix.mount({
        authorColors: colors,
        messages: [{ id: 'other', author: 'Alice', content: 'my name is red' }],
      }), authorColors);
      const pixels = await capture(
        page, '#subject', authorColors ? 'chat-author-colored' : 'chat-author-plain',
        `(host) => {
          const author = host.shadowRoot.querySelector('[part~="author"]');
          const a = author.getBoundingClientRect();
          const points = [];
          for (let i = 1; i <= 10; i++) {
            points.push({ x: a.x + (a.width * i) / 12, y: a.y + a.height / 2 });
          }
          return points;
        }`,
      );
      sweeps.push(pixels as RGB[]);
    }
    const differs = sweeps[0].some((p, i) => !sameColor(p, sweeps[1][i]));
    expect(differs,
      'the author name painted the same pixels with and without its colour').toBe(true);
  });

  test('the active reaction chip is distinguishable from an inactive one', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      messages: [{
        id: 'other', author: 'Alice', content: 'react to me',
        reactions: [
          { emoji: '👍', count: 2, users: ['Alice', 'Bob'] },
          { emoji: '❤️', count: 1, users: ['Me'] },
        ],
      }],
    }));
    const [inactive, active] = await capture(
      page, '#subject', 'chat-reaction-chips',
      `(host) => {
        const chips = [...host.shadowRoot.querySelectorAll('.reaction')];
        const byEmoji = e => chips.find(c => c.textContent.includes(e));
        const box = el => el.getBoundingClientRect();
        const i = box(byEmoji('👍'));
        const a = box(byEmoji('❤️'));
        return [
          { x: i.x + 4, y: i.y + i.height / 2 },
          { x: a.x + 4, y: a.y + a.height / 2 },
        ];
      }`,
    ) as RGB[];
    const primary = parseRGB(await token(page, '--snice-color-primary'));
    expect(colorNear(active, primary),
      `the active chip painted ${active.join(',')} not the primary token`).toBe(true);
    expect(sameColor(active, inactive),
      `active and inactive chips both painted ${active.join(',')}`).toBe(false);
  });

  test('the send button is really painted primary', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      messages: [{ id: 'other', author: 'Alice', content: 'hello' }],
    }));
    const corners = await capture(
      page, '#subject', 'chat-send-button',
      `(host) => {
        const send = host.shadowRoot.querySelector('.input-button.send');
        const s = send.getBoundingClientRect();
        return [
          { x: s.x + 5, y: s.y + 5 },
          { x: s.right - 5, y: s.bottom - 5 },
        ];
      }`,
    ) as RGB[];
    const primary = parseRGB(await token(page, '--snice-color-primary'));
    for (const corner of corners) {
      expect(colorNear(corner, primary),
        `send button corner painted ${corner.join(',')} not the primary token`).toBe(true);
    }
  });
});
