# Observe

Mirrors `docs/observe.md`.

`@observe` decorator: lifecycle-managed observation of viewport intersection, element resize, media queries, and DOM mutations.

## Overview

Automatically manages browser observers with proper cleanup — prevents memory leaks, simplifies observation patterns.

```typescript
@element('lazy-image')
class LazyImage extends HTMLElement {
  @observe('intersection', 'img')
  loadImage(entry: IntersectionObserverEntry) {
    if (entry.isIntersecting) {
      const img = entry.target as HTMLImageElement;
      img.src = img.dataset.src!;
      return false; // stop observing this element
    }
  }
}
```

### Array syntax — multiple types, one handler

```typescript
// Both childList and attribute mutations on one handler
@observe(['mutation:childList', 'mutation:attributes'], '.content')
handleContentChange(mutations: MutationRecord[]) {
  mutations.forEach(m => { /* m.type === 'childList' | 'attributes' */ });
}

// Multiple media queries, called independently for each
@observe(['media:(max-width: 768px)', 'media:(prefers-color-scheme: dark)'])
handleResponsiveTheme(matches: boolean) {}
```

## Intersection Observer

Detect viewport enter/leave — lazy loading, infinite scroll, animations.

```typescript
@observe('intersection')                              // observe host element
handleVisible(entry: IntersectionObserverEntry) {
  if (entry.isIntersecting) this.classList.add('visible');
}

@observe('intersection', '.lazy', { threshold: 0.1 }) // observe selector, with options
loadImage(entry: IntersectionObserverEntry) {
  if (entry.isIntersecting) {
    (entry.target as HTMLImageElement).src = (entry.target as HTMLImageElement).dataset.src!;
    return false; // stop observing after loading
  }
}
```

**Options:**
- `threshold`: number or array (0-1) — visibility percentage to trigger
- `rootMargin`: margin around root to expand/shrink observation area
- `root`: element to use as viewport (default: browser viewport)

**Stopping:** return `false` from the handler to stop observing that specific element.

## Resize Observer

Monitor element size changes.

```typescript
@observe('resize')                                 // host element
handleResize(entry: ResizeObserverEntry) {
  const { width, height } = entry.contentRect;
}

@observe('resize', '.chart', { throttle: 100 })    // selector + throttle
handleChartResize(entry: ResizeObserverEntry) {}
```

**Options:**
- `box`: `'content-box' | 'border-box'` — box model to observe
- `throttle`: ms to throttle resize callbacks

## Media Query Observer

Respond to viewport/user-preference changes.

```typescript
@observe('media:(min-width: 768px)')
handleDesktop(matches: boolean) { this.isDesktop = matches; }

@observe('media:(prefers-color-scheme: dark)')
handleDarkMode(matches: boolean) { this.isDarkMode = matches; }

@observe('media:(orientation: portrait) and (max-width: 768px)')
handleMobilePortrait(matches: boolean) {}
```

**Notes:**
- Handler called immediately with current state when observer is set up.
- Standard CSS media query syntax.
- Media queries cached globally for efficiency.

## Mutation Observer

Watch DOM changes — added/removed nodes, attribute modifications.

```typescript
@observe('mutation:childList', '.list')
handleListChange(mutations: MutationRecord[]) {
  const count = this.querySelector('.list')?.children.length || 0;
}

@observe('mutation:attributes:data-state', '.item')
handleStateChange(mutations: MutationRecord[]) {
  const newState = (mutations[0].target as Element).getAttribute('data-state');
}
```

**Mutation types:**
- `mutation:childList` — added/removed child nodes
- `mutation:attributes` — all attribute changes
- `mutation:attributes:name` — specific attribute changes

**Options:**
- `subtree`: also observe descendants (use with caution — performance)
- `throttle`: ms to throttle mutation callbacks

**Safety:**
- `subtree: true` not enabled by default (performance).
- Character data mutations not supported (too granular).
- Be specific about what you observe.

## Using with Controllers

`@observe` works in controllers too — observers operate on the attached element.

```typescript
@controller('viewport-controller')
class ViewportController implements IController {
  element: HTMLElement | null = null;

  @observe('media:(min-width: 1024px)')
  handleLargeScreen(matches: boolean) {
    this.element?.classList.toggle('large-screen', matches);
  }

  @observe('intersection', { threshold: 0.5 })
  handleVisibility(entry: IntersectionObserverEntry) {
    if (entry.isIntersecting) this.trackImpression();
  }

  async attach(element: HTMLElement) { this.element = element; }
  async detach(element: HTMLElement) { this.element = null; } // observers auto-cleaned

  trackImpression() {}
}
```

## Options

Single shared interface across observer types — pass only fields relevant to the type in use:

```typescript
interface ObserveOptions {
  // Intersection Observer
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;

  // Resize Observer
  box?: 'content-box' | 'border-box';

  // Mutation Observer
  subtree?: boolean;
  maxDepth?: number;     // safety limit for subtree depth

  // All observers
  throttle?: number;
}
```

## Best Practices

1. Be specific — target a selector + threshold (`@observe('intersection', '.lazy-image', { threshold: 0.1 })`), not `'*'`.
2. Throttle high-frequency events — unthrottled resize can fire many times/sec.
3. Stop observing when done — `return false` after a one-shot trigger.
4. Avoid deep subtree observation — target a specific container instead of `{ subtree: true }`.
5. Prefer media-query observers over manual `window.addEventListener('resize', ...)` polling of `innerWidth`.

## Lifecycle and Cleanup

Observers are automatically:
- Set up when element connects to DOM
- Cleaned up when element disconnects
- Re-established if element moves in DOM

No manual cleanup required.

## Performance Considerations

1. Browser support checked; warns if unsupported.
2. Media query observers shared/cached globally.
3. Built-in `throttle` option prevents callback flooding.
4. Proper cleanup prevents memory leaks.
5. Errors in one observer don't affect others.

## Patterns

- **Virtual scrolling**: `@observe('intersection', '.item', { rootMargin: '100px' })` — add/remove from a visible-items set on `isIntersecting`, render/unrender accordingly.
- **Responsive dashboard**: stack multiple `media:(min-width:...)` observers for breakpoint tiers plus a throttled `@observe('resize', { throttle: 200 })` for fine-grained sizing.
- **Dynamic form fields**: `@observe('mutation:childList', '.dynamic-fields')` — initialize newly added element nodes from `mutation.addedNodes`.
