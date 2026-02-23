[//]: # (AI: For a low-token version of this doc, use docs/ai/components/code-block.md instead)

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

## Methods

- `copy()` - Copy code to clipboard
- `highlight()` - Manually trigger syntax highlighting
- `setHighlighter(fn)` - Set an external highlighter function for this instance

## Events

- `@snice/code-copy` - Code copied (detail: `{ code, codeBlock }`)
- `@snice/code-before-highlight` - Before highlighting (detail: `{ code, language, codeBlock }`)
- `@snice/code-after-highlight` - After highlighting (detail: `{ code, language, codeBlock }`)

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
