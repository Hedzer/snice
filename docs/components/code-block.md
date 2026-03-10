<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/code-block.md -->

# Code Block Component

Display code with syntax highlighting, line numbers, and copy functionality. Uses a JSON-driven tokenizer engine with Monarch-inspired state machine for syntax highlighting.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `code` | `string` | `''` | Code content (set via slot or property) |
| `language` | `CodeLanguage` | `'plaintext'` | Programming language |
| `grammar` | `Grammar \| string \| null` | `null` | Grammar object or URL to grammar JSON |
| `showLineNumbers` (attr: `show-line-numbers`) | `boolean` | `false` | Show line numbers |
| `startLine` (attr: `start-line`) | `number` | `1` | Starting line number |
| `highlightLines` (attr: `highlight-lines`) | `number[]` | `[]` | Lines to highlight |
| `copyable` | `boolean` | `true` | Show copy button |
| `filename` | `string` | `''` | File name to display in header |
| `format` | `string` | `''` | Formatter name from grammar (e.g. `"pretty"`), or any truthy string with `setFormatter()` |
| `theme` | `'' \| 'dark' \| 'light'` | `''` | Force a specific color theme; empty = auto-detect from page/OS |
| `fetchMode` (attr: `fetch-mode`) | `'native' \| 'virtual' \| 'event'` | `'native'` | How grammar URLs are fetched |

### Fetch Mode

- **`native`** (default) -- `fetch(url).then(r => r.json())`. No external wiring needed.
- **`virtual`** -- Uses `@request/@respond` pattern (`snice/code-block/load-grammar`). Requires a `@respond` handler.
- **`event`** -- Dispatches `grammar-request` CustomEvent. Listener calls `codeBlock.setGrammar()` to provide grammar.

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `copy()` | -- | Copy code to clipboard |
| `highlight()` | -- | Manually trigger syntax highlighting |
| `setHighlighter()` | `fn: HighlighterFunction` | Set an external highlighter function |
| `setFormatter()` | `fn: FormatterFunction` | Set a code formatter function |
| `setGrammar()` | `grammar: Grammar` | Set a grammar object programmatically |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `code-copy` | `{ code, codeBlock }` | Code copied to clipboard |
| `code-before-format` | `{ code, language, codeBlock }` | Before formatting |
| `code-after-format` | `{ code, language, codeBlock }` | After formatting |
| `code-before-highlight` | `{ code, language, codeBlock }` | Before highlighting |
| `code-after-highlight` | `{ code, language, codeBlock }` | After highlighting |
| `grammar-request` | `{ url, language, codeBlock }` | Grammar fetch requested (only when `fetch-mode="event"`) |
| `grammar-loaded` | `{ grammar, url, language, codeBlock }` | Grammar loaded (any mode) or set via `setGrammar()` |

## Slots

| Name | Description |
|------|-------------|
| (default) | Code content as slotted text (auto-dedented) |

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | The outer code block wrapper |
| `header` | The header bar with filename and copy button |
| `filename` | The filename display |
| `copy-button` | The copy-to-clipboard button |
| `content` | The scrollable code content area |
| `pre` | The pre-formatted code container |
| `code` | The code element containing highlighted tokens |

## Basic Usage

```html
<snice-code-block language="javascript" grammar="grammars/typescript.json">
const x = 1;
console.log(x);
</snice-code-block>
```

```typescript
import 'snice/components/code-block/snice-code-block';
```

## Examples

### With Line Numbers and Filename

Set `show-line-numbers` and `filename` for a file-like display.

```html
<snice-code-block grammar="grammars/typescript.json" language="typescript" show-line-numbers filename="index.ts">
const greeting = 'Hello World';
console.log(greeting);
</snice-code-block>
```

### Highlight Specific Lines

Use `highlight-lines` to draw attention to specific lines.

```html
<snice-code-block grammar="grammars/python.json" language="python" highlight-lines="[2,3,4]">
def hello():
    name = "World"
    greeting = f"Hello {name}"
    print(greeting)
</snice-code-block>
```

### Programmatic Code

Set code via the `code` property for dynamic content.

```html
<snice-code-block id="code" language="javascript" grammar="grammars/typescript.json"></snice-code-block>

<script>
  document.getElementById('code').code = `
function hello() {
  console.log("Hello World");
}
  `;
</script>
```

### Force Theme

Use `theme` to override auto-detection.

```html
<snice-code-block theme="dark" language="javascript">const x = 1;</snice-code-block>
<snice-code-block theme="light" language="javascript">const x = 1;</snice-code-block>
```

### Grammar-Based Formatter

Use `format="pretty"` with a grammar that includes formatters.

```html
<snice-code-block grammar="grammars/json.json" format="pretty" code='{"a":1,"b":[2,3]}'></snice-code-block>
```

Grammars with built-in `"pretty"` formatters: `json.json`, `typescript.json`, `css.json`, `snice.json`.

### Imperative Formatter

Use `setFormatter()` for custom formatting logic.

```typescript
import { createJsonFormatter } from 'snice/components/code-block/formatters/json';

codeBlock.setFormatter(createJsonFormatter({ indent: 2 }));
codeBlock.format = 'pretty';
codeBlock.code = '{"name":"snice","version":"4.0.0"}';
```

### Event-Based Grammar Loading

Use `fetch-mode="event"` to control grammar loading externally.

```html
<snice-code-block grammar="grammars/typescript.json" fetch-mode="event" id="cb"></snice-code-block>

<script>
  cb.addEventListener('grammar-request', async (e) => {
    const grammar = await fetch(e.detail.url).then(r => r.json());
    e.detail.codeBlock.setGrammar(grammar);
  });
</script>
```

### Inline Grammar Object

Pass a grammar object directly via JavaScript.

```javascript
codeBlock.grammar = {
  name: 'my-language',
  keywords: ['func', 'var', 'return'],
  tokenizer: {
    root: [
      ['//.*$', 'comment'],
      ['"[^"]*"', 'string'],
      ['\\b\\d+\\b', 'number'],
      ['[a-zA-Z_]\\w*', { cases: { '@keywords': 'keyword', '@default': '' } }]
    ]
  }
};
codeBlock.code = 'func main() { return 42; }';
```

### Customize Token Colors

Override individual token colors with CSS custom properties.

```css
snice-code-block {
  --code-keyword-color: #cba6f7;
  --code-function-color: #89b4fa;
  --code-string-color: #a6e3a1;
  --code-number-color: #fab387;
  --code-comment-color: #6c7086;
}
```

### Customize Structural Colors

Override the block background, text, and header colors.

```css
snice-code-block {
  --code-block-bg: #1e1e2e;
  --code-block-text: #cdd6f4;
  --code-block-header-bg: #181825;
}
```

### Programmatic Highlighter API

Use the highlighter engine directly for custom rendering.

```typescript
import { highlightCode, tokenize, registerGrammar } from 'snice/components/code-block/highlighter';

const html = highlightCode('const x = 1;', grammarObject);
registerGrammar('typescript', tsGrammar);
const html2 = highlightCode('const x = 1;', 'typescript');
```

### Available Grammar Files

| File | Languages |
|------|-----------|
| `typescript.json` | TypeScript, JavaScript |
| `html.json` | HTML, XML |
| `css.json` | CSS, SCSS, Less |
| `json.json` | JSON |
| `python.json` | Python |
| `bash.json` | Bash, Shell |
| `snice.json` | Snice (TypeScript + html/css template highlighting) |

## Accessibility

- Auto-follows `data-theme` attribute or OS `prefers-color-scheme`
- Copy button for easy code copying
- Semantic `<pre>` and `<code>` elements
