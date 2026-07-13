import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { frameworkExports } from './test-imports';

describe('removed declarative rendering APIs', () => {
  it('does not expose rejected rendering APIs from source or built entrypoints', () => {
    const removed = [
      'Directive',
      'directive',
      'bind',
      'createRef',
      'ref',
      'use',
      'props',
      'attrs',
      'events',
      'resource',
      'portal',
      'transition',
      'directiveServerResult',
      'hydrate',
      'hydrateElement',
      'HydrationError',
      'renderToString',
      'renderToStringAsync',
      'renderElementToString',
      'renderElementToStringAsync'
    ];

    for (const name of removed) {
      expect(frameworkExports, name).not.toHaveProperty(name);
    }
  });

  it('does not retain the removed implementation modules', () => {
    for (const file of [
      'src/server.ts',
      'src/hydrate.ts',
      'src/directive.ts',
      'src/directives.ts',
      'src/async-directives.ts',
      'src/transition-directive.ts'
    ]) {
      expect(existsSync(resolve(file)), file).toBe(false);
    }

    const parts = readFileSync(resolve('src/parts.ts'), 'utf8');
    expect(parts).not.toContain('DynamicComponentPart');
    expect(parts).not.toContain("'dynamic-component'");
    expect(parts).not.toContain('resolveDirective');
  });
});
