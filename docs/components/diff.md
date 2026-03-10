<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/diff.md -->

# Diff Component
`<snice-diff>`

Text diff viewer with unified and split (side-by-side) modes, line numbers, word-level highlighting, collapsible unchanged sections, and addition/deletion statistics.

## Table of Contents
- [Properties](#properties)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

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
| `--diff-add-bg` | Background color for added lines |
| `--diff-remove-bg` | Background color for removed lines |
| `--diff-add-word-bg` | Word-level highlight color for added text |
| `--diff-remove-word-bg` | Word-level highlight color for removed text |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer diff container |
| `header` | Header with addition/deletion stats and mode toggle buttons |
| `content` | Diff content area containing the diff table(s) |

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

## Basic Usage

```typescript
import 'snice/components/diff/snice-diff';
```

```html
<snice-diff old-text="hello world" new-text="hello there"></snice-diff>
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-diff.min.js"></script>
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

- Dark mode support via `[data-theme="dark"]` and `prefers-color-scheme: dark`
- Line numbers provide clear reference points for discussing specific changes
- Color coding: added lines highlighted green, removed lines red
- Word-level diffs highlight the specific words that differ within changed lines
- Collapsible sections reduce noise; click to expand
- Stats header provides an immediate +N/-N overview of change scope
