/**
 * Built-in syntax highlighter for common languages
 * Tokenizer-based approach - no external dependencies
 */

interface Token {
  text: string;
  type: string | null; // null = plain text
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tokensToHtml(tokens: Token[]): string {
  return tokens.map(t => {
    const escaped = escapeHtml(t.text);
    return t.type ? `<span class="token ${t.type}">${escaped}</span>` : escaped;
  }).join('');
}

/**
 * Tokenize code by applying regex rules in priority order.
 * Each rule consumes matched text; unmatched text becomes plain tokens.
 */
function tokenize(code: string, rules: Array<{ pattern: RegExp; type: string }>): Token[] {
  // Build a combined pattern with named groups
  const combined = rules.map((r, i) => `(?<g${i}>${r.pattern.source})`).join('|');
  const flags = new Set<string>();
  for (const r of rules) {
    for (const f of r.pattern.flags) flags.add(f);
  }
  flags.add('g'); // Always global
  const regex = new RegExp(combined, [...flags].join(''));

  const tokens: Token[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(code)) !== null) {
    // Add plain text before this match
    if (match.index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, match.index), type: null });
    }

    // Find which group matched
    let type = '';
    if (match.groups) {
      for (let i = 0; i < rules.length; i++) {
        if (match.groups[`g${i}`] !== undefined) {
          type = rules[i].type;
          break;
        }
      }
    }

    tokens.push({ text: match[0], type });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), type: null });
  }

  return tokens;
}

export function highlightCode(code: string, language: string): string {
  let tokens: Token[];

  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
      tokens = tokenizeJavaScript(code);
      break;

    case 'html':
    case 'xml':
      tokens = tokenizeHTML(code);
      break;

    case 'css':
      tokens = tokenizeCSS(code);
      break;

    case 'json':
      tokens = tokenizeJSON(code);
      break;

    case 'python':
    case 'py':
      tokens = tokenizePython(code);
      break;

    case 'bash':
    case 'sh':
    case 'shell':
      tokens = tokenizeBash(code);
      break;

    default:
      return escapeHtml(code);
  }

  return tokensToHtml(tokens);
}

function tokenizeJavaScript(code: string): Token[] {
  return tokenize(code, [
    // Multi-line comments
    { pattern: /\/\*[\s\S]*?\*\//, type: 'comment' },
    // Single-line comments
    { pattern: /\/\/.*$/, type: 'comment' },
    // Template literals (simplified)
    { pattern: /`(?:[^`\\]|\\.)*`/, type: 'string' },
    // Strings
    { pattern: /"(?:[^"\\]|\\.)*"/, type: 'string' },
    { pattern: /'(?:[^'\\]|\\.)*'/, type: 'string' },
    // Decorators
    { pattern: /@[\w]+/, type: 'tag' },
    // Keywords (JS + TS)
    { pattern: /\b(?:abstract|as|async|await|break|case|catch|class|const|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|if|implements|import|in|instanceof|interface|is|keyof|let|module|namespace|new|of|override|private|protected|public|readonly|return|satisfies|static|super|switch|this|throw|try|type|typeof|var|void|while|with|yield)\b/, type: 'keyword' },
    // Constants
    { pattern: /\b(?:true|false|null|undefined|NaN|Infinity)\b/, type: 'constant' },
    // Numbers
    { pattern: /\b\d+\.?\d*(?:e[+-]?\d+)?\b/, type: 'number' },
    // Class names (capitalized)
    { pattern: /\b[A-Z][\w]*\b/, type: 'class-name' },
    // Function calls
    { pattern: /\b[\w]+(?=\s*\()/, type: 'function' },
  ]);
}

function tokenizeHTML(code: string): Token[] {
  return tokenize(code, [
    // Comments
    { pattern: /<!--[\s\S]*?-->/, type: 'comment' },
    // Tags (opening/closing)
    { pattern: /<\/?[\w-]+/, type: 'tag' },
    // Closing bracket
    { pattern: /\/?>/, type: 'tag' },
    // Attribute values
    { pattern: /"[^"]*"/, type: 'attr-value' },
    { pattern: /'[^']*'/, type: 'attr-value' },
    // Attribute names
    { pattern: /[\w-]+(?=\s*=)/, type: 'attr-name' },
  ]);
}

function tokenizeCSS(code: string): Token[] {
  return tokenize(code, [
    // Comments
    { pattern: /\/\*[\s\S]*?\*\//, type: 'comment' },
    // Strings
    { pattern: /"(?:[^"\\]|\\.)*"/, type: 'string' },
    { pattern: /'(?:[^'\\]|\\.)*'/, type: 'string' },
    // !important
    { pattern: /!important/, type: 'important' },
    // Numbers with units
    { pattern: /\b\d+\.?\d*(?:px|em|rem|%|vh|vw|s|ms|deg|fr)?\b/, type: 'number' },
    // Properties (before colon)
    { pattern: /[\w-]+(?=\s*:)/, type: 'property' },
    // Selectors-like (at-rules)
    { pattern: /@[\w-]+/, type: 'keyword' },
  ]);
}

function tokenizeJSON(code: string): Token[] {
  return tokenize(code, [
    // Keys
    { pattern: /"[\w-]+"(?=\s*:)/, type: 'property' },
    // String values
    { pattern: /"(?:[^"\\]|\\.)*"/, type: 'string' },
    // Numbers
    { pattern: /-?\b\d+\.?\d*(?:e[+-]?\d+)?\b/, type: 'number' },
    // Constants
    { pattern: /\b(?:true|false|null)\b/, type: 'constant' },
  ]);
}

function tokenizePython(code: string): Token[] {
  return tokenize(code, [
    // Triple-quoted strings
    { pattern: /"""[\s\S]*?"""/, type: 'string' },
    { pattern: /'''[\s\S]*?'''/, type: 'string' },
    // Comments
    { pattern: /#.*$/, type: 'comment' },
    // Strings
    { pattern: /"(?:[^"\\]|\\.)*"/, type: 'string' },
    { pattern: /'(?:[^'\\]|\\.)*'/, type: 'string' },
    // Decorators
    { pattern: /@[\w.]+/, type: 'tag' },
    // Keywords
    { pattern: /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/, type: 'keyword' },
    // Constants
    { pattern: /\b(?:True|False|None)\b/, type: 'constant' },
    // Built-ins
    { pattern: /\b(?:abs|all|any|bin|bool|bytes|callable|chr|dict|dir|divmod|enumerate|eval|exec|filter|float|format|getattr|globals|hasattr|hash|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip)\b/, type: 'builtin' },
    // Numbers
    { pattern: /\b\d+\.?\d*\b/, type: 'number' },
    // Class names
    { pattern: /\b[A-Z][\w]*\b/, type: 'class-name' },
    // Function calls
    { pattern: /\b[\w]+(?=\s*\()/, type: 'function' },
  ]);
}

function tokenizeBash(code: string): Token[] {
  return tokenize(code, [
    // Comments
    { pattern: /#.*$/, type: 'comment' },
    // Strings
    { pattern: /"(?:[^"\\]|\\.)*"/, type: 'string' },
    { pattern: /'[^']*'/, type: 'string' },
    // Variables
    { pattern: /\$\{?[\w]+\}?/, type: 'attr-name' },
    // Keywords
    { pattern: /\b(?:if|then|else|elif|fi|case|esac|for|select|while|until|do|done|in|function|time)\b/, type: 'keyword' },
    // Commands
    { pattern: /\b(?:echo|cd|ls|mkdir|rm|cp|mv|cat|grep|sed|awk|find|chmod|chown|sudo|export|source|npm|npx|node|git|docker|curl|wget)\b/, type: 'builtin' },
    // Numbers
    { pattern: /\b\d+\b/, type: 'number' },
  ]);
}
