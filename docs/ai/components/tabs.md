# snice-tabs

Tabbed interface with container, tab buttons, and content panels.

## Components

### snice-tabs (Container)

```typescript
selected: number = 0;                              // Active tab index
placement: 'top'|'bottom'|'start'|'end' = 'top';  // Tab navigation position
noScrollControls: boolean = false;                 // Hide scroll buttons
transition: string = 'none';                       // Panel transition effect
```

**Methods:**
```typescript
selectTab(index: number)           // Select tab by index
show(index: number)                 // Alias for selectTab
getTab(index: number)               // Get tab element
getPanel(index: number)             // Get panel element
```

**Events:**
```typescript
'tab-change' // { index, oldIndex, tab, panel }
```

### snice-tab (Tab Button)

```typescript
disabled: boolean = false;   // Disabled state
closable: boolean = false;   // Show close button
```

**Methods:**
```typescript
focus()   // Focus the tab
blur()    // Remove focus
```

**Events:**
```typescript
'tab-select' // { tab }
'tab-close'      // { tab }
```

### snice-tab-panel (Content Panel)

```typescript
name: string = '';                         // Panel identifier
transitionIn: string = '';                 // Transition when showing
transitionOut: string = '';                // Transition when hiding
transitioning: 'in'|'out'|'' = '';        // Transition state
transitionDuration: number = 300;          // Transition duration (ms)
```

## Usage

```html
<snice-tabs>
  <snice-tab slot="nav">Tab 1</snice-tab>
  <snice-tab slot="nav">Tab 2</snice-tab>

  <snice-tab-panel>Content 1</snice-tab-panel>
  <snice-tab-panel>Content 2</snice-tab-panel>
</snice-tabs>
```

```typescript
tabs.addEventListener('tab-change', (e) => {
  console.log(e.detail.index);
});

tabs.selectTab(1);
```

## Notes

- Tabs use `slot="nav"` attribute
- Panels in default slot
- Automatically manages ARIA attributes
- Supports keyboard navigation
