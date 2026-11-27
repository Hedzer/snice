import { parse, type ParserPlugin } from '@babel/parser';

export type AstNode = Record<string, any>;

/**
 * Shared `@babel/parser` invocation supporting all modern TypeScript & ECMAScript
 * features used across Snice apps and libraries (`decorators`, `decoratorAutoAccessors`,
 * `explicitResourceManagement` (`using` / `await using`), `importAttributes`,
 * `satisfies`, generic decorators, regex literals, nested template literals).
 */
export function parseModuleAst(code: string, id: string): AstNode {
  const cleanId = id.split('?')[0];
  const isTs = /\.[cm]?tsx?$/.test(cleanId);
  const isJsx = /\.[cm]?[jt]sx$/.test(cleanId);

  const plugins: ParserPlugin[] = [
    'decorators',
    'decoratorAutoAccessors',
    'explicitResourceManagement',
    'importAttributes',
  ];
  if (isTs) plugins.push('typescript');
  if (isJsx) plugins.push('jsx');

  return parse(code, {
    sourceType: 'module',
    allowReturnOutsideFunction: false,
    plugins,
  }) as AstNode;
}
