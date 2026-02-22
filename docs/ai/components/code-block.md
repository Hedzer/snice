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

**Breaking change:** Anyone relying on `@respond('snice/code-block/load-grammar')` must add `fetch-mode="virtual"` to their code blocks. Default was previously virtual; now native.

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

- `@snice/code-copy` (detail: { code, codeBlock })
- `@snice/code-before-highlight` (detail: { code, language, codeBlock })
- `@snice/code-after-highlight` (detail: { code, language, codeBlock })
- `grammar-request` (detail: { url, language, codeBlock }) — only dispatched when `fetch-mode="event"`

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

### Snice Grammar

Extends TypeScript with awareness of snice's template DSL:
- **`html\``** tagged templates → HTML mode with tag/attribute highlighting
- **`css\``** tagged templates → CSS mode with property/selector highlighting
- **`<if>`, `<case>`, `<when>`, `<default>`** → highlighted as keywords (not regular tags)
- **`.prop=`** property bindings → "property" token
- **`?attr=`** boolean bindings → "attr-name" token
- **`@event=`** event bindings → "function" token (includes `@event:modifier` and `@event.modifier`)
- **`${...}`** interpolations → back to TypeScript mode
- Handles `html/*html*/\`` editor hint pattern

### Loading Grammars

```html
<!-- Grammar from URL -->
<snice-code-block grammar="grammars/typescript.json" language="typescript" id="cb"></snice-code-block>
<script>
  document.getElementById('cb').code = 'const x: number = 42;';
</script>

<!-- Inline grammar object -->
<snice-code-block id="cb2" language="custom"></snice-code-block>
<script>
  document.getElementById('cb2').grammar = {
    name: 'custom',
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
  document.getElementById('cb2').code = 'func main() { return 42; }';
</script>
```

### Programmatic Registration

```typescript
import { registerGrammar, unregisterGrammar, getGrammar } from 'snice/components/code-block/highlighter';

// Register so language string lookup works
const grammar = await fetch('grammars/typescript.json').then(r => r.json());
registerGrammar('typescript', grammar);
registerGrammar('ts', grammar);  // alias

// Then use by name
highlightCode(code, 'typescript');
```

### Grammar Format

```typescript
interface Grammar {
  name: string;
  fileTypes?: string[];
  defaultToken?: string;
  ignoreCase?: boolean;
  tokenizer: Record<string, GrammarEntry[]>;
  [key: string]: any;  // Lookup tables (keywords, builtins, etc.)
}

// Rule: [regex, token] | [regex, token, nextState] | { include: '@state' }
// Token: string | { cases: { '@table': 'token', '@default': 'token' } }
// State: '@stateName' (push) | '@pop' (return)
```

### Highlighter API (programmatic)

```typescript
import { highlightCode, tokenize, registerGrammar, unregisterGrammar, getGrammar } from 'snice/components/code-block/highlighter';

highlightCode(code, grammarObject);      // Use grammar directly → HTML string
highlightCode(code, 'myLang');           // Use registered grammar (or plaintext if not found)
tokenize(code, grammarObject);           // Returns Token[]
registerGrammar('myLang', grammar);      // Register grammar for name lookup
unregisterGrammar('myLang');             // Remove registered grammar
getGrammar('myLang');                    // Get registered grammar or undefined
```

## Token CSS Classes

`keyword`, `string`, `comment`, `tag`, `function`, `class-name`, `number`, `constant`, `attr-name`, `attr-value`, `property`, `operator`, `punctuation`, `builtin`, `regex`

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
