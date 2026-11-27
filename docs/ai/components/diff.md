# snice-diff

Text diff viewer with unified and split (side-by-side) modes, line numbers, collapsible unchanged sections, and addition/deletion stats.

## Properties

```typescript
oldText: string = '';            // attr: old-text
newText: string = '';            // attr: new-text
language: string = '';           // Language hint (future syntax highlighting)
mode: 'unified'|'split' = 'unified';  // header toggle self-assigns this; announced via mode-change
showModeToggle: boolean = true;  // attr: show-mode-toggle; "false" hides the built-in Unified/Split toggle
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
- `mode-change` → `{ mode }` — only when the built-in header toggle changes `mode`, not for external assignments

## CSS Custom Properties

- `--diff-add-bg` - Added line background
- `--diff-remove-bg` - Removed line background
- `--diff-add-word-bg` - Word-level added highlight
- `--diff-remove-word-bg` - Word-level removed highlight

## CSS Parts

- `base` - Outer diff container
- `header` - Header with addition/deletion stats and mode toggle buttons
- `stat` - A change count in the header
- `stat-additions` - The additions count `stat`
- `stat-deletions` - The deletions count `stat`
- `controls` - Mode toggle button group
- `button` - A mode toggle button
- `mode-button` - A mode toggle button (same element as `button`)
- `mode-button-unified` - The unified `mode-button`
- `mode-button-split` - The split `mode-button`
- `content` - Diff content area containing the diff table(s)
- `split` - Split-view wrapper holding both panes
- `pane` - A split-view pane
- `pane-old` - The old-text `pane`
- `pane-new` - The new-text `pane`
- `table` - A diff table
- `row` - A diff table row
- `cell` - A diff table cell
- `gutter` - A line-number `cell`
- `marker` - A `+`/`-` marker `cell`
- `code` - A code content `cell`
- `hunk-separator` - The collapsed-hunk `cell` (click to expand)

State tokens:

- `mode-button-active` - Added to `mode-button` while that mode is selected
- `row-added` - Added to `row` for an added line
- `row-removed` - Added to `row` for a removed line
- `row-unchanged` - Added to `row` for an unchanged line
- `row-hunk` - Added to `row` for a collapsed-hunk separator row

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
