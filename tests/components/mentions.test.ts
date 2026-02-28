import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait, queryShadow, queryShadowAll, trackRenders } from './test-utils';
import '../../components/mentions/snice-mentions';
import type { SniceMentionsElement, MentionUser } from '../../components/mentions/snice-mentions.types';

const sampleUsers: MentionUser[] = [
  { id: 'u1', name: 'Alice Johnson', avatar: 'https://example.com/alice.jpg' },
  { id: 'u2', name: 'Bob Smith' },
  { id: 'u3', name: 'Charlie Davis' },
  { id: 'u4', name: 'Diana Prince' },
];

describe('snice-mentions', () => {
  let el: SniceMentionsElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      expect(el).toBeTruthy();
      expect(el.tagName).toBe('SNICE-MENTIONS');
    });

    it('should have default properties', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      expect(el.value).toBe('');
      expect(el.users).toEqual([]);
      expect(el.placeholder).toBe('Type @ to mention someone...');
      expect(el.readonly).toBe(false);
      expect(el.trigger).toBe('@');
    });

    it('should render editor', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      await wait(50);
      const editor = queryShadow(el as HTMLElement, '.mentions__editor');
      expect(editor).toBeTruthy();
    });

    it('should render textarea', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      await wait(50);
      const textarea = queryShadow(el as HTMLElement, '.mentions__textarea');
      expect(textarea).toBeTruthy();
    });
  });

  describe('value', () => {
    it('should display plain text', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      const tracker = trackRenders(el as HTMLElement);
      el.value = 'Hello world';
      await tracker.next();

      const textarea = queryShadow<HTMLTextAreaElement>(el as HTMLElement, '.mentions__textarea');
      expect(textarea?.value).toBe('Hello world');
    });

    it('should display mention markers as @Name', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      const tracker = trackRenders(el as HTMLElement);
      el.value = 'Hello @[Alice Johnson](u1) how are you?';
      await tracker.next();

      const textarea = queryShadow<HTMLTextAreaElement>(el as HTMLElement, '.mentions__textarea');
      expect(textarea?.value).toBe('Hello @Alice Johnson how are you?');
    });
  });

  describe('getValue()', () => {
    it('should return raw value with mention markers', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      el.value = 'Hello @[Alice Johnson](u1)';
      expect(el.getValue()).toBe('Hello @[Alice Johnson](u1)');
    });
  });

  describe('getPlainText()', () => {
    it('should return text without mention markers', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      el.value = 'Hello @[Alice Johnson](u1) and @[Bob Smith](u2)';
      expect(el.getPlainText()).toBe('Hello Alice Johnson and Bob Smith');
    });

    it('should return same text when no mentions', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      el.value = 'Hello world';
      expect(el.getPlainText()).toBe('Hello world');
    });
  });

  describe('getMentions()', () => {
    it('should return empty array when no mentions', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      el.value = 'Hello world';
      expect(el.getMentions()).toEqual([]);
    });

    it('should return mentions with correct data', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      el.value = 'Hello @[Alice Johnson](u1) and @[Bob Smith](u2)';
      const mentions = el.getMentions();

      expect(mentions.length).toBe(2);
      expect(mentions[0].id).toBe('u1');
      expect(mentions[0].name).toBe('Alice Johnson');
      expect(mentions[1].id).toBe('u2');
      expect(mentions[1].name).toBe('Bob Smith');
    });

    it('should return correct indices', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      el.value = '@[Alice Johnson](u1) said hi';
      const mentions = el.getMentions();

      expect(mentions.length).toBe(1);
      expect(mentions[0].startIndex).toBe(0);
      expect(mentions[0].endIndex).toBe('@[Alice Johnson](u1)'.length);
    });
  });

  describe('readonly', () => {
    it('should apply readonly class', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions', { readonly: true });
      await wait(50);

      const editor = queryShadow(el as HTMLElement, '.mentions__editor--readonly');
      expect(editor).toBeTruthy();
    });

    it('should set textarea readonly', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions', { readonly: true });
      await wait(50);

      const textarea = queryShadow<HTMLTextAreaElement>(el as HTMLElement, '.mentions__textarea');
      expect(textarea?.readOnly).toBe(true);
    });
  });

  describe('users', () => {
    it('should accept users array', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      el.users = sampleUsers;
      expect(el.users.length).toBe(4);
    });
  });

  describe('placeholder', () => {
    it('should display placeholder text', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      el.placeholder = 'Mention someone...';
      await wait(50);

      const textarea = queryShadow<HTMLTextAreaElement>(el as HTMLElement, '.mentions__textarea');
      expect(textarea?.placeholder).toBe('Mention someone...');
    });
  });

  describe('events', () => {
    it('should emit value-change when value changes', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      let detail: any = null;
      (el as HTMLElement).addEventListener('value-change', (e: Event) => {
        detail = (e as CustomEvent).detail;
      });

      el.value = 'Hello world';
      await wait(50);

      expect(detail).toBeTruthy();
      expect(detail.value).toBe('Hello world');
      expect(detail.plainText).toBe('Hello world');
      expect(detail.mentions).toEqual([]);
    });

    it('should emit value-change with mention data', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      let detail: any = null;
      (el as HTMLElement).addEventListener('value-change', (e: Event) => {
        detail = (e as CustomEvent).detail;
      });

      el.value = 'Hey @[Alice Johnson](u1)!';
      await wait(50);

      expect(detail).toBeTruthy();
      expect(detail.mentions.length).toBe(1);
      expect(detail.mentions[0].id).toBe('u1');
    });
  });

  describe('trigger', () => {
    it('should default to @', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      expect(el.trigger).toBe('@');
    });

    it('should accept custom trigger', async () => {
      el = await createComponent<SniceMentionsElement>('snice-mentions');
      el.trigger = '#';
      expect(el.trigger).toBe('#');
    });
  });
});
