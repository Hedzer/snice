/**
 * Smoke slice of the snice-chat matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (vitest.config.ts);
 * the full matrix runs only via `npm run test:matrix`. This file is the
 * standing cost the everyday loop DOES pay, so it lives at `smoke.test.ts`
 * where the config keeps it collected.
 *
 * One combo per feature family of docs/ai/components/chat.md: the bare chat's
 * composer and axis defaults, the own/other/system row contract, markdown
 * bodies with the per-message opt-out, per-author colour, the react/edit/
 * delete self-apply rules, send-does-not-self-add, typing indicators, and
 * the declarative channel's ordering. Structural assertions route through
 * the matrix's own oracle (`expectRow`, `expectedAxes`/`readAxes`), so this
 * file cannot drift into asserting something weaker than the suite it stands
 * in for.
 *
 * BUDGET: well under 10s. New feature combinations belong in the matrix.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { expectShape, captureEvents, one, unmountAll, settle } from '../matrix-utils';
import {
  DEFAULTS, msg, mountChat, expectRow, expectedAxes, readAxes, partNamed,
  authorColorVar, MAP_COLOR, type ChatCombo,
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

/** happy-dom has no scrollIntoView; the inline editors scroll into view. */
if (typeof (Element.prototype as any).scrollIntoView !== 'function') {
  (Element.prototype as any).scrollIntoView = function scrollIntoView() {};
}

afterEach(() => { unmountAll(); });

describe('chat matrix smoke', () => {
  it('a bare chat renders the composer chain and empty message log', async () => {
    const combo = base();
    const el = await mountChat(combo);
    expectShape(readAxes(el, combo), expectedAxes(combo), 'smoke/bare axes');
    expect(partNamed(el, 'base')).not.toBeNull();
    expect(partNamed(el, 'messages')!.getAttribute('role')).toBe('log');
    expect(partNamed(el, 'input-area')).not.toBeNull();
    expect(partNamed(el, 'input-container')).not.toBeNull();
    expect(partNamed<HTMLTextAreaElement>(el, 'input')!.getAttribute('placeholder'))
      .toBe('Type a message...');
    expect(one(el, '.input-button[title="Attach file"]')).not.toBeNull();
    expect(one(el, '.input-button.send')).not.toBeNull();
  });

  it('own, other, and system rows match the documented part contract', async () => {
    const combo = base();
    const messages: ChatMessage[] = [
      msg({ id: 'other', author: 'Alice', content: 'their words' }),
      msg({ id: 'own', author: 'Me', content: 'my words' }),
      msg({ id: 'sys', author: 'System', type: 'system', content: 'Alice joined' }),
    ];
    const el = await mountChat(combo, { messages });
    for (const message of messages) {
      expectRow(el, message, combo, `smoke/${message.id}`);
    }
  });

  it('property-assigned non-default axes reflect (bubbles, markdown, color-authors)', async () => {
    const combo = base({ layout: 'bubbles', markdown: true, colorAuthors: true, channel: 'prop' });
    const el = await mountChat(combo, { messages: [msg({ id: 'ax', author: 'Me', content: 'hi' })] });
    expectShape(readAxes(el, combo), expectedAxes(combo), 'smoke/axes');
    expect(el.getAttribute('layout')).toBe('bubbles');
    expect(el.hasAttribute('markdown')).toBe(true);
    expect(el.hasAttribute('color-authors')).toBe(true);
  });

  it('markdown bodies render through snice-markdown unless format="text" opts out', async () => {
    const combo = base({ markdown: true });
    const el = await mountChat(combo, {
      messages: [
        msg({ id: 'md', author: 'Alice', content: '**bold**' }),
        msg({ id: 'txt', author: 'Bob', content: 'raw', format: 'text' }),
      ],
    });
    expect(one(el, '[data-message-id="md"] snice-markdown')).not.toBeNull();
    expect(one(el, '[data-message-id="txt"] snice-markdown')).toBeNull();
    expect(one(el, '[data-message-id="txt"] [part~="message-text"]')!.textContent).toBe('raw');
  });

  it('an authorColors entry injects --snice-chat-author-color on the author part', async () => {
    const combo = base();
    const el = await mountChat(combo, {
      messages: [msg({ id: 'col', author: 'Alice', content: 'hi' })],
      authorColors: { Alice: MAP_COLOR },
    });
    expect(authorColorVar(el, 'col')).toBe(MAP_COLOR);
  });

  it('reacting self-applies and emits message-react', async () => {
    const combo = base();
    const el = await mountChat(combo, { messages: [msg({ id: 'r', author: 'Alice', content: 'hi' })] });
    const seen = captureEvents(el, ['message-react']);
    el.shadowRoot!.querySelector('[data-message-id="r"] .message-actions button[title="React"]')!.click();
    await settle(el, 20);
    expect(seen.types()).toEqual(['message-react']);
    expect(seen.events[0].detail.messageId).toBe('r');
    expect((el as any).messages[0].reactions.length).toBe(1);
    seen.stop();
  });

  it('editing self-applies, marks edited, and emits message-edit', async () => {
    const combo = base();
    const el = await mountChat(combo, { messages: [msg({ id: 'e', author: 'Me', content: 'orig' })] });
    const seen = captureEvents(el, ['message-edit']);
    el.shadowRoot!.querySelector('[data-message-id="e"] .message-actions button[title="Edit"]')!.click();
    await settle(el, 20);
    const editor = one<HTMLTextAreaElement>(el, '[part~="edit-input"]')!;
    editor.value = 'reworded';
    one<HTMLButtonElement>(el, '[part~="edit-save"]')!.click();
    await settle(el, 20);
    expect((el as any).messages[0]).toMatchObject({ content: 'reworded', edited: true });
    expect(seen.events[0].detail).toEqual({ messageId: 'e', newContent: 'reworded' });
    seen.stop();
  });

  it('delete confirms inline, then removes and emits message-delete', async () => {
    const combo = base();
    const el = await mountChat(combo, { messages: [msg({ id: 'd', author: 'Me', content: 'x' })] });
    const seen = captureEvents(el, ['message-delete']);
    el.shadowRoot!.querySelector('[data-message-id="d"] .message-actions button[title="Delete"]')!.click();
    await settle(el, 20);
    expect(one(el, '[part~="delete-confirm"]')).not.toBeNull();
    one<HTMLButtonElement>(el, '[part~="delete-confirm-yes"]')!.click();
    await settle(el, 20);
    expect((el as any).messages.length).toBe(0);
    expect(seen.events[0].detail).toEqual({ messageId: 'd' });
    seen.stop();
  });

  it('Enter sends message-send without self-adding the message', async () => {
    const combo = base();
    const el = await mountChat(combo, { messages: [msg({ id: 's0', author: 'Alice', content: 'hi' })] });
    const seen: any[] = [];
    el.addEventListener('message-send', e => seen.push((e as CustomEvent).detail));
    const input = one<HTMLTextAreaElement>(el, 'textarea.input-field')!;
    input.value = 'on it';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, composed: true, cancelable: true,
    }));
    await settle(el, 10);
    expect(seen).toEqual([{ message: 'on it', attachments: undefined }]);
    expect((el as any).messages.length).toBe(1);
    expect(input.value).toBe('');
  });

  it('slotted children render first and array entries append after', async () => {
    const combo = base();
    const el = await mountChat(combo, {
      slotted: `<snice-chat-message slot="messages" author="Alice">slot msg</snice-chat-message>`,
    });
    (el as any).addMessage({ type: 'text', content: 'array msg', author: 'Zoe', timestamp: new Date() });
    await (el as any).rendered;
    expect([...(el as any).messages].map((m: ChatMessage) => m.content))
      .toEqual(['slot msg', 'array msg']);
  });

  // FINDING MATRIX-chat-1 (pinned): the typing methods do not request a
  // render, so the documented Show/Remove typing-indicator effect of a live
  // chat does not land on its own. Full story in chat-composer.test.ts.
  it.fails('a typing indicator appears while someone types and leaves when they stop', async () => {
    const combo = base();
    const el = await mountChat(combo, { messages: [msg({ id: 't', author: 'Alice', content: 'hi' })] });
    (el as any).addTypingIndicator('Alice');
    await settle(el, 50);
    expect(partNamed(el, 'typing-indicator')!.textContent).toContain('Alice');
    (el as any).removeTypingIndicator('Alice');
    await settle(el, 50);
    expect(partNamed(el, 'typing-indicator')).toBeNull();
  });
});
