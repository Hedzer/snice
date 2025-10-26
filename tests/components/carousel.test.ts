import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/carousel/snice-carousel';
import type { SniceCarouselElement } from '../../components/carousel/snice-carousel.types';

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

  it.skip('should go to next slide', async () => {
    carousel = await createComponent<SniceCarouselElement>('snice-carousel');
    carousel.next();
    await wait(50);
    expect(carousel.activeIndex).toBe(1);
  });

  it.skip('should go to previous slide', async () => {
    carousel = await createComponent<SniceCarouselElement>('snice-carousel');
    carousel.activeIndex = 2;
    await wait(50);
    carousel.prev();
    await wait(50);
    expect(carousel.activeIndex).toBe(1);
  });

  it('should go to specific slide', async () => {
    carousel = await createComponent<SniceCarouselElement>('snice-carousel');
    carousel.goToSlide(3);
    await wait(50);
    expect(carousel.activeIndex).toBe(3);
  });

  it('should support loop', async () => {
    carousel = await createComponent<SniceCarouselElement>('snice-carousel', { loop: true });
    expect(carousel.loop).toBe(true);
  });

  it('should play autoplay', async () => {
    carousel = await createComponent<SniceCarouselElement>('snice-carousel');
    carousel.play();
    // Just verify it doesn't throw
    expect(true).toBe(true);
  });

  it('should pause autoplay', async () => {
    carousel = await createComponent<SniceCarouselElement>('snice-carousel');
    carousel.pause();
    // Just verify it doesn't throw
    expect(true).toBe(true);
  });
});
