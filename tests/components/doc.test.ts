import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/doc/snice-doc';
import type { SniceDocElement } from '../../components/doc/snice-doc.types';

describe('snice-doc', () => {
  let doc: SniceDocElement;

  afterEach(() => {
    if (doc) {
      removeComponent(doc as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render doc element', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc');

      expect(doc).toBeTruthy();
      expect(doc.tagName).toBe('SNICE-DOC');
    });

    it('should have default properties', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc');

      expect(doc.placeholder).toBe('Start typing...');
      expect(doc.readonly).toBe(false);
      expect(doc.icons).toBe('default');
    });

    it('should render editor structure', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc');
      await wait(50);

      const wrapper = queryShadow(doc as HTMLElement, '.doc-wrapper');
      expect(wrapper).toBeTruthy();

      const toolbar = queryShadow(doc as HTMLElement, '.toolbar');
      expect(toolbar).toBeTruthy();

      const editor = queryShadow(doc as HTMLElement, '.doc-editor');
      expect(editor).toBeTruthy();
    });
  });

  describe('properties', () => {
    it('should accept placeholder attribute', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc', {
        placeholder: 'Custom placeholder'
      });

      expect(doc.placeholder).toBe('Custom placeholder');
    });

    it('should accept readonly attribute', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc', {
        readonly: true
      });
      await wait(50);

      expect(doc.readonly).toBe(true);
    });

    it('should accept icons attribute', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc', {
        icons: 'material'
      });

      expect(doc.icons).toBe('material');
    });
  });

  describe('API methods', () => {
    it('should have getHTML method', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc');

      expect(typeof doc.getHTML).toBe('function');
    });

    it('should have setHTML method', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc');

      expect(typeof doc.setHTML).toBe('function');
    });

    it('should have getText method', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc');

      expect(typeof doc.getText).toBe('function');
    });

    it('should have getMarkdown method', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc');

      expect(typeof doc.getMarkdown).toBe('function');
    });

    it('should have clear method', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc');

      expect(typeof doc.clear).toBe('function');
    });

    it('should set and get HTML content', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc');
      await wait(50);

      doc.setHTML('<p>Test content</p>');
      const html = doc.getHTML();

      expect(html).toContain('Test content');
    });

    it('should clear editor content', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc');
      await wait(50);

      doc.setHTML('<p>Some content to clear</p>');
      expect(doc.getHTML()).toContain('Some content to clear');

      doc.clear();
      expect(doc.getHTML()).toBe('<p><br></p>');
    });

    it('should get plain text', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc');
      await wait(50);

      doc.setHTML('<p>Hello</p><p>World</p>');
      const text = doc.getText();

      expect(text).toContain('Hello');
      expect(text).toContain('World');
    });

    it('should convert to markdown', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc');
      await wait(50);

      doc.setHTML('<h1>Title</h1><p>Paragraph text</p>');
      const md = doc.getMarkdown();

      expect(md).toContain('# Title');
      expect(md).toContain('Paragraph text');
    });

    it('should queue HTML set before editor is ready', async () => {
      const el = document.createElement('snice-doc') as SniceDocElement;
      el.setHTML('<p>Queued content</p>');
      document.body.appendChild(el);
      await (el as any).ready;
      await wait(50);

      doc = el;
      expect(doc.getHTML()).toContain('Queued content');
    });
  });

  describe('toolbar', () => {
    it('should render toolbar buttons', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc');
      await wait(50);

      const buttons = queryShadow(doc as HTMLElement, '.toolbar')
        ?.querySelectorAll('.toolbar-btn');
      expect(buttons).toBeTruthy();
      expect(buttons!.length).toBeGreaterThan(0);
    });

    it('should render toolbar dividers', async () => {
      doc = await createComponent<SniceDocElement>('snice-doc');
      await wait(50);

      const dividers = queryShadow(doc as HTMLElement, '.toolbar')
        ?.querySelectorAll('.toolbar-divider');
      expect(dividers).toBeTruthy();
      expect(dividers!.length).toBeGreaterThan(0);
    });
  });

  describe('@reconnect: selectionchange listener survives reconnect', () => {
    /**
     * `handleSelectionChange` is a private bound method, so spies after-the-fact
     * don't intercept already-attached listeners. We instead stub
     * `document.addEventListener`/`removeEventListener` for the 'selectionchange'
     * event and assert net add/remove balance across the lifecycle.
     */
    function trackSelectionchange() {
      const adds: any[] = [];
      const removes: any[] = [];
      const origAdd = document.addEventListener;
      const origRemove = document.removeEventListener;
      document.addEventListener = ((type: string, h: any, opts?: any) => {
        if (type === 'selectionchange') adds.push(h);
        return (origAdd as any).call(document, type, h, opts);
      }) as any;
      document.removeEventListener = ((type: string, h: any, opts?: any) => {
        if (type === 'selectionchange') removes.push(h);
        return (origRemove as any).call(document, type, h, opts);
      }) as any;
      return {
        net: () => adds.length - removes.length,
        restore: () => {
          document.addEventListener = origAdd;
          document.removeEventListener = origRemove;
        },
      };
    }

    it('attaches a selectionchange listener on first connect', async () => {
      const tracker = trackSelectionchange();
      doc = await createComponent<SniceDocElement>('snice-doc');
      expect(tracker.net()).toBeGreaterThanOrEqual(1);
      tracker.restore();
    });

    it('removes the listener on dispose, re-attaches on reconnect', async () => {
      const tracker = trackSelectionchange();
      doc = await createComponent<SniceDocElement>('snice-doc');
      const netAfterReady = tracker.net();
      expect(netAfterReady).toBeGreaterThanOrEqual(1);

      const parent = doc.parentNode!;
      parent.removeChild(doc);
      await wait(20);
      // After dispose, net should drop by exactly the number @ready added.
      const netAfterDispose = tracker.net();
      expect(netAfterDispose).toBeLessThan(netAfterReady);

      parent.appendChild(doc);
      await wait(20);
      // Reconnect must restore net to where it was after @ready.
      expect(tracker.net()).toBe(netAfterReady);
      tracker.restore();
    });

    it('final dispose leaves zero net selectionchange listeners attributable to this component', async () => {
      const tracker = trackSelectionchange();
      doc = await createComponent<SniceDocElement>('snice-doc');
      const netAfterReady = tracker.net();

      const parent = doc.parentNode!;
      parent.removeChild(doc);
      await wait(20);

      // Net should drop back to zero contribution from this component
      expect(tracker.net()).toBe(netAfterReady - netAfterReady);
      tracker.restore();
    });
  });
});
