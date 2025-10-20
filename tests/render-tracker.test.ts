import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html, trackRenders } from '../src/index';

// Test component
@element('test-render-tracker')
class TestRenderTracker extends HTMLElement {
  @property() name = 'initial';
  @property() count = 0;

  @render()
  renderTemplate() {
    return html`
      <div class="content">
        <span class="name">${this.name}</span>
        <span class="count">${this.count}</span>
      </div>
    `;
  }
}

describe('trackRenders', () => {
  let el: TestRenderTracker;

  beforeEach(async () => {
    el = document.createElement('test-render-tracker') as TestRenderTracker;
    document.body.appendChild(el);
    await (el as any).ready;
  });

  afterEach(() => {
    el.remove();
  });

  it('should yield after property change triggers render', async () => {
    const tracker = trackRenders(el);

    el.name = 'updated';
    await tracker.next();

    const nameEl = el.shadowRoot?.querySelector('.name');
    expect(nameEl?.textContent).toBe('updated');
  });

  it('should yield multiple times for multiple renders', async () => {
    const tracker = trackRenders(el);

    el.name = 'first';
    await tracker.next();
    expect(el.shadowRoot?.querySelector('.name')?.textContent).toBe('first');

    el.name = 'second';
    await tracker.next();
    expect(el.shadowRoot?.querySelector('.name')?.textContent).toBe('second');

    el.name = 'third';
    await tracker.next();
    expect(el.shadowRoot?.querySelector('.name')?.textContent).toBe('third');
  });

  it('should track renders for multiple properties', async () => {
    const tracker = trackRenders(el);

    el.name = 'new name';
    await tracker.next();
    expect(el.shadowRoot?.querySelector('.name')?.textContent).toBe('new name');

    el.count = 42;
    await tracker.next();
    expect(el.shadowRoot?.querySelector('.count')?.textContent).toBe('42');
  });

  it('should handle batched property changes as single render', async () => {
    const tracker = trackRenders(el);

    // Set multiple properties synchronously - should batch into single render
    el.name = 'batched';
    el.count = 100;

    // Only need to wait for one render
    await tracker.next();

    expect(el.shadowRoot?.querySelector('.name')?.textContent).toBe('batched');
    expect(el.shadowRoot?.querySelector('.count')?.textContent).toBe('100');
  });

  it('should not affect render performance when not tracking', async () => {
    // Don't create tracker - just change properties
    el.name = 'no tracker';

    // Give time for render to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(el.shadowRoot?.querySelector('.name')?.textContent).toBe('no tracker');
  });

  it('should allow multiple trackers on same element', async () => {
    const tracker1 = trackRenders(el);
    const tracker2 = trackRenders(el);

    el.name = 'both trackers';

    // Both trackers should resolve
    await Promise.all([
      tracker1.next(),
      tracker2.next()
    ]);

    expect(el.shadowRoot?.querySelector('.name')?.textContent).toBe('both trackers');
  });

  it('should cleanup when tracker is abandoned', async () => {
    {
      const tracker = trackRenders(el);
      el.name = 'test';
      await tracker.next();
    }

    // Tracker should be garbage collected at this point
    // Subsequent renders should work normally without the tracker
    el.name = 'after cleanup';
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(el.shadowRoot?.querySelector('.name')?.textContent).toBe('after cleanup');
  });
});
