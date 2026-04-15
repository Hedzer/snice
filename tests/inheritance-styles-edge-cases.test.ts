/**
 * Edge case tests for inherited styles — separate stylesheets prevent
 * broken CSS in one sheet from corrupting the other.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent } from './components/test-utils';

let counter = 0;
function tag(base: string) { return `test-${base}-${++counter}-${Date.now()}`; }

describe('inherited styles edge cases', () => {
  let els: HTMLElement[] = [];
  function track(el: HTMLElement) { els.push(el); return el; }
  afterEach(() => { els.forEach(el => { try { removeComponent(el); } catch {} }); els = []; });

  function expectSeparateSheets(el: HTMLElement, count: number) {
    const sr = el.shadowRoot!;
    const sheets = sr.adoptedStyleSheets;
    if (sheets?.length > 0) {
      expect(sheets.length).toBe(count);
    } else {
      expect(sr.querySelectorAll('style').length).toBe(count);
    }
  }

  it('interpolated CSS string pattern', async () => {
    const { element, render, styles, html, css } = await import('snice');
    const pt = tag('e1p'), ct = tag('e1c');

    const parentContent = ':host { display: block; padding: 8px; } .item { color: red; }';
    const childContent = '.item { font-weight: bold; border: 1px solid blue; }';

    @element(pt) class P extends HTMLElement {
      @render() r() { return html`<div class="item">x</div>`; }
      @styles() s() { return css`${parentContent}`; }
    }
    @element(ct) class C extends P {
      @render() r() { return html`<div class="item">x</div>`; }
      @styles() s() { return css`${childContent}`; }
    }

    const c = track(await createComponent(ct));
    await c.ready;
    expectSeparateSheets(c, 2);
  });

  it('CSS with escape sequences and data URIs', async () => {
    const { element, render, styles, html, css } = await import('snice');
    const pt = tag('e2p'), ct = tag('e2c');

    const parentContent = ':host { display: block; } .icon::before { content: "\\2713"; }';
    const childContent = '.bg { background: url("data:image/svg+xml,%3Csvg%3E%3C/svg%3E"); }';

    @element(pt) class P extends HTMLElement {
      @render() r() { return html`<div>x</div>`; }
      @styles() s() { return css`${parentContent}`; }
    }
    @element(ct) class C extends P {
      @render() r() { return html`<div>x</div>`; }
      @styles() s() { return css`${childContent}`; }
    }

    const c = track(await createComponent(ct));
    await c.ready;
    expectSeparateSheets(c, 2);
  });

  it('CSS with single quotes and apostrophes', async () => {
    const { element, render, styles, html, css } = await import('snice');
    const pt = tag('e3p'), ct = tag('e3c');

    const parentContent = ":host { display: block; } .warn::before { content: \"don't ignore\"; }";
    const childContent = ".status::after { content: \"it's alive\"; }";

    @element(pt) class P extends HTMLElement {
      @render() r() { return html`<div>x</div>`; }
      @styles() s() { return css`${parentContent}`; }
    }
    @element(ct) class C extends P {
      @render() r() { return html`<div>x</div>`; }
      @styles() s() { return css`${childContent}`; }
    }

    const c = track(await createComponent(ct));
    await c.ready;
    expectSeparateSheets(c, 2);

    const sr = c.shadowRoot!;
    const tags = sr.querySelectorAll('style');
    if (tags.length === 2) {
      expect(tags[0].textContent).toContain("don't ignore");
      expect(tags[1].textContent).toContain("it's alive");
    }
  });

  it('unterminated parent comment does not bleed into child', async () => {
    const { element, render, styles, html, css } = await import('snice');
    const pt = tag('e4p'), ct = tag('e4c');

    // String concatenation avoids SWC parsing the CSS comment markers
    const parentContent = ':host { display: block; } ' + '/' + '* unterminated comment';
    const childContent = '.child { color: green; font-size: 16px; }';

    @element(pt) class P extends HTMLElement {
      @render() r() { return html`<div>x</div>`; }
      @styles() s() { return css`${parentContent}`; }
    }
    @element(ct) class C extends P {
      @render() r() { return html`<div class="child">x</div>`; }
      @styles() s() { return css`${childContent}`; }
    }

    const c = track(await createComponent(ct));
    await c.ready;
    expectSeparateSheets(c, 2);

    const tags = c.shadowRoot!.querySelectorAll('style');
    if (tags.length === 2) {
      expect(tags[1].textContent).toContain('color: green');
    }
  });

  it('unterminated child string does not corrupt parent', async () => {
    const { element, render, styles, html, css } = await import('snice');
    const pt = tag('e5p'), ct = tag('e5c');

    const parentContent = '.parent { color: red; display: flex; }';
    const childContent = '.child::after { content: "unclosed';

    @element(pt) class P extends HTMLElement {
      @render() r() { return html`<div class="parent">x</div>`; }
      @styles() s() { return css`${parentContent}`; }
    }
    @element(ct) class C extends P {
      @render() r() { return html`<div class="parent">x</div>`; }
      @styles() s() { return css`${childContent}`; }
    }

    const c = track(await createComponent(ct));
    await c.ready;
    expectSeparateSheets(c, 2);

    const tags = c.shadowRoot!.querySelectorAll('style');
    if (tags.length === 2) {
      expect(tags[0].textContent).toContain('color: red');
    }
  });

  it('unterminated parent brace does not eat child rules', async () => {
    const { element, render, styles, html, css } = await import('snice');
    const pt = tag('e6p'), ct = tag('e6c');

    const parentContent = '.broken { color: red; ';
    const childContent = '.intact { color: blue; font-weight: bold; }';

    @element(pt) class P extends HTMLElement {
      @render() r() { return html`<div>x</div>`; }
      @styles() s() { return css`${parentContent}`; }
    }
    @element(ct) class C extends P {
      @render() r() { return html`<div class="intact">x</div>`; }
      @styles() s() { return css`${childContent}`; }
    }

    const c = track(await createComponent(ct));
    await c.ready;
    expectSeparateSheets(c, 2);

    const tags = c.shadowRoot!.querySelectorAll('style');
    if (tags.length === 2) {
      expect(tags[1].textContent).toContain('color: blue');
      expect(tags[1].textContent).toContain('font-weight: bold');
    }
  });

  it('empty parent styles + child styles', async () => {
    const { element, render, styles, html, css } = await import('snice');
    const pt = tag('e7p'), ct = tag('e7c');

    @element(pt) class P extends HTMLElement {
      @render() r() { return html`<div>x</div>`; }
      @styles() s() { return css``; }
    }
    @element(ct) class C extends P {
      @render() r() { return html`<div>x</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }

    const c = track(await createComponent(ct));
    await c.ready;
    expect(c.shadowRoot).not.toBeNull();
  });

  it('tabs, newlines, mixed whitespace in CSS', async () => {
    const { element, render, styles, html, css } = await import('snice');
    const pt = tag('e8p'), ct = tag('e8c');

    const parentContent = ":host\t{\n\tdisplay:\tblock;\n}\n.x\t{color:red}";
    const childContent = ".y\n{\n  font-size:\n    14px;\n}";

    @element(pt) class P extends HTMLElement {
      @render() r() { return html`<div>x</div>`; }
      @styles() s() { return css`${parentContent}`; }
    }
    @element(ct) class C extends P {
      @render() r() { return html`<div>x</div>`; }
      @styles() s() { return css`${childContent}`; }
    }

    const c = track(await createComponent(ct));
    await c.ready;
    expectSeparateSheets(c, 2);
  });
});
