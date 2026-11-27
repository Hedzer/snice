// @vitest-environment node
import { describe, it, expect } from 'vitest';
import sniceVite, { createSniceAdvancedChunksGroups } from '../../packages/plugin/src/vite';
import sniceRollup from '../../packages/plugin/src/rollup';

describe('Phase 2: Vite 6+ / Rolldown readiness (advancedChunks & codeSplitting)', () => {
  it('emits advancedChunks.groups automatically when Rolldown meta.rolldownVersion is detected', () => {
    const plugin = sniceVite();
    const rolldownCtx = { meta: { rolldownVersion: '1.0.0-beta.1' } };
    const out = plugin.outputOptions.call(rolldownCtx, { format: 'es' });

    expect(out.manualChunks).toBeUndefined();
    expect(Array.isArray(out.advancedChunks?.groups)).toBe(true);
    const names = out.advancedChunks.groups.map((g: any) => g.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'snice-theme',
        'snice-runtime',
        'vendor-react',
        'snice-table',
        'snice-components',
        'vendor',
      ])
    );

    const findGroup = (id: string) =>
      out.advancedChunks.groups
        .slice()
        .sort((a: any, b: any) => b.priority - a.priority)
        .find((g: any) => g.test(id))?.name;

    expect(findGroup('/app/node_modules/snice/dist/_core/element.js')).toBe('snice-runtime');
    expect(findGroup('/app/node_modules/react/index.js')).toBe('vendor-react');
    expect(findGroup('/app/node_modules/lodash-es/debounce.js')).toBe('vendor');
    expect(findGroup('/app/node_modules/snice/dist/components/theme/core.css')).toBe('snice-theme');
    expect(findGroup('/app/node_modules/snice/dist/components/table/snice-table.js')).toBe('snice-table');
    expect(findGroup('/app/node_modules/snice/dist/components/button/snice-button.js')).toBe('snice-components');
    expect(findGroup('/app/src/main.ts')).toBeUndefined();
  });

  it('merges user-supplied advancedChunks.groups and codeSplitting.groups ahead of Snice defaults and respects opt-out (false)', () => {
    const plugin = sniceRollup({
      caching: { componentGroups: { forms: ['input', 'select'] }, vendor: false },
    });

    const userGroup = { name: 'my-charts', priority: 100, test: (id: string) => id.includes('echarts') };

    // advancedChunks merge
    const advOut = plugin.outputOptions.call({}, { format: 'es', advancedChunks: { groups: [userGroup] } });
    expect(advOut.advancedChunks.groups[0]).toBe(userGroup);
    expect(advOut.advancedChunks.groups.some((g: any) => g.name === 'snice-forms')).toBe(true);
    expect(advOut.advancedChunks.groups.some((g: any) => g.name === 'snice-shared')).toBe(true);
    expect(advOut.advancedChunks.groups.some((g: any) => g.name === 'vendor')).toBe(false);

    // codeSplitting merge
    const csOut = plugin.outputOptions.call({}, { format: 'es', codeSplitting: { groups: [userGroup] } });
    expect(csOut.codeSplitting.groups[0]).toBe(userGroup);
    expect(csOut.codeSplitting.groups.some((g: any) => g.name === 'snice-runtime')).toBe(true);

    // explicit false disables cleanly
    const disabledAdv = plugin.outputOptions.call({ meta: { rolldownVersion: '1.0.0' } }, { format: 'es', advancedChunks: false });
    expect(disabledAdv.advancedChunks).toBe(false);
    expect(disabledAdv.manualChunks).toBeUndefined();

    const disabledCs = plugin.outputOptions.call({}, { format: 'es', codeSplitting: false });
    expect(disabledCs.codeSplitting).toBe(false);

    // standalone helper
    const groups = createSniceAdvancedChunksGroups({ componentGroups: { nav: ['drawer'] } });
    expect(groups.some((g) => g.name === 'snice-nav')).toBe(true);
  });
});
