/**
 * MATRIX slice — snice-chat social actions: reactions, inline edit, inline
 * delete confirmation.
 *
 * Dimensions:
 *   reactions render: chips (0/1/2) x active (2) x ownership (2)  = 12
 *   react action:     ownership (2)                               = 2
 *   toggle:           active-chip toggle                          = 2
 *   edit:             commit via (Save/Enter), cancel via
 *                     (Cancel/Escape)                             = 4
 *   delete:           confirm yes/no (delete is "confirmed inline
 *                     first")                                     = 2 (+1 gate)
 *
 * The doc's self-apply rule governs every behavioural assertion here:
 * "React, edit, and delete self-apply to the local `messages` model AND emit
 * the event — don't also mutate in the handler or it double-applies", with
 * "actions - hover action menu (react on any message; edit/delete
 * owner-only)" and "Delete is confirmed inline first". The reaction chips'
 * `reaction-active` part is the doc's name for the current user's own
 * reaction, so the render oracle derives it from `users.includes(currentUser)`.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, captureEvents, removeComponent, settle } from '../matrix-utils';
import {
  DEFAULTS, msg, mountChat, expectRow,
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

/** happy-dom has no scrollIntoView; the inline editors scroll into view. */
if (typeof (Element.prototype as any).scrollIntoView !== 'function') {
  (Element.prototype as any).scrollIntoView = function scrollIntoView() {};
}

function actionButton(el: HTMLElement, id: string, title: string): HTMLButtonElement | null {
  const row = el.shadowRoot!.querySelector(`[data-message-id="${id}"]`);
  return row?.querySelector(`.message-actions button[title="${title}"]`) as HTMLButtonElement | null;
}

describe('chat matrix: reaction rendering', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  const COMBOS = product({
    chips: [0, 1, 2],
    active: [false, true],
    author: ['Me', 'Alice'] as const,
  });

  for (const { chips, active, author } of COMBOS) {
    const id = `chips=${chips}/active=${active}/${author === 'Me' ? 'own' : 'other'}`;

    it(`${id}: the reactions parts mirror the reaction data`, async () => {
      const combo = base();
      const reactions = Array.from({ length: chips }, (_, i) => ({
        emoji: ['👍', '❤️'][i],
        count: i + 1,
        users: active && i === 0 ? ['Me'] : ['Alice', 'Bob'],
      }));
      const message = msg({ id: 'r1', author, content: 'popular', reactions });
      el = await mountChat(combo, { messages: [message] });
      expectRow(el, message, combo, id);
    });
  }
});

describe('chat matrix: the react action self-applies and emits', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const author of ['Me', 'Alice'] as const) {
    const id = `react/${author === 'Me' ? 'own' : 'other'}`;

    it(`${id}: one press adds the reaction to the model, marks it active, and emits message-react`, async () => {
      const combo = base();
      const message = msg({ id: 'react1', author, content: 'react to me' });
      el = await mountChat(combo, { messages: [message] });

      const seen = captureEvents(el, ['message-react']);
      actionButton(el, 'react1', 'React')!.click();
      await settle(el, 20);

      // Self-apply: the model gains the current user's reaction…
      const reactions = (el as any).messages[0].reactions ?? [];
      expect(reactions.length, `${id} model`).toBe(1);
      expect(reactions[0].users).toContain('Me');
      // …the event carries the message id and the emoji…
      expect(seen.types()).toEqual(['message-react']);
      expect(seen.events[0].detail.messageId).toBe('react1');
      expect(typeof seen.events[0].detail.emoji).toBe('string');
      seen.stop();
      // …and the chip renders as the current user's own (reaction-active).
      const chip = el.shadowRoot!.querySelector('[data-message-id="react1"] [part~="reaction"]');
      expect(chip?.getAttribute('part')?.split(/\s+/)).toContain('reaction-active');
    });
  }

  it('toggling the current user off an active chip removes it when the count hits zero', async () => {
    const combo = base();
    const message = msg({
      id: 'toggle1', author: 'Alice', content: 'toggle me',
      reactions: [{ emoji: '❤️', count: 1, users: ['Me'] }],
    });
    el = await mountChat(combo, { messages: [message] });

    const seen = captureEvents(el, ['message-react']);
    const chip = el.shadowRoot!.querySelector('[data-message-id="toggle1"] [part~="reaction"]') as HTMLElement;
    chip.click();
    await settle(el, 20);

    expect(seen.types()).toEqual(['message-react']);
    expect(seen.events[0].detail).toEqual({ messageId: 'toggle1', emoji: '❤️' });
    // Self-apply removed the current user; a lone reaction disappears.
    expect((el as any).messages[0].reactions ?? []).toEqual([]);
    expect(el.shadowRoot!.querySelector('[data-message-id="toggle1"] [part~="reactions"]')).toBeNull();
    seen.stop();
  });

  it('toggling onto an inactive chip keeps the server count and adds the user', async () => {
    const combo = base();
    const message = msg({
      id: 'toggle2', author: 'Alice', content: 'toggle me too',
      reactions: [{ emoji: '❤️', count: 3, users: ['Alice', 'Bob', 'Carol'] }],
    });
    el = await mountChat(combo, { messages: [message] });

    const chip = el.shadowRoot!.querySelector('[data-message-id="toggle2"] [part~="reaction"]') as HTMLElement;
    chip.click();
    await settle(el, 20);

    const reactions = (el as any).messages[0].reactions ?? [];
    expect(reactions[0].count, 'one more reaction, others kept').toBe(4);
    expect(reactions[0].users).toContain('Me');
  });
});

describe('chat matrix: inline edit', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  it('edit is owner-only: another user\'s message has no edit affordance', async () => {
    const combo = base();
    const message = msg({ id: 'notmine', author: 'Alice', content: 'theirs' });
    el = await mountChat(combo, { messages: [message] });
    expect(actionButton(el, 'notmine', 'Edit')).toBeNull();
    expect(actionButton(el, 'notmine', 'Delete')).toBeNull();
    expect(actionButton(el, 'notmine', 'React')).not.toBeNull();
  });

  async function openEditor(id: string): Promise<HTMLTextAreaElement> {
    actionButton(el!, id, 'Edit')!.click();
    // The swap to the editor is a re-render, not a synchronous DOM edit.
    await settle(el!, 20);
    // The editor replaces the body; assert the swap directly (the row oracle
    // describes the resting shape, not the mid-edit one).
    return el!.shadowRoot!.querySelector(`[data-message-id="${id}"] [part~="edit-input"]`) as HTMLTextAreaElement;
  }

  for (const via of ['Save', 'Enter'] as const) {
    it(`committing via ${via} updates the model, marks it edited, and emits message-edit`, async () => {
      const combo = base();
      const message = msg({ id: 'edit1', author: 'Me', content: 'orig' });
      el = await mountChat(combo, { messages: [message] });

      const seen = captureEvents(el, ['message-edit']);
      const editor = await openEditor('edit1');
      expect(editor.value, 'the editor opens on the current content').toBe('orig');
      const row = el!.shadowRoot!.querySelector('[data-message-id="edit1"]')!;
      expect(row.querySelector('[part~="edit-save"]')).not.toBeNull();
      expect(row.querySelector('[part~="edit-cancel"]')).not.toBeNull();
      expect(row.querySelector('[part~="edit-input"]')).not.toBeNull();

      editor.value = 'reworded';
      if (via === 'Save') {
        el!.shadowRoot!.querySelector('[data-message-id="edit1"] [part~="edit-save"]')!.click();
      } else {
        editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      }
      await settle(el, 20);

      expect((el as any).messages[0].content).toBe('reworded');
      expect((el as any).messages[0].edited).toBe(true);
      expect(seen.types()).toEqual(['message-edit']);
      expect(seen.events[0].detail).toEqual({ messageId: 'edit1', newContent: 'reworded' });
      seen.stop();
      // The committed row carries the edited part and no editor.
      expect(row.querySelector('[part~="edited"]')).not.toBeNull();
      expect(row.querySelector('[part~="edit-input"]')).toBeNull();
    });
  }

  for (const via of ['Cancel', 'Escape'] as const) {
    it(`cancelling via ${via} leaves the message untouched and emits nothing`, async () => {
      const combo = base();
      const message = msg({ id: 'edit2', author: 'Me', content: 'orig' });
      el = await mountChat(combo, { messages: [message] });

      const seen = captureEvents(el, ['message-edit']);
      const editor = await openEditor('edit2');
      editor.value = 'discarded';

      if (via === 'Cancel') {
        el!.shadowRoot!.querySelector('[data-message-id="edit2"] [part~="edit-cancel"]')!.click();
      } else {
        editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      }
      await settle(el, 20);

      expect((el as any).messages[0].content).toBe('orig');
      expect((el as any).messages[0].edited).toBeFalsy();
      expect(seen.types()).toEqual([]);
      seen.stop();
      expect(el!.shadowRoot!.querySelector('[data-message-id="edit2"] [part~="edit-input"]')).toBeNull();
    });
  }
});

describe('chat matrix: inline delete confirmation', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  it('requesting delete shows the inline confirm and removes nothing yet', async () => {
    // "Delete is confirmed inline first."
    const combo = base();
    const message = msg({ id: 'del1', author: 'Me', content: 'doomed' });
    el = await mountChat(combo, { messages: [message] });

    const seen = captureEvents(el, ['message-delete']);
    actionButton(el, 'del1', 'Delete')!.click();
    await settle(el, 20);

    const row = el.shadowRoot!.querySelector('[data-message-id="del1"]')!;
    expect(row.querySelector('[part~="delete-confirm"]')).not.toBeNull();
    expect(row.querySelector('[part~="delete-confirm-yes"]')).not.toBeNull();
    expect(row.querySelector('[part~="delete-confirm-no"]')).not.toBeNull();
    expect((el as any).messages.length).toBe(1);
    expect(seen.types()).toEqual([]);
    seen.stop();
  });

  it('confirming removes the message from the model and emits message-delete', async () => {
    const combo = base();
    const message = msg({ id: 'del2', author: 'Me', content: 'doomed' });
    el = await mountChat(combo, { messages: [message] });

    const seen = captureEvents(el, ['message-delete']);
    actionButton(el, 'del2', 'Delete')!.click();
    await settle(el, 20);
    el.shadowRoot!.querySelector('[data-message-id="del2"] [part~="delete-confirm-yes"]')!.click();
    await settle(el, 20);

    expect((el as any).messages.length, 'model').toBe(0);
    expect(el.shadowRoot!.querySelector('[data-message-id="del2"]')).toBeNull();
    expect(seen.types()).toEqual(['message-delete']);
    expect(seen.events[0].detail).toEqual({ messageId: 'del2' });
    seen.stop();
  });

  it('cancelling keeps the message and clears the confirm', async () => {
    const combo = base();
    const message = msg({ id: 'del3', author: 'Me', content: 'spared' });
    el = await mountChat(combo, { messages: [message] });

    const seen = captureEvents(el, ['message-delete']);
    actionButton(el, 'del3', 'Delete')!.click();
    await settle(el, 20);
    el.shadowRoot!.querySelector('[data-message-id="del3"] [part~="delete-confirm-no"]')!.click();
    await settle(el, 20);

    expect((el as any).messages.length).toBe(1);
    expect(seen.types()).toEqual([]);
    seen.stop();
    expect(el.shadowRoot!.querySelector('[data-message-id="del3"] [part~="delete-confirm"]')).toBeNull();
    expect(actionButton(el, 'del3', 'Delete')).not.toBeNull();
  });
});
