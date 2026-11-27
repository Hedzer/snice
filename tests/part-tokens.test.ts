/**
 * Tests for the shared CSS shadow part extractor.
 *
 * tooling/shared/part-tokens.js feeds the `cssParts` list of
 * custom-elements.json. Part values are interpolated in templates, so the
 * extractor has to read `${...}` holes instead of scanning to the next quote —
 * a naive scrape emits `${isActive`, `?` and `${{` as part names.
 */

import { describe, expect, it } from 'vitest';
import { extractPartTokens } from '../tooling/shared/part-tokens.js';

const parts = (source: string): string[] => [...extractPartTokens(source)].sort();

const PART_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe('extractPartTokens', () => {
  it('reads static multi-token part values', () => {
    expect(parts('<div part="base content"></div>')).toEqual(['base', 'content']);
  });

  it('reads a conditional hole with the separator inside the branch', () => {
    expect(parts(`<li part="item\${active ? ' item-active' : ''}"></li>`))
      .toEqual(['item', 'item-active']);
  });

  it('reads a conditional hole with the separator outside the branch', () => {
    expect(parts(`<li part="item \${active ? 'item-active' : ''}"></li>`))
      .toEqual(['item', 'item-active']);
  });

  it('reads chained conditional holes', () => {
    expect(parts(`<li part="row\${sel ? ' row-selected' : ''}\${dis ? ' row-disabled' : ''}"></li>`))
      .toEqual(['row', 'row-disabled', 'row-selected']);
  });

  it('reads an unquoted interpolated part value', () => {
    expect(parts(`<div part=\${open ? 'panel panel-open' : 'panel'}></div>`))
      .toEqual(['panel', 'panel-open']);
  });

  it('reads object-map holes', () => {
    expect(parts(`<span part="status \${{added: 'status-added', removed: 'status-removed'}[kind]}"></span>`))
      .toEqual(['status', 'status-added', 'status-removed']);
  });

  it('resolves a hole one hop through a local binding', () => {
    const source = `
      const ownPart = own ? 'message-own' : 'message-other';
      return html\`<div part="message \${ownPart}"></div>\`;
    `;
    expect(parts(source)).toEqual(['message', 'message-other', 'message-own']);
  });

  it('reads imperative setAttribute part values', () => {
    expect(parts(`cell.setAttribute('part', 'cell cell-numeric');`))
      .toEqual(['cell', 'cell-numeric']);
  });

  it('reads the exported names of exportparts, both mapped and bare', () => {
    expect(parts('<snice-button exportparts="base: submit-button-base, label: submit-button-label"></snice-button>'))
      .toEqual(['submit-button-base', 'submit-button-label']);
    expect(parts('<snice-icon exportparts="base, icon"></snice-icon>'))
      .toEqual(['base', 'icon']);
  });

  it('never emits interpolation syntax, operators or comparison literals', () => {
    const source = `
      <div part="tab\${index === activeIndex ? ' tab-active' : ''}"
           part2="ignored"
           exportparts="base: tab-base">
      </div>
      <span part="\${{ up: 'trend-up', down: 'trend-down' }[direction]}"></span>
    `;
    const found = parts(source);
    for (const token of found) expect(token, token).toMatch(PART_NAME);
    expect(found).toEqual(['tab', 'tab-active', 'tab-base', 'trend-down', 'trend-up']);
  });

  it('ignores attributes that merely end in "part"', () => {
    expect(parts('<div data-part="nope" myexportpart="nope"></div>')).toEqual([]);
  });

  it('ignores CSS attribute selectors, which consume parts rather than expose them', () => {
    expect(parts('css`[part="header"] { display: block; } [part="body"] { display: block; }`')).toEqual([]);
    expect(parts(`@query('[part="key-input"]')`)).toEqual([]);
    // A selector alongside a real declaration still yields only the declared part.
    expect(parts('css`[part="ghost"] { color: red; }` html`<div part="real"></div>`')).toEqual(['real']);
  });

  it('ignores attribute selectors written with whitespace around the name', () => {
    expect(parts('css`[ part = "header" ] { display: block; }`')).toEqual([]);
    expect(parts(`@query('[ part="key-input" ]')`)).toEqual([]);
    expect(parts('css`[\n  part = "ghost"\n] { color: red; }` html`<div part="real"></div>`'))
      .toEqual(['real']);
  });

  it('ignores parts inside comments, which render nothing', () => {
    // A commented-out part cannot be documented — nothing renders it — but the
    // docs-alignment test would demand a doc entry all the same.
    expect(parts('// <div part="dead"></div>\n<div part="live"></div>')).toEqual(['live']);
    expect(parts('  // cell.setAttribute("part", "dead-cell");\n<div part="live"></div>'))
      .toEqual(['live']);
    expect(parts('/* <div part="dead"></div> */\n<div part="live"></div>')).toEqual(['live']);
    expect(parts(`
      /**
       * Was <span part="old-name"></span> before the rename.
       */
      html\`<span part="new-name"></span>\`
    `)).toEqual(['new-name']);
    expect(parts('/* <div part="dead"></div>\n   <div part="also-dead"></div> */\n<i part="live"></i>'))
      .toEqual(['live']);
  });

  it('leaves mid-line "//" and block markers inside real source alone', () => {
    // The repo-wide `html/*html*/` marker and URLs sit mid-line; stripping there
    // would eat the template that follows.
    expect(parts("const src = 'https://example.com'; return html/*html*/`<div part=\"base\"></div>`;"))
      .toEqual(['base']);
    expect(parts(`<a href="//cdn.example.com" part="link"></a>`)).toEqual(['link']);
    // An unterminated line-start `/*` is not a comment; it must not eat the rest.
    expect(parts('css`\n/* unclosed\n` html`<div part="base"></div>`')).toEqual(['base']);
  });
});
