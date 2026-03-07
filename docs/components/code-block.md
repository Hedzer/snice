<!-- AI: For a low-token version of this doc, use docs/ai/components/code-block.md instead -->

# Code Block Component

Display code with syntax highlighting, line numbers, and copy functionality. Uses a JSON-driven tokenizer engine with Monarch-inspired state machine for syntax highlighting.

## Basic Usage

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

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `code` | `string` | `''` | Code content |
| `language` | `CodeLanguage` | `'plaintext'` | Programming language |
| `grammar` | `Grammar \| string \| null` | `null` | Grammar object or URL to grammar JSON |
| `showLineNumbers` | `boolean` | `false` | Show line numbers |
| `startLine` | `number` | `1` | Starting line number |
| `highlightLines` | `number[]` | `[]` | Lines to highlight |
| `copyable` | `boolean` | `true` | Show copy button |
| `filename` | `string` | `''` | File name to display |
| `format` | `string` | `''` | Formatter name from grammar (e.g. `"pretty"`), or any truthy string with `setFormatter()` |
| `theme` | `'' \| 'dark' \| 'light'` | `''` | Force a specific color theme; empty string auto-detects from page or OS |

## Methods

- `copy()` - Copy code to clipboard
- `highlight()` - Manually trigger syntax highlighting
- `setHighlighter(fn)` - Set an external highlighter function for this instance
- `setFormatter(fn)` - Set a code formatter function for this instance

## Events

- `code-copy` - Code copied (detail: `{ code, codeBlock }`)
- `code-before-format` - Before formatting (detail: `{ code, language, codeBlock }`)
- `code-after-format` - After formatting (detail: `{ code, language, codeBlock }`)
- `code-before-highlight` - Before highlighting (detail: `{ code, language, codeBlock }`)
- `code-after-highlight` - After highlighting (detail: `{ code, language, codeBlock }`)
- `grammar-request` - Grammar fetch requested (detail: `{ url, language, codeBlock }`). Only dispatched when `fetch-mode="event"`.
- `grammar-loaded` - Grammar successfully loaded (detail: `{ grammar, url, language, codeBlock }`). Fired after grammar is fetched (native/virtual), received via event mode, or set programmatically with `setGrammar()`.

## Code Formatters

Formatters transform code before syntax highlighting — useful for pretty-printing minified or poorly-indented code.

### Grammar-Based Formatters (Declarative)

Grammars can include a `formatters` section with named declarative rule sets. Set `format` to the formatter name to use it:

```html
<snice-code-block grammar="grammars/json.json" format="pretty" code='{"a":1,"b":[2,3]}'></snice-code-block>
```

The grammar's `"pretty"` formatter will automatically format the code before highlighting. No JavaScript needed.

**Grammars with built-in `"pretty"` formatters:** `json.json`, `typescript.json`, `css.json`, `snice.json`.

#### Grammar Formatter Rules

Each named formatter is a set of declarative rules defined in the grammar JSON:

```json
{
  "formatters": {
    "pretty": {
      "tabSize": 2,
      "useTabs": false,
      "newlineAfter": "[{\\[,]",
      "newlineBefore": "[}\\]]",
      "spaceAfter": "[:]",
      "indent": "[{\\[]",
      "dedent": "[}\\]]",
      "skipStrings": true,
      "skipComments": true
    }
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `tabSize` | `number` | `2` | Indent width |
| `useTabs` | `boolean` | `false` | Use tabs instead of spaces |
| `newlineAfter` | `string` (regex) | — | Insert newline after these chars |
| `newlineBefore` | `string` (regex) | — | Insert newline before these chars |
| `spaceAfter` | `string` (regex) | — | Insert space after these chars |
| `spaceBefore` | `string` (regex) | — | Insert space before these chars |
| `spaceAround` | `string` (regex) | — | Insert space on both sides |
| `indent` | `string` (regex) | — | Chars that increase indent level |
| `dedent` | `string` (regex) | — | Chars that decrease indent level |
| `trimTrailing` | `boolean` | `true` | Remove trailing whitespace per line |
| `collapseBlankLines` | `number` | — | Max consecutive blank lines |
| `skipStrings` | `boolean` | `true` | Don't apply rules inside string literals |
| `skipComments` | `boolean` | `true` | Don't apply rules inside comments |

### Imperative Formatters

For cases requiring JavaScript logic, `setFormatter(fn)` still works. When both are present, `setFormatter()` takes priority over grammar-based formatters.

```typescript
type FormatterFunction = (code: string, language: string) => string | Promise<string>;
```

### JSON Formatter

Zero-dependency formatter that pretty-prints JSON using `JSON.parse()` + `JSON.stringify()`:

```typescript
import { createJsonFormatter } from 'snice/components/code-block/formatters/json';

const formatter = createJsonFormatter({ indent: 2 });
codeBlock.setFormatter(formatter);
codeBlock.format = 'pretty';
codeBlock.code = '{"name":"snice","version":"4.0.0"}';
```

### Indent Formatter

Zero-dependency indent normalizer that re-indents code by tracking brace/bracket/paren nesting depth:

```typescript
import { createIndentFormatter } from 'snice/components/code-block/formatters/indent';

const formatter = createIndentFormatter({ tabSize: 2, useTabs: false });
codeBlock.setFormatter(formatter);
codeBlock.format = 'pretty';
```

### Prettier Formatter

Adapter for Prettier (requires `prettier` as a dependency):

```typescript
import * as prettier from 'prettier/standalone';
import parserBabel from 'prettier/plugins/babel';
import parserEstree from 'prettier/plugins/estree';
import { setupPrettierFormatter } from 'snice/components/code-block/formatters/prettier';

const formatter = setupPrettierFormatter(prettier, [parserBabel, parserEstree], {
  tabWidth: 2,
  singleQuote: true,
});
codeBlock.setFormatter(formatter);
codeBlock.format = 'pretty';
```

### Whitespace Handling

Slotted content is automatically **dedented** — common leading indentation from HTML nesting is stripped while preserving relative indentation. This means code inside deeply nested HTML stays clean:

```html
<div class="container">
  <snice-code-block language="javascript">
    function hello() {
      console.log("world");
    }
  </snice-code-block>
</div>
```

The 4-space indent from HTML nesting is stripped, but the 2-space relative indent inside the function is preserved.

## Grammar Files

Grammars are **external JSON files** loaded on demand — the component ships with no built-in grammars to keep the bundle small.

### Available Grammars

| File | Languages | Aliases |
|------|-----------|---------|
| `typescript.json` | TypeScript, JavaScript | ts, tsx, js, jsx |
| `html.json` | HTML, XML | htm, svg |
| `css.json` | CSS, SCSS, Less | |
| `json.json` | JSON | jsonc |
| `python.json` | Python | py, pyw |
| `bash.json` | Bash, Shell | sh, zsh |
| `snice.json` | Snice (TS + templates) | |

Grammar files are located at:
- **Source:** `components/code-block/grammars/`
- **Built:** `dist/components/code-block/grammars/`
- **Standalone:** serve alongside the component JS file

### Snice Grammar

The `snice.json` grammar extends TypeScript with full awareness of snice's template DSL. Use it to highlight snice component source code.

**What it highlights:**

| Syntax | Token Type | Description |
|--------|-----------|-------------|
| `html\`` / `css\`` | `tag` | Tagged template entry (enters HTML/CSS mode) |
| `<if>`, `<case>`, `<when>`, `<default>` | `keyword` | Snice conditional rendering elements |
| `.prop=${val}` | `property` | Property bindings |
| `?attr=${bool}` | `attr-name` | Boolean attribute bindings |
| `@event=${fn}` | `function` | Event bindings (includes `@event:modifier`, `@event.modifier`) |
| `${...}` | (TypeScript) | Interpolations return to TS mode |
| `html/*html*/\`` | `tag` | Editor hint pattern supported |

**Example:**

```html
<snice-code-block grammar="grammars/snice.json" language="snice" id="code"></snice-code-block>
<script>
  document.getElementById('code').code = `
@element('my-counter')
class MyCounter extends HTMLElement {
  @property({ type: Number }) count = 0;

  @render()
  template() {
    return html\\\`
      <if \\\${this.count > 0}>
        <span>\\\${this.count}</span>
      </if>
      <button @click=\\\${() => this.count++}>+</button>
    \\\`;
  }

  @styles()
  componentStyles() {
    return css\\\`:host { display: block; padding: 1rem; }\\\`;
  }
}`;
</script>
```

### Loading a Grammar via URL

The simplest way — set the `grammar` property to a URL string:

```html
<snice-code-block
  grammar="grammars/typescript.json"
  language="typescript"
  id="code">
</snice-code-block>
<script>
  document.getElementById('code').code = 'const x: number = 42;';
</script>
```

The grammar JSON file will be fetched and cached automatically.

### Inline Grammar Object

You can also pass a grammar object directly via JavaScript:

```html
<snice-code-block id="cb" language="custom"></snice-code-block>
<script>
  const codeBlock = document.getElementById('cb');
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
</script>
```

### Registering Grammars Globally

For programmatic use, you can register grammars so they're available by language name:

```typescript
import { registerGrammar } from 'snice/components/code-block/highlighter';

// Fetch and register
const tsGrammar = await fetch('grammars/typescript.json').then(r => r.json());
registerGrammar('typescript', tsGrammar);
registerGrammar('ts', tsGrammar);       // register aliases too
registerGrammar('javascript', tsGrammar);
registerGrammar('js', tsGrammar);
```

Without a registered grammar or explicit `grammar` property, code is displayed as escaped plaintext.

## Grammar Format

Grammars are JSON-serializable objects with states, transitions, and lookup tables:

```typescript
interface Grammar {
  name: string;               // Language name
  fileTypes?: string[];        // File extensions
  defaultToken?: string;       // Token type for unmatched text
  ignoreCase?: boolean;        // Case-insensitive regex matching
  tokenizer: Record<string, GrammarEntry[]>;  // Named states
  formatters?: Record<string, FormatRules>;    // Named declarative formatters
  [key: string]: any;          // Lookup tables (keywords, builtins, etc.)
}
```

### Rules

Each state contains an array of rules. Rules can be:

- **Simple**: `[regex, token]` — Match regex, assign token type
- **With transition**: `[regex, token, nextState]` — Match and change state
- **Conditional**: `[regex, { cases: { '@table': 'token', '@default': 'fallback' } }]` — Lookup matched text in tables
- **Include**: `{ include: '@stateName' }` — Include rules from another state

### State Transitions

- `@stateName` — Push state onto stack (enter nested context)
- `@pop` — Pop state from stack (return to previous context)

### Example: Handling Multi-line Comments

```json
{
  "tokenizer": {
    "root": [
      ["/\\*", "comment", "@comment"],
      ["//.*$", "comment"]
    ],
    "comment": [
      ["[^*]+", "comment"],
      ["\\*/", "comment", "@pop"],
      ["[*]", "comment"]
    ]
  }
}
```

### Example: Template Literals with Interpolation

```json
{
  "tokenizer": {
    "root": [
      ["`", "string", "@template"]
    ],
    "template": [
      ["\\$\\{", "punctuation", "@interpolation"],
      ["[^`$\\\\]+", "string"],
      ["\\\\.", "string"],
      ["`", "string", "@pop"]
    ],
    "interpolation": [
      ["\\}", "punctuation", "@pop"],
      { "include": "@root" }
    ]
  }
}
```

## Programmatic API

The highlighter engine can be used directly:

```typescript
import {
  highlightCode,
  tokenize,
  registerGrammar,
  unregisterGrammar,
  getGrammar
} from 'snice/components/code-block/highlighter';

// Highlight with a grammar object → HTML string
const html = highlightCode('const x = 1;', grammarObject);

// Highlight with a registered grammar name (plaintext fallback if not found)
registerGrammar('typescript', tsGrammar);
const html2 = highlightCode('const x = 1;', 'typescript');

// Get raw tokens
const tokens = tokenize('const x = 1;', grammarObject);
// [{ text: 'const', type: 'keyword' }, { text: ' ', type: null }, ...]

// Register a grammar globally
registerGrammar('myLang', myGrammar);

// Remove a registered grammar
unregisterGrammar('myLang');

// Look up a registered grammar (returns undefined if not found)
const grammar = getGrammar('typescript');
```

## Theming (Light / Dark Mode)

The code block automatically follows the page's theme. It detects:

1. **`data-theme` attribute** on the page (snice theme system): `[data-theme="dark"]` or `[data-theme="light"]`
2. **OS preference** via `prefers-color-scheme` media query (fallback when no `data-theme` is set)

### Forcing a Theme

Use the `theme` attribute to override auto-detection:

```html
<!-- Always dark, even on a light-themed page -->
<snice-code-block theme="dark" language="javascript">
const x = 1;
</snice-code-block>

<!-- Always light, even on a dark-themed page -->
<snice-code-block theme="light" language="javascript">
const x = 1;
</snice-code-block>
```

### Customizing Colors

Override structural colors with CSS custom properties:

```css
snice-code-block {
  --code-block-bg: #1e1e2e;
  --code-block-text: #cdd6f4;
  --code-block-header-bg: #181825;
}
```

Override individual token colors:

```css
snice-code-block {
  --code-keyword-color: #cba6f7;
  --code-function-color: #89b4fa;
  --code-string-color: #a6e3a1;
  --code-number-color: #fab387;
  --code-comment-color: #6c7086;
}
```

All available token color variables: `--code-keyword-color`, `--code-function-color`, `--code-string-color`, `--code-number-color`, `--code-comment-color`, `--code-operator-color`, `--code-punctuation-color`, `--code-tag-color`, `--code-attr-name-color`, `--code-attr-value-color`, `--code-constant-color`, `--code-class-color`, `--code-builtin-color`, `--code-regex-color`.

## Token CSS Classes

The following token types are styled by default:

| Token | Color (default) | Description |
|-------|----------------|-------------|
| `keyword` | Purple (#c678dd) | Language keywords |
| `string` | Green (#98c379) | String literals |
| `comment` | Gray (#5c6370) | Comments (italic) |
| `number` | Orange (#d19a66) | Numeric literals |
| `function` | Blue (#61afef) | Function names |
| `class-name` | Yellow (#e5c07b) | Class/type names |
| `tag` | Red (#e06c75) | HTML tags, decorators |
| `attr-name` | Orange (#d19a66) | Attribute names |
| `attr-value` | Green (#98c379) | Attribute values |
| `property` | Orange (#d19a66) | Object properties |
| `operator` | Cyan (#56b6c2) | Operators |
| `punctuation` | Gray (#abb2bf) | Brackets, semicolons |
| `constant` | Orange (#d19a66) | true/false/null |
| `builtin` | Red (#e06c75) | Built-in functions |

Colors are customizable via CSS variables (e.g., `--code-keyword-color`).

## Examples

```html
<!-- With grammar and line numbers -->
<snice-code-block grammar="grammars/typescript.json" language="typescript" show-line-numbers></snice-code-block>

<!-- With filename -->
<snice-code-block grammar="grammars/typescript.json" filename="index.js"></snice-code-block>

<!-- Highlight specific lines -->
<snice-code-block grammar="grammars/python.json" language="python" highlight-lines="[2,3,4]"></snice-code-block>

<!-- Plaintext (no grammar needed) -->
<snice-code-block language="plaintext"></snice-code-block>
```
