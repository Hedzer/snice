import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/markdown/snice-markdown';
import type { SniceMarkdownElement } from '../../components/markdown/snice-markdown.types';

describe('snice-markdown', () => {
  let markdown: SniceMarkdownElement;

  afterEach(() => {
    if (markdown) {
      removeComponent(markdown as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render markdown element', async () => {
      markdown = await createComponent<SniceMarkdownElement>('snice-markdown');

      expect(markdown).toBeTruthy();
      expect(markdown.tagName).toBe('SNICE-MARKDOWN');
    });

    it('should have default properties', async () => {
      markdown = await createComponent<SniceMarkdownElement>('snice-markdown');

      expect(markdown.sanitize).toBe(true);
      expect(markdown.theme).toBe('default');
    });

    it('should render markdown content', async () => {
      markdown = await createComponent<SniceMarkdownElement>('snice-markdown');
      await wait(10);

      const body = queryShadow(markdown as HTMLElement, '.markdown-body');
      expect(body).toBeTruthy();
    });
  });

  describe('properties', () => {
    it('should accept sanitize attribute', async () => {
      markdown = await createComponent<SniceMarkdownElement>('snice-markdown', {
        sanitize: false
      });

      expect(markdown.sanitize).toBe(false);
    });

    it('should accept theme attribute', async () => {
      markdown = await createComponent<SniceMarkdownElement>('snice-markdown', {
        theme: 'github'
      });

      expect(markdown.theme).toBe('github');
    });
  });

  describe('content rendering', () => {
    it('should set content via setContent method', async () => {
      markdown = await createComponent<SniceMarkdownElement>('snice-markdown');
      await wait(10);

      markdown.setContent('# Hello World');
      await wait(50);

      const body = queryShadow(markdown as HTMLElement, '.markdown-body');
      expect(body?.innerHTML).toContain('<h1>');
      expect(body?.innerHTML).toContain('Hello World');
    });

    it('should render headings', async () => {
      markdown = await createComponent<SniceMarkdownElement>('snice-markdown');
      await wait(10);

      markdown.setContent('# H1\n## H2\n### H3');
      await wait(50);

      const body = queryShadow(markdown as HTMLElement, '.markdown-body');
      expect(body?.innerHTML).toContain('<h1>');
      expect(body?.innerHTML).toContain('<h2>');
      expect(body?.innerHTML).toContain('<h3>');
    });

    it('should render bold and italic', async () => {
      markdown = await createComponent<SniceMarkdownElement>('snice-markdown');
      await wait(10);

      markdown.setContent('**bold** and *italic*');
      await wait(50);

      const body = queryShadow(markdown as HTMLElement, '.markdown-body');
      expect(body?.innerHTML).toContain('<strong>');
      expect(body?.innerHTML).toContain('<em>');
    });

    it('should render links', async () => {
      markdown = await createComponent<SniceMarkdownElement>('snice-markdown');
      await wait(10);

      markdown.setContent('[link](https://example.com)');
      await wait(50);

      const body = queryShadow(markdown as HTMLElement, '.markdown-body');
      expect(body?.innerHTML).toContain('<a');
    });

    it('should render lists', async () => {
      markdown = await createComponent<SniceMarkdownElement>('snice-markdown');
      await wait(10);

      markdown.setContent('- item 1\n- item 2\n\n1. ordered 1\n2. ordered 2');
      await wait(50);

      const body = queryShadow(markdown as HTMLElement, '.markdown-body');
      expect(body?.innerHTML).toContain('<ul>');
      expect(body?.innerHTML).toContain('<ol>');
    });

    it('should render code blocks', async () => {
      markdown = await createComponent<SniceMarkdownElement>('snice-markdown');
      await wait(10);

      markdown.setContent('```js\nconst x = 1;\n```');
      await wait(50);

      const body = queryShadow(markdown as HTMLElement, '.markdown-body');
      expect(body?.innerHTML).toContain('<pre>');
      expect(body?.innerHTML).toContain('<code');
    });
  });

  describe('sanitization', () => {
    it('should sanitize dangerous HTML when enabled', async () => {
      markdown = await createComponent<SniceMarkdownElement>('snice-markdown', {
        sanitize: true
      });
      await wait(10);

      markdown.setContent('<script>alert("xss")</script><p>Safe</p>');
      await wait(50);

      const body = queryShadow(markdown as HTMLElement, '.markdown-body');
      expect(body?.innerHTML).not.toContain('<script>');
      expect(body?.innerHTML).toContain('Safe');
    });
  });

  describe('events', () => {
    it('should dispatch markdown-render event', async () => {
      markdown = await createComponent<SniceMarkdownElement>('snice-markdown');

      let eventFired = false;
      markdown.addEventListener('markdown-render', () => {
        eventFired = true;
      });

      markdown.setContent('# Test');
      await wait(50);

      expect(eventFired).toBe(true);
    });
  });
});
