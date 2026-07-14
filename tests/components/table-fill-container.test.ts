/**
 * Regression: snice-table must fill its container's width AND height.
 *
 * Bug: previously :host had no height rule and .snice-table was only
 * `width:100%; overflow:auto`, so when a consumer sized the host
 * (`<snice-table style="height: 600px">`) the inner shadow root collapsed
 * to content height and left the bottom of the host empty.
 *
 * Fix: :host { width:100%; height:100%; min-height:200px }
 *      .snice-table { display:flex; flex-direction:column; height:100%; min-height:0 }
 *      .table-frame { flex:1; min-height:0; overflow:auto }
 *
 * Note: snice-table's runtime styles live INLINE in snice-table.ts inside
 * the @styles() css`...` block — NOT in the sibling .css file (which is
 * orphaned and not loaded at runtime). Tests scan the .ts source.
 *
 * happy-dom doesn't compute layout, so this is a static rule regression.
 * A live size check belongs in tests/live/table-fill-container.spec.ts.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TS_PATH = resolve(__dirname, '../../packages/components/src/table/snice-table.ts');
const SRC = readFileSync(TS_PATH, 'utf8');

/** Extract the body of the @styles() css`...` template literal. */
function getStylesTemplate(src: string): string {
  const start = src.indexOf('css/*css*/`');
  if (start < 0) throw new Error('css template literal not found');
  const open = src.indexOf('`', start);
  const close = src.indexOf('`', open + 1);
  if (close < 0) throw new Error('unterminated css template');
  return src.slice(open + 1, close);
}

const STYLES = getStylesTemplate(SRC);

/**
 * Match a rule body where the selector starts at line beginning (after
 * indentation) so substrings like `:host(.table-fullscreen) .snice-table`
 * don't shadow the standalone `.snice-table` rule.
 */
function ruleBlock(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm');
  const m = css.match(re);
  if (!m) throw new Error(`selector ${selector} not found at rule start`);
  return m[1];
}

describe('snice-table fills its container', () => {
  it(':host fills width and height of its parent box', () => {
    const body = ruleBlock(STYLES, ':host');
    expect(body).toMatch(/width:\s*100%/);
    expect(body).toMatch(/height:\s*100%/);
    expect(body).toMatch(/display:\s*block/);
    expect(body).toMatch(/min-height:\s*200px/);
  });

  it('.snice-table is a flex column that fills the host height', () => {
    const body = ruleBlock(STYLES, '.snice-table');
    expect(body).toMatch(/display:\s*flex/);
    expect(body).toMatch(/flex-direction:\s*column/);
    expect(body).toMatch(/width:\s*100%/);
    expect(body).toMatch(/height:\s*100%/);
    // min-height: 0 prevents flex children from refusing to shrink.
    expect(body).toMatch(/min-height:\s*0/);
  });

  it('.table-frame uses flex:1 + min-height:0 to absorb the remaining space', () => {
    const body = ruleBlock(STYLES, '.table-frame');
    expect(body).toMatch(/flex:\s*1/);
    expect(body).toMatch(/min-height:\s*0/);
    expect(body).toMatch(/overflow:\s*auto/);
  });
});
