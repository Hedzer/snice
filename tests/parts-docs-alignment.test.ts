// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { PART_NAME, extractPartTokens } from '../tooling/shared/part-tokens.js';
import { getWipComponents } from '../tooling/shared/wip-components.js';

const root = resolve(__dirname, '..');
const componentsDir = join(root, 'packages/components/src');
const aiDocsDir = join(root, 'docs/ai/components');
const humanDocsDir = join(root, 'docs/components');
const baselinePath = join(root, 'tests/fixtures/parts-baseline.json');

/** Template sources for a component: its own `.ts` files, minus stories and types. */
function templateSource(dir: string): string {
  return readdirSync(dir)
    .filter(file => file.endsWith('.ts') && !file.endsWith('.stories.ts') && !file.endsWith('.types.ts'))
    .sort()
    .map(file => readFileSync(join(dir, file), 'utf8'))
    .join('\n');
}

// ---------------------------------------------------------------------------
// Documentation extraction
// ---------------------------------------------------------------------------

/** Body lines of every `## CSS Parts` section, fenced code blocks removed. */
function cssPartsSection(markdown: string): string[] {
  const body: string[] = [];
  let capturing = false;
  let fenced = false;
  for (const line of markdown.split('\n')) {
    if (/^```/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    if (/^##\s+CSS Parts\b/.test(line)) { capturing = true; continue; }
    if (capturing && /^##\s/.test(line)) { capturing = false; continue; }
    if (capturing) body.push(line);
  }
  return body;
}

/**
 * The run of backticked part names a documentation entry opens with.
 * Stops at the ` - description` separator, so names mentioned inside a
 * description ("Added to `item` while active") are not counted.
 */
function leadingPartNames(text: string): string[] {
  const names: string[] = [];
  let rest = text.trim();
  for (;;) {
    const match = /^`([^`]+)`\s*(?:[/,+]|and\b)?\s*/.exec(rest);
    if (!match) break;
    if (!PART_NAME.test(match[1])) break;
    names.push(match[1]);
    rest = rest.slice(match[0].length);
  }
  return names;
}

/** Documented parts in `docs/ai/components/<name>.md`: `- \`name\` - description`. */
export function extractAiDocParts(markdown: string): Set<string> {
  const names = new Set<string>();
  for (const line of cssPartsSection(markdown)) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (!bullet) continue;
    for (const name of leadingPartNames(bullet[1])) names.add(name);
  }
  return names;
}

/** Part names when a table cell holds nothing but backticked part names. */
function partNameCell(cell: string): string[] | null {
  const names: string[] = [];
  let rest = cell.trim();
  while (rest.length > 0) {
    const match = /^`([^`]+)`\s*(?:[/,+]|and\b)?\s*/.exec(rest);
    if (!match || !PART_NAME.test(match[1])) return null;
    names.push(match[1]);
    rest = rest.slice(match[0].length);
  }
  return names.length > 0 ? names : null;
}

/**
 * Documented parts in `docs/components/<name>.md`: the part cell of each table
 * row. The part column is found by shape rather than position, because a table
 * may lead with an Element column (`| \`<snice-row>\` | \`cell\` | ... |`).
 */
export function extractHumanDocParts(markdown: string): Set<string> {
  const names = new Set<string>();
  for (const line of cssPartsSection(markdown)) {
    if (!/^\s*\|/.test(line)) continue;
    if (/^\s*\|[\s:|-]*\|?\s*$/.test(line)) continue;
    for (const cell of line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|')) {
      const found = partNameCell(cell);
      if (found) {
        for (const name of found) names.add(name);
        break;
      }
    }
  }
  return names;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

interface Component {
  name: string;
  sourceParts: string[];
  aiParts: string[];
  humanParts: string[];
  hasAiSection: boolean;
  hasHumanSection: boolean;
}

const wip = getWipComponents();

const components: Component[] = readdirSync(componentsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && !wip.has(entry.name))
  .map(entry => entry.name)
  .filter(name => existsSync(join(componentsDir, name, `snice-${name}.ts`)))
  .filter(name => existsSync(join(aiDocsDir, `${name}.md`)))
  .sort()
  .map(name => {
    const ai = readFileSync(join(aiDocsDir, `${name}.md`), 'utf8');
    const humanPath = join(humanDocsDir, `${name}.md`);
    const human = existsSync(humanPath) ? readFileSync(humanPath, 'utf8') : '';
    return {
      name,
      sourceParts: [...extractPartTokens(templateSource(join(componentsDir, name)))].sort(),
      aiParts: [...extractAiDocParts(ai)].sort(),
      humanParts: [...extractHumanDocParts(human)].sort(),
      hasAiSection: cssPartsSection(ai).some(line => line.trim().length > 0),
      hasHumanSection: cssPartsSection(human).some(line => line.trim().length > 0),
    };
  });

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as Record<string, string[]>;

const cases = components.map(component => [component.name, component] as const);

const missing = (from: string[], present: string[]) => {
  const known = new Set(present);
  return from.filter(name => !known.has(name));
};

describe('CSS part documentation alignment', () => {
  it('finds every non-WIP documented component', () => {
    expect(components.length).toBeGreaterThan(100);
    expect(components.map(c => c.name)).not.toContain('spreadsheet');
  });

  it.each(cases)('%s documents exactly the parts its source exposes', (_name, component) => {
    const { name, sourceParts, aiParts, humanParts } = component;
    const problems: string[] = [];

    const undocumentedInAi = missing(sourceParts, aiParts);
    if (undocumentedInAi.length > 0) {
      problems.push(
        `missing from docs/ai/components/${name}.md: ${undocumentedInAi.join(', ')}` +
        (component.hasAiSection && aiParts.length === 0
          ? ' (the section exists but uses no "- `name` - description" bullets)'
          : ''),
      );
    }

    const undocumentedInHuman = missing(sourceParts, humanParts);
    if (undocumentedInHuman.length > 0) {
      problems.push(
        `missing from docs/components/${name}.md: ${undocumentedInHuman.join(', ')}` +
        (component.hasHumanSection && humanParts.length === 0
          ? ' (the section exists but uses no "| `name` | ... |" table rows)'
          : ''),
      );
    }

    const absentFromSourceAi = missing(aiParts, sourceParts);
    if (absentFromSourceAi.length > 0) {
      problems.push(`documented in docs/ai/components/${name}.md but absent from source: ${absentFromSourceAi.join(', ')}`);
    }

    const absentFromSourceHuman = missing(humanParts, sourceParts);
    if (absentFromSourceHuman.length > 0) {
      problems.push(`documented in docs/components/${name}.md but absent from source: ${absentFromSourceHuman.join(', ')}`);
    }

    const aiOnly = missing(aiParts, humanParts);
    const humanOnly = missing(humanParts, aiParts);
    if (aiOnly.length > 0 || humanOnly.length > 0) {
      problems.push(`AI and human references disagree: ai-only [${aiOnly.join(', ')}] human-only [${humanOnly.join(', ')}]`);
    }

    expect(problems, `\n  source parts (${sourceParts.length}): ${sourceParts.join(', ') || '(none)'}\n  ${problems.join('\n  ')}\n`).toEqual([]);
  });
});

describe('CSS part baseline', () => {
  it('describes only components that still exist', () => {
    const known = new Set(components.map(component => component.name));
    const orphans = Object.keys(baseline).filter(name => !known.has(name));
    expect(orphans, `tests/fixtures/parts-baseline.json names components that no longer exist: ${orphans.join(', ')}`).toEqual([]);
  });

  it.each(cases)('%s still exposes every part token it shipped with', (name, component) => {
    const recorded = baseline[name] ?? [];
    const lost = missing(recorded, component.sourceParts);
    expect(
      lost,
      `${name}: part token(s) ${lost.map(token => `"${token}"`).join(', ')} disappeared from ` +
      `packages/components/src/${name}/. Part names are a public contract — they may be added to, ` +
      'never renamed or removed. Restore them, or update tests/fixtures/parts-baseline.json only ' +
      'with an explicit decision to break consumers.',
    ).toEqual([]);
  });
});
