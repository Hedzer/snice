import { describe, expect, it, vi } from 'vitest';
import { element, html, property, render, watch } from './test-imports';

describe('@property pre-upgrade value adoption', () => {
  it.each([
    ['object', { source: 'binding' }],
    ['false', false],
    ['zero', 0],
    ['empty string', ''],
    ['undefined', undefined]
  ])('preserves a pre-existing own %s value and removes the shadowing property', async (_label, boundValue) => {
    class BoundBeforeFields extends HTMLElement {
      constructor() {
        super();
        Object.defineProperty(this, 'value', {
          value: boundValue,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
    }

    const tag = `test-pre-upgrade-${String(_label).replace(' ', '-')}`;
    @element(tag)
    class TestPreUpgradeValue extends BoundBeforeFields {
      @property({ attribute: false }) value: unknown = 'field-default';
    }

    const el = document.createElement(tag) as TestPreUpgradeValue;
    document.body.append(el);
    await el.ready;

    expect(el.value).toBe(boundValue);
    expect(Object.hasOwn(el, 'value')).toBe(false);
    el.remove();
  });

  it('routes the adopted value and later assignments through reactivity', async () => {
    const initial = { label: 'bound-before-fields' };
    const watcher = vi.fn();

    class BoundBeforeFields extends HTMLElement {
      constructor() {
        super();
        (this as any).value = initial;
      }
    }

    @element('test-pre-upgrade-reactivity')
    class TestPreUpgradeReactivity extends BoundBeforeFields {
      @property({ attribute: false }) value = { label: 'field-default' };

      @watch('value', { immediate: false })
      valueChanged(oldValue: unknown, newValue: unknown) {
        watcher(oldValue, newValue);
      }

      @render()
      template() {
        return html`<span>${this.value.label}</span>`;
      }
    }

    const el = document.createElement('test-pre-upgrade-reactivity') as TestPreUpgradeReactivity;
    document.body.append(el);
    await el.ready;
    expect(el.shadowRoot!.textContent).toContain('bound-before-fields');

    const updated = { label: 'updated-after-upgrade' };
    el.value = updated;
    await el.rendered;

    expect(watcher).toHaveBeenCalledWith(initial, updated);
    expect(el.shadowRoot!.textContent).toContain('updated-after-upgrade');
    expect(Object.hasOwn(el, 'value')).toBe(false);
    el.remove();
  });

  it('still gives an authored attribute precedence when the element connects', async () => {
    class BoundBeforeFields extends HTMLElement {
      constructor() {
        super();
        (this as any).value = 'property-before-upgrade';
        this.setAttribute('value', 'authored-attribute');
      }
    }

    @element('test-pre-upgrade-attribute-precedence')
    class TestPreUpgradeAttributePrecedence extends BoundBeforeFields {
      @property() value = 'field-default';
    }

    const el = document.createElement('test-pre-upgrade-attribute-precedence') as TestPreUpgradeAttributePrecedence;
    document.body.append(el);
    await el.ready;

    expect(el.value).toBe('authored-attribute');
    expect(Object.hasOwn(el, 'value')).toBe(false);
    el.remove();
  });

  it('wraps adopted deep values and observes their later mutations', async () => {
    const watcher = vi.fn();

    class BoundBeforeFields extends HTMLElement {
      constructor() {
        super();
        (this as any).model = { nested: { count: 1 } };
      }
    }

    @element('test-pre-upgrade-deep-value')
    class TestPreUpgradeDeepValue extends BoundBeforeFields {
      @property({ attribute: false, deep: true }) model = { nested: { count: 0 } };

      @watch('model', { immediate: false })
      modelChanged() {
        watcher();
      }
    }

    const el = document.createElement('test-pre-upgrade-deep-value') as TestPreUpgradeDeepValue;
    document.body.append(el);
    await el.ready;
    el.model.nested.count = 2;
    await Promise.resolve();

    expect(el.model.nested.count).toBe(2);
    expect(watcher).toHaveBeenCalledTimes(1);
    expect(Object.hasOwn(el, 'model')).toBe(false);
    el.remove();
  });
});
