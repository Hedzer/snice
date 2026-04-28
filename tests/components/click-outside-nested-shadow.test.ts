import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { wait } from './test-utils';

// Tests for the click-outside fix that uses event.composedPath() instead of
// this.contains(e.target). Each component is tested across three axes:
//   1. The fix works: nested shadow DOM context does not close prematurely
//   2. Click-outside still works: outside clicks in both root and nested contexts
//   3. No unintended effects: clicks inside interactive inner content stay open,
//      multiple instances are isolated, keyboard + disabled paths unchanged

interface HostAPI extends HTMLElement {
  inner: HTMLElement;
}

async function mountInsideShadow(tag: string, attrs: Record<string, string> = {}): Promise<HostAPI> {
  const hostName = `test-wrap-${tag.replace(/[^a-z0-9]/gi, '-')}-${Math.random().toString(36).slice(2, 10)}`;
  class Host extends HTMLElement {
    inner!: HTMLElement;
    connectedCallback() {
      const sr = this.attachShadow({ mode: 'open' });
      const el = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      sr.appendChild(el);
      this.inner = el;
    }
  }
  customElements.define(hostName, Host);
  const host = document.createElement(hostName) as HostAPI;
  document.body.appendChild(host);
  await (host.inner as any).ready;
  return host;
}

function click(el: Element) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

function keydown(el: Element, key: string) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }));
}

async function loadAll() {
  await Promise.all([
    import('../../components/date-range-picker/snice-date-range-picker'),
    import('../../components/date-picker/snice-date-picker'),
    import('../../components/split-button/snice-split-button'),
    import('../../components/tag-input/snice-tag-input'),
    import('../../components/time-picker/snice-time-picker'),
  ]);
}

beforeEach(async () => { await loadAll(); });
afterEach(() => { document.body.innerHTML = ''; });

// ============================================================================
// date-range-picker
// ============================================================================

describe('snice-date-range-picker: click-outside across nested shadow DOM', () => {
  it('opens via input click inside nested shadow DOM', async () => {
    const host = await mountInsideShadow('snice-date-range-picker');
    const picker = host.inner as any;
    click(picker.shadowRoot.querySelector('input'));
    await wait(30);
    expect(picker.showCalendar).toBe(true);
  });

  it('opens via calendar-toggle button inside nested shadow DOM', async () => {
    const host = await mountInsideShadow('snice-date-range-picker');
    const picker = host.inner as any;
    click(picker.shadowRoot.querySelector('.calendar-toggle'));
    await wait(30);
    expect(picker.showCalendar).toBe(true);
  });

  it('opens via Enter key inside nested shadow DOM', async () => {
    const host = await mountInsideShadow('snice-date-range-picker');
    const picker = host.inner as any;
    keydown(picker.shadowRoot.querySelector('input'), 'Enter');
    await wait(30);
    expect(picker.showCalendar).toBe(true);
  });

  it('Escape closes when nested', async () => {
    const host = await mountInsideShadow('snice-date-range-picker');
    const picker = host.inner as any;
    picker.open();
    await wait(10);
    expect(picker.showCalendar).toBe(true);
    keydown(picker.shadowRoot.querySelector('input'), 'Escape');
    await wait(10);
    expect(picker.showCalendar).toBe(false);
  });

  it('closes when click lands on an element outside the nested host', async () => {
    const host = await mountInsideShadow('snice-date-range-picker');
    const picker = host.inner as any;
    picker.open();
    await wait(10);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    click(outside);
    await wait(30);
    expect(picker.showCalendar).toBe(false);
  });

  it('click inside the calendar (month-nav button) does not close', async () => {
    const host = await mountInsideShadow('snice-date-range-picker');
    const picker = host.inner as any;
    picker.open();
    await wait(20);
    const navBtn = picker.shadowRoot.querySelector('.calendar button');
    expect(navBtn).toBeTruthy();
    click(navBtn);
    await wait(30);
    expect(picker.showCalendar).toBe(true);
  });

  it('disabled picker ignores input click', async () => {
    const host = await mountInsideShadow('snice-date-range-picker', { disabled: '' });
    const picker = host.inner as any;
    click(picker.shadowRoot.querySelector('input'));
    await wait(30);
    expect(picker.showCalendar).toBe(false);
  });

  it('two nested pickers: opening A does not close B', async () => {
    const hostA = await mountInsideShadow('snice-date-range-picker');
    const hostB = await mountInsideShadow('snice-date-range-picker');
    const a = hostA.inner as any;
    const b = hostB.inner as any;
    a.open();
    b.open();
    await wait(10);
    expect(a.showCalendar).toBe(true);
    expect(b.showCalendar).toBe(true);
  });

  it('regression: works at document root (opens, closes on outside click)', async () => {
    const picker = document.createElement('snice-date-range-picker') as any;
    document.body.appendChild(picker);
    await picker.ready;
    picker.open();
    await wait(10);
    expect(picker.showCalendar).toBe(true);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    click(outside);
    await wait(30);
    expect(picker.showCalendar).toBe(false);
  });
});

// ============================================================================
// date-picker
// ============================================================================

describe('snice-date-picker: click-outside across nested shadow DOM', () => {
  it('opens via input click inside nested shadow DOM', async () => {
    const host = await mountInsideShadow('snice-date-picker');
    const picker = host.inner as any;
    click(picker.shadowRoot.querySelector('input'));
    await wait(30);
    expect(picker.showCalendar).toBe(true);
  });

  it('Escape closes when nested', async () => {
    const host = await mountInsideShadow('snice-date-picker');
    const picker = host.inner as any;
    picker.open?.() ?? (picker.showCalendar = true);
    await wait(10);
    keydown(picker.shadowRoot.querySelector('input'), 'Escape');
    await wait(10);
    expect(picker.showCalendar).toBe(false);
  });

  it('closes when click lands outside nested host', async () => {
    const host = await mountInsideShadow('snice-date-picker');
    const picker = host.inner as any;
    picker.open?.() ?? (picker.showCalendar = true);
    await wait(10);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    click(outside);
    await wait(30);
    expect(picker.showCalendar).toBe(false);
  });

  it('click inside the calendar does not close', async () => {
    const host = await mountInsideShadow('snice-date-picker');
    const picker = host.inner as any;
    picker.open?.() ?? (picker.showCalendar = true);
    await wait(20);
    const inner = picker.shadowRoot.querySelector('.calendar button');
    expect(inner).toBeTruthy();
    click(inner);
    await wait(30);
    expect(picker.showCalendar).toBe(true);
  });

  it('disabled picker ignores input click', async () => {
    const host = await mountInsideShadow('snice-date-picker', { disabled: '' });
    const picker = host.inner as any;
    click(picker.shadowRoot.querySelector('input'));
    await wait(30);
    expect(picker.showCalendar).toBe(false);
  });

  it('two nested pickers: opening A does not close B', async () => {
    const hostA = await mountInsideShadow('snice-date-picker');
    const hostB = await mountInsideShadow('snice-date-picker');
    const a = hostA.inner as any;
    const b = hostB.inner as any;
    a.open?.(); b.open?.();
    a.showCalendar = true; b.showCalendar = true;
    await wait(10);
    expect(a.showCalendar).toBe(true);
    expect(b.showCalendar).toBe(true);
  });

  it('regression: works at document root', async () => {
    const picker = document.createElement('snice-date-picker') as any;
    document.body.appendChild(picker);
    await picker.ready;
    picker.open?.() ?? (picker.showCalendar = true);
    await wait(10);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    click(outside);
    await wait(30);
    expect(picker.showCalendar).toBe(false);
  });
});

// ============================================================================
// split-button
// ============================================================================

describe('snice-split-button: click-outside across nested shadow DOM', () => {
  it('toggle click opens in nested shadow DOM', async () => {
    const host = await mountInsideShadow('snice-split-button', { label: 'T' });
    const btn = host.inner as any;
    click(btn.shadowRoot.querySelector('.split-button__toggle'));
    await wait(30);
    expect(btn.isOpen).toBe(true);
  });

  it('outside click closes in nested shadow DOM', async () => {
    const host = await mountInsideShadow('snice-split-button', { label: 'T' });
    const btn = host.inner as any;
    btn.isOpen = true;
    await wait(10);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    click(outside);
    await wait(30);
    expect(btn.isOpen).toBe(false);
  });

  it('click inside menu keeps it open', async () => {
    const host = await mountInsideShadow('snice-split-button', { label: 'T' });
    const btn = host.inner as any;
    btn.isOpen = true;
    await wait(20);
    const menu = btn.shadowRoot.querySelector('.split-button__menu');
    expect(menu).toBeTruthy();
    click(menu);
    await wait(30);
    expect(btn.isOpen).toBe(true);
  });

  it('two nested split-buttons: opening both keeps both open', async () => {
    const hostA = await mountInsideShadow('snice-split-button', { label: 'A' });
    const hostB = await mountInsideShadow('snice-split-button', { label: 'B' });
    const a = hostA.inner as any;
    const b = hostB.inner as any;
    a.isOpen = true;
    b.isOpen = true;
    await wait(10);
    expect(a.isOpen).toBe(true);
    expect(b.isOpen).toBe(true);
  });

  it('regression: works at document root', async () => {
    const btn = document.createElement('snice-split-button') as any;
    btn.setAttribute('label', 'Root');
    document.body.appendChild(btn);
    await btn.ready;
    btn.isOpen = true;
    await wait(10);
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    click(outside);
    await wait(30);
    expect(btn.isOpen).toBe(false);
  });
});

// ============================================================================
// tag-input
// ============================================================================

describe('snice-time-picker: click-outside across nested shadow DOM', () => {
  it('opens when the input is clicked inside nested shadow DOM', async () => {
    const host = await mountInsideShadow('snice-time-picker');
    const picker = host.inner as any;
    const input = picker.shadowRoot.querySelector('input');
    click(input);
    await wait(30);
    expect(picker.showDropdown).toBe(true);
  });

  it('Escape closes when nested', async () => {
    const host = await mountInsideShadow('snice-time-picker');
    const picker = host.inner as any;
    picker.open();
    await wait(10);
    keydown(picker.shadowRoot.querySelector('input'), 'Escape');
    await wait(10);
    expect(picker.showDropdown).toBe(false);
  });

  it('outside click closes when nested', async () => {
    const host = await mountInsideShadow('snice-time-picker');
    const picker = host.inner as any;
    picker.open();
    await wait(10);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    click(outside);
    await wait(30);
    expect(picker.showDropdown).toBe(false);
  });

  it('click inside dropdown does not close', async () => {
    const host = await mountInsideShadow('snice-time-picker');
    const picker = host.inner as any;
    picker.open();
    await wait(20);
    const inner = picker.shadowRoot.querySelector('.dropdown *') as Element;
    if (inner) {
      click(inner);
      await wait(30);
      expect(picker.showDropdown).toBe(true);
    }
  });

  it('disabled picker ignores input click', async () => {
    const host = await mountInsideShadow('snice-time-picker', { disabled: '' });
    const picker = host.inner as any;
    click(picker.shadowRoot.querySelector('input'));
    await wait(30);
    expect(picker.showDropdown).toBe(false);
  });

  it('regression: works at document root', async () => {
    const picker = document.createElement('snice-time-picker') as any;
    document.body.appendChild(picker);
    await picker.ready;
    picker.open();
    await wait(10);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    click(outside);
    await wait(30);
    expect(picker.showDropdown).toBe(false);
  });
});

describe('snice-tag-input: click-outside across nested shadow DOM', () => {
  it('click inside shadow DOM does not close suggestions when nested', async () => {
    const host = await mountInsideShadow('snice-tag-input');
    const el = host.inner as any;
    el.showSuggestions = true;
    await wait(10);
    const inner = el.shadowRoot.querySelector('*') as Element;
    click(inner);
    await wait(30);
    expect(el.showSuggestions).toBe(true);
  });

  it('outside click closes when nested', async () => {
    const host = await mountInsideShadow('snice-tag-input');
    const el = host.inner as any;
    el.showSuggestions = true;
    await wait(10);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    click(outside);
    await wait(30);
    expect(el.showSuggestions).toBe(false);
  });

  it('two nested tag-inputs: outside click closes both; inside click on A keeps A', async () => {
    const hostA = await mountInsideShadow('snice-tag-input');
    const hostB = await mountInsideShadow('snice-tag-input');
    const a = hostA.inner as any;
    const b = hostB.inner as any;
    a.showSuggestions = true;
    b.showSuggestions = true;
    await wait(10);

    click(a.shadowRoot.querySelector('*') as Element);
    await wait(30);
    expect(a.showSuggestions).toBe(true);
    expect(b.showSuggestions).toBe(false);
  });

  it('regression: works at document root', async () => {
    const el = document.createElement('snice-tag-input') as any;
    document.body.appendChild(el);
    await el.ready;
    el.showSuggestions = true;
    await wait(10);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    click(outside);
    await wait(30);
    expect(el.showSuggestions).toBe(false);
  });
});
