import { describe, it, expect } from 'vitest';
import { getSymbol, getSniceGlobal } from '../packages/core/src/global';
import {
  IS_CONTROLLER_CLASS,
  IS_CONTROLLER_INSTANCE,
  IS_ELEMENT_CLASS,
  CONTROLLER_KEY,
  CONTROLLER_NAME_KEY,
  CHANNEL_HANDLERS
} from '../packages/core/src/symbols';
import { HTML_RESULT, CSS_RESULT, nothing } from '../packages/core/src/template';
import { RENDER_TRACKER, TRACK_RENDERS } from '../packages/core/src/render-tracker';

describe('Symbol sharing across instances', () => {
  it('should not mutate globalThis.snice on bare symbol imports', () => {
    expect((globalThis as any).snice).toBeUndefined();
  });

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

  it('should lazily initialize and share the same globalThis.snice across calls', () => {
    const global1 = getSniceGlobal();
    expect(global1).toBeDefined();
    expect((globalThis as any).snice).toBe(global1);
    expect(global1.controllerRegistry).toBeInstanceOf(Map);
    expect(global1.pendingControllerAttachments).toBeInstanceOf(Map);
    expect(typeof global1.controllerIdCounter).toBe('number');
    // Note: `globalThis.snice.symbols` was a legacy cache Map used before
    // `getSymbol()` switched to `Symbol.for('snice:<name>')`. Symbol.for
    // already guarantees global uniqueness, so the cache was removed.

    // Accessing getSniceGlobal() or globalThis.snice directly gets the same reference
    const global2 = getSniceGlobal();
    expect(global2).toBe(global1);
    expect((globalThis as any).snice).toBe(global1);
  });

  it('should share controller registry across instances and upgrade partial globals', () => {
    const registry1 = getSniceGlobal().controllerRegistry;
    expect(registry1).toBeInstanceOf(Map);

    // Simulate second import by accessing globalThis directly
    const registry2 = (globalThis as any).snice?.controllerRegistry;
    expect(registry2).toBe(registry1);

    // Simulate a partial globalThis.snice created by an older build
    const prev = (globalThis as any).snice;
    try {
      const legacyRegistry = new Map();
      (globalThis as any).snice = { controllerRegistry: legacyRegistry };
      const upgraded = getSniceGlobal();
      expect(upgraded.controllerRegistry).toBe(legacyRegistry);
      expect(upgraded.pendingControllerAttachments).toBeInstanceOf(Map);
      expect(upgraded.controllerIdCounter).toBe(0);
    } finally {
      (globalThis as any).snice = prev;
    }
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
