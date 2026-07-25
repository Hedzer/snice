// Draft: tests/theme-token-contract.test.ts (paste-ready)
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = process.cwd();
const componentsDir = resolve(root, 'packages/components/src');

// Component-scoped public theming hooks are legal without a theme definition.
// A hook is --snice-<component>-… for a real component dir, plus these aliases
// whose prefixes don't match their dir name 1:1.
const HOOK_ALIASES = ['app-tile', 'size-drawer', 'terminal-ansi', 'video', 'drawer-backdrop', 'modal-backdrop'];

describe('theme token contract', () => {
  it('every non-hook --snice-* reference is defined in theme.css', () => {
    const theme = readFileSync(join(componentsDir, 'theme/theme.css'), 'utf8');
    const defined = new Set([...theme.matchAll(/(--snice-[a-z0-9-]+)\s*:/g)].map(m => m[1]));
    const comps = readdirSync(componentsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    const hookPrefixes = [...comps, ...HOOK_ALIASES].map(c => `--snice-${c}-`);

    const offenders: string[] = [];
    for (const comp of comps) {
      const dir = join(componentsDir, comp);
      for (const f of readdirSync(dir).filter(f => f.endsWith('.css'))) {
        const css = readFileSync(join(dir, f), 'utf8');
        for (const [, token] of css.matchAll(/var\(\s*(--snice-[a-z0-9-]+)/g)) {
          if (defined.has(token)) continue;
          if (hookPrefixes.some(p => token.startsWith(p) || token === p.slice(0, -1))) continue;
          offenders.push(`${comp}/${f}: ${token}`);
        }
      }
    }
    expect([...new Set(offenders)].sort()).toEqual([]);
  });
});
