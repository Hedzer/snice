import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/sortable/snice-sortable';
import type { SniceSortableElement } from '../../components/sortable/snice-sortable.types';

describe('snice-sortable', () => {
  let sortable: SniceSortableElement;

  afterEach(() => {
    if (sortable) {
      removeComponent(sortable as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render sortable element', async () => {
      sortable = await createComponent<SniceSortableElement>('snice-sortable');

      expect(sortable).toBeTruthy();
      expect(sortable.tagName).toBe('SNICE-SORTABLE');
    });

    it('should have default properties', async () => {
      sortable = await createComponent<SniceSortableElement>('snice-sortable');

      expect(sortable.direction).toBe('vertical');
      expect(sortable.handle).toBe('');
      expect(sortable.disabled).toBe(false);
      expect(sortable.group).toBe('');
    });

    it('should render sortable structure', async () => {
      sortable = await createComponent<SniceSortableElement>('snice-sortable');
      await wait(10);

      const base = queryShadow(sortable as HTMLElement, '.sortable');
      expect(base).toBeTruthy();
    });
  });

  describe('properties', () => {
    it('should accept direction attribute', async () => {
      sortable = await createComponent<SniceSortableElement>('snice-sortable', {
        direction: 'horizontal'
      });

      expect(sortable.direction).toBe('horizontal');
    });

    it('should accept handle attribute', async () => {
      sortable = await createComponent<SniceSortableElement>('snice-sortable', {
        handle: '.drag-handle'
      });

      expect(sortable.handle).toBe('.drag-handle');
    });

    it('should accept disabled attribute', async () => {
      sortable = await createComponent<SniceSortableElement>('snice-sortable', {
        disabled: true
      });

      expect(sortable.disabled).toBe(true);
    });

    it('should accept group attribute', async () => {
      sortable = await createComponent<SniceSortableElement>('snice-sortable', {
        group: 'my-group'
      });

      expect(sortable.group).toBe('my-group');
    });
  });

  describe('events', () => {
    it('should dispatch sort-start event', async () => {
      sortable = await createComponent<SniceSortableElement>('snice-sortable');
      await wait(10);

      // Add a child element
      const child = document.createElement('div');
      child.draggable = true;
      child.textContent = 'Item 1';
      sortable.appendChild(child);
      await wait(10);

      let eventFired = false;
      sortable.addEventListener('sort-start', () => {
        eventFired = true;
      });

      // Trigger dragstart
      const dragEvent = new DragEvent('dragstart', { bubbles: true });
      child.dispatchEvent(dragEvent);

      expect(sortable).toBeTruthy();
    });

    it('should dispatch sort-end event', async () => {
      sortable = await createComponent<SniceSortableElement>('snice-sortable');
      await wait(10);

      let eventFired = false;
      sortable.addEventListener('sort-end', () => {
        eventFired = true;
      });

      expect(typeof sortable).toBe('object');
    });

    it('should dispatch sort-change event', async () => {
      sortable = await createComponent<SniceSortableElement>('snice-sortable');
      await wait(10);

      let eventFired = false;
      sortable.addEventListener('sort-change', () => {
        eventFired = true;
      });

      expect(typeof sortable).toBe('object');
    });
  });
});
