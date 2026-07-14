import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  SniceElement,
  element,
  html,
  property,
  repeat,
  state
} from './test-imports';

function commentCount(root: Node): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
  let count = 0;
  while (walker.nextNode()) count++;
  return count;
}

describe('declarative renderer sustained lifecycle behavior', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => container.remove());

  it('does not duplicate listeners or leave async iterators active over 250 reconnects', async () => {
    let active = 0;
    let opened = 0;
    let returned = 0;
    const source: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        active++;
        opened++;
        let closed = false;
        return {
          next: () => new Promise<IteratorResult<string>>(() => {}),
          return() {
            if (!closed) {
              closed = true;
              active--;
              returned++;
            }
            return Promise.resolve({ done: true, value: undefined });
          }
        };
      }
    };

    @element('test-renderer-reconnect-stress')
    class TestRendererReconnectStress extends SniceElement {
      directCalls = 0;
      spreadCalls = 0;
      onceCalls = 0;
      direct = () => { this.directCalls++; };
      spread = () => { this.spreadCalls++; };
      once = () => { this.onceCalls++; };

      render() {
        return html`
          <button class="direct" @click=${this.direct}>direct</button>
          <button class="spread" ...events=${{ click: this.spread }}>spread</button>
          <button class="once" @click|once=${this.once}>once</button>
          <output>${source}</output>
        `;
      }
    }

    const host = document.createElement('test-renderer-reconnect-stress') as TestRendererReconnectStress;
    container.append(host);
    await host.ready;
    const direct = host.shadowRoot!.querySelector('.direct') as HTMLButtonElement;
    const spread = host.shadowRoot!.querySelector('.spread') as HTMLButtonElement;
    const once = host.shadowRoot!.querySelector('.once') as HTMLButtonElement;
    once.click();

    for (let index = 0; index < 250; index++) {
      host.remove();
      expect(active).toBe(0);
      container.append(host);
      expect(active).toBe(1);
      expect(host.shadowRoot!.querySelector('.direct')).toBe(direct);
      expect(host.shadowRoot!.querySelector('.spread')).toBe(spread);
      expect(host.shadowRoot!.querySelector('.once')).toBe(once);
    }

    direct.click();
    spread.click();
    once.click();
    expect(host.directCalls).toBe(1);
    expect(host.spreadCalls).toBe(1);
    expect(host.onceCalls).toBe(1);
    expect(opened).toBe(251);
    expect(returned).toBe(250);

    host.remove();
    expect(active).toBe(0);
    expect(returned).toBe(opened);
  });

  it('keeps keyed ranges and marker counts bounded through 500 adversarial reorders', async () => {
    type Item = { id: number; label: string };
    const ids = Array.from({ length: 12 }, (_, index) => index);

    @element('test-renderer-keyed-stress')
    class TestRendererKeyedStress extends SniceElement {
      @property({ attribute: false }) items: Item[] = ids.map(id => ({ id, label: `0:${id}` }));

      render() {
        return html`<section>${repeat(this.items, {
          key: item => item.id,
          render: item => html`<article data-id=${item.id}>${item.label}</article>`
        })}</section>`;
      }
    }

    const host = document.createElement('test-renderer-keyed-stress') as TestRendererKeyedStress;
    container.append(host);
    await host.ready;
    const identities = new Map(
      [...host.shadowRoot!.querySelectorAll('article')]
        .map(node => [Number(node.getAttribute('data-id')), node] as const)
    );
    const markers = commentCount(host.shadowRoot!);
    let seed = 0x51ce;

    for (let revision = 1; revision <= 500; revision++) {
      const order = [...ids];
      for (let index = order.length - 1; index > 0; index--) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const swap = seed % (index + 1);
        [order[index], order[swap]] = [order[swap], order[index]];
      }
      host.items = order.map(id => ({ id, label: `${revision}:${id}` }));
      await host.rendered;
      const nodes = [...host.shadowRoot!.querySelectorAll('article')];
      expect(nodes.map(node => Number(node.getAttribute('data-id')))).toEqual(order);
      expect(nodes.map(node => node.textContent)).toEqual(order.map(id => `${revision}:${id}`));
      for (const node of nodes) {
        expect(node).toBe(identities.get(Number(node.getAttribute('data-id'))));
      }
      expect(commentCount(host.shadowRoot!)).toBe(markers);
    }
  });

  it('batches thousands of deep mutations and remains exact over sustained updates', async () => {
    @element('test-renderer-reactive-stress')
    class TestRendererReactiveStress extends SniceElement {
      renders = 0;
      @state({ deep: true }) model = {
        revision: 0,
        list: [] as number[],
        map: new Map<number, number>(),
        set: new Set<number>()
      };

      render() {
        this.renders++;
        return html`<output>${this.model.revision}|${this.model.list.length}|${this.model.map.size}|${this.model.set.size}</output>`;
      }
    }

    const host = document.createElement('test-renderer-reactive-stress') as TestRendererReactiveStress;
    container.append(host);
    await host.ready;
    const initialRenders = host.renders;

    for (let index = 0; index < 1_000; index++) {
      host.model.list.push(index);
      host.model.map.set(index, index * 2);
      host.model.set.add(index);
    }
    await host.rendered;
    expect(host.renders).toBe(initialRenders + 1);
    expect(host.shadowRoot!.querySelector('output')!.textContent).toBe('0|1000|1000|1000');

    for (let revision = 1; revision <= 100; revision++) {
      const removed = revision - 1;
      host.model.revision = revision;
      host.model.list.pop();
      host.model.map.delete(removed);
      host.model.set.delete(removed);
      await host.rendered;
      expect(host.renders).toBe(initialRenders + 1 + revision);
    }
    expect(host.shadowRoot!.querySelector('output')!.textContent).toBe('100|900|900|900');
  });
});
