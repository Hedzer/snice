import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/receipt/snice-receipt';
import type { SniceReceiptElement } from '../../components/receipt/snice-receipt.types';

describe('snice-receipt', () => {
  let receipt: SniceReceiptElement;

  afterEach(() => {
    if (receipt) {
      removeComponent(receipt as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render receipt element', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      expect(receipt).toBeTruthy();
      expect(receipt.tagName.toLowerCase()).toBe('snice-receipt');
    });

    it('should have default properties', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      expect(receipt.receiptNumber).toBe('');
      expect(receipt.date).toBe('');
      expect(receipt.currency).toBe('USD');
      expect(receipt.locale).toBe('');
      expect(receipt.tax).toBe(0);
      expect(receipt.subtotal).toBe(0);
      expect(receipt.total).toBe(0);
      expect(receipt.tip).toBe(0);
      expect(receipt.discount).toBe(0);
      expect(receipt.discountLabel).toBe('Discount');
      expect(receipt.paymentMethod).toBe('');
      expect(receipt.paymentDetails).toBe('');
      expect(receipt.variant).toBe('standard');
      expect(receipt.showQr).toBe(false);
      expect(receipt.qrData).toBe('');
      expect(receipt.qrPosition).toBe('bottom');
      expect(receipt.thankYou).toBe('Thank you for your purchase!');
      expect(receipt.cashier).toBe('');
      expect(receipt.terminalId).toBe('');
    });

    it('should render base container with part', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      const base = queryShadow(receipt, '[part="base"]');
      expect(base).toBeTruthy();
    });
  });

  describe('merchant info', () => {
    it('should display merchant name', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.merchant = { name: 'Coffee Shop' };
      await wait(10);
      const name = queryShadow(receipt, '[part="merchant-name"]');
      expect(name?.textContent).toBe('Coffee Shop');
    });

    it('should display merchant address', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.merchant = { name: 'Coffee Shop', address: '123 Brew St' };
      await wait(10);
      const address = queryShadow(receipt, '[part="merchant-address"]');
      expect(address?.textContent).toBe('123 Brew St');
    });

    it('should display merchant contact info', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.merchant = { name: 'Shop', phone: '555-0100', email: 'info@shop.com' };
      await wait(10);
      const contact = queryShadow(receipt, '[part="merchant-contact"]');
      expect(contact?.textContent).toContain('555-0100');
      expect(contact?.textContent).toContain('info@shop.com');
    });

    it('should display merchant logo', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.merchant = { name: 'Shop', logo: 'https://example.com/logo.png' };
      await wait(10);
      const logo = queryShadow(receipt, '[part="logo"]');
      expect(logo).toBeTruthy();
      expect(logo?.getAttribute('src')).toBe('https://example.com/logo.png');
    });

    it('should hide header when no merchant', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      await wait(10);
      const header = queryShadow(receipt, '[part="header"]');
      expect(header).toBeFalsy();
    });
  });

  describe('meta info', () => {
    it('should display receipt number', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.receiptNumber = 'REC-001';
      await wait(10);
      const value = queryShadow(receipt, '[part="receipt-number"]');
      expect(value?.textContent).toBe('REC-001');
    });

    it('should display date', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt', {
        date: '2026-02-27'
      });
      await wait(10);
      const value = queryShadow(receipt, '[part="date"]');
      expect(value?.textContent).toBe('2026-02-27');
    });

    it('should display cashier', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.cashier = 'Jane D.';
      await wait(10);
      const meta = queryShadow(receipt, '[part="meta"]');
      expect(meta?.textContent).toContain('Jane D.');
    });

    it('should display terminal ID', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.terminalId = 'T-04';
      await wait(10);
      const meta = queryShadow(receipt, '[part="meta"]');
      expect(meta?.textContent).toContain('T-04');
    });
  });

  describe('items', () => {
    it('should render item rows', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.items = [
        { name: 'Latte', quantity: 1, price: 4.50 },
        { name: 'Muffin', quantity: 2, price: 3.00 }
      ];
      await wait(10);
      const items = queryShadowAll(receipt, '[part="item"]');
      expect(items.length).toBe(2);
    });

    it('should show quantity when > 1', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.items = [
        { name: 'Cookie', quantity: 3, price: 2.00 }
      ];
      await wait(10);
      const qty = queryShadow(receipt, '[part="item-qty"]');
      expect(qty?.textContent).toBe('x3');
    });

    it('should hide quantity when 1', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.items = [
        { name: 'Cookie', quantity: 1, price: 2.00 }
      ];
      await wait(10);
      const qty = queryShadow(receipt, '[part="item-qty"]');
      expect(qty).toBeFalsy();
    });

    it('should display item name', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.items = [{ name: 'Espresso', quantity: 1, price: 3.00 }];
      await wait(10);
      const name = queryShadow(receipt, '[part="item-name"]');
      expect(name?.textContent).toBe('Espresso');
    });

    it('should display item price', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.items = [{ name: 'Tea', quantity: 1, price: 2.50 }];
      await wait(10);
      const price = queryShadow(receipt, '[part="item-price"]');
      expect(price?.textContent).toBeTruthy();
    });

    it('should show SKU in detailed variant', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt', {
        variant: 'detailed'
      });
      receipt.items = [{ name: 'Widget', quantity: 1, price: 10, sku: 'WDG-001' }];
      await wait(10);
      const sku = queryShadow(receipt, '[part="item-sku"]');
      expect(sku?.textContent).toBe('WDG-001');
    });
  });

  describe('totals', () => {
    it('should compute subtotal from items when not set', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.items = [
        { name: 'A', quantity: 2, price: 10 },
        { name: 'B', quantity: 1, price: 20 }
      ];
      await wait(10);
      const subtotalRow = queryShadow(receipt, '[part="subtotal-row"]');
      expect(subtotalRow).toBeTruthy();
    });

    it('should use explicit subtotal when provided', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.subtotal = 100;
      receipt.total = 110;
      receipt.tax = 10;
      await wait(10);
      const rows = queryShadowAll(receipt, '.receipt__total-row');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should display tax when > 0', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.tax = 5.25;
      receipt.total = 55.25;
      await wait(10);
      const taxRow = queryShadow(receipt, '[part="tax-row"]');
      expect(taxRow).toBeTruthy();
    });

    it('should hide tax row when 0', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.total = 50;
      await wait(10);
      const taxRow = queryShadow(receipt, '[part="tax-row"]');
      expect(taxRow).toBeFalsy();
    });

    it('should show grand total', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.total = 42.50;
      await wait(10);
      const totalRow = queryShadow(receipt, '[part="total-row"]');
      expect(totalRow).toBeTruthy();
    });

    it('should display discount row', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.discount = 5;
      receipt.total = 45;
      await wait(10);
      const discountRow = queryShadow(receipt, '[part="discount-row"]');
      expect(discountRow).toBeTruthy();
    });

    it('should display custom discount label', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.discount = 10;
      receipt.discountLabel = 'Promo Code';
      receipt.total = 90;
      await wait(10);
      const discountRow = queryShadow(receipt, '[part="discount-row"]');
      expect(discountRow?.textContent).toContain('Promo Code');
    });

    it('should display tip row', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.tip = 8.00;
      receipt.total = 58;
      await wait(10);
      const tipRow = queryShadow(receipt, '[part="tip-row"]');
      expect(tipRow).toBeTruthy();
    });

    it('should display multiple tax lines', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.taxes = [
        { label: 'State Tax', rate: 6, amount: 3.00 },
        { label: 'City Tax', rate: 2, amount: 1.00 }
      ];
      receipt.total = 54;
      await wait(10);
      const taxRows = queryShadowAll(receipt, '[part="tax-row"]');
      expect(taxRows.length).toBe(2);
    });
  });

  describe('payment method', () => {
    it('should display payment method', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.paymentMethod = 'Visa **** 4242';
      await wait(10);
      const payment = queryShadow(receipt, '[part="payment-method"]');
      expect(payment?.textContent).toBe('Visa **** 4242');
    });

    it('should hide payment section when empty', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      await wait(10);
      const payment = queryShadow(receipt, '[part="payment"]');
      expect(payment).toBeFalsy();
    });

    it('should display payment details', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.paymentMethod = 'Card';
      receipt.paymentDetails = 'Auth #: 123456';
      await wait(10);
      const details = queryShadow(receipt, '[part="payment-details"]');
      expect(details?.textContent).toBe('Auth #: 123456');
    });
  });

  describe('variants', () => {
    it('should default to standard variant', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      expect(receipt.variant).toBe('standard');
    });

    it('should accept thermal variant', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt', {
        variant: 'thermal'
      });
      expect(receipt.variant).toBe('thermal');
      expect(receipt.getAttribute('variant')).toBe('thermal');
    });

    it('should accept modern variant', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt', {
        variant: 'modern'
      });
      expect(receipt.variant).toBe('modern');
      expect(receipt.getAttribute('variant')).toBe('modern');
    });

    it('should accept minimal variant', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt', {
        variant: 'minimal'
      });
      expect(receipt.variant).toBe('minimal');
      expect(receipt.getAttribute('variant')).toBe('minimal');
    });

    it('should accept detailed variant', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt', {
        variant: 'detailed'
      });
      expect(receipt.variant).toBe('detailed');
      expect(receipt.getAttribute('variant')).toBe('detailed');
    });
  });

  describe('QR code', () => {
    it('should not show QR slot by default', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      const qr = queryShadow(receipt, '[part="qr-container"]');
      expect(qr).toBeFalsy();
    });

    it('should show QR slot when show-qr is set', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt', {
        'show-qr': true
      });
      await wait(10);
      const qr = queryShadow(receipt, '[part="qr-container"]');
      expect(qr).toBeTruthy();
    });

    it('should default qr-position to bottom', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      expect(receipt.qrPosition).toBe('bottom');
    });

    it('should accept qr-position top', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt', {
        'show-qr': true
      });
      receipt.qrPosition = 'top';
      await wait(10);
      expect(receipt.qrPosition).toBe('top');
    });

    it('should accept qr-position footer', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt', {
        'show-qr': true
      });
      receipt.qrPosition = 'footer';
      await wait(10);
      expect(receipt.qrPosition).toBe('footer');
    });
  });

  describe('footer', () => {
    it('should display thank-you message', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      const thankYou = queryShadow(receipt, '[part="thank-you"]');
      expect(thankYou?.textContent).toBe('Thank you for your purchase!');
    });

    it('should accept custom thank-you text', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.thankYou = 'Thanks for visiting!';
      await wait(10);
      const thankYou = queryShadow(receipt, '[part="thank-you"]');
      expect(thankYou?.textContent).toBe('Thanks for visiting!');
    });

    it('should render footer part', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      const footer = queryShadow(receipt, '[part="footer"]');
      expect(footer).toBeTruthy();
    });
  });

  describe('CSS parts', () => {
    it('should expose all required parts', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.merchant = { name: 'Shop', logo: 'logo.png', address: '123 St', phone: '555' };
      receipt.receiptNumber = 'R-1';
      receipt.date = '2026-01-01';
      receipt.items = [{ name: 'Item', quantity: 2, price: 5 }];
      receipt.tax = 1;
      receipt.tip = 2;
      receipt.discount = 0.50;
      receipt.paymentMethod = 'Cash';
      receipt.paymentDetails = 'Change: $1.00';
      receipt.showQr = true;
      receipt.total = 12.50;
      await wait(10);

      const parts = [
        'base', 'header', 'logo', 'merchant-name', 'merchant-address',
        'merchant-contact', 'meta', 'receipt-number', 'date',
        'items', 'item', 'item-name', 'item-qty', 'item-price',
        'items-header',
        'totals', 'subtotal-row', 'tax-row', 'total-row', 'tip-row', 'discount-row',
        'payment', 'payment-method', 'payment-details',
        'footer', 'thank-you', 'qr-container', 'barcode-area', 'divider'
      ];

      for (const part of parts) {
        const el = queryShadow(receipt, `[part="${part}"]`);
        expect(el, `part="${part}" should exist`).toBeTruthy();
      }
    });
  });

  describe('print method', () => {
    it('should have print method', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      expect(typeof receipt.print).toBe('function');
    });
  });

  describe('currency formatting', () => {
    it('should format with default USD', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.items = [{ name: 'Test', quantity: 1, price: 9.99 }];
      await wait(10);
      const price = queryShadow(receipt, '[part="item-price"]');
      expect(price?.textContent).toContain('9.99');
    });

    it('should support different currencies', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt', {
        currency: 'EUR'
      });
      receipt.items = [{ name: 'Test', quantity: 1, price: 15.00 }];
      await wait(10);
      const price = queryShadow(receipt, '[part="item-price"]');
      expect(price?.textContent).toBeTruthy();
    });
  });
});
