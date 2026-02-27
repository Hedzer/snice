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
<script>document.getElementById('cb').code = 'const x = 1;';</script>
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
<snice-code-block id="cb" grammar="grammars/typescript.json" fetch-mode="event" code="const x = 1"></snice-code-block>
<script>
  document.getElementById('cb').addEventListener('grammar-request', async (e) => {
    const grammar = await fetch(e.detail.url).then(r => r.json());
    e.detail.codeBlock.setGrammar(grammar);
  });
</script>
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
- `setGrammar(grammar)` - Provide grammar object directly (used with `fetch-mode="event"`)

## Events

- `code-copy` (detail: { code, codeBlock })
- `code-before-highlight` (detail: { code, language, codeBlock })
- `code-after-highlight` (detail: { code, language, codeBlock })
- `grammar-request` (detail: { url, language, codeBlock }) — only dispatched when `fetch-mode="event"`
- `grammar-loaded` (detail: { grammar, url, language, codeBlock }) — fired after grammar is successfully loaded (any fetch mode) or set via `setGrammar()`

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
<snice-code-block id="code" language="javascript" grammar="grammars/typescript.json" show-line-numbers filename="app.js"></snice-code-block>
<script>
  document.getElementById('code').code = `console.log('hello');`;
</script>
```
