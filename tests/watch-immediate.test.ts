import { describe, it, expect, vi } from 'vitest';
import { element, property, watch } from '../src/index';

// Mount an element the way author markup does: the attribute (if any) is present
// at connect time, so connectedCallback initializes the property from it.
function mount(tag: string, Ctor: CustomElementConstructor, attrs: Record<string, string> = {}) {
  if (!customElements.get(tag)) customElements.define(tag, Ctor);
  const el = document.createElement(tag) as any;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  return el;
}

describe('@watch initial-value semantics', () => {
  describe('default: watchers fire once on init with (undefined, initialValue)', () => {
    it('markup value differs from the field default → fires (undefined, markupValue)', () => {
      const spy = vi.fn();
      @element('wi-a')
      class A extends HTMLElement {
        @property({ type: Number }) count = 0;
        @watch('count') onC(o: number, n: number) { spy(o, n); }
      }
      mount('wi-a', A, { count: '5' });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(undefined, 5);
    });

    it('markup value equals the field default → still fires (undefined, value)', () => {
      const spy = vi.fn();
      @element('wi-b')
      class B extends HTMLElement {
        @property({ type: Number }) count = 0;
        @watch('count') onC(o: number, n: number) { spy(o, n); }
      }
      mount('wi-b', B, { count: '0' });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(undefined, 0);
    });

    it('no attribute (pure default) → fires (undefined, fieldDefault)', () => {
      const spy = vi.fn();
      @element('wi-c')
      class C extends HTMLElement {
        @property({ type: Number }) count = 5;
        @watch('count') onC(o: number, n: number) { spy(o, n); }
      }
      mount('wi-c', C);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(undefined, 5);
    });

    it('explicit { immediate: true } behaves like the default', () => {
      const spy = vi.fn();
      @element('wi-d')
      class D extends HTMLElement {
        @property({ type: Number }) count = 0;
        @watch('count', { immediate: true }) onC(o: number, n: number) { spy(o, n); }
      }
      mount('wi-d', D, { count: '9' });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(undefined, 9);
    });

    it('Boolean property fires on init', () => {
      const spy = vi.fn();
      @element('wi-bool')
      class BoolEl extends HTMLElement {
        @property({ type: Boolean }) active = false;
        @watch('active') onA(o: boolean, n: boolean) { spy(o, n); }
      }
      mount('wi-bool', BoolEl, { active: '' });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(undefined, true);
    });

    it('init fire then runtime change: two calls, correct old/new each time', () => {
      const spy = vi.fn();
      @element('wi-e')
      class E extends HTMLElement {
        @property({ type: Number }) count = 0;
        @watch('count') onC(o: number, n: number) { spy(o, n); }
      }
      const el = mount('wi-e', E, { count: '5' });
      expect(spy).toHaveBeenNthCalledWith(1, undefined, 5);
      el.count = 7;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(2, 5, 7);
    });
  });

  describe('{ immediate: false }: change-only, no init fire', () => {
    it('markup value differs from default → no init fire', () => {
      const spy = vi.fn();
      @element('wi-f')
      class F extends HTMLElement {
        @property({ type: Number }) count = 0;
        @watch('count', { immediate: false }) onC(o: number, n: number) { spy(o, n); }
      }
      mount('wi-f', F, { count: '5' });
      expect(spy).not.toHaveBeenCalled();
    });

    it('no attribute → no init fire', () => {
      const spy = vi.fn();
      @element('wi-g')
      class G extends HTMLElement {
        @property({ type: Number }) count = 5;
        @watch('count', { immediate: false }) onC(o: number, n: number) { spy(o, n); }
      }
      mount('wi-g', G);
      expect(spy).not.toHaveBeenCalled();
    });

    it('a runtime change after init still fires with the value set during init', () => {
      const spy = vi.fn();
      @element('wi-h')
      class H extends HTMLElement {
        @property({ type: Number }) count = 0;
        @watch('count', { immediate: false }) onC(o: number, n: number) { spy(o, n); }
      }
      const el = mount('wi-h', H, { count: '5' });
      expect(spy).not.toHaveBeenCalled();
      el.count = 7;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenLastCalledWith(5, 7);
    });
  });

  describe('across watcher scopes', () => {
    it('multiple watched props → fires once per property on init', () => {
      const calls: Array<[any, any, any]> = [];
      @element('wi-multi')
      class M extends HTMLElement {
        @property() a = 'x';
        @property() b = 'y';
        @watch('a', 'b') onAB(o: any, n: any, p: string) { calls.push([o, n, p]); }
      }
      mount('wi-multi', M, { a: 'hello' });
      expect(calls).toHaveLength(2);
      expect(calls).toContainEqual([undefined, 'hello', 'a']);
      expect(calls).toContainEqual([undefined, 'y', 'b']);
    });

    it('multiple watched props with { immediate: false } → no init fire for either', () => {
      const calls: Array<[any, any, any]> = [];
      @element('wi-multi-off')
      class MOff extends HTMLElement {
        @property() a = 'x';
        @property() b = 'y';
        @watch('a', 'b', { immediate: false }) onAB(o: any, n: any, p: string) { calls.push([o, n, p]); }
      }
      mount('wi-multi-off', MOff, { a: 'hello' });
      expect(calls).toHaveLength(0);
    });

    it('wildcard → fires once per declared property on init', () => {
      const props = new Set<string>();
      @element('wi-wild')
      class W extends HTMLElement {
        @property() a = '1';
        @property() b = '2';
        @watch('*') onAny(o: any, n: any, p: string) { props.add(p); }
      }
      mount('wi-wild', W);
      expect(props).toEqual(new Set(['a', 'b']));
    });

    it('explicit kebab attribute name resolves to its property value', () => {
      const spy = vi.fn();
      @element('wi-kebab')
      class K extends HTMLElement {
        @property({ attribute: 'show-panel' }) showPanel = false;
        @watch('show-panel') onShow(o: boolean, n: boolean) { spy(o, n); }
      }
      mount('wi-kebab', K, { 'show-panel': '' });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(undefined, true);
    });
  });
});
