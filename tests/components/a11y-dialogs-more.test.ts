import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

describe('spotlight: popover has dialog role + labelledby', () => {
  it('popover role=dialog and aria-labelledby points to title', async () => {
    await import('../../components/spotlight/snice-spotlight');
    const el = document.createElement('snice-spotlight') as any;
    el.steps = [{ title: 'Hi', description: 'Welcome', target: 'body' }];
    document.body.appendChild(el);
    await el.ready;
    el.start();
    await wait(50);

    const portal = document.querySelector('[data-snice-spotlight-portal]');
    const popover = portal?.querySelector('.popover');
    expect(popover?.getAttribute('role')).toBe('dialog');
    expect(popover?.getAttribute('aria-modal')).toBe('true');
    const labelledBy = popover?.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    // Cleanup
    el.end();
  });
});

describe('notification-center: trigger and panel a11y', () => {
  it('trigger has aria-expanded that updates with open state', async () => {
    await import('../../components/notification-center/snice-notification-center');
    const el = document.createElement('snice-notification-center') as any;
    el.notifications = [{ id: '1', title: 't', message: 'm', read: false }];
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const trigger = el.shadowRoot.querySelector('.bell-button') as HTMLElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');

    el.open = true;
    await wait(30);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('panel has role=dialog and aria-labelledby', async () => {
    await import('../../components/notification-center/snice-notification-center');
    const el = document.createElement('snice-notification-center') as any;
    el.notifications = [{ id: '1', title: 't', message: 'm', read: false }];
    el.open = true;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const panel = el.shadowRoot.querySelector('[part="panel"]') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-labelledby')).toBeTruthy();
  });
});
