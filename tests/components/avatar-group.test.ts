import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/avatar-group/snice-avatar-group';
import type { SniceAvatarGroupElement, AvatarGroupItem } from '../../components/avatar-group/snice-avatar-group.types';

describe('snice-avatar-group', () => {
  let group: SniceAvatarGroupElement;

  const sampleAvatars: AvatarGroupItem[] = [
    { name: 'Alice Johnson', initials: 'AJ' },
    { name: 'Bob Smith', initials: 'BS' },
    { name: 'Carol Williams', initials: 'CW' },
    { name: 'David Brown', initials: 'DB' },
    { name: 'Eve Davis', initials: 'ED' },
    { name: 'Frank Miller', initials: 'FM' },
    { name: 'Grace Wilson', initials: 'GW' },
  ];

  afterEach(() => {
    if (group) {
      removeComponent(group as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render avatar group element', async () => {
      group = await createComponent<SniceAvatarGroupElement>('snice-avatar-group');

      expect(group).toBeTruthy();
      expect(group.tagName).toBe('SNICE-AVATAR-GROUP');
    });

    it('should have default properties', async () => {
      group = await createComponent<SniceAvatarGroupElement>('snice-avatar-group');

      expect(group.avatars).toEqual([]);
      expect(group.max).toBe(5);
      expect(group.size).toBe('medium');
      expect(group.overlap).toBe(8);
    });
  });

  describe('avatar rendering', () => {
    it('should render avatars with initials', async () => {
      group = await createComponent<SniceAvatarGroupElement>('snice-avatar-group');
      group.avatars = sampleAvatars.slice(0, 3);
      await wait(200);

      const avatarItems = queryShadowAll(group as HTMLElement, '.avatar-item:not(.avatar-overflow)');
      expect(avatarItems.length).toBe(3);
    });

    it('should render avatars with images', async () => {
      group = await createComponent<SniceAvatarGroupElement>('snice-avatar-group');
      group.avatars = [{ name: 'Test', src: '/avatar.jpg' }];
      await wait(200);

      const img = queryShadow(group as HTMLElement, '.avatar-item img') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img?.src).toContain('avatar.jpg');
    });
  });

  describe('overflow', () => {
    it('should show overflow indicator when avatars exceed max', async () => {
      group = await createComponent<SniceAvatarGroupElement>('snice-avatar-group', {
        max: '3'
      });
      group.avatars = sampleAvatars;
      await wait(200);

      const overflow = queryShadow(group as HTMLElement, '.avatar-overflow');
      expect(overflow).toBeTruthy();
      expect(overflow?.textContent?.trim()).toBe('+4');
    });

    it('should not show overflow when avatars fit within max', async () => {
      group = await createComponent<SniceAvatarGroupElement>('snice-avatar-group');
      group.avatars = sampleAvatars.slice(0, 3);
      await wait(200);

      const overflow = queryShadow(group as HTMLElement, '.avatar-overflow');
      expect(overflow).toBeFalsy();
    });

    it('should respect custom max value', async () => {
      group = await createComponent<SniceAvatarGroupElement>('snice-avatar-group', {
        max: '2'
      });
      group.avatars = sampleAvatars.slice(0, 5);
      await wait(200);

      const avatarItems = queryShadowAll(group as HTMLElement, '.avatar-item:not(.avatar-overflow)');
      expect(avatarItems.length).toBe(2);

      const overflow = queryShadow(group as HTMLElement, '.avatar-overflow');
      expect(overflow?.textContent?.trim()).toBe('+3');
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should support ${size} size`, async () => {
        group = await createComponent<SniceAvatarGroupElement>('snice-avatar-group', {
          size
        });

        expect(group.size).toBe(size);
      });
    });
  });

  describe('overlap', () => {
    it('should apply custom overlap', async () => {
      group = await createComponent<SniceAvatarGroupElement>('snice-avatar-group', {
        overlap: '12'
      });
      await wait(200);

      const overlapValue = (group as HTMLElement).style.getPropertyValue('--avatar-group-overlap');
      expect(overlapValue).toBe('-0.75rem');
    });
  });

  describe('events', () => {
    it('should dispatch avatar-click event', async () => {
      group = await createComponent<SniceAvatarGroupElement>('snice-avatar-group');
      group.avatars = sampleAvatars.slice(0, 3);
      await wait(200);

      let clickDetail: any = null;
      (group as HTMLElement).addEventListener('avatar-click', (e: Event) => {
        clickDetail = (e as CustomEvent).detail;
      });

      const firstAvatar = queryShadow(group as HTMLElement, '.avatar-item') as HTMLButtonElement;
      firstAvatar?.click();

      expect(clickDetail).toBeTruthy();
      expect(clickDetail.avatar.name).toBe('Alice Johnson');
      expect(clickDetail.index).toBe(0);
    });

    it('should dispatch overflow-click event', async () => {
      group = await createComponent<SniceAvatarGroupElement>('snice-avatar-group', {
        max: '2'
      });
      group.avatars = sampleAvatars.slice(0, 5);
      await wait(200);

      let overflowDetail: any = null;
      (group as HTMLElement).addEventListener('overflow-click', (e: Event) => {
        overflowDetail = (e as CustomEvent).detail;
      });

      const overflow = queryShadow(group as HTMLElement, '.avatar-overflow') as HTMLButtonElement;
      overflow?.click();

      expect(overflowDetail).toBeTruthy();
      expect(overflowDetail.remaining).toBe(3);
      expect(overflowDetail.avatars.length).toBe(3);
    });
  });

  describe('accessibility', () => {
    it('should have group role', async () => {
      group = await createComponent<SniceAvatarGroupElement>('snice-avatar-group');
      group.avatars = sampleAvatars.slice(0, 3);
      await wait(200);

      const groupEl = queryShadow(group as HTMLElement, '.avatar-group');
      expect(groupEl?.getAttribute('role')).toBe('group');
      expect(groupEl?.getAttribute('aria-label')).toBe('Avatar group');
    });
  });
});
