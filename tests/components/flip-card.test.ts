import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait, triggerMouseEvent } from './test-utils';
import '../../components/flip-card/snice-flip-card';
import type { SniceFlipCardElement } from '../../components/flip-card/snice-flip-card.types';

describe('snice-flip-card', () => {
  let card: SniceFlipCardElement;

  afterEach(() => {
    if (card) {
      removeComponent(card as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render flip-card element', async () => {
      card = await createComponent<SniceFlipCardElement>('snice-flip-card');

      expect(card).toBeTruthy();
      expect(card.tagName).toBe('SNICE-FLIP-CARD');
    });

    it('should have default properties', async () => {
      card = await createComponent<SniceFlipCardElement>('snice-flip-card');

      expect(card.flipped).toBe(false);
      expect(card.clickToFlip).toBe(true);
      expect(card.direction).toBe('horizontal');
      expect(card.duration).toBe(600);
    });

    it('should render flip structure', async () => {
      card = await createComponent<SniceFlipCardElement>('snice-flip-card');
      await wait(10);

      const baseEl = queryShadow(card as HTMLElement, '.flip-card');
      expect(baseEl).toBeTruthy();

      const frontEl = queryShadow(card as HTMLElement, '.front');
      expect(frontEl).toBeTruthy();

      const backEl = queryShadow(card as HTMLElement, '.back');
      expect(backEl).toBeTruthy();
    });

    it('should have front and back slots', async () => {
      card = await createComponent<SniceFlipCardElement>('snice-flip-card');
      await wait(10);

      const frontSlot = queryShadow(card as HTMLElement, '.front slot');
      expect(frontSlot).toBeTruthy();
      expect(frontSlot?.getAttribute('name')).toBe('front');

      const backSlot = queryShadow(card as HTMLElement, '.back slot');
      expect(backSlot).toBeTruthy();
      expect(backSlot?.getAttribute('name')).toBe('back');
    });
  });

  describe('properties', () => {
    it('should accept flipped attribute', async () => {
      card = await createComponent<SniceFlipCardElement>('snice-flip-card', {
        flipped: true
      });

      expect(card.flipped).toBe(true);
    });

    it('should accept click-to-flip attribute', async () => {
      card = await createComponent<SniceFlipCardElement>('snice-flip-card', {
        'click-to-flip': false
      });

      expect(card.clickToFlip).toBe(false);
    });

    it('should accept direction attribute', async () => {
      card = await createComponent<SniceFlipCardElement>('snice-flip-card', {
        direction: 'vertical'
      });

      expect(card.direction).toBe('vertical');
    });

    it('should accept duration attribute', async () => {
      card = await createComponent<SniceFlipCardElement>('snice-flip-card', {
        duration: 800
      });

      expect(card.duration).toBe(800);
    });
  });

  describe('API methods', () => {
    it('should have flip method', async () => {
      card = await createComponent<SniceFlipCardElement>('snice-flip-card');

      expect(typeof card.flip).toBe('function');
    });

    it('should have flipTo method', async () => {
      card = await createComponent<SniceFlipCardElement>('snice-flip-card');

      expect(typeof card.flipTo).toBe('function');
    });

    it('should flip when flip() is called', async () => {
      card = await createComponent<SniceFlipCardElement>('snice-flip-card');

      expect(card.flipped).toBe(false);
      card.flip();
      expect(card.flipped).toBe(true);
    });

    it('should flip to specific side with flipTo()', async () => {
      card = await createComponent<SniceFlipCardElement>('snice-flip-card');

      card.flipTo('back');
      expect(card.flipped).toBe(true);

      card.flipTo('front');
      expect(card.flipped).toBe(false);
    });
  });

  describe('events', () => {
    it('should dispatch flip-change event when flipped', async () => {
      card = await createComponent<SniceFlipCardElement>('snice-flip-card');

      let eventFired = false;
      card.addEventListener('flip-change', (e: Event) => {
        eventFired = true;
        expect((e as CustomEvent).detail.flipped).toBe(true);
      });

      card.flip();
      await wait(10);

      expect(eventFired).toBe(true);
    });
  });
});
