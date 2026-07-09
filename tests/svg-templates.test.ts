import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html, svg } from '../src/index';

describe('svg`` template fragments', () => {
  let container: HTMLDivElement;
  let uniqueId = 0;

  const getUniqueTag = () => `svg-template-test-${++uniqueId}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  const tick = () => new Promise(resolve => queueMicrotask(resolve));
  const SVG_NS = 'http://www.w3.org/2000/svg';

  it('parses fragment elements in the SVG namespace', async () => {
    const tag = getUniqueTag();

    @element(tag)
    class TestElement extends HTMLElement {
      @property({ type: Number }) r = 10;

      @render()
      renderContent() {
        return html`<svg viewBox="0 0 100 100">${svg`<circle cx="50" cy="50" r=${this.r}></circle>`}</svg>`;
      }
    }

    const el = document.createElement(tag) as InstanceType<typeof TestElement>;
    container.appendChild(el);
    await el.ready;

    const circle = el.shadowRoot?.querySelector('circle');
    expect(circle).toBeTruthy();
    expect(circle?.namespaceURI).toBe(SVG_NS);
    expect(circle?.getAttribute('r')).toBe('10');
  });

  it('updates bindings inside svg fragments', async () => {
    const tag = getUniqueTag();

    @element(tag)
    class TestElement extends HTMLElement {
      @property({ type: Number }) r = 10;

      @render()
      renderContent() {
        return html`<svg>${svg`<circle r=${this.r}></circle>`}</svg>`;
      }
    }

    const el = document.createElement(tag) as InstanceType<typeof TestElement>;
    container.appendChild(el);
    await el.ready;

    el.r = 25;
    await tick();
    expect(el.shadowRoot?.querySelector('circle')?.getAttribute('r')).toBe('25');
  });

  it('renders arrays of svg fragments', async () => {
    const tag = getUniqueTag();

    @element(tag)
    class TestElement extends HTMLElement {
      @property({ attribute: false }) points: number[] = [10, 20, 30];

      @render()
      renderContent() {
        return html`<svg>${this.points.map(x => svg`<rect x=${x}></rect>`)}</svg>`;
      }
    }

    const el = document.createElement(tag) as InstanceType<typeof TestElement>;
    container.appendChild(el);
    await el.ready;

    const rects = el.shadowRoot?.querySelectorAll('rect');
    expect(rects?.length).toBe(3);
    expect(rects?.[0].namespaceURI).toBe(SVG_NS);
    expect(Array.from(rects!).map(r => r.getAttribute('x'))).toEqual(['10', '20', '30']);
  });
});
