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
1. Title + Tag Name
2. One-sentence description
3. Basic Usage (simplest possible example)
4. Import paths (ESM, CDN)
5. Examples (H2)
   └── Individual examples (H3 each)
6. Slots
7. Properties
8. Events
9. Methods
10. CSS Custom Properties (if any)
11. CSS Parts (if any)
```

### Section Details

#### 1. Title + Tag Name

```markdown
# Button
`<snice-button>`
```

#### 2. Description

One sentence. What it is and what it does. No fluff.

```markdown
Buttons represent actions available to the user.
```

#### 3. Basic Usage

The absolute simplest example. Import + minimal HTML.

```markdown
## Basic Usage

\`\`\`typescript
import 'snice/components/button/snice-button';
\`\`\`

\`\`\`html
<snice-button>Click me</snice-button>
\`\`\`
```

#### 4. Import Paths

Show ESM and CDN.

```markdown
## Importing

**ESM (bundler)**
\`\`\`typescript
import 'snice/components/button/snice-button';
\`\`\`

**CDN**
\`\`\`html
<script src="snice-runtime.min.js"></script>
<script src="snice-button.min.js"></script>
\`\`\`
```

#### 5. Examples

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

## Slots

- `(default)` - Label content
- `icon` - Custom icon (overrides `icon` prop)

## Events

- `snice-click` → `{ originalEvent: MouseEvent }`

## Methods

- `focus(options?)` - Focus
- `blur()` - Remove focus

## Usage

\`\`\`html
<snice-button variant="primary">Save</snice-button>
<snice-button loading disabled>Processing</snice-button>
<snice-button href="/page" target="_blank">Link</snice-button>
\`\`\`
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
