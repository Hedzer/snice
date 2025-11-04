# snice-empty-state

Empty state placeholder for no data scenarios.

## Properties

```typescript
size: 'small'|'medium'|'large' = 'medium';
icon: string = '📭';
title: string = 'No data';
description: string = '';
actionText: string = '';
actionHref: string = '';
```

## Events

- `action` - {emptyState}

## Usage

```html
<!-- Basic -->
<snice-empty-state></snice-empty-state>

<!-- Custom -->
<snice-empty-state
  icon="🔍"
  title="No results found"
  description="Try adjusting your search"
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

- Customizable icon, title, description
- Optional action button or link
- 3 sizes
- Slot for custom content
- Accessible
