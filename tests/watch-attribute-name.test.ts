import { describe, it, expect, vi } from 'vitest';
import { element, property, watch } from '../packages/core/src/index';

// @watch should match both:
//   1. the JS property name (always)
//   2. the explicit `attribute:` name declared on @property
//
// If no explicit attribute is declared, only the JS name should match
// (we do not do a generic camelCase→kebab-case fallback).

describe('@watch matches declared attribute name', () => {
  it('matches when watch key is the explicit attribute name', async () => {
    const fired: string[] = [];

    @element('watch-attr-test-a')
    class A extends HTMLElement {
      @property({ type: Boolean, attribute: 'show-dropdown' })
      showDropdown = false;

      @watch('show-dropdown')
      onShowDropdown() { fired.push('attribute-name'); }
    }

    const el = document.createElement('watch-attr-test-a') as any;
    document.body.appendChild(el);
    await el.ready;

    el.showDropdown = true;
    expect(fired).toContain('attribute-name');
  });

  it('matches when watch key is the JS property name', async () => {
    const fired: string[] = [];

    @element('watch-attr-test-b')
    class B extends HTMLElement {
      @property({ type: Boolean, attribute: 'show-dropdown' })
      showDropdown = false;

      @watch('showDropdown')
      onShowDropdown() { fired.push('js-name'); }
    }

    const el = document.createElement('watch-attr-test-b') as any;
    document.body.appendChild(el);
    await el.ready;

    el.showDropdown = true;
    expect(fired).toContain('js-name');
  });

  it('matches both forms simultaneously', async () => {
    const fired: string[] = [];

    @element('watch-attr-test-c')
    class C extends HTMLElement {
      @property({ type: Boolean, attribute: 'show-dropdown' })
      showDropdown = false;

      @watch('showDropdown') a() { fired.push('a'); }
      @watch('show-dropdown') b() { fired.push('b'); }
    }

    const el = document.createElement('watch-attr-test-c') as any;
    document.body.appendChild(el);
    await el.ready;

    el.showDropdown = true;
    expect(fired).toContain('a');
    expect(fired).toContain('b');
  });

  it('does NOT match kebab-case form when no explicit attribute is declared', async () => {
    const fired: string[] = [];
    // this deliberately-dead watch also triggers the unknown-property warning
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      @element('watch-attr-test-d')
      class D extends HTMLElement {
        // no explicit `attribute:` — kebab form is not a declared name
        @property({ type: Boolean })
        showDropdown = false;

        @watch('show-dropdown')
        onShowDropdown() { fired.push('kebab'); }
      }

      const el = document.createElement('watch-attr-test-d') as any;
      document.body.appendChild(el);
      await el.ready;

      el.showDropdown = true;
      expect(fired).not.toContain('kebab');
      // the framework flags the dead watch
      expect(warnSpy.mock.calls.some(c => String(c[0]).includes("'show-dropdown'") && String(c[0]).includes('never fire'))).toBe(true);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('matches a custom-renamed attribute (not derived from property name)', async () => {
    const fired: string[] = [];

    @element('watch-attr-test-e')
    class E extends HTMLElement {
      @property({ attribute: 'foo' })
      showDropdown = '';

      @watch('foo')
      onFoo() { fired.push('foo'); }

      @watch('showDropdown')
      onJs() { fired.push('js'); }
    }

    const el = document.createElement('watch-attr-test-e') as any;
    document.body.appendChild(el);
    await el.ready;

    el.showDropdown = 'hello';
    expect(fired).toContain('foo');
    expect(fired).toContain('js');
  });
});
