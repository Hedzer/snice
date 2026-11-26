import { describe, it, expect, afterEach, vi } from 'vitest';
import { existsSync, readdirSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import * as utils from '../../packages/components/src/utils';
import * as themeUtils from '../../packages/components/src/theme-utils';
import { SnicePdfViewer, resetPdfJsLoaderCache } from '../../packages/components/src/pdf-viewer/snice-pdf-viewer';

const ICON_FREE_COMPONENTS = [
  ['chart', 'snice-chart'],
  ['funnel', 'snice-funnel'],
  ['sankey', 'snice-sankey'],
  ['network-graph', 'snice-network-graph'],
  ['treemap', 'snice-treemap'],
  ['badge', 'snice-badge'],
  ['link', 'snice-link'],
] as const;

describe('BS-04: utils.ts icon split & snice-pdf-viewer lazy loader', () => {
  afterEach(() => {
    SnicePdfViewer._pdfLoader = undefined;
    resetPdfJsLoaderCache();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('AC-2: preserves all 7 exports and shared onThemeChange observer between utils.ts and theme-utils.ts', async () => {
    expect(typeof utils.renderIcon).toBe('function');
    expect(typeof utils.classifyIcon).toBe('function');
    expect(utils.strictStringAttributeConverter).toBe(themeUtils.strictStringAttributeConverter);
    expect(utils.FALLBACK_ACCENTS).toBe(themeUtils.FALLBACK_ACCENTS);
    expect(utils.getAccentPalette).toBe(themeUtils.getAccentPalette);
    expect(utils.pickContrastColor).toBe(themeUtils.pickContrastColor);
    expect(utils.onThemeChange).toBe(themeUtils.onThemeChange);

    // Verify behavior of helpers
    expect(utils.strictStringAttributeConverter.toAttribute('ok')).toBe('ok');
    expect(utils.strictStringAttributeConverter.toAttribute({ bad: true })).toBeNull();
    expect(utils.getAccentPalette()).toHaveLength(8);
    expect(utils.pickContrastColor('#ffffff')).toBe('var(--snice-color-text)');
    expect(utils.pickContrastColor('#000000')).toBe('var(--snice-color-text-inverse)');

    // Shared onThemeChange observer fires both subscribers
    const calls: string[] = [];
    const unsub1 = utils.onThemeChange(() => calls.push('utils'));
    const unsub2 = themeUtils.onThemeChange(() => calls.push('theme-utils'));
    try {
      document.documentElement.setAttribute('data-theme', 'dark');
      await new Promise(r => setTimeout(r, 15));
      expect(calls).toEqual(['utils', 'theme-utils']);
    } finally {
      unsub1();
      unsub2();
      document.documentElement.removeAttribute('data-theme');
    }
  });

  it('AC-1: the 7 icon-free dist/components modules do not import utils or icons/index and exclude ICONS when bundled', async () => {
    const distComponents = resolve(process.cwd(), 'dist/components');
    expect(existsSync(join(distComponents, 'theme-utils.js'))).toBe(true);

    for (const [dir, file] of ICON_FREE_COMPONENTS) {
      const builtPath = join(distComponents, dir, `${file}.js`);
      expect(existsSync(builtPath), `missing ${builtPath}`).toBe(true);
      const code = readFileSync(builtPath, 'utf8');
      expect(code, `${file}.js should not import ../utils`).not.toMatch(/from\s+['"]\.\.\/utils(?:\.js)?['"]/);
      expect(code, `${file}.js should not import icons`).not.toMatch(/icons\/index/);
    }

    // Verify bundling snice-chart with Rollup (even honoring component sideEffects) excludes ICONS
    const tmp = mkdtempSync(join(tmpdir(), 'snice-bs04-chart-'));
    try {
      const entry = join(tmp, 'entry.js');
      const chartDist = resolve(distComponents, 'chart/snice-chart.js');
      writeFileSync(entry, `import ${JSON.stringify(chartDist)};\n`);
      const bundle = await rollup({
        input: entry,
        external: ['snice', 'snice/symbols', 'snice/transitions', 'tslib'],
        plugins: [nodeResolve()],
      });
      try {
        const { output } = await bundle.generate({ format: 'es' });
        const modules = Object.keys(output[0].modules).map(m => m.replace(/\\/g, '/'));
        expect(modules.some(m => m.includes('/icons/'))).toBe(false);
        expect(modules.some(m => m.endsWith('/utils.js'))).toBe(false);
        expect(output[0].code).not.toContain('paper-airplane');
      } finally {
        await bundle.close();
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('AC-3: dist/components/pdf-viewer/snice-pdf-viewer.js preserves dynamic import("./pdf.min.mjs") with no duplicate chunks and code-splits cleanly', async () => {
    const distComponents = resolve(process.cwd(), 'dist/components');
    const pdfViewerDist = join(distComponents, 'pdf-viewer/snice-pdf-viewer.js');
    const pdfLibDist = join(distComponents, 'pdf-viewer/pdf.min.mjs');

    expect(existsSync(pdfViewerDist)).toBe(true);
    expect(existsSync(pdfLibDist)).toBe(true);

    const code = readFileSync(pdfViewerDist, 'utf8');
    // No top-level static import of pdf.min.mjs
    expect(code).not.toMatch(/^\s*import\s+[^('"]*['"]\.\/pdf\.min\.mjs['"]/m);
    // Preserves dynamic import('./pdf.min.mjs')
    expect(code).toMatch(/import\(\s*['"]\.\/pdf\.min\.mjs['"]\s*\)/);

    // Zero duplicate hashed pdf.min-*.js chunks in dist/components/
    const topEntries = readdirSync(distComponents);
    expect(topEntries.filter(f => f.startsWith('pdf.min'))).toEqual([]);
    const pdfEntries = readdirSync(join(distComponents, 'pdf-viewer'));
    expect(pdfEntries.filter(f => /^pdf\.min-.*\.js$/.test(f))).toEqual([]);

    // Bundling with Rollup code-splits pdf.min.mjs into a separate async chunk
    const tmp = mkdtempSync(join(tmpdir(), 'snice-bs04-pdf-'));
    try {
      const entry = join(tmp, 'entry.js');
      writeFileSync(entry, `import ${JSON.stringify(pdfViewerDist)};\n`);
      const bundle = await rollup({
        input: entry,
        external: ['snice', 'snice/symbols', 'snice/transitions', 'tslib'],
        plugins: [nodeResolve()],
      });
      try {
        const { output } = await bundle.generate({ format: 'es' });
        const chunks = output.filter(o => o.type === 'chunk');
        expect(chunks.length).toBeGreaterThanOrEqual(2);
        const entryChunk = chunks.find(c => c.isEntry)!;
        expect(entryChunk.dynamicImports.length).toBeGreaterThanOrEqual(1);
        expect(entryChunk.code.length).toBeLessThan(60_000);
      } finally {
        await bundle.close();
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('AC-4: snice-pdf-viewer defers loading on empty src, sets workerSrc, deduplicates concurrent calls, retries after rejection, and cleans up on race/dispose', async () => {
    const loaderCalls: number[] = [];
    let failFirst = true;
    const workerOpts = { workerSrc: '' };
    const destroyedDocs: string[] = [];

    const makeDoc = (id: string) => ({
      id,
      numPages: 3,
      destroy: vi.fn(() => { destroyedDocs.push(id); }),
      getPage: vi.fn(async () => ({
        getViewport: () => ({ width: 100, height: 100 }),
        render: () => ({ cancel: vi.fn(), promise: Promise.resolve() }),
      })),
    });

    // (a) Mounting with empty src does NOT invoke loader
    SnicePdfViewer._pdfLoader = vi.fn(async () => {
      loaderCalls.push(1);
      return { getDocument: vi.fn(), GlobalWorkerOptions: workerOpts };
    });

    const emptyEl = document.createElement('snice-pdf-viewer') as SnicePdfViewer;
    document.body.appendChild(emptyEl);
    await (emptyEl as any).ready;
    expect(loaderCalls).toHaveLength(0);
    emptyEl.remove();

    // (d) Transient rejection clears cache so subsequent retry succeeds; (b) sets workerSrc
    resetPdfJsLoaderCache();
    let resolvePdfLoad!: (mod: any) => void;
    let loadAttempts = 0;
    const docsBySrc = new Map<string, { resolve: (doc: any) => void; doc: any }>();

    SnicePdfViewer._pdfLoader = vi.fn(() => {
      loadAttempts++;
      if (failFirst) {
        failFirst = false;
        return Promise.reject(new Error('transient network failure'));
      }
      return new Promise(resolve => {
        resolvePdfLoad = resolve;
      });
    });

    const el = document.createElement('snice-pdf-viewer') as SnicePdfViewer;
    const errors: string[] = [];
    const loaded: number[] = [];
    el.addEventListener('pdf-error', (e: any) => errors.push(e.detail.error));
    el.addEventListener('pdf-loaded', (e: any) => loaded.push(e.detail.totalPages));
    document.body.appendChild(el);
    await (el as any).ready;

    // First load rejects
    el.src = 'https://example.com/first.pdf';
    await new Promise(r => setTimeout(r, 20));
    expect(loadAttempts).toBe(1);
    expect(errors).toContain('transient network failure');

    // (c) Concurrent calls share one in-flight import promise
    const el2 = document.createElement('snice-pdf-viewer') as SnicePdfViewer;
    document.body.appendChild(el2);
    await (el2 as any).ready;

    el.src = 'https://example.com/a.pdf';
    el2.src = 'https://example.com/b.pdf';
    await new Promise(r => setTimeout(r, 10));
    expect(loadAttempts).toBe(2); // single shared promise for both concurrent loads

    const fakePdfJs = {
      GlobalWorkerOptions: workerOpts,
      getDocument: vi.fn((src: string) => {
        const doc = makeDoc(src);
        let res!: (d: any) => void;
        const promise = new Promise(r => { res = r; });
        docsBySrc.set(src, { resolve: res, doc });
        return { promise };
      }),
    };
    resolvePdfLoad(fakePdfJs);
    await new Promise(r => setTimeout(r, 15));

    // (b) GlobalWorkerOptions.workerSrc populated from synchronously captured URL
    expect(workerOpts.workerSrc).toContain('pdf.worker.min.mjs');

    // (e) Supersede el's src while a.pdf is in flight, and disconnect el2 while b.pdf is in flight
    el.src = 'https://example.com/c.pdf';
    el2.remove();
    await new Promise(r => setTimeout(r, 15));

    // Now resolve stale a.pdf and detached b.pdf — both must be destroyed without emitting pdf-loaded
    const loadedBefore = loaded.length;
    docsBySrc.get('https://example.com/a.pdf')!.resolve(docsBySrc.get('https://example.com/a.pdf')!.doc);
    docsBySrc.get('https://example.com/b.pdf')!.resolve(docsBySrc.get('https://example.com/b.pdf')!.doc);
    await new Promise(r => setTimeout(r, 15));
    expect(destroyedDocs).toContain('https://example.com/a.pdf');
    expect(destroyedDocs).toContain('https://example.com/b.pdf');
    expect(loaded.length).toBe(loadedBefore);

    // Resolve active c.pdf — succeeds and emits pdf-loaded once
    docsBySrc.get('https://example.com/c.pdf')!.resolve(docsBySrc.get('https://example.com/c.pdf')!.doc);
    await new Promise(r => setTimeout(r, 15));
    expect(loaded).toEqual([3]);
    expect(el.totalPages).toBe(3);

    // Disconnect destroys active c.pdf
    el.remove();
    await new Promise(r => setTimeout(r, 10));
    expect(destroyedDocs).toContain('https://example.com/c.pdf');
  });
});
