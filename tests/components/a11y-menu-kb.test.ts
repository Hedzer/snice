import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

describe('menu: trigger semantics + keyboard navigation', () => {
  it('trigger has aria-haspopup=menu and aria-expanded updates', async () => {
    await import('../../packages/components/src/menu/snice-menu');
    await import('../../packages/components/src/menu/snice-menu-item');

    const el = document.createElement('snice-menu') as any;
    el.innerHTML = `
      <button slot="trigger">Open</button>
      <snice-menu-item>One</snice-menu-item>
      <snice-menu-item>Two</snice-menu-item>
    `;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const trigger = el.shadowRoot.querySelector('.menu__trigger') as HTMLElement;
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    el.openMenu();
    await wait(30);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('Escape closes menu', async () => {
    await import('../../packages/components/src/menu/snice-menu');

    const el = document.createElement('snice-menu') as any;
    el.innerHTML = `<button slot="trigger">Open</button><snice-menu-item>One</snice-menu-item>`;
    document.body.appendChild(el);
    await el.ready;
    el.openMenu();
    await wait(30);
    expect(el.open).toBe(true);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wait(30);
    expect(el.open).toBe(false);
  });
});
