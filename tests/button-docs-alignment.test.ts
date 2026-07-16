// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const human = read('docs/components/button.md');
const ai = read('docs/ai/components/button.md');
const showcase = read('website/showcases/button/full.html');
const stories = read('packages/components/src/button/snice-button.stories.ts');

describe('Button documentation alignment', () => {
  it.each([
    ['human', human],
    ['AI', ai]
  ])('%s reference documents the complete targeted-navigation contract', (_name, doc) => {
    for (const term of ['noopener', 'window.opener', '_self', '_parent', '_top', '_blank']) {
      expect(doc).toContain(term);
    }
    expect(doc).toMatch(/named target[\s\S]*separate isolated contexts/i);
    expect(doc).toMatch(/download[\s\S]*takes precedence over `target`/i);
  });

  it('gives Storybook controls for every navigation property', () => {
    for (const property of ['href', 'target', 'download']) {
      expect(stories).toMatch(new RegExp(`^\\s*${property}:\\s+\\{ control: 'text' \\}`, 'm'));
      expect(stories).toContain(`args.${property}`);
    }
  });

  it.each([
    ['full showcase', showcase],
    ['Storybook', stories]
  ])('%s demonstrates same-context, isolated blank, isolated named, download, and blocked paths', (_name, content) => {
    for (const phrase of [
      'Same context',
      'Isolated blank target',
      'Isolated named target',
      'Download without popup',
      'Unsafe scheme (blocked)'
    ]) {
      expect(content).toContain(phrase);
    }
  });

  it.each([
    ['human', human],
    ['AI', ai]
  ])('%s reference documents the complete disabled-fieldset contract', (_name, doc) => {
    expect(doc).toMatch(/disabled fieldset/i);
    expect(doc).toMatch(/first[- ]`?legend`?/i);
    expect(doc).toMatch(/authored state/i);
    for (const mode of ['button', 'submit', 'reset', 'href']) {
      expect(doc).toContain(mode);
    }
    for (const blockedEffect of ['form action', 'navigation', 'button-click']) {
      expect(doc).toContain(blockedEffect);
    }
  });

  it.each([
    ['full showcase', showcase],
    ['Storybook', stories]
  ])('%s demonstrates the disabled-fieldset lifecycle and first-legend exception', (_name, content) => {
    expect(content).toContain('Disabled fieldset lifecycle');
    expect(content).toMatch(/First legend (?:action|remains enabled)/);
    expect(content).toContain('Enable fieldset');
    for (const action of ['Submit', 'Reset', 'Navigate']) {
      expect(content).toContain(action);
    }
  });
});
