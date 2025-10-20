import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/chip/snice-chip';
import type { SniceChipElement } from '../../components/chip/snice-chip.types';

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

    it('should not show remove button when disabled', async () => {
      chip = await createComponent<SniceChipElement>('snice-chip', {
        label: 'Test',
        removable: true,
        disabled: true
      });
      await wait(200);

      const removeBtn = queryShadow(chip as HTMLElement, '.chip-remove');
      expect(removeBtn).toBeFalsy();
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
});
