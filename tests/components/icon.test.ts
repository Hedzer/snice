import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/icon/snice-icon';
import { SniceIcon } from '../../components/icon/snice-icon';
import type { SniceIconElement } from '../../components/icon/snice-icon.types';

describe('snice-icon', () => {
  let icon: SniceIconElement;

  afterEach(() => {
    if (icon) {
      removeComponent(icon as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render icon element', async () => {
      icon = await createComponent<SniceIconElement>('snice-icon');

      expect(icon).toBeTruthy();
      expect(icon.tagName).toBe('SNICE-ICON');
    });

    it('should have default properties', async () => {
      icon = await createComponent<SniceIconElement>('snice-icon');

      expect(icon.name).toBe('');
      expect(icon.src).toBe('');
      expect(icon.size).toBe('medium');
      expect(icon.color).toBe('');
      expect(icon.label).toBe('');
    });
  });

  describe('built-in icons', () => {
    it('should render a built-in icon by name', async () => {
      icon = await createComponent<SniceIconElement>('snice-icon', {
        name: 'check'
      });
      await wait(200);

      const iconEl = queryShadow(icon as HTMLElement, '.icon');
      expect(iconEl).toBeTruthy();
      const svg = queryShadow(icon as HTMLElement, '.icon svg');
      expect(svg).toBeTruthy();
    });

    it('should render nothing for unknown icon name', async () => {
      icon = await createComponent<SniceIconElement>('snice-icon', {
        name: 'nonexistent-icon-xyz'
      });
      await wait(200);

      const svg = queryShadow(icon as HTMLElement, '.icon svg');
      expect(svg).toBeFalsy();
    });
  });

  describe('src property', () => {
    it('should render an img when src is provided', async () => {
      icon = await createComponent<SniceIconElement>('snice-icon', {
        src: '/icon.svg'
      });
      await wait(200);

      const img = queryShadow(icon as HTMLElement, '.icon img') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img?.src).toContain('icon.svg');
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should support ${size} size`, async () => {
        icon = await createComponent<SniceIconElement>('snice-icon', {
          name: 'check',
          size
        });

        expect(icon.size).toBe(size);
      });
    });

    it('should support numeric size', async () => {
      icon = await createComponent<SniceIconElement>('snice-icon', {
        name: 'check',
        size: '48'
      });
      await wait(200);

      expect((icon as HTMLElement).style.width).toBe('3rem');
      expect((icon as HTMLElement).style.height).toBe('3rem');
    });
  });

  describe('color', () => {
    it('should apply custom color', async () => {
      icon = await createComponent<SniceIconElement>('snice-icon', {
        name: 'check',
        color: 'red'
      });
      await wait(200);

      expect((icon as HTMLElement).style.color).toBe('red');
    });

    it('should remove color when cleared', async () => {
      icon = await createComponent<SniceIconElement>('snice-icon', {
        name: 'check',
        color: 'red'
      });
      await wait(200);

      icon.color = '';
      await wait(10);

      expect((icon as HTMLElement).style.color).toBe('');
    });
  });

  describe('accessibility', () => {
    it('should be aria-hidden when no label', async () => {
      icon = await createComponent<SniceIconElement>('snice-icon', {
        name: 'check'
      });
      await wait(200);

      const iconEl = queryShadow(icon as HTMLElement, '.icon');
      expect(iconEl?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have aria-label when label is set', async () => {
      icon = await createComponent<SniceIconElement>('snice-icon', {
        name: 'close',
        label: 'Close dialog'
      });
      await wait(200);

      const iconEl = queryShadow(icon as HTMLElement, '.icon');
      expect(iconEl?.getAttribute('aria-label')).toBe('Close dialog');
      expect(iconEl?.getAttribute('role')).toBe('img');
    });
  });

  describe('static methods', () => {
    it('should register custom icon', async () => {
      SniceIcon.registerIcon('custom-test', '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>');

      expect(SniceIcon.getIcon('custom-test')).toBeTruthy();
    });

    it('should register multiple icons', async () => {
      SniceIcon.registerIcons({
        'multi-1': '<svg viewBox="0 0 24 24"><rect width="24" height="24"/></svg>',
        'multi-2': '<svg viewBox="0 0 24 24"><line x1="0" y1="0" x2="24" y2="24"/></svg>'
      });

      expect(SniceIcon.getIcon('multi-1')).toBeTruthy();
      expect(SniceIcon.getIcon('multi-2')).toBeTruthy();
    });

    it('should list registered icon names', async () => {
      const names = SniceIcon.getRegisteredNames();
      expect(names).toContain('check');
      expect(names).toContain('close');
      expect(names).toContain('search');
    });

    it('should render custom registered icon', async () => {
      SniceIcon.registerIcon('render-test', '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>');

      icon = await createComponent<SniceIconElement>('snice-icon', {
        name: 'render-test'
      });
      await wait(200);

      const svg = queryShadow(icon as HTMLElement, '.icon svg');
      expect(svg).toBeTruthy();
    });
  });
});
