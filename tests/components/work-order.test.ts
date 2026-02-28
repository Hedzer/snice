import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/work-order/snice-work-order';
import type { SniceWorkOrderElement, WorkOrderTask, WorkOrderPart, WorkOrderCustomer } from '../../components/work-order/snice-work-order.types';

describe('snice-work-order', () => {
  let wo: SniceWorkOrderElement;

  afterEach(() => {
    if (wo) {
      removeComponent(wo as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render work order element', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      expect(wo).toBeTruthy();
      expect(wo.tagName.toLowerCase()).toBe('snice-work-order');
    });

    it('should have default properties', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      expect(wo.woNumber).toBe('');
      expect(wo.date).toBe('');
      expect(wo.priority).toBe('medium');
      expect(wo.status).toBe('open');
      expect(wo.customer).toBeNull();
      expect(wo.description).toBe('');
      expect(wo.tasks).toEqual([]);
      expect(wo.parts).toEqual([]);
      expect(wo.laborRate).toBe(0);
      expect(wo.notes).toBe('');
      expect(wo.variant).toBe('standard');
    });

    it('should render base container', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      const container = queryShadow(wo, '.wo');
      expect(container).toBeTruthy();
    });
  });

  describe('header', () => {
    it('should display WO number', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.woNumber = 'WO-2024-001';
      await wait(10);
      const number = queryShadow(wo, '.wo__number');
      expect(number?.textContent).toContain('WO-2024-001');
    });

    it('should display date', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.date = '2024-03-15';
      await wait(10);
      const date = queryShadow(wo, '.wo__date');
      expect(date?.textContent).toBe('2024-03-15');
    });

    it('should display priority badge', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order', {
        priority: 'urgent'
      });
      await wait(10);
      const badge = queryShadow(wo, '.wo__priority--urgent');
      expect(badge).toBeTruthy();
    });

    it('should display status badge', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order', {
        status: 'in-progress'
      });
      await wait(10);
      const badge = queryShadow(wo, '.wo__status--in-progress');
      expect(badge).toBeTruthy();
    });
  });

  describe('customer', () => {
    it('should render customer section when provided', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.customer = { name: 'Acme Corp', address: '123 Main St', phone: '555-1234', email: 'info@acme.com' };
      await wait(10);
      const section = queryShadow(wo, '[part="customer-section"]');
      expect(section).toBeTruthy();
    });

    it('should not render customer section when null', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const section = queryShadow(wo, '[part="customer-section"]');
      expect(section).toBeFalsy();
    });

    it('should display customer name', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.customer = { name: 'Acme Corp' };
      await wait(10);
      const values = queryShadowAll(wo, '.wo__customer-value');
      const names = Array.from(values).map(v => v.textContent);
      expect(names).toContain('Acme Corp');
    });
  });

  describe('description', () => {
    it('should display description', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.description = 'Replace HVAC system on 3rd floor';
      await wait(10);
      const desc = queryShadow(wo, '.wo__description');
      expect(desc?.textContent).toBe('Replace HVAC system on 3rd floor');
    });

    it('should not render description section when empty', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const section = queryShadow(wo, '[part="description-section"]');
      expect(section).toBeFalsy();
    });
  });

  describe('tasks', () => {
    const testTasks: WorkOrderTask[] = [
      { description: 'Remove old unit', assignee: 'John', completed: false, hours: 2 },
      { description: 'Install new unit', assignee: 'Jane', completed: true, hours: 4 }
    ];

    it('should render task list', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.tasks = testTasks;
      await wait(10);
      const tasks = queryShadowAll(wo, '.wo__task');
      expect(tasks.length).toBe(2);
    });

    it('should show completed state', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.tasks = testTasks;
      await wait(10);
      const completed = queryShadow(wo, '.wo__task--completed');
      expect(completed).toBeTruthy();
    });

    it('should emit task-toggle on checkbox click', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.tasks = [{ description: 'Test task', completed: false }];
      await wait(10);

      const handler = vi.fn();
      wo.addEventListener('task-toggle', handler);

      const checkbox = queryShadow(wo, '.wo__task-checkbox') as HTMLButtonElement;
      checkbox?.click();
      await wait(10);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail.completed).toBe(true);
    });

    it('should toggle task completed state', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.tasks = [{ description: 'Test task', completed: false }];
      await wait(10);

      const checkbox = queryShadow(wo, '.wo__task-checkbox') as HTMLButtonElement;
      checkbox?.click();
      await wait(10);

      expect(wo.tasks[0].completed).toBe(true);
    });

    it('should not render tasks section when empty', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const section = queryShadow(wo, '[part="tasks-section"]');
      expect(section).toBeFalsy();
    });
  });

  describe('parts', () => {
    const testParts: WorkOrderPart[] = [
      { name: 'Air Filter', partNumber: 'AF-100', quantity: 2, unitCost: 25.50 },
      { name: 'Compressor', partNumber: 'CP-200', quantity: 1, unitCost: 450 }
    ];

    it('should render parts table', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.parts = testParts;
      await wait(10);
      const table = queryShadow(wo, '.wo__parts-table');
      expect(table).toBeTruthy();
    });

    it('should display parts total', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.parts = testParts;
      await wait(10);
      const total = queryShadow(wo, '.wo__parts-total');
      expect(total).toBeTruthy();
    });

    it('should not render parts section when empty', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const section = queryShadow(wo, '[part="parts-section"]');
      expect(section).toBeFalsy();
    });
  });

  describe('time tracking', () => {
    it('should render time section with labor data', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.tasks = [{ description: 'Task 1', hours: 3 }];
      wo.laborRate = 75;
      await wait(10);
      const section = queryShadow(wo, '[part="time-section"]');
      expect(section).toBeTruthy();
    });

    it('should not render time section without data', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const section = queryShadow(wo, '[part="time-section"]');
      expect(section).toBeFalsy();
    });
  });

  describe('signature', () => {
    it('should render sign button', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const btn = queryShadow(wo, '.wo__sign-btn');
      expect(btn).toBeTruthy();
    });

    it('should emit wo-sign on sign click', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.woNumber = 'WO-001';
      await wait(10);

      const handler = vi.fn();
      wo.addEventListener('wo-sign', handler);

      const btn = queryShadow(wo, '.wo__sign-btn') as HTMLButtonElement;
      btn?.click();
      await wait(10);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail.woNumber).toBe('WO-001');
    });
  });

  describe('totals', () => {
    it('should render footer with costs', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.parts = [{ name: 'Part', quantity: 1, unitCost: 100 }];
      wo.tasks = [{ description: 'Task', hours: 2 }];
      wo.laborRate = 50;
      await wait(10);
      const footer = queryShadow(wo, '.wo__footer');
      expect(footer).toBeTruthy();
    });

    it('should not render footer without costs', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const footer = queryShadow(wo, '.wo__footer');
      expect(footer).toBeFalsy();
    });
  });

  describe('variant', () => {
    it('should default to standard', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      expect(wo.variant).toBe('standard');
    });

    it('should accept compact variant', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order', {
        variant: 'compact'
      });
      expect(wo.variant).toBe('compact');
    });
  });

  describe('methods', () => {
    it('should return JSON representation', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.woNumber = 'WO-001';
      wo.priority = 'high';
      wo.status = 'open';
      wo.parts = [{ name: 'Part', quantity: 2, unitCost: 50 }];
      wo.tasks = [{ description: 'Task', hours: 3 }];
      wo.laborRate = 75;

      const json = wo.toJSON();
      expect(json.woNumber).toBe('WO-001');
      expect(json.priority).toBe('high');
      expect(json.totalPartsCost).toBe(100);
      expect(json.totalLaborHours).toBe(3);
      expect(json.totalLaborCost).toBe(225);
      expect(json.totalCost).toBe(325);
    });
  });
});
