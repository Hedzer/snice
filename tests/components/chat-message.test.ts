import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { SniceChatMessage } from '../../components/chat/snice-chat-message';
import '../../components/chat/snice-chat-message';

describe('snice-chat-message', () => {
  let msg: SniceChatMessage;

  beforeEach(() => {
    msg = document.createElement('snice-chat-message') as SniceChatMessage;
    document.body.appendChild(msg);
  });

  afterEach(() => {
    msg.remove();
  });

  it('should be defined', () => {
    expect(customElements.get('snice-chat-message')).toBeDefined();
  });

  it('should have default properties', () => {
    expect(msg.author).toBe('');
    expect(msg.avatar).toBe('');
    expect(msg.type).toBe('text');
    // No format default: undefined means "defer to the chat-level markdown flag"
    expect(msg.format).toBeUndefined();
    expect(msg.edited).toBe(false);
    expect(msg.authorColor).toBe('');
  });

  describe('getMessageDefinition()', () => {
    it('serializes attributes and slot text into a ChatMessage', () => {
      msg.setAttribute('author', 'Alice');
      msg.setAttribute('format', 'markdown');
      msg.textContent = '**hi**';

      const def = msg.getMessageDefinition();

      expect(def.author).toBe('Alice');
      expect(def.content).toBe('**hi**');
      expect(def.format).toBe('markdown');
      expect(def.type).toBe('text');
      expect(def.edited).toBe(false);
    });

    it('omits format when the attribute is absent so the chat-level markdown flag applies', () => {
      const def = msg.getMessageDefinition();
      expect(def.format).toBeUndefined();
    });

    it('serializes reactions, attachment, and thread set as properties', () => {
      const reactions = [{ emoji: '🚀', count: 2, users: ['a', 'b'] }];
      const attachment = { type: 'file' as const, url: '/f.pdf', name: 'f.pdf' };
      (msg as any).reactions = reactions;
      (msg as any).attachment = attachment;
      const def = msg.getMessageDefinition();
      expect(def.reactions).toEqual(reactions);
      expect(def.attachment).toEqual(attachment);
    });

    it('parses the timestamp attribute into a Date', () => {
      const iso = '2026-05-26T09:24:00.000Z';
      msg.setAttribute('timestamp', iso);

      const def = msg.getMessageDefinition();

      expect(def.timestamp).toBeInstanceOf(Date);
      expect((def.timestamp as Date).toISOString()).toBe(iso);
    });

    it('defaults the timestamp to now when the attribute is absent', () => {
      const def = msg.getMessageDefinition();
      expect(def.timestamp).toBeInstanceOf(Date);
    });

    it('omits avatar when not set', () => {
      const def = msg.getMessageDefinition();
      expect(def.avatar).toBeUndefined();
    });

    it('carries author-color through when set', () => {
      msg.setAttribute('author-color', '#ff8800');
      const def = msg.getMessageDefinition();
      expect(def.authorColor).toBe('#ff8800');
    });
  });
});
