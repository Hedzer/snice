# snice-tabs

Tabbed interface with tab buttons and content panels.

## snice-tabs (Container)

```typescript
selected: number = 0;
placement: 'top'|'bottom'|'start'|'end' = 'top';
noScrollControls: boolean = false;  // attr: no-scroll-controls
transition: string = 'none';
```

## snice-tab (Tab Button)

```typescript
disabled: boolean = false;
closable: boolean = false;
```

## snice-tab-panel (Content Panel)

```typescript
name: string = '';
transitionIn: string = '';        // attr: transition-in
transitionOut: string = '';       // attr: transition-out
transitionDuration: number = 300; // attr: transition-duration
```

## Events

- `tab-change` → `{ index, oldIndex, tab, panel }` - Tab switched
- `tab-select` → `{ tab }` - Tab clicked
- `tab-close` → `{ tab }` - Close button clicked

## Methods

- `selectTab(index)` - Select tab by index
- `show(index)` - Alias for selectTab
- `getTab(index)` - Get tab element
- `getPanel(index)` - Get panel element

## Usage

```html
<snice-tabs>
  <snice-tab slot="nav">Tab 1</snice-tab>
  <snice-tab slot="nav">Tab 2</snice-tab>
  <snice-tab-panel>Content 1</snice-tab-panel>
  <snice-tab-panel>Content 2</snice-tab-panel>
</snice-tabs>

<!-- Placement -->
<snice-tabs placement="bottom">...</snice-tabs>
<snice-tabs placement="start">...</snice-tabs>

<!-- Closable -->
<snice-tab slot="nav" closable>Closable Tab</snice-tab>

<!-- Disabled -->
<snice-tab slot="nav" disabled>Disabled Tab</snice-tab>
```
