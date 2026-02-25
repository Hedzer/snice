# Code Block Component Documentation

`snice-code-block` is a code display component with syntax highlighting, line numbers, and copy-to-clipboard support. It uses a JSON-driven grammar system inspired by Monaco/Monarch for tokenization.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Fetch Mode](#fetch-mode)
- [Methods](#methods)
- [Events](#events)
- [Grammar System](#grammar-system)
- [Highlighter API](#highlighter-api)
- [Token CSS Classes](#token-css-classes)

## Basic Usage

The simplest way to use the code block is to put your code directly inside the element as slotted text content:

```html
<snice-code-block language="javascript" grammar="grammars/typescript.json" show-line-numbers filename="app.js">
console.log('hello');
</snice-code-block>
```

The slotted text is hidden and re-rendered with syntax highlighting in the shadow DOM. You can also set code programmatically via the `code` property:

```html
<snice-code-block id="code" language="javascript"></snice-code-block>
<script>
  document.getElementById('code').code = `console.log('hello');`;
</script>
```

The component renders code with optional syntax highlighting, line numbers, a filename header, and a copy button.

## Properties

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `code` | — | `string` | `''` | The source code to display. Set via slotted text content (preferred) or the `code` property |
| `language` | `language` | `CodeLanguage` | `'plaintext'` | Language for syntax highlighting |
| `grammar` | `grammar` | `GrammarDefinition \| string \| null` | `null` | Grammar object or URL to a grammar JSON file |
| `fetchMode` | `fetch-mode` | `'native' \| 'virtual' \| 'event'` | `'native'` | How grammar JSON is fetched from a URL (see [Fetch Mode](#fetch-mode)) |
| `showLineNumbers` | `show-line-numbers` | `boolean` | `false` | Whether to display line numbers |
| `startLine` | `start-line` | `number` | `1` | Starting line number |
| `highlightLines` | `highlight-lines` | `number[]` | `[]` | Line numbers to highlight |
| `copyable` | `copyable` | `boolean` | `true` | Whether the copy button is shown |
| `filename` | `filename` | `string` | `''` | Filename to display in the header |

### Supported Languages

`javascript`, `typescript`, `html`, `css`, `json`, `python`, `bash`, `plaintext`, or any custom string matching a registered grammar.

## Fetch Mode

The `fetch-mode` attribute controls how the component loads grammar JSON when the `grammar` property is set to a URL string. There are three modes:

### Native Mode (default)

```html
<snice-code-block grammar="grammars/typescript.json" code="const x = 1"></snice-code-block>
```

In native mode, the component uses the browser's built-in `fetch()` API to load the grammar JSON directly from the URL. This is the simplest approach and requires no additional setup.

**How it works:**
1. Component calls `fetch(url)` with the grammar URL
2. Parses the JSON response
3. Applies the grammar for syntax highlighting

**When to use:** Most cases. This is the right default for standalone usage, CDN builds, and any scenario where the grammar files are accessible via HTTP.

### Virtual Mode

```html
<snice-code-block grammar="grammars/typescript.json" fetch-mode="virtual" code="const x = 1"></snice-code-block>
```

In virtual mode, the component uses Snice's `@request/@respond` pattern to load grammars. It sends a request on the `snice/code-block/load-grammar` channel, and a controller or page must provide a `@respond` handler to fulfill the request.

**How it works:**
1. Component yields a request with `{ url }` on the `snice/code-block/load-grammar` channel
2. A `@respond('snice/code-block/load-grammar')` handler receives the request
3. The handler fetches/resolves the grammar and returns it
4. Component receives the grammar and highlights the code

**Example with a controller:**

```typescript
import { controller, respond, IController } from 'snice';

@controller('grammar-controller')
class GrammarController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  @respond('snice/code-block/load-grammar')
  async loadGrammar(request: { url: string }) {
    const response = await fetch(request.url);
    return await response.json();
  }
}
```

**When to use:** When you need centralized control over grammar loading, such as caching grammars, loading from non-HTTP sources, or applying transformations before use.

**Note:** If using `@respond('snice/code-block/load-grammar')` handlers, add `fetch-mode="virtual"` to your code block elements. The default fetch mode is `native`.

### Event Mode

```html
<snice-code-block id="cb" grammar="grammars/typescript.json" fetch-mode="event" code="const x = 1"></snice-code-block>
<script>
  document.getElementById('cb').addEventListener('grammar-request', async (e) => {
    const grammar = await fetch(e.detail.url).then(r => r.json());
    e.detail.codeBlock.setGrammar(grammar);
  });
</script>
```

In event mode, the component dispatches a `grammar-request` CustomEvent and relies on an external listener to call `setGrammar()` on the code block with the resolved grammar object.

**How it works:**
1. Component dispatches a `grammar-request` event (bubbles, composed)
2. An event listener receives the event with `{ url, language, codeBlock }` detail
3. The listener fetches/resolves the grammar
4. The listener calls `e.detail.codeBlock.setGrammar(grammar)` to provide it back

**Event detail type:**

```typescript
interface GrammarRequestDetail {
  url: string;
  language: CodeLanguage;
  codeBlock: SniceCodeBlockElement;
}
```

**When to use:** When you want a simple DOM-event-based approach without Snice controllers, or when integrating with non-Snice code. This mode is especially useful in CDN/standalone builds where you may not have the `@respond` infrastructure available.

### Choosing a Fetch Mode

| Mode | Setup Required | Dependencies | Best For |
|---|---|---|---|
| `native` | None | Browser `fetch()` | Standalone usage, CDN builds, simple setups |
| `virtual` | `@respond` handler | Snice controller/page | Centralized grammar management, caching, non-HTTP sources |
| `event` | Event listener | None (plain DOM) | CDN builds without Snice runtime, non-Snice integrations |

## Methods

### `copy(): Promise<void>`

Copies the current code content to the clipboard.

```typescript
const codeBlock = document.querySelector('snice-code-block');
await codeBlock.copy();
```

### `highlight(): Promise<void>`

Manually triggers syntax highlighting. Normally highlighting runs automatically when `code`, `language`, or `grammar` changes, but you can force a re-highlight if needed.

```typescript
codeBlock.highlight();
```

### `setHighlighter(fn: HighlighterFunction): void`

Sets an external highlighter function for this code block instance, overriding the built-in grammar-based highlighter.

```typescript
codeBlock.setHighlighter((code, language) => {
  // Return highlighted HTML string
  return myCustomHighlighter(code, language);
});
```

### `setGrammar(grammar: GrammarDefinition): void`

Provides a grammar object directly, bypassing URL-based loading. This is the method called by event listeners in `fetch-mode="event"`, but it can be used at any time to set a grammar programmatically.

```typescript
const grammar = await fetch('grammars/typescript.json').then(r => r.json());
codeBlock.setGrammar(grammar);
```

## Events

### `code-copy`

Dispatched when code is copied to the clipboard.

```typescript
codeBlock.addEventListener('code-copy', (e) => {
  console.log('Copied:', e.detail.code);
  console.log('From:', e.detail.codeBlock);
});
```

**Detail:** `{ code: string, codeBlock: SniceCodeBlockElement }`

### `code-before-highlight`

Dispatched before syntax highlighting runs. Can be used to modify code or language before highlighting.

**Detail:** `{ code: string, language: string, codeBlock: SniceCodeBlockElement }`

### `code-after-highlight`

Dispatched after syntax highlighting completes.

**Detail:** `{ code: string, language: string, codeBlock: SniceCodeBlockElement }`

### `grammar-request`

Dispatched only when `fetch-mode="event"`. See [Event Mode](#event-mode) for details.

**Detail:** `{ url: string, language: CodeLanguage, codeBlock: SniceCodeBlockElement }`

## Grammar System

The code block uses a JSON-driven tokenizer with a Monarch-inspired state machine. Grammars are external JSON files, not bundled in the component. This keeps the component lightweight while supporting rich syntax highlighting.

### Available Grammar Files

Grammar files are located at `components/code-block/grammars/` in source (or `dist/components/code-block/grammars/` in builds):

| File | Languages |
|---|---|
| `typescript.json` | TypeScript, JavaScript |
| `html.json` | HTML, XML |
| `css.json` | CSS, SCSS, Less |
| `json.json` | JSON |
| `python.json` | Python |
| `bash.json` | Bash, Shell |
| `snice.json` | Snice (TypeScript + html``/css`` template highlighting) |

### Snice Grammar

The `snice.json` grammar extends TypeScript with awareness of Snice's template DSL:

- **`html\``** tagged templates switch to HTML mode with tag/attribute highlighting
- **`css\``** tagged templates switch to CSS mode with property/selector highlighting
- **`<if>`, `<case>`, `<when>`, `<default>`** are highlighted as keywords (not regular tags)
- **`.prop=`** property bindings receive the "property" token
- **`?attr=`** boolean bindings receive the "attr-name" token
- **`@event=`** event bindings receive the "function" token (including `@event:modifier` and `@event.modifier` forms)
- **`${...}`** interpolations switch back to TypeScript mode
- Handles the `html/*html*/\`` editor hint pattern

### Loading Grammars

**From a URL (uses fetch mode to resolve):**

```html
<snice-code-block grammar="grammars/typescript.json" language="typescript" id="cb"></snice-code-block>
<script>
  document.getElementById('cb').code = 'const x: number = 42;';
</script>
```

**Inline grammar object (set via JavaScript):**

```html
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

You can register grammars globally so they are available by language name:

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
```

**Rules** take one of these forms:
- `[regex, token]` -- Match pattern and assign token class
- `[regex, token, nextState]` -- Match, assign, and transition state
- `{ include: '@state' }` -- Include rules from another state

**Tokens** can be:
- A string (CSS class name): `'keyword'`, `'string'`, `'comment'`
- A case expression: `{ cases: { '@keywords': 'keyword', '@default': '' } }`

**States:**
- `'@stateName'` -- Push a new state onto the stack
- `'@pop'` -- Return to the previous state

## Highlighter API

For programmatic use outside of the component:

```typescript
import { highlightCode, tokenize, registerGrammar, unregisterGrammar, getGrammar } from 'snice/components/code-block/highlighter';

// Highlight code using a grammar object directly (returns HTML string)
highlightCode(code, grammarObject);

// Highlight code using a registered grammar name (falls back to plaintext)
highlightCode(code, 'myLang');

// Tokenize code into an array of Token objects
tokenize(code, grammarObject);

// Register a grammar for use by name
registerGrammar('myLang', grammar);

// Remove a registered grammar
unregisterGrammar('myLang');

// Get a registered grammar (or undefined)
getGrammar('myLang');
```

## Token CSS Classes

The following CSS classes are applied to highlighted tokens. Style these in your theme to customize syntax highlighting colors:

`keyword`, `string`, `comment`, `tag`, `function`, `class-name`, `number`, `constant`, `attr-name`, `attr-value`, `property`, `operator`, `punctuation`, `builtin`, `regex`
