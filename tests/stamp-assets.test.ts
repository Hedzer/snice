import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { computeContentHash, stampHtml } from '../scripts/stamp-assets.js';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('asset stamping', () => {
  it('stamps real local assets in HTML and inline JavaScript strings', () => {
    const stamped = stampHtml(`
      <link rel="stylesheet" href="theme/theme.css">
      <script>const icon = 'images/snice-logo.png';</script>
    `);

    expect(stamped).toMatch(/href="theme\/theme\.css\?v=[a-f0-9]+"/);
    expect(stamped).toMatch(/'images\/snice-logo\.png\?v=[a-f0-9]+'/);
  });

  it('does not corrupt JavaScript identifiers that happen to contain an asset extension', () => {
    const source = `
      <script>
        card.style.cssText = 'display:block';
        const javascriptValue = table.style.cssText;
        object.bundle.jsProperty = true;
        const payload = await response.json();
        const jsonMethod = response.json;
        const sampleOutput = 'src/index.ts → dist/index.js';
      </script>
    `;

    const stamped = stampHtml(source);
    expect(stamped).toContain("card.style.cssText = 'display:block'");
    expect(stamped).toContain('table.style.cssText');
    expect(stamped).toContain('object.bundle.jsProperty');
    expect(stamped).toContain('response.json()');
    expect(stamped).toContain('response.json;');
    expect(stamped).toContain('src/index.ts → dist/index.js');
    expect(stamped).not.toMatch(/\.css\?v=.*Text/);
    expect(stamped).not.toMatch(/\.js\?v=.*Property/);
    expect(stamped).not.toMatch(/response\.json\?v=/);
    expect(stamped).not.toMatch(/dist\/index\.js\?v=/);
  });

  it('leaves copyable code-block bodies untouched while stamping their grammar', () => {
    const stamped = stampHtml(`
      <snice-code-block grammar="grammars/typescript.json">
        const logo = 'images/snice-logo.png';
        const payload = await response.json();
      </snice-code-block>
    `);

    expect(stamped).toMatch(/grammar="grammars\/typescript\.json\?v=[a-f0-9]+"/);
    expect(stamped).toContain("const logo = 'images/snice-logo.png';");
    expect(stamped).toContain('await response.json();');
    expect(stamped).not.toContain("images/snice-logo.png?v=");
  });

  it('changes the content hash when a nested theme or image asset changes', () => {
    const directory = mkdtempSync(join(tmpdir(), 'snice-stamps-'));
    temporaryDirectories.push(directory);
    const nested = join(directory, 'theme', 'presets');
    mkdirSync(nested, { recursive: true });
    const asset = join(nested, 'dark.css');
    writeFileSync(asset, ':root { color: black; }');
    const before = computeContentHash(directory);

    writeFileSync(asset, ':root { color: white; }');
    const after = computeContentHash(directory);

    expect(after).not.toBe(before);
  });
});
