/**
 * Built-in syntax highlighter for common languages
 * Simple regex-based highlighter - no external dependencies
 */

// Use placeholder tokens to avoid regex conflicts
const MARKERS = {
  start: '\x00SPAN_START\x00',
  end: '\x00SPAN_END\x00',
  quote: '\x00QUOTE\x00'
};

function wrapToken(text: string, tokenClass: string): string {
  return `${MARKERS.start}${tokenClass}${MARKERS.quote}${text}${MARKERS.end}`;
}

function finalizeSyntax(code: string): string {
  return code
    .replace(new RegExp(MARKERS.start, 'g'), '<span class="token ')
    .replace(new RegExp(MARKERS.quote, 'g'), '">')
    .replace(new RegExp(MARKERS.end, 'g'), '</span>');
}

export function highlightCode(code: string, language: string): string {
  let highlighted: string;

  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
      highlighted = highlightJavaScript(code);
      break;

    case 'html':
    case 'xml':
      highlighted = highlightHTML(code);
      break;

    case 'css':
      highlighted = highlightCSS(code);
      break;

    case 'json':
      highlighted = highlightJSON(code);
      break;

    case 'python':
    case 'py':
      highlighted = highlightPython(code);
      break;

    case 'bash':
    case 'sh':
    case 'shell':
      highlighted = highlightBash(code);
      break;

    default:
      return code;
  }

  return finalizeSyntax(highlighted);
}

function highlightJavaScript(code: string): string {
  return code
    // Strings
    .replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, (match) => wrapToken(match, 'string'))
    // Comments
    .replace(/(\/\/.*$)/gm, (match) => wrapToken(match, 'comment'))
    .replace(/(\/\*[\s\S]*?\*\/)/g, (match) => wrapToken(match, 'comment'))
    // Keywords
    .replace(/\b(async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|of|return|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/g, (match) => wrapToken(match, 'keyword'))
    // Built-in objects
    .replace(/\b(Array|Boolean|Date|Error|Function|JSON|Math|Number|Object|Promise|Proxy|RegExp|String|Symbol|Map|Set|WeakMap|WeakSet|console|document|window)\b/g, (match) => wrapToken(match, 'builtin'))
    // Boolean/null/undefined
    .replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g, (match) => wrapToken(match, 'constant'))
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, (match) => wrapToken(match, 'number'));
}

function highlightHTML(code: string): string {
  return code
    // Comments first
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, (match) => wrapToken(match, 'comment'))
    // Tag names
    .replace(/(&lt;\/?)([\w-]+)/g, (match, bracket, tagName) => bracket + wrapToken(tagName, 'tag'))
    // Attribute names
    .replace(/\s([\w-]+)=/g, (match, attrName) => ' ' + wrapToken(attrName, 'attr-name') + '=')
    // Attribute values
    .replace(/=(&quot;|")([^"&]*)(&quot;|")/g, (match, q1, value, q2) => '=' + q1 + wrapToken(value, 'attr-value') + q2);
}

function highlightCSS(code: string): string {
  return code
    // Comments
    .replace(/(\/\*[\s\S]*?\*\/)/g, (match) => wrapToken(match, 'comment'))
    // Properties
    .replace(/([\w-]+)(?=\s*:)/g, (match) => wrapToken(match, 'property'))
    // Important
    .replace(/!important/g, (match) => wrapToken(match, 'important'))
    // Numbers
    .replace(/\b(\d+\.?\d*)(px|em|rem|%|vh|vw|s|ms)?\b/g, (match) => wrapToken(match, 'number'));
}

function highlightJSON(code: string): string {
  return code
    // Keys
    .replace(/"([\w-]+)"(?=\s*:)/g, (match, key) => '"' + wrapToken(key, 'property') + '"')
    // String values
    .replace(/:\s*"([^"]*)"/g, (match, value) => ': "' + wrapToken(value, 'string') + '"')
    // Numbers
    .replace(/:\s*(\d+\.?\d*)/g, (match, num) => ': ' + wrapToken(num, 'number'))
    // Booleans/null
    .replace(/\b(true|false|null)\b/g, (match) => wrapToken(match, 'constant'));
}

function highlightPython(code: string): string {
  return code
    // Strings (protect from other replacements)
    .replace(/("""[\s\S]*?"""|\'\'\'[\s\S]*?\'\'\')/g, (match) => wrapToken(match, 'string'))
    .replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => wrapToken(match, 'string'))
    // Comments
    .replace(/(#.*$)/gm, (match) => wrapToken(match, 'comment'))
    // Decorators
    .replace(/@[\w.]+/g, (match) => wrapToken(match, 'tag'))
    // Keywords
    .replace(/\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/g, (match) => wrapToken(match, 'keyword'))
    // Built-ins
    .replace(/\b(abs|all|any|ascii|bin|bool|bytearray|bytes|callable|chr|classmethod|compile|complex|delattr|dict|dir|divmod|enumerate|eval|exec|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|memoryview|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip)\b/g, (match) => wrapToken(match, 'builtin'))
    // Boolean/None
    .replace(/\b(True|False|None)\b/g, (match) => wrapToken(match, 'constant'))
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, (match) => wrapToken(match, 'number'));
}

function highlightBash(code: string): string {
  return code
    // Strings
    .replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => wrapToken(match, 'string'))
    // Comments
    .replace(/(#.*$)/gm, (match) => wrapToken(match, 'comment'))
    // Variables
    .replace(/\$\{?[\w]+\}?/g, (match) => wrapToken(match, 'attr-name'))
    // Keywords
    .replace(/\b(if|then|else|elif|fi|case|esac|for|select|while|until|do|done|in|function|time)\b/g, (match) => wrapToken(match, 'keyword'))
    // Commands
    .replace(/\b(echo|cd|ls|mkdir|rm|cp|mv|cat|grep|sed|awk|find|chmod|chown|sudo|export|source)\b/g, (match) => wrapToken(match, 'builtin'))
    // Numbers
    .replace(/\b(\d+)\b/g, (match) => wrapToken(match, 'number'));
}
