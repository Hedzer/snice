import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { element, html, property, render, repeat, resource, use } from './test-imports';

describe('control flow and dynamic component exhaustive behavior', () => {
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

  it('flushes async directive results used by if and else-if conditions', async () => {
    let resolvePrimary!: (value: boolean) => void;
    let resolveAlternative!: (value: boolean) => void;
    const primary = new Promise<boolean>(resolve => { resolvePrimary = resolve; });
    const alternative = new Promise<boolean>(resolve => { resolveAlternative = resolve; });

    @element('test-async-conditional-directives')
    class TestAsyncConditionalDirectives extends HTMLElement {
      @render() template() {
        return html`<if ${resource(primary, { pending: false })}>
          <p>primary</p>
          <else-if ${resource(alternative, { pending: false })}><p>alternative</p></else-if>
          <else><p>fallback</p></else>
        </if>`;
      }
    }

    const host = document.createElement('test-async-conditional-directives') as TestAsyncConditionalDirectives;
    container.append(host);
    await host.ready;
    expect(host.shadowRoot!.textContent).toContain('fallback');
    resolveAlternative(true);
    await Promise.resolve();
    expect(host.shadowRoot!.textContent).toContain('alternative');
    resolvePrimary(true);
    await Promise.resolve();
    expect(host.shadowRoot!.textContent).toContain('primary');
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

  it('creates dynamic SVG children in the surrounding namespace and retargets them', async () => {
    @element('test-dynamic-svg-namespace')
    class TestDynamicSvgNamespace extends HTMLElement {
      @property({ attribute: false }) tag = 'circle';
      @render() template() {
        return html`<svg><component ${this.tag} ...attrs=${{ cx: 5, cy: 6, r: 2 }}></component></svg>`;
      }
    }
    const host = document.createElement('test-dynamic-svg-namespace') as TestDynamicSvgNamespace;
    container.append(host);
    await host.ready;
    const circle = host.shadowRoot!.querySelector('circle')!;
    expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(circle.getAttribute('cx')).toBe('5');
    host.tag = 'rect';
    await host.rendered;
    const rect = host.shadowRoot!.querySelector('rect')!;
    expect(rect.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(rect.getAttribute('cy')).toBe('6');
  });

  it('retargets named spreads and use actions when a dynamic tag changes', async () => {
    const destroy = vi.fn();
    const action = vi.fn((target: Element) => {
      target.setAttribute('data-action', target.localName);
      return destroy;
    });
    const first = vi.fn();
    const second = vi.fn();
    @element('test-dynamic-spread-action')
    class TestDynamicSpreadAction extends HTMLElement {
      @property({ attribute: false }) tag = 'button';
      @property({ attribute: false }) alternate = false;
      @render() template() {
        return html`<component ${this.tag}
          ${use(action)}
          ...props=${{ custom: this.alternate ? 2 : 1 }}
          ...attrs=${this.alternate ? { title: 'second' } : { title: 'first', hidden: true }}
          ...events=${{ click: this.alternate ? second : first }}
        >body</component>`;
      }
    }
    const host = document.createElement('test-dynamic-spread-action') as TestDynamicSpreadAction;
    container.append(host);
    await host.ready;
    const button = host.shadowRoot!.querySelector('button') as HTMLElement & { custom: number };
    expect(button.custom).toBe(1);
    expect(button.hidden).toBe(true);
    button.click();
    expect(first).toHaveBeenCalledOnce();
    host.tag = 'a';
    host.alternate = true;
    await host.rendered;
    const anchor = host.shadowRoot!.querySelector('a') as HTMLElement & { custom: number };
    expect(destroy).toHaveBeenCalledOnce();
    expect(action).toHaveBeenLastCalledWith(anchor, undefined);
    expect(anchor.dataset.action).toBe('a');
    expect(anchor.custom).toBe(2);
    expect(anchor.hidden).toBe(false);
    anchor.click();
    expect(second).toHaveBeenCalledOnce();
  });
});
