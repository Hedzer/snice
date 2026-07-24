import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/gantt/snice-gantt';
import type { SniceGanttElement, GanttTask } from '../../packages/components/src/gantt/snice-gantt.types';

const day = 86400000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString().slice(0, 10);

const sampleTasks: GanttTask[] = [
  { id: 'a', name: 'Design', start: iso(0), end: iso(3), progress: 60 },
  { id: 'b', name: 'Build', start: iso(3), end: iso(8), progress: 20, dependencies: ['a'] },
  { id: 'c', name: 'Ship', start: iso(8), end: iso(9), dependencies: ['b'] },
];

describe('snice-gantt', () => {
  let gantt: SniceGanttElement;

  afterEach(() => {
    if (gantt) removeComponent(gantt as HTMLElement);
  });

  describe('basic functionality', () => {
    it('should render the gantt element', async () => {
      gantt = await createComponent<SniceGanttElement>('snice-gantt');
      expect(gantt.tagName.toLowerCase()).toBe('snice-gantt');
    });

    it('should default to week zoom with no tasks', async () => {
      gantt = await createComponent<SniceGanttElement>('snice-gantt');
      expect(gantt.zoom).toBe('week');
      expect(gantt.tasks).toEqual([]);
    });

    it('should render one row per task', async () => {
      gantt = await createComponent<SniceGanttElement>('snice-gantt');
      gantt.tasks = sampleTasks;
      await wait(80);

      const bars = gantt.shadowRoot!.querySelectorAll('.gantt-bar');
      expect(bars.length).toBeGreaterThanOrEqual(3);
    });

    it('should render task names', async () => {
      gantt = await createComponent<SniceGanttElement>('snice-gantt');
      gantt.tasks = sampleTasks;
      await wait(80);

      const text = gantt.shadowRoot!.textContent ?? '';
      expect(text).toContain('Design');
      expect(text).toContain('Build');
      expect(text).toContain('Ship');
    });
  });

  describe('boundary cases', () => {
    it('should handle a single task', async () => {
      gantt = await createComponent<SniceGanttElement>('snice-gantt');
      gantt.tasks = [sampleTasks[0]];
      await wait(80);

      expect(gantt.shadowRoot!.textContent).toContain('Design');
    });

    it('should render an empty state without tasks', async () => {
      gantt = await createComponent<SniceGanttElement>('snice-gantt');
      await wait(80);

      expect(gantt.shadowRoot!.querySelectorAll('.gantt-bar').length).toBe(0);
    });

    it('should tolerate a task with an unparseable date without throwing', async () => {
      gantt = await createComponent<SniceGanttElement>('snice-gantt');
      expect(() => {
        gantt.tasks = [{ id: 'bad', name: 'Broken', start: 'not-a-date', end: 'also-bad' }];
      }).not.toThrow();
      await wait(80);
      expect(gantt.shadowRoot).toBeTruthy();
    });

    it('should tolerate an end date before the start date', async () => {
      gantt = await createComponent<SniceGanttElement>('snice-gantt');
      expect(() => {
        gantt.tasks = [{ id: 'rev', name: 'Reversed', start: iso(5), end: iso(1) }];
      }).not.toThrow();
      await wait(80);
      expect(gantt.shadowRoot).toBeTruthy();
    });
  });

  describe('zoom', () => {
    it.each(['day', 'week', 'month'] as const)('should accept %s zoom', async (zoom) => {
      gantt = await createComponent<SniceGanttElement>('snice-gantt', { zoom });
      gantt.tasks = sampleTasks;
      await wait(80);

      expect(gantt.zoom).toBe(zoom);
      expect(gantt.shadowRoot!.textContent).toContain('Design');
    });
  });

  describe('grouping', () => {
    it('should render group headers when tasks carry groups', async () => {
      gantt = await createComponent<SniceGanttElement>('snice-gantt');
      gantt.tasks = [
        { ...sampleTasks[0], group: 'Phase 1' },
        { ...sampleTasks[1], group: 'Phase 2' },
      ];
      await wait(80);

      const text = gantt.shadowRoot!.textContent ?? '';
      expect(text).toContain('Phase 1');
      expect(text).toContain('Phase 2');
    });
  });

  describe('events', () => {
    it('should dispatch task-click with the task detail', async () => {
      gantt = await createComponent<SniceGanttElement>('snice-gantt');
      gantt.tasks = sampleTasks;
      await wait(80);

      let detail: any = null;
      (gantt as HTMLElement).addEventListener('task-click', (e: Event) => {
        detail = (e as CustomEvent).detail;
      });

      const bar = gantt.shadowRoot!.querySelector('.gantt-bar') as HTMLElement;
      bar?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(50);

      expect(detail?.task?.id ?? detail?.id ?? null).not.toBeNull();
    });
  });

  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/gantt/snice-gantt.css');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(cssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});
