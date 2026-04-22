import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

// Extend theme 2: select, switch, slider — label association + aria-describedby.

describe('slider: label, aria-describedby, aria-valuetext', () => {
  it('label for= links to the thumb via labelledby', async () => {
    await import('../../components/slider/snice-slider');
    const el = document.createElement('snice-slider') as any;
    el.label = 'Volume';
    el.value = 50;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const thumb = el.shadowRoot.querySelector('[role="slider"]');
    expect(thumb).toBeTruthy();
    const hasName = !!thumb.getAttribute('aria-label') || !!thumb.getAttribute('aria-labelledby');
    expect(hasName).toBe(true);
  });

  it('aria-describedby points to helper/error text', async () => {
    await import('../../components/slider/snice-slider');
    const el = document.createElement('snice-slider') as any;
    el.label = 'Volume';
    el.helperText = '0 to 100';
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const thumb = el.shadowRoot.querySelector('[role="slider"]');
    const describedBy = thumb?.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const desc = el.shadowRoot.getElementById(describedBy!);
    expect(desc?.textContent).toContain('0 to 100');
  });
});

describe('switch: label association + aria-describedby', () => {
  it('label for= links to inner input', async () => {
    await import('../../components/switch/snice-switch');
    const el = document.createElement('snice-switch') as any;
    el.label = 'Dark mode';
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const input = el.shadowRoot.querySelector('input');
    expect(input?.id).toBeTruthy();
    // aria-labelledby OR a proper <label for=> is acceptable
    const hasName = input.getAttribute('aria-label') ||
                    input.getAttribute('aria-labelledby') ||
                    el.shadowRoot.querySelector(`label[for="${input.id}"]`);
    expect(hasName).toBeTruthy();
  });
});

describe('select: trigger exposes combobox semantics', () => {
  it('trigger has aria-haspopup and aria-expanded that updates', async () => {
    await import('../../components/select/snice-select');
    const el = document.createElement('snice-select') as any;
    el.options = [{ value: '1', label: 'One' }];
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const trigger = el.shadowRoot.querySelector('.select-trigger');
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute('aria-haspopup')).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    el.open = true;
    await wait(30);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('aria-describedby points to error/helper text', async () => {
    await import('../../components/select/snice-select');
    const el = document.createElement('snice-select') as any;
    el.options = [{ value: '1', label: 'One' }];
    el.errorText = 'Please pick one';
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const trigger = el.shadowRoot.querySelector('.select-trigger');
    const describedBy = trigger?.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const err = el.shadowRoot.getElementById(describedBy!);
    expect(err?.textContent).toContain('Please pick one');
  });
});
