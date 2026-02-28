import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/data-card/snice-data-card';
import type { SniceDataCardElement, DataCardField } from '../../components/data-card/snice-data-card.types';

describe('snice-data-card', () => {
  let card: SniceDataCardElement;

  afterEach(() => {
    if (card) {
      removeComponent(card as HTMLElement);
    }
  });

  const sampleFields: DataCardField[] = [
    { label: 'Name', value: 'John Doe', type: 'text' },
    { label: 'Email', value: 'john@example.com', type: 'link', href: 'mailto:john@example.com' },
    { label: 'Status', value: 'Active', type: 'badge', badgeVariant: 'success' },
    { label: 'Created', value: '2024-01-15', type: 'date' },
    { label: 'Balance', value: '$1,250.00', type: 'currency' }
  ];

  describe('basic functionality', () => {
    it('should render data card element', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      expect(card).toBeTruthy();
      expect(card.tagName.toLowerCase()).toBe('snice-data-card');
    });

    it('should have default properties', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      expect(card.fields).toEqual([]);
      expect(card.editable).toBe(false);
      expect(card.variant).toBe('default');
    });

    it('should render container', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      const container = queryShadow(card, '.data-card');
      expect(container).toBeTruthy();
    });
  });

  describe('field rendering', () => {
    it('should render fields', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      card.fields = sampleFields;
      await wait(10);
      const fields = queryShadowAll(card, '.field');
      expect(fields.length).toBe(5);
    });

    it('should render field labels', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      card.fields = sampleFields;
      await wait(10);
      const labels = queryShadowAll(card, '.field__label');
      expect(labels[0]?.textContent).toBe('Name');
      expect(labels[1]?.textContent).toBe('Email');
    });

    it('should render text field values', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      card.fields = [{ label: 'Name', value: 'John Doe' }];
      await wait(10);
      const value = queryShadow(card, '.field__value');
      expect(value?.textContent).toBe('John Doe');
    });

    it('should render link values', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      card.fields = [{ label: 'Website', value: 'example.com', type: 'link', href: 'https://example.com' }];
      await wait(10);
      const link = queryShadow(card, '.field__value--link');
      expect(link).toBeTruthy();
      expect(link?.getAttribute('href')).toBe('https://example.com');
    });

    it('should render badge values', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      card.fields = [{ label: 'Status', value: 'Active', type: 'badge', badgeVariant: 'success' }];
      await wait(10);
      const badge = queryShadow(card, '.field__value--badge-success');
      expect(badge).toBeTruthy();
    });

    it('should render date values', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      card.fields = [{ label: 'Created', value: '2024-01-15', type: 'date' }];
      await wait(10);
      const date = queryShadow(card, '.field__value--date');
      expect(date).toBeTruthy();
    });

    it('should render currency values', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      card.fields = [{ label: 'Amount', value: '$1,250.00', type: 'currency' }];
      await wait(10);
      const currency = queryShadow(card, '.field__value--currency');
      expect(currency).toBeTruthy();
    });

    it('should render field icons when provided', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      card.fields = [{ label: 'Phone', value: '555-0123', icon: '📞' }];
      await wait(10);
      const icon = queryShadow(card, '.field__icon');
      expect(icon).toBeTruthy();
    });
  });

  describe('grouping', () => {
    it('should group fields by group property', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      card.fields = [
        { label: 'Name', value: 'John', group: 'Personal' },
        { label: 'Age', value: '30', group: 'Personal' },
        { label: 'Company', value: 'Acme', group: 'Work' }
      ];
      await wait(10);
      const groups = queryShadowAll(card, '.data-card__group');
      expect(groups.length).toBe(2);
    });

    it('should render group titles', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      card.fields = [
        { label: 'Name', value: 'John', group: 'Personal' },
        { label: 'Company', value: 'Acme', group: 'Work' }
      ];
      await wait(10);
      const titles = queryShadowAll(card, '.data-card__group-title');
      expect(titles[0]?.textContent).toBe('Personal');
      expect(titles[1]?.textContent).toBe('Work');
    });
  });

  describe('edit mode', () => {
    it('should show edit toggle button', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      card.fields = [{ label: 'Name', value: 'John' }];
      await wait(10);
      const toggle = queryShadow(card, '.data-card__edit-toggle');
      expect(toggle).toBeTruthy();
    });

    it('should toggle edit mode on button click', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      card.fields = [{ label: 'Name', value: 'John' }];
      await wait(10);

      const toggle = queryShadow(card, '.data-card__edit-toggle') as HTMLElement;
      toggle.click();
      await wait(10);

      expect(card.editable).toBe(true);
    });

    it('should show edit buttons when editable', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card', {
        editable: true
      });
      card.fields = [{ label: 'Name', value: 'John' }];
      await wait(10);
      const editBtn = queryShadow(card, '[part="field-edit"]');
      expect(editBtn).toBeTruthy();
    });
  });

  describe('methods', () => {
    it('should get all values via getValues()', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      card.fields = [
        { label: 'Name', value: 'John' },
        { label: 'Age', value: 30 }
      ];
      await wait(10);

      const values = card.getValues();
      expect(values).toEqual({ Name: 'John', Age: 30 });
    });

    it('should set values via setValues()', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      card.fields = [
        { label: 'Name', value: 'John' },
        { label: 'Age', value: 30 }
      ];
      await wait(10);

      card.setValues({ Name: 'Jane', Age: 25 });
      await wait(10);

      const values = card.getValues();
      expect(values).toEqual({ Name: 'Jane', Age: 25 });
    });
  });

  describe('variant', () => {
    it('should accept default variant', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card');
      expect(card.variant).toBe('default');
    });

    it('should accept horizontal variant', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card', {
        variant: 'horizontal'
      });
      expect(card.variant).toBe('horizontal');
    });

    it('should accept compact variant', async () => {
      card = await createComponent<SniceDataCardElement>('snice-data-card', {
        variant: 'compact'
      });
      expect(card.variant).toBe('compact');
    });
  });
});
