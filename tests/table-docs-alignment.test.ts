// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const human = read('docs/components/table.md');
const ai = read('docs/ai/components/table.md');
const standards = read('.ai/coding-standards.md');
const publicShowcase = read('public/showcases/table.html');
const fullShowcase = read('components/table/full-showcase.html');
const stories = read('components/table/snice-table.stories.ts');
const showcaseFooter = read('public/showcases/_footer.html');

const consumerMethods = [
  'getTableConfig',
  'getTableData',
  'setData',
  'setColumns',
  'renderControls',
  'renderHeader',
  'renderSortableHeader',
  'renderBody',
  'renderPagination',
  'createCellElement',
  'getCellTagName',
  'toggleFullscreen',
  'updateRowSelectionState',
  'updateSelectAllState',
  'getSelectedData',
  'setSelectabilityCheck',
  'toggleSort',
  'setSortComparator',
  'goToPage',
  'setPageSize',
  'scrollToRow',
  'scrollToColumn',
  'getScrollPosition',
  'setColumnFilter',
  'removeColumnFilter',
  'setQuickFilter',
  'setFilterModel',
  'getFilterModel',
  'clearAllFilters',
  'setColumnVisible',
  'showAllColumns',
  'hideAllColumns',
  'getColumnVisibility',
  'pinColumn',
  'unpinColumn',
  'autoSizeColumn',
  'autoSizeAllColumns',
  'moveColumn',
  'setColumnGroups',
  'startEdit',
  'commitEdit',
  'cancelEdit',
  'setCellEditableCheck',
  'exportCSV',
  'printTable',
  'copyToClipboard',
  'setDetailPanel',
  'expandRow',
  'collapseRow',
  'toggleRowExpansion',
  'expandAllRows',
  'collapseAllRows',
  'setToolbar',
  'setTreeData',
  'expandTreeNode',
  'collapseTreeNode',
  'toggleTreeNode',
  'expandAllTreeNodes',
  'collapseAllTreeNodes',
  'pinRowTop',
  'pinRowBottom',
  'unpinRow',
  'clearPinnedRows',
  'setRowHeight',
  'setRowHeightCallback',
  'setListViewRenderer',
];

const childMethods = [
  'setFormatter',
  'addConditionalFormat',
  'removeConditionalFormat',
  'clearConditionalFormats',
  'getColumnDefinition',
  'select',
  'deselect',
  'focusRow',
  'getCellValue',
  'setCellValue',
  'getCellElement',
  'updateCells',
  'highlight',
];

const allMethods = [...consumerMethods, ...childMethods];

describe('Table documentation alignment', () => {
  it.each([
    ['human', human],
    ['AI', ai],
  ])('%s reference covers the consumer-facing advanced API', (_name, doc) => {
    const missing = allMethods.filter((method) => !doc.includes(`${method}(`));
    expect(missing).toEqual([]);
  });

  it('gives every AI method a dash-notation description', () => {
    const missing = allMethods.filter((method) => {
      const described = new RegExp(`\\\`${method}\\([^\\\`]*\\\` - `);
      return !ai.split('\n').some((line) => described.test(line));
    });
    expect(missing).toEqual([]);
  });

  it('uses remote mode in the controller request/respond example', () => {
    expect(human).toMatch(
      /<snice-table(?=[^>]*\bmode="remote")(?=[^>]*\bcontroller="user-table")[^>]*>/
    );
  });

  it('uses a rendering data path in the Tree Data example', () => {
    const treeExample = human.split('### Tree Data')[1]?.split('\n### ')[0] ?? '';
    expect(treeExample).toMatch(/table\.data\s*=|table\.renderBody\(\)/);
  });

  it('uses data-* or the JS property for declarative rows, never a JSON data attribute', () => {
    const declarative = human.split('### Declarative Columns and Rows')[1]?.split('\n### ')[0] ?? '';
    expect(declarative).toContain('data-name="Alice"');
    expect(declarative).toContain('bob.data =');
    expect(declarative).not.toMatch(/<snice-row\b[^>]*\sdata\s*=/s);
  });

  it.each([
    ['human', human],
    ['AI', ai],
  ])('%s reference identifies quickFilter as a non-functional flag', (_name, doc) => {
    expect(doc).toMatch(/quickFilter[^\n]*(?:no-op|does not|doesn't|inert|legacy)/i);
  });

  it('does not advertise the currently un-emitted density event', () => {
    expect(human).not.toMatch(/^\|\s*`density-change`/m);
    expect(ai).not.toMatch(/^['`-]*density-change['`]*\s*(?:->|→|:)/m);
  });

  it('keeps typed AI signatures and declarative child properties', () => {
    for (const signature of [
      'striped:boolean=false',
      'pageSize:number=10',
      'key:string=',
      'aggregate?:Aggregator',
      'ratingMax?:number',
      'cellTextDecoration?:',
      'selected:boolean=false',
      'data:any={}',
      'columns:ColumnDefinition[]=[]',
    ]) {
      expect(ai).toContain(signature);
    }
  });

  it('documents child event payloads and every standalone cell part', () => {
    for (const doc of [human, ai]) {
      for (const part of ['content', 'action-button', 'toggle', 'tag', 'link']) {
        expect(doc).toContain(`\`${part}\``);
      }
    }
    expect(ai).toMatch(/column-changed` → `\{column\}`/);
    expect(ai).toMatch(/row-click` → `\{data,index,element\}`/);
    expect(ai).toMatch(/row-select` → `\{selected,data,index,element\}`/);
  });

  it('documents source-compatible format fields that current cells ignore', () => {
    expect(human).toMatch(/image `shape` \(use `variant`\)/);
    expect(ai).toMatch(/image `shape` \(use `variant`\)/);
    for (const doc of [human, ai]) {
      expect(doc).toMatch(/showBaseline[^\n]*(?:no baseline|no rendered baseline|draws no baseline|Ignored|bounded)/i);
      expect(doc).toMatch(/(?:specialized-cell `style`\/`conditionalFormats`|specialized cells ignore both)/i);
      expect(doc).toMatch(/generic[^\n]*percent[^\n]*(?:ratio|already-percent)/i);
    }
  });

  it('documents every direct standalone cell property and real attribute name', () => {
    const cellProperties = [
      'multiline', 'maxLines', 'decimals', 'thousandsSeparator', 'prefix', 'suffix',
      'negativeStyle', 'highlight', 'currency', 'currencyDisplay', 'locale', 'dateFormat',
      'customFormat', 'relativeTime', 'showTime', 'trueValue', 'falseValue', 'useSymbols',
      'trueSymbol', 'falseSymbol', 'showTrend', 'trendValue', 'colorize', 'chartType',
      'color', 'width', 'height', 'showDots', 'showBaseline', 'strokeWidth', 'minValue',
      'maxValue', 'data', 'tags', 'variant', 'status', 'label', 'showDot', 'actions',
      'href', 'target', 'external', 'icon', 'text', 'email', 'displayText', 'showIcon',
      'phone', 'format', 'country', 'showSwatch', 'showHex', 'showRgb', 'swatchSize',
      'src', 'alt', 'fallback', 'lazy', 'imageError', 'address', 'latitude', 'longitude',
      'showMapLink', 'mapProvider', 'collapsed', 'maxDepth', 'showToggle',
    ];
    const humanCells = human.split('### Standalone Cell Properties')[1]?.split('\n## Methods')[0] ?? '';
    for (const [name, doc] of [['human', humanCells], ['AI', ai]] as const) {
      const missing = cellProperties.filter((property) => !doc.includes(property));
      expect(missing, `${name} standalone cell properties`).toEqual([]);
      for (const attribute of [
        'currencydisplay', 'showtrend', 'trendvalue', 'showdot', 'displaytext',
        'showicon', 'showswatch', 'showhex', 'showrgb', 'swatchsize', 'imageerror',
        'showmaplink', 'mapprovider', 'maxdepth', 'showtoggle',
      ]) {
        expect(doc).toContain(attribute);
      }
    }
  });

  it('uses working cell configuration instead of inert showcase attributes', () => {
    for (const showcase of [stories, fullShowcase]) {
      for (const inert of ['show-percentage', 'show-map-link', 'show-dot', 'show-swatch']) {
        expect(showcase).not.toContain(`'${inert}'`);
      }
      expect(showcase).not.toMatch(/label: 'Rating', attrs: \{ value: '4\.5', max:/);
      expect(showcase).toMatch(/progressFormat: \{ showPercentage: true \}/);
      expect(showcase).toMatch(/props: \{ showMapLink: false \}/);
    }
  });

  it('keeps the AI reference within the project guide limit', () => {
    expect(ai.trimEnd().split('\n').length).toBeLessThanOrEqual(150);
  });

  it('keeps the public format catalog synchronized with the 24-format showcase', () => {
    expect(publicShowcase).toContain('24 built-in');
    for (const format of ['accounting', 'scientific', 'fraction', 'JSON']) {
      expect(publicShowcase).toContain(format);
    }
  });

  it('keeps Storybook on the same 24-format catalog with a real currency cell', () => {
    const cellCatalog = stories.split('const cells: CellCard[] = [')[1]?.split('\n    ];')[0] ?? '';
    expect(cellCatalog.match(/\btag:/g)).toHaveLength(24);
    expect(cellCatalog).toMatch(/tag: 'snice-cell-currency', label: 'Currency'/);
  });

  it('uses the generated .html showcase path outside development', () => {
    expect(showcaseFooter).toContain("'showcase/' + name + '.html?v='");
  });

  it('does not repeat the obsolete declarative Table CDN warning', () => {
    expect(standards).not.toContain("Table CDN build doesn't include snice-column/snice-row");
    expect(standards).toMatch(/Table CDN[^\n]*snice-column[^\n]*snice-row/i);
  });
});
