import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/code-block/snice-code-block';
import type { SniceCodeBlockElement } from '../../components/code-block/snice-code-block.types';

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
});
