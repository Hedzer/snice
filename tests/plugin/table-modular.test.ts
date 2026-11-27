// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build as viteBuild } from 'vite';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import sniceVite from '../../packages/plugin/src/vite';
import sniceRollup from '../../packages/plugin/src/rollup';
import { analyzeTableUsage } from '../../packages/plugin/src/table-strip';
import { analyzeProject } from '../../bin/project-analyzer.js';

const ROOT = process.cwd();
const tempDirs: string[] = [];

function makeTempProject(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'snice-bs11-'));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['tslib', 'pica-route']) {
    const p = join(ROOT, 'node_modules', pkg);
    if (existsSync(p)) symlinkSync(p, join(dir, 'node_modules', pkg), 'junction');
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'bs11-fixture', type: 'module' }));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(resolve(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

function readDistJs(dir: string): { code: string; rawBytes: number } {
  const assetsDir = join(dir, 'dist/assets');
  const files = readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
  let code = '';
  let rawBytes = 0;
  for (const f of files) {
    const buf = readFileSync(join(assetsDir, f));
    rawBytes += buf.length;
    code += buf.toString('utf8') + '\n';
  }
  return { code, rawBytes };
}

describe('BS-11: Modular snice-table tree-shaking & plugin-guided stripping', () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  it('AC-2: snice-table-core + snice-cell-number omits 19 unused cells, 11 optional features, and unused siblings with >= 40% raw reduction vs full snice-table', async () => {
    const dirFull = makeTempProject({
      'index.html': '<script type="module" src="/src/main.ts"></script>',
      'src/main.ts': `import 'snice/components/table/snice-table';`,
    });
    const dirCore = makeTempProject({
      'index.html': '<script type="module" src="/src/main.ts"></script>',
      'src/main.ts': `
        import 'snice/components/table/snice-cell-number';
        import 'snice/components/table/snice-table-core';
      `,
    });

    await Promise.all([
      viteBuild({ root: dirFull, logLevel: 'silent', plugins: [sniceVite({ caching: false })] }),
      viteBuild({ root: dirCore, logLevel: 'silent', plugins: [sniceVite({ caching: false })] }),
    ]);

    const full = readDistJs(dirFull);
    const core = readDistJs(dirCore);
    const reductionPct = ((full.rawBytes - core.rawBytes) / full.rawBytes) * 100;

    // Hard >=40% raw bundle reduction floor
    expect(reductionPct).toBeGreaterThanOrEqual(40);

    // Included core + number cell
    expect(core.code).toContain('snice-table');
    expect(core.code).toContain('snice-cell-text');
    expect(core.code).toContain('snice-cell-number');

    // Omitted 19 specialized cells absent
    for (const cell of [
      'snice-cell-date',
      'snice-cell-boolean',
      'snice-cell-rating',
      'snice-cell-progress',
      'snice-cell-duration',
      'snice-cell-filesize',
      'snice-cell-sparkline',
      'snice-cell-percentage',
      'snice-cell-tag',
      'snice-cell-status',
      'snice-cell-actions',
      'snice-cell-link',
      'snice-cell-email',
      'snice-cell-phone',
      'snice-cell-color',
      'snice-cell-location',
      'snice-cell-json',
      'snice-cell-currency',
      'snice-cell-image',
    ]) {
      // Custom element registration for omitted cells must not be present
      expect(core.code).not.toContain(`element("${cell}")`);
      expect(core.code).not.toContain(`element('${cell}')`);
    }

    // Omitted 11 optional feature classes & unused sibling components absent
    for (const marker of [
      'table-toolbar',
      'column-menu-popup',
      'snice-modal',
      'snice-empty-state',
      'snice-button',
      'snice-input',
      'snice-rating',
    ]) {
      expect(core.code).not.toContain(`element("${marker}")`);
      expect(core.code).not.toContain(`element('${marker}')`);
    }
    // Verify actual TableExport & TableGrouping implementation markers are absent!
    expect(core.code).not.toContain('text/csv;charset=utf-8');
    expect(core.code).not.toContain('group-toggle-chevron');
    expect(core.code).not.toContain('tree-toggle-btn');
  }, 45000);

  it('AC-3: plugin table option handles explicit cells/features, alias normalization, toolbar -> filter transitive deps, empty [] core-only, and Rollup parity', async () => {
    // (a) Explicit cells (with alias 'percent' -> 'percentage') + features ['filter', 'export']
    const dirA = makeTempProject({
      'index.html': '<script type="module" src="/src/main.ts"></script>',
      'src/main.ts': `import 'snice/components/table/snice-table';`,
    });
    // (b) cells omitted (keeps all 21 cells), features: ['toolbar'] (transitively pulls filter + input/select)
    const dirB = makeTempProject({
      'index.html': '<script type="module" src="/src/main.ts"></script>',
      'src/main.ts': `import 'snice/components/table/snice-table';`,
    });
    // (c) cells: [], features: [] (core only + 'text')
    const dirC = makeTempProject({
      'index.html': '<script type="module" src="/src/main.ts"></script>',
      'src/main.ts': `import 'snice/components/table/snice-table';`,
    });

    await Promise.all([
      viteBuild({
        root: dirA,
        logLevel: 'silent',
        plugins: [sniceVite({ caching: false, table: { cells: ['text', 'number', 'date', 'percent'], features: ['filter', 'export'] } })],
      }),
      viteBuild({
        root: dirB,
        logLevel: 'silent',
        plugins: [sniceVite({ caching: false, table: { features: ['toolbar'] } })],
      }),
      viteBuild({
        root: dirC,
        logLevel: 'silent',
        plugins: [sniceVite({ caching: false, table: { cells: [], features: [] } })],
      }),
    ]);

    const resA = readDistJs(dirA);
    expect(resA.code).toContain('snice-cell-number');
    expect(resA.code).toContain('snice-cell-date');
    expect(resA.code).toContain('snice-cell-percentage');
    expect(resA.code).toContain('text/csv;charset=utf-8'); // TableExport included
    expect(resA.code).not.toContain(`element("snice-cell-rating")`);
    expect(resA.code).not.toContain(`element("snice-cell-sparkline")`);

    const resB = readDistJs(dirB);
    // cells omitted -> keeps specialized cells like snice-cell-rating
    expect(resB.code).toContain('snice-cell-rating');
    // toolbar transitively pulls filter + input/select/button
    expect(resB.code).toContain('snice-input');
    expect(resB.code).toContain('snice-select');
    // export was NOT requested
    expect(resB.code).not.toContain('text/csv;charset=utf-8');

    const resC = readDistJs(dirC);
    expect(resC.code).not.toContain(`element("snice-cell-number")`);
    expect(resC.code).not.toContain(`element("snice-cell-date")`);
    expect(resC.code).not.toContain('text/csv;charset=utf-8');

    // Pure Rollup parity check
    const rollupEntry = join(dirC, 'src/main.ts');
    const bundle = await rollup({
      input: rollupEntry,
      plugins: [
        nodeResolve({ extensions: ['.ts', '.js'] }),
        sniceRollup({ caching: false, table: { cells: ['number'], features: ['export'] } }),
      ],
    });
    try {
      const { output } = await bundle.generate({ format: 'es' });
      const code = output[0].code;
      expect(code).toContain('snice-cell-number');
      expect(code).toContain('text/csv;charset=utf-8');
      expect(code).not.toContain("element('snice-cell-rating')");
    } finally {
      await bundle.close();
    }
  }, 45000);

  it('AC-4: fails fast in buildStart on unknown table.cells or table.features names', async () => {
    const dir = makeTempProject({
      'index.html': '<script type="module" src="/src/main.ts"></script>',
      'src/main.ts': `import 'snice/components/table/snice-table';`,
    });

    await expect(
      viteBuild({
        root: dir,
        logLevel: 'silent',
        css: { postcss: {} },
        plugins: [sniceVite({ table: { cells: ['nonexistent-cell'] } })],
      })
    ).rejects.toThrow(/unknown table\.cells entry "nonexistent-cell".*Valid cell types:/i);

    await expect(
      viteBuild({
        root: dir,
        logLevel: 'silent',
        css: { postcss: {} },
        plugins: [sniceVite({ table: { features: ['nonexistent-feat'] } })],
      })
    ).rejects.toThrow(/unknown table\.features entry "nonexistent-feat".*Valid feature names:/i);
  });

  it('AC-6: snice check (project-analyzer) accepts snice/components/table/snice-table-core as valid <snice-table> registration', () => {
    const diagnostics = analyzeProject({
      'package.json': JSON.stringify({ name: 'table-core-app', dependencies: { snice: '^7.11.0', react: '^19.0.0' } }),
      'src/main.tsx': `
        import 'snice/components/table/snice-table-core';
        import { Table } from 'snice/react';
        export function View() { return <Table />; }
      `,
    });
    const errors = diagnostics.filter((d: any) => d.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('table: "auto" conservatively strips static columns/features and bails out safely on dynamic definitions or spreads', async () => {
    // Unit checks for conservative bail-outs
    expect(
      analyzeTableUsage([
        { id: 'src/a.ts', code: `import 'snice/components/table/snice-table'; const t = document.querySelector('snice-table') as any; t.columns = getCols();` },
      ]).safe
    ).toBe(false);

    expect(
      analyzeTableUsage([
        { id: 'src/b.ts', code: `html\`<snice-table ...props=\${extra}><snice-column type="number"></snice-column></snice-table>\`;` },
      ]).safe
    ).toBe(false);

    expect(
      analyzeTableUsage([
        { id: 'src/c.ts', code: `html\`<snice-table><snice-column type=\${dynType}></snice-column></snice-table>\`;` },
      ]).safe
    ).toBe(false);

    expect(
      analyzeTableUsage([
        {
          id: 'src/d.ts',
          code: `
            const cols = [...baseCols, { key: 'a', type: 'text' }];
            html\`<snice-table .columns=\${cols}></snice-table>\`;
          `,
        },
      ]).safe
    ).toBe(false);

    // Static auto-detection unit check
    const staticRes = analyzeTableUsage([
      {
        id: 'src/page.ts',
        code: `
          const cols = [
            { key: 'name', label: 'Name' },
            { key: 'price', label: 'Price', type: 'currency' },
            { key: 'pct', label: 'Share', type: 'percent' },
          ];
          export const tpl = html\`<snice-table .columns=\${cols} virtualize exportable></snice-table>\`;
        `,
      },
    ]);
    expect(staticRes.safe).toBe(true);
    expect(staticRes.cells).toEqual(expect.arrayContaining(['text', 'currency', 'percentage']));
    expect(staticRes.cells).toHaveLength(3);
    expect(staticRes.features).toEqual(expect.arrayContaining(['virtualizer', 'export']));
    expect(staticRes.features).toHaveLength(2);

    // Full Vite builds comparing `table: 'auto'` (static) vs `table: 'auto'` (dynamic bail-out) vs `table: false`
    const dirAutoStatic = makeTempProject({
      'index.html': `
        <!doctype html>
        <html><body>
          <snice-table searchable>
            <snice-column type="text" key="name"></snice-column>
            <snice-column type="number" key="age"></snice-column>
          </snice-table>
          <script type="module" src="/src/main.ts"></script>
        </body></html>
      `,
      'src/main.ts': `import 'snice/components/table/snice-table';`,
    });

    const dirAutoDynamic = makeTempProject({
      'index.html': `<script type="module" src="/src/main.ts"></script>`,
      'src/main.ts': `
        import 'snice/components/table/snice-table';
        const el = document.querySelector('snice-table') as any;
        declare function fetchCols(): any[];
        if (el) el.columns = fetchCols();
      `,
    });

    const dirDisabled = makeTempProject({
      'index.html': `<snice-table><snice-column type="text"></snice-column></snice-table><script type="module" src="/src/main.ts"></script>`,
      'src/main.ts': `import 'snice/components/table/snice-table';`,
    });

    await Promise.all([
      viteBuild({ root: dirAutoStatic, logLevel: 'silent', plugins: [sniceVite({ caching: false, table: 'auto' })] }),
      viteBuild({ root: dirAutoDynamic, logLevel: 'silent', plugins: [sniceVite({ caching: false, table: 'auto' })] }),
      viteBuild({ root: dirDisabled, logLevel: 'silent', plugins: [sniceVite({ caching: false, table: false })] }),
    ]);

    const autoStatic = readDistJs(dirAutoStatic);
    const autoDynamic = readDistJs(dirAutoDynamic);
    const disabled = readDistJs(dirDisabled);

    // Static auto-strip includes number + filter, omits rating/sparkline/export/grouping, shrinks sharply
    expect(autoStatic.code).toContain('snice-cell-number');
    expect(autoStatic.code).not.toContain('element("snice-cell-rating")');
    expect(autoStatic.code).not.toContain('text/csv;charset=utf-8');
    expect(autoStatic.code).not.toContain('group-toggle-chevron');
    expect(autoStatic.rawBytes).toBeLessThan(disabled.rawBytes * 0.7);

    // Dynamic bail-out safely keeps full snice-table (including rating & export)
    expect(autoDynamic.code).toContain('snice-cell-rating');
    expect(autoDynamic.code).toContain('text/csv;charset=utf-8');

    // `table: false` keeps full snice-table
    expect(disabled.code).toContain('snice-cell-rating');
  }, 45000);
});
