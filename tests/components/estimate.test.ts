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
      expect(est.terms).toBe('');
      expect(est.variant).toBe('standard');
      expect(est.showQr).toBe(false);
      expect(est.qrData).toBe('');
      expect(est.qrPosition).toBe('top-right');
    });

    it('should render base container', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      const container = queryShadow(est, '[part="base"]');
      expect(container).toBeTruthy();
    });
  });

  describe('header', () => {
    it('should display estimate number', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.estimateNumber = 'EST-2024-001';
      await wait(10);
      const title = queryShadow(est, '[part="title"]');
      expect(title?.textContent).toContain('EST-2024-001');
    });

    it('should display date', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.date = '2024-03-15';
      await wait(10);
      const meta = queryShadow(est, '[part="meta"]');
      expect(meta?.textContent).toBe('2024-03-15');
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
      const expiry = queryShadow(est, '[part="expiry"]');
      expect(expiry?.textContent).toContain('2024-04-15');
    });

    it('should render logo slot', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      await wait(10);
      const logo = queryShadow(est, '[part="logo"]');
      expect(logo).toBeTruthy();
    });
  });

  describe('parties', () => {
    it('should render from/to sections', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.from = { name: 'My Company', email: 'hello@myco.com' };
      est.to = { name: 'Client Corp', email: 'info@client.com' };
      await wait(10);
      const parties = queryShadow(est, '[part="parties"]');
      expect(parties).toBeTruthy();
    });

    it('should not render parties when both null', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      await wait(10);
      const parties = queryShadow(est, '[part="parties"]');
      expect(parties).toBeFalsy();
    });

    it('should display party name', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.from = { name: 'My Company' };
      await wait(10);
      const name = queryShadow(est, '[part="party-name"]');
      expect(name?.textContent).toBe('My Company');
    });

    it('should display party label', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.from = { name: 'Test Co' };
      await wait(10);
      const label = queryShadow(est, '[part="party-label"]');
      expect(label?.textContent).toBe('From');
    });

    it('should display party details', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.from = { name: 'Test Co', address: '123 Main St', phone: '555-1234', email: 'test@test.com' };
      await wait(10);
      const details = queryShadowAll(est, '[part="party-detail"]');
      expect(details.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('items table', () => {
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

    it('should render table with parts', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.items = testItems;
      await wait(10);
      const table = queryShadow(est, '[part="table"]');
      expect(table).toBeTruthy();
      const header = queryShadow(est, '[part="table-header"]');
      expect(header).toBeTruthy();
      const rows = queryShadowAll(est, '[part="table-row"]');
      expect(rows.length).toBe(3);
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
      const jsonBefore = est.toJSON();
      const subtotalWithOptional = jsonBefore.subtotal;
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

    it('should not render table when no items', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      await wait(10);
      const table = queryShadow(est, '[part="table"]');
      expect(table).toBeFalsy();
    });

    it('should render item-toggle part on optional items', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.items = [{ description: 'Optional', quantity: 1, unitPrice: 100, optional: true }];
      await wait(10);
      const toggle = queryShadow(est, '[part="item-toggle"]');
      expect(toggle).toBeTruthy();
    });
  });

  describe('summary/totals', () => {
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

    it('should render summary parts', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.items = [{ description: 'Item', quantity: 1, unitPrice: 100 }];
      est.taxRate = 10;
      est.discount = 5;
      await wait(10);

      const summary = queryShadow(est, '[part="summary"]');
      expect(summary).toBeTruthy();
      const subtotal = queryShadow(est, '[part="subtotal"]');
      expect(subtotal).toBeTruthy();
      const taxRow = queryShadow(est, '[part="tax-row"]');
      expect(taxRow).toBeTruthy();
      const discountRow = queryShadow(est, '[part="discount-row"]');
      expect(discountRow).toBeTruthy();
      const total = queryShadow(est, '[part="total"]');
      expect(total).toBeTruthy();
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
    it('should render actions when status is sent or draft', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        status: 'sent'
      });
      await wait(10);
      const actions = queryShadow(est, '[part="actions"]');
      expect(actions).toBeTruthy();
    });

    it('should not render actions when status is accepted', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        status: 'accepted'
      });
      await wait(10);
      const actions = queryShadow(est, '[part="actions"]');
      expect(actions).toBeFalsy();
    });

    it('should render accept and decline buttons', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        status: 'sent'
      });
      await wait(10);
      const acceptBtn = queryShadow(est, '[part="accept-button"]');
      const declineBtn = queryShadow(est, '[part="decline-button"]');
      expect(acceptBtn).toBeTruthy();
      expect(declineBtn).toBeTruthy();
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

  describe('variants', () => {
    it('should default to standard', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      expect(est.variant).toBe('standard');
    });

    it('should accept comparison variant', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        variant: 'comparison'
      });
      est.items = [
        { description: 'Basic Package', quantity: 1, unitPrice: 500 },
        { description: 'Premium Package', quantity: 1, unitPrice: 1200 }
      ];
      await wait(10);
      const comparison = queryShadow(est, '[part="comparison"]');
      expect(comparison).toBeTruthy();
    });

    it('should render option cards in comparison variant', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        variant: 'comparison'
      });
      est.items = [
        { description: 'Basic', quantity: 1, unitPrice: 500 },
        { description: 'Pro', quantity: 1, unitPrice: 1000 }
      ];
      await wait(10);
      const options = queryShadowAll(est, '[part="option"]');
      expect(options.length).toBe(2);
      const buttons = queryShadowAll(est, '[part="option-button"]');
      expect(buttons.length).toBe(2);
    });

    it('should accept professional variant', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        variant: 'professional'
      });
      await wait(10);
      expect(est.variant).toBe('professional');
      expect(est.getAttribute('variant')).toBe('professional');
    });

    it('should accept creative variant', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        variant: 'creative'
      });
      await wait(10);
      expect(est.variant).toBe('creative');
      expect(est.getAttribute('variant')).toBe('creative');
    });

    it('should accept minimal variant', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        variant: 'minimal'
      });
      await wait(10);
      expect(est.variant).toBe('minimal');
      expect(est.getAttribute('variant')).toBe('minimal');
    });

    it('should render standard table in non-comparison variants', async () => {
      for (const v of ['standard', 'professional', 'creative', 'minimal'] as const) {
        est = await createComponent<SniceEstimateElement>('snice-estimate', { variant: v });
        est.items = [{ description: 'Item', quantity: 1, unitPrice: 100 }];
        await wait(10);
        const table = queryShadow(est, '[part="table"]');
        expect(table).toBeTruthy();
        removeComponent(est as HTMLElement);
      }
    });
  });

  describe('QR code', () => {
    it('should not render QR container when showQr is false', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      await wait(10);
      const qr = queryShadow(est, '[part="qr-container"]');
      expect(qr).toBeFalsy();
    });

    it('should render QR container when showQr is true', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        showQr: true
      });
      await wait(10);
      const qr = queryShadow(est, '[part="qr-container"]');
      expect(qr).toBeTruthy();
    });

    it('should accept qrData property', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.qrData = 'https://example.com/quote/123';
      await wait(10);
      expect(est.qrData).toBe('https://example.com/quote/123');
    });

    it('should position QR top-right by default', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        showQr: true
      });
      await wait(10);
      const qr = queryShadow(est, '.est__qr--top-right');
      expect(qr).toBeTruthy();
    });

    it('should position QR bottom-right', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        showQr: true,
        qrPosition: 'bottom-right'
      });
      est.items = [{ description: 'Item', quantity: 1, unitPrice: 100 }];
      await wait(10);
      const qr = queryShadow(est, '.est__qr--bottom-right');
      expect(qr).toBeTruthy();
    });

    it('should position QR in footer', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        showQr: true,
        qrPosition: 'footer'
      });
      est.items = [{ description: 'Item', quantity: 1, unitPrice: 100 }];
      await wait(10);
      const qr = queryShadow(est, '.est__qr--footer');
      expect(qr).toBeTruthy();
    });

    it('should render qr slot', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        showQr: true
      });
      await wait(10);
      const slot = queryShadow(est, 'slot[name="qr"]');
      expect(slot).toBeTruthy();
    });
  });

  describe('notes and terms', () => {
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
      const section = queryShadow(est, '[part="notes"]');
      expect(section).toBeFalsy();
    });

    it('should render notes parts', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.notes = 'Test note';
      await wait(10);
      const notes = queryShadow(est, '[part="notes"]');
      expect(notes).toBeTruthy();
      const label = queryShadow(est, '[part="notes-label"]');
      expect(label).toBeTruthy();
      const content = queryShadow(est, '[part="notes-content"]');
      expect(content).toBeTruthy();
    });

    it('should store terms', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.terms = 'All work subject to standard T&Cs';
      await wait(10);
      expect(est.terms).toBe('All work subject to standard T&Cs');
      const json = est.toJSON();
      expect(json.terms).toBe('All work subject to standard T&Cs');
    });

    it('should not render terms when empty', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      await wait(10);
      const terms = queryShadow(est, '[part="terms"]');
      expect(terms).toBeFalsy();
    });

    it('should render terms section', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate');
      est.terms = 'Standard terms apply';
      await wait(10);
      const terms = queryShadow(est, '[part="terms"]');
      expect(terms).toBeTruthy();
    });
  });

  describe('CSS parts', () => {
    it('should expose all required parts', async () => {
      est = await createComponent<SniceEstimateElement>('snice-estimate', {
        status: 'sent',
        showQr: true,
        qrPosition: 'top-right'
      });
      est.from = { name: 'Sender' };
      est.to = { name: 'Receiver' };
      est.items = [
        { description: 'Item', quantity: 1, unitPrice: 100 },
        { description: 'Optional', quantity: 1, unitPrice: 50, optional: true }
      ];
      est.notes = 'A note';
      est.terms = 'A term';
      est.taxRate = 10;
      est.discount = 5;
      await wait(10);

      const requiredParts = [
        'base', 'header', 'title', 'status',
        'parties', 'party', 'party-label', 'party-name',
        'table', 'table-header', 'table-row', 'table-cell',
        'item-toggle',
        'summary', 'subtotal', 'tax-row', 'discount-row', 'total',
        'actions', 'accept-button', 'decline-button',
        'notes', 'notes-label', 'notes-content',
        'terms',
        'qr-container',
        'footer'
      ];

      for (const part of requiredParts) {
        const el = queryShadow(est, `[part="${part}"]`);
        expect(el, `Part "${part}" should exist`).toBeTruthy();
      }
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
      est.notes = 'A note';
      est.terms = 'A term';

      const json = est.toJSON();
      expect(json.estimateNumber).toBe('EST-001');
      expect(json.status).toBe('sent');
      expect(json.subtotal).toBe(400);
      expect(json.discountAmount).toBe(20);
      expect(json.taxAmount).toBeCloseTo(38);
      expect(json.total).toBeCloseTo(418);
      expect(json.notes).toBe('A note');
      expect(json.terms).toBe('A term');
    });
  });
});
