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
import sniceGrammar from '../../components/code-block/grammars/snice.json';

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

  it('should have default fetchMode of native', async () => {
    codeBlock = await createComponent<SniceCodeBlockElement>('snice-code-block');
    expect(codeBlock.fetchMode).toBe('native');
  });

  it('should accept fetch-mode attribute', async () => {
    codeBlock = await createComponent<SniceCodeBlockElement>('snice-code-block');
    codeBlock.setAttribute('fetch-mode', 'virtual');
    expect(codeBlock.fetchMode).toBe('virtual');
  });

  it('should accept fetch-mode="event"', async () => {
    codeBlock = await createComponent<SniceCodeBlockElement>('snice-code-block');
    codeBlock.setAttribute('fetch-mode', 'event');
    expect(codeBlock.fetchMode).toBe('event');
  });

  it('should dispatch grammar-request event in event mode', async () => {
    codeBlock = await createComponent<SniceCodeBlockElement>('snice-code-block');
    codeBlock.fetchMode = 'event';

    const eventPromise = new Promise<CustomEvent>((resolve) => {
      codeBlock.addEventListener('grammar-request', (e) => resolve(e as CustomEvent), { once: true });
    });

    codeBlock.grammar = 'grammars/typescript.json';
    codeBlock.code = 'const x = 1;';

    const event = await eventPromise;
    expect(event.detail.url).toBe('grammars/typescript.json');
    expect(event.detail.codeBlock).toBe(codeBlock);
  });

  it('should read code from slotted text content', async () => {
    const el = document.createElement('snice-code-block') as SniceCodeBlockElement;
    el.textContent = 'const y = 2;';
    document.body.appendChild(el);
    await (el as any).ready;
    await wait(50);
    expect(el.code).toBe('const y = 2;');
    el.remove();
  });

  it('should highlight with setGrammar', async () => {
    const grammar: GrammarDefinition = {
      name: 'test',
      tokenizer: {
        root: [
          ['\\bfoo\\b', 'keyword'],
        ],
      },
    };
    codeBlock = await createComponent<SniceCodeBlockElement>('snice-code-block');
    codeBlock.code = 'foo bar';
    codeBlock.setGrammar(grammar);
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

  describe('Snice grammar', () => {
    const grammar = sniceGrammar as GrammarDefinition;

    describe('TypeScript base functionality', () => {
      it('should tokenize TS keywords', () => {
        const tokens = tokenize('const let var', grammar);
        const keywords = tokens.filter(t => t.type === 'keyword');
        expect(keywords.map(t => t.text)).toContain('const');
        expect(keywords.map(t => t.text)).toContain('let');
        expect(keywords.map(t => t.text)).toContain('var');
      });

      it('should tokenize TS strings', () => {
        const tokens = tokenize('"hello" \'world\'', grammar);
        const strings = tokens.filter(t => t.type === 'string');
        expect(strings.length).toBe(2);
      });

      it('should tokenize decorators', () => {
        const tokens = tokenize('@element @render @styles', grammar);
        const tags = tokens.filter(t => t.type === 'tag');
        expect(tags.map(t => t.text)).toContain('@element');
        expect(tags.map(t => t.text)).toContain('@render');
        expect(tags.map(t => t.text)).toContain('@styles');
      });

      it('should tokenize class names', () => {
        const tokens = tokenize('HTMLElement MyComponent', grammar);
        const classNames = tokens.filter(t => t.type === 'class-name');
        expect(classNames.map(t => t.text)).toContain('HTMLElement');
        expect(classNames.map(t => t.text)).toContain('MyComponent');
      });

      it('should tokenize regular template literals', () => {
        const tokens = tokenize('`hello ${name}`', grammar);
        const types = tokens.map(t => t.type);
        expect(types).toContain('string');
        expect(types).toContain('punctuation');
      });

      it('should tokenize comments', () => {
        const tokens = tokenize('// single\n/* multi */', grammar);
        const comments = tokens.filter(t => t.type === 'comment');
        expect(comments.length).toBeGreaterThan(0);
      });
    });

    describe('html`` tagged template', () => {
      it('should recognize html` as tag and enter HTML mode', () => {
        const tokens = tokenize('html`<div>hello</div>`', grammar);
        // html` is the opening tag token
        expect(tokens[0].text).toBe('html`');
        expect(tokens[0].type).toBe('tag');
        // closing ` is also tag
        const lastToken = tokens[tokens.length - 1];
        expect(lastToken.text).toBe('`');
        expect(lastToken.type).toBe('tag');
      });

      it('should tokenize HTML tags inside html``', () => {
        const tokens = tokenize('html`<div class="foo">text</div>`', grammar);
        const tagTokens = tokens.filter(t => t.type === 'tag');
        // Should have: html`, <div, >, </div>, `
        expect(tagTokens.length).toBeGreaterThanOrEqual(4);
      });

      it('should tokenize HTML attributes', () => {
        const tokens = tokenize('html`<div class="foo">`', grammar);
        const attrNames = tokens.filter(t => t.type === 'attr-name');
        expect(attrNames.map(t => t.text)).toContain('class');
        const attrValues = tokens.filter(t => t.type === 'attr-value');
        expect(attrValues.length).toBeGreaterThan(0);
      });

      it('should tokenize HTML comments', () => {
        const tokens = tokenize('html`<!-- comment -->`', grammar);
        const comments = tokens.filter(t => t.type === 'comment');
        expect(comments.length).toBeGreaterThan(0);
      });

      it('should tokenize self-closing tags', () => {
        const tokens = tokenize('html`<br/>`', grammar);
        const tagTokens = tokens.filter(t => t.type === 'tag');
        expect(tagTokens.some(t => t.text === '/>')).toBe(true);
      });

      it('should handle interpolation inside html``', () => {
        const tokens = tokenize('html`<span>${this.count}</span>`', grammar);
        // ${  and } are punctuation (interpolation delimiters)
        const punctTokens = tokens.filter(t => t.type === 'punctuation');
        expect(punctTokens.some(t => t.text === '${')).toBe(true);
        expect(punctTokens.some(t => t.text === '}')).toBe(true);
        // "this" inside interpolation should be a keyword
        const keywords = tokens.filter(t => t.type === 'keyword');
        expect(keywords.map(t => t.text)).toContain('this');
      });

      it('should handle interpolation inside attribute values', () => {
        const tokens = tokenize('html`<div class="${cls}">`', grammar);
        const punctTokens = tokens.filter(t => t.type === 'punctuation');
        expect(punctTokens.some(t => t.text === '${')).toBe(true);
      });

      it('should handle html/*html*/` pattern', () => {
        const tokens = tokenize('html/*html*/`<div></div>`', grammar);
        // The opening html/*html*/` should be a tag token
        expect(tokens[0].type).toBe('tag');
        expect(tokens[0].text).toBe('html/*html*/`');
        // Should still parse HTML inside
        const tagTokens = tokens.filter(t => t.type === 'tag');
        expect(tagTokens.length).toBeGreaterThanOrEqual(3);
      });

      it('should return to TS mode after closing backtick', () => {
        const tokens = tokenize('html`<div></div>`; const x = 1;', grammar);
        // After the template, "const" should be a keyword
        const keywords = tokens.filter(t => t.type === 'keyword');
        expect(keywords.map(t => t.text)).toContain('const');
      });

      it('should handle HTML entities', () => {
        const tokens = tokenize('html`&amp; &lt;`', grammar);
        const constants = tokens.filter(t => t.type === 'constant');
        expect(constants.some(t => t.text === '&amp;')).toBe(true);
        expect(constants.some(t => t.text === '&lt;')).toBe(true);
      });
    });

    describe('snice conditional elements', () => {
      it('should tokenize <if> as keyword', () => {
        const tokens = tokenize('html`<if ${cond}>content</if>`', grammar);
        const keywords = tokens.filter(t => t.type === 'keyword');
        expect(keywords.some(t => t.text === '<if')).toBe(true);
        expect(keywords.some(t => t.text === '</if>')).toBe(true);
      });

      it('should tokenize <case> as keyword', () => {
        const tokens = tokenize('html`<case ${val}><when value="a">A</when><default>B</default></case>`', grammar);
        const keywords = tokens.filter(t => t.type === 'keyword');
        const kwTexts = keywords.map(t => t.text);
        expect(kwTexts).toContain('<case');
        expect(kwTexts).toContain('<when');
        expect(kwTexts).toContain('<default');
        expect(kwTexts).toContain('</case>');
      });

      it('should tokenize </when> and </default> as keyword', () => {
        const tokens = tokenize('html`</when></default>`', grammar);
        const keywords = tokens.filter(t => t.type === 'keyword');
        expect(keywords.some(t => t.text === '</when>')).toBe(true);
        expect(keywords.some(t => t.text === '</default>')).toBe(true);
      });

      it('should not match <iframe> as snice element', () => {
        const tokens = tokenize('html`<iframe></iframe>`', grammar);
        const keywords = tokens.filter(t => t.type === 'keyword');
        // <iframe should be a tag, not keyword
        expect(keywords.every(t => !t.text.includes('iframe'))).toBe(true);
        const tagTokens = tokens.filter(t => t.type === 'tag');
        expect(tagTokens.some(t => t.text === '<iframe')).toBe(true);
      });

      it('should not match <case-study> as snice element', () => {
        const tokens = tokenize('html`<case-study></case-study>`', grammar);
        const tagTokens = tokens.filter(t => t.type === 'tag');
        expect(tagTokens.some(t => t.text === '<case-study')).toBe(true);
      });

      it('should handle <if> with interpolation condition', () => {
        const tokens = tokenize('html`<if ${this.isLoggedIn}><span>Hi</span></if>`', grammar);
        const keywords = tokens.filter(t => t.type === 'keyword');
        expect(keywords.some(t => t.text === '<if')).toBe(true);
        expect(keywords.some(t => t.text === '</if>')).toBe(true);
        // "this" inside the condition interpolation
        expect(keywords.some(t => t.text === 'this')).toBe(true);
      });

      it('should handle <when> with value attribute', () => {
        const tokens = tokenize('html`<when value="loading">Loading...</when>`', grammar);
        const keywords = tokens.filter(t => t.type === 'keyword');
        expect(keywords.some(t => t.text === '<when')).toBe(true);
        // "value" is an attr-name
        const attrNames = tokens.filter(t => t.type === 'attr-name');
        expect(attrNames.some(t => t.text === 'value')).toBe(true);
      });

      it('should handle <default> with no attributes', () => {
        const tokens = tokenize('html`<default>Fallback</default>`', grammar);
        const keywords = tokens.filter(t => t.type === 'keyword');
        expect(keywords.some(t => t.text === '<default')).toBe(true);
        expect(keywords.some(t => t.text === '</default>')).toBe(true);
      });
    });

    describe('snice binding syntax', () => {
      it('should tokenize .property binding as property', () => {
        const tokens = tokenize('html`<input .value=${val}>`', grammar);
        const props = tokens.filter(t => t.type === 'property');
        expect(props.some(t => t.text === '.value')).toBe(true);
      });

      it('should tokenize ?boolean binding as attr-name', () => {
        const tokens = tokenize('html`<input ?disabled=${bool}>`', grammar);
        const attrs = tokens.filter(t => t.type === 'attr-name');
        expect(attrs.some(t => t.text === '?disabled')).toBe(true);
      });

      it('should tokenize @event binding as function', () => {
        const tokens = tokenize('html`<button @click=${handler}>`', grammar);
        const funcs = tokens.filter(t => t.type === 'function');
        expect(funcs.some(t => t.text === '@click')).toBe(true);
      });

      it('should tokenize @event:modifier binding', () => {
        const tokens = tokenize('html`<input @keydown:ctrl+s=${save}>`', grammar);
        const funcs = tokens.filter(t => t.type === 'function');
        expect(funcs.some(t => t.text === '@keydown:ctrl+s')).toBe(true);
      });

      it('should tokenize @event.modifier binding', () => {
        const tokens = tokenize('html`<input @keydown.enter=${submit}>`', grammar);
        const funcs = tokens.filter(t => t.type === 'function');
        expect(funcs.some(t => t.text === '@keydown.enter')).toBe(true);
      });

      it('should tokenize @event:~wildcard binding', () => {
        const tokens = tokenize('html`<input @keydown:~enter=${handler}>`', grammar);
        const funcs = tokens.filter(t => t.type === 'function');
        expect(funcs.some(t => t.text === '@keydown:~enter')).toBe(true);
      });

      it('should tokenize regular attributes alongside bindings', () => {
        const tokens = tokenize('html`<input type="text" .value=${v} ?disabled=${d} @input=${h}>`', grammar);
        const attrNames = tokens.filter(t => t.type === 'attr-name');
        expect(attrNames.some(t => t.text === 'type')).toBe(true);
        expect(attrNames.some(t => t.text === '?disabled')).toBe(true);
        const props = tokens.filter(t => t.type === 'property');
        expect(props.some(t => t.text === '.value')).toBe(true);
        const funcs = tokens.filter(t => t.type === 'function');
        expect(funcs.some(t => t.text === '@input')).toBe(true);
      });
    });

    describe('css`` tagged template', () => {
      it('should recognize css` as tag and enter CSS mode', () => {
        const tokens = tokenize('css`:host { display: block; }`', grammar);
        expect(tokens[0].text).toBe('css`');
        expect(tokens[0].type).toBe('tag');
        const lastToken = tokens[tokens.length - 1];
        expect(lastToken.text).toBe('`');
        expect(lastToken.type).toBe('tag');
      });

      it('should tokenize CSS properties', () => {
        const tokens = tokenize('css`color: red;`', grammar);
        const props = tokens.filter(t => t.type === 'property');
        expect(props.map(t => t.text)).toContain('color');
      });

      it('should tokenize CSS numbers with units', () => {
        const tokens = tokenize('css`width: 100px; margin: 2rem;`', grammar);
        const numbers = tokens.filter(t => t.type === 'number');
        expect(numbers.some(t => t.text === '100px')).toBe(true);
        expect(numbers.some(t => t.text === '2rem')).toBe(true);
      });

      it('should tokenize CSS hex colors', () => {
        const tokens = tokenize('css`color: #ff0000;`', grammar);
        const numbers = tokens.filter(t => t.type === 'number');
        expect(numbers.some(t => t.text === '#ff0000')).toBe(true);
      });

      it('should tokenize CSS class selectors', () => {
        const tokens = tokenize('css`.active { color: red; }`', grammar);
        const classNames = tokens.filter(t => t.type === 'class-name');
        expect(classNames.some(t => t.text === '.active')).toBe(true);
      });

      it('should tokenize CSS pseudo-classes', () => {
        const tokens = tokenize('css`:host { display: block; }`', grammar);
        const tagTokens = tokens.filter(t => t.type === 'tag');
        expect(tagTokens.some(t => t.text === ':host')).toBe(true);
      });

      it('should tokenize CSS pseudo-elements', () => {
        const tokens = tokenize('css`::slotted(div) { color: red; }`', grammar);
        const tagTokens = tokens.filter(t => t.type === 'tag');
        expect(tagTokens.some(t => t.text === '::slotted')).toBe(true);
      });

      it('should tokenize CSS at-rules', () => {
        const tokens = tokenize('css`@media (max-width: 768px) {}`', grammar);
        const keywords = tokens.filter(t => t.type === 'keyword');
        expect(keywords.some(t => t.text === '@media')).toBe(true);
      });

      it('should tokenize !important', () => {
        const tokens = tokenize('css`color: red !important;`', grammar);
        const keywords = tokens.filter(t => t.type === 'keyword');
        expect(keywords.some(t => t.text === '!important')).toBe(true);
      });

      it('should tokenize CSS comments', () => {
        const tokens = tokenize('css`/* comment */`', grammar);
        const comments = tokens.filter(t => t.type === 'comment');
        expect(comments.length).toBeGreaterThan(0);
      });

      it('should tokenize CSS custom properties', () => {
        const tokens = tokenize('css`--my-color: red;`', grammar);
        const attrNames = tokens.filter(t => t.type === 'attr-name');
        expect(attrNames.some(t => t.text === '--my-color')).toBe(true);
      });

      it('should tokenize CSS functions', () => {
        const tokens = tokenize('css`color: var(--my-color);`', grammar);
        const funcs = tokens.filter(t => t.type === 'function');
        expect(funcs.some(t => t.text === 'var')).toBe(true);
      });

      it('should handle interpolation inside css``', () => {
        const tokens = tokenize('css`display: ${isBlock ? "block" : "inline"};`', grammar);
        const punctTokens = tokens.filter(t => t.type === 'punctuation');
        expect(punctTokens.some(t => t.text === '${')).toBe(true);
        expect(punctTokens.some(t => t.text === '}')).toBe(true);
      });

      it('should handle css/*css*/` pattern', () => {
        const tokens = tokenize('css/*css*/`:host { display: block; }`', grammar);
        expect(tokens[0].type).toBe('tag');
        expect(tokens[0].text).toBe('css/*css*/`');
      });

      it('should return to TS mode after closing backtick', () => {
        const tokens = tokenize('css`:host{}`; const x = 1;', grammar);
        const keywords = tokens.filter(t => t.type === 'keyword');
        expect(keywords.map(t => t.text)).toContain('const');
      });
    });

    describe('real-world snice patterns', () => {
      it('should handle a complete @render() method', () => {
        const code = `@render()
  template() {
    return html\`<div class="wrapper">
      <if \${this.label}>
        <label>\${this.label}</label>
      </if>
      <slot></slot>
    </div>\`;
  }`;
        const tokens = tokenize(code, grammar);
        // @render is a decorator
        expect(tokens.some(t => t.type === 'tag' && t.text === '@render')).toBe(true);
        // "return" is a keyword
        expect(tokens.some(t => t.type === 'keyword' && t.text === 'return')).toBe(true);
        // html` is a tag
        expect(tokens.some(t => t.type === 'tag' && t.text === 'html`')).toBe(true);
        // <if is a keyword
        expect(tokens.some(t => t.type === 'keyword' && t.text === '<if')).toBe(true);
        // </if> is a keyword
        expect(tokens.some(t => t.type === 'keyword' && t.text === '</if>')).toBe(true);
        // <slot is a regular tag
        expect(tokens.some(t => t.type === 'tag' && t.text === '<slot')).toBe(true);
      });

      it('should handle a @styles() method', () => {
        const code = `@styles()
  componentStyles() {
    return css\`:host { display: block; padding: 1rem; }\`;
  }`;
        const tokens = tokenize(code, grammar);
        expect(tokens.some(t => t.type === 'tag' && t.text === '@styles')).toBe(true);
        expect(tokens.some(t => t.type === 'tag' && t.text === 'css`')).toBe(true);
        expect(tokens.some(t => t.type === 'tag' && t.text === ':host')).toBe(true);
        expect(tokens.some(t => t.type === 'property' && t.text === 'display')).toBe(true);
        expect(tokens.some(t => t.type === 'property' && t.text === 'padding')).toBe(true);
      });

      it('should handle event handler with arrow function in interpolation', () => {
        const code = 'html`<button @click=${() => this.count++}>Click</button>`';
        const tokens = tokenize(code, grammar);
        const funcs = tokens.filter(t => t.type === 'function');
        expect(funcs.some(t => t.text === '@click')).toBe(true);
        // Arrow function keyword
        const keywords = tokens.filter(t => t.type === 'keyword');
        expect(keywords.some(t => t.text === '=>')).toBe(true);
      });

      it('should handle case/when pattern', () => {
        const code = `html\`<case \${status}>
          <when value="loading"><span>Loading...</span></when>
          <when value="error"><span>Error</span></when>
          <default><span>Ready</span></default>
        </case>\``;
        const tokens = tokenize(code, grammar);
        const keywords = tokens.filter(t => t.type === 'keyword');
        const kwTexts = keywords.map(t => t.text);
        expect(kwTexts).toContain('<case');
        expect(kwTexts).toContain('<when');
        expect(kwTexts).toContain('<default');
        expect(kwTexts).toContain('</case>');
        // "value" attributes on <when>
        const attrNames = tokens.filter(t => t.type === 'attr-name');
        expect(attrNames.filter(t => t.text === 'value').length).toBe(2);
      });

      it('should handle mixed bindings on a single element', () => {
        const code = 'html`<input type="text" .value=${this.val} ?disabled=${this.off} @input=${this.handle}>`';
        const tokens = tokenize(code, grammar);
        // Regular attr
        const attrs = tokens.filter(t => t.type === 'attr-name');
        expect(attrs.some(t => t.text === 'type')).toBe(true);
        expect(attrs.some(t => t.text === '?disabled')).toBe(true);
        // Property binding
        const props = tokens.filter(t => t.type === 'property');
        expect(props.some(t => t.text === '.value')).toBe(true);
        // Event binding
        const funcs = tokens.filter(t => t.type === 'function');
        expect(funcs.some(t => t.text === '@input')).toBe(true);
        // Attr values
        const attrVals = tokens.filter(t => t.type === 'attr-value');
        expect(attrVals.length).toBeGreaterThan(0);
      });

      it('should handle nested interpolation with html`` inside', () => {
        const code = 'html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`';
        const tokens = tokenize(code, grammar);
        // Outer html` and inner html` both exist
        const tagTokens = tokens.filter(t => t.type === 'tag');
        const htmlOpeners = tagTokens.filter(t => t.text === 'html`');
        expect(htmlOpeners.length).toBe(2);
        // <li and </li> tags exist
        expect(tagTokens.some(t => t.text === '<li')).toBe(true);
      });
    });
  });
});
