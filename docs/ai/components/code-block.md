# snice-code-block

Code display with syntax highlighting, line numbers, copy.

## Code Content

Code can be provided via **slotted text content** (preferred) or the `code` property:

```html
<!-- Slotted (preferred) -->
<snice-code-block language="javascript">
const x = 1;
</snice-code-block>

<!-- Property (programmatic) -->
<snice-code-block id="cb"></snice-code-block>
```

```typescript
cb.code = 'const x = 1;';
```

Slotted content is hidden and re-rendered with highlighting in the shadow DOM. If both are provided, slotted content sets the `code` property on ready.

## Properties

```typescript
code: string = '';              // Set via slot or property (not recommended as attribute)
language: 'javascript'|'typescript'|'html'|'css'|'json'|'python'|'bash'|'plaintext' = 'plaintext';
grammar: GrammarDefinition | string | null = null;  // Grammar object or URL to JSON
showLineNumbers: boolean = false;
startLine: number = 1;
highlightLines: number[] = [];
copyable: boolean = true;
filename: string = '';
format: string = '';             // Formatter name from grammar (e.g. "pretty"), or any truthy string with setFormatter()
theme: '' | 'dark' | 'light' = '';  // Force theme; empty = auto-detect from page/OS
```

## Fetch Mode

```typescript
fetchMode: 'native' | 'virtual' | 'event' = 'native'  // attribute: fetch-mode
```

Controls how grammar JSON is loaded when `grammar` is a URL string.

- **`native`** (default) — `fetch(url).then(r => r.json())`. No external wiring needed.
- **`virtual`** — Uses `@request/@respond` pattern (`snice/code-block/load-grammar`). Requires a `@respond` handler.
- **`event`** — Dispatches `grammar-request` CustomEvent with `{ url, language, codeBlock }` detail. Listener calls `codeBlock.setGrammar()` to provide grammar.

**Note:** If using `@respond('snice/code-block/load-grammar')`, add `fetch-mode="virtual"`. Default is `native`.

### Native (default)

```html
<snice-code-block grammar="grammars/typescript.json" code="const x = 1"></snice-code-block>
```

### Virtual

```html
<snice-code-block grammar="grammars/typescript.json" fetch-mode="virtual" code="const x = 1"></snice-code-block>
```

Requires `@respond('snice/code-block/load-grammar')` handler (controller or page).

### Event

```html
<snice-code-block grammar="grammars/typescript.json" fetch-mode="event" code="const x = 1"></snice-code-block>
```

```typescript
cb.addEventListener('grammar-request', async (e) => {
  const grammar = await fetch(e.detail.url).then(r => r.json());
  e.detail.codeBlock.setGrammar(grammar);
});
```

Event detail type:
```typescript
interface GrammarRequestDetail {
  url: string;
  language: CodeLanguage;
  codeBlock: SniceCodeBlockElement;
}
```

## Methods

- `copy()` - Copy code to clipboard
- `highlight()` - Manually trigger syntax highlighting
- `setHighlighter(fn)` - Set external highlighter for this instance
- `setFormatter(fn)` - Set formatter function for this instance
- `setGrammar(grammar)` - Provide grammar object directly (used with `fetch-mode="event"`)

## Events

- `code-copy` (detail: { code, codeBlock })
- `code-before-format` (detail: { code, language, codeBlock })
- `code-after-format` (detail: { code, language, codeBlock })
- `code-before-highlight` (detail: { code, language, codeBlock })
- `code-after-highlight` (detail: { code, language, codeBlock })
- `grammar-request` (detail: { url, language, codeBlock }) — only dispatched when `fetch-mode="event"`
- `grammar-loaded` (detail: { grammar, url, language, codeBlock }) — fired after grammar is successfully loaded (any fetch mode) or set via `setGrammar()`

## Formatters

Code formatters run as a pre-step before highlighting. Set `format` to a formatter name.

### Grammar-Based Formatters (Declarative)

Grammars can include a `formatters` section with named rule sets. Use `format="name"` to select one:

```html
<snice-code-block grammar="grammars/json.json" format="pretty" code='{"a":1}'></snice-code-block>
```

Grammars with `"pretty"` formatters: `json.json`, `typescript.json`, `css.json`, `snice.json`.

```typescript
interface FormatRules {
  tabSize?: number;          // Indent width (default 2)
  useTabs?: boolean;         // Tabs instead of spaces
  newlineAfter?: string;     // Regex char class — newline after these chars
  newlineBefore?: string;    // Regex char class — newline before these chars
  spaceAfter?: string;       // Regex char class — space after
  spaceBefore?: string;      // Regex char class — space before
  spaceAround?: string;      // Regex char class — space both sides
  indent?: string;           // Regex char class — increase indent
  dedent?: string;           // Regex char class — decrease indent
  trimTrailing?: boolean;    // Trim trailing whitespace (default true)
  collapseBlankLines?: number; // Max consecutive blank lines
  skipStrings?: boolean;     // Skip rules inside strings (default true)
  skipComments?: boolean;    // Skip rules inside comments (default true)
}
```

### Imperative Formatters

`setFormatter(fn)` overrides grammar-based formatters when both are present.

```typescript
type FormatterFunction = (code: string, language: string) => string | Promise<string>;
```

**`formatters/json.ts`** — JSON pretty-printer (zero-dependency):
```typescript
import { createJsonFormatter } from 'snice/components/code-block/formatters/json';
codeBlock.setFormatter(createJsonFormatter({ indent: 2 }));
codeBlock.format = 'pretty';
```

**`formatters/indent.ts`** — Indent normalizer (zero-dependency):
```typescript
import { createIndentFormatter } from 'snice/components/code-block/formatters/indent';
codeBlock.setFormatter(createIndentFormatter({ tabSize: 2, useTabs: false }));
codeBlock.format = 'pretty';
```

**`formatters/prettier.ts`** — Prettier adapter:
```typescript
import { setupPrettierFormatter } from 'snice/components/code-block/formatters/prettier';
import * as prettier from 'prettier/standalone';
import parserBabel from 'prettier/plugins/babel';
codeBlock.setFormatter(setupPrettierFormatter(prettier, [parserBabel]));
codeBlock.format = 'pretty';
```

### Whitespace Handling

Slotted content is automatically dedented — common leading indentation from HTML nesting is stripped while preserving relative indentation.

## Theming

Auto-follows `data-theme` attribute on page or OS `prefers-color-scheme`. Dark (One Dark) and light (One Light) built-in.

- No attribute / `theme=""` → auto-detect from `[data-theme]` or OS preference
- `theme="dark"` → force One Dark regardless of page theme
- `theme="light"` → force One Light regardless of page theme

Override individual colors: `--code-keyword-color`, `--code-function-color`, etc.
Override structural colors: `--code-block-bg`, `--code-block-text`, `--code-block-header-bg`.

## Grammar System

JSON-driven tokenizer with Monarch-inspired state machine. Grammars are **external JSON files**, not bundled in the component.

### Available Grammar Files

Load from `components/code-block/grammars/` (or `dist/components/code-block/grammars/` in builds):
- `typescript.json` — TypeScript/JavaScript
- `html.json` — HTML/XML
- `css.json` — CSS/SCSS/Less
- `json.json` — JSON
- `python.json` — Python
- `bash.json` — Bash/Shell
- `snice.json` — Snice (TypeScript + html``/css`` template highlighting)

### Highlighter API

```typescript
import { highlightCode, tokenize, registerGrammar, unregisterGrammar, getGrammar } from 'snice/components/code-block/highlighter';

highlightCode(code, grammarOrName);  // → HTML string
registerGrammar('myLang', grammar);  // Register for name lookup
```

## Usage

```html
<!-- Slotted content (preferred) -->
<snice-code-block language="javascript" grammar="grammars/typescript.json" show-line-numbers filename="app.js">
console.log('hello');
</snice-code-block>

<!-- Programmatic -->
<snice-code-block language="javascript" grammar="grammars/typescript.json" show-line-numbers filename="app.js"></snice-code-block>
```

```typescript
codeBlock.code = `console.log('hello');`;
```
