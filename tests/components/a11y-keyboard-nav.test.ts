import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

// Theme 4: keyboard navigation on tablist / menu. Arrow keys move focus,
// Home/End jump to ends.

describe('tabs: ArrowRight moves selection to next tab', () => {
  it('pressing ArrowRight on the tablist selects the next tab', async () => {
    await import('../../components/tabs/snice-tabs');
    await import('../../components/tabs/snice-tab');
    await import('../../components/tabs/snice-tab-panel');

    const el = document.createElement('snice-tabs') as any;
    el.innerHTML = `
      <snice-tab slot="nav">One</snice-tab>
      <snice-tab slot="nav">Two</snice-tab>
      <snice-tab slot="nav">Three</snice-tab>
      <snice-tab-panel>P1</snice-tab-panel>
      <snice-tab-panel>P2</snice-tab-panel>
      <snice-tab-panel>P3</snice-tab-panel>
    `;
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    expect(el.selected).toBe(0);

    const nav = el.shadowRoot.querySelector('.tabs__nav');
    nav?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await wait(30);

    expect(el.selected).toBe(1);
  });

  it('ArrowLeft wraps to last tab from first', async () => {
    await import('../../components/tabs/snice-tabs');

    const el = document.createElement('snice-tabs') as any;
    el.innerHTML = `
      <snice-tab slot="nav">A</snice-tab>
      <snice-tab slot="nav">B</snice-tab>
      <snice-tab slot="nav">C</snice-tab>
      <snice-tab-panel>a</snice-tab-panel>
      <snice-tab-panel>b</snice-tab-panel>
      <snice-tab-panel>c</snice-tab-panel>
    `;
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    const nav = el.shadowRoot.querySelector('.tabs__nav');
    nav?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await wait(30);
    expect(el.selected).toBe(2);
  });

  it('Home key selects the first tab, End selects the last', async () => {
    await import('../../components/tabs/snice-tabs');

    const el = document.createElement('snice-tabs') as any;
    el.selected = 1;
    el.innerHTML = `
      <snice-tab slot="nav">A</snice-tab>
      <snice-tab slot="nav">B</snice-tab>
      <snice-tab slot="nav">C</snice-tab>
      <snice-tab-panel>a</snice-tab-panel>
      <snice-tab-panel>b</snice-tab-panel>
      <snice-tab-panel>c</snice-tab-panel>
    `;
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    const nav = el.shadowRoot.querySelector('.tabs__nav');
    nav?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await wait(30);
    expect(el.selected).toBe(2);

    nav?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await wait(30);
    expect(el.selected).toBe(0);
  });
});
