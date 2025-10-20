# Observe API Documentation

The `@observe` decorator provides lifecycle-managed observation of external changes like viewport intersection, element resize, media queries, and DOM mutations.

## Table of Contents
- [Overview](#overview)
- [Intersection Observer](#intersection-observer)
- [Resize Observer](#resize-observer)
- [Media Query Observer](#media-query-observer)
- [Mutation Observer](#mutation-observer)
- [Using with Controllers](#using-with-controllers)
- [Options](#options)
- [Best Practices](#best-practices)

## Overview

The `@observe` decorator automatically manages browser observers with proper cleanup, preventing memory leaks and simplifying complex observation patterns.

```typescript
import { element, observe, render, html } from 'snice';

@element('lazy-image')
class LazyImage extends HTMLElement {
  @observe('intersection', 'img')
  loadImage(entry: IntersectionObserverEntry) {
    if (entry.isIntersecting) {
      const img = entry.target as HTMLImageElement;
      img.src = img.dataset.src!;
      return false; // Stop observing this element
    }
  }

  @render()
  renderContent() {
    return html`<img data-src="image.jpg" />`;
  }
}
```

### Array Syntax

You can observe multiple types with a single handler using array syntax:

```typescript
@element('dynamic-content')
class DynamicContent extends HTMLElement {
  @render()
  renderContent() {
    return html`<div class="content" data-state="initial">Content</div>`;
  }

  // Watch for both child changes and attribute changes
  @observe(['mutation:childList', 'mutation:attributes'], '.content')
  handleContentChange(mutations: MutationRecord[]) {
    mutations.forEach(m => {
      if (m.type === 'childList') {
        console.log('Children changed');
      } else if (m.type === 'attributes') {
        console.log('Attributes changed');
      }
    });
  }

  // Multiple media queries with one handler
  @observe(['media:(max-width: 768px)', 'media:(prefers-color-scheme: dark)'])
  handleResponsiveTheme(matches: boolean) {
    // Called for each media query independently
    this.updateLayout();
  }

  updateLayout() {
    // Update logic
  }
}
```

## Intersection Observer

Detect when elements enter or leave the viewport. Perfect for lazy loading, infinite scroll, and animations.

### Basic Usage

```typescript
@element('scroll-trigger')
class ScrollTrigger extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <div class="content">Scroll to see me</div>
      <img class="lazy" data-src="image.jpg" />
    `;
  }

  // Observe when element becomes visible
  @observe('intersection')
  handleVisible(entry: IntersectionObserverEntry) {
    if (entry.isIntersecting) {
      this.classList.add('visible');
    }
  }

  // Observe specific element with threshold
  @observe('intersection', '.lazy', { threshold: 0.1 })
  loadImage(entry: IntersectionObserverEntry) {
    if (entry.isIntersecting) {
      const img = entry.target as HTMLImageElement;
      img.src = img.dataset.src!;
      return false; // Stop observing after loading
    }
  }
}
```

### Options

- `threshold`: Number or array (0-1) defining visibility percentage to trigger
- `rootMargin`: Margin around root to expand/shrink observation area
- `root`: Element to use as viewport (defaults to browser viewport)

### Stopping Observation

Return `false` from the handler to stop observing that specific element:

```typescript
@observe('intersection', '.item')
handleItemVisible(entry: IntersectionObserverEntry) {
  if (entry.isIntersecting) {
    this.animateItem(entry.target);
    return false; // Don't observe this item anymore
  }
}

animateItem(target: Element) {
  // Animation logic
}
```

## Resize Observer

Monitor element size changes for responsive components.

### Basic Usage

```typescript
@element('responsive-chart')
class ResponsiveChart extends HTMLElement {
  @render()
  renderContent() {
    return html`<canvas class="chart"></canvas>`;
  }

  // Observe host element resize
  @observe('resize')
  handleResize(entry: ResizeObserverEntry) {
    const { width, height } = entry.contentRect;
    this.redrawChart(width, height);
  }

  // Observe specific element with throttling
  @observe('resize', '.chart', { throttle: 100 })
  handleChartResize(entry: ResizeObserverEntry) {
    this.updateChartDimensions(entry.contentRect);
  }

  redrawChart(width: number, height: number) {
    // Chart redraw logic
  }

  updateChartDimensions(rect: DOMRectReadOnly) {
    // Update logic
  }
}
```

### Options

- `box`: `'content-box'` or `'border-box'` (which box model to observe)
- `throttle`: Milliseconds to throttle resize callbacks

## Media Query Observer

Respond to viewport and user preference changes.

### Basic Usage

```typescript
@element('responsive-layout')
class ResponsiveLayout extends HTMLElement {
  isDesktop = false;
  isDarkMode = false;

  @render()
  renderContent() {
    return html`<div class="layout">Content</div>`;
  }

  // Desktop breakpoint
  @observe('media:(min-width: 768px)')
  handleDesktop(matches: boolean) {
    this.isDesktop = matches;
    this.updateLayout();
  }

  // Dark mode preference
  @observe('media:(prefers-color-scheme: dark)')
  handleDarkMode(matches: boolean) {
    this.isDarkMode = matches;
    this.updateTheme();
  }

  // Portrait orientation on mobile
  @observe('media:(orientation: portrait) and (max-width: 768px)')
  handleMobilePortrait(matches: boolean) {
    if (matches) {
      this.adjustForMobilePortrait();
    }
  }

  updateLayout() {
    // Layout update logic
  }

  updateTheme() {
    // Theme update logic
  }

  adjustForMobilePortrait() {
    // Adjustment logic
  }
}
```

### Important Notes

- Handler is called immediately with current state when observer is set up
- Media query strings use standard CSS media query syntax
- Media queries are cached globally for efficiency

## Mutation Observer

Watch for DOM changes like added/removed nodes or attribute modifications.

### Basic Usage

```typescript
@element('dynamic-list')
class DynamicList extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <ul class="list"></ul>
      <div class="count">0 items</div>
    `;
  }

  // Watch for child list changes
  @observe('mutation:childList', '.list')
  handleListChange(mutations: MutationRecord[]) {
    const count = this.querySelector('.list')?.children.length || 0;
    this.updateCount(count);
  }

  // Watch for specific attribute changes
  @observe('mutation:attributes:data-state', '.item')
  handleStateChange(mutations: MutationRecord[]) {
    const mutation = mutations[0];
    const newState = (mutation.target as Element).getAttribute('data-state');
    this.updateItemDisplay(mutation.target, newState);
  }

  updateCount(count: number) {
    const countDiv = this.querySelector('.count');
    if (countDiv) countDiv.textContent = `${count} items`;
  }

  updateItemDisplay(target: Node, newState: string | null) {
    // Update display logic
  }
}
```

### Mutation Types

- `mutation:childList` - Observe added/removed child nodes
- `mutation:attributes` - Observe all attribute changes
- `mutation:attributes:name` - Observe specific attribute changes

### Options

- `subtree`: Also observe descendants (use with caution for performance)
- `throttle`: Milliseconds to throttle mutation callbacks

### Safety Features

- `subtree: true` is not enabled by default to prevent performance issues
- Character data mutations are not supported (too granular)
- Always be specific about what you're observing

## Using with Controllers

Controllers can also use `@observe` for separation of concerns. When used in controllers, observers operate on the attached element:

```typescript
@controller('viewport-controller')
class ViewportController implements IController {
  element: HTMLElement | null = null;

  @observe('media:(min-width: 1024px)')
  handleLargeScreen(matches: boolean) {
    if (this.element) {
      this.element.classList.toggle('large-screen', matches);
    }
  }

  @observe('intersection', { threshold: 0.5 })
  handleVisibility(entry: IntersectionObserverEntry) {
    if (entry.isIntersecting) {
      this.trackImpression();
    }
  }

  async attach(element: HTMLElement) {
    this.element = element;
  }

  async detach(element: HTMLElement) {
    this.element = null;
    // Observers are automatically cleaned up
  }

  trackImpression() {
    // Analytics tracking
  }
}
```

## Options

### Common Options

All observers support these options:

```typescript
interface ObserveOptions {
  throttle?: number;  // Throttle callbacks by milliseconds
}
```

### Specific Options

```typescript
// Intersection Observer
interface IntersectionOptions extends ObserveOptions {
  threshold?: number | number[];  // 0-1 visibility threshold
  rootMargin?: string;            // Margin around root
  root?: Element | null;          // Viewport element
}

// Resize Observer
interface ResizeOptions extends ObserveOptions {
  box?: 'content-box' | 'border-box';  // Box model to observe
}

// Mutation Observer
interface MutationOptions extends ObserveOptions {
  subtree?: boolean;     // Observe descendants
  maxDepth?: number;     // Limit subtree depth
}
```

## Best Practices

### 1. Be Specific

```typescript
// Good - specific selector and threshold
@observe('intersection', '.lazy-image', { threshold: 0.1 })

// Bad - observing everything
@observe('intersection', '*')
```

### 2. Use Throttling for High-Frequency Events

```typescript
// Good - throttled resize observer
@observe('resize', { throttle: 100 })
handleResize(entry: ResizeObserverEntry) {
  this.expensiveOperation();
}

// Bad - unthrottled resize can fire many times per second
@observe('resize')
handleResize(entry: ResizeObserverEntry) {
  this.expensiveOperation();
}

expensiveOperation() {
  // Expensive logic
}
```

### 3. Stop Observing When Done

```typescript
@observe('intersection', '.load-more')
handleLoadMore(entry: IntersectionObserverEntry) {
  if (entry.isIntersecting) {
    this.loadMoreContent();
    return false; // Stop observing after trigger
  }
}

loadMoreContent() {
  // Load more logic
}
```

### 4. Avoid Deep Subtree Observation

```typescript
// Bad - observing entire subtree
@observe('mutation:childList', { subtree: true })

// Good - observe specific container
@observe('mutation:childList', '.list-container')
```

### 5. Use Media Queries for Responsive Design

```typescript
// Good - declarative responsive behavior
@observe('media:(min-width: 768px)')
handleDesktop(matches: boolean) {
  this.layout = matches ? 'desktop' : 'mobile';
}

// Avoid - manual window resize listening
// window.addEventListener('resize', () => {
//   if (window.innerWidth >= 768) { /* ... */ }
// });
```

## Lifecycle and Cleanup

All observers are automatically:
- Set up when element connects to DOM
- Cleaned up when element disconnects
- Re-established if element is moved in DOM

No manual cleanup is required - the framework handles everything:

```typescript
@element('auto-cleanup')
class AutoCleanup extends HTMLElement {
  // All observers are automatically managed
  @observe('intersection')
  handleIntersection(entry: IntersectionObserverEntry) { }

  @observe('resize')
  handleResize(entry: ResizeObserverEntry) { }

  @observe('media:(min-width: 768px)')
  handleMedia(matches: boolean) { }

  // No cleanup code needed!
  @render()
  renderContent() {
    return html`<div>Auto-cleanup content</div>`;
  }
}
```

## Performance Considerations

1. **Browser Support**: Observers check for API availability and warn if unsupported
2. **Shared Observers**: Media queries are cached globally
3. **Automatic Throttling**: Built-in throttle option prevents callback flooding
4. **Memory Management**: Proper cleanup prevents memory leaks
5. **Error Isolation**: Errors in one observer don't affect others

## Examples

### Virtual Scrolling

```typescript
@element('virtual-list')
class VirtualList extends HTMLElement {
  visibleItems = new Set<Element>();

  @render()
  renderContent() {
    return html`<div class="viewport"></div>`;
  }

  @observe('intersection', '.item', { rootMargin: '100px' })
  handleItemVisibility(entry: IntersectionObserverEntry) {
    if (entry.isIntersecting) {
      this.visibleItems.add(entry.target);
      this.renderItem(entry.target);
    } else {
      this.visibleItems.delete(entry.target);
      this.unrenderItem(entry.target);
    }
  }

  renderItem(target: Element) {
    // Render logic
  }

  unrenderItem(target: Element) {
    // Unrender logic
  }
}
```

### Responsive Dashboard

```typescript
@element('dashboard')
class Dashboard extends HTMLElement {
  columns = 1;

  @observe('media:(min-width: 768px)')
  handleTablet(matches: boolean) {
    this.columns = matches ? 2 : 1;
  }

  @observe('media:(min-width: 1024px)')
  handleDesktop(matches: boolean) {
    this.columns = matches ? 3 : this.columns;
  }

  @observe('resize', { throttle: 200 })
  handleResize(entry: ResizeObserverEntry) {
    this.adjustCardSizes(entry.contentRect.width);
  }

  @render()
  renderContent() {
    return html`<div class="dashboard">Dashboard with ${this.columns} columns</div>`;
  }

  adjustCardSizes(width: number) {
    // Adjust logic
  }
}
```

### Form Auto-Save

```typescript
@element('auto-save-form')
class AutoSaveForm extends HTMLElement {
  @observe('mutation:attributes:value', 'input, textarea', { throttle: 1000 })
  handleInputChange(mutations: MutationRecord[]) {
    this.saveFormData();
  }

  @observe('mutation:childList', '.dynamic-fields')
  handleFieldsAdded(mutations: MutationRecord[]) {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          this.initializeField(node as Element);
        }
      });
    });
  }

  @render()
  renderContent() {
    return html`
      <form>
        <div class="dynamic-fields"></div>
      </form>
    `;
  }

  saveFormData() {
    // Save logic
  }

  initializeField(field: Element) {
    // Initialize logic
  }
}
```
