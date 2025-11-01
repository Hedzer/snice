import { describe, it, expect } from 'vitest';
import { getSymbol } from '../src/global';
import {
  IS_CONTROLLER_CLASS,
  IS_CONTROLLER_INSTANCE,
  IS_ELEMENT_CLASS,
  CONTROLLER_KEY,
  CONTROLLER_NAME_KEY,
  CHANNEL_HANDLERS
} from '../src/symbols';
import { HTML_RESULT, CSS_RESULT, nothing } from '../src/template';
import { RENDER_TRACKER, TRACK_RENDERS } from '../src/render-tracker';

describe('Symbol sharing across instances', () => {
  it('should use the same symbols when getSymbol is called multiple times', () => {
    const sym1 = getSymbol('test-symbol');
    const sym2 = getSymbol('test-symbol');
    expect(sym1).toBe(sym2);
  });

  it('should use Symbol.for() for all framework symbols', () => {
    // All framework symbols should be retrievable via Symbol.for()
    expect(Symbol.for('snice:is-controller-class')).toBe(IS_CONTROLLER_CLASS);
    expect(Symbol.for('snice:is-controller-instance')).toBe(IS_CONTROLLER_INSTANCE);
    expect(Symbol.for('snice:is-element-class')).toBe(IS_ELEMENT_CLASS);
    expect(Symbol.for('snice:controller-key')).toBe(CONTROLLER_KEY);
    expect(Symbol.for('snice:controller-name')).toBe(CONTROLLER_NAME_KEY);
    expect(Symbol.for('snice:channel-handlers')).toBe(CHANNEL_HANDLERS);
  });

  it('should share the same globalThis.snice across imports', () => {
    // Import should see the same global registry
    const global1 = (globalThis as any).snice;
    expect(global1).toBeDefined();
    expect(global1.controllerRegistry).toBeInstanceOf(Map);
    expect(global1.symbols).toBeInstanceOf(Map);

    // Accessing globalThis.snice directly should get the same reference
    const global2 = (globalThis as any).snice;
    expect(global2).toBe(global1);
  });

  it('should share controller registry across instances', () => {
    const registry1 = (globalThis as any).snice?.controllerRegistry;
    expect(registry1).toBeInstanceOf(Map);

    // Simulate second import by accessing globalThis directly
    const registry2 = (globalThis as any).snice?.controllerRegistry;
    expect(registry2).toBe(registry1);
  });

  it('should maintain symbol consistency for template symbols', () => {
    expect(HTML_RESULT).toBe(Symbol.for('snice:html-result'));
    expect(CSS_RESULT).toBe(Symbol.for('snice:css-result'));
    expect(nothing).toBe(Symbol.for('snice:nothing'));
  });

  it('should maintain symbol consistency for render tracker symbols', () => {
    expect(RENDER_TRACKER).toBe(Symbol.for('snice:renderTracker'));
    expect(TRACK_RENDERS).toBe(Symbol.for('snice:trackRenders'));
  });
});
