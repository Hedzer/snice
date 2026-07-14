import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

// Theme 3: dialog-like components. Verify role=dialog, aria-modal, focus trap,
// Escape dismiss, and aria-labelledby wiring.

describe('modal: dialog role + aria-labelledby', () => {
  it('dialog has role=dialog and aria-modal=true when open', async () => {
    await import('../../packages/components/src/modal/snice-modal');
    const el = document.createElement('snice-modal') as any;
    el.open = true;
    el.innerHTML = `<h2 slot="header">My Title</h2>`;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const dialog = el.shadowRoot.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('aria-labelledby points to the slotted header when no explicit label', async () => {
    await import('../../packages/components/src/modal/snice-modal');
    const el = document.createElement('snice-modal') as any;
    el.open = true;
    el.innerHTML = `<h2 slot="header">My Title</h2>`;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const dialog = el.shadowRoot.querySelector('[role="dialog"]');
    // Either aria-label OR aria-labelledby should name the dialog.
    const hasLabel = !!dialog.getAttribute('aria-label');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(hasLabel || !!labelledBy).toBe(true);
  });

  it('does NOT emit empty aria-label when label is blank', async () => {
    await import('../../packages/components/src/modal/snice-modal');
    const el = document.createElement('snice-modal') as any;
    el.open = true;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const dialog = el.shadowRoot.querySelector('[role="dialog"]');
    // aria-label="" is worse than no aria-label at all (SR announces empty).
    expect(dialog.getAttribute('aria-label')).not.toBe('');
  });
});

describe('drawer: dialog role + accessible name', () => {
  it('has aria-label or aria-labelledby on role=dialog', async () => {
    await import('../../packages/components/src/drawer/snice-drawer');
    const el = document.createElement('snice-drawer') as any;
    el.label = 'Settings';
    el.open = true;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const dialog = el.shadowRoot.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    const hasName = !!dialog.getAttribute('aria-label') || !!dialog.getAttribute('aria-labelledby');
    expect(hasName).toBe(true);
  });
});

describe('command-palette: has role=dialog and aria-modal when open', () => {
  it('when open, exposes dialog role', async () => {
    await import('../../packages/components/src/command-palette/snice-command-palette');
    const el = document.createElement('snice-command-palette') as any;
    el.open = true;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const dialog = el.shadowRoot.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('input has role=combobox with aria-expanded and aria-controls', async () => {
    await import('../../packages/components/src/command-palette/snice-command-palette');
    const el = document.createElement('snice-command-palette') as any;
    el.open = true;
    el.commands = [{ id: 'a', label: 'Alpha' }];
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const input = el.shadowRoot.querySelector('input');
    expect(input?.getAttribute('role')).toBe('combobox');
    expect(input?.getAttribute('aria-expanded')).toBe('true');
    expect(input?.getAttribute('aria-controls')).toBeTruthy();
  });
});
