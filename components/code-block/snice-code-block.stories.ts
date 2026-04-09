import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-code-block';

type Args = {
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  startLine?: number;
  copyable?: boolean;
  theme?: string;
  content?: string;
};

const LANGUAGES = ['javascript', 'typescript', 'html', 'css', 'json', 'python', 'bash', 'plaintext'];

const meta: Meta<Args> = {
  title: 'Specialty/CodeBlock',
  component: 'snice-code-block',
  tags: ['autodocs'],
  argTypes: {
    language:        { control: 'select', options: LANGUAGES },
    filename:        { control: 'text' },
    showLineNumbers: { control: 'boolean' },
    startLine:       { control: 'number' },
    copyable:        { control: 'boolean' },
    theme:           { control: 'select', options: ['dark', 'light'] },
    content:         { control: 'text' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-code-block');
    if (args.language !== undefined) el.setAttribute('language', args.language);
    if (args.filename !== undefined) el.setAttribute('filename', args.filename);
    if (args.showLineNumbers) el.toggleAttribute('show-line-numbers', true);
    if (args.startLine !== undefined) el.setAttribute('start-line', String(args.startLine));
    if (args.copyable === false) el.setAttribute('copyable', 'false');
    if (args.theme !== undefined) el.setAttribute('theme', args.theme);
    el.textContent = args.content ?? 'console.log("Hello World");';
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { language: 'javascript', content: 'console.log("Hello World");' },
};

function cb(content: string, attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-code-block');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  el.textContent = content;
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

// h2: language="javascript" (slotted content)
export const LanguageJavascript: Story = {
  render: () => col(
    cb('function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\nconsole.log(fibonacci(10));', { language: 'javascript' }),
  ),
};

// h2: language="typescript"
export const LanguageTypescript: Story = {
  render: () => col(
    cb('interface User {\n  name: string;\n  age: number;\n}\nconst greet = (user: User): string => `Hello, ${user.name}!`;', { language: 'typescript' }),
  ),
};

// h2: language="html"
export const LanguageHtml: Story = {
  render: () => col(
    cb('<!DOCTYPE html>\n<html>\n<head><title>Page</title></head>\n<body><h1>Hello</h1></body>\n</html>', { language: 'html' }),
  ),
};

// h2: language="css"
export const LanguageCss: Story = {
  render: () => col(
    cb('.button {\n  background: var(--primary);\n  color: white;\n  padding: 10px 20px;\n  border-radius: 4px;\n}', { language: 'css' }),
  ),
};

// h2: language="json"
export const LanguageJson: Story = {
  render: () => col(
    cb('{\n  "name": "snice",\n  "version": "4.25.0",\n  "dependencies": { "rollup": "^4.0.0" }\n}', { language: 'json' }),
  ),
};

// h2: language="python"
export const LanguagePython: Story = {
  render: () => col(
    cb('def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    return quicksort(left) + [pivot] + quicksort([x for x in arr if x > pivot])', { language: 'python' }),
  ),
};

// h2: language="bash"
export const LanguageBash: Story = {
  render: () => col(
    cb('#!/bin/bash\necho "Hello World"\nfor i in $(seq 1 5); do\n  echo "Count: $i"\ndone', { language: 'bash' }),
  ),
};

// h2: language="plaintext"
export const LanguagePlaintext: Story = {
  render: () => col(
    cb('This is plain text with no syntax highlighting.\nIt just shows raw content as-is.', { language: 'plaintext' }),
  ),
};

// h2: show-line-numbers
export const ShowLineNumbers: Story = {
  render: () => col(
    cb('const a = 1;\nconst b = 2;\nconst c = a + b;\nconsole.log(c);', { language: 'javascript', 'show-line-numbers': true }),
  ),
};

// h2: start-line="10" + show-line-numbers
export const StartLine10PlusShowLineNumbers: Story = {
  render: () => col(
    cb('// Line 10\nfunction hello() {\n  return \'world\';\n}', { language: 'javascript', 'show-line-numbers': true, 'start-line': '10' }),
  ),
};

// h2: filename="app.js"
export const FilenameAppJs: Story = {
  render: () => col(
    cb('import express from \'express\';\nconst app = express();\napp.listen(3000);', { language: 'javascript', filename: 'app.js' }),
  ),
};

// h2: filename + show-line-numbers
export const FilenameAndShowLineNumbers: Story = {
  render: () => col(
    cb("import { element, property, render, html } from 'snice';\n\n@element('my-app')\nclass MyApp extends HTMLElement {\n  @property() name = 'World';\n}", { language: 'typescript', filename: 'index.ts', 'show-line-numbers': true }),
  ),
};

// h2: copyable="false"
export const CopyableFalse: Story = {
  render: () => col(
    cb("// Copy button is hidden\nconst secret = 'hidden';", { language: 'javascript', copyable: 'false' }),
  ),
};

// h2: copyable="false" + no filename (no header)
export const CopyableFalseNoFilename: Story = {
  render: () => col(
    cb('const x = 42;', { language: 'javascript', copyable: 'false', filename: '' }),
  ),
};

// h2: theme="dark" (forced)
export const ThemeDark: Story = {
  render: () => col(
    cb("const dark = true;\nconsole.log('Always dark theme');", { language: 'javascript', theme: 'dark' }),
  ),
};

// h2: theme="light" (forced)
export const ThemeLight: Story = {
  render: () => col(
    cb("const light = true;\nconsole.log('Always light theme');", { language: 'javascript', theme: 'light' }),
  ),
};

// h2: Empty content
export const EmptyContent: Story = {
  render: () => col(
    cb('', { language: 'javascript' }),
  ),
};

// h2: Single line
export const SingleLine: Story = {
  render: () => col(
    cb("console.log('one liner');", { language: 'javascript' }),
  ),
};

// h2: Very long line
export const VeryLongLine: Story = {
  render: () => col(
    cb("const veryLongVariableName = 'This is an extremely long string that should trigger horizontal scrolling in the code block to verify overflow handling works correctly without breaking layout';", { language: 'javascript' }),
  ),
};
