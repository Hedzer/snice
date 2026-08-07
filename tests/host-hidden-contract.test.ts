import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = process.cwd();
const componentsDir = resolve(root, 'packages/components/src');

// A `:host { display: ... }` rule beats the UA `[hidden] { display: none }`
// rule, so any component that sets its own host display silently ignores the
// `hidden` attribute unless it also ships `:host([hidden]) { display: none }`.
// (SNICE-136)
const HOST_DISPLAY = /:host\s*\{[^}]*\bdisplay\s*:\s*(?!\s*none\b)[^;}]+/g;
const HOST_HIDDEN = /:host\(\[hidden\]\)\s*\{[^}]*\bdisplay\s*:\s*none/;

describe('host hidden contract', () => {
  it('every component that sets a :host display also ships :host([hidden]) { display: none }', () => {
    const offenders: string[] = [];

    const check = (label: string, css: string) => {
      HOST_DISPLAY.lastIndex = 0;
      if (!HOST_DISPLAY.test(css)) return;
      if (!HOST_HIDDEN.test(css)) offenders.push(label);
    };

    for (const dir of readdirSync(componentsDir, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      for (const file of readdirSync(join(componentsDir, dir.name))) {
        const path = join(componentsDir, dir.name, file);
        if (file.endsWith('.css')) {
          check(`${dir.name}/${file}`, readFileSync(path, 'utf8'));
        } else if (file.endsWith('.ts') && !file.endsWith('.types.ts') && !file.endsWith('.stories.ts')) {
          // Inline @styles() templates
          const source = readFileSync(path, 'utf8');
          if (source.includes(':host')) check(`${dir.name}/${file} (inline styles)`, source);
        }
      }
    }

    expect([...new Set(offenders)].sort()).toEqual([]);
  });
});
