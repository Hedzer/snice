import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { SourceMapConsumer } from 'source-map';

/**
 * Source-map fidelity guard for CDN bundles.
 *
 * Every size-reduction transform in the CDN pipeline must keep maps intact:
 * the .map must exist, parse, and its named mappings must trace back to
 * original source lines that actually contain those names. If a transform
 * emits garbage mappings, the fidelity ratio collapses and this fails.
 */
const CDN_DIR = path.join(__dirname, '..', 'dist', 'cdn');

// Representative sample: shared runtime + small/medium/large components
const SAMPLE = ['runtime', 'button', 'message-strip', 'kpi', 'chat', 'table'];

const exists = (p: string) => fs.existsSync(p);

describe.each(SAMPLE.filter(name => exists(path.join(CDN_DIR, name))))(
  'sourcemap: %s',
  (name) => {
    const minPath = path.join(CDN_DIR, name, `snice-${name}.min.js`);
    const mapPath = `${minPath}.map`;

    it('min.js references an existing .map', () => {
      expect(exists(minPath)).toBe(true);
      const tail = fs.readFileSync(minPath, 'utf8').slice(-200);
      expect(tail).toContain(`sourceMappingURL=snice-${name}.min.js.map`);
      expect(exists(mapPath)).toBe(true);
    });

    it('map parses with sources, mappings and embedded content', () => {
      const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      expect(map.version).toBe(3);
      expect(map.sources.length).toBeGreaterThan(0);
      expect(map.mappings.length).toBeGreaterThan(0);
      expect(Array.isArray(map.sourcesContent)).toBe(true);
      expect(map.sourcesContent.some((c: string | null) => !!c)).toBe(true);
    });

    it('named mappings trace to original lines containing the name', async () => {
      const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      const consumer = await new SourceMapConsumer(map);

      // Index source content by source path for line lookups
      const contentBySource = new Map<string, string[]>();
      map.sources.forEach((src: string, i: number) => {
        const content = map.sourcesContent?.[i];
        if (content) contentBySource.set(src, content.split('\n'));
      });

      let named = 0;
      let hits = 0;
      consumer.eachMapping((m) => {
        if (!m.name || m.originalLine == null) return;
        const lines = contentBySource.get(m.source);
        if (!lines) return;
        named++;
        const line = lines[m.originalLine - 1] ?? '';
        if (line.includes(m.name)) hits++;
      });
      // note: no consumer.destroy() — source-map 0.6 has no such method

      expect(named).toBeGreaterThan(10);
      // Some slippage is normal after minification; garbage maps score near 0
      expect(hits / named).toBeGreaterThan(0.8);
    });
  }
);
