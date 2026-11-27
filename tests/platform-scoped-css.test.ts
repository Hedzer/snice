// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  scopePlatformTokenCss,
  scopeComponentPlatformCss,
  compileScopedPlatformCss,
} from '../tooling/build/compile-scoped-platforms.mjs';

describe('pure-CSS runtime multi-platform scoping compiler (PS-03)', () => {
  it('rewrites Layer 1 token CSS strictly under [data-platform="<p>"] with zero bare :root selectors', () => {
    const tokenCss = `
      /* iOS 26+ tokens */
      :root {
        --snice-color-primary: hsl(211 100% 50%);
        --snice-border-radius-md: 12px;
        --snice-texture: url("data:image/svg+xml;utf8,<svg/>");
      }
      [data-theme="dark"] {
        --snice-color-primary: hsl(210 100% 52%);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme]),
        :root[data-theme="auto"] {
          --snice-color-primary: hsl(210 100% 52%);
        }
      }
      @supports not (backdrop-filter: blur(1px)) {
        :root {
          --snice-glass-bg: rgb(255 255 255 / 0.96);
        }
      }
      @media (prefers-reduced-transparency: reduce) {
        :root {
          --snice-glass-bg: rgb(255 255 255);
        }
      }
    `;

    const scoped = scopePlatformTokenCss(tokenCss, 'ios');
    // Zero bare `:root{` or `:root,` selectors
    expect(scoped).not.toMatch(/(?:^|[},;])\s*:root\s*[{,]/);
    // Scoped light tokens
    expect(scoped).toContain('[data-platform="ios"]{');
    // Scoped dark tokens (both on-element and ancestor)
    expect(scoped).toContain('[data-platform="ios"][data-theme="dark"]');
    expect(scoped).toContain('[data-theme="dark"] [data-platform="ios"]');
    // Preserves prefers-color-scheme: dark, @supports, prefers-reduced-transparency, data URLs
    expect(scoped).toContain('@media (prefers-color-scheme: dark)');
    expect(scoped).toContain('[data-platform="ios"]:not([data-theme])');
    expect(scoped).toContain('@supports not (backdrop-filter: blur(1px))');
    expect(scoped).toContain('@media (prefers-reduced-transparency: reduce)');
    expect(scoped).toContain('url("data:image/svg+xml;utf8,<svg/>")');
    // Zero :host-context()
    expect(scoped).not.toContain(':host-context');
  });

  it('translates Layer 2 :host and [part~="..."] rules 1:1 into cross-browser donut-scoped ::part() rules', () => {
    const compCss = `
      :host { --snice-switch-width: 51px; }
      :host([disabled]) { opacity: 0.45; }
      [part~="track"] { border-radius: 9999px; }
      [part~="track-checked"]:hover { filter: brightness(1.04); }
      :host([size="small"]) [part~="thumb"]::after { content: ""; }
      [part~="ripple"]::before, [part~="lens"]::after { opacity: 0.2; }
      @media (prefers-reduced-motion: reduce) {
        [part~="thumb"] { transition: none; }
      }
      @keyframes ios-lens-pop {
        from { transform: scale(1); }
        to { transform: scale(1.15); }
      }
    `;

    const scoped = scopeComponentPlatformCss(compCss, 'snice-switch', 'ios');
    expect(scoped).not.toContain(':host');
    expect(scoped).not.toContain(':host-context');
    expect(scoped).toContain('[data-platform="ios"] snice-switch:not([data-platform]):not([data-platform] [data-platform] *)');
    expect(scoped).toContain('snice-switch[data-platform="ios"][disabled]');
    expect(scoped).toContain('::part(track)');
    expect(scoped).toContain('::part(track-checked):hover');
    expect(scoped).toContain('[size="small"]:not([data-platform]):not([data-platform] [data-platform] *)::part(thumb)::after');
    expect(scoped).toContain('::part(ripple)::before');
    expect(scoped).toContain('::part(lens)::after');
    expect(scoped).toContain('@media (prefers-reduced-motion: reduce)');
    expect(scoped).toContain('@keyframes ios-lens-pop');

    // Compound multi-part selectors compile to single space-separated ::part(a b)
    const multiPartCss = `
      [part~="base-block"][part~="base-checked"] { border-color: blue; }
      :host([variant="block"]) [part~="radio-invalid"][part~="radio-checked"]:hover { border-color: red; }
    `;
    const scopedMulti = scopeComponentPlatformCss(multiPartCss, 'snice-radio', 'material');
    expect(scopedMulti).toContain('::part(base-block base-checked)');
    expect(scopedMulti).not.toContain('::part(base-block)[part~=');
    expect(scopedMulti).toContain('::part(radio-invalid radio-checked):hover');

    const minifiedMulti = compileScopedPlatformCss('material', '', [{ tagName: 'snice-radio', css: multiPartCss }], { minify: true });
    expect(minifiedMulti).toContain('::part(base-block base-checked)');
    expect(minifiedMulti).toContain('::part(radio-invalid radio-checked):hover');
  });

  it('produces deterministic, minified output with zero :root or :host-context leakage', () => {
    const tokenCss = `:root { --snice-border-radius-md: 12px; }`;
    const comps = [
      { tagName: 'snice-switch', css: `[part~="track"] { border-radius: 999px; }` },
      { tagName: 'snice-button', css: `[part~="base"] { border-radius: 12px; }` },
    ];

    const run1 = compileScopedPlatformCss('ios', tokenCss, comps, { minify: true });
    const run2 = compileScopedPlatformCss('ios', tokenCss, [...comps].reverse(), { minify: true });

    expect(run1).toBe(run2);
    expect(run1).not.toMatch(/(?:^|[},;])\s*:root\s*[{,]/);
    expect(run1).not.toContain(':host-context');
    expect(run1).toMatch(/\[data-platform=["']?ios["']?\]/);
    expect(run1).toContain('snice-button');
    expect(run1).toContain('snice-switch');
  });
});
