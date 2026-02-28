import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/estimate/snice-estimate';
import type { SniceEstimateElement, EstimateItem, EstimateParty } from '../../components/estimate/snice-estimate.types';

describe('snice-estimate', () => {
  let est: SniceEstimateElement;

  afterEach(() => {
    if (est) {
      removeComponent(est as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render estimate element', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      expect(est).toBeTruthy();
      expect(est.tagName.toLowerCase()).toBe('snice-estimate');
    });

    it('should have default properties', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      expect(est.estimateNumber).toBe('');
      expect(est.date).toBe('');
      expect(est.expiryDate).toBe('');
      expect(est.status).toBe('draft');
      expect(est.from).toBeNull();
      expect(est.to).toBeNull();
      expect(est.items).toEqual([]);
      expect(est.currency).toBe('$');
      expect(est.taxRate).toBe(0);
      expect(est.discount).toBe(0);
      expect(est.notes).toBe('');
      expect(est.variant).toBe('standard');
    });

    it('should render base container', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      const container = queryShadow(est, '.est');
      expect(container).toBeTruthy();
    });
  });

  describe('header', () => {
    it('should display estimate number', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.estimateNumber = 'EST-2024-001';
      await wait(10);
      const title = queryShadow(est, '.est__title');
      expect(title?.textContent).toContain('EST-2024-001');
    });

    it('should display date', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.date = '2024-03-15';
      await wait(10);
      const date = queryShadow(est, '.est__subtitle');
      expect(date?.textContent).toBe('2024-03-15');
    });

    it('should display status badge', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        status: 'sent'
      });
      await wait(10);
      const badge = queryShadow(est, '.est__status--sent');
      expect(badge).toBeTruthy();
    });

    it('should display expiry date', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.expiryDate = '2024-04-15';
      await wait(10);
      const expiry = queryShadow(est, '.est__expiry');
      expect(expiry?.textContent).toContain('2024-04-15');
    });
  });

  describe('parties', () => {
    it('should render from/to sections', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.from = { name: 'My Company', email: 'hello@myco.com' };
      est.to = { name: 'Client Corp', email: 'info@client.com' };
      await wait(10);
      const parties = queryShadow(est, '.est__parties');
      expect(parties).toBeTruthy();
    });

    it('should not render parties when both null', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      await wait(10);
      const parties = queryShadow(est, '.est__parties');
      expect(parties).toBeFalsy();
    });

    it('should display party name', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.from = { name: 'My Company' };
      await wait(10);
      const name = queryShadow(est, '.est__party-name');
      expect(name?.textContent).toBe('My Company');
    });
  });

  describe('items', () => {
    const testItems: EstimateItem[] = [
      { description: 'Web Design', quantity: 1, unitPrice: 2500 },
      { description: 'SEO Audit', quantity: 1, unitPrice: 800, optional: true },
      { description: 'Content Writing', quantity: 5, unitPrice: 150 }
    ];

    it('should accept items array', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.items = testItems;
      await wait(10);
      expect(est.items.length).toBe(3);
      const json = est.toJSON();
      expect(json.subtotal).toBe(2500 + 800 + 5 * 150);
    });

    it('should identify optional items', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.items = testItems;
      await wait(10);
      const optionalItems = est.items.filter((item: EstimateItem) => item.optional);
      expect(optionalItems.length).toBe(1);
      expect(optionalItems[0].description).toBe('SEO Audit');
    });

    it('should support toggling optional items', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.items = testItems;
      await wait(10);
      // Optional item at index 1 is included by default
      const jsonBefore = est.toJSON();
      const subtotalWithOptional = jsonBefore.subtotal;
      // Toggle the optional item off via the private handler
      (est as any).handleItemToggle(1);
      await wait(10);
      const jsonAfter = est.toJSON();
      expect(jsonAfter.subtotal).toBe(subtotalWithOptional - 800);
    });

    it('should emit item-toggle on toggle', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.items = [{ description: 'Optional item', quantity: 1, unitPrice: 100, optional: true }];
      await wait(10);

      const handler = vi.fn();
      est.addEventListener('item-toggle', handler);

      (est as any).handleItemToggle(0);
      await wait(10);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not render items section when empty', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      await wait(10);
      const section = queryShadow(est, '[part="items-section"]');
      expect(section).toBeFalsy();
    });
  });

  describe('totals', () => {
    it('should calculate subtotal correctly', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.items = [
        { description: 'Item 1', quantity: 2, unitPrice: 100 },
        { description: 'Item 2', quantity: 1, unitPrice: 50 }
      ];
      await wait(10);

      const json = est.toJSON();
      expect(json.subtotal).toBe(250);
    });

    it('should apply discount', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.items = [{ description: 'Item', quantity: 1, unitPrice: 100 }];
      est.discount = 10;
      await wait(10);

      const json = est.toJSON();
      expect(json.discountAmount).toBe(10);
      expect(json.total).toBe(90);
    });

    it('should apply tax', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.items = [{ description: 'Item', quantity: 1, unitPrice: 100 }];
      est.taxRate = 10;
      await wait(10);

      const json = est.toJSON();
      expect(json.taxAmount).toBe(10);
      expect(json.total).toBe(110);
    });

    it('should compute discount when discount > 0', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.items = [{ description: 'Item', quantity: 1, unitPrice: 100 }];
      est.discount = 15;
      await wait(10);
      const json = est.toJSON();
      expect(json.discountAmount).toBe(15);
      expect(json.total).toBe(85);
    });

    it('should compute tax when taxRate > 0', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.items = [{ description: 'Item', quantity: 1, unitPrice: 100 }];
      est.taxRate = 8;
      await wait(10);
      const json = est.toJSON();
      expect(json.taxAmount).toBe(8);
      expect(json.total).toBe(108);
    });

    it('should exclude optional items from total when toggled off', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.items = [
        { description: 'Required', quantity: 1, unitPrice: 100 },
        { description: 'Optional', quantity: 1, unitPrice: 50, optional: true, included: false }
      ];
      await wait(10);

      const json = est.toJSON();
      expect(json.subtotal).toBe(100);
    });
  });

  describe('actions', () => {
    it('should have actionable status when sent or draft', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        status: 'sent'
      });
      await wait(10);
      // Verify the component considers sent/draft as actionable
      expect(est.status).toBe('sent');
      // The renderActions method should produce content for actionable statuses
      const result = (est as any).renderActions();
      expect(result).not.toBe('');
    });

    it('should not render actions when status is accepted', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        status: 'accepted'
      });
      await wait(10);
      const actions = queryShadow(est, '.est__actions');
      expect(actions).toBeFalsy();
    });

    it('should emit estimate-accept event', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        status: 'sent'
      });
      est.estimateNumber = 'EST-001';
      est.items = [{ description: 'Item', quantity: 1, unitPrice: 100 }];
      await wait(10);

      const handler = vi.fn();
      est.addEventListener('estimate-accept', handler);

      (est as any).handleAccept();
      await wait(10);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail.estimateNumber).toBe('EST-001');
    });

    it('should emit estimate-decline event', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        status: 'sent'
      });
      est.estimateNumber = 'EST-001';
      await wait(10);

      const handler = vi.fn();
      est.addEventListener('estimate-decline', handler);

      (est as any).handleDecline();
      await wait(10);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail.estimateNumber).toBe('EST-001');
    });
  });

  describe('variant', () => {
    it('should default to standard', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      expect(est.variant).toBe('standard');
    });

    it('should render comparison view', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        variant: 'comparison'
      });
      est.items = [
        { description: 'Basic Package', quantity: 1, unitPrice: 500 },
        { description: 'Premium Package', quantity: 1, unitPrice: 1200 }
      ];
      await wait(10);
      const comparison = queryShadow(est, '.est__comparison');
      expect(comparison).toBeTruthy();
    });
  });

  describe('methods', () => {
    it('should return JSON representation', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.estimateNumber = 'EST-001';
      est.status = 'sent';
      est.items = [
        { description: 'Item 1', quantity: 2, unitPrice: 100 },
        { description: 'Item 2', quantity: 1, unitPrice: 200 }
      ];
      est.taxRate = 10;
      est.discount = 5;

      const json = est.toJSON();
      expect(json.estimateNumber).toBe('EST-001');
      expect(json.status).toBe('sent');
      expect(json.subtotal).toBe(400);
      expect(json.discountAmount).toBe(20);
      expect(json.taxAmount).toBeCloseTo(38);
      expect(json.total).toBeCloseTo(418);
    });
  });

  describe('notes', () => {
    it('should store notes', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.notes = 'Payment due within 30 days';
      await wait(10);
      expect(est.notes).toBe('Payment due within 30 days');
      const json = est.toJSON();
      expect(json.notes).toBe('Payment due within 30 days');
    });

    it('should not render notes when empty', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      await wait(10);
      const section = queryShadow(est, '[part="notes-section"]');
      expect(section).toBeFalsy();
    });
  });
});
