// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Doctor (bin/snice.js) runtime-import contract: the component-export check
 * ensures a deep runtime/side-effect import resolves to executable JavaScript.
 * An `import type` is erased by TypeScript and can never register a custom
 * element, so declaration-only modules must be clean for type imports while
 * the same specifier used at runtime stays an error.
 *
 * Each case builds a temporary project with a package-shaped Snice tree so no
 * global or repository installation is required.
 */

const CLI = resolve(__dirname, '..', 'bin', 'snice.js');
const RUNTIME_CODES = new Set(['component-export', 'component-import']);

let projectDir: string;

function write(relative: string, contents: string) {
  const target = join(projectDir, relative);
  mkdirSync(join(target, '..'), { recursive: true });
  writeFileSync(target, contents);
}

function runDoctor(source: string) {
  write('src/main.ts', source);
  let stdout = '';
  try {
    stdout = execFileSync(process.execPath, [CLI, 'doctor', projectDir, '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (error: any) {
    stdout = error.stdout ?? '';
  }
  const report = JSON.parse(stdout);
  return (report.findings as Array<{ severity: string; code: string; message: string }>)
    .filter(finding => RUNTIME_CODES.has(finding.code));
}

function runDoctorFindings() {
  let stdout = '';
  try {
    stdout = execFileSync(process.execPath, [CLI, 'doctor', projectDir, '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (error: any) {
    stdout = error.stdout ?? '';
  }
  return JSON.parse(stdout).findings as Array<{ severity: string; code: string; message: string }>;
}

beforeEach(() => {
  projectDir = mkdtempSync(join(tmpdir(), 'snice-doctor-'));
  write('package.json', JSON.stringify({
    name: 'doctor-fixture',
    version: '0.0.1',
    dependencies: { snice: '^6.0.0' }
  }));
  write('tsconfig.json', JSON.stringify({
    compilerOptions: { useDefineForClassFields: false }
  }));
  write('node_modules/snice/package.json', JSON.stringify({
    name: 'snice',
    version: '6.1.0'
  }));
  // Runtime module: ships executable JavaScript.
  write('node_modules/snice/dist/components/table/snice-table.js', 'export {};\n');
  // Declaration-only module: exposed through the package types condition and
  // intentionally has no corresponding .js file.
  write('node_modules/snice/dist/components/table/snice-table.types.d.ts', 'export interface ColumnDefinition { key: string }\n');
});

afterEach(() => {
  rmSync(projectDir, { recursive: true, force: true });
});

describe('snice doctor package manifests', () => {
  it('rejects JSONC syntax in package.json while accepting it in tsconfig files', () => {
    write('package.json', `{
      "name": "doctor-fixture",
      "version": "0.0.1",
      "dependencies": { "snice": "^6.0.0" }, // package.json is strict JSON
    }`);
    write('tsconfig.json', `{
      "compilerOptions": {
        "useDefineForClassFields": false,
      },
    }`);

    const findings = runDoctorFindings();
    expect(findings).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'package-json'
    }));
    expect(findings).not.toContainEqual(expect.objectContaining({ code: 'tsconfig' }));
    expect(findings).not.toContainEqual(expect.objectContaining({ code: 'class-fields' }));
  });

  it('rejects JSONC syntax in the installed Snice package manifest', () => {
    write('node_modules/snice/package.json', `{
      "name": "snice",
      "version": "6.1.0", // package manifests do not allow comments
    }`);

    expect(runDoctorFindings()).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'snice-install'
    }));
  });
});

describe('snice doctor tsconfig chain', () => {
  const configFindings = () =>
    runDoctorFindings().filter(finding =>
      ['class-fields', 'decorators', 'tsconfig'].includes(finding.code)
    );

  it('accepts useDefineForClassFields in a referenced composite config', () => {
    write('tsconfig.json', JSON.stringify({
      files: [],
      references: [{ path: './tsconfig.app.json' }]
    }));
    write('tsconfig.app.json', JSON.stringify({
      compilerOptions: { useDefineForClassFields: false }
    }));
    expect(configFindings()).toEqual([]);
  });

  it('accepts comments and trailing commas in a referenced composite config', () => {
    write('tsconfig.json', `{
      // Solution-style config; compiler options live in the reference.
      "files": [],
      "references": [
        { "path": "./tsconfig.app.json", },
      ],
    }`);
    write('tsconfig.app.json', `{
      // TC39 decorators use assignment semantics.
      "compilerOptions": {
        /* Required for decorated field initializers. */
        "useDefineForClassFields": false,
        "sourceRoot": "https://example.test//source/*literal*/,}",
      },
    }`);
    expect(configFindings()).toEqual([]);
  });

  it('accepts useDefineForClassFields through a relative extends chain', () => {
    write('tsconfig.json', `{
      "extends": "./tsconfig.base.json", // inherited compiler semantics
    }`);
    write('tsconfig.base.json', `{
      "compilerOptions": {
        "useDefineForClassFields": false,
      },
    }`);
    expect(configFindings()).toEqual([]);
  });

  it('still warns when no config in the chain sets useDefineForClassFields false', () => {
    write('tsconfig.json', JSON.stringify({
      references: [{ path: './tsconfig.app.json' }]
    }));
    write('tsconfig.app.json', JSON.stringify({ compilerOptions: {} }));
    expect(configFindings()).toEqual([
      expect.objectContaining({ severity: 'warning', code: 'class-fields' })
    ]);
  });

  it('rejects experimentalDecorators in a referenced config', () => {
    write('tsconfig.json', JSON.stringify({
      references: [{ path: './tsconfig.app.json' }]
    }));
    write('tsconfig.app.json', JSON.stringify({
      compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false }
    }));
    expect(configFindings()).toEqual([
      expect.objectContaining({ severity: 'error', code: 'decorators' })
    ]);
  });

  it('warns when tsconfig.json is missing', () => {
    rmSync(join(projectDir, 'tsconfig.json'), { force: true });
    expect(configFindings()).toEqual([
      expect.objectContaining({ severity: 'warning', code: 'tsconfig' })
    ]);
  });
});

describe('snice doctor decorator-transform probe', () => {
  const REPO = resolve(__dirname, '..');

  function linkDependency(name: string, scope = false) {
    const target = scope
      ? join(REPO, 'node_modules', '@swc', name)
      : join(REPO, 'node_modules', name);
    const link = scope
      ? join(projectDir, 'node_modules', '@swc', name)
      : join(projectDir, 'node_modules', name);
    mkdirSync(join(link, '..'), { recursive: true });
    symlinkSync(target, link);
  }

  const findings = () => runDoctorFindings().filter(finding => finding.code === 'decorator-transform');

  it('flags a default Vite/esbuild build that drops TC39 field decorators', () => {
    linkDependency('vite');
    linkDependency('esbuild');
    write('package.json', JSON.stringify({
      name: 'doctor-fixture',
      version: '0.0.1',
      dependencies: { snice: '^6.0.0' },
      devDependencies: { vite: '^5.0.0' }
    }));
    write('src/main.ts', [
      "import { element, query, html } from 'snice';",
      "@element('probe-app')",
      'class ProbeApp extends HTMLElement {',
      "  @query('.target') $target!: HTMLElement;",
      '  render() { return html`<div class="target"></div>`; }',
      '}'
    ].join('\n'));
    const results = findings();
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe('error');
    expect(results[0].message).toContain('unplugin-swc');
  }, 60000);

  it('passes a SWC-configured build that preserves field decorators', () => {
    linkDependency('vite');
    linkDependency('esbuild');
    linkDependency('unplugin-swc');
    linkDependency('core', true);
    linkDependency('core-linux-x64-gnu', true);
    linkDependency('counter', true);
    linkDependency('types', true);
    write('package.json', JSON.stringify({
      name: 'doctor-fixture',
      version: '0.0.1',
      dependencies: { snice: '^6.0.0' },
      devDependencies: { vite: '^5.0.0', 'unplugin-swc': '^1.5.1' }
    }));
    write('vite.config.ts', [
      "import { defineConfig } from 'vite';",
      "import swc from 'unplugin-swc';",
      'export default defineConfig({',
      '  plugins: [swc.vite({ jsc: {',
      "    parser: { syntax: 'typescript', decorators: true },",
      "    target: 'es2022',",
      "    transform: { decoratorMetadata: false, decoratorVersion: '2022-03', useDefineForClassFields: false }",
      '  } })]',
      '});'
    ].join('\n'));
    write('src/main.ts', [
      "import { element, query, html } from 'snice';",
      "@element('probe-app')",
      'class ProbeApp extends HTMLElement {',
      "  @query('.target') $target!: HTMLElement;",
      '  render() { return html`<div class="target"></div>`; }',
      '}'
    ].join('\n'));
    expect(findings()).toEqual([]);
  }, 60000);

  it('skips the probe when source uses no field decorators', () => {
    linkDependency('vite');
    linkDependency('esbuild');
    write('src/main.ts', 'export const value = 1;\n');
    expect(findings()).toEqual([]);
  });

  it('skips the probe when Vite is not installed', () => {
    write('src/main.ts', [
      "import { element, query } from 'snice';",
      "@element('probe-app')",
      'class ProbeApp extends HTMLElement {',
      "  @query('.target') $target!: HTMLElement;",
      '}'
    ].join('\n'));
    expect(findings()).toEqual([]);
  });
});

describe('snice doctor component import checks', () => {
  it('accepts a valid type-only deep import that ships only a .d.ts', () => {
    const findings = runDoctor(
      "import type { ColumnDefinition } from 'snice/components/table/snice-table.types';\n"
    );
    expect(findings).toEqual([]);
  });

  it('accepts a multiline import type', () => {
    const findings = runDoctor(
      "import type {\n  ColumnDefinition\n} from 'snice/components/table/snice-table.types';\n"
    );
    expect(findings).toEqual([]);
  });

  it('rejects the same declaration-only specifier used as a runtime side-effect import', () => {
    const findings = runDoctor(
      "import 'snice/components/table/snice-table.types';\n"
    );
    expect(findings).toEqual([
      expect.objectContaining({
        severity: 'error',
        code: 'component-export',
        message: 'snice/components/table/snice-table.types targets a missing package file'
      })
    ]);
  });

  it('treats a mixed type/value import as a runtime import', () => {
    const findings = runDoctor(
      "import { type ColumnDefinition, TableController } from 'snice/components/table/snice-table.types';\n"
    );
    expect(findings).toEqual([
      expect.objectContaining({ severity: 'error', code: 'component-export' })
    ]);
  });

  it('treats an inline type-only specifier list as erased', () => {
    const findings = runDoctor(
      "import { type ColumnDefinition } from 'snice/components/table/snice-table.types';\n"
    );
    expect(findings).toEqual([]);
  });

  it('accepts a valid runtime component side-effect import with shipped JavaScript', () => {
    const findings = runDoctor(
      "import 'snice/components/table/snice-table';\n"
    );
    expect(findings).toEqual([]);
  });

  it('rejects an incomplete runtime component import', () => {
    const findings = runDoctor(
      "import 'snice/components/table';\n"
    );
    expect(findings).toEqual([
      expect.objectContaining({
        severity: 'error',
        code: 'component-import',
        message: 'snice/components/table is incomplete; use the documented deep side-effect import'
      })
    ]);
  });

  it('rejects a dynamic runtime import of a declaration-only specifier', () => {
    const findings = runDoctor(
      "export async function load() {\n  return import('snice/components/table/snice-table.types');\n}\n"
    );
    expect(findings).toEqual([
      expect.objectContaining({
        severity: 'error',
        code: 'component-export',
        message: 'snice/components/table/snice-table.types targets a missing package file'
      })
    ]);
  });

  it('accepts a dynamic import of a shipped runtime module', () => {
    const findings = runDoctor(
      "export async function load() {\n  return import('snice/components/table/snice-table');\n}\n"
    );
    expect(findings).toEqual([]);
  });

  it('rejects a plain value import of a declaration-only module', () => {
    const findings = runDoctor(
      "import { ColumnDefinition } from 'snice/components/table/snice-table.types';\n"
    );
    expect(findings).toEqual([
      expect.objectContaining({ severity: 'error', code: 'component-export' })
    ]);
  });

  it('rejects an invented runtime component import', () => {
    const findings = runDoctor(
      "import 'snice/components/widget/snice-widget';\n"
    );
    expect(findings).toEqual([
      expect.objectContaining({
        severity: 'error',
        code: 'component-export',
        message: 'snice/components/widget/snice-widget targets a missing package file'
      })
    ]);
  });

  it('accepts the theme stylesheet import', () => {
    const findings = runDoctor(
      "import 'snice/components/theme/theme.css';\n"
    );
    expect(findings).toEqual([]);
  });

  it('treats the declaration-only custom-elements module like any other: clean for type imports, an error at runtime', () => {
    const typeOnly = runDoctor(
      "import type { SniceButton } from 'snice/components/custom-elements';\n"
    );
    expect(typeOnly).toEqual([]);

    const runtime = runDoctor(
      "import 'snice/components/custom-elements';\n"
    );
    expect(runtime).toEqual([
      expect.objectContaining({ severity: 'error', code: 'component-export' })
    ]);
  });

  it('ignores imports that only appear in comments', () => {
    const findings = runDoctor(
      "// import 'snice/components/table/snice-table.types';\n/* import 'snice/components/table'; */\n"
    );
    expect(findings).toEqual([]);
  });
});
