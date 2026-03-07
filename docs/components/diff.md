<!-- AI: For a low-token version of this doc, use docs/ai/components/diff.md instead -->

# Diff Component

The diff component displays a text diff between two strings with unified or side-by-side (split) views, line numbers, word-level highlighting, collapsible unchanged sections, and addition/deletion statistics.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-diff old-text="hello world" new-text="hello there"></snice-diff>
```

```typescript
import 'snice/components/diff/snice-diff';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `oldText` (attr: `old-text`) | `string` | `''` | The original text |
| `newText` (attr: `new-text`) | `string` | `''` | The modified text |
| `language` | `string` | `''` | Language hint for future syntax highlighting support |
| `mode` | `'unified' \| 'split'` | `'unified'` | Display mode: unified inline view or side-by-side split view |
| `lineNumbers` (attr: `line-numbers`) | `boolean` | `true` | Show line number gutters |
| `contextLines` (attr: `context-lines`) | `number` | `3` | Number of unchanged lines shown around each change |
| `markers` | `boolean` | `true` | Show the +/- markers column |

### Types

```typescript
interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  oldLine: number | null;
  newLine: number | null;
  content: string;
}

interface DiffHunk {
  lines: DiffLine[];
  collapsed: boolean;
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `diff-computed` | `{ hunks: DiffHunk[], additions: number, deletions: number }` | Fired after the diff is calculated, with hunk data and stats |

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--snice-diff-added-bg` | Background color for added lines |
| `--snice-diff-removed-bg` | Background color for removed lines |
| `--snice-diff-added-word-bg` | Word-level highlight color for added text |
| `--snice-diff-removed-word-bg` | Word-level highlight color for removed text |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer diff container |
| `header` | `<div>` | Header with addition/deletion stats and mode toggle buttons |
| `content` | `<div>` | Diff content area containing the diff table(s) |

```css
snice-diff::part(base) {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

snice-diff::part(header) {
  padding: 8px 12px;
  background: #f8fafc;
}
```

## Examples

### Unified Diff View

The default unified mode shows all changes inline with +/- markers.

```html
<snice-diff
  old-text="function greet(name) {
  return 'Hello, ' + name;
}"
  new-text="function greet(name) {
  return `Hello, ${name}!`;
}"
  mode="unified"
  context-lines="3">
</snice-diff>
```

### Side-by-Side Split View

Use `mode="split"` to display old and new text in separate columns.

```html
<snice-diff
  id="split-diff"
  mode="split"
  line-numbers
  context-lines="3">
</snice-diff>

<script type="module">
  import 'snice/components/diff/snice-diff';

  const diff = document.getElementById('split-diff');
  diff.oldText = `const x = 1;
const y = 2;
const z = x + y;
console.log(z);`;

  diff.newText = `const x = 10;
const y = 2;
const sum = x + y;
console.log(sum);
console.log('done');`;
</script>
```

### Without Line Numbers or Markers

Set `line-numbers="false"` and `markers="false"` for a minimal view.

```html
<snice-diff
  old-text="The quick brown fox"
  new-text="The slow red fox"
  line-numbers="false"
  markers="false">
</snice-diff>
```

### Listening to Diff Stats

Use the `diff-computed` event to access addition and deletion counts.

```html
<snice-diff id="stats-diff" old-text="Line A" new-text="Line B"></snice-diff>
<p id="diff-stats"></p>

<script type="module">
  const diff = document.getElementById('stats-diff');
  diff.addEventListener('diff-computed', (e) => {
    const { additions, deletions } = e.detail;
    document.getElementById('diff-stats').textContent =
      `+${additions} additions, -${deletions} deletions`;
  });
</script>
```

### Comparing Large Texts with Collapsed Sections

When comparing large files, unchanged sections beyond the `context-lines` threshold are collapsed. Click the collapsed section indicator to expand it.

```html
<snice-diff
  id="large-diff"
  mode="unified"
  context-lines="2">
</snice-diff>

<script type="module">
  const diff = document.getElementById('large-diff');

  diff.oldText = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}: original content`).join('\n');
  diff.newText = Array.from({ length: 50 }, (_, i) => {
    if (i === 10) return `Line ${i + 1}: MODIFIED content`;
    if (i === 40) return `Line ${i + 1}: ALSO changed`;
    return `Line ${i + 1}: original content`;
  }).join('\n');
</script>
```

## Accessibility

- **Dark mode support**: Automatically adapts colors for `[data-theme="dark"]` and `prefers-color-scheme: dark`
- **Line numbers**: Provide clear reference points for discussing specific changes
- **Color coding**: Added lines are highlighted with a green background, removed lines with red, providing clear visual distinction
- **Word-level diffs**: Within changed lines, the specific words that differ are highlighted for precision
- **Collapsible sections**: Large unchanged regions are collapsed to reduce noise and can be expanded on demand
- **Stats header**: The +N/-N summary provides an immediate overview of the change scope
