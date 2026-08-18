import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/chip/snice-chip';
import type { SniceChipElement } from '../../packages/components/src/chip/snice-chip.types';

describe('snice-chip', () => {
  let chip: SniceChipElement;

  afterEach(() => {
    if (chip) {
      removeComponent(chip as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render chip element', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip');

      expect(chip).toBeTruthy();
      expect(chip.tagName).toBe('SNICE-CHIP');
    });

    it('should have default properties', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip');

      expect(chip.label).toBe('');
      expect(chip.variant).toBe('default');
      expect(chip.size).toBe('medium');
      expect(chip.shape).toBe('pill');
      expect(chip.disabled).toBe(false);
      expect(chip.removable).toBe(false);
      expect(chip.selected).toBe(false);
      expect(chip.avatar).toBe('');
      expect(chip.icon).toBe('');
    });

    it('should render internal chip element', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test'
      });
      await wait(200);

      const chipEl = queryShadow(chip as HTMLElement, '.chip');
      expect(chipEl).toBeTruthy();
    });
  });

  describe('label', () => {
    it('should render label text', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test Chip'
      });
      await wait(200);

      const labelEl = queryShadow(chip as HTMLElement, '.chip-label');
      expect(labelEl?.textContent).toBe('Test Chip');
    });

    it('should update label dynamically', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Original'
      });
      await wait(200);

      chip.label = 'Updated';
      await wait(10);

      const labelEl = queryShadow(chip as HTMLElement, '.chip-label');
      expect(labelEl?.textContent).toBe('Updated');
    });
  });

  describe('variants', () => {
    const variants = ['default', 'primary', 'success', 'warning', 'danger'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant`, async () => {
        chip = await createComponent<SniceChipElement>('snice-chip', {
          label: 'Test',
          variant
        });

        expect(chip.variant).toBe(variant);
      });
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should support ${size} size`, async () => {
        chip = await createComponent<SniceChipElement>('snice-chip', {
          label: 'Test',
          size
        });

        expect(chip.size).toBe(size);
      });
    });
  });

  describe('shapes', () => {
    const shapes = ['pill', 'rounded', 'square'];

    shapes.forEach(shape => {
      it(`should support ${shape} shape and reflect as attribute`, async () => {
        chip = await createComponent<SniceChipElement>('snice-chip', {
          label: 'Test',
          shape,
        });
        await wait(200);

        expect(chip.shape).toBe(shape);
        expect((chip as HTMLElement).getAttribute('shape')).toBe(shape);
      });
    });

    it('defaults to pill when shape attribute is absent', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', { label: 'Test' });
      await wait(200);
      expect(chip.shape).toBe('pill');
    });

    it('stylesheet has shape selectors for each variant', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const cssContent = readFileSync(
        join(__dirname, '../../packages/components/src/chip/snice-chip.css'),
        'utf8'
      );
      expect(cssContent).toMatch(/:host\(\[shape="pill"\]\)/);
      expect(cssContent).toMatch(/:host\(\[shape="rounded"\]\)/);
      expect(cssContent).toMatch(/:host\(\[shape="square"\]\)/);
      expect(cssContent).toMatch(/--chip-border-radius:\s*9999px/);
      expect(cssContent).toMatch(/--chip-border-radius:\s*6px/);
      expect(cssContent).toMatch(/--chip-border-radius:\s*0/);
    });
  });

  describe('avatar', () => {
    it('should render avatar image when provided', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        avatar: '/avatar.jpg'
      });
      await wait(200);

      const avatarEl = queryShadow(chip as HTMLElement, '.chip-avatar') as HTMLImageElement;
      expect(avatarEl).toBeTruthy();
      expect(avatarEl?.src).toContain('avatar.jpg');
    });

    it('should not render avatar when not provided', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test'
      });
      await wait(200);

      const avatarEl = queryShadow(chip as HTMLElement, '.chip-avatar');
      expect(avatarEl).toBeFalsy();
    });
  });

  describe('icon', () => {
    it('should render icon when provided and no avatar', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        icon: '⭐'
      });
      await wait(200);

      const iconEl = queryShadow(chip as HTMLElement, '.chip-icon');
      expect(iconEl).toBeTruthy();
      expect(iconEl?.textContent).toContain('⭐');
    });

    it('should prioritize avatar over icon', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        avatar: '/avatar.jpg',
        icon: '⭐'
      });
      await wait(200);

      const avatarEl = queryShadow(chip as HTMLElement, '.chip-avatar');
      const iconEl = queryShadow(chip as HTMLElement, '.chip-icon');

      expect(avatarEl).toBeTruthy();
      expect(iconEl).toBeFalsy();
    });
  });

  describe('removable', () => {
    it('should show remove button when removable and not disabled', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        removable: true
      });
      await wait(200);

      const removeBtn = queryShadow(chip as HTMLElement, '.chip-remove');
      expect(removeBtn).toBeTruthy();
      expect(removeBtn?.getAttribute('aria-label')).toBe('Remove Test');
    });

    it('should keep the remove button when disabled (barred, not gone)', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        removable: true,
        disabled: true
      });
      await wait(200);

      const removeBtn = queryShadow(chip as HTMLElement, '.chip-remove');
      expect(removeBtn).toBeTruthy();
      expect(removeBtn?.getAttribute('aria-label')).toBe('Remove Test');

      let removeFired = false;
      (chip as HTMLElement).addEventListener('chip-remove', () => { removeFired = true; });
      removeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(20);
      expect(removeFired, 'a disabled chip is inert').toBe(false);
    });

    it('should dispatch chip-remove event when remove button clicked', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        removable: true
      });
      await wait(200);

      let removeDetail: any = null;
      (chip as HTMLElement).addEventListener('chip-remove', (e: Event) => {
        removeDetail = (e as CustomEvent).detail;
      });

      const removeBtn = queryShadow(chip as HTMLElement, '.chip-remove') as HTMLButtonElement;
      removeBtn?.click();

      expect(removeDetail).toBeTruthy();
      expect(removeDetail.label).toBe('Test');
    });
  });

  describe('selected state', () => {
    it('should apply selected class when selected', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        selected: true
      });
      await wait(200);

      const chipEl = queryShadow(chip as HTMLElement, '.chip');
      expect(chipEl?.classList.contains('chip--selected')).toBe(true);
    });

    it('should update selected state dynamically', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        selected: false
      });
      await wait(200);

      chip.selected = true;

      const chipEl = queryShadow(chip as HTMLElement, '.chip');
      expect(chipEl?.classList.contains('chip--selected')).toBe(true);
    });
  });

  describe('selectable', () => {
    it('defaults to non-selectable (selectable=false)', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', { label: 'Test' });
      expect(chip.selectable).toBe(false);
    });

    it('does not toggle selected when clicked and not selectable', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', { label: 'Test' });
      await wait(100);
      const chipEl = queryShadow(chip as HTMLElement, '.chip') as HTMLElement;
      chipEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(20);
      expect(chip.selected).toBe(false);
    });

    it('does not toggle selected on Enter/Space when not selectable', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', { label: 'Test' });
      await wait(100);
      const chipEl = queryShadow(chip as HTMLElement, '.chip') as HTMLElement;
      chipEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await wait(20);
      expect(chip.selected).toBe(false);
      chipEl.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await wait(20);
      expect(chip.selected).toBe(false);
    });

    it('toggles selected when clicked and selectable=true', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        selectable: true,
      });
      await wait(100);
      const chipEl = queryShadow(chip as HTMLElement, '.chip') as HTMLElement;
      chipEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(20);
      expect(chip.selected).toBe(true);
      chipEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(20);
      expect(chip.selected).toBe(false);
    });

    it('toggles selected on Enter/Space when selectable=true', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        selectable: true,
      });
      await wait(100);
      const chipEl = queryShadow(chip as HTMLElement, '.chip') as HTMLElement;
      chipEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await wait(20);
      expect(chip.selected).toBe(true);
      chipEl.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await wait(20);
      expect(chip.selected).toBe(false);
    });

    it('still dispatches chip-click when not selectable', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', { label: 'Test' });
      await wait(100);
      let fired = false;
      (chip as HTMLElement).addEventListener('chip-click', () => { fired = true; });
      const chipEl = queryShadow(chip as HTMLElement, '.chip') as HTMLElement;
      chipEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(20);
      expect(fired).toBe(true);
    });

    it('programmatic selected still works regardless of selectable', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        selected: true,
      });
      await wait(200);
      expect(chip.selected).toBe(true);
      const chipEl = queryShadow(chip as HTMLElement, '.chip') as HTMLElement;
      expect(chipEl.classList.contains('chip--selected')).toBe(true);
    });

    it('removable + selectable: remove-button click does not toggle selected', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        selectable: true,
        removable: true,
      });
      await wait(200);
      const removeBtn = queryShadow(chip as HTMLElement, '.chip-remove') as HTMLElement;
      expect(removeBtn).toBeTruthy();
      removeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(20);
      expect(chip.selected).toBe(false);
    });

    it('removable + selectable: body click still toggles selected (independent properties)', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        selectable: true,
        removable: true,
      });
      await wait(200);
      const chipEl = queryShadow(chip as HTMLElement, '.chip') as HTMLElement;
      chipEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(20);
      expect(chip.selected).toBe(true);
    });
  });

  describe('disabled state', () => {
    it('should apply disabled attribute', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        disabled: true
      });
      await wait(200);

      const chipEl = queryShadow(chip as HTMLElement, '.chip');
      expect(chipEl?.getAttribute('aria-disabled')).toBe('true');
    });

    it('should not dispatch click event when disabled', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        disabled: true
      });
      await wait(200);

      let clickFired = false;
      (chip as HTMLElement).addEventListener('@snice/chip-click', () => {
        clickFired = true;
      });

      const chipEl = queryShadow(chip as HTMLElement, '.chip');
      chipEl?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(clickFired).toBe(false);
    });
  });

  describe('click events', () => {
    it('should dispatch chip-click event when clicked', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test'
      });
      await wait(200);

      let clickDetail: any = null;
      (chip as HTMLElement).addEventListener('chip-click', (e: Event) => {
        clickDetail = (e as CustomEvent).detail;
      });

      const chipEl = queryShadow(chip as HTMLElement, '.chip');
      chipEl?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(clickDetail).toBeTruthy();
      expect(clickDetail.label).toBe('Test');
    });
  });

  describe('keyboard navigation', () => {
    it('should be focusable', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test'
      });
      await wait(200);

      const chipEl = queryShadow(chip as HTMLElement, '.chip');
      expect(chipEl?.getAttribute('tabindex')).toBe('0');
    });

    it('should not be focusable when disabled', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        disabled: true
      });
      await wait(200);

      const chipEl = queryShadow(chip as HTMLElement, '.chip');
      expect(chipEl?.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('accessibility', () => {
    it('should have appropriate ARIA role when removable', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        removable: true
      });
      await wait(200);

      const chipEl = queryShadow(chip as HTMLElement, '.chip');
      expect(chipEl?.getAttribute('role')).toBe('button');
    });

    it('should have appropriate ARIA role when not removable', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        removable: false
      });
      await wait(200);

      const chipEl = queryShadow(chip as HTMLElement, '.chip');
      expect(chipEl?.getAttribute('role')).toBe('status');
    });
  });

  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/chip/snice-chip.css');

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