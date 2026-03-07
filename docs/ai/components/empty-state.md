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

## Slots

- `icon` - Custom icon content (overrides `icon` property)
- (default) - Custom content below the action button

## Events

- `empty-state-action` → `{ emptyState }`

## CSS Parts

- `container` - Outer empty state wrapper
- `icon` - Icon wrapper
- `title` - Title element
- `description` - Description paragraph
- `action` - Action button or link

## Usage

```html
<!-- Basic -->
<snice-empty-state></snice-empty-state>

<!-- Custom (icon supports: URL, image files, emoji, text) -->
<snice-empty-state
  icon="🔍"
  title="No results found"
  description="Try adjusting your search"
></snice-empty-state>

<!-- ⚠️ icon="search_off" renders as PLAIN TEXT. Use the icon slot for icon fonts. -->

<!-- Icon SLOT — for Material Symbols, Font Awesome, SVGs -->
<snice-empty-state title="No results">
  <span slot="icon" class="material-symbols-outlined" style="font-size: 4rem;">search_off</span>
</snice-empty-state>

<!-- Icon PROPERTY — for emoji, URLs, image files only -->
<snice-empty-state
  icon="/icons/empty.svg"
  title="No items"
></snice-empty-state>

<!-- With action -->
<snice-empty-state
  title="No items yet"
  description="Get started by creating your first item"
  action-text="Create Item"
></snice-empty-state>

<!-- With link -->
<snice-empty-state
  title="Page not found"
  action-text="Go Home"
  action-href="/"
></snice-empty-state>

<!-- Sizes -->
<snice-empty-state size="small"></snice-empty-state>
<snice-empty-state size="medium"></snice-empty-state>
<snice-empty-state size="large"></snice-empty-state>

<!-- Events -->
<snice-empty-state id="empty" action-text="Click"></snice-empty-state>
<script>
document.querySelector('#empty').addEventListener('empty-state-action', () => {
  console.log('Action clicked');
});
</script>

<!-- Custom content -->
<snice-empty-state title="No data">
  <div>Custom HTML content here</div>
</snice-empty-state>
```

## Features

- Customizable icon (URL, image files, emoji), title, description. Use slot for icon fonts.
- Optional action button or link
- 3 sizes
- Slot for custom content
- Accessible
