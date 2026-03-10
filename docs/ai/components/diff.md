# snice-diff

Text diff viewer with unified and split (side-by-side) modes, line numbers, collapsible unchanged sections, and addition/deletion stats.

## Properties

```typescript
oldText: string = '';            // attr: old-text
newText: string = '';            // attr: new-text
language: string = '';           // Language hint (future syntax highlighting)
mode: 'unified'|'split' = 'unified';
lineNumbers: boolean = true;     // attr: line-numbers
contextLines: number = 3;        // attr: context-lines
markers: boolean = true;         // Show +/- markers column
```

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

- `diff-computed` → `{ hunks: DiffHunk[], additions: number, deletions: number }`

## CSS Custom Properties

- `--diff-add-bg` - Added line background
- `--diff-remove-bg` - Removed line background
- `--diff-add-word-bg` - Word-level added highlight
- `--diff-remove-word-bg` - Word-level removed highlight

## CSS Parts

- `base` - Outer diff container
- `header` - Header with stats and mode toggle buttons
- `content` - Diff content area with diff table(s)

## Basic Usage

```html
<snice-diff old-text="hello world" new-text="hello there" mode="unified" context-lines="3"></snice-diff>
```

```typescript
diff.oldText = originalCode;
diff.newText = modifiedCode;
diff.addEventListener('diff-computed', e => {
  console.log(`+${e.detail.additions} -${e.detail.deletions}`);
});
```

## Accessibility

- LCS-based diff computed on oldText/newText/contextLines change
- Unchanged sections beyond context are collapsed; click to expand
- Header shows +N/-N stats and unified/split toggle
- Dark mode via `[data-theme="dark"]` or `prefers-color-scheme: dark`
