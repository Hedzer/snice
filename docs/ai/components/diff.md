# snice-diff

Text diff viewer with unified and split (side-by-side) modes, line numbers, collapsible unchanged sections, and addition/deletion stats.

## Properties

```ts
oldText: string = ''             // attr: old-text — Original text
newText: string = ''             // attr: new-text — Modified text
language: string = ''            // attr: language — Language hint (for future syntax highlighting)
mode: DiffMode = 'unified'      // attr: mode — 'unified' | 'split'
lineNumbers: boolean = true      // attr: line-numbers — Show line number gutters
contextLines: number = 3         // attr: context-lines — Unchanged lines shown around changes
markers: boolean = true          // attr: markers — Show +/- markers column
```

## Events

- `diff-computed` -> `{ hunks: DiffHunk[], additions: number, deletions: number }` — Fires after diff is calculated

## Types

```ts
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

## CSS Custom Properties

```css
--diff-add-bg              /* Added line background */
--diff-remove-bg           /* Removed line background */
--diff-add-word-bg         /* Word-level added highlight */
--diff-remove-word-bg      /* Word-level removed highlight */
```

**CSS Parts:**
- `base` - Outer diff container div
- `header` - Header with stats and mode toggle buttons
- `content` - Diff content area containing the diff table(s)

## Behavior

- LCS-based diff algorithm computes on `oldText`/`newText`/`contextLines` change
- Unchanged sections beyond context are collapsed; click to expand
- Header shows +N/-N stats and unified/split toggle buttons
- Dark mode support via `[data-theme="dark"]` or `prefers-color-scheme: dark`

## Usage

```html
<snice-diff old-text="hello world" new-text="hello there" mode="unified" context-lines="3"></snice-diff>
```

```js
const diff = document.querySelector('snice-diff');
diff.oldText = originalCode;
diff.newText = modifiedCode;
diff.addEventListener('diff-computed', e => {
  console.log(`+${e.detail.additions} -${e.detail.deletions}`);
});
```
