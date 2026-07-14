import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { element, html, property, render, repeat, svg } from './test-imports';

describe('control flow exhaustive behavior', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => container.remove());

  it('accepts any iterable, supplies stable indexes, and evaluates an empty factory only when empty', async () => {
    const empty = vi.fn(() => html`<li class="empty">empty</li>`);
    const keyCalls: Array<[string, number]> = [];
    const renderCalls: Array<[string, number]> = [];
    @element('test-repeat-iterable-matrix')
    class TestRepeatIterableMatrix extends HTMLElement {
      @property({ attribute: false }) values: Set<string> | null = new Set(['a', 'b']);
      @render() template() {
        return html`<ul>${repeat(this.values, {
          key: (value, index) => { keyCalls.push([value, index]); return value; },
          render: (value, index) => { renderCalls.push([value, index]); return html`<li>${index}:${value}</li>`; },
          empty
        })}</ul>`;
      }
    }
    const host = document.createElement('test-repeat-iterable-matrix') as TestRepeatIterableMatrix;
    container.append(host);
    await host.ready;
    expect([...host.shadowRoot!.querySelectorAll('li')].map(item => item.textContent)).toEqual(['0:a', '1:b']);
    expect(keyCalls.slice(-2)).toEqual([['a', 0], ['b', 1]]);
    expect(renderCalls.slice(-2)).toEqual([['a', 0], ['b', 1]]);
    expect(empty).not.toHaveBeenCalled();
    host.values = null;
    await host.rendered;
    expect(host.shadowRoot!.querySelector('.empty')?.textContent).toBe('empty');
    expect(empty).toHaveBeenCalledOnce();
  });

  it('supports object, symbol, NaN, and zero keys while rejecting true duplicates', () => {
    const object = {};
    const symbol = Symbol('key');
    expect(repeat([object, symbol, NaN, 0, -0], {
      key: (value, index) => index === 4 ? 'negative-zero' : value,
      render: String
    }).keys).toHaveLength(5);
    expect(() => repeat([NaN, NaN], { key: value => value, render: String })).toThrow(/duplicate key NaN/);
    expect(() => repeat([0, -0], { key: value => value, render: String })).toThrow(/duplicate key 0/);
    expect(() => repeat([1], null as any)).toThrow(/requires \{ key, render \}/);
  });

  it('renders and reconciles repeat inside table, select, and SVG parsing contexts', async () => {
    type Item = { id: number; label: string };

    @element('test-repeat-native-contexts')
    class TestRepeatNativeContexts extends HTMLElement {
      @property({ attribute: false }) items: Item[] = [
        { id: 1, label: 'one' },
        { id: 2, label: 'two' }
      ];

      @render()
      template() {
        return html`
          <table><tbody>${repeat(this.items, {
            key: item => item.id,
            render: item => html`<tr data-id=${item.id}><td>${item.label}</td></tr>`,
            empty: () => html`<tr class="empty"><td>empty</td></tr>`
          })}</tbody></table>
          <select>${repeat(this.items, {
            key: item => item.id,
            render: item => html`<option value=${item.id}>${item.label}</option>`,
            empty: () => html`<option class="empty" disabled>empty</option>`
          })}</select>
          <svg viewBox="0 0 20 20">${repeat(this.items, {
            key: item => item.id,
            render: (item, index) => svg`<circle data-id=${item.id} cx=${index + 1} cy="5" r="1"></circle>`,
            empty: () => svg`<text class="empty">empty</text>`
          })}</svg>
        `;
      }
    }

    const host = document.createElement('test-repeat-native-contexts') as TestRepeatNativeContexts;
    container.append(host);
    await host.ready;
    const row = host.shadowRoot!.querySelector('tr[data-id="1"]')!;
    const option = host.shadowRoot!.querySelector('option[value="1"]')!;
    const circle = host.shadowRoot!.querySelector('circle[data-id="1"]')!;

    expect(row.parentElement?.tagName).toBe('TBODY');
    expect(option.parentElement?.tagName).toBe('SELECT');
    expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(circle.parentElement?.namespaceURI).toBe('http://www.w3.org/2000/svg');

    host.items = [
      { id: 2, label: 'two updated' },
      { id: 1, label: 'one updated' },
      { id: 3, label: 'three' }
    ];
    await host.rendered;
    expect(host.shadowRoot!.querySelector('tr[data-id="1"]')).toBe(row);
    expect(host.shadowRoot!.querySelector('option[value="1"]')).toBe(option);
    expect(host.shadowRoot!.querySelector('circle[data-id="1"]')).toBe(circle);
    expect([...host.shadowRoot!.querySelectorAll('tbody tr')].map(node => node.textContent))
      .toEqual(['two updated', 'one updated', 'three']);
    expect([...host.shadowRoot!.querySelectorAll('select option')].map(node => node.textContent))
      .toEqual(['two updated', 'one updated', 'three']);
    expect([...host.shadowRoot!.querySelectorAll('svg circle')].map(node => node.getAttribute('cx')))
      .toEqual(['1', '2', '3']);

    host.items = [];
    await host.rendered;
    expect(host.shadowRoot!.querySelector('tbody > .empty')?.textContent).toBe('empty');
    expect(host.shadowRoot!.querySelector('select > .empty')?.textContent).toBe('empty');
    expect(host.shadowRoot!.querySelector('svg > .empty')?.namespaceURI)
      .toBe('http://www.w3.org/2000/svg');
  });

  it('keeps the committed list intact when iteration, keying, or rendering throws', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    type Mode = 'ok' | 'iterate' | 'key' | 'render';

    @element('test-repeat-transactional-failures')
    class TestRepeatTransactionalFailures extends HTMLElement {
      @property({ attribute: false }) mode: Mode = 'ok';
      @property({ attribute: false }) revision = 0;

      get items(): Iterable<number> {
        if (this.mode !== 'iterate') return [1, 2];
        return {
          [Symbol.iterator]() {
            throw new Error('iteration failed');
          }
        };
      }

      @render()
      template() {
        return html`<ol>${repeat(this.items, {
          key: value => {
            if (this.mode === 'key' && value === 2) throw new Error('key failed');
            return value;
          },
          render: value => {
            if (this.mode === 'render' && value === 2) throw new Error('render failed');
            return html`<li data-id=${value}>${value}:${this.revision}</li>`;
          }
        })}</ol>`;
      }
    }

    const host = document.createElement('test-repeat-transactional-failures') as TestRepeatTransactionalFailures;
    container.append(host);
    await host.ready;
    const first = host.shadowRoot!.querySelector('li[data-id="1"]')!;
    const initial = host.shadowRoot!.textContent;

    for (const mode of ['iterate', 'key', 'render'] as const) {
      host.mode = mode;
      await host.rendered;
      expect(host.shadowRoot!.textContent).toBe(initial);
      expect(host.shadowRoot!.querySelector('li[data-id="1"]')).toBe(first);
    }

    host.mode = 'ok';
    host.revision = 1;
    await host.rendered;
    expect(host.shadowRoot!.textContent).toContain('1:1');
    expect(host.shadowRoot!.querySelector('li[data-id="1"]')).toBe(first);
    expect(errors.mock.calls.filter(call => String(call[0]).includes('Error rendering'))).toHaveLength(3);
    errors.mockRestore();
  });

  it('rejects misplaced and malformed if branches before mounting partial DOM', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    @element('test-else-if-after-else')
    class TestElseIfAfterElse extends HTMLElement {
      @render() template() { return html`<if ${false}><p>a</p><else><p>b</p></else><else-if ${true}><p>c</p></else-if></if>`; }
    }
    @element('test-duplicate-else')
    class TestDuplicateElse extends HTMLElement {
      @render() template() { return html`<if ${false}><else>b</else><else>c</else></if>`; }
    }
    @element('test-orphan-else-if')
    class TestOrphanElseIf extends HTMLElement {
      @render() template() { return html`<else-if ${true}>orphan</else-if>`; }
    }
    @element('test-orphan-else')
    class TestOrphanElse extends HTMLElement {
      @render() template() { return html`<div><else>orphan</else></div>`; }
    }
    @element('test-missing-if-expression')
    class TestMissingIfExpression extends HTMLElement {
      @render() template() { return html`<if><p>missing</p></if>`; }
    }
    @element('test-missing-else-if-expression')
    class TestMissingElseIfExpression extends HTMLElement {
      @render() template() { return html`<if ${false}><else-if>missing</else-if></if>`; }
    }
    for (const tag of [
      'test-else-if-after-else',
      'test-duplicate-else',
      'test-orphan-else-if',
      'test-orphan-else',
      'test-missing-if-expression',
      'test-missing-else-if-expression'
    ]) {
      const host = document.createElement(tag) as HTMLElement & { ready: Promise<void> };
      container.append(host);
      await host.ready;
      expect(host.shadowRoot!.childElementCount).toBe(0);
    }
    const messages = errors.mock.calls.map(call => String(call[1]));
    expect(messages.some(message => message.includes('<else> must be the final branch'))).toBe(true);
    expect(messages.some(message => message.includes('only one <else>'))).toBe(true);
    expect(messages.some(message => message.includes('direct child of <if>'))).toBe(true);
    expect(messages.some(message => message.includes('<if> requires a condition expression'))).toBe(true);
    expect(messages.some(message => message.includes('<else-if> requires a condition expression'))).toBe(true);
    errors.mockRestore();
  });

  it('rejects duplicate defaults and orphan dynamic when branches', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    @element('test-duplicate-case-default')
    class TestDuplicateCaseDefault extends HTMLElement {
      @render() template() { return html`<case ${'x'}><default>a</default><default>b</default></case>`; }
    }
    @element('test-orphan-dynamic-when')
    class TestOrphanDynamicWhen extends HTMLElement {
      @render() template() { return html`<when ${'x'}>orphan</when>`; }
    }
    @element('test-orphan-static-when')
    class TestOrphanStaticWhen extends HTMLElement {
      @render() template() { return html`<div><when value="x">orphan</when></div>`; }
    }
    @element('test-orphan-default')
    class TestOrphanDefault extends HTMLElement {
      @render() template() { return html`<default>orphan</default>`; }
    }
    @element('test-case-direct-content')
    class TestCaseDirectContent extends HTMLElement {
      @render() template() { return html`<case ${'x'}>orphan text<when value="x">valid</when></case>`; }
    }
    @element('test-case-direct-element')
    class TestCaseDirectElement extends HTMLElement {
      @render() template() { return html`<case ${'x'}><p>orphan</p><default>valid</default></case>`; }
    }
    for (const tag of [
      'test-duplicate-case-default',
      'test-orphan-dynamic-when',
      'test-orphan-static-when',
      'test-orphan-default',
      'test-case-direct-content',
      'test-case-direct-element'
    ]) {
      const host = document.createElement(tag) as HTMLElement & { ready: Promise<void> };
      container.append(host);
      await host.ready;
      expect(host.shadowRoot!.childElementCount).toBe(0);
    }
    const messages = errors.mock.calls.map(call => String(call[1]));
    expect(messages.some(message => message.includes('only one <default>'))).toBe(true);
    expect(messages.some(message => message.includes('direct child of <case>'))).toBe(true);
    expect(messages.some(message => message.includes('must be nested in a <when>'))).toBe(true);
    expect(messages.some(message => message.includes('only direct <when>'))).toBe(true);
    errors.mockRestore();
  });

});
