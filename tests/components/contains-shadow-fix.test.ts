import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

// select + tooltip used `this.contains(e.target)` which is false for clicks
// whose original target is inside their own shadow DOM — because `target`
// is retargeted to the host. Verify click on own internal element does NOT
// close the dropdown / tooltip.

describe('select: click on internal shadow element keeps dropdown open', () => {
  it('click whose composedPath includes the host does not close', async () => {
    await import('../../components/select/snice-select');
    const el = document.createElement('snice-select') as any;
    el.options = [{ value: 'a', label: 'Alpha' }];
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    el.open = true;
    await wait(20);

    // Find an internal shadow element and dispatch click from it. That click's
    // target, outside the shadow, is `el` (retargeted). The handler uses
    // composedPath(), so includes(this) should short-circuit.
    const trigger = el.shadowRoot.querySelector('.select__field, .select__trigger, .select__control') as HTMLElement;
    if (!trigger) {
      // fall back to any element
      const anyEl = el.shadowRoot.querySelector('*') as HTMLElement;
      expect(anyEl).toBeTruthy();
      anyEl.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    } else {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    }
    await wait(20);

    expect(el.open).toBe(true);
  });

  it('click truly outside closes dropdown', async () => {
    await import('../../components/select/snice-select');
    const el = document.createElement('snice-select') as any;
    el.options = [{ value: 'a', label: 'Alpha' }];
    document.body.appendChild(el);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    await el.ready;
    await wait(20);

    el.open = true;
    await wait(20);

    outside.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(20);

    expect(el.open).toBe(false);
  });
});
