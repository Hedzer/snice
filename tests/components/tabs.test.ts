import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, trackRenders } from './test-utils';
import '../../components/tabs/snice-tabs';
import '../../components/tabs/snice-tab';
import '../../components/tabs/snice-tab-panel';
import type { SniceTabElement } from '../../components/tabs/snice-tabs.types';

describe('snice-tabs', () => {
  let container: HTMLElement;

  afterEach(() => {
    if (container) {
      removeComponent(container);
    }
  });

  // Helper to create a tabs structure
  async function createTabsStructure(options: {
    tabCount?: number;
    selected?: number;
    placement?: string;
    noScrollControls?: boolean;
  } = {}) {
    const { tabCount = 3, selected = 0, placement = 'top', noScrollControls = false } = options;

    container = document.createElement('div');
    document.body.appendChild(container);

    const tabs = document.createElement('snice-tabs') as any;
    if (selected !== undefined) tabs.selected = selected;
    if (placement) tabs.placement = placement;
    if (noScrollControls) tabs.noScrollControls = noScrollControls;

    for (let i = 0; i < tabCount; i++) {
      const tab = document.createElement('snice-tab');
      tab.setAttribute('slot', 'nav');
      tab.textContent = `Tab ${i + 1}`;
      tabs.appendChild(tab);
    }

    for (let i = 0; i < tabCount; i++) {
      const panel = document.createElement('snice-tab-panel');
      panel.textContent = `Panel ${i + 1}`;
      tabs.appendChild(panel);
    }

    container.appendChild(tabs);
    await tabs.ready;

    // Wait for setup
    await new Promise(resolve => setTimeout(resolve, 50));

    return tabs;
  }

  it('should render tabs element', async () => {
    const tabs = await createTabsStructure();
    expect(tabs).toBeTruthy();
  });

  it('should have default selected index of 0', async () => {
    const tabs = await createTabsStructure();
    expect(tabs.selected).toBe(0);
  });

  it('should support custom selected index', async () => {
    const tabs = await createTabsStructure({ selected: 1 });
    expect(tabs.selected).toBe(1);
  });

  it('should have default placement of top', async () => {
    const tabs = await createTabsStructure();
    expect(tabs.placement).toBe('top');
  });

  it('should support bottom placement', async () => {
    const tabs = await createTabsStructure({ placement: 'bottom' });
    expect(tabs.placement).toBe('bottom');
  });

  it('should support start placement', async () => {
    const tabs = await createTabsStructure({ placement: 'start' });
    expect(tabs.placement).toBe('start');
  });

  it('should support end placement', async () => {
    const tabs = await createTabsStructure({ placement: 'end' });
    expect(tabs.placement).toBe('end');
  });

  it('should show scroll controls by default', async () => {
    const tabs = await createTabsStructure();

    const scrollStart = queryShadow(tabs as HTMLElement, '.tabs__scroll-button--start');
    const scrollEnd = queryShadow(tabs as HTMLElement, '.tabs__scroll-button--end');

    expect(scrollStart).toBeTruthy();
    expect(scrollEnd).toBeTruthy();
  });

  it('should hide scroll controls when noScrollControls is true', async () => {
    const tabs = await createTabsStructure({ noScrollControls: true });

    const scrollStart = queryShadow(tabs as HTMLElement, '.tabs__scroll-button--start');
    const scrollEnd = queryShadow(tabs as HTMLElement, '.tabs__scroll-button--end');

    expect(scrollStart).toBeFalsy();
    expect(scrollEnd).toBeFalsy();
  });

  it('should render indicator element', async () => {
    const tabs = await createTabsStructure();

    const indicator = queryShadow(tabs as HTMLElement, '.tabs__indicator');
    expect(indicator).toBeTruthy();
  });

  it('should mark selected tab as active', async () => {
    const tabs = await createTabsStructure({ selected: 1 });

    const tabElements = tabs.querySelectorAll('snice-tab');
    expect(tabElements[1].classList.contains('snice-tab--active')).toBe(true);
    expect(tabElements[0].classList.contains('snice-tab--active')).toBe(false);
  });

  it('should set aria-selected on selected tab', async () => {
    const tabs = await createTabsStructure({ selected: 1 });

    const tabElements = tabs.querySelectorAll('snice-tab');
    expect(tabElements[1].getAttribute('aria-selected')).toBe('true');
    expect(tabElements[0].getAttribute('aria-selected')).toBe('false');
  });

  it('should show selected panel and hide others', async () => {
    const tabs = await createTabsStructure({ selected: 1 });

    const panels = tabs.querySelectorAll('snice-tab-panel');
    expect(panels[1].hidden).toBe(false);
    expect(panels[0].hidden).toBe(true);
    expect(panels[2].hidden).toBe(true);
  });

  it('should dispatch tab-change event when selecting tab', async () => {
    const tabs = await createTabsStructure();

    let eventDetail: any = null;
    tabs.addEventListener('tab-change', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    tabs.selectTab(2);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.index).toBe(2);
    expect(eventDetail.oldIndex).toBe(0);
  });

  it('should change tab with selectTab() method', async () => {
    const tabs = await createTabsStructure({ selected: 0 });

    tabs.selectTab(2);
    expect(tabs.selected).toBe(2);
  });

  it('should not select invalid tab index', async () => {
    const tabs = await createTabsStructure({ selected: 0, tabCount: 3 });

    tabs.selectTab(5);
    expect(tabs.selected).toBe(0); // Should stay the same

    tabs.selectTab(-1);
    expect(tabs.selected).toBe(0); // Should stay the same
  });

  it('should change tab with show() method', async () => {
    const tabs = await createTabsStructure({ selected: 0 });

    tabs.show(1);
    expect(tabs.selected).toBe(1);
  });

  it('should get tab by index with getTab()', async () => {
    const tabs = await createTabsStructure({ tabCount: 3 });

    const tab = tabs.getTab(1);
    expect(tab).toBeTruthy();
    expect(tab?.textContent?.trim()).toBe('Tab 2');
  });

  it('should get panel by index with getPanel()', async () => {
    const tabs = await createTabsStructure({ tabCount: 3 });

    const panel = tabs.getPanel(1);
    expect(panel).toBeTruthy();
    expect(panel?.textContent?.trim()).toBe('Panel 2');
  });

  it('should respond to tab click', async () => {
    const tabs = await createTabsStructure({ selected: 0 });

    const tabElements = tabs.querySelectorAll('snice-tab');
    const tabEl = tabElements[2] as SniceTabElement;

    // Get the actual tab div inside shadow root
    const tabDiv = queryShadow(tabEl as HTMLElement, '.tab') as HTMLElement;
    tabDiv?.click();

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(tabs.selected).toBe(2);
  });

  it('should update selection when selected property changes', async () => {
    const tabs = await createTabsStructure({ selected: 0 });

    tabs.selected = 2;
    await new Promise(resolve => setTimeout(resolve, 50));

    const tabElements = tabs.querySelectorAll('snice-tab');
    expect(tabElements[2].classList.contains('snice-tab--active')).toBe(true);
  });

  it('should support transition property', async () => {
    const tabs = await createTabsStructure();

    tabs.transition = 'fade';
    expect(tabs.transition).toBe('fade');
  });
});

describe('snice-tab', () => {
  let tab: any;

  afterEach(() => {
    if (tab) {
      removeComponent(tab as HTMLElement);
    }
  });

  it('should render tab element', async () => {
    tab = await createComponent('snice-tab');
    expect(tab).toBeTruthy();
  });

  it('should not be disabled by default', async () => {
    tab = await createComponent('snice-tab');
    expect(tab.disabled).toBe(false);
  });

  it('should support disabled state', async () => {
    tab = await createComponent('snice-tab', { disabled: true });
    expect(tab.disabled).toBe(true);

    const tabDiv = queryShadow(tab as HTMLElement, '.tab');
    expect(tabDiv?.classList.contains('tab--disabled')).toBe(true);
  });

  it('should not be closable by default', async () => {
    tab = await createComponent('snice-tab');
    expect(tab.closable).toBe(false);

    const closeBtn = queryShadow(tab as HTMLElement, '.tab__close');
    expect(closeBtn).toBeFalsy();
  });

  it('should show close button when closable', async () => {
    tab = await createComponent('snice-tab', { closable: true });
    expect(tab.closable).toBe(true);

    const closeBtn = queryShadow(tab as HTMLElement, '.tab__close');
    expect(closeBtn).toBeTruthy();
  });

  it('should display slotted content', async () => {
    tab = document.createElement('snice-tab');
    tab.textContent = 'Test Tab';
    document.body.appendChild(tab);
    await tab.ready;

    expect(tab.textContent.trim()).toBe('Test Tab');
  });

  it('should dispatch tab-select event on click', async () => {
    tab = await createComponent('snice-tab');

    let eventDetail: any = null;
    (tab as HTMLElement).addEventListener('tab-select', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    const tabDiv = queryShadow(tab as HTMLElement, '.tab') as HTMLElement;
    tabDiv?.click();

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.tab).toBe(tab);
  });

  it('should not dispatch select event when disabled', async () => {
    tab = await createComponent('snice-tab', { disabled: true });

    let eventFired = false;
    (tab as HTMLElement).addEventListener('tab-select', () => {
      eventFired = true;
    });

    const tabDiv = queryShadow(tab as HTMLElement, '.tab') as HTMLElement;
    tabDiv?.click();

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(eventFired).toBe(false);
  });

  it('should dispatch close event when close button clicked', async () => {
    tab = await createComponent('snice-tab', { closable: true });

    let eventDetail: any = null;
    (tab as HTMLElement).addEventListener('tab-close', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    const closeBtn = queryShadow(tab as HTMLElement, '.tab__close') as HTMLElement;
    closeBtn?.click();

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.tab).toBe(tab);
  });

  it('should have focus() method', async () => {
    tab = await createComponent('snice-tab');

    expect(typeof tab.focus).toBe('function');
    tab.focus(); // Should not throw
  });

  it('should have blur() method', async () => {
    tab = await createComponent('snice-tab');

    expect(typeof tab.blur).toBe('function');
    tab.blur(); // Should not throw
  });
});

describe('snice-tab-panel', () => {
  let panel: any;

  afterEach(() => {
    if (panel) {
      removeComponent(panel as HTMLElement);
    }
  });

  it('should render tab panel element', async () => {
    panel = await createComponent('snice-tab-panel');
    expect(panel).toBeTruthy();
  });

  it('should have empty name by default', async () => {
    panel = await createComponent('snice-tab-panel');
    expect(panel.name).toBe('');
  });

  it('should support name property', async () => {
    panel = await createComponent('snice-tab-panel', { name: 'test-panel' });
    expect(panel.name).toBe('test-panel');
  });

  it('should display slotted content', async () => {
    panel = document.createElement('snice-tab-panel');
    panel.textContent = 'Panel content';
    document.body.appendChild(panel);
    await panel.ready;

    expect(panel.textContent.trim()).toBe('Panel content');
  });

  it('should support transitionIn property', async () => {
    panel = await createComponent('snice-tab-panel');
    const tracker = trackRenders(panel as HTMLElement);

    panel.transitionIn = 'fade';
    await tracker.next();

    expect(panel.transitionIn).toBe('fade');
    expect(panel.transitioning).toBe('in');
  });

  it('should support transitionOut property', async () => {
    panel = await createComponent('snice-tab-panel');
    const tracker = trackRenders(panel as HTMLElement);

    panel.transitionOut = 'fade';
    await tracker.next();

    expect(panel.transitionOut).toBe('fade');
    expect(panel.transitioning).toBe('out');
  });

  it('should support transitionDuration property', async () => {
    panel = await createComponent('snice-tab-panel', { transitionDuration: 500 });
    expect(panel.transitionDuration).toBe(500);
  });

  it('should update name dynamically', async () => {
    panel = await createComponent('snice-tab-panel', { name: 'initial' });
    const tracker = trackRenders(panel as HTMLElement);

    panel.name = 'updated';
    await tracker.next();

    expect(panel.name).toBe('updated');
  });
});
