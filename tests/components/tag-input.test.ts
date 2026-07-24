import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/tag-input/snice-tag-input';
import type { SniceTagInputElement } from '../../packages/components/src/tag-input/snice-tag-input.types';

describe('snice-tag-input', () => {
  let tagInput: SniceTagInputElement;

  afterEach(() => {
    if (tagInput && tagInput.isConnected) removeComponent(tagInput as HTMLElement);
  });

  it('should render', async () => {
    tagInput = await createComponent<SniceTagInputElement>('snice-tag-input');
    expect(tagInput).toBeTruthy();
    expect(tagInput.tagName).toBe('SNICE-TAG-INPUT');
  });

  describe('@reconnect: outside-click closes suggestions after reconnect', () => {
    it('outside-click closes the suggestion panel on first connect', async () => {
      tagInput = await createComponent<SniceTagInputElement>('snice-tag-input');
      (tagInput as any).showSuggestions = true;
      await wait(20);

      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((tagInput as any).showSuggestions).toBe(false);
    });

    it('outside-click still closes suggestions after disconnect+reconnect', async () => {
      tagInput = await createComponent<SniceTagInputElement>('snice-tag-input');
      const parent = tagInput.parentNode!;

      parent.removeChild(tagInput);
      await wait(20);
      parent.appendChild(tagInput);
      await wait(20);

      (tagInput as any).showSuggestions = true;
      await wait(20);
      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((tagInput as any).showSuggestions).toBe(false);
    });

    it('does NOT respond to clicks after final dispose (no listener leak)', async () => {
      tagInput = await createComponent<SniceTagInputElement>('snice-tag-input');
      (tagInput as any).showSuggestions = true;
      await wait(20);

      const parent = tagInput.parentNode!;
      parent.removeChild(tagInput);
      await wait(20);

      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((tagInput as any).showSuggestions).toBe(true);
    });

    it('listener is balanced across dispose/reconnect (not double-attached)', async () => {
      tagInput = await createComponent<SniceTagInputElement>('snice-tag-input');

      // Track click adds/removes on document
      let net = 0;
      const origAdd = document.addEventListener;
      const origRemove = document.removeEventListener;
      document.addEventListener = ((type: string, h: any, opts?: any) => {
        if (type === 'click') net++;
        return (origAdd as any).call(document, type, h, opts);
      }) as any;
      document.removeEventListener = ((type: string, h: any, opts?: any) => {
        if (type === 'click') net--;
        return (origRemove as any).call(document, type, h, opts);
      }) as any;

      const parent = tagInput.parentNode!;
      const baseline = net;

      parent.removeChild(tagInput);
      await wait(20);
      const afterDispose = net;

      parent.appendChild(tagInput);
      await wait(20);
      const afterReconnect = net;

      document.addEventListener = origAdd;
      document.removeEventListener = origRemove;

      // dispose should remove exactly one click listener; reconnect re-adds.
      expect(afterDispose).toBeLessThan(baseline);
      expect(afterReconnect).toBe(baseline);
    });
  });
  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/tag-input/snice-tag-input.css');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(cssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});
