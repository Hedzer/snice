# Component Documentation Guide

Every component needs **two** doc files:

- `docs/components/<name>.md` — Human-readable, detailed, with examples
- `docs/ai/components/<name>.md` — Low-token AI reference, concise

Both must stay in sync. When updating one, update the other.

---

## Human Docs: `docs/components/<name>.md`

Modeled after [Shoelace](https://shoelace.style) — the gold standard for web component docs.

### Section Order (strict)

```
1. <!-- AI: ... --> comment (invisible HTML comment linking to AI docs)
2. # Component Name
3. Description paragraph
4. ## Table of Contents (links to all sections below)
5. ## Components (only if multi-element, e.g. accordion + accordion-item)
6. ## Properties (table format)
7. ## Methods
8. ## Events
9. ## Slots
10. ## CSS Parts (or ## CSS Custom Properties if applicable)
11. ## Basic Usage (simplest example + import statement)
12. ## Examples (H2, individual examples as H3)
13. ## Keyboard Navigation (only if applicable)
14. ## Accessibility
```

**Removed sections** (do NOT include):
- `## Importing` — merge import code into Basic Usage
- `## Browser Support`
- `## Common Patterns`

### Section Details

#### 1. AI Comment + Title + Description

```markdown
<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/button.md -->

# Button Component

Buttons represent actions available to the user.
```

#### 2. Table of Contents

Links to every section that exists in the doc. Anchors are lowercase, spaces→hyphens.

```markdown
## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
```

#### 3. Examples

Each example gets an H3 heading. Follow this pattern:

1. **One sentence** explaining when/why, referencing the attribute name in backticks
2. **Code example** showing the feature

Order examples: visual variants first, then behavioral features, then composition, then advanced.

```markdown
## Examples

### Variants

Use the `variant` attribute to set the button's visual style.

\`\`\`html
<snice-button variant="primary">Primary</snice-button>
<snice-button variant="success">Success</snice-button>
<snice-button variant="danger">Danger</snice-button>
\`\`\`

### Sizes

Use the `size` attribute to change the button's size.

\`\`\`html
<snice-button size="small">Small</snice-button>
<snice-button size="large">Large</snice-button>
\`\`\`

### Loading

Set the `loading` attribute to show a spinner and disable interaction.

\`\`\`html
<snice-button loading>Saving...</snice-button>
\`\`\`
```

**Rules for examples:**
- One feature per example
- Show 2-3 variations, not every permutation
- Real-world labels (not "Button 1", "Button 2")
- Include comments only when behavior isn't obvious

#### 6. Slots

Markdown table. List default slot first.

```markdown
## Slots

| Name | Description |
|------|-------------|
| (default) | Button label content |
| `icon` | Custom icon content (overrides `icon` property) |
```

#### 7. Properties

Markdown table with 4 columns. Show attribute name if it differs from the JS property.

```markdown
## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'text'` | `'default'` | Visual style |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `disabled` | `boolean` | `false` | Disables the button |
| `loading` | `boolean` | `false` | Shows loading spinner |
```

Note the attribute name when it differs:

```markdown
| `iconPlacement` (attr: `icon-placement`) | `'start' \| 'end'` | `'start'` | Icon position |
```

#### 8. Events

```markdown
## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `snice-click` | `{ originalEvent: MouseEvent }` | Fired on click |
```

#### 9. Methods

```markdown
## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | `options?: FocusOptions` | Focuses the button |
| `blur()` | — | Removes focus |
```

#### 10-11. CSS Custom Properties & Parts (if applicable)

```markdown
## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--button-height` | Button height | `auto` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The button element |
| `label` | The label container |
```

---

## AI Docs: `docs/ai/components/<name>.md`

**Goal: Minimum tokens, maximum signal.** An AI agent reading this should be able to use the component correctly without reading the human docs.

### Format

AI docs follow the **same section order** as human docs, but in low-token format:

```markdown
# snice-<name>

One-line description.

## Properties

\`\`\`typescript
variant: 'default'|'primary'|'success'|'warning'|'danger'|'text' = 'default';
size: 'small'|'medium'|'large' = 'medium';
disabled: boolean = false;
loading: boolean = false;
\`\`\`

## Methods

- `focus(options?)` - Focus
- `blur()` - Remove focus

## Events

- `snice-click` → `{ originalEvent: MouseEvent }`

## Slots

- `(default)` - Label content
- `icon` - Custom icon (overrides `icon` prop)

## CSS Parts

- `base` - The button element
- `label` - The label container

## Basic Usage

\`\`\`html
<snice-button variant="primary">Save</snice-button>
<snice-button loading disabled>Processing</snice-button>
\`\`\`

## Accessibility

- Keyboard: Enter, Space to activate
- ARIA: role=button, aria-disabled
```

### AI Doc Rules

- **TypeScript property signatures** in a single code block, not a table
- **Bullets** for slots, events, methods — not tables
- **One usage block** with the most common patterns, not exhaustive examples
- **No prose paragraphs** — every line carries information
- **No tutorials, no "Getting Started", no step-by-step**
- **Arrow notation** for event details: `event-name` → `{ payload }`
- **Dash notation** for methods: `methodName(args)` - description
- **50-150 lines max** per component

---

## Writing Docs From Source

When documenting a component, read these files:

1. `components/<name>/snice-<name>.ts` — Properties (`@property`), methods, events (`@dispatch`), slots
2. `components/<name>/snice-<name>.types.ts` — TypeScript interfaces and type definitions
3. `components/<name>/snice-<name>.css` — CSS custom properties, parts
4. `components/<name>/demo.html` — Working examples showing real usage

Extract:
- Every `@property()` decorator → Properties section
- Every `@dispatch()` decorator → Events section
- Every public method → Methods section
- Every `<slot>` in the template → Slots section
- Every `::part()` in CSS → CSS Parts section
- Every `--snice-*` custom property → CSS Custom Properties section
