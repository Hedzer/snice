import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow } from './test-utils';
import '../../components/notification-center/snice-notification-center';
import type { SniceNotificationCenterElement } from '../../components/notification-center/snice-notification-center.types';

describe('snice-notification-center', () => {
  let el: SniceNotificationCenterElement;

  afterEach(() => {
    if (el) removeComponent(el as HTMLElement);
  });

  it('renders with default bell emoji', async () => {
    el = await createComponent<SniceNotificationCenterElement>('snice-notification-center');
    const bellIcon = queryShadow(el as HTMLElement, '.bell-icon');
    expect(bellIcon).toBeTruthy();
    expect(bellIcon!.textContent).toContain('\uD83D\uDD14');
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
    const badge = queryShadow(el as HTMLElement, '.badge');
    expect(badge).toBeTruthy();
    expect(badge!.textContent).toContain('1');
    expect(badge!.hidden).toBe(false);
  });

  it('hides badge when no unread', async () => {
    el = await createComponent<SniceNotificationCenterElement>('snice-notification-center');
    el.notifications = [
      { id: '1', title: 'Test', message: 'msg', timestamp: 'now', read: true },
    ];
    await new Promise(r => setTimeout(r, 50));
    const badge = queryShadow(el as HTMLElement, '.badge');
    expect(badge!.hidden).toBe(true);
  });

  it('unread hover uses theme variable not hardcoded color', async () => {
    // Verify the CSS source file doesn't contain the old hardcoded value
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const cssText = readFileSync(
      resolve(process.cwd(), 'components/notification-center/snice-notification-center.css'),
      'utf-8'
    );
    expect(cssText).not.toContain('rgb(229 236 255)');
    expect(cssText).toContain('--snice-color-primary-subtle-hover');
  });
});
