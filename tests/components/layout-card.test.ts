import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/layout/snice-layout-card';
import type { SniceLayoutCard } from '../../packages/components/src/layout/snice-layout-card';

describe('snice-layout-card', () => {
  let layout: SniceLayoutCard;

  afterEach(() => {
    if (layout) removeComponent(layout as HTMLElement);
  });

  describe('structure', () => {
    it('ships header, page, and footer slots', async () => {
      layout = await createComponent<SniceLayoutCard>('snice-layout-card');
      await wait(10);

      for (const name of ['header', 'page', 'footer']) {
        expect(queryShadow(layout as HTMLElement, `slot[name="${name}"]`), name).toBeTruthy();
      }
    });
  });

  describe('empty chrome', () => {
    it('hides the footer bar when nothing is slotted', async () => {
      layout = await createComponent<SniceLayoutCard>('snice-layout-card');
      await wait(30);

      const footer = queryShadow(layout as HTMLElement, '.footer');
      expect(footer!.classList.contains('footer--empty')).toBe(true);
    });

    it('shows the footer when content is slotted', async () => {
      const el = document.createElement('snice-layout-card');
      el.innerHTML = '<div slot="footer">Legal</div>';
      document.body.appendChild(el);
      await new Promise(r => setTimeout(r, 60));

      const footer = el.shadowRoot!.querySelector('.footer');
      expect(footer!.classList.contains('footer--empty')).toBe(false);
      el.remove();
    });
  });

  describe('stylesheet contracts', () => {
    const css = readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-card.css'), 'utf8');

    it('default column count steps down on tablets like the explicit variants', () => {
      expect(css).toMatch(/@media \(max-width: 768px\)[\s\S]*:host\(:not\(\[columns\]\)\) \.grid/);
    });

    it('collapses to a single column on phones', () => {
      expect(css).toMatch(/@media \(max-width: 480px\)[\s\S]*grid-template-columns: 1fr/);
    });
  });
});
