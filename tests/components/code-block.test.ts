import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/code-block/snice-code-block';
import type { SniceCodeBlockElement } from '../../components/code-block/snice-code-block.types';
import { highlightCode, tokenize, registerGrammar, unregisterGrammar, getGrammar } from '../../components/code-block/highlighter';
import type { GrammarDefinition } from '../../components/code-block/highlighter';

// Import grammar JSON files for engine tests
import typescriptGrammar from '../../components/code-block/grammars/typescript.json';
import htmlGrammar from '../../components/code-block/grammars/html.json';
import cssGrammar from '../../components/code-block/grammars/css.json';
import jsonGrammar from '../../components/code-block/grammars/json.json';
import pythonGrammar from '../../components/code-block/grammars/python.json';
import bashGrammar from '../../components/code-block/grammars/bash.json';

describe('snice-code-block', () => {
  let codeBlock: SniceCodeBlockElement;

  afterEach(() => {
    if (codeBlock) {
      removeComponent(codeBlock as HTMLElement);
    }
  });

  it('should render', async () => {
    codeBlock = await createComponent<SniceCodeBlockElement>('snice-code-block');
    expect(codeBlock).toBeTruthy();
  });

  it('should have default properties', async () => {
    codeBlock = await createComponent<SniceCodeBlockElement>('snice-code-block');
    expect(codeBlock.code).toBe('');
    expect(codeBlock.language).toBe('plaintext');
    expect(codeBlock.showLineNumbers).toBe(false);
    expect(codeBlock.copyable).toBe(true);
  });

  it('should display code', async () => {
    codeBlock = await createComponent<SniceCodeBlockElement>('snice-code-block');
    codeBlock.code = 'console.log("hello");';
    await wait(50);
    expect(codeBlock.code).toContain('console.log');
  });

  it('should support language', async () => {
    codeBlock = await createComponent<SniceCodeBlockElement>('snice-code-block', { language: 'javascript' });
    expect(codeBlock.language).toBe('javascript');
  });

  it('should support line numbers', async () => {
    codeBlock = await createComponent<SniceCodeBlockElement>('snice-code-block', { showLineNumbers: true });
    expect(codeBlock.showLineNumbers).toBe(true);
  });

  it('should support filename', async () => {
    codeBlock = await createComponent<SniceCodeBlockElement>('snice-code-block', { filename: 'test.js' });
    expect(codeBlock.filename).toBe('test.js');
  });

  it('should accept a grammar object', async () => {
    codeBlock = await createComponent<SniceCodeBlockElement>('snice-code-block');
    const grammar: GrammarDefinition = {
      name: 'test',
      tokenizer: {
        root: [
          ['\\bfoo\\b', 'keyword'],
        ],
      },
    };
    codeBlock.grammar = grammar;
    codeBlock.code = 'foo bar';
    codeBlock.language = 'plaintext';
    await codeBlock.highlight();
    await wait(50);
    const shadow = codeBlock.shadowRoot!;
    const codeEl = shadow.querySelector('.code-block__code');
    expect(codeEl?.innerHTML).toContain('token keyword');
  });

  it('should render plaintext when no grammar is available', async () => {
    codeBlock = await createComponent<SniceCodeBlockElement>('snice-code-block');
    codeBlock.code = 'hello world';
    codeBlock.language = 'typescript';
    await codeBlock.highlight();
    await wait(50);
    const shadow = codeBlock.shadowRoot!;
    const codeEl = shadow.querySelector('.code-block__code');
    // Without a registered grammar, code is displayed without token spans
    expect(codeEl?.textContent).toContain('hello world');
    expect(codeEl?.innerHTML).not.toContain('token keyword');
  });
});

describe('highlighter engine', () => {
  describe('highlightCode', () => {
    it('should escape HTML for unknown languages', () => {
      const result = highlightCode('<div>hello</div>', 'unknown');
      expect(result).toBe('&lt;div&gt;hello&lt;/div&gt;');
    });

    it('should return highlighted HTML with a grammar object', () => {
      const result = highlightCode('const x = 1;', typescriptGrammar as GrammarDefinition);
      expect(result).toContain('token keyword');
      expect(result).toContain('const');
    });

    it('should accept a Grammar object directly', () => {
      const grammar: GrammarDefinition = {
        name: 'custom',
        tokenizer: {
          root: [['hello', 'keyword']],
        },
      };
      const result = highlightCode('hello world', grammar);
      expect(result).toContain('token keyword');
      expect(result).toContain('hello');
    });
  });

  describe('tokenize', () => {
    it('should return raw tokens', () => {
      const tokens = tokenize('const x = 1;', typescriptGrammar as GrammarDefinition);
      expect(tokens.length).toBeGreaterThan(1);
      const constToken = tokens.find(t => t.text === 'const');
      expect(constToken?.type).toBe('keyword');
    });

    it('should return single plain token for unknown language', () => {
      const tokens = tokenize('hello', 'unknown');
      expect(tokens).toEqual([{ text: 'hello', type: null }]);
    });
  });

  describe('registerGrammar / getGrammar', () => {
    afterEach(() => {
      unregisterGrammar('myLang');
      unregisterGrammar('typescript');
    });

    it('should register and retrieve custom grammars', () => {
      const grammar: GrammarDefinition = {
        name: 'myLang',
        tokenizer: { root: [['test', 'keyword']] },
      };
      registerGrammar('myLang', grammar);
      expect(getGrammar('mylang')).toBe(grammar);
    });

    it('should use registered grammar by language name', () => {
      registerGrammar('typescript', typescriptGrammar as GrammarDefinition);
      const result = highlightCode('const x = 1;', 'typescript');
      expect(result).toContain('token keyword');
      expect(result).toContain('const');
    });

    it('should return undefined for unregistered languages', () => {
      expect(getGrammar('typescript')).toBeUndefined();
      expect(getGrammar('unknown')).toBeUndefined();
    });
  });

  describe('TypeScript grammar', () => {
    const tsGrammar = typescriptGrammar as GrammarDefinition;

    it('should tokenize keywords', () => {
      const tokens = tokenize('const let var', tsGrammar);
      const keywords = tokens.filter(t => t.type === 'keyword');
      expect(keywords.map(t => t.text)).toContain('const');
      expect(keywords.map(t => t.text)).toContain('let');
      expect(keywords.map(t => t.text)).toContain('var');
    });

    it('should tokenize strings', () => {
      const tokens = tokenize('"hello" \'world\'', tsGrammar);
      const strings = tokens.filter(t => t.type === 'string');
      expect(strings.length).toBe(2);
    });

    it('should tokenize template literals', () => {
      const result = highlightCode('`hello ${name}`', tsGrammar);
      expect(result).toContain('token string');
      expect(result).toContain('token punctuation');
    });

    it('should tokenize single-line comments', () => {
      const tokens = tokenize('// comment', tsGrammar);
      expect(tokens[0].type).toBe('comment');
    });

    it('should tokenize multi-line comments', () => {
      const tokens = tokenize('/* comment */', tsGrammar);
      const commentTokens = tokens.filter(t => t.type === 'comment');
      expect(commentTokens.length).toBeGreaterThan(0);
    });

    it('should tokenize numbers', () => {
      const tokens = tokenize('42 3.14 0xFF', tsGrammar);
      const numbers = tokens.filter(t => t.type === 'number');
      expect(numbers.length).toBe(3);
    });

    it('should tokenize decorators as tags', () => {
      const tokens = tokenize('@element', tsGrammar);
      expect(tokens[0].type).toBe('tag');
    });

    it('should tokenize class names', () => {
      const tokens = tokenize('HTMLElement MyClass', tsGrammar);
      const classNames = tokens.filter(t => t.type === 'class-name');
      expect(classNames.map(t => t.text)).toContain('HTMLElement');
      expect(classNames.map(t => t.text)).toContain('MyClass');
    });

    it('should tokenize function calls', () => {
      const tokens = tokenize('console.log()', tsGrammar);
      const funcs = tokens.filter(t => t.type === 'function');
      expect(funcs.map(t => t.text)).toContain('log');
    });

    it('should tokenize constants', () => {
      const tokens = tokenize('true false null undefined', tsGrammar);
      const constants = tokens.filter(t => t.type === 'constant');
      expect(constants.length).toBe(4);
    });

    it('should handle template literal interpolations', () => {
      const tokens = tokenize('`a${x}b`', tsGrammar);
      const types = tokens.map(t => t.type);
      // Should contain: string(`), string(a), punctuation(${), something for x, punctuation(}), string(b), string(`)
      expect(types).toContain('string');
      expect(types).toContain('punctuation');
    });
  });

  describe('HTML grammar', () => {
    const grammar = htmlGrammar as GrammarDefinition;

    it('should tokenize tags', () => {
      const tokens = tokenize('<div>', grammar);
      const tagTokens = tokens.filter(t => t.type === 'tag');
      expect(tagTokens.length).toBeGreaterThan(0);
    });

    it('should tokenize attributes', () => {
      const result = highlightCode('<div class="foo">', grammar);
      expect(result).toContain('token attr-name');
      expect(result).toContain('token attr-value');
    });

    it('should tokenize comments', () => {
      const tokens = tokenize('<!-- comment -->', grammar);
      expect(tokens[0].type).toBe('comment');
    });

    it('should tokenize closing tags', () => {
      const tokens = tokenize('</div>', grammar);
      const tagTokens = tokens.filter(t => t.type === 'tag');
      expect(tagTokens.length).toBeGreaterThan(0);
    });

    it('should tokenize self-closing tags', () => {
      const result = highlightCode('<br/>', grammar);
      expect(result).toContain('token tag');
    });
  });

  describe('CSS grammar', () => {
    const grammar = cssGrammar as GrammarDefinition;

    it('should tokenize properties', () => {
      const tokens = tokenize('color: red;', grammar);
      const props = tokens.filter(t => t.type === 'property');
      expect(props.map(t => t.text)).toContain('color');
    });

    it('should tokenize comments', () => {
      const tokens = tokenize('/* comment */', grammar);
      const comments = tokens.filter(t => t.type === 'comment');
      expect(comments.length).toBeGreaterThan(0);
    });

    it('should tokenize numbers with units', () => {
      const tokens = tokenize('10px 2rem 50%', grammar);
      const numbers = tokens.filter(t => t.type === 'number');
      expect(numbers.length).toBe(3);
    });

    it('should tokenize at-rules', () => {
      const tokens = tokenize('@media', grammar);
      expect(tokens[0].type).toBe('keyword');
    });

    it('should tokenize strings', () => {
      const tokens = tokenize('"Arial"', grammar);
      const strings = tokens.filter(t => t.type === 'string');
      expect(strings.length).toBe(1);
    });
  });

  describe('JSON grammar', () => {
    const grammar = jsonGrammar as GrammarDefinition;

    it('should tokenize keys as properties', () => {
      const tokens = tokenize('"name": "value"', grammar);
      const props = tokens.filter(t => t.type === 'property');
      expect(props.length).toBe(1);
      expect(props[0].text).toBe('"name"');
    });

    it('should tokenize string values', () => {
      const result = highlightCode('{ "key": "value" }', grammar);
      expect(result).toContain('token string');
    });

    it('should tokenize numbers', () => {
      const tokens = tokenize('42', grammar);
      expect(tokens[0].type).toBe('number');
    });

    it('should tokenize constants', () => {
      const tokens = tokenize('true false null', grammar);
      const constants = tokens.filter(t => t.type === 'constant');
      expect(constants.length).toBe(3);
    });
  });

  describe('Python grammar', () => {
    const grammar = pythonGrammar as GrammarDefinition;

    it('should tokenize keywords', () => {
      const tokens = tokenize('def class if', grammar);
      const keywords = tokens.filter(t => t.type === 'keyword');
      expect(keywords.length).toBe(3);
    });

    it('should tokenize comments', () => {
      const tokens = tokenize('# comment', grammar);
      expect(tokens[0].type).toBe('comment');
    });

    it('should tokenize triple-quoted strings', () => {
      const tokens = tokenize('"""docstring"""', grammar);
      const strings = tokens.filter(t => t.type === 'string');
      expect(strings.length).toBeGreaterThan(0);
    });

    it('should tokenize builtins', () => {
      const tokens = tokenize('print len range', grammar);
      const builtins = tokens.filter(t => t.type === 'builtin' || t.type === 'function');
      expect(builtins.length).toBeGreaterThan(0);
    });

    it('should tokenize decorators', () => {
      const tokens = tokenize('@property', grammar);
      expect(tokens[0].type).toBe('tag');
    });

    it('should tokenize constants', () => {
      const tokens = tokenize('True False None', grammar);
      const constants = tokens.filter(t => t.type === 'constant');
      expect(constants.length).toBe(3);
    });
  });

  describe('Bash grammar', () => {
    const grammar = bashGrammar as GrammarDefinition;

    it('should tokenize keywords', () => {
      const tokens = tokenize('if then fi', grammar);
      const keywords = tokens.filter(t => t.type === 'keyword');
      expect(keywords.length).toBe(3);
    });

    it('should tokenize comments', () => {
      const tokens = tokenize('# comment', grammar);
      expect(tokens[0].type).toBe('comment');
    });

    it('should tokenize variables', () => {
      const tokens = tokenize('$HOME ${PATH}', grammar);
      const vars = tokens.filter(t => t.type === 'attr-name');
      expect(vars.length).toBe(2);
    });

    it('should tokenize builtins', () => {
      const tokens = tokenize('echo cd ls', grammar);
      const builtins = tokens.filter(t => t.type === 'builtin');
      expect(builtins.length).toBe(3);
    });

    it('should tokenize strings', () => {
      const tokens = tokenize('"hello" \'world\'', grammar);
      const strings = tokens.filter(t => t.type === 'string');
      expect(strings.length).toBeGreaterThan(0);
    });
  });

  describe('state machine', () => {
    const tsGrammar = typescriptGrammar as GrammarDefinition;

    it('should handle state transitions (push/pop)', () => {
      // Multi-line comments use push to @comment and pop back
      const code = 'before /* inside */ after';
      const tokens = tokenize(code, tsGrammar);
      const commentTokens = tokens.filter(t => t.type === 'comment');
      expect(commentTokens.length).toBeGreaterThan(0);
      // "after" should not be a comment
      const afterToken = tokens.find(t => t.text.trim() === 'after');
      expect(afterToken?.type).not.toBe('comment');
    });

    it('should handle nested state transitions', () => {
      // Template literal with interpolation
      const code = '`hello ${x} world`';
      const tokens = tokenize(code, tsGrammar);
      // Should contain string tokens, punctuation for ${}, and the variable
      const types = tokens.map(t => t.type);
      expect(types.filter(t => t === 'string').length).toBeGreaterThan(0);
      expect(types.filter(t => t === 'punctuation').length).toBeGreaterThan(0);
    });

    it('should handle include directives', () => {
      // The interpolation state includes @root, which means TS tokens work inside ${}
      const code = '`${const}`';
      const tokens = tokenize(code, tsGrammar);
      const kwTokens = tokens.filter(t => t.type === 'keyword');
      expect(kwTokens.map(t => t.text)).toContain('const');
    });
  });

  describe('edge cases', () => {
    const tsGrammar = typescriptGrammar as GrammarDefinition;

    it('should handle empty code', () => {
      const result = highlightCode('', tsGrammar);
      expect(result).toBe('');
    });

    it('should handle code with only whitespace', () => {
      const result = highlightCode('   \n  ', tsGrammar);
      expect(result).toBeTruthy();
    });

    it('should handle special HTML characters in code', () => {
      const result = highlightCode('a < b && c > d', tsGrammar);
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&amp;');
    });

    it('should not infinite loop on unmatched input', () => {
      const grammar: GrammarDefinition = {
        name: 'minimal',
        tokenizer: {
          root: [['abc', 'keyword']],
        },
      };
      // This input has no matches — should still terminate
      const result = highlightCode('xyz xyz xyz', grammar);
      expect(result).toContain('xyz');
    });

    it('should return escaped plaintext for unregistered language strings', () => {
      const result = highlightCode('<b>hello</b>', 'unregistered');
      expect(result).toBe('&lt;b&gt;hello&lt;/b&gt;');
    });
  });
});
