/**
 * Snice Syntax Highlighter
 * Lightweight TypeScript highlighter with template literal + snice syntax support.
 * Uses the same CSS classes as styles.css: .c .k .s .d .t .f .h .v .p .i .a
 *
 * Usage: <pre><code>your code here</code></pre>
 * Or:    <pre><code data-lang="shell">shell commands</code></pre>
 *
 * Automatically highlights on DOMContentLoaded.
 * Handles: decorators, html`...`/css`...` tagged templates, <if>/<case>/<when>,
 * .prop/@event/?bool attribute binding, ${...} interpolation, TypeScript types.
 */
(function () {
  'use strict';

  var KEYWORDS = new Set([
    'import','export','from','class','extends','const','let','var','return',
    'if','else','async','await','yield','true','false','null','undefined',
    'new','typeof','instanceof','function','default','for','of','in',
    'while','do','switch','case','break','continue','throw','try','catch',
    'finally','type','interface','enum','void','static','private','public',
    'protected','abstract','implements','as','is','super','delete','with',
    'readonly','keyof','never','any','unknown'
  ]);

  var TYPE_KEYWORDS = new Set([
    'string','number','boolean','object','symbol','bigint','void','never',
    'any','unknown','undefined','null'
  ]);

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function w(cls, text) {
    return '<span class="' + cls + '">' + text + '</span>';
  }

  // ── Main TypeScript highlighter ──────────────────────────────────

  function highlightTS(code) {
    var out = '', i = 0, len = code.length;

    while (i < len) {
      // Line comment
      if (code[i] === '/' && code[i + 1] === '/') {
        var end = code.indexOf('\n', i);
        if (end === -1) end = len;
        out += w('c', esc(code.slice(i, end)));
        i = end;
        continue;
      }

      // Block comment
      if (code[i] === '/' && code[i + 1] === '*') {
        var end = code.indexOf('*/', i + 2);
        if (end === -1) end = len; else end += 2;
        out += w('c', esc(code.slice(i, end)));
        i = end;
        continue;
      }

      // Single/double quoted strings
      if (code[i] === "'" || code[i] === '"') {
        var q = code[i], j = i + 1;
        while (j < len && code[j] !== q) { if (code[j] === '\\') j++; j++; }
        j++;
        out += w('s', esc(code.slice(i, Math.min(j, len))));
        i = Math.min(j, len);
        continue;
      }

      // Tagged template: html`...`
      if (code.slice(i, i + 5) === 'html`') {
        out += w('f', 'html');
        i += 4;
        var res = parseTemplate(code, i);
        out += w('s', '`') + renderHTMLTemplate(res.parts) + w('s', '`');
        i = res.end;
        continue;
      }

      // Tagged template: css`...`
      if (code.slice(i, i + 4) === 'css`') {
        out += w('f', 'css');
        i += 3;
        var res = parseTemplate(code, i);
        out += w('s', '`') + renderCSSTemplate(res.parts) + w('s', '`');
        i = res.end;
        continue;
      }

      // Plain template literal
      if (code[i] === '`') {
        var res = parseTemplate(code, i);
        out += w('s', '`');
        for (var p = 0; p < res.parts.length; p++) {
          var part = res.parts[p];
          if (part.type === 'text') {
            out += w('s', esc(part.value));
          } else {
            out += w('i', '${') + highlightTS(part.value) + w('i', '}');
          }
        }
        out += w('s', '`');
        i = res.end;
        continue;
      }

      // Decorator
      if (code[i] === '@') {
        var m = code.slice(i).match(/^@[a-zA-Z_]\w*/);
        if (m) {
          out += w('d', esc(m[0]));
          i += m[0].length;
          continue;
        }
      }

      // Identifier / keyword
      if (/[a-zA-Z_$]/.test(code[i])) {
        var m = code.slice(i).match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
        if (m) {
          var word = m[0];
          var after = code[i + word.length];
          // Check context: previous non-whitespace char
          var prevChar = '';
          for (var k = i - 1; k >= 0; k--) {
            if (code[k] !== ' ' && code[k] !== '\t') { prevChar = code[k]; break; }
          }

          if (KEYWORDS.has(word)) {
            out += w('k', word);
          } else if (word === 'this') {
            out += w('v', word);
          } else if (TYPE_KEYWORDS.has(word) && (prevChar === ':' || prevChar === '<' || prevChar === '|' || prevChar === '&')) {
            out += w('t', word);
          } else if (/^[A-Z]/.test(word)) {
            out += w('t', word);
          } else if (after === '(') {
            out += w('f', word);
          } else {
            out += esc(word);
          }
          i += word.length;
          continue;
        }
      }

      // Numbers
      if (/[0-9]/.test(code[i])) {
        var m = code.slice(i).match(/^[0-9]+(\.[0-9]+)?/);
        if (m) {
          out += w('a', esc(m[0]));
          i += m[0].length;
          continue;
        }
      }

      // Arrow =>
      if (code[i] === '=' && code[i + 1] === '>') {
        out += w('k', '=&gt;');
        i += 2;
        continue;
      }

      // Everything else
      out += esc(code[i]);
      i++;
    }

    return out;
  }

  // ── Template literal parser ──────────────────────────────────────

  function parseTemplate(code, i) {
    var parts = [];
    i++; // skip opening `
    var current = '';
    var len = code.length;

    while (i < len) {
      if (code[i] === '\\') {
        current += code[i] + (i + 1 < len ? code[i + 1] : '');
        i += 2;
        continue;
      }
      if (code[i] === '`') {
        if (current) parts.push({ type: 'text', value: current });
        i++;
        return { parts: parts, end: i };
      }
      if (code[i] === '$' && code[i + 1] === '{') {
        if (current) parts.push({ type: 'text', value: current });
        current = '';
        i += 2;
        var depth = 1, expr = '';
        while (i < len && depth > 0) {
          if (code[i] === '{') depth++;
          else if (code[i] === '}') { depth--; if (depth === 0) break; }
          if ((code[i] === "'" || code[i] === '"') && depth > 0) {
            var q = code[i], j = i + 1;
            while (j < len && code[j] !== q) { if (code[j] === '\\') j++; j++; }
            j++;
            expr += code.slice(i, Math.min(j, len));
            i = Math.min(j, len);
            continue;
          }
          if (code[i] === '`' && depth > 0) {
            var sub = parseTemplate(code, i);
            expr += code.slice(i, sub.end);
            i = sub.end;
            continue;
          }
          expr += code[i];
          i++;
        }
        i++; // skip closing }
        parts.push({ type: 'interpolation', value: expr });
        continue;
      }
      current += code[i];
      i++;
    }

    if (current) parts.push({ type: 'text', value: current });
    return { parts: parts, end: i };
  }

  // ── HTML template rendering ──────────────────────────────────────

  function renderHTMLTemplate(parts) {
    var out = '';
    for (var p = 0; p < parts.length; p++) {
      var part = parts[p];
      if (part.type === 'interpolation') {
        out += w('i', '${') + highlightTS(part.value) + w('i', '}');
      } else {
        out += highlightHTML(part.value);
      }
    }
    return out;
  }

  function highlightHTML(text) {
    var out = '', i = 0, len = text.length;

    while (i < len) {
      if (text[i] === '<') {
        // Opening or closing tag
        var m = text.slice(i).match(/^<(\/?)([a-zA-Z][\w-]*)/);
        if (m) {
          out += w('h', esc(m[0]));
          i += m[0].length;

          // Parse attributes until >
          while (i < len && text[i] !== '>') {
            if (/\s/.test(text[i])) {
              out += text[i];
              i++;
              continue;
            }
            // Self-closing slash
            if (text[i] === '/') {
              out += w('h', '/');
              i++;
              continue;
            }
            // Attributes: .prop, @event:modifier, ?bool, key, class, etc.
            var attrM = text.slice(i).match(/^([.@?]?[a-zA-Z_][\w:+.-]*)/);
            if (attrM) {
              out += w('a', esc(attrM[0]));
              i += attrM[0].length;
              if (text[i] === '=') {
                out += '=';
                i++;
                if (text[i] === '"' || text[i] === "'") {
                  var q = text[i], j = i + 1;
                  while (j < len && text[j] !== q) { if (text[j] === '\\') j++; j++; }
                  j++;
                  out += w('s', esc(text.slice(i, Math.min(j, len))));
                  i = Math.min(j, len);
                }
                // No quote — value continues to next space or >
                // This handles cases without quotes (rare in templates)
              }
              continue;
            }
            out += esc(text[i]);
            i++;
          }
          if (i < len && text[i] === '>') {
            out += w('h', '&gt;');
            i++;
          }
          continue;
        }
      }

      // HTML entities
      if (text[i] === '&') {
        var m = text.slice(i).match(/^&[#a-zA-Z0-9]+;/);
        if (m) {
          out += esc(m[0]);
          i += m[0].length;
          continue;
        }
      }

      out += esc(text[i]);
      i++;
    }

    return out;
  }

  // ── CSS template rendering ───────────────────────────────────────

  function renderCSSTemplate(parts) {
    var out = '';
    for (var p = 0; p < parts.length; p++) {
      var part = parts[p];
      if (part.type === 'interpolation') {
        out += w('i', '${') + highlightTS(part.value) + w('i', '}');
      } else {
        out += highlightCSS(part.value);
      }
    }
    return out;
  }

  function highlightCSS(text) {
    var out = '', i = 0, len = text.length;
    var inBlock = false;

    while (i < len) {
      // CSS comment
      if (text[i] === '/' && text[i + 1] === '*') {
        var end = text.indexOf('*/', i + 2);
        if (end === -1) end = len; else end += 2;
        out += w('c', esc(text.slice(i, end)));
        i = end;
        continue;
      }

      // Track { } for context
      if (text[i] === '{') {
        inBlock = true;
        out += text[i];
        i++;
        continue;
      }
      if (text[i] === '}') {
        inBlock = false;
        out += text[i];
        i++;
        continue;
      }

      if (!inBlock) {
        // Selector context
        // :host, ::slotted, etc.
        var m = text.slice(i).match(/^(:host|::?[\w-]+)/);
        if (m) {
          out += w('d', esc(m[0]));
          i += m[0].length;
          continue;
        }
        // Class/element selectors
        m = text.slice(i).match(/^[.#]?[a-zA-Z_][\w-]*/);
        if (m) {
          out += w('h', esc(m[0]));
          i += m[0].length;
          continue;
        }
        // Attribute selectors [done]
        if (text[i] === '[') {
          var end = text.indexOf(']', i);
          if (end !== -1) {
            out += w('a', esc(text.slice(i, end + 1)));
            i = end + 1;
            continue;
          }
        }
      } else {
        // Inside declaration block
        // Property name
        var m = text.slice(i).match(/^([a-z][\w-]*)\s*:/);
        if (m) {
          out += w('a', esc(m[1])) + ':';
          i += m[0].length;

          // Value until ; or }
          var valStart = i;
          while (i < len && text[i] !== ';' && text[i] !== '}') i++;
          var val = text.slice(valStart, i).trim();
          if (val) {
            out += ' ' + w('s', esc(val));
          }
          if (text[i] === ';') { out += ';'; i++; }
          continue;
        }
      }

      out += esc(text[i]);
      i++;
    }

    return out;
  }

  // ── Shell highlighter ────────────────────────────────────────────

  function highlightShell(code) {
    var lines = code.split('\n');
    var out = [];
    for (var l = 0; l < lines.length; l++) {
      var line = lines[l];
      var trimmed = line.trimStart();
      if (trimmed.startsWith('#')) {
        out.push(w('c', esc(line)));
      } else {
        // Highlight flags and strings
        var highlighted = esc(line)
          .replace(/(--?[\w-]+)/g, function (m) { return w('a', m); })
          .replace(/'([^']*)'/g, function (_, s) { return w('s', "'" + s + "'"); })
          .replace(/"([^"]*)"/g, function (_, s) { return w('s', '"' + s + '"'); });
        out.push(highlighted);
      }
    }
    return out.join('\n');
  }

  // ── Runner ───────────────────────────────────────────────────────

  function run() {
    var blocks = document.querySelectorAll('pre > code');
    for (var b = 0; b < blocks.length; b++) {
      var block = blocks[b];
      // Skip Prism-highlighted blocks
      if (block.className && /language-/.test(block.className)) continue;
      // Skip already-highlighted blocks (with manual spans)
      if (block.querySelector('span') && !block.hasAttribute('data-highlight')) continue;

      var lang = block.getAttribute('data-lang') || 'ts';
      var text = block.textContent;

      if (lang === 'shell' || lang === 'sh' || lang === 'bash') {
        block.innerHTML = highlightShell(text);
      } else {
        block.innerHTML = highlightTS(text);
      }
    }
  }

  // Export for manual use
  window.SniceHighlight = {
    ts: highlightTS,
    shell: highlightShell,
    run: run
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
