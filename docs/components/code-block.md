# Code Block Component

Display code with syntax highlighting, line numbers, and copy functionality.

## Basic Usage

```html
<snice-code-block id="code" language="javascript"></snice-code-block>
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
| `showLineNumbers` | `boolean` | `false` | Show line numbers |
| `startLine` | `number` | `1` | Starting line number |
| `highlightLines` | `number[]` | `[]` | Lines to highlight |
| `copyable` | `boolean` | `true` | Show copy button |
| `filename` | `string` | `''` | File name to display |

## Methods

- `copy()` - Copy code to clipboard

## Events

- `@snice/code-copy` - Code copied (detail: { code, codeBlock })

## Examples

```html
<!-- With line numbers -->
<snice-code-block show-line-numbers></snice-code-block>

<!-- With filename -->
<snice-code-block filename="index.js"></snice-code-block>

<!-- Highlight lines -->
<snice-code-block highlight-lines="[2,3,4]"></snice-code-block>
```
