/**
 * MATRIX slice — snice-chat message rows: internals, attachments, author
 * colours, and the layout axis.
 *
 * Dimensions:
 *   rows:        showAvatars (2) x showTimestamps (2) x channel (2)      = 8
 *   edited:      edited (2) x channel (2)                                = 4
 *   attachments: attachment (none/image/file) x ownership (2) x chan (2) = 12
 *   colours:     authorColor (unset/safe/unsafe) x map (none/mapped)
 *                x colorAuthors (2)                                      = 18
 *   layout:      layout (2) x channel (2)                                = 4
 *
 * The CSS Parts list in docs/ai/components/chat.md IS the row contract:
 * every combo is judged by `expectedRow`/`readRow`, the shape oracle that
 * derives each part's presence from the doc (avatar/timestamp flags, own vs
 * other, system rows, the reaction-active mapping, the react-anywhere /
 * edit-delete-owner-only action split). The per-author colour cross walks the
 * documented precedence — per-message authorColor, then the authorColors map,
 * then colorAuthors auto-colouring, else nothing — including the doc's
 * explicit rejection of values containing `;`/`{`/`}`. `layout` is selected
 * by the stylesheet as `:host([layout='bubbles'])`, so in this layout-free
 * tier it owns the attribute channel only; the bubbles geometry is the
 * visual tier's to assert.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, expectShape, removeComponent } from '../matrix-utils';
import {
  CHANNELS, DEFAULTS, msg, mountChat, expectRow,
  expectedAxes, readAxes, authorColorVar, MAP_COLOR, MESSAGE_COLOR, UNSAFE_COLOR,
  type ChatCombo,
} from './chat-support';
import type { ChatMessage } from '../../../packages/components/src/chat/snice-chat.types';
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

describe('chat matrix: row internals x flags x channel', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  const COMBOS = product({
    showAvatars: [false, true],
    showTimestamps: [false, true],
    channel: CHANNELS,
  });

  for (const { showAvatars, showTimestamps, channel } of COMBOS) {
    const id = `avatars=${showAvatars}/timestamps=${showTimestamps}/${channel}`;

    it(`${id}: own, other, and system rows match the documented part contract`, async () => {
      const combo = base({ showAvatars, showTimestamps, channel });
      const messages: ChatMessage[] = [
        msg({ id: 'other', author: 'Alice', content: 'their words' }),
        msg({ id: 'own', author: 'Me', content: 'my words', avatar: 'https://example.com/a.png' }),
        msg({ id: 'sys', author: 'System', type: 'system', content: 'Alice joined' }),
      ];
      el = await mountChat(combo, { messages });
      for (const message of messages) {
        expectRow(el, message, combo, `${id}/${message.id}`);
      }
      expectShape(readAxes(el, combo), expectedAxes(combo), `${id}/axes`);
    });
  }
});

describe('chat matrix: the edited marker', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const edited of [false, true]) {
    for (const channel of CHANNELS) {
      const id = `edited=${edited}/${channel}`;

      it(`${id}: the edited part exists exactly when the message says so`, async () => {
        const combo = base({ channel });
        const message = msg({ id: 'e1', author: 'Me', content: 'reworded', edited });
        el = await mountChat(combo, { messages: [message] });
        expectRow(el, message, combo, id);
      });
    }
  }
});

describe('chat matrix: attachments x ownership', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  const ATTACHMENTS = [
    null,
    { type: 'image' as const, url: 'https://example.com/mockup.png', name: 'mockup.png' },
    { type: 'file' as const, url: 'https://example.com/report.pdf', name: 'report.pdf', size: 245760 },
  ];

  for (const [attachmentIndex, attachment] of ATTACHMENTS.entries()) {
    for (const author of ['Me', 'Alice'] as const) {
      for (const channel of CHANNELS) {
        const id = `attachment=${attachment ? attachment.type : 'none'}/${author === 'Me' ? 'own' : 'other'}/${channel}`;

        it(`${id}: the attachment part matches the documented shape`, async () => {
          const combo = base({ channel });
          const message = msg({
            id: `att-${attachmentIndex}-${author}`,
            author,
            content: attachment ? '' : 'see this',
            attachment: attachment ?? undefined,
          });
          el = await mountChat(combo, { messages: [message] });
          expectRow(el, message, combo, id);
        });
      }
    }
  }
});

describe('chat matrix: per-author colour precedence', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  const COMBOS = product({
    authorColor: ['unset', 'safe', 'unsafe'] as const,
    map: ['none', 'mapped'] as const,
    colorAuthors: [false, true],
  });

  for (const { authorColor, map, colorAuthors } of COMBOS) {
    const id = `msg=${authorColor}/map=${map}/auto=${colorAuthors}`;

    it(`${id}: the injected --snice-chat-author-color follows the documented precedence`, async () => {
      const combo = base({ colorAuthors });
      const message = msg({
        id: 'c1', author: 'Alice', content: 'hi',
        authorColor: authorColor === 'safe' ? MESSAGE_COLOR
          : authorColor === 'unsafe' ? UNSAFE_COLOR : undefined,
      });
      el = await mountChat(combo, {
        messages: [message],
        authorColors: map === 'mapped' ? { Alice: MAP_COLOR } : {},
      });

      // Precedence: per-message (safe values only) -> map -> auto -> none.
      const expected = authorColor === 'safe' ? MESSAGE_COLOR
        : map === 'mapped' ? MAP_COLOR
        : colorAuthors ? 'auto' : '';
      const observed = authorColorVar(el, 'c1');
      if (expected === 'auto') {
        // Auto colours are stable per author but their exact palette is not
        // part of the documented contract — only presence is.
        expect(observed, `${id} auto colour injected`).not.toBe('');
      } else {
        expect(observed, id).toBe(expected);
      }
      // Whatever happened, an unsafe value is never injected verbatim.
      expect(observed.includes('position:fixed')).toBe(false);
    });
  }

  it('auto colours are stable per author across their messages', async () => {
    const combo = base({ colorAuthors: true });
    el = await mountChat(combo, {
      messages: [
        msg({ id: 'a1', author: 'Alice', content: 'one' }),
        msg({ id: 'a2', author: 'Alice', content: 'two' }),
        msg({ id: 'b1', author: 'Bob', content: 'three' }),
      ],
    });
    const alice1 = authorColorVar(el, 'a1');
    const alice2 = authorColorVar(el, 'a2');
    expect(alice1, 'same author, same colour').toBe(alice2);
    expect(alice1).not.toBe('');
  });
});

describe('chat matrix: the layout axis', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const layout of ['default', 'bubbles'] as const) {
    for (const channel of CHANNELS) {
      const id = `layout=${layout}/${channel}`;

      it(`${id}: the axis state reflects per the property contract`, async () => {
        const combo = base({ layout, channel });
        const message = msg({ id: 'l1', author: 'Me', content: 'hi' });
        el = await mountChat(combo, { messages: [message] });
        expectRow(el, message, combo, `${id}/row`);
        expectShape(readAxes(el, combo), expectedAxes(combo), `${id}/axes`);
      });
    }
  }
});
