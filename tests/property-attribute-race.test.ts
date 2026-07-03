import { describe, it, expect, vi } from 'vitest';
import { element, property, watch } from '../src/index';

function mount(tag: string, Ctor: CustomElementConstructor) {
  if (!customElements.get(tag)) customElements.define(tag, Ctor);
  const el = document.createElement(tag) as any;
  document.body.appendChild(el);
  return el;
}

// The property setter reflects to an attribute and brackets that reflection with
// the SETTING_FROM_PROPERTY guard so attributeChangedCallback ignores its own
// echo. The guard is cleared on a microtask, so an EXTERNAL attribute mutation
// that lands in the same tick is wrongly treated as the setter's echo and dropped.
describe('SETTING_FROM_PROPERTY guard does not swallow external attribute changes', () => {
  it('an external setAttribute in the same tick as a property set still fires watchers', () => {
    const spy = vi.fn();

    @element('sfp-race')
    class SfpRace extends HTMLElement {
      @property() foo = '';
      @watch('foo') onFoo(o: string, n: string) { spy(o, n); }
    }

    const el = mount('sfp-race', SfpRace);

    el.foo = 'a';                  // property set → reflects attribute, guard cleared via microtask
    spy.mockClear();

    el.setAttribute('foo', 'b');   // external attribute mutation, same tick
    expect(spy).toHaveBeenCalledWith('a', 'b');
  });

  it('the same external change one tick later fires watchers (control)', async () => {
    const spy = vi.fn();

    @element('sfp-race-ctl')
    class SfpRaceCtl extends HTMLElement {
      @property() foo = '';
      @watch('foo') onFoo(o: string, n: string) { spy(o, n); }
    }

    const el = mount('sfp-race-ctl', SfpRaceCtl);

    el.foo = 'a';
    await Promise.resolve();       // let the guard-clear microtask run
    spy.mockClear();

    el.setAttribute('foo', 'b');
    expect(spy).toHaveBeenCalledWith('a', 'b');
  });
});
