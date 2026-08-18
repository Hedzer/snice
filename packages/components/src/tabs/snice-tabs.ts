import { element, property, query, queryAll, watch, ready, dispose, dispatch, on, render, styles, html, css } from 'snice';
import cssContent from './snice-tabs.css?inline';
import type { TabsPlacement, SniceTabElement, SniceTabPanelElement, TabChangeDetail, TabSelectDetail } from './snice-tabs.types';
import { transitions } from '../transitions';

@element('snice-tabs')
export class SniceTabs extends HTMLElement {
  @property({  })
  placement: TabsPlacement = 'top';

  @property({  })
  selected = 0;

  @property({ type: Boolean, attribute: 'no-scroll-controls' })
  noScrollControls = false;

  @property({  })
  transition = 'none';

  private uniqueId = Math.random().toString(36).slice(2, 10);

  @query('.tabs__nav')
  nav?: HTMLElement;

  @query('.tabs__nav-track')
  navTrack?: HTMLElement;

  @query('.tabs__indicator')
  indicator?: HTMLElement;

  @query('.tabs__scroll-button--start')
  scrollButtonStart?: HTMLButtonElement;

  @query('.tabs__scroll-button--end')
  scrollButtonEnd?: HTMLButtonElement;
  
  @query('.tabs')
  tabsContainer?: HTMLElement;
  
  @queryAll('snice-tab[slot="nav"]', { light: true, shadow: false })
  tabs?: NodeListOf<SniceTabElement>;
  
  @queryAll('snice-tab-panel', { light: true, shadow: false })
  panels?: NodeListOf<SniceTabPanelElement>;
  
  @query('.tabs__panels')
  panelsContainer?: HTMLElement;


  @render()
  render() {
    return html/*html*/`
      <div class="tabs tabs--${this.placement}" part="base">
        <div class="tabs__nav-container" part="nav-container">
          <if ${!this.noScrollControls}>
            <button class="tabs__scroll-button tabs__scroll-button--start" part="scroll-button scroll-button-start" tabindex="-1" aria-label="Scroll left">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
              </svg>
            </button>
          </if>

          <div class="tabs__nav" part="nav" role="tablist">
            <div class="tabs__nav-track">
              <slot name="nav"></slot>
              <div class="tabs__indicator" part="indicator"></div>
            </div>
          </div>

          <if ${!this.noScrollControls}>
            <button class="tabs__scroll-button tabs__scroll-button--end" part="scroll-button scroll-button-end" tabindex="-1" aria-label="Scroll right">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
              </svg>
            </button>
          </if>
        </div>

        <div class="tabs__panels" part="panels">
          <slot></slot>
        </div>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  private resizeObserver?: ResizeObserver;

  @ready()
  init() {
    this.setupTabs();
    this.updateScrollButtons();

    this.resizeObserver = new ResizeObserver(() => {
      this.updateScrollButtons();
      this.updateIndicator();
    });

    if (this.nav) {
      this.resizeObserver.observe(this.nav);
    }
  }

  private pendingTimeouts: Set<number> = new Set();

  @dispose()
  private cleanupResize() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    for (const id of this.pendingTimeouts) {
      clearTimeout(id);
    }
    this.pendingTimeouts.clear();
  }

  @watch('selected')
  handleSelectedChange() {
    this.updateSelection();
    this.updateIndicator();
  }

  @watch('placement')
  handlePlacementChange() {
    if (!this.tabsContainer) return;
    
    // Remove all placement classes
    this.tabsContainer.classList.remove('tabs--top', 'tabs--bottom', 'tabs--start', 'tabs--end');
    // Add the new placement class
    this.tabsContainer.classList.add(`tabs--${this.placement}`);
    // Update indicator position
    this.updateIndicator();
    // Update scroll buttons visibility
    this.updateScrollButtons();
  }

  @on('click', '.tabs__scroll-button--start')
  handleScrollStart(e: MouseEvent) {
    const button = (e.target as HTMLElement).closest('.tabs__scroll-button--start') as HTMLElement;
    if (!this.nav || !button || button.classList.contains('tabs__scroll-button--disabled')) return;

    const isHorizontal = this.placement === 'top' || this.placement === 'bottom';
    if (isHorizontal) {
      this.nav.scrollBy({ left: -200, behavior: 'smooth' });
    } else {
      this.nav.scrollBy({ top: -200, behavior: 'smooth' });
    }
  }

  @on('click', '.tabs__scroll-button--end')
  handleScrollEnd(e: MouseEvent) {
    const button = (e.target as HTMLElement).closest('.tabs__scroll-button--end') as HTMLElement;
    if (!this.nav || !button || button.classList.contains('tabs__scroll-button--disabled')) return;

    const isHorizontal = this.placement === 'top' || this.placement === 'bottom';
    if (isHorizontal) {
      this.nav.scrollBy({ left: 200, behavior: 'smooth' });
    } else {
      this.nav.scrollBy({ top: 200, behavior: 'smooth' });
    }
  }

  @on('scroll', '.tabs__nav')
  handleScroll(e: Event) {
    this.updateScrollButtons();
    this.updateIndicator();
  }

  @on('tab-select')
  handleTabSelect(event: CustomEvent<TabSelectDetail>) {
    if (!this.tabs) return;
    const tab = event.detail.tab;
    const index = Array.from(this.tabs).indexOf(tab);
    if (index >= 0) {
      this.selectTab(index);
    }
  }

  @on('keydown', '.tabs__nav')
  handleNavKeydown(e: KeyboardEvent) {
    if (!this.tabs || this.tabs.length === 0) return;
    const count = this.tabs.length;
    const isHorizontal = this.placement === 'top' || this.placement === 'bottom';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

    let next = this.selected;
    if (e.key === prevKey) {
      next = (this.selected - 1 + count) % count;
    } else if (e.key === nextKey) {
      next = (this.selected + 1) % count;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = count - 1;
    } else {
      return;
    }
    e.preventDefault();
    this.selectTab(next);
    (this.tabs[next] as HTMLElement)?.focus();
  }

  setupTabs() {
    this.updateSelection();
    this.updateIndicator();
  }

  @dispatch('tab-change', { bubbles: true, composed: true })
  selectTab(index: number): TabChangeDetail | undefined {
    if (!this.tabs || !this.panels || index < 0 || index >= this.tabs.length) return;
    
    const oldIndex = this.selected;
    this.selected = index;
    
    return { 
      index,
      oldIndex,
      tab: this.tabs[index],
      panel: this.panels[index]
    };
  }

  private previousSelected = -1;

  updateSelection() {
    if (!this.tabs || !this.panels) return;

    this.tabs.forEach((tab, index) => {
      const isSelected = index === this.selected;
      const tabId = tab.id || `snice-tab-${this.uniqueId}-${index}`;
      const panelId = (this.panels![index] && this.panels![index].id) || `snice-tab-panel-${this.uniqueId}-${index}`;
      if (!tab.id) tab.id = tabId;
      if (this.panels![index] && !this.panels![index].id) this.panels![index].id = panelId;

      tab.setAttribute('aria-selected', String(isSelected));
      tab.setAttribute('aria-controls', panelId);
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
      tab.classList.toggle('snice-tab--active', isSelected);

      const panel = this.panels![index];
      if (panel) {
        panel.setAttribute('aria-labelledby', tabId);
      }
    });

    // Handle panel transitions
    const oldPanel = this.previousSelected >= 0 ? this.panels[this.previousSelected] : null;
    const newPanel = this.panels[this.selected];
    
    if (this.transition && this.transition !== 'none' && oldPanel && newPanel && oldPanel !== newPanel) {
      // Get transition config and set CSS variables for timing
      const transitionConfig = transitions[this.transition];
      const outDuration = transitionConfig?.outDuration || 300;
      const inDuration = transitionConfig?.inDuration || 300;
      const maxDuration = Math.max(outDuration, inDuration);
      
      // Update CSS custom property for transition duration
      this.style.setProperty('--snice-tabs-transition-duration', `${maxDuration}ms`);
      
      // Lock container height BEFORE any changes to prevent ANY reflow
      if (this.panelsContainer) {
        const currentHeight = this.panelsContainer.offsetHeight;
        this.panelsContainer.style.height = `${currentHeight}px`;
        this.panelsContainer.style.overflow = 'hidden';
      }
      
      // Now show new panel to measure it
      newPanel.hidden = false;
      newPanel.setAttribute('transition-in', this.transition);
      oldPanel.setAttribute('transition-out', this.transition);
      
      // Pass timing info to panels via properties
      (newPanel as any).transitionDuration = inDuration;
      (oldPanel as any).transitionDuration = outDuration;
      
      // Hide old panel well before transition completes to avoid flicker
      const hideId = window.setTimeout(() => {
        this.pendingTimeouts.delete(hideId);
        if (!this.isConnected || !oldPanel.isConnected) return;
        oldPanel.hidden = true;
        oldPanel.removeAttribute('transition-out');
      }, outDuration - 50); // Hide 50ms early to prevent flicker
      this.pendingTimeouts.add(hideId);

      // Clean up new panel transition attribute and unlock height
      const cleanupId = window.setTimeout(() => {
        this.pendingTimeouts.delete(cleanupId);
        if (!this.isConnected) return;
        if (newPanel.isConnected) {
          newPanel.removeAttribute('transition-in');
        }
        if (this.panelsContainer) {
          // Reset to auto height without animation to prevent bounce
          this.panelsContainer.style.height = '';
          this.panelsContainer.style.overflow = '';
        }
      }, maxDuration);
      this.pendingTimeouts.add(cleanupId);
    } else {
      // No transition - immediate switch
      this.panels.forEach((panel, index) => {
        const isSelected = index === this.selected;
        panel.setAttribute('aria-hidden', String(!isSelected));
        panel.hidden = !isSelected;
      });
    }
    
    // Update aria attributes
    this.panels.forEach((panel, index) => {
      panel.setAttribute('aria-hidden', String(index !== this.selected));
    });
    
    this.previousSelected = this.selected;
  }

  updateIndicator() {
    if (!this.indicator || !this.tabs || !this.tabs.length || !this.navTrack) return;

    const activeTab = this.tabs[this.selected];
    if (!activeTab) return;

    const isHorizontal = this.placement === 'top' || this.placement === 'bottom';
    
    // Get the position of the active tab relative to the nav track container
    // We need to calculate this manually since tabs are in light DOM and indicator is in shadow DOM
    let offset = 0;
    
    // Sum up the widths/heights of all tabs before the active one
    for (let i = 0; i < this.selected; i++) {
      if (isHorizontal) {
        offset += this.tabs[i].offsetWidth;
      } else {
        offset += this.tabs[i].offsetHeight;
      }
    }
    
    if (isHorizontal) {
      this.indicator.style.width = `${activeTab.offsetWidth}px`;
      this.indicator.style.height = '2px';
      this.indicator.style.transform = `translateX(${offset}px)`;
    } else {
      this.indicator.style.width = '2px';
      this.indicator.style.height = `${activeTab.offsetHeight}px`;
      this.indicator.style.transform = `translateY(${offset}px)`;
    }
  }

  updateScrollButtons() {
    if (!this.nav || this.noScrollControls) return;

    const isHorizontal = this.placement === 'top' || this.placement === 'bottom';

    // Check navTrack width instead of nav scrollWidth
    const trackWidth = this.navTrack?.scrollWidth || 0;
    const hasOverflow = isHorizontal
      ? trackWidth > this.nav.clientWidth
      : (this.navTrack?.scrollHeight || 0) > this.nav.clientHeight;

    const canScrollStart = isHorizontal
      ? this.nav.scrollLeft > 0
      : this.nav.scrollTop > 0;

    const canScrollEnd = isHorizontal
      ? this.nav.scrollLeft < trackWidth - this.nav.clientWidth - 1
      : this.nav.scrollTop < (this.navTrack?.scrollHeight || 0) - this.nav.clientHeight - 1;

    // Show/hide buttons based on overflow
    this.scrollButtonStart?.classList.toggle('tabs__scroll-button--visible', hasOverflow);
    this.scrollButtonEnd?.classList.toggle('tabs__scroll-button--visible', hasOverflow);

    // Disable buttons when can't scroll in that direction
    this.scrollButtonStart?.classList.toggle('tabs__scroll-button--disabled', !canScrollStart);
    this.scrollButtonEnd?.classList.toggle('tabs__scroll-button--disabled', !canScrollEnd);
  }


  show(index: number) {
    this.selectTab(index);
  }

  getTab(index: number): SniceTabElement | undefined {
    return this.tabs?.[index];
  }

  getPanel(index: number): SniceTabPanelElement | undefined {
    return this.panels?.[index];
  }
}