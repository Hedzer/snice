import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SniceChat } from '../../packages/components/src/chat/snice-chat';
import type { ChatMessage } from '../../packages/components/src/chat/snice-chat.types';
import { PAPER_CLIP, PAPER_AIRPLANE_SOLID } from '../../packages/components/src/icons';
import '../../packages/components/src/chat/snice-chat';
import '../../packages/components/src/chat/snice-chat-message';

/** Extract the path data from an icon constant for containment assertions. */
function iconPathData(icon: string): string {
  return icon.match(/ d="([^"]+)"/)![1];
}

// happy-dom doesn't implement Element.scrollIntoView; the chat calls it from
// scrollToMessage and from the inline edit/delete-confirm reveal. Install a
// no-op for the whole file; tests that care about calls spy on it.
if (typeof (Element.prototype as any).scrollIntoView !== 'function') {
  (Element.prototype as any).scrollIntoView = function () {};
}

describe('snice-chat', () => {
  let chat: SniceChat;

  beforeEach(() => {
    chat = document.createElement('snice-chat') as SniceChat;
    document.body.appendChild(chat);
  });

  afterEach(() => {
    document.body.removeChild(chat);
  });

  it('should be defined', () => {
    expect(customElements.get('snice-chat')).toBeDefined();
  });

  it('should have default properties', () => {
    expect(chat.messages).toEqual([]);
    expect(chat.currentUser).toBe('You');
    expect(chat.currentAvatar).toBe('');
    expect(chat.placeholder).toBe('Type a message...');
    expect(chat.allowFiles).toBe(true);
    expect(chat.showTyping).toBe(true);
    expect(chat.showAvatars).toBe(true);
    expect(chat.showTimestamps).toBe(true);
  });

  it('should allow setting custom placeholder', () => {
    chat.placeholder = 'Send a message...';
    expect(chat.placeholder).toBe('Send a message...');
  });

  it('should allow setting current user', () => {
    chat.currentUser = 'Alice';
    expect(chat.currentUser).toBe('Alice');
  });

  it('should allow setting current avatar', () => {
    chat.currentAvatar = 'https://example.com/avatar.jpg';
    expect(chat.currentAvatar).toBe('https://example.com/avatar.jpg');
  });

  it('should allow disabling features', () => {
    chat.allowFiles = false;
    chat.showTyping = false;
    chat.showAvatars = false;
    chat.showTimestamps = false;

    expect(chat.allowFiles).toBe(false);
    expect(chat.showTyping).toBe(false);
    expect(chat.showAvatars).toBe(false);
    expect(chat.showTimestamps).toBe(false);
  });

  describe('addMessage()', () => {
    it('should add a message', () => {
      chat.addMessage({
        type: 'text',
        content: 'Hello',
        author: 'Alice',
        timestamp: new Date(),
        formats: [],
      });

      expect(chat.messages).toHaveLength(1);
      expect(chat.messages[0].content).toBe('Hello');
      expect(chat.messages[0].author).toBe('Alice');
    });

    it('should generate unique ID', () => {
      chat.addMessage({
        type: 'text',
        content: 'Message 1',
        author: 'Alice',
        timestamp: new Date(),
        formats: [],
      });
      chat.addMessage({
        type: 'text',
        content: 'Message 2',
        author: 'Bob',
        timestamp: new Date(),
        formats: [],
      });

      expect(chat.messages[0].id).toBeTruthy();
      expect(chat.messages[1].id).toBeTruthy();
      expect(chat.messages[0].id).not.toBe(chat.messages[1].id);
    });

    it('should support different message types', () => {
      chat.addMessage({
        type: 'system',
        content: 'Alice joined',
        author: 'System',
        timestamp: new Date(),
        formats: [],
      });

      expect(chat.messages[0].type).toBe('system');
    });

    it('should support message with attachment', () => {
      chat.addMessage({
        type: 'file',
        content: '',
        author: 'Alice',
        timestamp: new Date(),
        formats: [],
        attachment: {
          type: 'file',
          url: 'https://example.com/file.pdf',
          name: 'document.pdf',
          size: 1024,
        },
      });

      expect(chat.messages[0].attachment).toBeDefined();
      expect(chat.messages[0].attachment?.name).toBe('document.pdf');
    });

    it('should support message with reactions', () => {
      chat.addMessage({
        type: 'text',
        content: 'Great!',
        author: 'Alice',
        timestamp: new Date(),
        formats: [],
        reactions: [
          { emoji: '👍', count: 2, users: ['Bob', 'Charlie'] },
        ],
      });

      expect(chat.messages[0].reactions).toBeDefined();
      expect(chat.messages[0].reactions).toHaveLength(1);
      expect(chat.messages[0].reactions![0].emoji).toBe('👍');
    });
  });

  describe('updateMessage()', () => {
    beforeEach(() => {
      chat.addMessage({
        type: 'text',
        content: 'Original',
        author: 'Alice',
        timestamp: new Date(),
        formats: [],
      });
    });

    it('should update message content', () => {
      const messageId = chat.messages[0].id;
      chat.updateMessage(messageId, { content: 'Updated', edited: true });

      expect(chat.messages[0].content).toBe('Updated');
      expect(chat.messages[0].edited).toBe(true);
    });

    it('should update message reactions', () => {
      const messageId = chat.messages[0].id;
      chat.updateMessage(messageId, {
        reactions: [{ emoji: '❤️', count: 1, users: ['Bob'] }],
      });

      expect(chat.messages[0].reactions).toHaveLength(1);
      expect(chat.messages[0].reactions![0].emoji).toBe('❤️');
    });

    it('should not affect other messages', () => {
      chat.addMessage({
        type: 'text',
        content: 'Second message',
        author: 'Bob',
        timestamp: new Date(),
        formats: [],
      });

      const firstId = chat.messages[0].id;
      chat.updateMessage(firstId, { content: 'Modified' });

      expect(chat.messages[0].content).toBe('Modified');
      expect(chat.messages[1].content).toBe('Second message');
    });
  });

  describe('deleteMessage()', () => {
    beforeEach(() => {
      chat.addMessage({
        type: 'text',
        content: 'Message 1',
        author: 'Alice',
        timestamp: new Date(),
        formats: [],
      });
      chat.addMessage({
        type: 'text',
        content: 'Message 2',
        author: 'Bob',
        timestamp: new Date(),
        formats: [],
      });
    });

    it('should delete message by ID', () => {
      const messageId = chat.messages[0].id;
      chat.deleteMessage(messageId);

      expect(chat.messages).toHaveLength(1);
      expect(chat.messages[0].content).toBe('Message 2');
    });

    it('should handle deleting non-existent message', () => {
      chat.deleteMessage('invalid-id');
      expect(chat.messages).toHaveLength(2);
    });
  });

  describe('clear()', () => {
    it('should clear all messages', () => {
      chat.addMessage({
        type: 'text',
        content: 'Message 1',
        author: 'Alice',
        timestamp: new Date(),
        formats: [],
      });
      chat.addMessage({
        type: 'text',
        content: 'Message 2',
        author: 'Bob',
        timestamp: new Date(),
        formats: [],
      });

      chat.clear();
      expect(chat.messages).toHaveLength(0);
    });
  });

  describe('typing indicators', () => {
    it('should add typing indicator', () => {
      chat.addTypingIndicator('Alice');
      // Typing indicators are internal state, we can't directly test
      // but we can verify the method doesn't throw
      expect(chat).toBeDefined();
    });

    it('should remove typing indicator', () => {
      chat.addTypingIndicator('Alice');
      chat.removeTypingIndicator('Alice');
      expect(chat).toBeDefined();
    });

    it('should handle multiple typing indicators', () => {
      chat.addTypingIndicator('Alice');
      chat.addTypingIndicator('Bob');
      chat.removeTypingIndicator('Alice');
      expect(chat).toBeDefined();
    });
  });

  describe('scrollToMessage()', () => {
    it('should handle scrolling to message', async () => {
      chat.addMessage({
        type: 'text',
        content: 'Message',
        author: 'Alice',
        timestamp: new Date(),
        formats: [],
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const spy = vi.spyOn(Element.prototype as any, 'scrollIntoView');
      try {
        const messageId = chat.messages[0].id;
        chat.scrollToMessage(messageId);
        expect(spy).toHaveBeenCalledTimes(1);
      } finally {
        spy.mockRestore();
      }
    });

    it('should handle scrolling to non-existent message', () => {
      chat.scrollToMessage('invalid-id');
      expect(chat).toBeDefined();
    });
  });

  describe('scrollToBottom()', () => {
    it('should scroll to bottom', () => {
      chat.scrollToBottom();
      // Just verify it doesn't throw
      expect(chat).toBeDefined();
    });
  });

  describe('declarative messages (slot ingestion)', () => {
    let c: SniceChat;

    afterEach(() => {
      c?.remove();
    });

    it('ingests slotted snice-chat-message children into messages', async () => {
      c = document.createElement('snice-chat') as SniceChat;
      c.innerHTML = `
        <snice-chat-message slot="messages" author="Alice">Hello</snice-chat-message>
        <snice-chat-message slot="messages" author="Bob">Hi there</snice-chat-message>
      `;
      document.body.appendChild(c);
      await c.ready;

      expect(c.messages).toHaveLength(2);
      expect(c.messages[0].author).toBe('Alice');
      expect(c.messages[0].content).toBe('Hello');
      expect(c.messages[1].author).toBe('Bob');
      expect(c.messages[1].content).toBe('Hi there');
    });

    it('assigns a unique id to each ingested message', async () => {
      c = document.createElement('snice-chat') as SniceChat;
      c.innerHTML = `
        <snice-chat-message slot="messages" author="Alice">one</snice-chat-message>
        <snice-chat-message slot="messages" author="Bob">two</snice-chat-message>
      `;
      document.body.appendChild(c);
      await c.ready;

      expect(c.messages[0].id).toBeTruthy();
      expect(c.messages[1].id).toBeTruthy();
      expect(c.messages[0].id).not.toBe(c.messages[1].id);
    });

    it('merges slotted children (first) with the messages array instead of discarding it', async () => {
      c = document.createElement('snice-chat') as SniceChat;
      c.messages = [
        { id: 'arr', type: 'text', content: 'array msg', author: 'Zoe', timestamp: new Date() },
      ];
      c.innerHTML = `<snice-chat-message slot="messages" author="Alice">slot msg</snice-chat-message>`;
      document.body.appendChild(c);
      await c.ready;

      expect(c.messages).toHaveLength(2);
      expect(c.messages[0].author).toBe('Alice');
      expect(c.messages[0].content).toBe('slot msg');
      expect(c.messages[1].content).toBe('array msg');
    });

    it('keeps the messages array when there are no slotted children', async () => {
      c = document.createElement('snice-chat') as SniceChat;
      c.messages = [
        { id: 'arr', type: 'text', content: 'array msg', author: 'Zoe', timestamp: new Date() },
      ];
      document.body.appendChild(c);
      await c.ready;

      expect(c.messages).toHaveLength(1);
      expect(c.messages[0].author).toBe('Zoe');
    });
  });

  describe('styling hooks (parts)', () => {
    let c: SniceChat;

    afterEach(() => {
      c?.remove();
    });

    async function mount(messages: ChatMessage[], currentUser = 'Me'): Promise<ShadowRoot> {
      c = document.createElement('snice-chat') as SniceChat;
      c.currentUser = currentUser;
      c.messages = messages;
      document.body.appendChild(c);
      await c.ready;
      return c.shadowRoot as ShadowRoot;
    }

    it('exposes parts on every message internal', async () => {
      const sr = await mount([
        {
          id: '1', type: 'text', content: 'hi', author: 'Alice', timestamp: new Date(),
          reactions: [{ emoji: '👍', count: 1, users: ['Bob'] }],
        },
      ]);

      expect(sr.querySelector('[part~="message"]')).toBeTruthy();
      expect(sr.querySelector('[part~="avatar"]')).toBeTruthy();
      expect(sr.querySelector('[part~="author"]')).toBeTruthy();
      expect(sr.querySelector('[part~="timestamp"]')).toBeTruthy();
      expect(sr.querySelector('[part~="message-text"]')).toBeTruthy();
      expect(sr.querySelector('[part~="reactions"]')).toBeTruthy();
      expect(sr.querySelector('[part~="reaction"]')).toBeTruthy();
    });

    it('marks own messages message-own and others message-other', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: 'mine', author: 'Me', timestamp: new Date() },
        { id: '2', type: 'text', content: 'theirs', author: 'Alice', timestamp: new Date() },
      ]);

      const own = sr.querySelector('[part~="message-own"]');
      const other = sr.querySelector('[part~="message-other"]');
      expect(own).toBeTruthy();
      expect(other).toBeTruthy();
      // the generic "message" part name is always present alongside the variant
      expect(own!.getAttribute('part')).toContain('message');
      expect(other!.getAttribute('part')).toContain('message');
    });

    it('exposes a system-message part for system messages', async () => {
      const sr = await mount([
        { id: 's', type: 'system', content: 'Alice joined', author: 'System', timestamp: new Date() },
      ]);
      expect(sr.querySelector('[part~="system-message"]')).toBeTruthy();
    });
  });

  describe('per-user author colors', () => {
    let c: SniceChat;

    afterEach(() => {
      c?.remove();
    });

    async function mount(
      messages: ChatMessage[],
      configure?: (chat: SniceChat) => void
    ): Promise<ShadowRoot> {
      c = document.createElement('snice-chat') as SniceChat;
      configure?.(c);
      c.messages = messages;
      document.body.appendChild(c);
      await c.ready;
      return c.shadowRoot as ShadowRoot;
    }

    function authorVar(sr: ShadowRoot): string {
      const el = sr.querySelector('[part~="author"]') as HTMLElement;
      return el.style.getPropertyValue('--snice-chat-author-color').trim();
    }

    it('sets no author-color var by default (default render unchanged)', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: 'hi', author: 'Alice', timestamp: new Date() },
      ]);
      expect(authorVar(sr)).toBe('');
    });

    it('applies an explicit color from the authorColors map', async () => {
      const sr = await mount(
        [{ id: '1', type: 'text', content: 'hi', author: 'Alice', timestamp: new Date() }],
        (chat) => { chat.authorColors = { Alice: '#ff0000' }; }
      );
      expect(authorVar(sr)).toBe('#ff0000');
    });

    it('auto-colors authors only when color-authors is set, stable per author', async () => {
      const sr = await mount(
        [
          { id: '1', type: 'text', content: 'a', author: 'Alice', timestamp: new Date() },
          { id: '2', type: 'text', content: 'b', author: 'Alice', timestamp: new Date() },
        ],
        (chat) => { chat.setAttribute('color-authors', ''); }
      );
      const authors = Array.from(sr.querySelectorAll('[part~="author"]')) as HTMLElement[];
      const c1 = authors[0].style.getPropertyValue('--snice-chat-author-color').trim();
      const c2 = authors[1].style.getPropertyValue('--snice-chat-author-color').trim();
      expect(c1).not.toBe('');
      expect(c1).toBe(c2); // same author → same color
    });

    it('per-message authorColor overrides the map', async () => {
      const sr = await mount(
        [{ id: '1', type: 'text', content: 'hi', author: 'Alice', timestamp: new Date(), authorColor: '#00ff00' }],
        (chat) => { chat.authorColors = { Alice: '#ff0000' }; }
      );
      expect(authorVar(sr)).toBe('#00ff00');
    });
  });

  describe('markdown rendering', () => {
    let c: SniceChat;

    afterEach(() => {
      c?.remove();
    });

    async function mount(
      messages: ChatMessage[],
      configure?: (chat: SniceChat) => void
    ): Promise<ShadowRoot> {
      c = document.createElement('snice-chat') as SniceChat;
      configure?.(c);
      c.messages = messages;
      document.body.appendChild(c);
      await c.ready;
      return c.shadowRoot as ShadowRoot;
    }

    it('renders plain text (no snice-markdown) by default', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: '**hi**', author: 'Alice', timestamp: new Date() },
      ]);
      expect(sr.querySelector('snice-markdown')).toBeNull();
      expect(sr.querySelector('[part~="message-text"]')!.textContent).toContain('**hi**');
    });

    it('renders a message with format=markdown through snice-markdown', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: '**hi**', author: 'Alice', timestamp: new Date(), format: 'markdown' },
      ]);
      const md = sr.querySelector('snice-markdown') as any;
      expect(md).toBeTruthy();
      expect(md.content).toBe('**hi**');
    });

    it('renders all messages as markdown when the markdown attribute is set', async () => {
      const sr = await mount(
        [{ id: '1', type: 'text', content: '_yo_', author: 'Alice', timestamp: new Date() }],
        (chat) => { chat.setAttribute('markdown', ''); }
      );
      expect(sr.querySelector('snice-markdown')).toBeTruthy();
    });

    it('lets a per-message format=text opt out of the component-wide markdown', async () => {
      const sr = await mount(
        [{ id: '1', type: 'text', content: 'raw', author: 'Alice', timestamp: new Date(), format: 'text' }],
        (chat) => { chat.setAttribute('markdown', ''); }
      );
      expect(sr.querySelector('snice-markdown')).toBeNull();
    });
  });

  describe('built-in bubble layout + remaining parts', () => {
    let c: SniceChat;

    afterEach(() => {
      c?.remove();
    });

    it('defaults layout to "default"', () => {
      c = document.createElement('snice-chat') as SniceChat;
      expect(c.layout).toBe('default');
    });

    it('reflects the layout attribute for the opt-in bubbles look', async () => {
      c = document.createElement('snice-chat') as SniceChat;
      c.setAttribute('layout', 'bubbles');
      c.messages = [
        { id: '1', type: 'text', content: 'mine', author: 'Me', timestamp: new Date() },
      ];
      c.currentUser = 'Me';
      document.body.appendChild(c);
      await c.ready;
      expect(c.layout).toBe('bubbles');
      expect(c.hasAttribute('layout')).toBe(true);
    });

    it('exposes an attachment part', async () => {
      c = document.createElement('snice-chat') as SniceChat;
      c.messages = [
        {
          id: '1', type: 'file', content: '', author: 'Alice', timestamp: new Date(),
          attachment: { type: 'file', url: 'http://x/y.pdf', name: 'y.pdf', size: 10 },
        },
      ];
      document.body.appendChild(c);
      await c.ready;
      expect(c.shadowRoot!.querySelector('[part~="attachment"]')).toBeTruthy();
    });

    it('exposes a typing-indicator part', async () => {
      c = document.createElement('snice-chat') as SniceChat;
      c.addTypingIndicator('Bob');
      document.body.appendChild(c);
      await c.ready;
      expect(c.shadowRoot!.querySelector('[part~="typing-indicator"]')).toBeTruthy();
    });
  });

  describe('events', () => {
    it('should emit message-send event', () => {
      const handler = vi.fn();
      chat.addEventListener('message-send', handler);

      // We can't easily trigger this from the test as it requires DOM interaction
      // Just verify the event listener can be attached
      expect(handler).toHaveBeenCalledTimes(0);
    });

    it('should emit message-edit event', () => {
      const handler = vi.fn();
      chat.addEventListener('message-edit', handler);
      expect(handler).toHaveBeenCalledTimes(0);
    });

    it('should emit message-delete event', () => {
      const handler = vi.fn();
      chat.addEventListener('message-delete', handler);
      expect(handler).toHaveBeenCalledTimes(0);
    });

    it('should emit message-react event', () => {
      const handler = vi.fn();
      chat.addEventListener('message-react', handler);
      expect(handler).toHaveBeenCalledTimes(0);
    });

    it('should emit typing-start event', () => {
      const handler = vi.fn();
      chat.addEventListener('typing-start', handler);
      expect(handler).toHaveBeenCalledTimes(0);
    });

    it('should emit typing-stop event', () => {
      const handler = vi.fn();
      chat.addEventListener('typing-stop', handler);
      expect(handler).toHaveBeenCalledTimes(0);
    });
  });

  describe('message actions (react / inline edit / delete confirm)', () => {
    let c: SniceChat;
    const flush = () => new Promise((r) => setTimeout(r, 30));

    // happy-dom doesn't implement Element.scrollIntoView; the inline editor
    // and delete confirm both scroll themselves into view after render, so
    // stub it for every test in this block and count the calls.
    let scrollIntoViewCalls = 0;
    let restoreScrollIntoView: () => void;

    beforeEach(() => {
      scrollIntoViewCalls = 0;
      const proto = Element.prototype as any;
      const had = typeof proto.scrollIntoView === 'function';
      const original = proto.scrollIntoView;
      proto.scrollIntoView = function () { scrollIntoViewCalls++; };
      restoreScrollIntoView = () => {
        if (had) proto.scrollIntoView = original;
        else delete proto.scrollIntoView;
      };
    });

    afterEach(() => {
      restoreScrollIntoView();
      c?.remove();
    });

    async function mount(messages: ChatMessage[], currentUser = 'Me'): Promise<ShadowRoot> {
      c = document.createElement('snice-chat') as SniceChat;
      c.currentUser = currentUser;
      c.messages = messages;
      document.body.appendChild(c);
      await c.ready;
      return c.shadowRoot as ShadowRoot;
    }

    function actionButton(sr: ShadowRoot, messageId: string, title: string): HTMLButtonElement {
      const msg = sr.querySelector(`[data-message-id="${messageId}"]`)!;
      return msg.querySelector(`.message-actions button[title="${title}"]`) as HTMLButtonElement;
    }

    // --- React on any message (not just your own) ---------------------------
    it('shows the react action on another user\'s message', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: 'theirs', author: 'Alice', timestamp: new Date() },
      ]);
      expect(actionButton(sr, '1', 'React')).toBeTruthy();
      // edit/delete are owner-only — absent on another user's message
      expect(actionButton(sr, '1', 'Edit')).toBeFalsy();
      expect(actionButton(sr, '1', 'Delete')).toBeFalsy();
    });

    it('reacting to another user\'s message emits message-react and toggles the local model', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: 'theirs', author: 'Alice', timestamp: new Date() },
      ]);
      const detail: { messageId: string; emoji: string }[] = [];
      c.addEventListener('message-react', (e) => detail.push((e as CustomEvent).detail));

      actionButton(sr, '1', 'React').click();
      await flush();

      expect(detail).toEqual([{ messageId: '1', emoji: '👍' }]);
      const reactions = c.messages[0].reactions ?? [];
      expect(reactions).toHaveLength(1);
      expect(reactions[0]).toMatchObject({ emoji: '👍', count: 1, users: ['Me'] });
    });

    it('reacting twice toggles the current user off the reaction', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: 'theirs', author: 'Alice', timestamp: new Date() },
      ]);
      actionButton(sr, '1', 'React').click();
      await flush();
      actionButton(sr, '1', 'React').click();
      await flush();
      expect(c.messages[0].reactions ?? []).toHaveLength(0);
    });

    // --- Inline edit (owner only) ------------------------------------------
    it('clicking edit on your own message swaps the body for a textarea', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: 'mine', author: 'Me', timestamp: new Date() },
      ]);
      actionButton(sr, '1', 'Edit').click();
      await flush();

      const editor = sr.querySelector('[part~="edit-input"]') as HTMLTextAreaElement;
      expect(editor).toBeTruthy();
      expect(editor.value).toBe('mine');
      // actions are hidden while editing
      expect(actionButton(sr, '1', 'Edit')).toBeFalsy();
    });

    it('Save commits the edit, marks it edited, and emits message-edit', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: 'mine', author: 'Me', timestamp: new Date() },
      ]);
      const edits: { messageId: string; newContent: string }[] = [];
      c.addEventListener('message-edit', (e) => edits.push((e as CustomEvent).detail));

      actionButton(sr, '1', 'Edit').click();
      await flush();
      const editor = sr.querySelector('[part~="edit-input"]') as HTMLTextAreaElement;
      editor.value = 'mine, edited';
      (sr.querySelector('[part~="edit-save"]') as HTMLButtonElement).click();
      await flush();

      expect(c.messages[0].content).toBe('mine, edited');
      expect(c.messages[0].edited).toBe(true);
      expect(edits).toEqual([{ messageId: '1', newContent: 'mine, edited' }]);
      expect(sr.querySelector('[part~="edit-input"]')).toBeFalsy();
    });

    it('Enter commits the edit', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: 'mine', author: 'Me', timestamp: new Date() },
      ]);
      actionButton(sr, '1', 'Edit').click();
      await flush();
      const editor = sr.querySelector('[part~="edit-input"]') as HTMLTextAreaElement;
      editor.value = 'via enter';
      editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await flush();

      expect(c.messages[0].content).toBe('via enter');
      expect(sr.querySelector('[part~="edit-input"]')).toBeFalsy();
    });

    it('Escape cancels the edit without changing content or emitting', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: 'mine', author: 'Me', timestamp: new Date() },
      ]);
      const edits = vi.fn();
      c.addEventListener('message-edit', edits);

      actionButton(sr, '1', 'Edit').click();
      await flush();
      const editor = sr.querySelector('[part~="edit-input"]') as HTMLTextAreaElement;
      editor.value = 'should be discarded';
      editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await flush();

      expect(c.messages[0].content).toBe('mine');
      expect(c.messages[0].edited).toBeFalsy();
      expect(edits).not.toHaveBeenCalled();
      expect(sr.querySelector('[part~="edit-input"]')).toBeFalsy();
    });

    // --- Delete confirm (owner only) ---------------------------------------
    it('clicking delete shows an inline confirm and does NOT remove the message', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: 'mine', author: 'Me', timestamp: new Date() },
      ]);
      const deletes = vi.fn();
      c.addEventListener('message-delete', deletes);

      actionButton(sr, '1', 'Delete').click();
      await flush();

      expect(sr.querySelector('[part~="delete-confirm"]')).toBeTruthy();
      expect(c.messages).toHaveLength(1);
      expect(deletes).not.toHaveBeenCalled();
      // actions are hidden while confirming
      expect(actionButton(sr, '1', 'Delete')).toBeFalsy();
    });

    it('confirming the delete removes the message and emits message-delete', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: 'mine', author: 'Me', timestamp: new Date() },
      ]);
      const deletes: { messageId: string }[] = [];
      c.addEventListener('message-delete', (e) => deletes.push((e as CustomEvent).detail));

      actionButton(sr, '1', 'Delete').click();
      await flush();
      (sr.querySelector('[part~="delete-confirm-yes"]') as HTMLButtonElement).click();
      await flush();

      expect(c.messages).toHaveLength(0);
      expect(deletes).toEqual([{ messageId: '1' }]);
    });

    it('cancelling the delete keeps the message and clears the confirm', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: 'mine', author: 'Me', timestamp: new Date() },
      ]);
      const deletes = vi.fn();
      c.addEventListener('message-delete', deletes);

      actionButton(sr, '1', 'Delete').click();
      await flush();
      (sr.querySelector('[part~="delete-confirm-no"]') as HTMLButtonElement).click();
      await flush();

      expect(c.messages).toHaveLength(1);
      expect(deletes).not.toHaveBeenCalled();
      expect(sr.querySelector('[part~="delete-confirm"]')).toBeFalsy();
      expect(actionButton(sr, '1', 'Delete')).toBeTruthy();
    });

    // --- Inline UI stays visible inside the scroll area ---------------------
    // Editing or delete-confirming the last message grows the message body
    // past the bottom of .messages-area; the inline UI must scroll into view
    // or its buttons are clipped and unreachable.
    function stubScrollIntoView(): { calls: () => number; restore: () => void } {
      const proto = Element.prototype as any;
      const had = typeof proto.scrollIntoView === 'function';
      const original = proto.scrollIntoView;
      let count = 0;
      proto.scrollIntoView = function () { count++; };
      return {
        calls: () => count,
        restore: () => {
          if (had) proto.scrollIntoView = original;
          else delete proto.scrollIntoView;
        },
      };
    }

    it('starting an inline edit scrolls the editor into view', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: 'mine', author: 'Me', timestamp: new Date() },
      ]);
      const scroll = stubScrollIntoView();
      try {
        actionButton(sr, '1', 'Edit').click();
        await flush();
        expect(scroll.calls()).toBeGreaterThanOrEqual(1);
      } finally {
        scroll.restore();
      }
    });

    it('opening the delete confirm scrolls it into view', async () => {
      const sr = await mount([
        { id: '1', type: 'text', content: 'mine', author: 'Me', timestamp: new Date() },
      ]);
      const scroll = stubScrollIntoView();
      try {
        actionButton(sr, '1', 'Delete').click();
        await flush();
        expect(scroll.calls()).toBeGreaterThanOrEqual(1);
      } finally {
        scroll.restore();
      }
    });
  });

  describe('author color safety', () => {
    it('rejects author colors that would inject extra CSS declarations', async () => {
      const c = document.createElement('snice-chat') as SniceChat;
      c.messages = [{
        id: '1', type: 'text', content: 'hi', author: 'Eve', timestamp: new Date(),
        authorColor: 'red;position:fixed;inset:0;z-index:9999',
      }];
      document.body.appendChild(c);
      await c.ready;
      await new Promise((r) => setTimeout(r, 30));

      const author = c.shadowRoot!.querySelector('.message-author') as HTMLElement;
      expect(author.getAttribute('style') ?? '').not.toContain('position:fixed');
      c.remove();
    });

    it('keeps legitimate CSS color values', async () => {
      const c = document.createElement('snice-chat') as SniceChat;
      c.messages = [{
        id: '1', type: 'text', content: 'hi', author: 'Ann', timestamp: new Date(),
        authorColor: 'hsl(214 55% 48%)',
      }];
      document.body.appendChild(c);
      await c.ready;
      await new Promise((r) => setTimeout(r, 30));

      const author = c.shadowRoot!.querySelector('.message-author') as HTMLElement;
      expect(author.getAttribute('style') ?? '').toContain('hsl(214 55% 48%)');
      c.remove();
    });
  });

  describe('reaction count integrity', () => {
    it('adjusts server-supplied counts by ±1 instead of recomputing from a truncated users array', async () => {
      const c = document.createElement('snice-chat') as SniceChat;
      c.currentUser = 'Me';
      c.messages = [{
        id: '1', type: 'text', content: 'popular', author: 'Alice', timestamp: new Date(),
        reactions: [{ emoji: '❤️', count: 128, users: ['a', 'b'] }],
      }];
      document.body.appendChild(c);
      await c.ready;
      await new Promise((r) => setTimeout(r, 30));

      // React button adds 👍 (new reaction) — toggle the existing ❤️ chip instead
      (c.shadowRoot!.querySelector('.reaction') as HTMLElement).click();
      await new Promise((r) => setTimeout(r, 30));

      expect(c.messages[0].reactions![0].count).toBe(129);

      // Toggling off restores the original count
      (c.shadowRoot!.querySelector('.reaction') as HTMLElement).click();
      await new Promise((r) => setTimeout(r, 30));
      expect(c.messages[0].reactions![0].count).toBe(128);
      c.remove();
    });
  });

  describe('scroll behavior on message changes', () => {
    it('scrolls to bottom when a message is appended but NOT on reaction/edit', async () => {
      const c = document.createElement('snice-chat') as SniceChat;
      c.currentUser = 'Me';
      c.messages = [
        { id: '1', type: 'text', content: 'old', author: 'Alice', timestamp: new Date() },
        { id: '2', type: 'text', content: 'mine', author: 'Me', timestamp: new Date() },
      ];
      document.body.appendChild(c);
      await c.ready;
      await new Promise((r) => setTimeout(r, 30));

      const spy = vi.spyOn(c, 'scrollToBottom');

      // Reaction: messages reassigned, but nothing appended — must not scroll
      (c.shadowRoot!.querySelector('.message-actions button[title="React"]') as HTMLButtonElement).click();
      await new Promise((r) => setTimeout(r, 30));
      expect(spy).not.toHaveBeenCalled();

      // Append: must scroll
      c.addMessage({ type: 'text', content: 'new', author: 'Alice', timestamp: new Date() });
      await new Promise((r) => setTimeout(r, 30));
      expect(spy).toHaveBeenCalled();
      c.remove();
    });
  });

  describe('inline UI exclusivity', () => {
    it('opening the delete confirm closes an editor open on another message (and vice versa)', async () => {
      const c = document.createElement('snice-chat') as SniceChat;
      c.currentUser = 'Me';
      c.messages = [
        { id: 'a', type: 'text', content: 'first', author: 'Me', timestamp: new Date() },
        { id: 'b', type: 'text', content: 'second', author: 'Me', timestamp: new Date() },
      ];
      document.body.appendChild(c);
      await c.ready;
      await new Promise((r) => setTimeout(r, 30));

      const sr = c.shadowRoot!;
      const btn = (id: string, title: string) =>
        sr.querySelector(`[data-message-id="${id}"] .message-actions button[title="${title}"]`) as HTMLButtonElement;

      btn('a', 'Edit').click();
      await new Promise((r) => setTimeout(r, 30));
      expect(sr.querySelector('.message-edit')).toBeTruthy();

      btn('b', 'Delete').click();
      await new Promise((r) => setTimeout(r, 30));
      expect(sr.querySelector('.message-confirm')).toBeTruthy();
      expect(sr.querySelector('.message-edit')).toBeFalsy();
      c.remove();
    });
  });

  describe('declarative markdown + slot state stability', () => {
    const hosts: HTMLElement[] = [];

    function slottedChat(inner: string): SniceChat {
      const host = document.createElement('div');
      host.innerHTML = `<snice-chat markdown current-user="Me">${inner}</snice-chat>`;
      document.body.appendChild(host);
      hosts.push(host);
      return host.querySelector('snice-chat') as SniceChat;
    }

    afterEach(() => {
      hosts.splice(0).forEach((h) => h.remove());
    });

    it('renders slotted messages as markdown under a chat-level markdown flag', async () => {
      const c = slottedChat(
        `<snice-chat-message author="Alice">**bold**</snice-chat-message>`
      );
      await c.ready;
      await new Promise((r) => setTimeout(r, 50));

      expect(c.shadowRoot!.querySelector('snice-markdown')).toBeTruthy();
    });

    it('keeps stable ids and runtime reactions across a re-ingest', async () => {
      const c = slottedChat(
        `<snice-chat-message author="Alice">one</snice-chat-message>`
      );
      await c.ready;
      await new Promise((r) => setTimeout(r, 50));

      const idBefore = c.messages[0].id;
      (c.shadowRoot!.querySelector('.message-actions button[title="React"]') as HTMLButtonElement).click();
      await new Promise((r) => setTimeout(r, 30));
      expect(c.messages[0].reactions).toHaveLength(1);

      // Appending a new declarative message re-ingests; state must survive
      const extra = document.createElement('snice-chat-message');
      extra.setAttribute('author', 'Bob');
      extra.textContent = 'two';
      c.appendChild(extra);
      await new Promise((r) => setTimeout(r, 50));

      expect(c.messages).toHaveLength(2);
      expect(c.messages[0].id).toBe(idBefore);
      expect(c.messages[0].reactions).toHaveLength(1);
    });

    it('keeps imperatively-added messages when slotted children re-ingest', async () => {
      const c = slottedChat(
        `<snice-chat-message author="Alice">one</snice-chat-message>`
      );
      await c.ready;
      await new Promise((r) => setTimeout(r, 50));

      c.addMessage({ type: 'text', content: 'imperative', author: 'Me', timestamp: new Date() });
      const extra = document.createElement('snice-chat-message');
      extra.setAttribute('author', 'Bob');
      extra.textContent = 'two';
      c.appendChild(extra);
      await new Promise((r) => setTimeout(r, 50));

      const contents = c.messages.map((m) => m.content);
      expect(contents).toContain('imperative');
      expect(contents).toContain('one');
      expect(contents).toContain('two');
    });

    it('re-ingests when an attribute changes on a slotted message', async () => {
      const c = slottedChat(
        `<snice-chat-message author="Alice">one</snice-chat-message>`
      );
      await c.ready;
      await new Promise((r) => setTimeout(r, 50));

      c.querySelector('snice-chat-message')!.setAttribute('author', 'Renamed');
      await new Promise((r) => setTimeout(r, 50));

      expect(c.messages[0].author).toBe('Renamed');
    });
  });

  describe('composer icons (shared icon set)', () => {
    it('attach-file button uses the shared paperclip icon', async () => {
      await chat.ready;
      const attach = chat.shadowRoot!.querySelector(
        '.input-button[title="Attach file"]'
      ) as HTMLButtonElement;
      expect(attach).toBeTruthy();
      expect(attach.innerHTML).toContain(iconPathData(PAPER_CLIP));
    });

    it('send button uses the shared paper-airplane icon', async () => {
      await chat.ready;
      const send = chat.shadowRoot!.querySelector(
        '.input-button.send'
      ) as HTMLButtonElement;
      expect(send).toBeTruthy();
      expect(send.innerHTML).toContain(iconPathData(PAPER_AIRPLANE_SOLID));
    });
  });
});
