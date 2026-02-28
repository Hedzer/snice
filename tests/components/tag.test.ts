import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/tag/snice-tag';
import type { SniceTagElement } from '../../components/tag/snice-tag.types';

describe('snice-tag', () => {
  let tag: SniceTagElement;

  afterEach(() => {
    if (tag) {
      removeComponent(tag as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render tag element', async () => {
      tag = await createComponent<SniceTagElement>('snice-tag');

      expect(tag).toBeTruthy();
      expect(tag.tagName).toBe('SNICE-TAG');
    });

    it('should have default properties', async () => {
      tag = await createComponent<SniceTagElement>('snice-tag');

      expect(tag.variant).toBe('default');
      expect(tag.size).toBe('medium');
      expect(tag.removable).toBe(false);
      expect(tag.outline).toBe(false);
      expect(tag.pill).toBe(false);
    });

    it('should render internal tag element', async () => {
      tag = await createComponent<SniceTagElement>('snice-tag');
      await wait(200);

      const tagEl = queryShadow(tag as HTMLElement, '.tag');
      expect(tagEl).toBeTruthy();
    });
  });

  describe('variants', () => {
    const variants = ['default', 'primary', 'success', 'warning', 'danger', 'info'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant`, async () => {
        tag = await createComponent<SniceTagElement>('snice-tag', {
          variant
        });

        expect(tag.variant).toBe(variant);
      });
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should support ${size} size`, async () => {
        tag = await createComponent<SniceTagElement>('snice-tag', {
          size
        });

        expect(tag.size).toBe(size);
      });
    });
  });

  describe('outline', () => {
    it('should apply outline attribute', async () => {
      tag = await createComponent<SniceTagElement>('snice-tag', {
        outline: true
      });

      expect(tag.outline).toBe(true);
      expect((tag as HTMLElement).hasAttribute('outline')).toBe(true);
    });
  });

  describe('pill', () => {
    it('should apply pill attribute', async () => {
      tag = await createComponent<SniceTagElement>('snice-tag', {
        pill: true
      });

      expect(tag.pill).toBe(true);
      expect((tag as HTMLElement).hasAttribute('pill')).toBe(true);
    });
  });

  describe('removable', () => {
    it('should show remove button when removable', async () => {
      tag = await createComponent<SniceTagElement>('snice-tag', {
        removable: true
      });
      await wait(200);

      const removeBtn = queryShadow(tag as HTMLElement, '.tag-remove');
      expect(removeBtn).toBeTruthy();
    });

    it('should not show remove button when not removable', async () => {
      tag = await createComponent<SniceTagElement>('snice-tag');
      await wait(200);

      const removeBtn = queryShadow(tag as HTMLElement, '.tag-remove');
      expect(removeBtn).toBeFalsy();
    });

    it('should dispatch tag-remove event when remove button clicked', async () => {
      tag = await createComponent<SniceTagElement>('snice-tag', {
        removable: true
      });
      await wait(200);

      let removeDetail: any = null;
      (tag as HTMLElement).addEventListener('tag-remove', (e: Event) => {
        removeDetail = (e as CustomEvent).detail;
      });

      const removeBtn = queryShadow(tag as HTMLElement, '.tag-remove') as HTMLButtonElement;
      removeBtn?.click();

      expect(removeDetail).toBeTruthy();
      expect(removeDetail.tag).toBe(tag);
    });
  });
});
