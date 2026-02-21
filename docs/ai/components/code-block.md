# snice-code-block

Code display with syntax highlighting, line numbers, copy.

## Properties

```typescript
code: string = '';
language: 'javascript'|'typescript'|'html'|'css'|'json'|'python'|'bash'|'plaintext' = 'plaintext';
grammar: GrammarDefinition | string | null = null;  // Grammar object or URL to JSON
showLineNumbers: boolean = false;
startLine: number = 1;
highlightLines: number[] = [];
copyable: boolean = true;
filename: string = '';
```

## Methods

- `copy()` - Copy code to clipboard
- `highlight()` - Manually trigger syntax highlighting
- `setHighlighter(fn)` - Set external highlighter for this instance

## Events

- `@snice/code-copy` (detail: { code, codeBlock })
- `@snice/code-before-highlight` (detail: { code, language, codeBlock })
- `@snice/code-after-highlight` (detail: { code, language, codeBlock })

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
<snice-code-block id="code" language="javascript" grammar="grammars/typescript.json" show-line-numbers filename="app.js"></snice-code-block>
<script>
  document.getElementById('code').code = `console.log('hello');`;
</script>
```
