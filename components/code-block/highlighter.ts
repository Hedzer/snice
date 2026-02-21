/**
 * JSON-driven syntax highlighter with Monarch-inspired state machine.
 * Grammars are JSON-serializable objects with states, transitions, and lookup tables.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface GrammarRule {
  0: string;                                    // regex pattern
  1: string | { cases: Record<string, string> }; // token or conditional
  2?: string;                                   // optional next state
}

export interface GrammarInclude {
  include: string; // "@stateName"
}

export type GrammarEntry = GrammarRule | GrammarInclude;

export interface Grammar {
  name: string;
  fileTypes?: string[];
  defaultToken?: string;
  ignoreCase?: boolean;
  tokenizer: Record<string, GrammarEntry[]>;
  [key: string]: any; // lookup tables like "keywords", "typeKeywords", etc.
}

interface Token {
  text: string;
  type: string | null;
}

interface CompiledRule {
  regex: RegExp;
  token: string | { cases: Record<string, string> };
  nextState?: string;
}

interface CompiledGrammar {
  grammar: Grammar;
  states: Map<string, CompiledRule[]>;
}

// ── Grammar compilation ────────────────────────────────────────────────

const compiledCache = new WeakMap<Grammar, CompiledGrammar>();

function compileGrammar(grammar: Grammar): CompiledGrammar {
  const cached = compiledCache.get(grammar);
  if (cached) return cached;

  const states = new Map<string, CompiledRule[]>();
  const flags = grammar.ignoreCase ? 'yi' : 'y';

  for (const [stateName, entries] of Object.entries(grammar.tokenizer)) {
    const rules = resolveEntries(grammar, entries, new Set());
    const compiled: CompiledRule[] = rules.map(rule => ({
      regex: new RegExp(rule[0], flags),
      token: rule[1],
      nextState: rule[2],
    }));
    states.set(stateName, compiled);
  }

  const result: CompiledGrammar = { grammar, states };
  compiledCache.set(grammar, result);
  return result;
}

function resolveEntries(
  grammar: Grammar,
  entries: GrammarEntry[],
  visited: Set<string>,
): GrammarRule[] {
  const result: GrammarRule[] = [];
  for (const entry of entries) {
    if ('include' in entry) {
      const stateName = entry.include.replace(/^@/, '');
      if (visited.has(stateName)) continue;
      visited.add(stateName);
      const included = grammar.tokenizer[stateName];
      if (included) {
        result.push(...resolveEntries(grammar, included, visited));
      }
    } else {
      result.push(entry);
    }
  }
  return result;
}

// ── Tokenizer engine ───────────────────────────────────────────────────

function resolveToken(
  grammar: Grammar,
  tokenDef: string | { cases: Record<string, string> },
  matchedText: string,
): string {
  if (typeof tokenDef === 'string') return tokenDef;

  // Conditional token via cases lookup
  for (const [pattern, tokenType] of Object.entries(tokenDef.cases)) {
    if (pattern === '@default') continue;
    // @tableName — check if matchedText is in the lookup table
    if (pattern.startsWith('@')) {
      const tableName = pattern.slice(1);
      const table = grammar[tableName];
      if (Array.isArray(table) && table.includes(matchedText)) {
        return tokenType;
      }
    } else if (pattern === matchedText) {
      return tokenType;
    }
  }

  // Fallback to @default
  if (tokenDef.cases['@default'] !== undefined) {
    return tokenDef.cases['@default'];
  }
  return '';
}

function tokenizeWithGrammar(code: string, compiled: CompiledGrammar): Token[] {
  const { grammar, states } = compiled;
  const tokens: Token[] = [];
  const stateStack: string[] = ['root'];
  let pos = 0;
  const defaultToken = grammar.defaultToken || '';

  // Safety: max iterations to prevent infinite loops on bad grammars
  const maxIterations = code.length * 10;
  let iterations = 0;

  while (pos < code.length && iterations < maxIterations) {
    iterations++;
    const currentState = stateStack[stateStack.length - 1];
    const rules = states.get(currentState);

    if (!rules) {
      // Unknown state — consume one char as default token
      tokens.push({ text: code[pos], type: defaultToken || null });
      pos++;
      continue;
    }

    let matched = false;

    for (const rule of rules) {
      rule.regex.lastIndex = pos;
      const m = rule.regex.exec(code);
      if (m && m.index === pos && m[0].length > 0) {
        const tokenType = resolveToken(grammar, rule.token, m[0]);
        tokens.push({ text: m[0], type: tokenType || null });
        pos += m[0].length;

        // State transition
        if (rule.nextState) {
          if (rule.nextState === '@pop') {
            if (stateStack.length > 1) stateStack.pop();
          } else {
            const target = rule.nextState.replace(/^@/, '');
            stateStack.push(target);
          }
        }

        matched = true;
        break;
      }
    }

    if (!matched) {
      // No rule matched — consume one char
      // Try to batch consecutive unmatched chars
      let end = pos + 1;
      while (end < code.length) {
        let anyMatch = false;
        for (const rule of rules) {
          rule.regex.lastIndex = end;
          const m = rule.regex.exec(code);
          if (m && m.index === end && m[0].length > 0) {
            anyMatch = true;
            break;
          }
        }
        if (anyMatch) break;
        end++;
        iterations++;
        if (iterations >= maxIterations) break;
      }
      tokens.push({ text: code.slice(pos, end), type: defaultToken || null });
      pos = end;
    }
  }

  return tokens;
}

// ── HTML rendering ─────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tokensToHtml(tokens: Token[]): string {
  return tokens
    .map(t => {
      const escaped = escapeHtml(t.text);
      return t.type ? `<span class="token ${t.type}">${escaped}</span>` : escaped;
    })
    .join('');
}

// ── Grammar registry ───────────────────────────────────────────────────

const customGrammars = new Map<string, Grammar>();

/**
 * Register a custom grammar.
 */
export function registerGrammar(name: string, grammar: Grammar): void {
  customGrammars.set(name.toLowerCase(), grammar);
}

/**
 * Unregister a custom grammar.
 */
export function unregisterGrammar(name: string): void {
  customGrammars.delete(name.toLowerCase());
}

/**
 * Get a grammar by language name (custom registry only).
 */
export function getGrammar(language: string): Grammar | undefined {
  return customGrammars.get(language.toLowerCase());
}

/**
 * Highlight code using a grammar (by language name or direct Grammar object).
 */
export function highlightCode(code: string, language: string | Grammar): string {
  const grammar = typeof language === 'string' ? getGrammar(language) : language;
  if (!grammar) return escapeHtml(code);

  const compiled = compileGrammar(grammar);
  const tokens = tokenizeWithGrammar(code, compiled);
  return tokensToHtml(tokens);
}

/**
 * Tokenize code and return raw tokens (for advanced use).
 */
export function tokenize(code: string, language: string | Grammar): Token[] {
  const grammar = typeof language === 'string' ? getGrammar(language) : language;
  if (!grammar) return [{ text: code, type: null }];

  const compiled = compileGrammar(grammar);
  return tokenizeWithGrammar(code, compiled);
}

export type { Token, Grammar as GrammarDefinition };
