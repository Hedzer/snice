# snice-code-block

Code display with syntax highlighting, line numbers, copy, and grammar-based formatting.

## Properties

```typescript
code: string = '';                // Set via slot or property
language: 'javascript'|'typescript'|'html'|'css'|'json'|'python'|'bash'|'plaintext' = 'plaintext';
grammar: GrammarDefinition | string | null = null;  // Grammar object or URL to JSON
showLineNumbers: boolean = false;  // attribute: show-line-numbers
startLine: number = 1;            // attribute: start-line
highlightLines: number[] = [];    // attribute: highlight-lines
copyable: boolean = true;
filename: string = '';
format: string = '';              // Formatter name (e.g. "pretty"), or truthy string with setFormatter()
theme: '' | 'dark' | 'light' = '';  // Force theme; empty = auto-detect
fetchMode: 'native' | 'virtual' | 'event' = 'native';  // attribute: fetch-mode
```

## Methods

- `copy()` - Copy code to clipboard
- `highlight()` - Trigger syntax highlighting
- `setHighlighter(fn)` - Set external highlighter
- `setFormatter(fn)` - Set formatter function
- `setGrammar(grammar)` - Set grammar object programmatically

## Events

- `code-copy` -> `{ code, codeBlock }`
- `code-before-format` / `code-after-format` -> `{ code, language, codeBlock }`
- `code-before-highlight` / `code-after-highlight` -> `{ code, language, codeBlock }`
- `grammar-request` -> `{ url, language, codeBlock }` (only fetch-mode="event")
- `grammar-loaded` -> `{ grammar, url, language, codeBlock }`

## Slots

- `(default)` - Code content as slotted text (auto-dedented)

## CSS Parts

- `container` - Outer wrapper
- `header` - Header bar (filename + copy button)
- `filename` - Filename display
- `copy-button` - Copy button
- `content` - Scrollable code area
- `pre` - Pre-formatted container
- `code` - Code element with tokens

## Basic Usage

```html
<snice-code-block language="javascript" grammar="grammars/typescript.json">
const x = 1;
</snice-code-block>
```

```typescript
import 'snice/components/code-block/snice-code-block';
cb.code = 'const x = 1;';
```

## Fetch Mode

- `native` (default) - fetch(url)
- `virtual` - @request/@respond pattern
- `event` - Dispatches `grammar-request`, listener calls `setGrammar()`

## Formatters

Grammar-based: `format="pretty"` (grammars: json, typescript, css, snice)

Imperative: `setFormatter(fn)` overrides grammar formatters

```typescript
import { createJsonFormatter } from 'snice/components/code-block/formatters/json';
codeBlock.setFormatter(createJsonFormatter({ indent: 2 }));
codeBlock.format = 'pretty';
```

## Grammar Files

- `typescript.json` - TypeScript/JavaScript
- `html.json` - HTML/XML
- `css.json` - CSS/SCSS/Less
- `json.json` - JSON
- `python.json` - Python
- `bash.json` - Bash/Shell
- `snice.json` - Snice (TS + template highlighting)

## Theming

Auto-follows `data-theme` or OS `prefers-color-scheme`. Force with `theme="dark"|"light"`.

Token colors: `--code-keyword-color`, `--code-function-color`, `--code-string-color`, etc.
Structural: `--code-block-bg`, `--code-block-text`, `--code-block-header-bg`.

## Accessibility

- Auto theme detection (light/dark)
- Semantic pre/code elements
- Copy button
