/**
 * MATRIX slice — snice-chat markdown bodies and the declarative
 * `<snice-chat-message>` channel.
 *
 * Dimensions:
 *   markdown (array): chat markdown (2) x per-message format (3) x
 *                     channel (2)                                    = 12
 *   markdown (slot):  chat markdown (2) x format attribute (3)       = 6
 *   slotted mapping:  authoring attributes -> rendered row           = 1 mount
 *   ordering:         slot children first, array entries after       = 2 channels
 *
 * "ChatMessage adds: `format?: 'text'|'markdown'` (unset = chat-level
 * `markdown` applies)" and "`markdown: boolean = false; // render bodies as
 * markdown by default`" give an exact truth table, crossed here through BOTH
 * message authoring channels — the array and the declarative child whose
 * `format` attribute the doc documents ("unset = chat-level markdown
 * applies"). The doc's slot note — "declarative message child (rendered
 * first; `messages`-array entries append after") — is an ORDERING contract,
 * and the child's attributes are the doc's own list (author, avatar, type,
 * format, edited, author-color; body = element text content).
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, expectShape, removeComponent } from '../matrix-utils';
import {
  CHANNELS, MESSAGE_FORMATS, DEFAULTS, msg, mountChat, expectRow, readRow,
  expectedRow, authorColorVar, MESSAGE_COLOR, type ChatCombo, type MessageFormatAxis,
} from './chat-support';
import type { ChatMessage, MessageFormat } from '../../../packages/components/src/chat/snice-chat.types';
import '../../../packages/components/src/chat/snice-chat';

const base = (over: Partial<ChatCombo> = {}): ChatCombo => ({
  currentUser: 'Me',
  placeholder: DEFAULTS.placeholder,
  showAvatars: DEFAULTS.showAvatars,
  showTimestamps: DEFAULTS.showTimestamps,
  allowFiles: DEFAULTS.allowFiles,
  showTyping: DEFAULTS.showTyping,
  markdown: DEFAULTS.markdown,
  layout: DEFAULTS.layout,
  colorAuthors: DEFAULTS.colorAuthors,
  channel: 'attr',
  ...over,
});

const BODY = '**bold**';

const formatOf = (axis: MessageFormatAxis): MessageFormat | undefined =>
  axis === 'unset' ? undefined : axis;

/** The doc's truth table: markdown body iff per-message markdown, or
 *  chat-level markdown the message has not opted out of. */
function expectMarkdownBody(chatMarkdown: boolean, format: MessageFormatAxis): boolean {
  return format === 'markdown' || (chatMarkdown && format !== 'text');
}

describe('chat matrix: markdown x per-message format (array channel)', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  const COMBOS = product({
    chatMarkdown: [false, true],
    format: MESSAGE_FORMATS,
    channel: CHANNELS,
  });

  for (const { chatMarkdown, format, channel } of COMBOS) {
    const id = `chat=${chatMarkdown}/format=${format}/${channel}`;

    it(`${id}: the body renders through the documented format decision`, async () => {
      const combo = base({ markdown: chatMarkdown, channel });
      const message = msg({ id: 'md1', author: 'Alice', content: BODY, format: formatOf(format) });
      el = await mountChat(combo, { messages: [message] });

      expectRow(el, message, combo, id);
      const shape = readRow(el, 'md1');
      expect(shape.bodyIsMarkdown, `${id} snice-markdown`).toBe(expectMarkdownBody(chatMarkdown, format));
    });
  }
});

describe('chat matrix: markdown x format attribute (declarative channel)', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  const COMBOS = product({
    chatMarkdown: [false, true],
    format: MESSAGE_FORMATS,
  });

  for (const { chatMarkdown, format } of COMBOS) {
    const id = `chat=${chatMarkdown}/format=${format}/slotted`;

    it(`${id}: a slotted child obeys the same format decision`, async () => {
      const combo = base({ markdown: chatMarkdown });
      const formatAttr = format === 'unset' ? '' : ` format="${format}"`;
      el = await mountChat(combo, {
        slotted: `<snice-chat-message slot="messages" author="Alice"${formatAttr}>${BODY}</snice-chat-message>`,
      });

      const message: ChatMessage = (el as any).messages[0];
      expect(message.content, `${id} body = element text content`).toBe(BODY);
      expectRow(el, message, combo, id);
      expect(readRow(el, message.id).bodyIsMarkdown, `${id} snice-markdown`)
        .toBe(expectMarkdownBody(chatMarkdown, format));
    });
  }
});

describe('chat matrix: slotted message attributes map to the row contract', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  it('author, avatar, type, edited, and author-color all land in the rendered row', async () => {
    const combo = base();
    el = await mountChat(combo, {
      slotted: [
        `<snice-chat-message slot="messages" author="Alice" avatar="https://example.com/a.png">hi</snice-chat-message>`,
        `<snice-chat-message slot="messages" author="Bob" edited>reworded</snice-chat-message>`,
        `<snice-chat-message slot="messages" author="System" type="system">Bob joined</snice-chat-message>`,
        `<snice-chat-message slot="messages" author="Carol" author-color="${MESSAGE_COLOR}">mine is blue</snice-chat-message>`,
        `<snice-chat-message slot="messages" author="Me">own words</snice-chat-message>`,
      ].join(''),
    });

    const messages: ChatMessage[] = (el as any).messages;
    expect(messages.length).toBe(5);
    for (const message of messages) {
      expectRow(el, message, combo, `slotted/${message.author}/${message.content}`);
    }
    // The doc's own examples for the child attributes.
    expect(messages[0].avatar).toBe('https://example.com/a.png');
    expect(messages[2].type).toBe('system');
    expect(messages[1].edited).toBe(true);
    expect(authorColorVar(el, messages[3].id)).toBe(MESSAGE_COLOR);
  });
});

describe('chat matrix: slot children render first, array entries append after', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const channel of CHANNELS) {
    it(`${channel}: document order is slotted, then array`, async () => {
      const combo = base({ channel });
      el = await mountChat(combo, {
        slotted: [
          `<snice-chat-message slot="messages" author="Alice">slot one</snice-chat-message>`,
          `<snice-chat-message slot="messages" author="Bob">slot two</snice-chat-message>`,
        ].join(''),
      });
      // The documented array-append path: addMessage() extends whatever the
      // slot already contributed (replacing the whole array from outside is
      // a consumer overwrite, not an append).
      (el as any).addMessage({ type: 'text', content: 'array msg', author: 'Zoe', timestamp: new Date() });
      await (el as any).rendered;

      const order = [...(el as any).messages].map((m: ChatMessage) => m.content);
      expect(order).toEqual(['slot one', 'slot two', 'array msg']);
      // And the DOM agrees with the model's order.
      const domOrder = [...el.shadowRoot!.querySelectorAll('.message')]
        .map(row => row.querySelector('[part~="message-text"]')?.textContent);
      expect(domOrder).toEqual(['slot one', 'slot two', 'array msg']);
    });
  }
});
