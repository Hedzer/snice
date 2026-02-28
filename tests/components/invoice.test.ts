import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/invoice/snice-invoice';
import type { SniceInvoiceElement, InvoiceItem } from '../../components/invoice/snice-invoice.types';

describe('snice-invoice', () => {
  let invoice: SniceInvoiceElement;

  afterEach(() => {
    if (invoice) {
      removeComponent(invoice as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render invoice element', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      expect(invoice).toBeTruthy();
      expect(invoice.tagName.toLowerCase()).toBe('snice-invoice');
    });

    it('should have default properties', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      expect(invoice.invoiceNumber).toBe('');
      expect(invoice.date).toBe('');
      expect(invoice.dueDate).toBe('');
      expect(invoice.status).toBe('draft');
      expect(invoice.currency).toBe('USD');
      expect(invoice.taxRate).toBe(0);
      expect(invoice.discount).toBe(0);
      expect(invoice.notes).toBe('');
      expect(invoice.variant).toBe('standard');
    });

    it('should render container', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      const container = queryShadow(invoice, '.invoice');
      expect(container).toBeTruthy();
    });
  });

  describe('header and meta', () => {
    it('should display invoice number', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.invoiceNumber = 'INV-001';
      await wait(10);
      const meta = queryShadow(invoice, '.invoice__meta-value');
      expect(meta?.textContent).toBe('INV-001');
    });

    it('should display status badge', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
        status: 'paid'
      });
      await wait(10);
      const status = queryShadow(invoice, '.invoice__status--paid');
      expect(status).toBeTruthy();
    });

    it('should display title', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      const title = queryShadow(invoice, '.invoice__title');
      expect(title?.textContent).toBe('Invoice');
    });
  });

  describe('status variants', () => {
    const statuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;

    for (const status of statuses) {
      it(`should apply ${status} status class`, async () => {
        invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
          status
        });
        await wait(10);
        const badge = queryShadow(invoice, `.invoice__status--${status}`);
        expect(badge).toBeTruthy();
      });
    }
  });

  describe('parties', () => {
    it('should display from party', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.from = { name: 'Acme Corp', address: '123 Main St' };
      await wait(10);
      const partyName = queryShadow(invoice, '.invoice__party-name');
      expect(partyName?.textContent).toBe('Acme Corp');
    });

    it('should display to party', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.from = { name: 'Seller' };
      invoice.to = { name: 'Client Inc', address: '456 Oak Ave', email: 'billing@client.com' };
      await wait(10);
      const partyNames = queryShadowAll(invoice, '.invoice__party-name');
      expect(partyNames.length).toBe(2);
    });
  });

  describe('items and calculations', () => {
    const testItems: InvoiceItem[] = [
      { description: 'Widget A', quantity: 2, unitPrice: 50 },
      { description: 'Widget B', quantity: 1, unitPrice: 100 }
    ];

    it('should render item rows', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.items = testItems;
      await wait(10);
      const rows = queryShadowAll(invoice, 'tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should calculate subtotal correctly', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.items = testItems;
      await wait(10);
      const json = invoice.toJSON() as any;
      expect(json.subtotal).toBe(200); // 2*50 + 1*100
    });

    it('should calculate tax correctly', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.taxRate = 10;
      invoice.items = testItems;
      await wait(10);
      const json = invoice.toJSON() as any;
      expect(json.tax).toBe(20); // 200 * 10%
    });

    it('should calculate discount correctly', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.discount = 10;
      invoice.items = testItems;
      await wait(10);
      const json = invoice.toJSON() as any;
      expect(json.discount_amount).toBe(20); // 200 * 10%
    });

    it('should calculate total with tax and discount', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.taxRate = 10;
      invoice.discount = 10;
      invoice.items = testItems;
      await wait(10);
      const json = invoice.toJSON() as any;
      // subtotal: 200, discount: 20, after discount: 180, tax: 18, total: 198
      expect(json.total).toBe(198);
    });

    it('should use item.amount when provided', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.items = [{ description: 'Custom', quantity: 1, unitPrice: 100, amount: 75 }];
      await wait(10);
      const json = invoice.toJSON() as any;
      expect(json.subtotal).toBe(75);
    });
  });

  describe('toJSON', () => {
    it('should return complete invoice data', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
        status: 'sent',
        currency: 'EUR'
      });
      invoice.invoiceNumber = 'INV-042';
      invoice.from = { name: 'Seller Corp' };
      invoice.to = { name: 'Buyer Inc' };
      invoice.items = [{ description: 'Service', quantity: 1, unitPrice: 500 }];
      await wait(10);

      const json = invoice.toJSON() as any;
      expect(json.invoiceNumber).toBe('INV-042');
      expect(json.status).toBe('sent');
      expect(json.currency).toBe('EUR');
      expect(json.from.name).toBe('Seller Corp');
      expect(json.to.name).toBe('Buyer Inc');
      expect(json.items.length).toBe(1);
      expect(json.subtotal).toBe(500);
      expect(json.total).toBe(500);
    });
  });

  describe('notes', () => {
    it('should display notes when provided', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
        notes: 'Payment due within 30 days'
      });
      await wait(10);
      const notes = queryShadow(invoice, '.invoice__notes');
      expect(notes).toBeTruthy();
    });

    it('should hide notes when empty', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      await wait(10);
      const notes = queryShadow(invoice, '.invoice__notes');
      expect(notes).toBeFalsy();
    });
  });

  describe('variants', () => {
    it('should default to standard variant', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      expect(invoice.variant).toBe('standard');
    });

    it('should accept compact variant', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
        variant: 'compact'
      });
      expect(invoice.variant).toBe('compact');
    });

    it('should accept detailed variant', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
        variant: 'detailed'
      });
      expect(invoice.variant).toBe('detailed');
    });
  });

  describe('events', () => {
    it('should emit invoice-status-change on status change', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
        status: 'draft'
      });
      await wait(10);

      let eventDetail: any;
      invoice.addEventListener('invoice-status-change', (e: Event) => {
        eventDetail = (e as CustomEvent).detail;
      });

      invoice.status = 'sent';
      await wait(10);

      expect(eventDetail).toBeTruthy();
      expect(eventDetail.oldStatus).toBe('draft');
      expect(eventDetail.newStatus).toBe('sent');
    });

    it('should emit invoice-item-change on items change', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      await wait(10);

      let eventDetail: any;
      invoice.addEventListener('invoice-item-change', (e: Event) => {
        eventDetail = (e as CustomEvent).detail;
      });

      invoice.items = [{ description: 'Test', quantity: 2, unitPrice: 100 }];
      await wait(10);

      expect(eventDetail).toBeTruthy();
      expect(eventDetail.subtotal).toBe(200);
      expect(eventDetail.total).toBe(200);
    });
  });
});
