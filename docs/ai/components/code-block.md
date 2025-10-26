# snice-code-block

Code display with syntax highlighting, line numbers, copy.

## Properties

```typescript
code: string = '';
language: 'javascript'|'typescript'|'html'|'css'|'json'|'python'|'bash'|'plaintext' = 'plaintext';
showLineNumbers: boolean = false;
startLine: number = 1;
highlightLines: number[] = [];
copyable: boolean = true;
filename: string = '';
```

## Methods

- `copy()` - Copy code to clipboard

## Events

- `@snice/code-copy` (detail: { code, codeBlock })

## Usage

```html
<snice-code-block id="code" language="javascript" show-line-numbers filename="app.js"></snice-code-block>
<script>
  document.getElementById('code').code = `console.log('hello');`;
</script>
```
