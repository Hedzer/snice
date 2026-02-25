[//]: # (AI: For a low-token version of this doc, use docs/ai/components/chip.md instead)

# Chip Component

The chip component provides compact elements for tags, filters, selections, or categorizations. It supports icons, avatars, removable states, and multiple visual variants.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Events](#events)
- [Examples](#examples)

## Basic Usage

```html
<snice-chip label="Tag"></snice-chip>
```

```typescript
import 'snice/components/chip/snice-chip';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Text label for the chip |
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Color variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Chip size |
| `removable` | `boolean` | `false` | Show remove button |
| `selected` | `boolean` | `false` | Show selected state |
| `disabled` | `boolean` | `false` | Disable the chip |
| `icon` | `string` | `''` | Icon (URL, image file, emoji, or font ligature) |
| `avatar` | `string` | `''` | Avatar image URL |

## Slots

| Slot Name | Description |
|-----------|-------------|
| `icon` | Custom icon content. Overrides the `icon` property. Note: `avatar` property takes precedence over icon slot. |

### Icon Slot Usage

Use the `icon` slot for external CSS-based icon fonts:

```html
<snice-chip label="Tag">
  <span slot="icon" class="material-symbols-outlined">label</span>
</snice-chip>

<snice-chip label="Favorite" variant="warning">
  <i slot="icon" class="fa-solid fa-star"></i>
</snice-chip>
```

> **Note**: If `avatar` property is set, the avatar takes precedence and the icon slot will not be displayed.

## Events

#### `chip-click`
Fired when the chip is clicked (not the remove button).

**Usage:**
```typescript
chip.addEventListener('chip-click', () => {
  console.log('Chip clicked');
});
```

#### `chip-remove`
Fired when the remove button is clicked.

**Usage:**
```typescript
chip.addEventListener('chip-remove', () => {
  chip.remove(); // Remove from DOM
});
```

## Examples

### Basic Chips

```html
<snice-chip label="Default"></snice-chip>
<snice-chip label="Technology"></snice-chip>
<snice-chip label="Design"></snice-chip>
```

### Color Variants

```html
<snice-chip label="Default" variant="default"></snice-chip>
<snice-chip label="Primary" variant="primary"></snice-chip>
<snice-chip label="Success" variant="success"></snice-chip>
<snice-chip label="Warning" variant="warning"></snice-chip>
<snice-chip label="Error" variant="error"></snice-chip>
<snice-chip label="Info" variant="info"></snice-chip>
```

### Chip Sizes

```html
<snice-chip label="Small" size="small"></snice-chip>
<snice-chip label="Medium" size="medium"></snice-chip>
<snice-chip label="Large" size="large"></snice-chip>
```

### Removable Chips

```html
<snice-chip label="Remove me" removable></snice-chip>

<snice-chip
  id="removable-chip"
  label="Click X to remove"
  removable
  variant="primary">
</snice-chip>

<script type="module">
  const chip = document.getElementById('removable-chip');
  chip.addEventListener('remove', () => {
    chip.remove();
  });
</script>
```

### Chips with Icons

The `icon` property supports multiple formats:
- **URLs**: Image files (`/icons/star.svg`)
- **Inline SVG**: `<svg>...</svg>`
- **Emoji**: `★`, `🏠`, `⚙️`
- **Font ligatures**: Text for icon fonts like Material Symbols (`star`, `home`)

```html
<!-- Emoji icons -->
<snice-chip label="Favorite" icon="★" variant="warning"></snice-chip>
<snice-chip label="Home" icon="🏠" variant="primary"></snice-chip>
<snice-chip label="Settings" icon="⚙️" variant="default"></snice-chip>

<!-- Image URL -->
<snice-chip label="Star" icon="/icons/star.svg" variant="warning"></snice-chip>

<!-- Font ligature (Material Symbols) -->
<snice-chip label="Home" icon="home" variant="primary"></snice-chip>
<snice-chip label="Settings" icon="settings" variant="default"></snice-chip>
```

### Chips with Avatars

```html
<snice-chip
  label="John Doe"
  avatar="https://via.placeholder.com/32"
  removable>
</snice-chip>

<snice-chip
  label="Jane Smith"
  avatar="https://via.placeholder.com/32/FF6B6B"
  removable>
</snice-chip>

<snice-chip
  label="Alice Brown"
  avatar="https://via.placeholder.com/32/4ECDC4"
  removable>
</snice-chip>
```

### Selected State

```html
<snice-chip label="Option 1" selected></snice-chip>
<snice-chip label="Option 2"></snice-chip>
<snice-chip label="Option 3"></snice-chip>

<script type="module">
  const chips = document.querySelectorAll('snice-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.selected = false);
      chip.selected = true;
    });
  });
</script>
```

### Disabled Chips

```html
<snice-chip label="Disabled" disabled></snice-chip>
<snice-chip label="Disabled Removable" removable disabled></snice-chip>
<snice-chip label="Disabled Selected" selected disabled></snice-chip>
```

### Tag List

```html
<style>
  .tag-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
</style>

<div class="tag-container">
  <snice-chip label="JavaScript" variant="warning" removable></snice-chip>
  <snice-chip label="TypeScript" variant="primary" removable></snice-chip>
  <snice-chip label="React" variant="info" removable></snice-chip>
  <snice-chip label="Vue" variant="success" removable></snice-chip>
  <snice-chip label="Angular" variant="error" removable></snice-chip>
</div>

<script type="module">
  const chips = document.querySelectorAll('.tag-container snice-chip');
  chips.forEach(chip => {
    chip.addEventListener('remove', () => {
      chip.remove();
    });
  });
</script>
```

### Filter Chips

```html
<style>
  .filter-section {
    margin-bottom: 1.5rem;
  }

  .filter-title {
    font-weight: 600;
    margin-bottom: 0.75rem;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
</style>

<div class="filter-section">
  <div class="filter-title">Category</div>
  <div class="filter-chips">
    <snice-chip id="cat-electronics" label="Electronics"></snice-chip>
    <snice-chip id="cat-clothing" label="Clothing"></snice-chip>
    <snice-chip id="cat-books" label="Books"></snice-chip>
    <snice-chip id="cat-home" label="Home & Garden"></snice-chip>
  </div>
</div>

<div class="filter-section">
  <div class="filter-title">Price</div>
  <div class="filter-chips">
    <snice-chip id="price-1" label="Under $25"></snice-chip>
    <snice-chip id="price-2" label="$25-$50"></snice-chip>
    <snice-chip id="price-3" label="$50-$100"></snice-chip>
    <snice-chip id="price-4" label="Over $100"></snice-chip>
  </div>
</div>

<script type="module">
  import type { SniceChipElement } from 'snice/components/chip/snice-chip.types';

  const filterChips = document.querySelectorAll('.filter-chips snice-chip') as NodeListOf<SniceChipElement>;

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.selected = !chip.selected;
      console.log('Filters:', Array.from(filterChips)
        .filter(c => c.selected)
        .map(c => c.label));
    });
  });
</script>
```

### Contact Chips

```html
<style>
  .contacts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    max-width: 600px;
  }
</style>

<div>
  <h4>To:</h4>
  <div class="contacts" id="recipients"></div>
</div>

<script type="module">
  import 'snice/components/chip/snice-chip';

  const contacts = [
    { name: 'John Doe', email: 'john@example.com', avatar: 'https://via.placeholder.com/32' },
    { name: 'Jane Smith', email: 'jane@example.com', avatar: 'https://via.placeholder.com/32/FF6B6B' },
    { name: 'Bob Johnson', email: 'bob@example.com', avatar: 'https://via.placeholder.com/32/4ECDC4' }
  ];

  const container = document.getElementById('recipients');

  contacts.forEach(contact => {
    const chip = document.createElement('snice-chip');
    chip.label = contact.name;
    chip.avatar = contact.avatar;
    chip.removable = true;

    chip.addEventListener('remove', () => {
      chip.remove();
      console.log('Removed:', contact.name);
    });

    container.appendChild(chip);
  });
</script>
```

### Status Chips

```html
<style>
  .status-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 400px;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .status-info h4 {
    margin: 0 0 0.25rem;
  }

  .status-info p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }
</style>

<div class="status-list">
  <div class="status-item">
    <div class="status-info">
      <h4>Order #1234</h4>
      <p>Placed 2 hours ago</p>
    </div>
    <snice-chip label="Processing" variant="warning" size="small"></snice-chip>
  </div>

  <div class="status-item">
    <div class="status-info">
      <h4>Order #1235</h4>
      <p>Placed yesterday</p>
    </div>
    <snice-chip label="Shipped" variant="info" size="small"></snice-chip>
  </div>

  <div class="status-item">
    <div class="status-info">
      <h4>Order #1236</h4>
      <p>Placed 3 days ago</p>
    </div>
    <snice-chip label="Delivered" variant="success" size="small"></snice-chip>
  </div>

  <div class="status-item">
    <div class="status-info">
      <h4>Order #1237</h4>
      <p>Placed last week</p>
    </div>
    <snice-chip label="Cancelled" variant="error" size="small"></snice-chip>
  </div>
</div>
```

### Skill Tags

```html
<style>
  .profile-section {
    max-width: 600px;
  }

  .skills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
</style>

<div class="profile-section">
  <h3>Skills</h3>
  <div class="skills" id="skill-list"></div>
  <button id="add-skill" style="margin-top: 1rem;">Add Skill</button>
</div>

<script type="module">
  import 'snice/components/chip/snice-chip';

  const skillsList = document.getElementById('skill-list');
  const addButton = document.getElementById('add-skill');

  const availableSkills = ['JavaScript', 'Python', 'Java', 'C++', 'React', 'Vue', 'Node.js', 'Docker'];
  let currentSkills = ['JavaScript', 'React', 'Node.js'];

  function renderSkills() {
    skillsList.innerHTML = '';
    currentSkills.forEach(skill => {
      const chip = document.createElement('snice-chip');
      chip.label = skill;
      chip.variant = 'primary';
      chip.removable = true;

      chip.addEventListener('remove', () => {
        currentSkills = currentSkills.filter(s => s !== skill);
        renderSkills();
      });

      skillsList.appendChild(chip);
    });
  }

  addButton.addEventListener('click', () => {
    const skill = prompt('Enter skill name:');
    if (skill && !currentSkills.includes(skill)) {
      currentSkills.push(skill);
      renderSkills();
    }
  });

  renderSkills();
</script>
```

### Interactive Selection

```html
<style>
  .selection-group {
    margin-bottom: 2rem;
  }

  .selection-group h4 {
    margin-bottom: 0.75rem;
  }

  .chip-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
</style>

<div class="selection-group">
  <h4>Select your preferred language:</h4>
  <div class="chip-group" id="language-group">
    <snice-chip label="English"></snice-chip>
    <snice-chip label="Spanish"></snice-chip>
    <snice-chip label="French"></snice-chip>
    <snice-chip label="German"></snice-chip>
    <snice-chip label="Chinese"></snice-chip>
  </div>
</div>

<div class="selection-group">
  <h4>Select topics of interest (multiple):</h4>
  <div class="chip-group" id="topics-group">
    <snice-chip label="Technology"></snice-chip>
    <snice-chip label="Science"></snice-chip>
    <snice-chip label="Arts"></snice-chip>
    <snice-chip label="Sports"></snice-chip>
    <snice-chip label="Music"></snice-chip>
    <snice-chip label="Travel"></snice-chip>
  </div>
</div>

<script type="module">
  import type { SniceChipElement } from 'snice/components/chip/snice-chip.types';

  // Single selection for language
  const languageChips = document.querySelectorAll('#language-group snice-chip') as NodeListOf<SniceChipElement>;
  languageChips.forEach(chip => {
    chip.addEventListener('click', () => {
      languageChips.forEach(c => c.selected = false);
      chip.selected = true;
    });
  });

  // Multiple selection for topics
  const topicChips = document.querySelectorAll('#topics-group snice-chip') as NodeListOf<SniceChipElement>;
  topicChips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.selected = !chip.selected;
    });
  });
</script>
```

### Search Result Tags

```html
<style>
  .search-results {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .result-item {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .result-title {
    margin: 0 0 0.5rem;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .result-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.5rem;
  }
</style>

<div class="search-results">
  <div class="result-item">
    <h3 class="result-title">Getting Started with Web Components</h3>
    <p>Learn how to build reusable components...</p>
    <div class="result-tags">
      <snice-chip label="Tutorial" variant="primary" size="small"></snice-chip>
      <snice-chip label="JavaScript" variant="info" size="small"></snice-chip>
      <snice-chip label="Web Components" variant="success" size="small"></snice-chip>
    </div>
  </div>

  <div class="result-item">
    <h3 class="result-title">Advanced TypeScript Patterns</h3>
    <p>Explore advanced type system features...</p>
    <div class="result-tags">
      <snice-chip label="Advanced" variant="warning" size="small"></snice-chip>
      <snice-chip label="TypeScript" variant="primary" size="small"></snice-chip>
      <snice-chip label="Patterns" variant="default" size="small"></snice-chip>
    </div>
  </div>
</div>
```

### Active Filters Display

```html
<style>
  .active-filters {
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .filters-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .clear-all {
    font-size: 0.875rem;
    color: #3b82f6;
    text-decoration: underline;
    cursor: pointer;
    border: none;
    background: none;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
</style>

<div class="active-filters">
  <div class="filters-header">
    <h4>Active Filters (3)</h4>
    <button class="clear-all" id="clear-filters">Clear all</button>
  </div>
  <div class="filter-chips" id="active-filters">
    <snice-chip label="Category: Electronics" variant="primary" removable size="small"></snice-chip>
    <snice-chip label="Price: $25-$50" variant="info" removable size="small"></snice-chip>
    <snice-chip label="Brand: Sony" variant="success" removable size="small"></snice-chip>
  </div>
</div>

<script type="module">
  const container = document.getElementById('active-filters');
  const clearButton = document.getElementById('clear-filters');

  // Handle remove events
  container.addEventListener('remove', (e) => {
    e.target.remove();
    updateFilterCount();
  });

  // Clear all filters
  clearButton.addEventListener('click', () => {
    container.innerHTML = '';
    updateFilterCount();
  });

  function updateFilterCount() {
    const count = container.querySelectorAll('snice-chip').length;
    document.querySelector('.filters-header h4').textContent = `Active Filters (${count})`;
  }
</script>
```

## Accessibility

- **Keyboard support**: Focusable and activatable with Enter/Space
- **ARIA attributes**: `role`, `aria-selected`, `aria-disabled`
- **Screen reader friendly**: Remove button has `aria-label`
- **Focus indicators**: Clear focus states for keyboard navigation

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Keep labels short**: Chips work best with concise text
2. **Use appropriate variants**: Match colors to semantic meaning
3. **Make removable when needed**: Allow users to dismiss chips
4. **Group related chips**: Use containers to organize chip sets
5. **Limit chip count**: Too many chips can overwhelm users
6. **Use icons/avatars wisely**: Visual elements should add meaning
7. **Handle removal gracefully**: Animate or fade out when removing
8. **Test keyboard navigation**: Ensure chips work without a mouse
9. **Consider mobile**: Ensure chips are tappable on touch devices
10. **Provide feedback**: Show selected/active states clearly

## Common Patterns

### Tag/Label
```html
<snice-chip label="JavaScript" variant="primary"></snice-chip>
```

### Removable Tag
```html
<snice-chip label="Remove me" removable></snice-chip>
```

### Filter Selection
```html
<snice-chip label="Filter" selected></snice-chip>
```

### User/Contact
```html
<snice-chip label="John Doe" avatar="/avatar.jpg" removable></snice-chip>
```

### Status Indicator
```html
<snice-chip label="Active" variant="success" size="small"></snice-chip>
```

## Variant Colors

| Variant | Color Scheme | Use Case |
|---------|-------------|----------|
| `default` | Gray | Neutral tags, labels |
| `primary` | Blue | Primary categories, selections |
| `success` | Green | Positive status, confirmed items |
| `warning` | Orange | Important tags, warnings |
| `error` | Red | Error states, critical items |
| `info` | Light blue | Informational tags |
