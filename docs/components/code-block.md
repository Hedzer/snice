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
- [Fetch Mode](#fetch-mode)
- [Grammar System](#grammar-system)
- [Highlighter API](#highlighter-api)
- [Token CSS Classes](#token-css-classes)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `code` | `string` | `''` | Code content (set via slot or property) |
| `language` | `CodeLanguage` | `'plaintext'` | Programming language |
| `grammar` | `Grammar \| string \| null` | `''` | Grammar object or URL to grammar JSON |
| `showLineNumbers` (attr: `show-line-numbers`) | `boolean` | `false` | Show line numbers |
| `startLine` (attr: `start-line`) | `number` | `1` | Starting line number |
| `highlightLines` | `number[]` | `[]` | Lines to highlight (JS-only; no attribute) |
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

Set `highlightLines` in JavaScript to draw attention to specific lines. There is no
`highlight-lines` attribute -- the property is JS-only.

```html
<snice-code-block id="snippet" grammar="grammars/python.json" language="python">
def hello():
    name = "World"
    greeting = f"Hello {name}"
    print(greeting)
</snice-code-block>
```

```typescript
document.getElementById('snippet').highlightLines = [2, 3, 4];
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
<snice-code-block grammar="grammars/json.json" format="pretty">{"a":1,"b":[2,3]}</snice-code-block>
```

Grammar formatters format authored code — they do not re-flow it. Author line breaks and blank lines are preserved; leading indentation is renormalized; spacing rules apply within a line. Rule-driven breaks (e.g. after `;`) fire only where they do not duplicate an author break and are suppressed inside parentheses/brackets. One-liners like the JSON example above are still pretty-printed.

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

## Fetch Mode

The `fetch-mode` attribute controls how the component loads grammar JSON when the `grammar` property is set to a URL string. There are three modes:

### Native Mode (default)

```html
<snice-code-block grammar="grammars/typescript.json">const x = 1</snice-code-block>
```

In native mode, the component uses the browser's built-in `fetch()` API to load the grammar JSON directly from the URL. This is the simplest approach and requires no additional setup.

**How it works:**
1. Component calls `fetch(url)` with the grammar URL
2. Parses the JSON response
3. Applies the grammar for syntax highlighting

**When to use:** Most cases. This is the right default for standalone usage, CDN builds, and any scenario where the grammar files are accessible via HTTP.

### Virtual Mode

```html
<snice-code-block grammar="grammars/typescript.json" fetch-mode="virtual">const x = 1</snice-code-block>
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
<snice-code-block id="cb" grammar="grammars/typescript.json" fetch-mode="event">const x = 1</snice-code-block>
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
