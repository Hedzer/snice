import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/avatar/snice-avatar';
import type { SniceAvatarElement } from '../../components/avatar/snice-avatar.types';

describe('snice-avatar', () => {
  let avatar: SniceAvatarElement;

  afterEach(() => {
    if (avatar) {
      removeComponent(avatar as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render avatar element', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar');

      expect(avatar).toBeTruthy();
      expect(avatar.tagName).toBe('SNICE-AVATAR');
    });

    it('should have default properties', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar');

      expect(avatar.src).toBe('');
      expect(avatar.alt).toBe('');
      expect(avatar.name).toBe('');
      expect(avatar.size).toBe('medium');
      expect(avatar.shape).toBe('circle');
      expect(avatar.fallbackColor).toBe('#ffffff');
      expect(avatar.fallbackBackground).toBe('');
    });

    it('should render internal avatar element', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar');
      await wait(200);

      const avatarEl = queryShadow(avatar as HTMLElement, '.avatar');
      expect(avatarEl).toBeTruthy();
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large', 'xlarge'];

    sizes.forEach(size => {
      it(`should support ${size} size`, async () => {
        avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
          size
        });

        expect(avatar.size).toBe(size);
      });
    });
  });

  describe('shapes', () => {
    const shapes = ['circle', 'square', 'rounded'];

    shapes.forEach(shape => {
      it(`should support ${shape} shape`, async () => {
        avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
          shape
        });

        expect(avatar.shape).toBe(shape);
      });
    });
  });

  describe('image display', () => {
    it('should render image when src is provided', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
        src: '/test-avatar.jpg',
        alt: 'Test Avatar'
      });
      await wait(200);

      const imgEl = queryShadow(avatar as HTMLElement, '.avatar-image') as HTMLImageElement;
      expect(imgEl).toBeTruthy();
      expect(imgEl?.src).toContain('test-avatar.jpg');
      expect(imgEl?.alt).toBe('Test Avatar');
    });

    it('should use name as alt text if alt not provided', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
        src: '/test-avatar.jpg',
        name: 'John Doe'
      });
      await wait(200);

      const imgEl = queryShadow(avatar as HTMLElement, '.avatar-image') as HTMLImageElement;
      expect(imgEl?.alt).toBe('John Doe');
    });

    it('should have lazy loading', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
        src: '/test-avatar.jpg'
      });
      await wait(200);

      const imgEl = queryShadow(avatar as HTMLElement, '.avatar-image') as HTMLImageElement;
      // Check the attribute (Happy DOM doesn't properly set the property)
      expect(imgEl?.getAttribute('loading')).toBe('lazy');
    });
  });

  describe('fallback display', () => {
    it('should show initials when no image and name provided', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
        name: 'John Doe'
      });
      await wait(200);

      const fallbackEl = queryShadow(avatar as HTMLElement, '.avatar-fallback');
      expect(fallbackEl).toBeTruthy();
      expect(fallbackEl?.textContent?.trim()).toBe('JD');
    });

    it('should show single initial for single name', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
        name: 'John'
      });
      await wait(200);

      const fallbackEl = queryShadow(avatar as HTMLElement, '.avatar-fallback');
      expect(fallbackEl?.textContent?.trim()).toBe('J');
    });

    it('should show icon when no name and no image', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar');
      await wait(200);

      const iconEl = queryShadow(avatar as HTMLElement, '.avatar-icon');
      expect(iconEl).toBeTruthy();
    });

    it('should show fallback when image fails to load', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
        src: '/invalid-image.jpg',
        name: 'John Doe'
      });
      await wait(200);

      // Simulate image error
      const imgEl = queryShadow(avatar as HTMLElement, '.avatar-image') as HTMLImageElement;
      imgEl?.dispatchEvent(new Event('error'));
      await wait(10);

      const fallbackEl = queryShadow(avatar as HTMLElement, '.avatar-fallback');
      expect(fallbackEl?.classList.contains('avatar-fallback--visible')).toBe(true);
    });
  });

  describe('custom colors', () => {
    it('should apply custom fallback background color', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
        name: 'John Doe',
        'fallback-background': '#ff0000'
      });
      await wait(200);

      const avatarEl = queryShadow(avatar as HTMLElement, '.avatar');
      expect(avatarEl?.getAttribute('style')).toContain('--avatar-bg: #ff0000');
    });

    it('should apply custom fallback text color', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
        name: 'John Doe',
        'fallback-background': '#ff0000',
        'fallback-color': '#000000'
      });
      await wait(200);

      const avatarEl = queryShadow(avatar as HTMLElement, '.avatar');
      expect(avatarEl?.getAttribute('style')).toContain('--avatar-color: #000000');
    });

    it('should use color class when no custom background', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
        name: 'John Doe'
      });
      await wait(200);

      const avatarEl = queryShadow(avatar as HTMLElement, '.avatar');
      // Should have a color class applied (e.g., avatar--red, avatar--fuchsia)
      expect(avatarEl?.className).toMatch(/avatar--\w+/);
    });
  });

  describe('property updates', () => {
    it('should update src dynamically', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
        src: '/avatar1.jpg'
      });
      await wait(200);

      avatar.src = '/avatar2.jpg';
      await wait(10);

      const imgEl = queryShadow(avatar as HTMLElement, '.avatar-image') as HTMLImageElement;
      expect(imgEl?.src).toContain('avatar2.jpg');
    });

    it('should update name dynamically', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
        name: 'John Doe'
      });
      await wait(200);

      avatar.name = 'Jane Smith';
      await wait(10);

      const fallbackEl = queryShadow(avatar as HTMLElement, '.avatar-fallback');
      expect(fallbackEl?.textContent?.trim()).toBe('JS');
    });

    it('should update size dynamically', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
        size: 'small'
      });
      await wait(200);

      avatar.size = 'large';

      expect(avatar.size).toBe('large');
    });

    it('should update shape dynamically', async () => {
      avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
        shape: 'circle'
      });
      await wait(200);

      avatar.shape = 'square';

      expect(avatar.shape).toBe('square');
    });
  });

  describe('initials generation', () => {
    const testCases = [
      { name: 'John Doe', expected: 'JD' },
      { name: 'Jane', expected: 'J' },
      { name: 'Mary Jane Watson', expected: 'MJ' },
      { name: 'a b c d', expected: 'AB' },
      { name: '', expected: '' },
      { name: '   ', expected: '' }
    ];

    testCases.forEach(({ name, expected }) => {
      it(`should generate "${expected}" from "${name}"`, async () => {
        avatar = await createComponent<SniceAvatarElement>('snice-avatar', {
          name
        });
        await wait(200);

        const fallbackEl = queryShadow(avatar as HTMLElement, '.avatar-fallback');
        if (expected) {
          expect(fallbackEl?.textContent?.trim()).toBe(expected);
        } else {
          const iconEl = queryShadow(avatar as HTMLElement, '.avatar-icon');
          expect(iconEl).toBeTruthy();
        }
      });
    });
  });
});
