import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/menu/snice-menu';
import '../../components/menu/snice-menu-item';
import '../../components/menu/snice-menu-divider';
import type { SniceMenuElement } from '../../components/menu/snice-menu.types';
import type { SniceMenuItemElement } from '../../components/menu/snice-menu-item.types';

describe('snice-menu', () => {
  let menu: SniceMenuElement;

  afterEach(() => {
    if (menu) {
      removeComponent(menu as HTMLElement);
    }
  });

  it('should render menu element', async () => {
    menu = await createComponent<SniceMenuElement>('snice-menu');
    expect(menu).toBeTruthy();
  });

  it('should default to closed', async () => {
    menu = await createComponent<SniceMenuElement>('snice-menu');
    expect(menu.open).toBe(false);
  });

  it('should default to bottom-start placement', async () => {
    menu = await createComponent<SniceMenuElement>('snice-menu');
    expect(menu.placement).toBe('bottom-start');
  });

  it('should default to click trigger', async () => {
    menu = await createComponent<SniceMenuElement>('snice-menu');
    expect(menu.trigger).toBe('click');
  });

  it('should default to closeOnSelect=true', async () => {
    menu = await createComponent<SniceMenuElement>('snice-menu');
    expect(menu.closeOnSelect).toBe(true);
  });

  it('should default distance to 4', async () => {
    menu = await createComponent<SniceMenuElement>('snice-menu');
    expect(menu.distance).toBe(4);
  });

  describe('Properties', () => {
    it('should support open property', async () => {
      menu = await createComponent<SniceMenuElement>('snice-menu', { open: true });
      expect(menu.open).toBe(true);
    });

    it('should support placement property', async () => {
      menu = await createComponent<SniceMenuElement>('snice-menu', { placement: 'top-end' });
      expect(menu.placement).toBe('top-end');
    });

    it('should support trigger property', async () => {
      menu = await createComponent<SniceMenuElement>('snice-menu', { trigger: 'hover' });
      expect(menu.trigger).toBe('hover');
    });

    it('should support closeOnSelect property', async () => {
      menu = await createComponent<SniceMenuElement>('snice-menu', { closeOnSelect: false });
      expect(menu.closeOnSelect).toBe(false);
    });

    it('should support distance property', async () => {
      menu = await createComponent<SniceMenuElement>('snice-menu', { distance: 8 });
      expect(menu.distance).toBe(8);
    });
  });

  describe('API methods', () => {
    it('should openMenu() work', async () => {
      menu = await createComponent<SniceMenuElement>('snice-menu');
      menu.openMenu();
      await wait(50);
      expect(menu.open).toBe(true);
    });

    it('should closeMenu() work', async () => {
      menu = await createComponent<SniceMenuElement>('snice-menu', { open: true });
      menu.closeMenu();
      await wait(50);
      expect(menu.open).toBe(false);
    });

    it('should toggleMenu() work', async () => {
      menu = await createComponent<SniceMenuElement>('snice-menu');
      menu.toggleMenu();
      await wait(50);
      expect(menu.open).toBe(true);

      menu.toggleMenu();
      await wait(50);
      expect(menu.open).toBe(false);
    });
  });

  describe('Events', () => {
    it('should dispatch @snice/menu-open event when opened', async () => {
      menu = await createComponent<SniceMenuElement>('snice-menu');

      let eventFired = false;
      menu.addEventListener('@snice/menu-open', () => {
        eventFired = true;
      });

      menu.openMenu();
      await wait(50);

      expect(eventFired).toBe(true);
    });

    it('should dispatch @snice/menu-close event when closed', async () => {
      menu = await createComponent<SniceMenuElement>('snice-menu', { open: true });

      let eventFired = false;
      menu.addEventListener('@snice/menu-close', () => {
        eventFired = true;
      });

      menu.closeMenu();
      await wait(50);

      expect(eventFired).toBe(true);
    });

    it('should close on menu item select when closeOnSelect=true', async () => {
      menu = document.createElement('snice-menu') as SniceMenuElement;
      menu.open = true;
      menu.closeOnSelect = true;

      const item = document.createElement('snice-menu-item') as SniceMenuItemElement;
      item.value = 'test';

      menu.appendChild(item);
      document.body.appendChild(menu);

      await wait(50);

      // Simulate item click
      item.click();
      await wait(50);

      expect(menu.open).toBe(false);
    });

    it('should not close on menu item select when closeOnSelect=false', async () => {
      menu = document.createElement('snice-menu') as SniceMenuElement;
      menu.open = true;
      menu.closeOnSelect = false;

      const item = document.createElement('snice-menu-item') as SniceMenuItemElement;
      item.value = 'test';

      menu.appendChild(item);
      document.body.appendChild(menu);

      await wait(50);

      // Simulate item click
      item.click();
      await wait(50);

      expect(menu.open).toBe(true);
    });
  });

  describe('Trigger modes', () => {
    it('should handle click trigger', async () => {
      menu = document.createElement('snice-menu') as SniceMenuElement;
      menu.trigger = 'click';

      const trigger = document.createElement('button');
      trigger.slot = 'trigger';
      trigger.textContent = 'Click me';
      menu.appendChild(trigger);

      document.body.appendChild(menu);
      await wait(50);

      const shadowTrigger = menu.shadowRoot?.querySelector('.menu__trigger') as HTMLElement;
      expect(shadowTrigger).toBeTruthy();

      shadowTrigger?.click();
      await wait(50);

      expect(menu.open).toBe(true);
    });

    it('should handle manual trigger', async () => {
      menu = await createComponent<SniceMenuElement>('snice-menu', { trigger: 'manual' });

      // Menu should not open automatically
      expect(menu.open).toBe(false);

      // But can be opened programmatically
      menu.openMenu();
      await wait(50);
      expect(menu.open).toBe(true);
    });
  });
});

describe('snice-menu-item', () => {
  let item: SniceMenuItemElement;

  afterEach(() => {
    if (item) {
      removeComponent(item as HTMLElement);
    }
  });

  it('should render menu item element', async () => {
    item = await createComponent<SniceMenuItemElement>('snice-menu-item');
    expect(item).toBeTruthy();
  });

  it('should default to enabled', async () => {
    item = await createComponent<SniceMenuItemElement>('snice-menu-item');
    expect(item.disabled).toBe(false);
  });

  it('should default to not selected', async () => {
    item = await createComponent<SniceMenuItemElement>('snice-menu-item');
    expect(item.selected).toBe(false);
  });

  it('should default to empty value', async () => {
    item = await createComponent<SniceMenuItemElement>('snice-menu-item');
    expect(item.value).toBe('');
  });

  it('should support disabled property', async () => {
    item = await createComponent<SniceMenuItemElement>('snice-menu-item', { disabled: true });
    expect(item.disabled).toBe(true);
  });

  it('should support selected property', async () => {
    item = await createComponent<SniceMenuItemElement>('snice-menu-item', { selected: true });
    expect(item.selected).toBe(true);
  });

  it('should support value property', async () => {
    item = await createComponent<SniceMenuItemElement>('snice-menu-item', { value: 'test' });
    expect(item.value).toBe('test');
  });

  it('should dispatch @snice/menu-item-select event when clicked', async () => {
    item = await createComponent<SniceMenuItemElement>('snice-menu-item', { value: 'test' });

    let eventDetail: any = null;
    item.addEventListener('@snice/menu-item-select', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    item.click();
    await wait(50);

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.value).toBe('test');
  });

  it('should not dispatch event when disabled', async () => {
    item = await createComponent<SniceMenuItemElement>('snice-menu-item', {
      value: 'test',
      disabled: true
    });

    let eventFired = false;
    item.addEventListener('@snice/menu-item-select', () => {
      eventFired = true;
    });

    item.click();
    await wait(50);

    expect(eventFired).toBe(false);
  });
});

describe('snice-menu-divider', () => {
  it('should render menu divider element', async () => {
    const divider = await createComponent('snice-menu-divider');
    expect(divider).toBeTruthy();
    removeComponent(divider);
  });
});
