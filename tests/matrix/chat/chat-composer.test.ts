/**
 * MATRIX slice — snice-chat composer and typing indicators.
 *
 * Dimensions:
 *   composer: allowFiles (2) x placeholder (default/custom) x channel (2) = 8
 *   typing:   showTyping (2) x users (1 or 2)                         = 4
 *
 * The composer is the documented `input-area` / `input-container` / `input`
 * part chain; `allow-files` gates the attach affordance ("Whether file
 * uploads are enabled") while the send button is the composer's whole
 * purpose (`message-send`). Behavioural claims come from the doc's event
 * list plus its explicit note that "`message-send` does not self-add; the
 * consumer adds the sent message", and from the `typing-start`/`typing-stop`
 * events on the input path. The idle window between typing-start and
 * typing-stop is driven with Vitest fake timers — installed AFTER mount, the
 * established pattern in tests/matrix/banner/banner-lifecycle.test.ts, so
 * the mount itself still settles on a real clock.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { product, expectShape, one, removeComponent, settle } from '../matrix-utils';
import {
  CHANNELS, DEFAULTS, msg, mountChat, partNamed,
  expectedAxes, readAxes, type ChatCombo,
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

/** A message authored before the composer tests type into anything. */
const SEED: ChatMessage[] = [msg({ id: 'seed', author: 'Alice', content: 'hello' })];

function composerShape(el: HTMLElement): {
  hasInputArea: boolean; hasInputContainer: boolean; hasInput: boolean;
  placeholder: string | null; hasAttach: boolean; hasSend: boolean;
  sendIsButton: boolean;
} {
  const input = one<HTMLTextAreaElement>(el, 'textarea.input-field');
  const attach = one<HTMLButtonElement>(el, '.input-button[title="Attach file"]');
  const send = one<HTMLButtonElement>(el, '.input-button.send');
  // Exact part tokens: happy-dom's `[part~="input"]` would answer the
  // `input-area` wrapper first (tests/matrix/part-exact.ts).
  return {
    hasInputArea: !!partNamed(el, 'input-area'),
    hasInputContainer: !!partNamed(el, 'input-container'),
    hasInput: !!partNamed(el, 'input'),
    placeholder: input?.getAttribute('placeholder') ?? null,
    hasAttach: !!attach,
    hasSend: !!send,
    sendIsButton: send?.tagName === 'BUTTON',
  };
}

describe('chat matrix: composer flags x channel', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  const COMBOS = product({
    allowFiles: [false, true],
    placeholder: [DEFAULTS.placeholder, 'Ask a question...'] as const,
    channel: CHANNELS,
  });

  for (const { allowFiles, placeholder, channel } of COMBOS) {
    const id = `files=${allowFiles}/placeholder=${placeholder === DEFAULTS.placeholder ? 'default' : 'custom'}/${channel}`;

    it(`${id}: the composer parts follow the documented flags`, async () => {
      const combo = base({ allowFiles, placeholder, channel });
      el = await mountChat(combo, { messages: SEED });

      const shape = composerShape(el);
      // The part chain and the textarea's placeholder are unconditional;
      // only the attach affordance tracks allow-files.
      expect(shape.hasInputArea, `${id} input-area`).toBe(true);
      expect(shape.hasInputContainer, `${id} input-container`).toBe(true);
      expect(shape.hasInput, `${id} input`).toBe(true);
      expect(shape.placeholder, `${id} placeholder`).toBe(placeholder);
      expect(shape.hasSend, `${id} send`).toBe(true);
      expect(shape.sendIsButton, `${id} send is a button`).toBe(true);
      expect(shape.hasAttach, `${id} attach`).toBe(allowFiles);
      expectShape(readAxes(el, combo), expectedAxes(combo), `${id}/axes`);
    });
  }
});

describe('chat matrix: sending', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  function typeInto(el: HTMLElement, text: string): void {
    const input = one<HTMLTextAreaElement>(el, 'textarea.input-field')!;
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function press(el: HTMLElement, key: string, shiftKey = false): void {
    // composed: true — a browser's keydown crosses the shadow boundary to the
    // host-level listener; a bare synthetic one must too or the send path
    // never sees it.
    one<HTMLTextAreaElement>(el, 'textarea.input-field')!
      .dispatchEvent(new KeyboardEvent('keydown', {
        key, shiftKey, bubbles: true, composed: true, cancelable: true,
      }));
  }

  it('Enter sends the typed message and clears the composer', async () => {
    el = await mountChat(base(), { messages: SEED });
    const seen: any[] = [];
    el.addEventListener('message-send', e => seen.push((e as CustomEvent).detail));
    typeInto(el, 'on it');
    press(el, 'Enter');
    await settle(el, 10);

    expect(seen).toEqual([{ message: 'on it', attachments: undefined }]);
    expect(one<HTMLTextAreaElement>(el, 'textarea.input-field')!.value).toBe('');
  });

  it('message-send does not self-add the message — the consumer adds it', async () => {
    el = await mountChat(base(), { messages: SEED });
    const rowsBefore = el.shadowRoot!.querySelectorAll('.message').length;
    typeInto(el, 'on it');
    press(el, 'Enter');
    await settle(el, 10);
    const rowsAfter = el.shadowRoot!.querySelectorAll('.message').length;
    expect((el as any).messages.length).toBe(SEED.length);
    expect(rowsAfter).toBe(rowsBefore);
  });

  it('Shift+Enter inserts a newline instead of sending', async () => {
    el = await mountChat(base(), { messages: SEED });
    const seen: any[] = [];
    el.addEventListener('message-send', e => seen.push((e as CustomEvent).detail));
    typeInto(el, 'on it');
    press(el, 'Enter', true);
    await settle(el, 10);
    expect(seen).toEqual([]);
    expect(one<HTMLTextAreaElement>(el, 'textarea.input-field')!.value).toBe('on it');
  });

  it('an empty composer sends nothing', async () => {
    el = await mountChat(base(), { messages: SEED });
    const seen: any[] = [];
    el.addEventListener('message-send', e => seen.push((e as CustomEvent).detail));
    press(el, 'Enter');
    await settle(el, 10);
    expect(seen).toEqual([]);
  });

  it('the send button sends the typed message too', async () => {
    el = await mountChat(base(), { messages: SEED });
    const seen: any[] = [];
    el.addEventListener('message-send', e => seen.push((e as CustomEvent).detail));
    typeInto(el, 'shipped');
    one<HTMLButtonElement>(el, '.input-button.send')!.click();
    await settle(el, 10);
    expect(seen).toEqual([{ message: 'shipped', attachments: undefined }]);
  });
});

describe('chat matrix: typing events', () => {
  let el: HTMLElement | undefined;

  afterEach(() => {
    vi.useRealTimers();
    if (el) removeComponent(el);
    el = undefined;
  });

  function typeInto(text: string): void {
    const input = one<HTMLTextAreaElement>(el!, 'textarea.input-field')!;
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  it('typing fires typing-start once, then typing-stop after the idle window', async () => {
    el = await mountChat(base(), { messages: SEED });
    const seen: string[] = [];
    el.addEventListener('typing-start', () => seen.push('typing-start'));
    el.addEventListener('typing-stop', () => seen.push('typing-stop'));

    vi.useFakeTimers();
    typeInto('h');
    typeInto('he');
    typeInto('hel');
    expect(seen, 'one typing-start for a continuous burst').toEqual(['typing-start']);

    vi.advanceTimersByTime(1000);
    expect(seen).toEqual(['typing-start', 'typing-stop']);
  });

  it('a new burst after the idle window fires typing-start again', async () => {
    el = await mountChat(base(), { messages: SEED });
    const seen: string[] = [];
    el.addEventListener('typing-start', () => seen.push('typing-start'));
    el.addEventListener('typing-stop', () => seen.push('typing-stop'));

    vi.useFakeTimers();
    typeInto('h');
    vi.advanceTimersByTime(1000);
    typeInto('w');
    expect(seen).toEqual(['typing-start', 'typing-stop', 'typing-start']);
  });

  it('sending stops the typing indicator state', async () => {
    el = await mountChat(base(), { messages: SEED });
    const seen: string[] = [];
    el.addEventListener('typing-start', () => seen.push('typing-start'));
    el.addEventListener('typing-stop', () => seen.push('typing-stop'));

    vi.useFakeTimers();
    typeInto('h');
    const input = one<HTMLTextAreaElement>(el, 'textarea.input-field')!;
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, composed: true, cancelable: true,
    }));
    await vi.advanceTimersByTimeAsync(1500);
    expect(seen).toEqual(['typing-start', 'typing-stop']);
  });
});

describe('chat matrix: typing indicators', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  const COMBOS = product({
    showTyping: [false, true],
    users: [1, 2],
  });

  for (const { showTyping, users } of COMBOS) {
    const id = `showTyping=${showTyping}/users=${users}`;

    if (!showTyping) {
      it(`${id}: the typing indicator stays hidden regardless of the Map`, async () => {
        const combo = base({ showTyping });
        el = await mountChat(combo, { messages: SEED });
        (el as any).addTypingIndicator('Alice');
        // An unrelated re-render would paint whatever the internal state says;
        // show-typing=false must keep it hidden even then.
        (el as any).currentUser = 'SomeoneElse';
        await settle(el, 30);
        expect(!!partNamed(el, 'typing-indicator'), id).toBe(false);
      });
      continue;
    }

    // FINDING MATRIX-chat-1: addTypingIndicator()/removeTypingIndicator()
    // only touch a private Map and never request a render, so on a connected
    // chat the documented "Show typing indicator" / "Remove typing indicator"
    // effect of the Methods contract (and the doc's own Basic Usage example,
    // which calls them on a live chat) does not land until an unrelated
    // property change happens to re-render the component. The assertion stays
    // as documented; pinned it.fails until the methods request a render.
    it.fails(`${id}: the typing-indicator part follows the flag and names its users`, async () => {
      const combo = base({ showTyping });
      el = await mountChat(combo, { messages: SEED });

      (el as any).addTypingIndicator('Alice');
      if (users === 2) (el as any).addTypingIndicator('Bob');
      await settle(el, 50);

      const indicator = partNamed(el, 'typing-indicator');
      expect(!!indicator, `${id} presence`).toBe(true);
      const said = (indicator?.textContent ?? '').replace(/\s+/g, ' ').trim();
      expect(said.includes('Alice'), `${id} names Alice`).toBe(true);
      if (users === 2) expect(said.includes('Bob'), `${id} names Bob`).toBe(true);

      (el as any).removeTypingIndicator('Alice');
      if (users === 2) (el as any).removeTypingIndicator('Bob');
      await settle(el, 50);
      expect(!!partNamed(el, 'typing-indicator'), `${id} gone after removal`).toBe(false);
    });
  }
});
