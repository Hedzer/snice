import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router, context, ready, render, html, query } from '../packages/core/src';
import type { Context } from '../packages/core/src';

async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('routed page lifecycle order', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('orders @context, @ready, and first render for a routed page', async () => {
    const order: string[] = [];

    const router = Router({ target: '#app', context: {} });

    @router.page({ tag: 'order-probe-page', routes: ['/order'] })
    class OrderProbePage extends HTMLElement {
      @query('.probe-marker') marker?: HTMLElement;

      @context()
      onContext(ctx: Context) {
        order.push(`context(rendered=${!!this.shadowRoot?.querySelector('.probe-marker')})`);
      }

      @ready()
      onReady() {
        order.push(`ready(rendered=${!!this.shadowRoot?.querySelector('.probe-marker')})`);
      }

      @render()
      template() {
        order.push('render');
        return html`<div class="probe-marker">x</div>`;
      }
    }

    router.initialize();
    await router.navigate('/order');
    await waitFor(100);

    // SNICE-167: pinned for the lifecycle docs — a page can normalize an
    // incoming route parameter in @context() before the first render commits.
    expect(order[0]).toBe('context(rendered=false)');
    expect(order.indexOf('render')).toBeLessThan(order.findIndex(e => e.startsWith('ready')));
    expect(order).toContain('ready(rendered=true)');
  });
});
