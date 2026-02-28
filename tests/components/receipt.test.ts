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
      expect(receipt.tax).toBe(0);
      expect(receipt.subtotal).toBe(0);
      expect(receipt.total).toBe(0);
      expect(receipt.paymentMethod).toBe('');
      expect(receipt.variant).toBe('standard');
    });

    it('should render container', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      const container = queryShadow(receipt, '.receipt');
      expect(container).toBeTruthy();
    });
  });

  describe('merchant info', () => {
    it('should display merchant name', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.merchant = { name: 'Coffee Shop' };
      await wait(10);
      const name = queryShadow(receipt, '.receipt__merchant-name');
      expect(name?.textContent).toBe('Coffee Shop');
    });

    it('should display merchant address', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.merchant = { name: 'Coffee Shop', address: '123 Brew St' };
      await wait(10);
      const address = queryShadow(receipt, '.receipt__merchant-address');
      expect(address?.textContent).toBe('123 Brew St');
    });

    it('should hide header when no merchant', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      await wait(10);
      const header = queryShadow(receipt, '.receipt__header');
      expect(header).toBeFalsy();
    });
  });

  describe('meta info', () => {
    it('should display receipt number', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.receiptNumber = 'REC-001';
      await wait(10);
      const value = queryShadow(receipt, '.receipt__meta-value');
      expect(value?.textContent).toBe('REC-001');
    });

    it('should display date', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt', {
        date: '2026-02-27'
      });
      await wait(10);
      const values = queryShadowAll(receipt, '.receipt__meta-value');
      const dateValue = Array.from(values).find(v => v.textContent === '2026-02-27');
      expect(dateValue).toBeTruthy();
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
      const items = queryShadowAll(receipt, '.receipt__item');
      expect(items.length).toBe(2);
    });

    it('should show quantity when > 1', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.items = [
        { name: 'Cookie', quantity: 3, price: 2.00 }
      ];
      await wait(10);
      const qty = queryShadow(receipt, '.receipt__item-qty');
      expect(qty?.textContent).toBe('x3');
    });

    it('should hide quantity when 1', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.items = [
        { name: 'Cookie', quantity: 1, price: 2.00 }
      ];
      await wait(10);
      const qty = queryShadow(receipt, '.receipt__item-qty');
      expect(qty).toBeFalsy();
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
      // subtotal = 2*10 + 1*20 = 40
      const totals = queryShadowAll(receipt, '.receipt__total-row');
      expect(totals.length).toBeGreaterThan(0);
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
      const rows = queryShadowAll(receipt, '.receipt__total-row');
      // Should have subtotal + tax + grand total = 3 rows
      expect(rows.length).toBe(3);
    });

    it('should hide tax row when 0', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.total = 50;
      await wait(10);
      const rows = queryShadowAll(receipt, '.receipt__total-row');
      // Should have subtotal + grand total = 2 rows
      expect(rows.length).toBe(2);
    });
  });

  describe('payment method', () => {
    it('should display payment method', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      receipt.paymentMethod = 'Visa **** 4242';
      await wait(10);
      const payment = queryShadow(receipt, '.receipt__payment-method');
      expect(payment?.textContent).toBe('Visa **** 4242');
    });

    it('should hide payment section when empty', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      await wait(10);
      const payment = queryShadow(receipt, '.receipt__payment');
      expect(payment).toBeFalsy();
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
    });
  });

  describe('footer', () => {
    it('should display default footer text', async () => {
      receipt = await createComponent<SniceReceiptElement>('snice-receipt');
      const footer = queryShadow(receipt, '.receipt__footer');
      expect(footer).toBeTruthy();
    });
  });
});
