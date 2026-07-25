import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/layout/snice-layout-split';
import type { SniceLayoutSplit } from '../../packages/components/src/layout/snice-layout-split';

describe('snice-layout-split', () => {
  let layout: SniceLayoutSplit;

  afterEach(() => {
    if (layout) removeComponent(layout as HTMLElement);
  });

  describe('structure', () => {
    it('ships left and right panel slots around a divider', async () => {
      layout = await createComponent<SniceLayoutSplit>('snice-layout-split');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, 'slot[name="left"]')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, 'slot[name="right"]')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, '.divider')).toBeTruthy();
    });
  });

  describe('attribute contract', () => {
    it('observes direction and ratio', () => {
      const observed = (customElements.get('snice-layout-split') as any).observedAttributes as string[];
      expect(observed).toContain('direction');
      expect(observed).toContain('ratio');
    });

    it.each([['50-50'], ['60-40'], ['70-30'], ['33-67'], ['67-33']])(
      'ships a stylesheet block for ratio %s',
      async (ratio) => {
        const css = readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-split.css'), 'utf8');
        expect(css).toContain(`:host([ratio="${ratio}"])`);
      }
    );

    it.each([['horizontal'], ['vertical']])('accepts direction %s', async (direction) => {
      layout = await createComponent<SniceLayoutSplit>('snice-layout-split', { direction });
      expect(layout.direction).toBe(direction);
    });
  });

  describe('stylesheet contracts', () => {
    const css = readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-split.css'), 'utf8');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('stacks panels into one column on mobile', () => {
      expect(css).toMatch(/@media \(max-width: 768px\)[\s\S]*grid-template-columns: 1fr/);
    });
  });

  describe('frame behaviour', () => {
    const readFrameCss = () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { readFileSync } = require('node:fs');
      const { resolve } = require('node:path');
      return readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-split.css'), 'utf8');
    };

    it('fills the small viewport with a dvh height and a vh fallback', () => {
      const css = readFrameCss();
      expect(css).toMatch(/min-height:\s*100vh/);
      expect(css).toMatch(/min-height:\s*100dvh/);
    });

    it('contained drops the viewport height so it can be embedded', () => {
      const css = readFrameCss();
      expect(css).toMatch(/:host\(\[contained\]\)/);
    });
  });
});
