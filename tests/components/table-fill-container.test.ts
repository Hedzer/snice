/**
 * Regression: snice-table must fill its container's width AND height.
 *
 * Bug: previously :host and .table-container only had `width: 100%` plus
 * `min-height: 200px`, so when a consumer sized the host explicitly
 * (`<snice-table style="height: 600px">`) the inner table-container
 * collapsed to its content height and left the bottom of the host empty.
 *
 * Fix: both `:host` and `.table-container` carry `height: 100%`.
 *
 * jsdom/happy-dom don't compute layout, so this is a static CSS-rule
 * regression test. A live size check belongs in a Playwright spec.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = resolve(__dirname, '../../components/table/snice-table.css');
const CSS = readFileSync(CSS_PATH, 'utf8');

function ruleBlock(css: string, selector: string): string {
  // Match a top-level rule with the given selector, capture its body.
  const re = new RegExp(`(^|\\})\\s*${selector.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*\\{([^}]*)\\}`, 'm');
  const m = css.match(re);
  if (!m) throw new Error(`selector ${selector} not found in ${CSS_PATH}`);
  return m[2];
}

describe('snice-table fills its container', () => {
  it(':host sets width and height to 100%', () => {
    const body = ruleBlock(CSS, ':host');
    expect(body).toMatch(/width:\s*100%/);
    expect(body).toMatch(/height:\s*100%/);
    expect(body).toMatch(/display:\s*block/);
  });

  it('.table-container sets width and height to 100%', () => {
    const body = ruleBlock(CSS, '\\.table-container');
    expect(body).toMatch(/width:\s*100%/);
    expect(body).toMatch(/height:\s*100%/);
  });

  it(':host and .table-container preserve existing min-* dimensions', () => {
    const host = ruleBlock(CSS, ':host');
    const container = ruleBlock(CSS, '\\.table-container');
    expect(host).toMatch(/min-width:\s*400px/);
    expect(host).toMatch(/min-height:\s*200px/);
    expect(container).toMatch(/min-width:\s*400px/);
    expect(container).toMatch(/min-height:\s*200px/);
  });

  it('.table-container uses flex column so .table-wrapper{flex:1} can grow', () => {
    const body = ruleBlock(CSS, '\\.table-container');
    expect(body).toMatch(/display:\s*flex/);
    expect(body).toMatch(/flex-direction:\s*column/);

    const wrapper = ruleBlock(CSS, '\\.table-wrapper');
    expect(wrapper).toMatch(/flex:\s*1/);
  });
});
