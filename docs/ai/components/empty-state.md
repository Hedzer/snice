# snice-empty-state

Empty state placeholder for no data scenarios.

## Properties

```typescript
size: 'small'|'medium'|'large' = 'medium';
icon: string = '📭';
title: string = 'No data';
description: string = '';
actionText: string = '';       // attribute: action-text
actionHref: string = '';       // attribute: action-href
```

## Events

- `empty-state-action` → `{ emptyState: SniceEmptyStateElement }`

## Slots

- `icon` - Custom icon content (overrides `icon` property)
- (default) - Custom content below the action button

## CSS Parts

- `container` - Outer empty state wrapper
- `icon` - Icon wrapper
- `title` - Title element
- `description` - Description paragraph
- `action` - Action button or link

## Basic Usage

```typescript
import 'snice/components/empty-state/snice-empty-state';
```

```html
<snice-empty-state
  icon="🔍"
  title="No results found"
  description="Try adjusting your search"
  action-text="Clear Search"
></snice-empty-state>

<!-- Icon SLOT — for Material Symbols, Font Awesome, SVGs -->
<snice-empty-state title="No results">
  <span slot="icon" class="material-symbols-outlined" style="font-size: 4rem;">search_off</span>
</snice-empty-state>

<!-- With link -->
<snice-empty-state
  title="Page not found"
  action-text="Go Home"
  action-href="/"
></snice-empty-state>

<!-- Sizes -->
<snice-empty-state size="small"></snice-empty-state>
<snice-empty-state size="large"></snice-empty-state>
```

```typescript
empty.addEventListener('empty-state-action', () => {
  console.log('Action clicked');
});
```
