import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SniceElement,
  css,
  element,
  html,
  property,
  render,
  state,
  watch
} from './test-imports';

describe('reactive authoring DX', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => container.remove());

  it('@state is reactive but never participates in attributes', async () => {
    @element('test-state-field')
    class TestStateField extends HTMLElement {
      @state() count = 0;

      @render()
      template() {
        return html`<p>${this.count}</p>`;
      }
    }

    const el = document.createElement('test-state-field') as TestStateField;
    container.appendChild(el);
    await el.ready;
    el.count = 2;
    await el.rendered;
    expect(el.shadowRoot?.textContent).toContain('2');
    expect(el.hasAttribute('count')).toBe(false);

    el.setAttribute('count', '9');
    expect(el.count).toBe(2);
  });

  it('deep state observes nested objects, arrays, deletion, Map, and Set', async () => {
    @element('test-deep-state')
    class TestDeepState extends HTMLElement {
      @state({ deep: true }) model = {
        user: { name: 'Ada' },
        items: ['one'],
        flags: new Map<string, boolean>(),
        selected: new Set<string>()
      };

      @render()
      template() {
        return html`
          <p>${this.model.user.name}|${this.model.items.join(',')}|${this.model.flags.size}|${this.model.selected.size}</p>
        `;
      }
    }

    const el = document.createElement('test-deep-state') as TestDeepState;
    container.appendChild(el);
    await el.ready;

    el.model.user.name = 'Grace';
    el.model.items.push('two');
    el.model.flags.set('ready', true);
    el.model.selected.add('one');
    await el.rendered;
    expect(el.shadowRoot?.textContent).toContain('Grace|one,two|1|1');

    delete (el.model.user as { name?: string }).name;
    el.model.flags.delete('ready');
    el.model.selected.clear();
    await el.rendered;
    expect(el.shadowRoot?.textContent).toContain('|one,two|0|0');
  });

  it('deep state invalidation remains isolated per instance', async () => {
    @element('test-deep-state-isolation')
    class TestDeepStateIsolation extends HTMLElement {
      renders = 0;
      @state({ deep: true }) values = [1];

      @render()
      template() {
        this.renders++;
        return html`<p>${this.values.join(',')}</p>`;
      }
    }

    const first = document.createElement('test-deep-state-isolation') as TestDeepStateIsolation;
    const second = document.createElement('test-deep-state-isolation') as TestDeepStateIsolation;
    container.append(first, second);
    await Promise.all([first.ready, second.ready]);
    const secondRenders = second.renders;

    first.values.push(2);
    await first.rendered;
    expect(first.shadowRoot?.textContent).toContain('1,2');
    expect(second.shadowRoot?.textContent).toContain('1');
    expect(second.renders).toBe(secondRenders);
  });

  it('reflect:false keeps attribute input while preserving JS source identity', async () => {
    @element('test-input-only-property')
    class TestInputOnlyProperty extends HTMLElement {
      @property({ type: Number, reflect: false }) amount = 1;
    }

    const el = document.createElement('test-input-only-property') as TestInputOnlyProperty;
    el.setAttribute('amount', '4');
    container.appendChild(el);
    await el.ready;
    expect(el.amount).toBe(4);

    el.amount = 7;
    expect(el.amount).toBe(7);
    expect(el.getAttribute('amount')).toBe('4');

    el.setAttribute('amount', '8');
    expect(el.amount).toBe(8);
  });

  it('uses both converter directions and does not deserialize reflected objects', async () => {
    const fromAttribute = vi.fn((value: string | null) => ({ source: value }));
    const toAttribute = vi.fn((value: { source: string | null }) => value.source);

    @element('test-property-converter-directions')
    class TestPropertyConverterDirections extends HTMLElement {
      @property({ type: Object, converter: { fromAttribute, toAttribute } })
      value = { source: 'default' };
    }

    const el = document.createElement('test-property-converter-directions') as TestPropertyConverterDirections;
    el.setAttribute('value', 'markup');
    container.appendChild(el);
    await el.ready;
    expect(el.value).toEqual({ source: 'markup' });
    expect(fromAttribute).toHaveBeenCalledWith('markup', Object);

    const assigned = { source: 'property' };
    el.value = assigned;
    expect(el.value).toBe(assigned);
    expect(el.getAttribute('value')).toBe('property');
    expect(toAttribute).toHaveBeenCalledWith(assigned, Object);
  });

  it('SniceElement uses kebab attributes and render/static-style conventions', async () => {
    @element('test-snice-element-base')
    class TestSniceElementBase extends SniceElement {
      static styles = css`:host { display: block; }`;

      @property() showDropdown = false;

      render() {
        return html`<p>${this.showDropdown}</p>`;
      }
    }

    const el = document.createElement('test-snice-element-base') as TestSniceElementBase;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot?.querySelector('style')?.textContent).toContain('display: block');

    el.showDropdown = true;
    await el.rendered;
    expect(el.getAttribute('show-dropdown')).toBe('true');
    expect(el.hasAttribute('showdropdown')).toBe(false);
    expect(el.shadowRoot?.textContent).toContain('true');
  });

  it('keeps legacy implicit attribute names on HTMLElement subclasses', async () => {
    @element('test-legacy-property-name')
    class TestLegacyPropertyName extends HTMLElement {
      @property() showDropdown = false;
    }

    const el = document.createElement('test-legacy-property-name') as TestLegacyPropertyName;
    container.appendChild(el);
    await el.ready;
    el.showDropdown = true;
    expect(el.getAttribute('showdropdown')).toBe('true');
    expect(el.hasAttribute('show-dropdown')).toBe(false);
  });

  it('does not treat an imperative HTMLElement render helper as a render convention', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @element('test-imperative-render-helper')
    class TestImperativeRenderHelper extends HTMLElement {
      calls = 0;

      connectedCallback() {
        this.render();
      }

      render() {
        this.calls++;
      }
    }

    const el = document.createElement('test-imperative-render-helper') as TestImperativeRenderHelper;
    container.appendChild(el);
    await el.ready;

    expect(el.calls).toBe(1);
    expect(el.shadowRoot).toBeNull();
    expect(warning).not.toHaveBeenCalled();
    warning.mockRestore();
  });

  it('invalidate and renderNow provide typed convention-driven updates', async () => {
    @element('test-invalidate-base')
    class TestInvalidateBase extends SniceElement {
      value = 1;

      render() {
        return html`<p>${this.value}</p>`;
      }
    }

    const el = document.createElement('test-invalidate-base') as TestInvalidateBase;
    container.appendChild(el);
    await el.ready;

    el.value = 2;
    await el.invalidate();
    expect(el.shadowRoot?.textContent).toContain('2');

    el.value = 3;
    await el.renderNow();
    expect(el.shadowRoot?.textContent).toContain('3');
  });

  it('deep mutations notify watchers and batch rendering', async () => {
    const watched = vi.fn();

    @element('test-deep-state-watch')
    class TestDeepStateWatch extends HTMLElement {
      renders = 0;
      @state({ deep: true }) items: number[] = [];

      @watch('items')
      changed(oldValue: number[], newValue: number[]) {
        watched(oldValue, newValue);
      }

      @render()
      template() {
        this.renders++;
        return html`<p>${this.items.length}</p>`;
      }
    }

    const el = document.createElement('test-deep-state-watch') as TestDeepStateWatch;
    container.appendChild(el);
    await el.ready;
    const renders = el.renders;
    el.items.push(1);
    el.items.push(2);
    await el.rendered;
    expect(el.renders).toBe(renders + 1);
    expect(watched).toHaveBeenCalled();
    const [oldValue, newValue] = watched.mock.calls.at(-1)!;
    expect(oldValue).toBe(newValue);
  });

  it('caches identical css template results across calls', () => {
    const makeStyles = () => css`:host { color: red; }`;
    expect(makeStyles()).toBe(makeStyles());
  });
});
