import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/gantt/snice-gantt';
import type { SniceGanttElement, GanttTask } from '../../components/gantt/snice-gantt.types';

describe('snice-gantt', () => {
  let gantt: SniceGanttElement;

  afterEach(() => {
    if (gantt) {
      removeComponent(gantt as HTMLElement);
    }
  });

  it('should render', async () => {
    gantt = await createComponent<SniceGanttElement>('snice-gantt');
    expect(gantt).toBeTruthy();
  });

  it('should have default properties', async () => {
    gantt = await createComponent<SniceGanttElement>('snice-gantt');
    expect(gantt.tasks).toEqual([]);
    expect(gantt.viewMode).toBe('day');
    expect(gantt.showToday).toBe(true);
    expect(gantt.showProgress).toBe(true);
    expect(gantt.showDependencies).toBe(false);
  });

  it('should support tasks', async () => {
    const tasks: GanttTask[] = [
      {
        id: 1,
        name: 'Task 1',
        start: new Date(2024, 0, 1),
        end: new Date(2024, 0, 5)
      }
    ];

    gantt = await createComponent<SniceGanttElement>('snice-gantt');
    gantt.tasks = tasks;
    await wait();

    expect(gantt.tasks.length).toBe(1);
  });

  it('should support different view modes', async () => {
    gantt = await createComponent<SniceGanttElement>('snice-gantt', {
      'view-mode': 'week'
    });
    expect(gantt.viewMode).toBe('week');
  });

  it('should get task by id', async () => {
    const tasks: GanttTask[] = [
      {
        id: 1,
        name: 'Task 1',
        start: new Date(),
        end: new Date()
      }
    ];

    gantt = await createComponent<SniceGanttElement>('snice-gantt');
    gantt.tasks = tasks;
    await wait();

    const task = gantt.getTask(1);
    expect(task?.name).toBe('Task 1');
  });

  it('should support progress', async () => {
    const tasks: GanttTask[] = [
      {
        id: 1,
        name: 'Task 1',
        start: new Date(),
        end: new Date(),
        progress: 50
      }
    ];

    gantt = await createComponent<SniceGanttElement>('snice-gantt');
    gantt.tasks = tasks;
    await wait();

    expect(gantt.tasks[0].progress).toBe(50);
  });

  it('should support min date', async () => {
    gantt = await createComponent<SniceGanttElement>('snice-gantt', {
      'min-date': new Date(2024, 0, 1).toISOString()
    });
    expect(gantt.minDate).toBeTruthy();
  });

  it('should support max date', async () => {
    gantt = await createComponent<SniceGanttElement>('snice-gantt', {
      'max-date': new Date(2024, 11, 31).toISOString()
    });
    expect(gantt.maxDate).toBeTruthy();
  });

  it('should support show today toggle', async () => {
    gantt = await createComponent<SniceGanttElement>('snice-gantt', {
      'show-today': false
    });
    expect(gantt.showToday).toBe(false);
  });

  it('should support show progress toggle', async () => {
    gantt = await createComponent<SniceGanttElement>('snice-gantt', {
      'show-progress': false
    });
    expect(gantt.showProgress).toBe(false);
  });

  it('should support dependencies toggle', async () => {
    gantt = await createComponent<SniceGanttElement>('snice-gantt', {
      'show-dependencies': true
    });
    expect(gantt.showDependencies).toBe(true);
  });
});
