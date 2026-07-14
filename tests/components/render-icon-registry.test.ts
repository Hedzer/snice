import { describe, it, expect, afterEach } from 'vitest';
import { renderIcon } from '../../packages/components/src/utils';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/input/snice-input';

/**
 * Named icons resolve from the built-in SVG registry (components/icons)
 * BEFORE falling back to font ligatures. Without this, names like 'search'
 * render as literal text unless an external icon font happens to be loaded -
 * seen in the wild as "search" overlapping the table toolbar's placeholder.
 */
describe('renderIcon registry resolution', () => {
  const htmlOf = (result: any) => {
    return result.strings.join(' ') + JSON.stringify(result.values);
  };

  it("resolves registry names ('magnifying-glass') to built-in SVGs", () => {
    expect(htmlOf(renderIcon('magnifying-glass'))).toContain('<svg');
  });

  it("resolves the 'search' alias to the magnifying-glass SVG", () => {
    expect(htmlOf(renderIcon('search'))).toContain('<svg');
  });

  it('unknown ligature-style names still render as ligature text', () => {
    const out = htmlOf(renderIcon('some_unknown_glyph'));
    expect(out).not.toContain('<svg');
    expect(out).toContain('snice-icon-ligature');
  });

  it('emoji still renders as plain text span', () => {
    const out = htmlOf(renderIcon('\u{1F50D}'));
    expect(out).not.toContain('<svg');
  });
});

describe('snice-input prefix-icon uses the registry', () => {
  let el: any;

  afterEach(() => { if (el) removeComponent(el); el = null; });

  it("prefix-icon='search' renders an svg, not the literal word", async () => {
    el = await createComponent<any>('snice-input', { 'prefix-icon': 'search', placeholder: 'Search employees...' });
    await wait(30);
    const prefix = el.shadowRoot.querySelector('.icon-slot--prefix');
    expect(prefix?.querySelector('svg')).toBeTruthy();
    expect(prefix?.textContent?.trim()).not.toBe('search');
  });
});
