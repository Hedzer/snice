import { describe, expect, it } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Guards for breakages that only ever surface in a browser: a components page
 * the HTML parser rejects outright, and "Docs + Showcase" entries whose target
 * files do not exist.
 */
const root = process.cwd();
const fragmentsDir = resolve(root, 'website/showcases');
const componentsPage = resolve(root, 'website/public/components.html');

function buildComponentsPage(): string {
  if (!existsSync(componentsPage)) {
    execSync('node tooling/website/build-showcases.js', { cwd: root, stdio: 'pipe' });
  }
  return readFileSync(componentsPage, 'utf8');
}

/** Mirrors the slug the page derives from each section heading at runtime. */
function slugFor(headingText: string): string {
  const decoded = headingText
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
    .toLowerCase();
  return decoded.replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
}

describe('website showcase contract', () => {
  it('places the theme script inside <head> so the page parses', () => {
    const head = readFileSync(join(fragmentsDir, 'shared/_head.html'), 'utf8');
    const headOpen = head.indexOf('<head>');
    const firstScript = head.indexOf('<script');

    expect(headOpen, 'the fragment must open a <head>').toBeGreaterThan(-1);
    expect(firstScript, 'a script before <head> makes the whole page unparseable').toBeGreaterThan(headOpen);
  });

  it('every generated page opens <head> before any script', () => {
    const pagesDir = resolve(root, 'website/public');
    const offenders: string[] = [];

    for (const file of readdirSync(pagesDir).filter(f => f.endsWith('.html'))) {
      const html = readFileSync(join(pagesDir, file), 'utf8');
      const headOpen = html.indexOf('<head>');
      const firstScript = html.indexOf('<script');
      if (headOpen === -1 || firstScript === -1) continue;
      if (firstScript < headOpen) offenders.push(file);
    }

    expect(offenders, 'a script before <head> makes the page unparseable and the dev server returns 500').toEqual([]);
  });

  it('every section heading resolves to a documentation file', () => {
    const html = buildComponentsPage();
    const aliasBlock = html.slice(html.indexOf('const DOC_SLUGS'), html.indexOf('const DOC_SLUGS') + 600);
    const aliases: Record<string, string[]> = {};
    for (const [, key, list] of aliasBlock.matchAll(/'([a-z0-9-]+)':\s*\[([^\]]+)\]/g)) {
      aliases[key] = [...list.matchAll(/'([a-z0-9-]+)'/g)].map(m => m[1]);
    }

    const docsDir = resolve(root, 'docs/components');
    const available = new Set(readdirSync(docsDir).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3)));

    const unresolved: string[] = [];
    for (const [, heading] of html.matchAll(/<h3>([^<]+)<\/h3>/g)) {
      const slug = slugFor(heading);
      const candidates = aliases[slug] ?? [slug];
      if (!candidates.some(name => available.has(name))) unresolved.push(`${heading.trim()} → ${slug}`);
    }

    expect(unresolved, 'add an entry to DOC_SLUGS when a heading differs from its doc filename').toEqual([]);
  });

  it('every section heading resolves to a showcase fragment directory', () => {
    const html = buildComponentsPage();
    const aliasBlock = html.slice(html.indexOf('const DOC_SLUGS'), html.indexOf('const DOC_SLUGS') + 600);
    const aliases: Record<string, string[]> = {};
    for (const [, key, list] of aliasBlock.matchAll(/'([a-z0-9-]+)':\s*\[([^\]]+)\]/g)) {
      aliases[key] = [...list.matchAll(/'([a-z0-9-]+)'/g)].map(m => m[1]);
    }

    const dirs = new Set(readdirSync(fragmentsDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name));

    const unresolved: string[] = [];
    for (const [, heading] of html.matchAll(/<h3>([^<]+)<\/h3>/g)) {
      const slug = slugFor(heading);
      const candidates = aliases[slug] ?? [slug];
      if (!candidates.some(name => dirs.has(name))) unresolved.push(`${heading.trim()} → ${slug}`);
    }

    expect(unresolved, 'a heading with no matching showcase directory renders an empty Full Showcase tab').toEqual([]);
  });
});
