import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../packages/components/src/invoice/snice-invoice';
import type { SniceInvoiceElement, InvoiceItem } from '../../packages/components/src/invoice/snice-invoice.types';

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
      expect(invoice.showQr).toBe(false);
      expect(invoice.qrData).toBe('');
      expect(invoice.qrPosition).toBe('bottom-right');
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
      expect(json.subtotal).toBe(200);
    });

    it('should calculate tax correctly', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.taxRate = 10;
      invoice.items = testItems;
      await wait(10);
      const json = invoice.toJSON() as any;
      expect(json.tax).toBe(20);
    });

    it('should calculate discount correctly', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.discount = 10;
      invoice.items = testItems;
      await wait(10);
      const json = invoice.toJSON() as any;
      expect(json.discount_amount).toBe(20);
    });

    it('should calculate total with tax and discount', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.taxRate = 10;
      invoice.discount = 10;
      invoice.items = testItems;
      await wait(10);
      const json = invoice.toJSON() as any;
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

    it('should include variant and QR fields', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
        variant: 'modern'
      });
      invoice.showQr = true;
      invoice.qrData = 'https://pay.example.com/inv-001';
      invoice.qrPosition = 'footer';
      await wait(10);

      const json = invoice.toJSON() as any;
      expect(json.variant).toBe('modern');
      expect(json.showQr).toBe(true);
      expect(json.qrData).toBe('https://pay.example.com/inv-001');
      expect(json.qrPosition).toBe('footer');
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
    const variants = ['standard', 'modern', 'classic', 'minimal', 'detailed'] as const;

    it('should default to standard variant', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      expect(invoice.variant).toBe('standard');
    });

    for (const variant of variants) {
      it(`should accept ${variant} variant`, async () => {
        invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
          variant
        });
        expect(invoice.variant).toBe(variant);
        expect(invoice.getAttribute('variant')).toBe(variant);
      });

      it(`should render correctly with ${variant} variant`, async () => {
        invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
          variant
        });
        invoice.from = { name: 'Seller' };
        invoice.to = { name: 'Buyer' };
        invoice.items = [{ description: 'Item', quantity: 1, unitPrice: 100 }];
        await wait(10);

        const container = queryShadow(invoice, '.invoice');
        expect(container).toBeTruthy();

        const table = queryShadow(invoice, '.invoice__table');
        expect(table).toBeTruthy();
      });
    }

    it('should show line numbers in detailed variant', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
        variant: 'detailed'
      });
      invoice.items = [
        { description: 'Item A', quantity: 1, unitPrice: 100 },
        { description: 'Item B', quantity: 2, unitPrice: 50 }
      ];
      await wait(10);

      const lineNums = queryShadowAll(invoice, '.invoice__item-line-num');
      expect(lineNums.length).toBe(2);
      expect(lineNums[0]?.textContent).toBe('1');
      expect(lineNums[1]?.textContent).toBe('2');
    });

    it('should show line number column header in detailed variant', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
        variant: 'detailed'
      });
      invoice.items = [{ description: 'Item', quantity: 1, unitPrice: 100 }];
      await wait(10);

      const headers = queryShadowAll(invoice, 'thead th');
      expect(headers.length).toBe(5);
    });
  });

  describe('QR code', () => {
    it('should not render QR when show-qr is false', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      await wait(10);
      const qr = queryShadow(invoice, '.invoice__qr');
      expect(qr).toBeFalsy();
    });

    it('should render QR slot when show-qr is true', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.showQr = true;
      await wait(10);
      const qr = queryShadow(invoice, '.invoice__qr');
      expect(qr).toBeTruthy();
    });

    it('should show placeholder when no slot content', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.showQr = true;
      await wait(10);
      const placeholder = queryShadow(invoice, '.invoice__qr-placeholder');
      expect(placeholder).toBeTruthy();
    });

    it('should apply correct position class', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.showQr = true;
      invoice.qrPosition = 'footer';
      await wait(10);
      const qr = queryShadow(invoice, '.invoice__qr--footer');
      expect(qr).toBeTruthy();
    });

    it('should render QR in top-right position', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.showQr = true;
      invoice.qrPosition = 'top-right';
      await wait(10);
      const qr = queryShadow(invoice, '.invoice__qr--top-right');
      expect(qr).toBeTruthy();
    });

    it('should render QR in bottom-left position', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.showQr = true;
      invoice.qrPosition = 'bottom-left';
      await wait(10);
      const qr = queryShadow(invoice, '.invoice__qr--bottom-left');
      expect(qr).toBeTruthy();
    });
  });

  describe('CSS parts', () => {
    it('should have all required CSS parts', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
        notes: 'Test notes'
      });
      invoice.from = { name: 'Seller', logo: 'logo.png', address: '123 Main St', email: 'test@test.com' };
      invoice.to = { name: 'Buyer', address: '456 Oak Ave' };
      invoice.items = [{ description: 'Item', quantity: 1, unitPrice: 100 }];
      invoice.showQr = true;
      invoice.qrPosition = 'footer';
      await wait(10);

      const requiredParts = [
        'base', 'header', 'title', 'status', 'logo', 'meta',
        'parties', 'party', 'party-label', 'party-name', 'party-detail',
        'table', 'table-header', 'table-row', 'table-cell',
        'summary', 'summary-row', 'summary-label', 'summary-value',
        'total',
        'notes', 'notes-label', 'notes-content',
        'qr', 'qr-container',
        'footer'
      ];

      for (const part of requiredParts) {
        const el = queryShadow(invoice, `[part~="${part}"]`);
        expect(el, `Missing part: ${part}`).toBeTruthy();
      }
    });

    it('should have discount-row part when discount set', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.discount = 10;
      invoice.items = [{ description: 'Item', quantity: 1, unitPrice: 100 }];
      await wait(10);
      const discountRow = queryShadow(invoice, '[part~="discount-row"]');
      expect(discountRow).toBeTruthy();
    });

    it('should have tax-row part when tax set', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      invoice.taxRate = 10;
      invoice.items = [{ description: 'Item', quantity: 1, unitPrice: 100 }];
      await wait(10);
      const taxRow = queryShadow(invoice, '[part~="tax-row"]');
      expect(taxRow).toBeTruthy();
    });
  });

  describe('print method', () => {
    it('should have print method', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice');
      expect(typeof invoice.print).toBe('function');
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

  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/invoice/snice-invoice.css');

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

  describe('attribute contract', () => {
    it('observes the documented kebab-case QR attributes', () => {
      const observed = (customElements.get('snice-invoice') as any).observedAttributes as string[];
      expect(observed).toContain('show-qr');
      expect(observed).toContain('qr-data');
      expect(observed).toContain('qr-position');
      expect(observed).toContain('invoice-number');
      expect(observed).toContain('due-date');
      expect(observed).toContain('tax-rate');
    });
  });

  describe('slots', () => {
    it.each([['logo'], ['title'], ['status'], ['parties'], ['before-items'], ['after-items'], ['notes'], ['qr']])(
      'ships a named %s slot',
      async (name) => {
        invoice = await createComponent<SniceInvoiceElement>('snice-invoice', name === 'qr' ? { 'show-qr': true } : {});
        await wait(50);
        expect(invoice.shadowRoot!.querySelector(`slot[name="${name}"]`), name).toBeTruthy();
      }
    );

    it('assigns slotted content and keeps fallbacks otherwise', async () => {
      const el = document.createElement('snice-invoice');
      el.innerHTML = '<span slot="title">Tax Invoice</span><div slot="before-items">PO-4477 attached</div>';
      document.body.appendChild(el);
      await new Promise(r => setTimeout(r, 50));

      const titleSlot = el.shadowRoot!.querySelector('slot[name="title"]') as HTMLSlotElement;
      expect(titleSlot.assignedNodes().map(n => n.textContent).join('')).toContain('Tax Invoice');
      const statusSlot = el.shadowRoot!.querySelector('slot[name="status"]') as HTMLSlotElement;
      expect(statusSlot.assignedNodes().length).toBe(0); // fallback in effect
      el.remove();
    });
  });

  describe('paper variant', () => {
    it.each([['paper'], ['ink'], ['ledger'], ['ticket']])('accepts variant="%s" and ships its stylesheet block', async (v) => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice', { variant: v });
      await wait(50);

      expect(invoice.variant).toBe(v);
      const css = readFileSync(resolve(process.cwd(), 'packages/components/src/invoice/snice-invoice.css'), 'utf8');
      expect(css).toContain(`:host([variant="${v}"])`);
    });
  });

  describe('QR layout', () => {
    it('reserves header space when the QR sits top-right so it cannot cover the date', async () => {
      invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
        'show-qr': true,
        'qr-position': 'top-right',
        date: '2026-03-06',
      });
      await wait(50);

      const header = queryShadow(invoice as HTMLElement, '.invoice__header');
      expect(header?.classList.contains('invoice__header--qr-top-right')).toBe(true);
    });

    it.each([['bottom-right'], ['bottom-left']])(
      'reserves a bottom band when the QR sits %s so it cannot cover the totals',
      async (position) => {
        invoice = await createComponent<SniceInvoiceElement>('snice-invoice', {
          'show-qr': true,
          'qr-position': position,
        });
        await wait(50);

        const root = queryShadow(invoice as HTMLElement, '.invoice');
        expect(root?.classList.contains('invoice--qr-bottom')).toBe(true);
      }
    );
  });
});