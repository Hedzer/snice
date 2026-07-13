// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const human = read('docs/bindings.md');
const ai = read('docs/ai/bindings.md');
const renderer = read('src/parts.ts');
const websiteBuilder = read('scripts/build-website.js');
const guide = read('public/guide.html');
const readme = read('README.md');
const aiIndex = read('docs/ai/README.md');
const llms = read('llms.txt');
const llmsFull = read('llms-full.txt');

const docs = [
  ['human', human],
  ['AI', ai],
] as const;

describe('Binding channel documentation alignment', () => {
  it.each(docs)('%s reference covers every renderer channel', (_name, doc) => {
    for (const syntax of [
      '${value}',
      'name=${value}',
      '.name=${value}',
      '?name=${value}',
      '@event=${handler}',
      'class:name=${value}',
      'style:name=${value}',
      '...props=${bag}',
      '...attrs=${bag}',
      '...events=${bag}',
      'key=${',
      '<!-- ${value} -->',
    ]) {
      expect(doc, `${_name}: ${syntax}`).toContain(syntax);
    }
  });

  it.each(docs)('%s reference covers every concrete Part implementation', (_name, doc) => {
    const partToHeading = [
      ['NodePart', /node/i],
      ['AttributePart', /attribute/i],
      ['CommentPart', /comment/i],
      ['ClassPart', /class/i],
      ['StylePart', /style/i],
      ['SpreadPart', /spread/i],
      ['PropertyPart', /propert/i],
      ['BooleanAttributePart', /boolean attribute/i],
      ['EventPart', /event/i],
    ] as const;

    for (const [part, topic] of partToHeading) {
      expect(renderer).toContain(`class ${part}`);
      expect(doc, `${_name}: ${part}`).toMatch(topic);
    }
  });

  it.each(docs)('%s reference documents channel-specific sentinel behavior', (_name, doc) => {
    for (const sentinel of ['nothing', 'noChange', 'null', 'undefined', 'false']) {
      expect(doc, `${_name}: ${sentinel}`).toContain(sentinel);
    }
    expect(doc).toMatch(/Node[\s\S]{0,160}(?:clear|Clear)/);
    expect(doc).toMatch(/Attribute[\s\S]{0,180}(?:empty|Empty)/);
    expect(doc).toMatch(/Property[\s\S]{0,180}(?:assign|Assign)/);
    expect(doc).toMatch(/Whole (?:named )?spread[\s\S]{0,180}(?:throw|Throw)/);
  });

  it.each(docs)('%s reference covers the complete event grammar', (_name, doc) => {
    for (const token of [
      'prevent', 'stop', 'immediate', 'once', 'capture', 'passive', 'self',
      'preventDefault', 'stopPropagation', 'stopImmediatePropagation',
      '@keydown.enter', '@keydown.ctrl+s', '@keyup.~enter', '@@snice/',
      'EventListenerObject', 'handleEvent',
    ]) {
      expect(doc, `${_name}: ${token}`).toContain(token);
    }
  });

  it.each(docs)('%s reference documents canonical and accepted spread names', (_name, doc) => {
    for (const name of ['...props', '...properties', '...attrs', '...attributes', '...events']) {
      expect(renderer).toContain(`'${name.slice(3)}'`);
      expect(doc, `${_name}: ${name}`).toContain(name);
    }
    expect(doc).toMatch(/omitted key/i);
    expect(doc).toMatch(/non-array object|non-array.*object/i);
  });

  it('is discoverable from every maintained documentation surface', () => {
    expect(websiteBuilder).toMatch(/id: 'bindings', file: 'bindings\.md', title: 'Binding Channels'/);
    expect(guide).toContain('href="docs.html#bindings"');
    expect(readme).toContain('[Binding Channels](./docs/bindings.md)');
    expect(aiIndex).toContain('`bindings.md`');
    expect(llms).toContain('https://snice.dev/docs.html#bindings');
    expect(llmsFull).toContain('docs/ai/bindings.md');
  });

  it('keeps explicit form data flow in both references', () => {
    for (const [_name, doc] of docs) {
      expect(doc).toContain('.value=${this.query}');
      expect(doc).toContain('@input=${this.updateQuery}');
      expect(doc).toContain('.checked=${this.accepted}');
      expect(doc).toContain('@change=${this.updateAccepted}');
    }
  });
});
