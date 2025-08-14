import { element, property, query, queryAll, on, watch, ready, dispatch } from '../../src/index';
import css from './snice-tabs.css?inline';
import type { TabsPlacement, SniceTabElement, SniceTabPanelElement, TabChangeDetail, TabSelectDetail } from './snice-tabs.types';
import { Transition, fadeTransition } from '../../src/transitions';

@element('snice-tabs')
export class SniceTabs extends HTMLElement {
  @property({ reflect: true })
  placement: TabsPlacement = 'top';

  @property({ reflect: true })
  selected = 0;

  @property({ type: Boolean, reflect: true })
  noScrollControls = false;

  @property({ type: Object })
  transition: Transition | null = null;


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
  
  @queryAll('snice-tab[slot="nav"]', { light: true, shadow: false })
  tabs?: NodeListOf<SniceTabElement>;
  
  @queryAll('snice-tab-panel', { light: true, shadow: false })
  panels?: NodeListOf<SniceTabPanelElement>;


  html() {
    return /*html*/`
      <div class="tabs tabs--${this.placement}" part="base">
        <div class="tabs__nav-container" part="nav-container">
          ${!this.noScrollControls ? /*html*/`
            <button class="tabs__scroll-button tabs__scroll-button--start" part="scroll-button scroll-button-start" tabindex="-1" aria-label="Scroll left">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
              </svg>
            </button>
          ` : ''}
          
          <div class="tabs__nav" part="nav" role="tablist">
            <div class="tabs__nav-track">
              <slot name="nav"></slot>
              <div class="tabs__indicator" part="indicator"></div>
            </div>
          </div>
          
          ${!this.noScrollControls ? /*html*/`
            <button class="tabs__scroll-button tabs__scroll-button--end" part="scroll-button scroll-button-end" tabindex="-1" aria-label="Scroll right">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
              </svg>
            </button>
          ` : ''}
        </div>
        
        <div class="tabs__panels" part="panels">
          <slot></slot>
        </div>
      </div>
    `;
  }

  css() {
    return css;
  }

  @ready()
  init() {
    this.setupTabs();
    this.updateScrollButtons();
    
    // Update scroll buttons on resize
    const resizeObserver = new ResizeObserver(() => {
      this.updateScrollButtons();
      this.updateIndicator();
    });
    
    if (this.nav) {
      resizeObserver.observe(this.nav);
    }
  }

  @watch('selected')
  handleSelectedChange() {
    this.updateSelection();
    this.updateIndicator();
  }

  @on('click', '.tabs__scroll-button--start')
  scrollStart() {
    if (!this.nav) return;
    
    const isHorizontal = this.placement === 'top' || this.placement === 'bottom';
    if (isHorizontal) {
      this.nav.scrollBy({ left: -200, behavior: 'smooth' });
    } else {
      this.nav.scrollBy({ top: -200, behavior: 'smooth' });
    }
  }

  @on('click', '.tabs__scroll-button--end')
  scrollEnd() {
    if (!this.nav) return;
    
    const isHorizontal = this.placement === 'top' || this.placement === 'bottom';
    if (isHorizontal) {
      this.nav.scrollBy({ left: 200, behavior: 'smooth' });
    } else {
      this.nav.scrollBy({ top: 200, behavior: 'smooth' });
    }
  }

  @on('scroll', '.tabs__nav')
  handleScroll() {
    this.updateScrollButtons();
    this.updateIndicator();
  }

  @on('@snice/tab-select')
  handleTabSelect(event: CustomEvent<TabSelectDetail>) {
    if (!this.tabs) return;
    const tab = event.detail.tab;
    const index = Array.from(this.tabs).indexOf(tab);
    if (index >= 0) {
      this.selectTab(index);
    }
  }

  setupTabs() {
    this.updateSelection();
    // Delay indicator update to ensure DOM is ready
    requestAnimationFrame(() => {
      this.updateIndicator();
    });
  }

  @dispatch('@snice/tab-change', { bubbles: true, composed: true })
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

  updateSelection() {
    if (!this.tabs || !this.panels) return;
    
    this.tabs.forEach((tab, index) => {
      const isSelected = index === this.selected;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
      tab.classList.toggle('snice-tab--active', isSelected);
    });

    // Simple show/hide without transition for now
    // Transition would need more complex handling since panels are in light DOM
    this.panels.forEach((panel, index) => {
      const isSelected = index === this.selected;
      panel.setAttribute('aria-hidden', String(!isSelected));
      
      if (this.transition && !isSelected && !panel.hidden) {
        // Apply fade out transition
        panel.style.transition = `opacity ${this.transition.outDuration || 300}ms ease-in-out`;
        panel.style.opacity = '0';
        setTimeout(() => {
          panel.hidden = true;
          panel.style.opacity = '';
          panel.style.transition = '';
        }, this.transition.outDuration || 300);
      } else if (this.transition && isSelected && panel.hidden) {
        // Apply fade in transition
        panel.hidden = false;
        panel.style.opacity = '0';
        panel.style.transition = `opacity ${this.transition.inDuration || 300}ms ease-in-out`;
        requestAnimationFrame(() => {
          panel.style.opacity = '1';
          setTimeout(() => {
            panel.style.opacity = '';
            panel.style.transition = '';
          }, this.transition!.inDuration || 300);
        });
      } else {
        // No transition
        panel.hidden = !isSelected;
      }
    });
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
    
    const hasOverflow = isHorizontal 
      ? this.nav.scrollWidth > this.nav.clientWidth
      : this.nav.scrollHeight > this.nav.clientHeight;
      
    const canScrollStart = isHorizontal
      ? this.nav.scrollLeft > 0
      : this.nav.scrollTop > 0;
      
    const canScrollEnd = isHorizontal
      ? this.nav.scrollLeft < this.nav.scrollWidth - this.nav.clientWidth
      : this.nav.scrollTop < this.nav.scrollHeight - this.nav.clientHeight;

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