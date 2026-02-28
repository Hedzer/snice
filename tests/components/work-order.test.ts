import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/work-order/snice-work-order';
import type { SniceWorkOrderElement, WorkOrderTask, WorkOrderPart, WorkOrderCustomer, WorkOrderAsset } from '../../components/work-order/snice-work-order.types';

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
      expect(wo.dueDate).toBe('');
      expect(wo.priority).toBe('medium');
      expect(wo.status).toBe('open');
      expect(wo.customer).toBeNull();
      expect(wo.description).toBe('');
      expect(wo.tasks).toEqual([]);
      expect(wo.parts).toEqual([]);
      expect(wo.asset).toBeNull();
      expect(wo.laborRate).toBe(0);
      expect(wo.notes).toBe('');
      expect(wo.variant).toBe('standard');
      expect(wo.showQr).toBe(false);
      expect(wo.qrData).toBe('');
      expect(wo.qrPosition).toBe('top-right');
    });

    it('should render base container', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      const container = queryShadow(wo, '[part="base"]');
      expect(container).toBeTruthy();
    });
  });

  describe('header', () => {
    it('should display WO number', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.woNumber = 'WO-2024-001';
      await wait(10);
      const number = queryShadow(wo, '[part="wo-number"]');
      expect(number?.textContent).toContain('WO-2024-001');
    });

    it('should display date', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.date = '2024-03-15';
      await wait(10);
      const date = queryShadow(wo, '[part="date"]');
      expect(date?.textContent).toBe('2024-03-15');
    });

    it('should display due date', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.dueDate = '2024-03-20';
      await wait(10);
      const dueDate = queryShadow(wo, '[part="due-date"]');
      expect(dueDate?.textContent).toBe('2024-03-20');
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

    it('should render title label', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      const title = queryShadow(wo, '[part="title"]');
      expect(title?.textContent).toContain('Work Order');
    });
  });

  describe('customer', () => {
    it('should render customer section when provided', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.customer = { name: 'Acme Corp', address: '123 Main St', phone: '555-1234', email: 'info@acme.com' };
      await wait(10);
      const section = queryShadow(wo, '[part="customer"]');
      expect(section).toBeTruthy();
    });

    it('should not render customer section when null', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const section = queryShadow(wo, '[part="customer"]');
      expect(section).toBeFalsy();
    });

    it('should display customer name', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.customer = { name: 'Acme Corp' };
      await wait(10);
      const name = queryShadow(wo, '[part="customer-name"]');
      expect(name?.textContent).toBe('Acme Corp');
    });
  });

  describe('asset', () => {
    const testAsset: WorkOrderAsset = {
      id: 'HVAC-301',
      name: 'Rooftop HVAC Unit',
      location: '3rd Floor',
      serial: 'SN-2019-4521',
      lastService: '2024-01-15'
    };

    it('should render asset section when provided', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.asset = testAsset;
      await wait(10);
      const section = queryShadow(wo, '[part="asset"]');
      expect(section).toBeTruthy();
    });

    it('should not render asset section when null', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const section = queryShadow(wo, '[part="asset"]');
      expect(section).toBeFalsy();
    });

    it('should display asset ID', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.asset = testAsset;
      await wait(10);
      const id = queryShadow(wo, '[part="asset-id"]');
      expect(id?.textContent).toBe('HVAC-301');
    });

    it('should display asset name', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.asset = testAsset;
      await wait(10);
      const name = queryShadow(wo, '[part="asset-name"]');
      expect(name?.textContent).toBe('Rooftop HVAC Unit');
    });
  });

  describe('description', () => {
    it('should display description', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.description = 'Replace HVAC system on 3rd floor';
      await wait(10);
      const desc = queryShadow(wo, '[part="description-content"]');
      expect(desc?.textContent).toBe('Replace HVAC system on 3rd floor');
    });

    it('should not render description section when empty', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const section = queryShadow(wo, '[part="description"]');
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
      const tasks = queryShadowAll(wo, '[part="task"]');
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

      const checkbox = queryShadow(wo, '[part="task-checkbox"]') as HTMLButtonElement;
      checkbox?.click();
      await wait(10);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail.completed).toBe(true);
    });

    it('should toggle task completed state', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.tasks = [{ description: 'Test task', completed: false }];
      await wait(10);

      const checkbox = queryShadow(wo, '[part="task-checkbox"]') as HTMLButtonElement;
      checkbox?.click();
      await wait(10);

      expect(wo.tasks[0].completed).toBe(true);
    });

    it('should not render tasks section when empty', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const section = queryShadow(wo, '[part="tasks"]');
      expect(section).toBeFalsy();
    });

    it('should display task assignee', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.tasks = [{ description: 'Task', assignee: 'John Smith' }];
      await wait(10);
      const assignee = queryShadow(wo, '[part="task-assignee"]');
      expect(assignee?.textContent).toBe('John Smith');
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
      const table = queryShadow(wo, '[part="parts-table"]');
      expect(table).toBeTruthy();
    });

    it('should display parts total', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.parts = testParts;
      await wait(10);
      const total = queryShadow(wo, '.wo__parts-total');
      expect(total).toBeTruthy();
    });

    it('should render parts rows', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.parts = testParts;
      await wait(10);
      const rows = queryShadowAll(wo, '[part="parts-row"]');
      expect(rows.length).toBe(2);
    });

    it('should not render parts section when empty', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const section = queryShadow(wo, '[part="parts"]');
      expect(section).toBeFalsy();
    });
  });

  describe('labor', () => {
    it('should render labor section with data', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.tasks = [{ description: 'Task 1', hours: 3 }];
      wo.laborRate = 75;
      await wait(10);
      const section = queryShadow(wo, '[part="labor"]');
      expect(section).toBeTruthy();
    });

    it('should display labor hours', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.tasks = [{ description: 'Task 1', hours: 3 }, { description: 'Task 2', hours: 2 }];
      await wait(10);
      const hours = queryShadow(wo, '[part="labor-hours"]');
      expect(hours?.textContent).toBe('5h');
    });

    it('should display labor rate', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.tasks = [{ description: 'Task', hours: 1 }];
      wo.laborRate = 75;
      await wait(10);
      const rate = queryShadow(wo, '[part="labor-rate"]');
      expect(rate?.textContent).toContain('75');
    });

    it('should not render labor section without data', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const section = queryShadow(wo, '[part="labor"]');
      expect(section).toBeFalsy();
    });
  });

  describe('signature', () => {
    it('should render signature section', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const section = queryShadow(wo, '[part="signature"]');
      expect(section).toBeTruthy();
    });

    it('should render signature line', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const line = queryShadow(wo, '[part="signature-line"]');
      expect(line).toBeTruthy();
    });

    it('should render signature date line', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const dateLine = queryShadow(wo, '[part="signature-date"]');
      expect(dateLine).toBeTruthy();
    });

    it('should render sign button', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const btn = queryShadow(wo, '[part="sign-button"]');
      expect(btn).toBeTruthy();
    });

    it('should emit wo-sign on sign click', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.woNumber = 'WO-001';
      await wait(10);

      const handler = vi.fn();
      wo.addEventListener('wo-sign', handler);

      const btn = queryShadow(wo, '[part="sign-button"]') as HTMLButtonElement;
      btn?.click();
      await wait(10);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail.woNumber).toBe('WO-001');
      expect(handler.mock.calls[0][0].detail.timestamp).toBeTruthy();
    });
  });

  describe('costs', () => {
    it('should render costs with parts and labor', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.parts = [{ name: 'Part', quantity: 1, unitCost: 100 }];
      wo.tasks = [{ description: 'Task', hours: 2 }];
      wo.laborRate = 50;
      await wait(10);
      const costs = queryShadow(wo, '[part="costs"]');
      expect(costs).toBeTruthy();
    });

    it('should render grand total', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.parts = [{ name: 'Part', quantity: 2, unitCost: 50 }];
      wo.tasks = [{ description: 'Task', hours: 3 }];
      wo.laborRate = 75;
      await wait(10);
      const grandTotal = queryShadow(wo, '[part="grand-total"]');
      expect(grandTotal).toBeTruthy();
    });

    it('should not render costs without data', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const costs = queryShadow(wo, '[part="costs"]');
      expect(costs).toBeFalsy();
    });
  });

  describe('QR code', () => {
    it('should not render QR slot when showQr is false', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      await wait(10);
      const qr = queryShadow(wo, '[part="qr-container"]');
      expect(qr).toBeFalsy();
    });

    it('should render QR slot when showQr is true', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order', {
        showQr: true,
        qrPosition: 'top-right'
      });
      await wait(10);
      const qr = queryShadow(wo, '[part="qr-container"]');
      expect(qr).toBeTruthy();
    });

    it('should render QR in header position', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order', {
        showQr: true,
        qrPosition: 'header'
      });
      await wait(10);
      const qr = queryShadow(wo, '.wo__qr--header');
      expect(qr).toBeTruthy();
    });

    it('should render QR in footer position', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order', {
        showQr: true,
        qrPosition: 'footer'
      });
      await wait(10);
      const qr = queryShadow(wo, '.wo__qr--footer');
      expect(qr).toBeTruthy();
    });

    it('should accept qrData property', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order', {
        showQr: true,
        qrData: 'https://example.com/wo/123'
      });
      expect(wo.qrData).toBe('https://example.com/wo/123');
    });
  });

  describe('variants', () => {
    it('should default to standard', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      expect(wo.variant).toBe('standard');
    });

    it('should accept compact variant', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order', {
        variant: 'compact'
      });
      expect(wo.variant).toBe('compact');
      expect(wo.getAttribute('variant')).toBe('compact');
    });

    it('should accept field-service variant', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order', {
        variant: 'field-service'
      });
      expect(wo.variant).toBe('field-service');
      expect(wo.getAttribute('variant')).toBe('field-service');
    });

    it('should accept maintenance variant', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order', {
        variant: 'maintenance'
      });
      expect(wo.variant).toBe('maintenance');
      expect(wo.getAttribute('variant')).toBe('maintenance');
    });

    it('should accept detailed variant', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order', {
        variant: 'detailed'
      });
      expect(wo.variant).toBe('detailed');
      expect(wo.getAttribute('variant')).toBe('detailed');
    });
  });

  describe('status-change event', () => {
    it('should emit status-change when status changes', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order', {
        status: 'open'
      });
      await wait(10);

      const handler = vi.fn();
      wo.addEventListener('status-change', handler);

      wo.status = 'in-progress';
      await wait(10);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail.previousStatus).toBe('open');
      expect(handler.mock.calls[0][0].detail.status).toBe('in-progress');
    });
  });

  describe('cost calculations', () => {
    it('should compute parts total correctly', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.parts = [
        { name: 'A', quantity: 2, unitCost: 25.50 },
        { name: 'B', quantity: 1, unitCost: 450 }
      ];
      expect(wo.getTotalPartsCost()).toBe(501);
    });

    it('should compute labor hours correctly', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.tasks = [
        { description: 'T1', hours: 2 },
        { description: 'T2', hours: 4 },
        { description: 'T3' }
      ];
      expect(wo.getTotalLaborHours()).toBe(6);
    });

    it('should compute labor cost correctly', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.tasks = [{ description: 'T1', hours: 3 }];
      wo.laborRate = 75;
      expect(wo.getTotalLaborCost()).toBe(225);
    });

    it('should compute total cost correctly', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.parts = [{ name: 'Part', quantity: 2, unitCost: 50 }];
      wo.tasks = [{ description: 'Task', hours: 3 }];
      wo.laborRate = 75;
      expect(wo.getTotalCost()).toBe(325);
    });
  });

  describe('toJSON', () => {
    it('should return full JSON representation', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.woNumber = 'WO-001';
      wo.date = '2024-03-15';
      wo.dueDate = '2024-03-20';
      wo.priority = 'high';
      wo.status = 'open';
      wo.parts = [{ name: 'Part', quantity: 2, unitCost: 50 }];
      wo.tasks = [{ description: 'Task', hours: 3 }];
      wo.laborRate = 75;

      const json = wo.toJSON();
      expect(json.woNumber).toBe('WO-001');
      expect(json.date).toBe('2024-03-15');
      expect(json.dueDate).toBe('2024-03-20');
      expect(json.priority).toBe('high');
      expect(json.totalPartsCost).toBe(100);
      expect(json.totalLaborHours).toBe(3);
      expect(json.totalLaborCost).toBe(225);
      expect(json.totalCost).toBe(325);
    });

    it('should include asset in JSON', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      wo.asset = { id: 'A-1', name: 'Machine' };
      const json = wo.toJSON();
      expect(json.asset).toEqual({ id: 'A-1', name: 'Machine' });
    });
  });

  describe('CSS parts', () => {
    it('should have base part', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      expect(queryShadow(wo, '[part="base"]')).toBeTruthy();
    });

    it('should have header part', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      expect(queryShadow(wo, '[part="header"]')).toBeTruthy();
    });

    it('should have title part', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      expect(queryShadow(wo, '[part="title"]')).toBeTruthy();
    });

    it('should have wo-number part', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      expect(queryShadow(wo, '[part="wo-number"]')).toBeTruthy();
    });

    it('should have priority part', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      expect(queryShadow(wo, '[part="priority"]')).toBeTruthy();
    });

    it('should have status part', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      expect(queryShadow(wo, '[part="status"]')).toBeTruthy();
    });

    it('should have footer part', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      expect(queryShadow(wo, '[part="footer"]')).toBeTruthy();
    });

    it('should have sign-button part', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      expect(queryShadow(wo, '[part="sign-button"]')).toBeTruthy();
    });

    it('should have signature parts', async () => {
      wo = await createComponent<SniceWorkOrderElement>('snice-work-order');
      expect(queryShadow(wo, '[part="signature"]')).toBeTruthy();
      expect(queryShadow(wo, '[part="signature-line"]')).toBeTruthy();
      expect(queryShadow(wo, '[part="signature-date"]')).toBeTruthy();
    });
  });
});
