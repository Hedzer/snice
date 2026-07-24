import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';

const cssPath = resolve(process.cwd(), 'packages/components/src/notification-center/snice-notification-center.css');
import '../../packages/components/src/notification-center/snice-notification-center';
import type { SniceNotificationCenterElement } from '../../packages/components/src/notification-center/snice-notification-center.types';

describe('snice-notification-center', () => {
  let el: SniceNotificationCenterElement;

  afterEach(() => {
    if (el) removeComponent(el as HTMLElement);
  });

  it('renders with a default bell icon', async () => {
    el = await createComponent<SniceNotificationCenterElement>('snice-notification-center');
    const bellIcon = queryShadow(el as HTMLElement, '.bell-icon');
    expect(bellIcon).toBeTruthy();
    expect(bellIcon!.querySelector('svg')).toBeTruthy();
  });

  it('renders icon attribute as image when given a URL', async () => {
    el = await createComponent<SniceNotificationCenterElement>('snice-notification-center', { icon: 'https://example.com/bell.svg' });
    const img = queryShadow(el as HTMLElement, '.bell-icon-img');
    expect(img).toBeTruthy();
    expect(img!.tagName).toBe('IMG');
    expect(img!.getAttribute('src')).toBe('https://example.com/bell.svg');
  });

  it('renders icon attribute as text for emoji/ligature', async () => {
    el = await createComponent<SniceNotificationCenterElement>('snice-notification-center', { icon: '\uD83D\uDCE8' });
    const bellIcon = queryShadow(el as HTMLElement, '.bell-icon-img');
    expect(bellIcon).toBeTruthy();
    expect(bellIcon!.textContent).toContain('\uD83D\uDCE8');
  });

  it('supports slotted icon content', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = `
      <snice-notification-center>
        <svg slot="icon" width="20" height="20"><circle cx="10" cy="10" r="10"/></svg>
      </snice-notification-center>
    `;
    el = container.querySelector('snice-notification-center') as SniceNotificationCenterElement;
    await new Promise(r => setTimeout(r, 50));
    const slot = el.shadowRoot?.querySelector('slot[name="icon"]') as HTMLSlotElement;
    expect(slot).toBeTruthy();
    const assigned = slot.assignedElements();
    expect(assigned.length).toBe(1);
    expect(assigned[0].tagName).toBe('SVG');
    // Clean up container too
    container.remove();
    el = undefined as any; // prevent double-remove in afterEach
  });

  it('shows badge with unread count', async () => {
    el = await createComponent<SniceNotificationCenterElement>('snice-notification-center');
    el.notifications = [
      { id: '1', title: 'Test', message: 'msg', timestamp: 'now', read: false },
      { id: '2', title: 'Test 2', message: 'msg2', timestamp: 'now', read: true },
    ];
    await new Promise(r => setTimeout(r, 50));
    const badge = queryShadow(el as HTMLElement, 'snice-badge');
    expect(badge).toBeTruthy();
    expect(badge!.getAttribute('count')).toBe('1');
  });

  it('hides badge when no unread', async () => {
    el = await createComponent<SniceNotificationCenterElement>('snice-notification-center');
    el.notifications = [
      { id: '1', title: 'Test', message: 'msg', timestamp: 'now', read: true },
    ];
    await new Promise(r => setTimeout(r, 50));
    const badge = queryShadow(el as HTMLElement, 'snice-badge');
    expect(badge).toBeTruthy();
    expect(badge!.getAttribute('count')).toBe('0');
  });

  it('unread hover uses theme variable not hardcoded color', async () => {
    // Verify the CSS source file doesn't contain the old hardcoded value
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const cssText = readFileSync(
      resolve(process.cwd(), 'packages/components/src/notification-center/snice-notification-center.css'),
      'utf-8'
    );
    expect(cssText).not.toContain('rgb(229 236 255)');
    expect(cssText).toContain('--snice-color-primary-subtle-hover');
  });

  describe('registry icons', () => {
    it('renders the default bell as a registry SVG, not an emoji', async () => {
      el = await createComponent<SniceNotificationCenterElement>('snice-notification-center');
      await wait(50);

      const bell = queryShadow(el as HTMLElement, '.bell-icon');
      expect(bell?.querySelector('svg')).toBeTruthy();
      expect(bell?.textContent).not.toContain('🔔');
    });

    it.each([
      ['success'],
      ['warning'],
      ['error'],
      ['info'],
    ])('renders a registry SVG default icon for %s notifications', async (type) => {
      el = await createComponent<SniceNotificationCenterElement>('snice-notification-center');
      el.notifications = [{ id: '1', title: 'T', message: 'M', timestamp: 'now', type: type as any }];
      el.open = true;
      await wait(50);

      const icon = queryShadow(el as HTMLElement, '.notification-icon');
      expect(icon?.querySelector('svg')).toBeTruthy();
    });

    it('renders the dismiss control as a registry SVG, not a text glyph', async () => {
      el = await createComponent<SniceNotificationCenterElement>('snice-notification-center');
      el.notifications = [{ id: '1', title: 'T', message: 'M', timestamp: 'now' }];
      el.open = true;
      await wait(50);

      const dismiss = queryShadow(el as HTMLElement, '.dismiss-btn');
      expect(dismiss?.querySelector('svg')).toBeTruthy();
      expect(dismiss?.textContent).not.toContain('✕');
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
