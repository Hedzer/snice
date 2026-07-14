# Syntax Highlighter Integrations

Optional integrations for popular syntax highlighting libraries.

## Available Integrations

### Prism.js

```typescript
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/themes/prism-tomorrow.css';
import { setupPrismHighlighter } from 'snice/components/code-block/highlighters/prism';

setupPrismHighlighter(Prism);
```

### highlight.js

```typescript
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { setupHighlightJs } from 'snice/components/code-block/highlighters/highlight';

setupHighlightJs(hljs);
```

## Custom Highlighter

You can also create your own highlighter function:

```typescript
import { SniceCodeBlock } from 'snice/components/code-block/snice-code-block';

// Define your highlighter
const myHighlighter = (code: string, language: string) => {
  // Your highlighting logic here
  return highlightedCode;
};

// Set globally for all code blocks
SniceCodeBlock.setGlobalHighlighter(myHighlighter);

// Or set for a specific instance
const codeBlock = document.querySelector('snice-code-block');
codeBlock.setHighlighter(myHighlighter);
```

## Installation

### Prism.js

```bash
npm install prismjs
```

Popular themes:
- `prismjs/themes/prism.css` - Default
- `prismjs/themes/prism-tomorrow.css` - Tomorrow Night
- `prismjs/themes/prism-dark.css` - Dark
- `prismjs/themes/prism-okaidia.css` - Okaidia
- `prismjs/themes/prism-twilight.css` - Twilight

### highlight.js

```bash
npm install highlight.js
```

Popular themes:
- `highlight.js/styles/github.css` - GitHub
- `highlight.js/styles/github-dark.css` - GitHub Dark
- `highlight.js/styles/atom-one-dark.css` - Atom One Dark
- `highlight.js/styles/monokai.css` - Monokai
- `highlight.js/styles/vs.css` - Visual Studio

## Language Support

Both libraries support many languages. Import only the ones you need to keep bundle size small.

### Prism.js Languages

```typescript
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
// ... and many more
```

### highlight.js Languages

```typescript
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('rust', rust);
```
