import { describe, it, expect, vi } from 'vitest';
import { element, property, watch } from '../src/index';

function mount(tag: string, Ctor: CustomElementConstructor) {
  if (!customElements.get(tag)) customElements.define(tag, Ctor);
  const el = document.createElement(tag) as any;
  document.body.appendChild(el);
  return el;
}

// Removing an attribute reverts the property to its field default (that is what
// the getter returns once the attribute is gone). The @watch newValue — and the
// value the property reads back as — must agree, and must match the value you get
// by setting the property back to its default. Otherwise a watcher that trusts
// newValue (or re-reads this.foo) sees divergent state.
describe('removeAttribute reverts property to its default consistently', () => {
  it('string prop: watcher newValue matches the property value after removal', () => {
    const spy = vi.fn();

    @element('rm-str')
    class RmStr extends HTMLElement {
      @property() foo = 'default';
      @watch('foo') onFoo(o: string, n: string) { spy(o, n); }
    }

    const el = mount('rm-str', RmStr);

    el.setAttribute('foo', 'a');
    spy.mockClear();

    el.removeAttribute('foo');
    // The property reverts to its default...
    expect(el.foo).toBe('default');
    // ...and the watcher's newValue must match that, not diverge to null.
    expect(spy).toHaveBeenCalledWith('a', 'default');
  });

  it('removeAttribute matches setting the property back to its default', () => {
    const viaRemove: any[] = [];
    const viaProp: any[] = [];

    @element('rm-parity-a')
    class RmParityA extends HTMLElement {
      @property() foo = 'default';
      @watch('foo') onFoo(o: string, n: string) { viaRemove.push(n); }
    }
    @element('rm-parity-b')
    class RmParityB extends HTMLElement {
      @property() foo = 'default';
      @watch('foo') onFoo(o: string, n: string) { viaProp.push(n); }
    }

    const a = mount('rm-parity-a', RmParityA);
    a.setAttribute('foo', 'a');
    a.removeAttribute('foo');

    const b = mount('rm-parity-b', RmParityB);
    b.foo = 'a';
    b.foo = 'default';

    // Both routes revert to the default; the watcher should see the same newValue.
    expect(viaRemove.at(-1)).toBe(viaProp.at(-1));
  });

  it('number prop: watcher newValue matches the property value after removal', () => {
    const spy = vi.fn();

    @element('rm-num')
    class RmNum extends HTMLElement {
      @property({ type: Number }) count = 3;
      @watch('count') onC(o: number, n: number) { spy(o, n); }
    }

    const el = mount('rm-num', RmNum);

    el.setAttribute('count', '9');
    spy.mockClear();

    el.removeAttribute('count');
    expect(el.count).toBe(3);
    expect(spy).toHaveBeenCalledWith(9, 3);
  });
});
