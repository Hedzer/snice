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
  });
});
