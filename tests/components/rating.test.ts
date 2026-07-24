// Draft: tests/components/rating.test.ts (NEW — zero tests today)
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../packages/components/src/rating/snice-rating';
import type { SniceRatingElement } from '../../packages/components/src/rating/snice-rating.types';

const cssPath = resolve(process.cwd(), 'packages/components/src/rating/snice-rating.css');

describe('snice-rating', () => {
  let rating: SniceRatingElement;

  afterEach(() => {
    if (rating) removeComponent(rating as HTMLElement);
  });

  describe('basic functionality', () => {
    it('has sensible defaults', async () => {
      rating = await createComponent<SniceRatingElement>('snice-rating');
      expect(rating.value).toBe(0);
      expect(rating.max).toBe(5);
      expect(rating.readonly).toBe(false);
      expect(rating.precision).toBe('full');
    });

    it('renders one star per max', async () => {
      rating = await createComponent<SniceRatingElement>('snice-rating', { max: 7 });
      await wait(50);
      expect(queryShadowAll(rating as HTMLElement, '.star').length).toBe(7);
    });

    it('marks filled stars aria-checked', async () => {
      rating = await createComponent<SniceRatingElement>('snice-rating', { value: 3 });
      await wait(50);
      const stars = Array.from(queryShadowAll(rating as HTMLElement, '.star'));
      expect(stars.map(s => s.getAttribute('aria-checked'))).toEqual(['true', 'true', 'true', 'false', 'false']);
    });
  });

  describe('interaction', () => {
    it('sets value and emits rating-change on click', async () => {
      rating = await createComponent<SniceRatingElement>('snice-rating');
      await wait(50);

      let detail: any = null;
      (rating as HTMLElement).addEventListener('rating-change', (e: Event) => {
        detail = (e as CustomEvent).detail;
      });

      const stars = queryShadowAll(rating as HTMLElement, '.star');
      (stars[2] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(20);

      expect(rating.value).toBe(3);
      expect(detail?.value).toBe(3);
    });

    it('steps by 1 with ArrowRight and clamps at max', async () => {
      rating = await createComponent<SniceRatingElement>('snice-rating', { value: 4 });
      await wait(50);

      const group = queryShadow(rating as HTMLElement, '.rating');
      group?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      group?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await wait(20);

      expect(rating.value).toBe(5);
    });

    it('steps by 0.5 in half precision and clamps at zero', async () => {
      rating = await createComponent<SniceRatingElement>('snice-rating', { precision: 'half', value: 0.5 });
      await wait(50);

      const group = queryShadow(rating as HTMLElement, '.rating');
      group?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      group?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await wait(20);

      expect(rating.value).toBe(0);
    });

    it('ignores clicks and keys when readonly', async () => {
      rating = await createComponent<SniceRatingElement>('snice-rating', { readonly: true, value: 2 });
      await wait(50);

      const stars = queryShadowAll(rating as HTMLElement, '.star');
      (stars[4] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const group = queryShadow(rating as HTMLElement, '.rating');
      group?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await wait(20);

      expect(rating.value).toBe(2);
    });
  });

  describe('icons', () => {
    it('renders the default star as a registry SVG, not a unicode glyph', async () => {
      rating = await createComponent<SniceRatingElement>('snice-rating');
      await wait(50);

      const full = queryShadow(rating as HTMLElement, '.star-full');
      expect(full?.querySelector('svg')).toBeTruthy();
      expect(full?.textContent).not.toContain('★');
    });

    it('still renders emoji icons as text when authored', async () => {
      rating = await createComponent<SniceRatingElement>('snice-rating', { icon: '❤️' });
      await wait(50);

      const full = queryShadow(rating as HTMLElement, '.star-full');
      expect(full?.textContent).toContain('❤️');
    });
  });

  describe('star color', () => {
    it('does not darken the star gold with the theme text color', () => {
      // Mixing text color into the fill made light mode ochre (text is near-black there).
      const css = readFileSync(cssPath, 'utf8');
      const ratingColorLine = css.split('\n').find(l => l.includes('--rating-color:')) ?? '';
      expect(ratingColorLine).not.toContain('--snice-color-text');
    });
  });

  describe('stylesheet contracts', () => {
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

