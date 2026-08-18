import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/carousel/snice-carousel';
import type { SniceCarouselElement } from '../../packages/components/src/carousel/snice-carousel.types';

describe('snice-carousel', () => {
  let carousel: SniceCarouselElement;

  afterEach(() => {
    if (carousel) {
      removeComponent(carousel as HTMLElement);
    }
  });

  it('should render', async () => {
    carousel = await createComponent<SniceCarouselElement>('snice-carousel');
    expect(carousel).toBeTruthy();
  });

  it('should have default properties', async () => {
    carousel = await createComponent<SniceCarouselElement>('snice-carousel');
    expect(carousel.activeIndex).toBe(0);
    expect(carousel.autoplay).toBe(false);
    expect(carousel.loop).toBe(true);
    expect(carousel.showControls).toBe(true);
    expect(carousel.showIndicators).toBe(true);
  });

  it('should go to next slide', async () => {
    carousel = await createComponent<SniceCarouselElement>('snice-carousel');
    // next() advances activeIndex based on slideCount, which is normally
    // updated via the slotchange event on the internal slot. happy-dom's
    // slot listener wiring under snice's @on decorator does not always
    // surface dispatched slotchange events, so we drive the public-facing
    // handler directly to mirror what a real browser would do.
    for (let i = 0; i < 3; i++) {
      const slide = document.createElement('div');
      slide.textContent = `Slide ${i}`;
      carousel.appendChild(slide);
    }
    (carousel as unknown as { handleSlotChange: () => void }).handleSlotChange();
    await wait(50);
    carousel.next();
    await wait(50);
    expect(carousel.activeIndex).toBe(1);
  });

  it('should go to previous slide', async () => {
    carousel = await createComponent<SniceCarouselElement>('snice-carousel');
    for (let i = 0; i < 3; i++) {
      const slide = document.createElement('div');
      slide.textContent = `Slide ${i}`;
      carousel.appendChild(slide);
    }
    (carousel as unknown as { handleSlotChange: () => void }).handleSlotChange();
    await wait(50);
    carousel.activeIndex = 2;
    await wait(50);
    carousel.prev();
    await wait(50);
    expect(carousel.activeIndex).toBe(1);
  });

  it('should go to specific slide', async () => {
    carousel = await createComponent<SniceCarouselElement>('snice-carousel');
    for (let i = 0; i < 3; i++) {
      const slide = document.createElement('div');
      slide.textContent = `Slide ${i}`;
      carousel.appendChild(slide);
    }
    (carousel as unknown as { handleSlotChange: () => void }).handleSlotChange();
    await wait(50);
    carousel.goToSlide(2);
    await wait(50);
    expect(carousel.activeIndex).toBe(2);
    // An index past the last reachable slide clamps to the last position,
    // matching the boundary next()/prev() already enforce.
    carousel.goToSlide(99);
    await wait(50);
    expect(carousel.activeIndex).toBe(2);
  });

  it('should support loop', async () => {
    carousel = await createComponent<SniceCarouselElement>('snice-carousel', { loop: true });
    expect(carousel.loop).toBe(true);
  });

  it('should play autoplay', async () => {
    carousel = await createComponent<SniceCarouselElement>('snice-carousel');
    carousel.play();
    expect((carousel as any).autoplayTimer).toBeDefined();
  });

  it('should pause autoplay', async () => {
    carousel = await createComponent<SniceCarouselElement>('snice-carousel');
    carousel.play();
    carousel.pause();
    expect((carousel as any).autoplayTimer).toBeUndefined();
  });

  describe('autoplay accessibility', () => {
    async function autoplayCarousel(attrs: Record<string, any> = {}) {
      const el = document.createElement('snice-carousel') as SniceCarouselElement;
      el.setAttribute('autoplay', '');
      el.setAttribute('autoplay-interval', '60');
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
      for (let i = 0; i < 3; i++) {
        const slide = document.createElement('div');
        slide.textContent = `Slide ${i + 1}`;
        el.appendChild(slide);
      }
      document.body.appendChild(el);
      await (el as any).ready;
      await wait(30);
      return el;
    }

    it('should pause autoplay while hovered and resume after', async () => {
      carousel = await autoplayCarousel();
      (carousel as HTMLElement).dispatchEvent(new Event('mouseenter'));
      const frozen = carousel.activeIndex;
      await wait(250);
      expect(carousel.activeIndex).toBe(frozen);

      (carousel as HTMLElement).dispatchEvent(new Event('mouseleave'));
      // Poll: under parallel test load, interval timers can starve well past
      // their nominal cadence — assert the resume within a generous window.
      const deadline = Date.now() + 2000;
      while (carousel.activeIndex === frozen && Date.now() < deadline) {
        await wait(40);
      }
      expect(carousel.activeIndex).not.toBe(frozen);
    });

    it('should pause autoplay while focus is inside', async () => {
      carousel = await autoplayCarousel();
      (carousel as HTMLElement).dispatchEvent(new Event('focusin'));
      const frozen = carousel.activeIndex;
      await wait(250);
      expect(carousel.activeIndex).toBe(frozen);
    });

    it('should silence the live region while autoplaying', async () => {
      carousel = await autoplayCarousel();
      const live = carousel.shadowRoot!.querySelector('.carousel__container');
      expect(live?.getAttribute('aria-live')).toBe('off');
    });

    it('should keep the live region polite without autoplay', async () => {
      carousel = document.createElement('snice-carousel') as SniceCarouselElement;
      document.body.appendChild(carousel as HTMLElement);
      await (carousel as any).ready;
      await wait(30);
      const live = carousel.shadowRoot!.querySelector('.carousel__container');
      expect(live?.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('keyboard navigation', () => {
    it('should advance with ArrowRight and go back with ArrowLeft', async () => {
      carousel = document.createElement('snice-carousel') as SniceCarouselElement;
      for (let i = 0; i < 3; i++) carousel.appendChild(document.createElement('div'));
      document.body.appendChild(carousel as HTMLElement);
      await (carousel as any).ready;
      await wait(30);

      (carousel as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await wait(30);
      expect(carousel.activeIndex).toBe(1);

      (carousel as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await wait(30);
      expect(carousel.activeIndex).toBe(0);
    });
  });

  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/carousel/snice-carousel.css');

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
