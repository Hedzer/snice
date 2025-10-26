import { describe, it, expect, beforeEach } from 'vitest';
import type { SniceDoc } from '../../components/doc/snice-doc';
import type { DocBlock } from '../../components/doc/snice-doc.types';
import '../../components/doc/snice-doc';

describe('snice-doc', () => {
  let doc: SniceDoc;

  beforeEach(() => {
    doc = document.createElement('snice-doc') as SniceDoc;
    document.body.appendChild(doc);
  });

  afterEach(() => {
    document.body.removeChild(doc);
  });

  it('should be defined', () => {
    expect(customElements.get('snice-doc')).toBeDefined();
  });

  it('should render with default empty paragraph block', () => {
    expect(doc.blocks).toHaveLength(1);
    expect(doc.blocks[0].type).toBe('paragraph');
    expect(doc.blocks[0].content).toBe('');
  });

  it('should have default placeholder', () => {
    expect(doc.placeholder).toBe("Type '/' for commands...");
  });

  it('should allow setting custom placeholder', () => {
    doc.placeholder = 'Start typing...';
    expect(doc.placeholder).toBe('Start typing...');
  });

  it('should not be readonly by default', () => {
    expect(doc.readonly).toBe(false);
  });

  it('should allow setting readonly', () => {
    doc.readonly = true;
    expect(doc.readonly).toBe(true);
  });

  describe('getBlocks()', () => {
    it('should return copy of blocks', () => {
      const blocks = doc.getBlocks();
      expect(blocks).toHaveLength(1);
      expect(blocks).not.toBe(doc.blocks);
    });
  });

  describe('setBlocks()', () => {
    it('should set blocks', () => {
      const newBlocks: DocBlock[] = [
        { id: '1', type: 'heading-1', content: 'Title', formats: [] },
        { id: '2', type: 'paragraph', content: 'Content', formats: [] },
      ];
      doc.setBlocks(newBlocks);
      expect(doc.blocks).toHaveLength(2);
      expect(doc.blocks[0].type).toBe('heading-1');
      expect(doc.blocks[1].type).toBe('paragraph');
    });

    it('should create copies of blocks', () => {
      const newBlocks: DocBlock[] = [
        { id: '1', type: 'paragraph', content: 'Test', formats: [] },
      ];
      doc.setBlocks(newBlocks);
      expect(doc.blocks).not.toBe(newBlocks);
    });
  });

  describe('toJSON()', () => {
    it('should export blocks as JSON', () => {
      const newBlocks: DocBlock[] = [
        { id: '1', type: 'heading-1', content: 'Title', formats: [] },
      ];
      doc.setBlocks(newBlocks);
      const json = doc.toJSON();
      expect(json).toContain('heading-1');
      expect(json).toContain('Title');
    });

    it('should be valid JSON', () => {
      const json = doc.toJSON();
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe('fromJSON()', () => {
    it('should import blocks from JSON', () => {
      const json = JSON.stringify([
        { id: '1', type: 'heading-1', content: 'Title', formats: [] },
        { id: '2', type: 'paragraph', content: 'Content', formats: [] },
      ]);
      doc.fromJSON(json);
      expect(doc.blocks).toHaveLength(2);
      expect(doc.blocks[0].type).toBe('heading-1');
      expect(doc.blocks[1].type).toBe('paragraph');
    });

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      doc.fromJSON('invalid json');
      expect(doc.blocks).toHaveLength(1); // Should keep existing blocks
      consoleSpy.mockRestore();
    });

    it('should handle non-array JSON gracefully', () => {
      doc.fromJSON('{"foo": "bar"}');
      expect(doc.blocks).toHaveLength(1); // Should keep existing blocks
    });
  });

  describe('toMarkdown()', () => {
    it('should export heading-1 as markdown', () => {
      doc.setBlocks([{ id: '1', type: 'heading-1', content: 'Title', formats: [] }]);
      expect(doc.toMarkdown()).toBe('# Title');
    });

    it('should export heading-2 as markdown', () => {
      doc.setBlocks([{ id: '1', type: 'heading-2', content: 'Subtitle', formats: [] }]);
      expect(doc.toMarkdown()).toBe('## Subtitle');
    });

    it('should export heading-3 as markdown', () => {
      doc.setBlocks([{ id: '1', type: 'heading-3', content: 'Section', formats: [] }]);
      expect(doc.toMarkdown()).toBe('### Section');
    });

    it('should export bulleted-list as markdown', () => {
      doc.setBlocks([{ id: '1', type: 'bulleted-list', content: 'Item', formats: [] }]);
      expect(doc.toMarkdown()).toBe('- Item');
    });

    it('should export numbered-list as markdown', () => {
      doc.setBlocks([{ id: '1', type: 'numbered-list', content: 'Item', formats: [] }]);
      expect(doc.toMarkdown()).toBe('1. Item');
    });

    it('should export unchecked todo as markdown', () => {
      doc.setBlocks([{ id: '1', type: 'todo', content: 'Task', formats: [], checked: false }]);
      expect(doc.toMarkdown()).toBe('- [ ] Task');
    });

    it('should export checked todo as markdown', () => {
      doc.setBlocks([{ id: '1', type: 'todo', content: 'Task', formats: [], checked: true }]);
      expect(doc.toMarkdown()).toBe('- [x] Task');
    });

    it('should export code block as markdown', () => {
      doc.setBlocks([{ id: '1', type: 'code', content: 'const x = 1;', formats: [] }]);
      expect(doc.toMarkdown()).toBe('```\nconst x = 1;\n```');
    });

    it('should export quote as markdown', () => {
      doc.setBlocks([{ id: '1', type: 'quote', content: 'Quote', formats: [] }]);
      expect(doc.toMarkdown()).toBe('> Quote');
    });

    it('should export divider as markdown', () => {
      doc.setBlocks([{ id: '1', type: 'divider', content: '', formats: [] }]);
      expect(doc.toMarkdown()).toBe('---');
    });

    it('should export paragraph as markdown', () => {
      doc.setBlocks([{ id: '1', type: 'paragraph', content: 'Text', formats: [] }]);
      expect(doc.toMarkdown()).toBe('Text');
    });

    it('should separate blocks with blank lines', () => {
      doc.setBlocks([
        { id: '1', type: 'heading-1', content: 'Title', formats: [] },
        { id: '2', type: 'paragraph', content: 'Content', formats: [] },
      ]);
      expect(doc.toMarkdown()).toBe('# Title\n\nContent');
    });
  });

  describe('toHTML()', () => {
    it('should export heading-1 as HTML', () => {
      doc.setBlocks([{ id: '1', type: 'heading-1', content: 'Title', formats: [] }]);
      expect(doc.toHTML()).toBe('<h1>Title</h1>');
    });

    it('should export heading-2 as HTML', () => {
      doc.setBlocks([{ id: '1', type: 'heading-2', content: 'Subtitle', formats: [] }]);
      expect(doc.toHTML()).toBe('<h2>Subtitle</h2>');
    });

    it('should export heading-3 as HTML', () => {
      doc.setBlocks([{ id: '1', type: 'heading-3', content: 'Section', formats: [] }]);
      expect(doc.toHTML()).toBe('<h3>Section</h3>');
    });

    it('should export bulleted-list as HTML', () => {
      doc.setBlocks([{ id: '1', type: 'bulleted-list', content: 'Item', formats: [] }]);
      expect(doc.toHTML()).toBe('<ul><li>Item</li></ul>');
    });

    it('should export numbered-list as HTML', () => {
      doc.setBlocks([{ id: '1', type: 'numbered-list', content: 'Item', formats: [] }]);
      expect(doc.toHTML()).toBe('<ol><li>Item</li></ol>');
    });

    it('should export unchecked todo as HTML', () => {
      doc.setBlocks([{ id: '1', type: 'todo', content: 'Task', formats: [], checked: false }]);
      expect(doc.toHTML()).toContain('<input type="checkbox"');
      expect(doc.toHTML()).toContain('Task');
      expect(doc.toHTML()).not.toContain('checked');
    });

    it('should export checked todo as HTML', () => {
      doc.setBlocks([{ id: '1', type: 'todo', content: 'Task', formats: [], checked: true }]);
      expect(doc.toHTML()).toContain('<input type="checkbox" checked');
      expect(doc.toHTML()).toContain('Task');
    });

    it('should export code block as HTML', () => {
      doc.setBlocks([{ id: '1', type: 'code', content: 'const x = 1;', formats: [] }]);
      expect(doc.toHTML()).toBe('<pre><code>const x = 1;</code></pre>');
    });

    it('should export quote as HTML', () => {
      doc.setBlocks([{ id: '1', type: 'quote', content: 'Quote', formats: [] }]);
      expect(doc.toHTML()).toBe('<blockquote>Quote</blockquote>');
    });

    it('should export divider as HTML', () => {
      doc.setBlocks([{ id: '1', type: 'divider', content: '', formats: [] }]);
      expect(doc.toHTML()).toBe('<hr>');
    });

    it('should export paragraph as HTML', () => {
      doc.setBlocks([{ id: '1', type: 'paragraph', content: 'Text', formats: [] }]);
      expect(doc.toHTML()).toBe('<p>Text</p>');
    });

    it('should escape HTML characters', () => {
      doc.setBlocks([{ id: '1', type: 'paragraph', content: '<script>alert("xss")</script>', formats: [] }]);
      const html = doc.toHTML();
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should separate blocks with newlines', () => {
      doc.setBlocks([
        { id: '1', type: 'heading-1', content: 'Title', formats: [] },
        { id: '2', type: 'paragraph', content: 'Content', formats: [] },
      ]);
      expect(doc.toHTML()).toBe('<h1>Title</h1>\n<p>Content</p>');
    });
  });

  describe('clear()', () => {
    it('should reset to single empty paragraph', () => {
      doc.setBlocks([
        { id: '1', type: 'heading-1', content: 'Title', formats: [] },
        { id: '2', type: 'paragraph', content: 'Content', formats: [] },
      ]);
      doc.clear();
      expect(doc.blocks).toHaveLength(1);
      expect(doc.blocks[0].type).toBe('paragraph');
      expect(doc.blocks[0].content).toBe('');
    });
  });

  describe('events', () => {
    it('should emit doc-change when blocks change', async () => {
      const handler = vi.fn();
      doc.addEventListener('doc-change', handler);
      doc.setBlocks([{ id: '1', type: 'paragraph', content: 'Test', formats: [] }]);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(handler).toHaveBeenCalled();
    });
  });
});
